import { SpeechClient, protos } from '@google-cloud/speech';
import fs from 'fs';
import { uploadAudioToGCS, deleteAudioFromGCS } from './googleGCS';

let client: SpeechClient | null = null;

function getClient(): SpeechClient {
  if (!client) {
    const keyFilePath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (!keyFilePath) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS environment variable not set');
    }

    client = new SpeechClient();
  }
  return client;
}

export async function transcribeAudio(filePath: string): Promise<string> {
  try {
    const client = getClient();

    const audioBytes = fs.readFileSync(filePath).toString('base64');

    const audio = {
      content: audioBytes
    };

    const config = {
      encoding: 'WEBM_OPUS' as const,
      sampleRateHertz: 48000,
      languageCode: 'en-US',
      enableAutomaticPunctuation: true,
      model: 'default',
      useEnhanced: true
    };

    const request = {
      audio,
      config
    };

    const [response] = await client.recognize(request);

    if (!response.results || response.results.length === 0) {
      return '';
    }

    const transcription = response.results
      .map((result: protos.google.cloud.speech.v1.ISpeechRecognitionResult) => result.alternatives?.[0]?.transcript || '')
      .join('\n')
      .trim();

    return transcription;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw new Error(`STT failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function transcribeAudioBuffer(audioBuffer: Buffer): Promise<string> {
  // ALWAYS use GCS + LongRunningRecognize for all audio (more reliable)
  const bucketName = process.env.GCS_BUCKET_NAME;

  if (!bucketName) {
    throw new Error('GCS_BUCKET_NAME environment variable not set. Please set it in .env file.');
  }

  console.log(`Using GCS + LongRunningRecognize for transcription`);
  return await transcribeAudioBufferLongRunning(audioBuffer, bucketName);
}

async function transcribeAudioBufferLongRunning(
  audioBuffer: Buffer,
  bucketName: string
): Promise<string> {
  const client = getClient();
  let gcsUri: string | null = null;

  try {
    // Step 1: Upload audio to GCS
    console.log('📤 Uploading audio to GCS...');
    gcsUri = await uploadAudioToGCS(audioBuffer, bucketName);
    console.log(`✓ Audio uploaded: ${gcsUri}`);

    // Step 2: Start long-running recognition
    console.log('🎤 Starting long-running recognition...');
    const config = {
      encoding: 'WEBM_OPUS' as const,
      sampleRateHertz: 48000,
      languageCode: 'en-US',
      enableAutomaticPunctuation: true,
      model: 'default',
      useEnhanced: true
    };

    const audio = {
      uri: gcsUri
    };

    const request = {
      config,
      audio
    };

    // Start the long-running operation
    const [operation] = await client.longRunningRecognize(request);
    console.log('⏳ Recognition operation started, waiting for completion...');

    // Wait for the operation to complete
    const [response] = await operation.promise();
    console.log('✓ Recognition completed!');

    // Step 3: Extract transcription
    if (!response.results || response.results.length === 0) {
      return '';
    }

    const transcription = response.results
      .map((result: protos.google.cloud.speech.v1.ISpeechRecognitionResult) => 
        result.alternatives?.[0]?.transcript || ''
      )
      .join('\n')
      .trim();

    // Step 4: Cleanup - delete file from GCS
    if (gcsUri) {
      await deleteAudioFromGCS(gcsUri, bucketName);
    }

    return transcription;
  } catch (error) {
    // Cleanup on error
    if (gcsUri) {
      await deleteAudioFromGCS(gcsUri, bucketName);
    }
    
    console.error('Error in long-running recognition:', error);
    throw new Error(`Long-running STT failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

