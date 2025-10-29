import request from 'supertest';
import { pool } from '../src/db.js';
import app, { start } from '../src/server.js';
import dotenv from 'dotenv';
dotenv.config();

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  // Ensure test DB exists and schema is created
  await pool.query('CREATE TABLE IF NOT EXISTS urls (id SERIAL PRIMARY KEY, slug VARCHAR(64) UNIQUE NOT NULL, target TEXT NOT NULL, clicks INTEGER NOT NULL DEFAULT 0, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), last_accessed_at TIMESTAMP WITH TIME ZONE)');
});

afterAll(async () => {
  await pool.query('TRUNCATE urls RESTART IDENTITY');
  await pool.end();
});

describe('URL Shortener API', () => {
  test('POST /api/shorten creates new short URL', async () => {
    const res = await request(app).post('/api/shorten').send({ url: 'https://example.com' });
    expect(res.statusCode).toBe(201);
    expect(res.body.slug).toBeDefined();
    expect(res.body.url).toBe('https://example.com');
    expect(res.body.short_url).toContain(res.body.slug);
  });

  test('rejects invalid URL', async () => {
    const res = await request(app).post('/api/shorten').send({ url: 'not-a-url' });
    expect(res.statusCode).toBe(400);
  });

  test('custom slug works and is unique', async () => {
    const res1 = await request(app).post('/api/shorten').send({ url: 'https://example.org', slug: 'custom123' });
    expect(res1.statusCode).toBe(201);
    const res2 = await request(app).post('/api/shorten').send({ url: 'https://example.org', slug: 'custom123' });
    expect(res2.statusCode).toBe(409);
  });

  test('GET /api/stats/:slug returns stats', async () => {
    const create = await request(app).post('/api/shorten').send({ url: 'https://example.net' });
    const slug = create.body.slug;
    const stats = await request(app).get(`/api/stats/${slug}`);
    expect(stats.statusCode).toBe(200);
    expect(stats.body.slug).toBe(slug);
    expect(stats.body.clicks).toBe(0);
  });
});
