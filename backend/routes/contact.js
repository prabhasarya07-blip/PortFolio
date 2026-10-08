const express = require('express');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
const { z } = require('zod');
const pool = require('../db');

const router = express.Router();

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Too many messages. Please try again later.' },
});

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(150),
  subject: z.string().trim().max(200).optional().default(''),
  message: z.string().trim().min(10).max(2000),
  website: z.string().optional(),
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_APP_PASSWORD },
});

router.post('/', limiter, async (req, res, next) => {
  try {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid input',
        details: parsed.error.flatten().fieldErrors,
      });
    }
    const { name, email, subject, message, website } = parsed.data;

    if (website) return res.json({ ok: true });

    await pool.query(
      'INSERT INTO messages (name, email, subject, message, ip) VALUES (?, ?, ?, ?, ?)',
      [name, email, subject || null, message, req.ip]
    );

    transporter
      .sendMail({
        from: `"Portfolio" <${process.env.MAIL_USER}>`,
        to: process.env.MAIL_TO,
        replyTo: email,
        subject: `New portfolio message: ${subject || 'No subject'}`,
        text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject || '-'}\n\n${message}`,
      })
      .catch((err) => console.error('Mail error:', err.message));

    res.status(201).json({ ok: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
