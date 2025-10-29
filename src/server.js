import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool, initDb } from './db.js';
import { router as api } from './routes.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Serve static front-end
app.use(express.static('public'));

// API routes
app.use('/api', api);

// Redirect route - last so it doesn't shadow API routes
app.get('/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const r = await pool.query('SELECT target FROM urls WHERE slug = $1', [slug]);
    if (r.rowCount === 0) return res.status(404).send('Not found');
    const target = r.rows[0].target;
    await pool.query('UPDATE urls SET clicks = clicks + 1, last_accessed_at = NOW() WHERE slug = $1', [slug]);
    res.redirect(301, target);
  } catch (e) {
    console.error(e);
    res.status(500).send('Internal server error');
  }
});

app.get('/', (_req, res) => {
  res.type('text').send('URL Shortener API. POST /api/shorten { url, slug? }. Get stats: /api/stats/:slug');
});

export async function start() {
  await initDb();
  app.listen(PORT, () => console.log(`🚀 Server listening on http://localhost:${PORT}`));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  start();
}

export default app;


// JSON error handler to avoid HTML/plain text errors
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Internal server error' });
});
