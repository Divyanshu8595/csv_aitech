import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { Request } from 'express';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIMETYPES = new Set([
  'text/csv',
  'application/vnd.ms-excel',
  'application/csv',
  'text/plain',
]);

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (ext !== '.csv') {
    cb(new Error('Only .csv files are allowed'));
    return;
  }

  if (!ALLOWED_MIMETYPES.has(file.mimetype)) {
    cb(new Error(`Unsupported MIME type: ${file.mimetype}. Only CSV files are accepted.`));
    return;
  }

  cb(null, true);
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
});

export default upload;
