import textToSpeech from '@google-cloud/text-to-speech';
import fs from 'fs';
import { promisify } from 'util';
import path from 'path';

const writeFile = promisify(fs.writeFile);

let client: textToSpeech.TextToSpeechClient | null = null;

function getClient(): textToSpeech.TextToSpeechClient {
  if (!client) {
    const keyFilePath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (!keyFilePath) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS environment variable not set');
    }

    client = new textToSpeech.TextToSpeechClient();
  }
  return client;
}

export async function synthesizeSpeech(
  text: string,
  outputPath?: string
): Promise<string> {
  try {
    const client = getClient();

    const request = {
      input: { text },
      voice: {
        languageCode: 'en-US',
        name: 'en-US-Neural2-F',
        ssmlGender: 'FEMALE' as const
      },
      audioConfig: {
        audioEncoding: 'MP3' as const,
        speakingRate: 0.95,
        pitch: 0,
        volumeGainDb: 0
      }
    };

    const [response] = await client.synthesizeSpeech(request);

    if (!response.audioContent) {
      throw new Error('No audio content received from TTS service');
    }

    const fileName = outputPath || `audio_${Date.now()}.mp3`;
    const filePath = path.join('/tmp', fileName);

    await writeFile(filePath, response.audioContent, 'binary');

    return filePath;
  } catch (error) {
    console.error('Error synthesizing speech:', error);
    throw new Error(`TTS failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function synthesizeSpeechBase64(text: string): Promise<string> {
  try {
    const client = getClient();

    const request = {
      input: { text },
      voice: {
        languageCode: 'en-US',
        name: 'en-US-Neural2-F',
        ssmlGender: 'FEMALE' as const
      },
      audioConfig: {
        audioEncoding: 'MP3' as const,
        speakingRate: 0.95,
        pitch: 0,
        volumeGainDb: 0
      }
    };

    const [response] = await client.synthesizeSpeech(request);

    if (!response.audioContent) {
      throw new Error('No audio content received from TTS service');
    }

    return Buffer.from(response.audioContent).toString('base64');
  } catch (error) {
    console.error('Error synthesizing speech to base64:', error);
    throw new Error(`TTS failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
