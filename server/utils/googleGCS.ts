import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';

let storage: Storage | null = null;

function getStorageClient(): Storage {
  if (!storage) {
    const keyFilePath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (!keyFilePath) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS environment variable not set');
    }

    storage = new Storage({
      keyFilename: keyFilePath
    });
  }
  return storage;
}

export async function uploadAudioToGCS(
  audioBuffer: Buffer,
  bucketName: string
): Promise<string> {
  try {
    const storage = getStorageClient();
    const bucket = storage.bucket(bucketName);

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const uniqueId = uuidv4();
    const filename = `audio/${timestamp}-${uniqueId}.webm`;

    const file = bucket.file(filename);

    // Upload the buffer with metadata
    await file.save(audioBuffer, {
      metadata: {
        contentType: 'audio/webm',
        cacheControl: 'public, max-age=3600',
      },
      resumable: false, // Use simple upload for small files
    });

    console.log(`✓ Audio uploaded to GCS: gs://${bucketName}/${filename}`);

    // Return GCS URI (required format for Speech-to-Text API)
    return `gs://${bucketName}/${filename}`;
  } catch (error) {
    console.error('Error uploading audio to GCS:', error);
    throw new Error(`GCS upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function deleteAudioFromGCS(
  gcsUri: string,
  bucketName: string
): Promise<void> {
  try {
    const storage = getStorageClient();
    const bucket = storage.bucket(bucketName);

    // Extract filename from gs://bucket-name/filename
    const filename = gcsUri.replace(`gs://${bucketName}/`, '');

    await bucket.file(filename).delete();
    console.log(`✓ Audio deleted from GCS: ${gcsUri}`);
  } catch (error) {
    // Don't throw error on delete failure - not critical
    console.warn('Warning: Failed to delete audio from GCS:', error);
  }
}

export async function cleanupOldAudioFiles(
  bucketName: string,
  maxAgeHours: number = 24
): Promise<void> {
  try {
    const storage = getStorageClient();
    const bucket = storage.bucket(bucketName);

    const [files] = await bucket.getFiles({ prefix: 'audio/' });
    const now = Date.now();
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;

    let deletedCount = 0;

    for (const file of files) {
      const [metadata] = await file.getMetadata();
      const createdTime = new Date(metadata.timeCreated!).getTime();

      if (now - createdTime > maxAgeMs) {
        await file.delete();
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      console.log(`✓ Cleaned up ${deletedCount} old audio files from GCS`);
    }
  } catch (error) {
    console.warn('Warning: Failed to cleanup old audio files:', error);
  }
}
