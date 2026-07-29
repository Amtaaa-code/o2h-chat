import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth';

const router = Router();

let uploadsDir = path.join(__dirname, '../../uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch {
  uploadsDir = path.join(os.tmpdir(), 'o2h-uploads');
  try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch {}
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800') },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|mp4|mp3|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext || mime) cb(null, true);
    else cb(new Error('File type not allowed'));
  },
});

router.post('/', authMiddleware, (req: any, res) => {
  upload.array('files', 10)(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err.message);
      return res.status(400).json({ success: false, message: err.message || 'Upload failed' });
    }
    try {
      const files = (req.files as Express.Multer.File[]).map((file) => ({
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: `/uploads/${file.filename}`,
      }));
      res.json({ success: true, data: files });
    } catch (error) {
      console.error('Upload processing error:', error);
      res.status(500).json({ success: false, message: 'Upload failed' });
    }
  });
});

export default router;
