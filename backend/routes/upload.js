const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const router = express.Router();

const dir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(dir, { recursive: true });

const ALLOWED = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, dir),
  filename: (req, file, cb) =>
    cb(null, crypto.randomBytes(16).toString('hex') + ALLOWED[file.mimetype]),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) =>
    ALLOWED[file.mimetype]
      ? cb(null, true)
      : cb(new Error('Only JPG, PNG, WEBP or PDF files are allowed')),
});

router.post('/', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.status(201).json({ url: `/uploads/${req.file.filename}` });
  });
});

module.exports = router;
