# BAND·ON Phase 3 Community + Rehearsal Plans Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship community feed (posts + 我想参加), rehearsal plans on band home, gear UI shell, and a 4th nav tab「社区」.

**Architecture:** Prisma models for `CommunityPost`, `PostResponse`, `RehearsalPlan`, `RehearsalPlanSong`. Fastify routes in `routes/community.ts` and extended `routes/bands.ts` (or `rehearsalPlans.ts`). React pages under `/community/*`; `RehearsalPlanPanel` embedded in `BandSection`. Follow existing service + `app.inject` integration test patterns.

**Tech Stack:** Existing Fastify + Prisma + Vitest · React + Vite + Tailwind + React Router · axios API client

**Spec:** [2026-07-07-phase3-community-design.md](../specs/2026-07-07-phase3-community-design.md)

## Global Constraints

- UI copy: 中文 primary (+ en i18n keys)
- Auth: JWT httpOnly cookie; all new routes require login except none (all auth)
- Community browse/create: any logged-in user
- Rehearsal plans: band members only
- No comments/likes/voting/e-commerce backend

---

## File Map

```
backend/
├── prisma/schema.prisma                    # +4 models, enum
├── prisma/migrations/...                   # new migration
├── src/
│   ├── app.ts                              # register community routes
│   ├── routes/community.ts                 # NEW
│   ├── routes/bands.ts                     # + rehearsal plan routes OR rehearsalPlans.ts
│   ├── services/communityService.ts        # NEW
│   ├── services/rehearsalPlanService.ts    # NEW
│   └── types/community.ts                  # NEW shared types
├── tests/community.test.ts                 # NEW
└── tests/rehearsalPlans.test.ts            # NEW

frontend/
├── src/
│   ├── App.tsx                             # + community routes
│   ├── components/layout/NavBar.tsx        # + 社区 tab
│   ├── components/band/BandSection.tsx       # + RehearsalPlanPanel
│   ├── components/band/RehearsalPlanPanel.tsx  # NEW
│   ├── components/community/               # NEW folder
│   ├── pages/CommunityFeed.tsx             # NEW
│   ├── pages/CommunityPostNew.tsx          # NEW
│   ├── pages/CommunityPostDetail.tsx       # NEW
│   ├── pages/GearShopShell.tsx             # NEW
│   ├── api/community.ts                    # NEW
│   ├── api/rehearsalPlans.ts               # NEW
│   ├── types/community.ts                  # NEW
│   └── lib/i18n/{zh,en}.ts                 # + keys
```

---

### Task 1: Prisma schema + migration

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: migration via `npx prisma migrate dev`

- [ ] **Step 1: Add enum and models** to `schema.prisma` (see spec §4.1); add relations on `User` and `Band`.

- [ ] **Step 2: Run migration**

Run: `cd backend && npx prisma migrate dev --name phase3_community_rehearsal_plans`
Expected: migration SQL created, client regenerated

- [ ] **Step 3: Verify generate**

Run: `cd backend && npx prisma generate`
Expected: no errors

---

### Task 2: Community service + routes + tests

**Files:**
- Create: `backend/src/types/community.ts`
- Create: `backend/src/services/communityService.ts`
- Create: `backend/src/routes/community.ts`
- Modify: `backend/src/app.ts`
- Create: `backend/tests/community.test.ts`

- [ ] **Step 1: Write failing test** `creates post and lists it`

```typescript
// tests/community.test.ts — pattern from auth.test.ts
// register user A, POST /community/posts, GET /community/posts, expect title
```

- [ ] **Step 2: Implement communityService**

Functions: `listPosts`, `createPost`, `getPost`, `deletePost`, `addResponse`, `removeMyResponse`

- [ ] **Step 3: Wire routes**

```
GET    /community/posts
POST   /community/posts
GET    /community/posts/:id
DELETE /community/posts/:id
POST   /community/posts/:id/responses
DELETE /community/posts/:id/responses/me
```

- [ ] **Step 4: Run tests**

Run: `cd backend && npm test -- tests/community.test.ts`
Expected: PASS

- [ ] **Step 5: Add test** duplicate response → 409; author sees responses; non-author does not see PII list

---

### Task 3: Rehearsal plan service + routes + tests

**Files:**
- Create: `backend/src/services/rehearsalPlanService.ts`
- Modify: `backend/src/routes/bands.ts` (append plan routes)
- Create: `backend/tests/rehearsalPlans.test.ts`

- [ ] **Step 1: Write failing test** member creates plan with songs

- [ ] **Step 2: Implement service**

Functions: `listPlans(bandId, userId)`, `createPlan`, `updatePlan`, `deletePlan`  
Validate membership via existing bandService patterns.

- [ ] **Step 3: Routes**

```
GET    /bands/:bandId/rehearsal-plans
POST   /bands/:bandId/rehearsal-plans
PATCH  /bands/:bandId/rehearsal-plans/:planId
DELETE /bands/:bandId/rehearsal-plans/:planId
```

- [ ] **Step 4: Run tests**

Run: `cd backend && npm test -- tests/rehearsalPlans.test.ts`
Expected: PASS

---

### Task 4: Frontend API clients + types

**Files:**
- Create: `frontend/src/types/community.ts`
- Create: `frontend/src/api/community.ts`
- Create: `frontend/src/api/rehearsalPlans.ts`

- [ ] **Step 1: Mirror backend types** (`CommunityPostType`, summaries, plans)

- [ ] **Step 2: Export functions** `listPosts`, `createPost`, `getPost`, `respondToPost`, etc.

---

### Task 5: Nav + Community pages

**Files:**
- Modify: `frontend/src/components/layout/NavBar.tsx`
- Modify: `frontend/src/App.tsx`
- Create: `frontend/src/pages/CommunityFeed.tsx`
- Create: `frontend/src/pages/CommunityPostNew.tsx`
- Create: `frontend/src/pages/CommunityPostDetail.tsx`
- Create: `frontend/src/components/community/CommunityPostCard.tsx`
- Modify: `frontend/src/lib/i18n/zh.ts`, `en.ts`

- [ ] **Step 1: Add `nav.community` + community.* i18n keys**

- [ ] **Step 2: NavBar** — 4th link `/community` (desktop + mobile)

- [ ] **Step 3: Routes** in App.tsx

- [ ] **Step 4: CommunityFeed** — fetch list, link to new + detail, type filter optional

- [ ] **Step 5: CommunityPostNew** — form with type select

- [ ] **Step 6: CommunityPostDetail** — body, meta, 我想参加 button, author response list

---

### Task 6: RehearsalPlanPanel on BandSection

**Files:**
- Create: `frontend/src/components/band/RehearsalPlanPanel.tsx`
- Modify: `frontend/src/components/band/BandSection.tsx`

- [ ] **Step 1: Panel shows** next upcoming plan + song list

- [ ] **Step 2: Create plan dialog** — datetime, note, add/remove song rows

- [ ] **Step 3: Expand** to show past plans (simple list)

---

### Task 7: Gear shop UI shell

**Files:**
- Create: `frontend/src/pages/GearShopShell.tsx`
- Modify: `CommunityFeed.tsx` — link「器材」

- [ ] **Step 1: Static product grid** with placeholder images/icons

- [ ] **Step 2: CTA** shows toast/alert「筹备中」

---

### Task 8: README + full test run

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update Phase roadmap** — Phase 3 items

- [ ] **Step 2: Run all backend tests**

Run: `cd backend && npm test`
Expected: all pass

- [ ] **Step 3: Manual smoke** — community post + rehearsal plan on band home

---

## Plan Self-Review

| Spec requirement | Task |
|------------------|------|
| 社区 Tab | Task 5 |
| 三种帖子类型 | Task 2, 5 |
| 我想参加 | Task 2, 5 |
| 排练计划 + 曲目 | Task 3, 6 |
| 器材 UI 壳 | Task 7 |
| 非目标（投票/电商） | excluded |

No TBD placeholders in task steps above; optional `/songs` add-to-plan deferred to Phase 3.1 per spec.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-07-phase3-community.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks
2. **Inline Execution** — execute tasks in this session with checkpoints

Which approach?
