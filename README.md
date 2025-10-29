# URL Shortener API (Express + PostgreSQL + Docker + Jest)

A production-ready URL shortener API suitable for portfolios and real usage.

## Features
- REST endpoints: shorten, redirect, stats, delete
- Input validation (Joi)
- Slug generation (nanoid) with uniqueness checks
- PostgreSQL with automatic table migration
- Rate limiting on shorten endpoint
- Security middleware (helmet, cors)
- Logging (morgan)
- Tests (Jest + Supertest)
- Dockerfile + docker-compose

## Endpoints
- `POST /api/shorten` → `{ url: string, slug?: string }` → returns `{ slug, url, short_url, clicks, created_at }`
- `GET /:slug` → 301 redirect to the original URL, increments clicks
- `GET /api/stats/:slug` → returns `{ slug, target, clicks, created_at, last_accessed_at }`
- `DELETE /api/:slug` → deletes mapping

## Quick Start (Docker)
```bash
cp .env.example .env
docker compose up --build
# API: http://localhost:3000
```

Create a short link:
```bash
curl -X POST http://localhost:3000/api/shorten \  -H 'Content-Type: application/json' \  -d '{"url":"https://example.com"}'
```

Stats:
```bash
curl http://localhost:3000/api/stats/<slug>
```

## Local Dev (without Docker)
- Ensure PostgreSQL is running locally.
- Create DBs `shortener` and (optional for tests) `shortener_test`.
- Set `DATABASE_URL` in `.env` (see `.env.example`).

```bash
npm install
npm run dev   # starts nodemon on :3000
npm test      # runs Jest
```

## Environment
- `DATABASE_URL` (and `TEST_DATABASE_URL` when running tests)
- `PORT` (default `3000`)

## Project Structure
```
src/
  db.js          # Pool + init migration
  routes.js      # API endpoints
  server.js      # App + redirect route
tests/
  api.test.js    # Supertest integration tests
Dockerfile
docker-compose.yml
package.json
.env.example
README.md
```
