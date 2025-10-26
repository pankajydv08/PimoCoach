import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { authMiddleware } from './middleware/auth';
import sessionRoutes from './routes/session';
import questionRoutes from './routes/question';
import ttsRoutes from './routes/tts';
import sttRoutes from './routes/stt';
import evaluateRoutes from './routes/evaluate';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Public routes (no auth required)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      supabase: !!process.env.VITE_SUPABASE_URL,
      github_models: !!process.env.GITHUB_TOKEN,
      assemblyai: !!process.env.ASSEMBLYAI_API_KEY,
      google_cloud_tts: !!process.env.GOOGLE_APPLICATION_CREDENTIALS
    }
  });
});

// Protected routes (auth required)
app.use('/api/session', authMiddleware, sessionRoutes);
app.use('/api/question', authMiddleware, questionRoutes);
app.use('/api/tts', authMiddleware, ttsRoutes);
app.use('/api/stt', authMiddleware, sttRoutes);
app.use('/api/evaluate', authMiddleware, evaluateRoutes);

app.listen(PORT, () => {
  console.log(`🎙️  AI Interview Coach API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Authentication: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Enabled (verified)' : 'Development mode (unverified)'}`);
  console.log(`🎤 Speech-to-Text: AssemblyAI ${process.env.ASSEMBLYAI_API_KEY ? '(configured)' : '(missing API key)'}`);
  console.log(`🔊 Text-to-Speech: Google Cloud ${process.env.GOOGLE_APPLICATION_CREDENTIALS ? '(configured)' : '(missing credentials)'}`);
});

export default app;
