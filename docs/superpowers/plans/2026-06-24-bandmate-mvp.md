# BandMate Phase 1 MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working BandMate MVP with band management, questionnaire-based skill levels (including practice duration scoring), practice check-ins, team dashboard, and skeleton song recommendation page.

**Architecture:** Classic frontend/backend split — React SPA talks to Fastify REST API; PostgreSQL via Prisma. JWT in httpOnly cookies. Phase 2 modules exposed as placeholder routes/pages with shared types.

**Tech Stack:** React 18, Vite, TypeScript, Tailwind CSS, React Router · Node.js, Fastify, Prisma, bcrypt, jsonwebtoken · PostgreSQL 16 (Docker)

## Global Constraints

- UI copy: 中文
- Project name: BandMate（暂定，展示层可随时更换）
- Auth: JWT + httpOnly cookie, `SameSite=Lax`
- CORS origin: `http://localhost:5173`
- Backend port: `3000`; frontend dev: `5173`
- One band per user (MVP)
- One check-in per user per band per day (`409` on duplicate)
- Audio upload: mp3/wav, max 10MB, local `backend/uploads/`
- Skill level: 1–5 from practice duration (0–3) + instrument skills (0–4)
- Song recommendation: `FEATURES.SONG_RECOMMENDATION = false`, API returns `coming_soon`
- Do not build Phase 2 logic (real recommendations, email, metronome, anti-cheat)

---

## File Map

```
bandmate/
├── docker-compose.yml
├── README.md
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   ├── prisma/schema.prisma
│   ├── uploads/                    (gitignored)
│   └── src/
│       ├── index.ts
│       ├── app.ts
│       ├── config/features.ts
│       ├── middleware/authenticate.ts
│       ├── routes/{auth,bands,practices,songs}.ts
│       ├── services/{authService,bandService,practiceService,skillAssessment}.ts
│       └── types/song.ts
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── config/features.ts
        ├── types/{band,practice,song}.ts
        ├── api/{client,auth,bands,practices,songs}.ts
        ├── hooks/{useAuth,useBand}.ts
        ├── components/layout/{AppLayout,NavBar}.tsx
        ├── components/band/{MemberCard,CreateBandForm,JoinBandForm}.tsx
        ├── components/practice/{PracticeCalendar,CheckInForm,TeamStatusPanel}.tsx
        ├── components/shared/SkillQuestionnaire.tsx
        └── pages/{Login,Register,BandHome,SongRecommend,Practice}.tsx
```

---

### Task 1: Monorepo Root + Database

**Files:**
- Create: `docker-compose.yml`, `README.md`, `.gitignore`

**Interfaces:**
- Produces: PostgreSQL at `localhost:5432`, db `bandmate`, user `bandmate`, password `bandmate`

- [ ] **Step 1: Create `docker-compose.yml`**

```yaml
services:
  db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: bandmate
      POSTGRES_PASSWORD: bandmate
      POSTGRES_DB: bandmate
    volumes:
      - bandmate_pg:/var/lib/postgresql/data

volumes:
  bandmate_pg:
```

- [ ] **Step 2: Create root `.gitignore`**

```
node_modules/
dist/
.env
backend/uploads/*
!backend/uploads/.gitkeep
*.log
.DS_Store
```

- [ ] **Step 3: Start database**

Run: `docker compose up -d`
Expected: container `bandmate-db-1` running

- [ ] **Step 4: Create minimal `README.md`** with project intro, `docker compose up -d`, and pointers to backend/frontend setup sections (filled in later tasks)

---

### Task 2: Backend Scaffold

**Files:**
- Create: `backend/package.json`, `backend/tsconfig.json`, `backend/.env`, `backend/src/index.ts`, `backend/src/app.ts`, `backend/src/config/features.ts`

**Interfaces:**
- Produces: `buildApp()` returning configured Fastify instance; `GET /health` → `{ ok: true }`

- [ ] **Step 1: Init backend package**

```json
{
  "name": "bandmate-backend",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@fastify/cookie": "^11.0.0",
    "@fastify/cors": "^10.0.0",
    "@fastify/multipart": "^9.0.0",
    "@prisma/client": "^6.0.0",
    "bcrypt": "^5.1.1",
    "fastify": "^5.0.0",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "@types/jsonwebtoken": "^9.0.7",
    "@types/node": "^22.0.0",
    "prisma": "^6.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
```

Run: `cd backend && npm install`

- [ ] **Step 2: Create `backend/.env`**

```
DATABASE_URL="postgresql://bandmate:bandmate@localhost:5432/bandmate"
JWT_SECRET="dev-secret-change-in-production"
PORT=3000
FRONTEND_URL="http://localhost:5173"
```

- [ ] **Step 3: Create `backend/src/config/features.ts`**

```typescript
export const FEATURES = {
  SONG_RECOMMENDATION: false,
} as const;
```

- [ ] **Step 4: Create `backend/src/app.ts`**

```typescript
import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';

export async function buildApp() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
  });
  await app.register(cookie);
  await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } });

  app.get('/health', async () => ({ ok: true }));

  return app;
}
```

- [ ] **Step 5: Create `backend/src/index.ts`**

```typescript
import { buildApp } from './app.js';

const port = Number(process.env.PORT ?? 3000);

const app = await buildApp();
await app.listen({ port, host: '0.0.0.0' });
```

- [ ] **Step 6: Verify health endpoint**

Run: `cd backend && npm run dev` (separate terminal)
Run: `curl http://localhost:3000/health`
Expected: `{"ok":true}`

---

### Task 3: Prisma Schema + Migrate

**Files:**
- Create: `backend/prisma/schema.prisma`
- Modify: `backend/src/app.ts` (no change yet)

**Interfaces:**
- Produces: Prisma client with `User`, `Band`, `BandMember`, `PracticeLog`, `Instrument` enum

- [ ] **Step 1: Write schema** (copy from spec section 4.1 verbatim)

- [ ] **Step 2: Run migration**

Run: `cd backend && npx prisma migrate dev --name init`
Expected: migration applied, `PrismaClient` generated

- [ ] **Step 3: Add Prisma singleton `backend/src/lib/prisma.ts`**

```typescript
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
```

---

### Task 4: Skill Assessment Service (TDD)

**Files:**
- Create: `backend/src/services/skillAssessment.ts`
- Create: `backend/src/services/skillAssessment.test.ts`
- Modify: `backend/vitest.config.ts`

**Interfaces:**
- Produces: `calculateSkillLevel(answers: QuestionnaireAnswers): number` → 1–5
- Consumes: `QuestionnaireAnswers` type with `weeklyPracticeHours` and `instrumentSkills: boolean[]`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect } from 'vitest';
import { calculateSkillLevel } from './skillAssessment.js';

describe('calculateSkillLevel', () => {
  it('returns level 1 for minimal answers', () => {
    const level = calculateSkillLevel({
      weeklyPracticeHours: '<1',
      instrumentSkills: [false, false, false, false],
    });
    expect(level).toBe(1);
  });

  it('returns level 5 for max practice + all skills', () => {
    const level = calculateSkillLevel({
      weeklyPracticeHours: '5+',
      instrumentSkills: [true, true, true, true],
    });
    expect(level).toBe(5);
  });

  it('weights practice duration independently', () => {
    const level = calculateSkillLevel({
      weeklyPracticeHours: '5+',
      instrumentSkills: [false, false, false, false],
    });
    expect(level).toBe(3); // 3 practice pts → level 3
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `cd backend && npm test`
Expected: FAIL — module not found

- [ ] **Step 3: Implement `skillAssessment.ts`**

```typescript
export type WeeklyPracticeHours = '<1' | '1-3' | '3-5' | '5+';

export interface QuestionnaireAnswers {
  weeklyPracticeHours: WeeklyPracticeHours;
  instrumentSkills: boolean[]; // 4 items, true = 1 pt
}

function practiceScore(hours: WeeklyPracticeHours): number {
  const map: Record<WeeklyPracticeHours, number> = {
    '<1': 0,
    '1-3': 1,
    '3-5': 2,
    '5+': 3,
  };
  return map[hours];
}

export function calculateSkillLevel(answers: QuestionnaireAnswers): number {
  const practice = practiceScore(answers.weeklyPracticeHours);
  const skills = answers.instrumentSkills.filter(Boolean).length;
  const total = practice + skills;

  if (total <= 1) return 1;
  if (total <= 3) return 2;
  if (total === 4) return 3;
  if (total <= 6) return 4;
  return 5;
}
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `cd backend && npm test`
Expected: all pass

---

### Task 5: Auth Service + Routes (TDD)

**Files:**
- Create: `backend/src/services/authService.ts`, `backend/src/middleware/authenticate.ts`, `backend/src/routes/auth.ts`
- Create: `backend/tests/auth.test.ts`
- Modify: `backend/src/app.ts`

**Interfaces:**
- Produces: `register()`, `login()`, `getMe()`; middleware `authenticate`
- Cookie name: `token`

- [ ] **Step 1: Write auth integration test**

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../src/app.js';
import { registerAuthRoutes } from '../src/routes/auth.js';
import { prisma } from '../src/lib/prisma.js';

describe('POST /auth/register', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    app = await buildApp();
    await registerAuthRoutes(app);
    await app.ready();
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: 'test@example.com' } });
    await app.close();
  });

  it('creates user and returns 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'test@example.com', password: 'secret123', displayName: '测试' },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().user.email).toBe('test@example.com');
  });
});
```

- [ ] **Step 2: Implement `authService.ts`**

Key functions:
- `register({ email, password, displayName })` — bcrypt hash (10 rounds), create user
- `login({ email, password })` — verify, return JWT payload `{ userId }`
- `getMe(userId)` — return `{ id, email, displayName }`

JWT sign: `{ userId }`, expires `7d`

- [ ] **Step 3: Implement `authenticate.ts` middleware**

Read `request.cookies.token`, verify JWT, set `request.userId`

- [ ] **Step 4: Implement `routes/auth.ts`**

| Route | Behavior |
|-------|----------|
| POST `/auth/register` | 201 + user (no password) |
| POST `/auth/login` | 200 + Set-Cookie `token` httpOnly |
| POST `/auth/logout` | clear cookie |
| GET `/auth/me` | 401 or user |

- [ ] **Step 5: Register routes in `app.ts`**

- [ ] **Step 6: Run tests**

Run: `cd backend && npm test`
Expected: auth tests pass

---

### Task 6: Band Service + Routes (TDD)

**Files:**
- Create: `backend/src/services/bandService.ts`, `backend/src/routes/bands.ts`
- Create: `backend/tests/bands.test.ts`

**Interfaces:**
- Produces: `createBand`, `joinBand`, `getBand`, `updateMyMemberProfile`
- `inviteCode`: 8-char alphanumeric via `crypto.randomBytes(4).toString('hex')`

- [ ] **Step 1: Write test for create + join flow**

- [ ] **Step 2: Implement `bandService.ts`**

Rules:
- User with existing membership cannot create/join another band → `409`
- `updateMyMemberProfile` accepts `{ instrument, questionnaireAnswers, stylePreference? }`, runs `calculateSkillLevel`, saves `skillLevel`

- [ ] **Step 3: Implement routes (all require auth except none)**

| Route | Notes |
|-------|-------|
| POST `/bands` | `{ name, stylePreference? }` |
| POST `/bands/join` | `{ inviteCode }` |
| GET `/bands/:id` | members with `displayName`, `instrument`, `skillLevel`, `questionnaireAnswers` |
| PUT `/bands/:id/members/me` | questionnaire + instrument |

- [ ] **Step 4: Add helper GET `/bands/me`** — returns current user's band or `null`

- [ ] **Step 5: Run tests**

---

### Task 7: Practice Service + Routes (TDD)

**Files:**
- Create: `backend/src/services/practiceService.ts`, `backend/src/routes/practices.ts`, `backend/uploads/.gitkeep`
- Create: `backend/tests/practices.test.ts`

**Interfaces:**
- Produces: `createPractice`, `getMonthPractices`, `getTodayStatus`

- [ ] **Step 1: Write tests** for check-in, duplicate 409, today status

- [ ] **Step 2: Implement `practiceService.ts`**

- `createPractice({ bandId, userId, durationMinutes, note?, audioPath? })`
  - Validate member of band
  - `date` = today (UTC date or local — pick `Asia/Shanghai` and document in code comment)
  - Unique constraint → throw 409
- `getMonthPractices(bandId, month)` — `month` format `YYYY-MM`
- `getTodayStatus(bandId)` — array `{ userId, displayName, checkedIn, durationMinutes?, note? }`

- [ ] **Step 3: Implement routes**

| Route | Notes |
|-------|-------|
| POST `/practices` | multipart: fields + optional file; save to `uploads/{cuid}.ext` |
| GET `/practices?bandId=&month=` | |
| GET `/practices/today?bandId=` | |

- [ ] **Step 4: Run tests**

---

### Task 8: Songs Placeholder Route

**Files:**
- Create: `backend/src/routes/songs.ts`, `backend/src/types/song.ts`
- Modify: `backend/src/app.ts`

**Interfaces:**
- Produces: `GET /songs/recommend?bandId=` → `RecommendationResponse`

- [ ] **Step 1: Define types in `backend/src/types/song.ts`**

```typescript
export interface Song {
  id: string;
  title: string;
  artist: string;
  style: string;
  minSkillLevel: Record<string, number>;
  bpm?: number;
}

export interface RecommendationResponse {
  status: 'coming_soon' | 'ok';
  songs: Song[];
  message?: string;
}
```

- [ ] **Step 2: Implement route**

```typescript
app.get('/songs/recommend', { preHandler: authenticate }, async (request) => {
  return {
    status: 'coming_soon',
    songs: [],
    message: '功能开发中，敬请期待',
  };
});
```

- [ ] **Step 3: Manual verify**

Run: `curl -b cookies.txt "http://localhost:3000/songs/recommend?bandId=x"`
Expected: coming_soon JSON

---

### Task 9: Frontend Scaffold + API Client

**Files:**
- Create: entire `frontend/` via Vite template + Tailwind

**Interfaces:**
- Produces: axios instance at `frontend/src/api/client.ts` with `baseURL: 'http://localhost:3000'`, `withCredentials: true`

- [ ] **Step 1: Scaffold**

Run: `npm create vite@latest frontend -- --template react-ts`
Run: `cd frontend && npm install && npm install react-router-dom axios`

- [ ] **Step 2: Install Tailwind** (follow official Vite guide)

- [ ] **Step 3: Create `frontend/src/api/client.ts`**

```typescript
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  withCredentials: true,
});
```

- [ ] **Step 4: Create `frontend/.env`**

```
VITE_API_URL=http://localhost:3000
```

- [ ] **Step 5: Create type files** mirroring backend: `types/band.ts`, `types/practice.ts`, `types/song.ts`

- [ ] **Step 6: Create `frontend/src/config/features.ts`**

```typescript
export const FEATURES = { SONG_RECOMMENDATION: false } as const;
```

---

### Task 10: Auth Hook + Pages

**Files:**
- Create: `frontend/src/hooks/useAuth.ts`, `frontend/src/api/auth.ts`, `frontend/src/pages/Login.tsx`, `frontend/src/pages/Register.tsx`

**Interfaces:**
- Produces: `AuthProvider` with `{ user, login, register, logout, loading }`

- [ ] **Step 1: Implement `api/auth.ts`** — `register`, `login`, `logout`, `getMe`

- [ ] **Step 2: Implement `useAuth` context hook**

- [ ] **Step 3: Build Login / Register pages** — Chinese labels, email + password + displayName (register), link between pages

- [ ] **Step 4: Manual test** — register, refresh, still logged in via `/auth/me`

---

### Task 11: Layout + Routing

**Files:**
- Create: `frontend/src/components/layout/AppLayout.tsx`, `NavBar.tsx`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Produces: routes `/login`, `/register`, `/`, `/songs`, `/practice`; protected routes wrapped

- [ ] **Step 1: NavBar with three tabs**

Labels: 乐队 | 歌单 | 打卡
歌单 tab shows small badge `即将上线`

- [ ] **Step 2: AppLayout** — header + `<Outlet />`

- [ ] **Step 3: Route guards** — redirect to `/login` if no user

- [ ] **Step 4: No-band guard** — `/songs` and `/practice` show 「请先加入或创建乐队」when user has no band

---

### Task 12: Band Home Page

**Files:**
- Create: `frontend/src/hooks/useBand.ts`, `frontend/src/api/bands.ts`, `frontend/src/components/band/*`, `frontend/src/pages/BandHome.tsx`

- [ ] **Step 1: API wrappers** — `createBand`, `joinBand`, `getMyBand`, `updateMyProfile`

- [ ] **Step 2: No-band state** — `CreateBandForm` + `JoinBandForm`

- [ ] **Step 3: Has-band state** — band name, invite code copy button, member grid

- [ ] **Step 4: `MemberCard`** — displayName, instrument label (吉他/贝斯/鼓/主唱/其他), skill stars 1–5

- [ ] **Step 5: Manual test full band flow**

---

### Task 13: Skill Questionnaire Component

**Files:**
- Create: `frontend/src/components/shared/SkillQuestionnaire.tsx`

**Interfaces:**
- Consumes: instrument-specific question lists from spec §4.2
- Produces: `{ weeklyPracticeHours, stylePreference, instrumentSkills: boolean[] }`

- [ ] **Step 1: Build modal with sections**

Section A — **练习时长** (required, radio):
- 每周 < 1 小时 / 1–3 / 3–5 / 5+

Section B — **风格偏好** (required, radio): 摇滚/流行/民谣/金属/不限

Section C — **乐器技术** (4 checkboxes, instrument-specific labels from spec)

- [ ] **Step 2: On submit** call `updateMyProfile` API

- [ ] **Step 3: Show computed level** after save (stars on MemberCard update)

- [ ] **Step 4: Prompt incomplete members** — card shows 「资料未完善」 until questionnaire submitted

---

### Task 14: Practice Page

**Files:**
- Create: `frontend/src/api/practices.ts`, `frontend/src/components/practice/*`, `frontend/src/pages/Practice.tsx`

- [ ] **Step 1: `CheckInForm`** — duration (number input, min 1), note, optional audio file

- [ ] **Step 2: `TeamStatusPanel`** — list members, green ✅ 已练 X 分钟 / gray ⏳ 未练

- [ ] **Step 3: `PracticeCalendar`** — month picker, dots on days with logs, click day → history panel

- [ ] **Step 4: Bottom placeholder card**

Text: `即将推出：练习邮件提醒 · 内置节拍器 · 调音器`

- [ ] **Step 5: Manual test** — two users in same band, both check in, panel updates

---

### Task 15: Song Recommendation Placeholder Page

**Files:**
- Create: `frontend/src/api/songs.ts`, `frontend/src/pages/SongRecommend.tsx`

- [ ] **Step 1: Page layout** per spec §6.4

- [ ] **Step 2: Disabled filters** — 风格 + 难度 dropdowns, `disabled` attribute

- [ ] **Step 3: Call API on mount**, display `message` from response

- [ ] **Step 4: Empty state** — 「暂无推荐 — 功能开发中」

---

### Task 16: Final Integration + README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Document startup**

```bash
docker compose up -d
cd backend && npm install && npx prisma migrate dev && npm run dev
cd frontend && npm install && npm run dev
```

- [ ] **Step 2: Walk through acceptance checklist** (spec §10) manually

- [ ] **Step 3: Run all backend tests**

Run: `cd backend && npm test`
Expected: all pass

---

## Plan Self-Review

| Spec requirement | Task |
|------------------|------|
| Auth register/login/logout | Task 5, 10 |
| Create/join band | Task 6, 12 |
| Questionnaire + practice duration scoring | Task 4, 13 |
| Check-in + audio | Task 7, 14 |
| Team panel + calendar | Task 14 |
| Three-tab nav | Task 11 |
| Songs placeholder page + API | Task 8, 15 |
| FEATURES constant | Task 2, 9 |
| Song TypeScript types | Task 8, 9 |
| One band per user | Task 6 |
| Duplicate check-in 409 | Task 7 |
| 中文 UI | All frontend tasks |
| Provisional project name | Global Constraints |

No placeholders remain in task steps. Types consistent: `QuestionnaireAnswers`, `RecommendationResponse`, `calculateSkillLevel` thresholds match spec §4.2.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-24-bandmate-mvp.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** — execute tasks in this session with checkpoints

Which approach?
