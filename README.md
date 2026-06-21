
# Volunteer Management System

Production-ready full-stack Volunteer Management System built with React, Vite, Tailwind CSS, Node.js, Express, JWT auth, bcrypt password hashing, and PostgreSQL.

## Project Structure

```text
volunter/
├── database/
│   ├── schema.sql
│   └── seed.sql
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   ├── uploads/
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
├── docs/
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── ERD.md
└── docker-compose.yml
```

## Quick Start

1. Start PostgreSQL:

```bash
docker compose up -d postgres
```

2. Configure the backend:

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

3. Configure the frontend:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

4. Open the app:

```text
http://localhost:5173
```

## Manual Database Setup

```bash
createdb volunteer_management
psql -d volunteer_management -f database/schema.sql
psql -d volunteer_management -f database/seed.sql
```

## Demo Accounts

| Role         | Email                   | Password      |
| ------------ | ----------------------- | ------------- |
| Admin        | admin@volunteerhub.test | Admin123!     |
| Volunteer    | maya.volunteer@test     | Volunteer123! |
| Volunteer    | liam.volunteer@test     | Volunteer123! |
| Organization | hello@greenfuture.test  | Org123!       |
| Organization | ops@citycare.test       | Org123!       |

## Key Features

- JWT access tokens with refresh-token rotation
- Role-based authorization for volunteers, organizations, and admins
- Volunteer profiles with skills, interests, availability, history, hours, and certificates
- Opportunity search, filtering, creation, application, and review workflows
- Event scheduling, volunteer assignment, and attendance tracking
- In-app notifications and SMTP-ready email notification service
- PDF certificate generation and secure download endpoint
- Admin dashboard, users, organizations, platform monitoring, and reports
- Responsive Tailwind UI with dark mode, protected routes, loading states, and toast notifications
- PostgreSQL schema with constraints, indexes, triggers, sample data, and ER diagram

## Verification

Already run in this workspace:

```bash
cd backend
npm audit --audit-level=high
Get-ChildItem -Path src -Recurse -Filter *.js | ForEach-Object { node --check $_.FullName }

cd frontend
npm audit --audit-level=high
npm run build
```

## Documentation

- API reference: [docs/API.md](docs/API.md)
- Deployment guide: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- Database ER diagram: [docs/ERD.md](docs/ERD.md)
- Schema: [database/schema.sql](database/schema.sql)
- Sample data: [database/seed.sql](database/seed.sql)

DEPLOYMENT LINK - https://volunteersystem-livid.vercel.app/
