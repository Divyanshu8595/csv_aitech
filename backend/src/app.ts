import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import upload from './config/multer';
import { healthCheck, handleImport } from './controllers/importController';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get('/api/health', healthCheck);

// POST /api/import — accepts either multipart file OR JSON body
// multer's .single() will only parse the file if multipart; otherwise req.file = undefined
app.post('/api/import', upload.single('file'), handleImport);

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(
  (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
    console.error('[Global Error]', err.message);

    // Handle multer-specific errors (file too large, wrong type, etc.)
    if (err.message.includes('Only .csv files') || err.message.includes('Unsupported MIME')) {
      res.status(400).json({ success: false, error: err.message });
      return;
    }

    if (err.message.includes('File too large')) {
      res.status(400).json({
        success: false,
        error: 'File exceeds the 10MB size limit',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
);

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════╗
║   🚀 CSV Importer Backend                           ║
║   Running on http://localhost:${PORT}                   ║
║   Health: http://localhost:${PORT}/api/health            ║
╚══════════════════════════════════════════════════════╝
  `);
});

export default app;
