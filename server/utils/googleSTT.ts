import speech from '@google-cloud/speech';
import fs from 'fs';

let client: speech.SpeechClient | null = null;

function getClient(): speech.SpeechClient {
  if (!client) {
    const keyFilePath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (!keyFilePath) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS environment variable not set');
    }

    client = new speech.SpeechClient();
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
      .map(result => result.alternatives?.[0]?.transcript || '')
      .join('\n')
      .trim();

    return transcription;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw new Error(`STT failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function transcribeAudioBuffer(audioBuffer: Buffer): Promise<string> {
  try {
    const client = getClient();

    const audio = {
      content: audioBuffer.toString('base64')
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
      .map(result => result.alternatives?.[0]?.transcript || '')
      .join('\n')
      .trim();

    return transcription;
  } catch (error) {
    console.error('Error transcribing audio buffer:', error);
    throw new Error(`STT failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
