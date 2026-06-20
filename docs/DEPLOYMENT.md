# Deployment Guide

## Production Prerequisites

- Node.js 20 or newer
- PostgreSQL 15 or newer
- A public HTTPS origin for the frontend
- Strong JWT secrets with at least 32 random bytes
- SMTP credentials if email notifications should be sent
- Persistent storage for uploaded profile assets and generated certificates

## Backend

1. Create a PostgreSQL database.
2. Run schema and seed scripts as needed:

```bash
psql "$DATABASE_URL" -f database/schema.sql
psql "$DATABASE_URL" -f database/seed.sql
```

3. Configure environment variables:

```text
NODE_ENV=production
PORT=5000
DATABASE_URL=postgres://...
CORS_ORIGIN=https://your-frontend.example
JWT_ACCESS_SECRET=<long-random-secret>
JWT_REFRESH_SECRET=<different-long-random-secret>
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d
UPLOADS_DIR=/var/app/uploads
APP_URL=https://your-frontend.example
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=...
SMTP_PASS=...
MAIL_FROM="Volunteer Hub <no-reply@example.com>"
```

4. Install and start:

```bash
cd backend
npm ci
npm start
```

5. Expose `/health` for uptime checks.

## Frontend

1. Configure the API URL:

```text
VITE_API_URL=https://your-api.example/api
```

2. Build static assets:

```bash
cd frontend
npm ci
npm run build
```

3. Deploy `frontend/dist` to a static host such as Netlify, Vercel, Cloudflare Pages, S3/CloudFront, or Nginx.

## Database

Recommended production settings:

- Enable automated backups and point-in-time recovery.
- Restrict database network access to the backend runtime.
- Use a separate database user with least privilege.
- Monitor slow queries on `applications`, `attendance`, and `activity_logs` as data grows.
- Run future schema changes through migrations rather than editing `schema.sql` directly.

## File Storage

The local filesystem upload implementation is suitable for a single VM or container with persistent volume storage. For multi-instance deployments, replace `UPLOADS_DIR` with an object storage adapter such as S3, Azure Blob Storage, or Google Cloud Storage.

Certificate PDFs are generated under:

```text
<UPLOADS_DIR>/certificates
```

Profile assets are stored under:

```text
<UPLOADS_DIR>/profiles
```

## Security Checklist

- Use HTTPS for frontend and backend.
- Set unique production JWT access and refresh secrets.
- Keep `CORS_ORIGIN` restricted to trusted frontend origins.
- Rotate SMTP and database credentials regularly.
- Configure database backups before launch.
- Run `npm audit --audit-level=high` in CI.
- Put the backend behind a reverse proxy with request size limits.
- Store uploads outside the source tree in production.

## Suggested Hosting Layout

```text
Frontend static host
  -> https://app.example.com

Backend Node service
  -> https://api.example.com
  -> /health uptime probe

Managed PostgreSQL
  -> private network connection from backend only

Object storage or persistent volume
  -> profile uploads and certificates
```
