# MechOS — Full-Stack Agency Operating System

A production-grade internal platform for digital agencies, built with **Next.js 15**, **FastAPI**, and **PostgreSQL**.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| Backend | FastAPI (Python 3.11+), SQLAlchemy 2.0 (async) |
| Database | PostgreSQL (via Supabase or self-hosted) |
| Real-time | WebSockets (native FastAPI) |
| Auth | JWT + Magic Link tokens |
| File Uploads | Local storage (configurable) |
| Email | Resend |
| Payments | Stripe / Razorpay |

## Architecture

```
mech_strek/
├── mech-strek/          # Next.js Frontend
│   ├── app/admin/       # Admin Portal (dashboard, CRM, projects, kanban)
│   └── app/portal/      # Client Portal (proposals, invoices, files, messages)
├── mechos-api/          # FastAPI Backend
│   ├── app/api/         # REST + WebSocket endpoints
│   ├── app/models/      # SQLAlchemy ORM models
│   ├── app/schemas/     # Pydantic schemas
│   ├── app/services/    # Business logic
│   └── alembic/         # DB migrations
└── docker-compose.yml   # Local PostgreSQL
```

## Features

- **Admin Portal** — Dashboard metrics, CRM, project workspaces, Kanban board, invoicing, proposals, AI assistant
- **Client Portal** — Project progress, proposals, invoices, file vault, real-time messaging
- **Notifications** — Real-time WebSocket push notifications for both admin and clients
- **AI Assistant** — Gemini-powered project estimation and QA review
- **Real-time Chat** — Per-project WebSocket messaging between admin and client

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL (or Docker)

### 1. Database

Start PostgreSQL via Docker:
```bash
docker-compose up -d
```

Or point to an existing Supabase project (fill in `.env`).

### 2. Backend (FastAPI)

```bash
cd mechos-api

# Copy and fill in your environment variables
cp .env.example .env

# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate       # Windows
# source .venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Run database migrations
.venv\Scripts\alembic upgrade head

# Seed default admin user and sample data
python scripts/seed.py

# Start the API server
.venv\Scripts\uvicorn app.main:app --reload --port 8000
```

Backend API: **http://localhost:8000**  
API Docs: **http://localhost:8000/docs**

### 3. Frontend (Next.js)

```bash
cd mech-strek

# Copy and fill in your environment variables
cp .env.example .env.local

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Frontend: **http://localhost:3000**

---

## Default Credentials

After seeding, use these to log in:

| Portal | URL | Email | Password |
|---|---|---|---|
| Admin | `/admin/login` | `admin@mechstrek.in` | `AdminPassword123!` |
| Client | `/portal/login` | *(invite via Admin → Clients)* | *(magic link token)* |

---

## Environment Variables

### Backend (`mechos-api/.env`)
See [`mechos-api/.env.example`](./mechos-api/.env.example) for all required and optional variables.

### Frontend (`mech-strek/.env.local`)
See [`mech-strek/.env.example`](./mech-strek/.env.example) for all required variables.

---

## Development Notes

- The backend uses **async SQLAlchemy** — all DB operations must use `await`
- WebSocket rooms use a shared `ConnectionManager` in `app/services/websocket.py`
- Notifications use the room pattern `notify_{user_id}` for per-user channels
- Client auth uses a separate `client_token` stored in `localStorage`
- Admin auth uses standard `Authorization: Bearer {token}` headers

---

## License

Private — all rights reserved.
