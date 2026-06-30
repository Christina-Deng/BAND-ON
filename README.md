# BandMate

BandMate is a band rehearsal assistant web app — React frontend, Fastify backend, and PostgreSQL database.

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Docker](https://docs.docker.com/get-docker/) (for PostgreSQL)

## Quick Start

### 1. Database

```bash
docker compose up -d
```

Connection: `localhost:5432`, database `bandmate`, user `bandmate`, password `bandmate`.

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env   # or use existing .env
npx prisma migrate dev
npm run dev
```

API runs at `http://localhost:3000`.

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

App runs at `http://localhost:5173`.

## Tests

```bash
cd backend && npm test
cd backend && npm run validate:seed   # 500-song library schema check
```

## Project Structure

- `frontend/` — React + Vite + Tailwind SPA
- `backend/` — Fastify + Prisma API
- `docs/superpowers/` — design spec and implementation plans

## Features

### Auth & bands

- Register / login (httpOnly cookie)
- Create or join a band via invite code or `/join?code=…` link
- Invite codes tolerate spaces, dashes, and mixed case when pasted
- Member profile questionnaire (instrument, skills → level 1–5)
- **Per-band profiles**: first questionnaire syncs to empty bands; joining a new band copies your existing profile; edits apply to the current band only

### Practice

- Daily check-in per band (minutes, note, optional audio)
- Personal streak / week stats and team dashboard
- Built-in metronome and tuner (practice page)

### Song recommendations (Phase 2)

- Rule engine over 500-song seed library (arrangement, parts, fallbacks)
- Style match + skill fit + optional “stretch” / “style stretch” tiers
- Optional AI-generated reasons when `LLM_API_KEY` is configured

## Environment variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Session signing secret (change in production) |
| `FRONTEND_URL` | CORS origin for the SPA |
| `LLM_API_KEY` | Optional — enables AI recommendation copy |
| `LLM_MODEL` / `LLM_BASE_URL` | LLM provider (e.g. 智谱 glm-4-flash) |

### Frontend (`frontend/.env.local` or build-time env)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API origin (e.g. `https://api.example.com`) |
| `VITE_APP_URL` | **Public SPA origin for invite links** (e.g. `https://bandmate.example.com`). Set at **build** time in production. |

If `VITE_APP_URL` is unset in production, invite share links fall back to the browser’s current origin, which may be wrong when API and frontend are on different domains.

## Production deployment notes

1. Set strong `JWT_SECRET` and production `DATABASE_URL`.
2. Set `FRONTEND_URL` on the backend to your deployed SPA origin.
3. Build the frontend with `VITE_API_URL` and `VITE_APP_URL` pointing to production URLs.
4. Run `npx prisma migrate deploy` on the backend.

## Phase roadmap

- **Done:** practice check-in, team stats, recommendations, metronome/tuner
- **Planned:** practice email reminders, band setlist / voting

See `docs/superpowers/specs/2026-06-24-band-rehearsal-design.md` for the full product spec.
