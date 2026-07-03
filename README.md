# BAND·ON

BAND·ON（Band On）is a band rehearsal assistant web app — React frontend, Fastify backend, and PostgreSQL database.

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

## Production deployment

Step-by-step guide (Vercel + Railway, no custom domain): **[docs/DEPLOY.md](docs/DEPLOY.md)**

Quick checklist:

1. Set strong `JWT_SECRET` and production `DATABASE_URL`.
2. Set `FRONTEND_URL` on the backend to your deployed SPA origin.
3. Build the frontend with `VITE_API_URL=/api` and `VITE_APP_URL` pointing to your Vercel URL.
4. Backend start runs `prisma migrate deploy` via `npm run start:prod` on Railway.

## Phase roadmap

### Done — Phase 1

- Auth, multi-band, invite links, per-band member profiles  
- Practice check-in, calendar, personal/team stats, streaks  
- Metronome & tuner on practice page  
- Settings (display name, password, theme)

### Done — Phase 2

- 500-song v2 seed library + validation script  
- Rule-based recommendations with stretch / style-stretch tiers  
- Optional LLM recommendation copy (`LLM_*` env vars)  
- `/songs` UI with diagnosis hints when empty  

### Planned

- Practice email reminders  
- Band rehearsal setlist / song voting  
- Practice timezone (`Asia/Shanghai`) for China users  
- Secure audio uploads for production  

**Docs:** [Design spec](docs/superpowers/specs/2026-06-24-band-rehearsal-design.md)（文首「实现状态」）· [Phase 1 plan](docs/superpowers/plans/2026-06-24-bandmate-mvp.md)（superseded）· [Phase 2 plan](docs/superpowers/plans/2026-06-30-phase2-song-recommendation.md)（delivered）
