const express = require('express');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const router = express.Router();

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) =>
    ALLOWED.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Only JPG, PNG, WEBP or PDF files are allowed')),
});

router.post('/', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const stream = cloudinary.uploader.upload_stream(
      { folder: 'portfolio', resource_type: 'auto' },
      (error, result) => {
        if (error || !result) {
          console.error('Cloudinary upload failed:', error && error.message);
          return res.status(502).json({ error: 'Upload failed' });
        }
        res.status(201).json({ url: result.secure_url });
      }
    );
    stream.end(req.file.buffer);
  });
});

module.exports = router;
