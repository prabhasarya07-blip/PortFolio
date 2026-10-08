require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./db');

(async () => {
  const email = process.env.ADMIN_EMAIL;
  const pw = process.env.ADMIN_PASSWORD;
  if (!email || !pw || pw.length < 10) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (min 10 chars) in .env');
    process.exit(1);
  }
  const hash = await bcrypt.hash(pw, 12);
  await pool.query(
    'INSERT INTO admin_users (email, password_hash) VALUES (?, ?) ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)',
    [email, hash]
  );
  console.log('Admin saved:', email);
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });
