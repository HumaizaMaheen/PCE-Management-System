import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads/applications');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Save with unique name: fieldname + timestamp + random + original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// File filter validation
const fileFilter = (req: any, file: any, cb: multer.FileFilterCallback) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];

  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype;

  if (allowedExtensions.includes(ext) && allowedMimeTypes.includes(mimeType)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type for ${file.originalname}. Only JPG, PNG, and PDF are allowed.`));
  }
};

// Ensure receipt upload directory exists
const receiptUploadDir = path.join(__dirname, '../../uploads/receipts');
if (!fs.existsSync(receiptUploadDir)) {
  fs.mkdirSync(receiptUploadDir, { recursive: true });
}

// Receipt storage configuration
const receiptStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, receiptUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `receipt-${uniqueSuffix}${ext}`);
  }
});

// Multer upload instances
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB limit
  }
});

export const receiptUpload = multer({
  storage: receiptStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB limit
  }
});

