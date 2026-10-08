const express = require('express');
const pool = require('../db');
const router = express.Router();

const q = async (sql) => (await pool.query(sql))[0];

async function loadAll() {
  const [hero] = await q('SELECT * FROM hero LIMIT 1');
  const [about] = await q('SELECT * FROM about LIMIT 1');
  const education = await q('SELECT * FROM education ORDER BY sort_order');
  const skillRows = await q('SELECT * FROM skills ORDER BY category, sort_order');
  const projectRows = await q('SELECT * FROM projects ORDER BY featured DESC, sort_order');
  const certificates = await q('SELECT * FROM certificates ORDER BY sort_order');
  const hackathons = await q('SELECT * FROM hackathons ORDER BY sort_order');
  const achievements = await q('SELECT * FROM achievements ORDER BY sort_order');

  const skills = {};
  for (const s of skillRows) (skills[s.category] ||= []).push(s);

  const projects = projectRows.map((p) => ({
    ...p,
    tech_stack: p.tech_stack ? p.tech_stack.split(',').map((t) => t.trim()) : [],
  }));

  return { hero, about, education, skills, projects, certificates, hackathons, achievements };
}

router.get('/portfolio', async (req, res, next) => {
  try { res.json(await loadAll()); } catch (e) { next(e); }
});

const simple = {
  education: 'SELECT * FROM education ORDER BY sort_order',
  certificates: 'SELECT * FROM certificates ORDER BY sort_order',
  hackathons: 'SELECT * FROM hackathons ORDER BY sort_order',
  achievements: 'SELECT * FROM achievements ORDER BY sort_order',
};
for (const [name, sql] of Object.entries(simple)) {
  router.get(`/${name}`, async (req, res, next) => {
    try { res.json(await q(sql)); } catch (e) { next(e); }
  });
}

router.get('/profile', async (req, res, next) => {
  try {
    const [hero] = await q('SELECT * FROM hero LIMIT 1');
    const [about] = await q('SELECT * FROM about LIMIT 1');
    res.json({ hero, about });
  } catch (e) { next(e); }
});

router.get('/skills', async (req, res, next) => {
  try { res.json((await loadAll()).skills); } catch (e) { next(e); }
});

router.get('/projects', async (req, res, next) => {
  try { res.json((await loadAll()).projects); } catch (e) { next(e); }
});

module.exports = router;
