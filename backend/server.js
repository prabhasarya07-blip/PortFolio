require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { requireAuth } = require('./middleware');

const app = express();

// Set TRUST_PROXY=1 in the host's env vars when deployed behind a proxy (Render, Vercel, etc.)
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY));

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// ALLOWED_ORIGIN can hold several addresses separated by commas
const allowedOrigins = (process.env.ALLOWED_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) =>
      !origin || allowedOrigins.includes(origin) ? cb(null, true) : cb(null, false),
  })
);

app.use(express.json({ limit: '100kb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { dotfiles: 'deny', index: false }));

const limiter = (max) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later' },
  });

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api', limiter(600));
app.use('/api/admin', limiter(300));

app.use('/api', require('./routes/public'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/admin', require('./routes/auth'));
app.use('/api/admin/upload', requireAuth, require('./routes/upload'));
app.use('/api/admin', requireAuth, require('./routes/admin'));

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request too large' });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

process.on('unhandledRejection', (e) => console.error('Unhandled rejection:', e));

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`API running on http://localhost:${port}`));
