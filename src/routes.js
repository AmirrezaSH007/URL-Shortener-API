import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { nanoid } from 'nanoid';
import { pool } from './db.js';
import { shortenSchema } from './validators.js';

export const router = Router();

// Basic rate limiter for POST /shorten
const limiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many requests, please try again later.' });
  }
});

router.get('/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

router.post('/shorten', limiter, async (req, res) => {
  const { error, value } = shortenSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  let { url, slug } = value;
  if (!slug) slug = nanoid(7);

  try {
    // ensure unique slug
    const exists = await pool.query('SELECT 1 FROM urls WHERE slug = $1', [slug]);
    if (exists.rowCount > 0) return res.status(409).json({ error: 'Slug already exists' });

    const inserted = await pool.query(
      'INSERT INTO urls (slug, target) VALUES ($1, $2) RETURNING slug, target, clicks, created_at',
      [slug, url]
    );

    const row = inserted.rows[0];
    res.status(201).json({
      slug: row.slug,
      url: row.target,
      clicks: row.clicks,
      created_at: row.created_at,
      short_url: `${req.protocol}://${req.get('host')}/${row.slug}`
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/stats/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const r = await pool.query('SELECT slug, target, clicks, created_at, last_accessed_at FROM urls WHERE slug = $1', [slug]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const r = await pool.query('DELETE FROM urls WHERE slug = $1 RETURNING slug', [slug]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true, slug });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});
