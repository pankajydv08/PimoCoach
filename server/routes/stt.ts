import express from 'express';
import multer from 'multer';
import { transcribeAudioBuffer } from '../utils/assemblyAI';
import { sendErrorResponse, handleRouteError } from '../utils/errorHandler';

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
      return sendErrorResponse(res, 400, 'Audio file is required');
    }

    console.log('🎤 Received audio for AssemblyAI transcription');
    console.log(`📊 File size: ${req.file.size} bytes, MIME type: ${req.file.mimetype}`);

    const transcript = await transcribeAudioBuffer(req.file.buffer, req.file.mimetype);

    console.log(`✅ AssemblyAI transcription successful: ${transcript.length} characters`);

    res.json({
      transcript,
      success: true
    });
  } catch (error) {
    console.error('❌ Error in AssemblyAI /transcribe:', error);
    handleRouteError(res, error, 'AssemblyAI /transcribe');
  }
});

export default router;
