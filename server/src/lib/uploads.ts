import path from 'path';
import fs from 'fs';
import os from 'os';

const primaryDir = path.join(__dirname, '../../uploads');

let uploadsDir: string;
try {
  if (!fs.existsSync(primaryDir)) {
    fs.mkdirSync(primaryDir, { recursive: true });
  }
  uploadsDir = primaryDir;
} catch {
  uploadsDir = path.join(os.tmpdir(), 'o2h-uploads');
  try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch {}
}

export default uploadsDir;
