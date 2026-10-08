const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const pool = require('../db');
const { requireAuth } = require('../middleware');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Try again later.' },
});

const schema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(200),
});

router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
    const { email, password } = parsed.data;

    const [rows] = await pool.query('SELECT * FROM admin_users WHERE email = ?', [email]);
    const user = rows[0];
    const ok = user && (await bcrypt.compare(password, user.password_hash));
    if (!ok) return res.status(401).json({ error: 'Wrong email or password' });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '12h',
    });
    res.json({ token });
  } catch (e) {
    next(e);
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ email: req.admin.email });
});

module.exports = router;
