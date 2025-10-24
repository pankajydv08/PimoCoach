import express from 'express';
import multer from 'multer';
import { transcribeAudioBuffer } from '../utils/googleSTT';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    const transcript = await transcribeAudioBuffer(req.file.buffer);

    res.json({
      transcript,
      success: true
    });
  } catch (error) {
    console.error('Error in /transcribe:', error);
    res.status(500).json({
      error: 'STT service unavailable',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
