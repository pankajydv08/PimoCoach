import express from 'express';
import { synthesizeSpeechBase64 } from '../utils/googleTTS';

const router = express.Router();

router.post('/synthesize', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const audioBase64 = await synthesizeSpeechBase64(text);

    res.json({
      audio: audioBase64,
      format: 'mp3'
    });
  } catch (error) {
    console.error('Error in /synthesize:', error);
    res.status(500).json({
      error: 'TTS service unavailable',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
