const express = require('express');
const pool = require('../db');

const router = express.Router();

const CLIENT_ERRORS = [
  'ER_DUP_ENTRY',
  'ER_DATA_TOO_LONG',
  'ER_TRUNCATED_WRONG_VALUE',
  'ER_BAD_NULL_ERROR',
  'ER_NO_DEFAULT_FOR_FIELD',
  'ER_WARN_DATA_OUT_OF_RANGE',
];
const handle = (res, next) => (e) =>
  CLIENT_ERRORS.includes(e.code) ? res.status(400).json({ error: e.sqlMessage }) : next(e);

const clean = (body, cols) => {
  const out = {};
  for (const [k, v] of Object.entries(body || {})) {
    if (!cols.includes(k)) continue;
    out[k] = Array.isArray(v) ? v.join(', ') : v === '' ? null : v;
  }
  return out;
};

const validId = (id) => Number.isInteger(Number(id)) && Number(id) > 0;

function listCrud(table, cols, orderBy) {
  const r = express.Router();

  r.get('/', async (req, res, next) => {
    try {
      const [rows] = await pool.query(`SELECT * FROM ${table} ORDER BY ${orderBy}`);
      res.json(rows);
    } catch (e) { next(e); }
  });

  r.post('/', async (req, res, next) => {
    try {
      const data = clean(req.body, cols);
      const keys = Object.keys(data);
      if (!keys.length) return res.status(400).json({ error: 'No valid fields' });
      const [result] = await pool.query(
        `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`,
        Object.values(data)
      );
      res.status(201).json({ id: result.insertId });
    } catch (e) { handle(res, next)(e); }
  });

  r.put('/:id', async (req, res, next) => {
    try {
      if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
      const data = clean(req.body, cols);
      const keys = Object.keys(data);
      if (!keys.length) return res.status(400).json({ error: 'No valid fields' });
      const [result] = await pool.query(
        `UPDATE ${table} SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`,
        [...Object.values(data), Number(req.params.id)]
      );
      if (!result.affectedRows) return res.status(404).json({ error: 'Not found' });
      res.json({ ok: true });
    } catch (e) { handle(res, next)(e); }
  });

  r.delete('/:id', async (req, res, next) => {
    try {
      if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
      const [result] = await pool.query(`DELETE FROM ${table} WHERE id = ?`, [Number(req.params.id)]);
      if (!result.affectedRows) return res.status(404).json({ error: 'Not found' });
      res.json({ ok: true });
    } catch (e) { next(e); }
  });

  return r;
}

function singleRow(table, cols) {
  const r = express.Router();

  r.get('/', async (req, res, next) => {
    try {
      const [rows] = await pool.query(`SELECT * FROM ${table} ORDER BY id LIMIT 1`);
      res.json(rows[0] || null);
    } catch (e) { next(e); }
  });

  r.put('/', async (req, res, next) => {
    try {
      const data = clean(req.body, cols);
      const keys = Object.keys(data);
      if (!keys.length) return res.status(400).json({ error: 'No valid fields' });
      const [result] = await pool.query(
        `UPDATE ${table} SET ${keys.map((k) => `${k} = ?`).join(', ')} ORDER BY id LIMIT 1`,
        Object.values(data)
      );
      if (!result.affectedRows) return res.status(404).json({ error: 'Not found' });
      res.json({ ok: true });
    } catch (e) { handle(res, next)(e); }
  });

  return r;
}

router.use('/hero', singleRow('hero', [
  'name', 'role_title', 'tagline', 'photo_url', 'resume_url',
  'github_url', 'linkedin_url', 'leetcode_url', 'email', 'open_to_work',
]));
router.use('/about', singleRow('about', [
  'bio', 'location', 'hackathons_count', 'projects_count', 'certificates_count',
]));

router.use('/education', listCrud('education',
  ['institution', 'degree', 'start_year', 'end_year', 'score', 'coursework', 'sort_order'],
  'sort_order, id'));
router.use('/skills', listCrud('skills',
  ['name', 'category', 'icon_url', 'sort_order'],
  'category, sort_order, id'));
router.use('/projects', listCrud('projects',
  ['title', 'description', 'tech_stack', 'github_url', 'live_url', 'image_url', 'featured', 'sort_order'],
  'sort_order, id'));
router.use('/certificates', listCrud('certificates',
  ['title', 'issuer', 'issue_date', 'credential_url', 'sort_order'],
  'sort_order, id'));
router.use('/hackathons', listCrud('hackathons',
  ['name', 'event_date', 'project_name', 'result', 'description', 'link', 'sort_order'],
  'sort_order, id'));
router.use('/achievements', listCrud('achievements',
  ['title', 'description', 'achieved_date', 'category', 'sort_order'],
  'sort_order, id'));

router.get('/messages', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM messages ORDER BY created_at DESC');
    res.json(rows);
  } catch (e) { next(e); }
});

router.patch('/messages/:id/read', async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    await pool.query('UPDATE messages SET is_read = 1 WHERE id = ?', [Number(req.params.id)]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.delete('/messages/:id', async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    await pool.query('DELETE FROM messages WHERE id = ?', [Number(req.params.id)]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
