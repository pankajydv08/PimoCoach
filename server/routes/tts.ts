import express from 'express';
import { synthesizeSpeechBase64 } from '../utils/googleTTS';
import { sendErrorResponse, handleRouteError } from '../utils/errorHandler';

const router = express.Router();

router.post('/synthesize', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return sendErrorResponse(res, 400, 'Text is required');
    }

    const audioBase64 = await synthesizeSpeechBase64(text);

    res.json({
      audio: audioBase64,
      format: 'mp3'
    });
  } catch (error) {
    handleRouteError(res, error, '/synthesize');
  }
});

export default router;
