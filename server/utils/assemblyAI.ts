import { AssemblyAI } from 'assemblyai';

// Initialize AssemblyAI client
const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY!,
});

/**
 * Transcribe audio buffer using AssemblyAI
 * @param audioBuffer - Audio data as Buffer
 * @param mimeType - Audio MIME type (e.g., 'audio/webm', 'audio/wav')
 * @returns Promise<string> - Transcribed text
 */
export async function transcribeAudioBuffer(
  audioBuffer: Buffer,
  mimeType: string = 'audio/webm'
): Promise<string> {
  try {
    console.log('🎤 Starting AssemblyAI transcription...');
    console.log(`📊 Audio buffer size: ${audioBuffer.length} bytes`);
    console.log(`🎵 Audio MIME type: ${mimeType}`);

    // Upload audio buffer to AssemblyAI
    const uploadUrl = await client.files.upload(audioBuffer);
    console.log('📤 Audio uploaded to AssemblyAI:', uploadUrl);

    // Transcribe with enhanced settings for interview speech
    const params = {
      audio: uploadUrl,
      speech_model: 'universal' as const, // Best general-purpose model
      language_detection: true,   // Auto-detect language
      punctuate: true,           // Add punctuation
      format_text: true,         // Format text properly
      disfluencies: false,       // Remove filler words like "um", "uh"
      filter_profanity: false,   // Keep original speech
      dual_channel: false,       // Single channel audio
    };

    console.log('⏳ Starting transcription with params:', {
      speech_model: params.speech_model,
      language_detection: params.language_detection,
      punctuate: params.punctuate,
      format_text: params.format_text
    });

    const transcript = await client.transcripts.transcribe(params);

    if (transcript.status === 'error') {
      console.error('❌ AssemblyAI transcription error:', transcript.error);
      throw new Error(`AssemblyAI transcription failed: ${transcript.error}`);
    }

    if (!transcript.text) {
      console.log('⚠️ No speech detected in audio');
      return '';
    }

    console.log('✅ AssemblyAI transcription completed successfully');
    console.log(`📝 Transcribed text length: ${transcript.text.length} characters`);
    console.log(`🎯 Confidence: ${transcript.confidence ? (transcript.confidence * 100).toFixed(1) + '%' : 'N/A'}`);
    
    return transcript.text;

  } catch (error) {
    console.error('❌ Error in AssemblyAI transcription:', error);
    throw new Error(`AssemblyAI transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check AssemblyAI service health
 * @returns Promise<boolean> - True if service is available
 */
export async function checkAssemblyAIHealth(): Promise<boolean> {
  try {
    // Test with a minimal request to check API connectivity
    const testParams = {
      audio: 'https://assembly.ai/wildfires.mp3', // AssemblyAI's test audio
      speech_model: 'universal' as const
    };
    
    const result = await client.transcripts.transcribe(testParams);
    return result.status !== 'error';
  } catch (error) {
    console.error('AssemblyAI health check failed:', error);
    return false;
  }
}

/**
 * Get AssemblyAI service info
 */
export function getAssemblyAIInfo() {
  return {
    service: 'AssemblyAI',
    model: 'Universal Speech Model',
    features: [
      'High accuracy speech recognition',
      'Automatic punctuation',
      'Language detection',
      'Disfluency removal',
      'Professional formatting'
    ],
    apiKeyConfigured: !!process.env.ASSEMBLYAI_API_KEY
  };
}