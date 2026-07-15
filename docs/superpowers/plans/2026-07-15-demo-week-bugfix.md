# Demo-Week Bugfix Pack A — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix seven demo-facing bugs (invite copy, join errors, upcoming sort truncation, rehearsal notification deep links, silent failures, songId loss on edit, community feed races) without security/P2 polish.

**Architecture:** Directed patches per area. Community `upcoming` uses two Prisma queries (future by `eventAt ASC`, then fill with null/past by `createdAt DESC`) instead of `createdAt`-window + in-memory sort. Rehearsal notifications embed `/?bandId=…#rehearsal-plan`; BandHome scrolls to the matching section. Frontend races use request-id guards; mark-read and refresh paths get try/catch.

**Tech Stack:** Fastify + Prisma (SQLite/Postgres via existing prisma), React + React Router, Vite frontend, Vitest/Node test inject suite under `backend/tests`.

## Global Constraints

- Scope = design spec A only (`docs/superpowers/specs/2026-07-15-demo-week-bugfix-design.md`); no JWT/uploads/CORS/P2 polish.
- Commit style: `feat:` / `fix:` + Chinese body; local only, **do not push**.
- Do not commit `.cursor/` or `.vercel/`.
- Prefer existing helpers: `getApiErrorMessage`, `t('common.retry')`, `t('common.requestFailed')`.

## File map

| File | Responsibility |
|------|----------------|
| `frontend/src/lib/i18n/zh.ts`, `en.ts` | Invite placeholder + notification load/mark-read error strings if needed |
| `frontend/src/components/band/JoinBandForm.tsx` | Join error mapping |
| `backend/src/services/communityService.ts` | upcoming list queries |
| `backend/tests/community.test.ts` | Truncation regression test |
| `backend/src/services/notificationService.ts` | rehearsal `linkPath` |
| `frontend/src/pages/BandHome.tsx`, `BandSection.tsx`, `RehearsalPlanPanel.tsx` | Deep-link scroll target + songId draft |
| `frontend/src/pages/CommunityFeed.tsx` | Race guard + retry |
| `frontend/src/components/layout/NotificationBell.tsx` | Mark-read / load error handling |
| `frontend/src/pages/Practice.tsx` | Refresh error UI |
| `frontend/src/components/band/BandSection.tsx`, `shared/SkillQuestionnaire.tsx` | Profile submit errors |
| `backend/tests/rehearsalPlans.test.ts` or `notifications.test.ts` | linkPath + songId assertions |

---

### Task 1: Invite code copy + join error mapping

**Files:**
- Modify: `frontend/src/lib/i18n/zh.ts` (`band.joinForm.codePlaceholder`)
- Modify: `frontend/src/lib/i18n/en.ts` (same key)
- Modify: `frontend/src/components/band/JoinBandForm.tsx`
- Test: manual + grep for leftover「6 位」/「6-character」 under joinForm

**Interfaces:**
- Consumes: `getApiErrorMessage` from `frontend/src/api/client.ts`
- Produces: Join form shows accurate 8-char copy; non-code failures show API/fallback message

- [ ] **Step 1: Update i18n placeholders**

`zh.ts`: `codePlaceholder: '输入 8 位邀请码'`  
`en.ts`: `codePlaceholder: 'Enter 8-character invite code'`

- [ ] **Step 2: Fix JoinBandForm catch**

```tsx
import { getApiErrorMessage } from '../../api/client';
// ...
} catch (err) {
  setError(getApiErrorMessage(err, t('band.joinForm.invalidCode')));
}
```

- [ ] **Step 3: Grep sanity**

Run: `rg "6 位邀请|6-character invite" frontend/src/lib/i18n`  
Expected: no matches under joinForm (market price 「8–12」 strings may remain).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/i18n/zh.ts frontend/src/lib/i18n/en.ts frontend/src/components/band/JoinBandForm.tsx
git commit -m "$(cat <<'EOF'
fix: 邀请码改为 8 位文案，加入失败不再一律显示无效码

EOF
)"
```

---

### Task 2: Community upcoming sort without truncation

**Files:**
- Modify: `backend/src/services/communityService.ts` (`listPosts`)
- Modify: `backend/tests/community.test.ts`
- Test: `cd backend && npm test -- community.test.ts`

**Interfaces:**
- Consumes: existing `listPosts` input shape (`type`, `limit`, `sort`, `mine`, `viewerId`)
- Produces: same `CommunityPostSummary[]`; upcoming = future(`eventAt ASC`) then fillers(`createdAt DESC`)

- [ ] **Step 1: Write failing truncation test**

Append to `community.test.ts`:

```ts
it('upcoming includes older near-future posts even when feed is busy with newer posts', async () => {
  const nearFuture = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();

  const nearOld = await app.inject({
    method: 'POST',
    url: '/community/posts',
    cookies: { token: cookieA },
    payload: {
      type: 'ANNOUNCEMENT',
      title: '旧帖但临近',
      body: 'created earlier, event soon',
      eventAt: nearFuture,
    },
  });
  expect(nearOld.statusCode).toBe(201);

  // Flood with newer posts that have distant/no event so createdAt-window would drop the near one if limit is small
  for (let i = 0; i < 12; i++) {
    const res = await app.inject({
      method: 'POST',
      url: '/community/posts',
      cookies: { token: cookieB },
      payload: {
        type: 'ANNOUNCEMENT',
        title: `新噪声帖${i}`,
        body: 'noise',
      },
    });
    expect(res.statusCode).toBe(201);
  }

  const upcoming = await app.inject({
    method: 'GET',
    url: '/community/posts?sort=upcoming&limit=10',
    cookies: { token: cookieA },
  });
  expect(upcoming.statusCode).toBe(200);
  const titles = upcoming.json().posts.map((p: { title: string }) => p.title);
  expect(titles).toContain('旧帖但临近');
  expect(titles.indexOf('旧帖但临近')).toBe(0);
});
```

If route ignores `limit` query, pass limit only via service unit test OR extend route to accept `limit` — **prefer**: check `community.ts` route; if no `limit` query, add optional `limit` query parse (`Math.min(Number(limit)||50, 100)`) so the inject test works. Inspect `backend/src/routes/community.ts` before writing.

- [ ] **Step 2: Run test — expect FAIL**

Run: `cd backend && npm test -- community.test.ts`  
Expected: FAIL because near-old post missing or not first.

- [ ] **Step 3: Rewrite `listPosts` upcoming branch**

Keep `mapPost`-style mapping helper (extract existing map if needed). Pseudocode:

```ts
const baseWhere = {
  ...(input?.type ? { type: input.type } : {}),
  ...(input?.mine && input.viewerId ? { authorId: input.viewerId } : {}),
};

if (sort === 'latest') {
  const posts = await prisma.communityPost.findMany({
    where: baseWhere,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { author: { select: { id: true, displayName: true } }, _count: { select: { responses: true } } },
  });
  return posts.map(toSummary);
}

const now = new Date();
const upcomingRows = await prisma.communityPost.findMany({
  where: { ...baseWhere, eventAt: { gte: now } },
  orderBy: { eventAt: 'asc' },
  take: limit,
  include: { /* same */ },
});

const remaining = limit - upcomingRows.length;
let fillers: typeof upcomingRows = [];
if (remaining > 0) {
  fillers = await prisma.communityPost.findMany({
    where: {
      ...baseWhere,
      OR: [{ eventAt: null }, { eventAt: { lt: now } }],
    },
    orderBy: { createdAt: 'desc' },
    take: remaining,
    include: { /* same */ },
  });
}

return [...upcomingRows, ...fillers].map(toSummary);
```

Remove the old `limit*3` + in-memory sort path.

- [ ] **Step 4: Run tests — expect PASS**

Run: `cd backend && npm test -- community.test.ts`  
Expected: all community tests PASS (including existing upcoming order test).

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/communityService.ts backend/src/routes/community.ts backend/tests/community.test.ts
git commit -m "$(cat <<'EOF'
fix: 社区即将开始排序改为按活动时间取帖，避免漏掉旧帖

EOF
)"
```

---

### Task 3: Rehearsal notification deep link + BandHome scroll

**Files:**
- Modify: `backend/src/services/notificationService.ts` (`notifyBandMates` `linkPath`)
- Modify: `frontend/src/pages/BandHome.tsx`
- Modify: `frontend/src/components/band/BandSection.tsx` (wrap / `id` / pass scroll)
- Modify: `frontend/src/components/band/RehearsalPlanPanel.tsx` (`id="rehearsal-plan"` on root)
- Modify: `backend/tests/rehearsalPlans.test.ts` and/or `notifications.test.ts`
- Test: backend assert `linkPath` contains `bandId`

**Interfaces:**
- Produces: `linkPath` format exactly `` `/?bandId=${bandId}#rehearsal-plan` ``
- Frontend: on `/` with `bandId` query, scroll `document.getElementById(\`band-${bandId}\`)` or the panel inside it; panel root has `id="rehearsal-plan"` only when focused OR use `id={\`band-${band.id}-rehearsal\`}` and hash `#band-<id>-rehearsal` — **lock to:**  
  - Section wrapper: `id={`band-${band.id}`}`  
  - Plan panel root: `id="rehearsal-plan"` when `band.id === highlightBandId` else omit duplicate ids  
  - OR simpler: panel always `id={`rehearsal-plan-${bandId}`}` and linkPath `#rehearsal-plan-${bandId}`  

**Locked convention (implement this):**
- `linkPath = \`/?bandId=${bandId}#rehearsal-plan\``
- `BandSection` outer: `id={\`band-${band.id}\`}`
- `RehearsalPlanPanel` root: `id="rehearsal-plan"` **only on the section matching query `bandId`** (pass `isDeepLinkTarget` prop), so one `#rehearsal-plan` in DOM
- `BandHome`: `useSearchParams`; if `bandId` present and found in `bands`, `requestAnimationFrame` / `setTimeout(0)` → `document.getElementById('rehearsal-plan')?.scrollIntoView({ behavior: 'smooth', block: 'start' })`; optional ring class 2s

- [ ] **Step 1: Failing assertion on create notify linkPath**

In rehearsal/notifications test after create plan as member A, list notifications as B:

```ts
expect(notif.linkPath).toBe(`/?bandId=${bandId}#rehearsal-plan`);
```

- [ ] **Step 2: Run — FAIL** (still `/`)

- [ ] **Step 3: Change `notifyBandMates`**

```ts
linkPath: `/?bandId=${input.bandId}#rehearsal-plan`,
```

`notifyBandMates` already receives `bandId`.

- [ ] **Step 4: Frontend deep-link scroll** as locked above; clear query with `navigate` replace optional after scroll to avoid re-scroll on refresh (replace dropping `bandId` is OK if hash remains, or leave params).

- [ ] **Step 5: Tests PASS + Commit**

```bash
git commit -m "$(cat <<'EOF'
feat: 排练计划通知深链到对应乐队计划区

EOF
)"
```

---

### Task 4: Preserve `songId` on rehearsal plan edit

**Files:**
- Modify: `frontend/src/components/band/RehearsalPlanPanel.tsx` (`SongDraft`, `openEditForm`, submit already spreads songs)
- Modify: `backend/tests/rehearsalPlans.test.ts`
- Test: create with songId → PATCH same titles → GET still has songId

**Interfaces:**
- `SongDraft = { songTitle: string; songId?: string | null }`
- Backend already writes `song.songId?.trim() || null` on update

- [ ] **Step 1: Backend test**

```ts
it('update keeps songId when client resends it', async () => {
  const created = await app.inject({ /* create with songs: [{ songTitle: 'A', songId: 'song-001' }] */ });
  const planId = created.json().plan.id;
  await app.inject({
    method: 'PATCH',
    url: `/bands/${bandId}/rehearsal-plans/${planId}`,
    cookies: { token: cookieA },
    payload: {
      note: 'only note',
      songs: [{ songTitle: 'A', songId: 'song-001' }],
    },
  });
  const listed = await app.inject({ method: 'GET', url: `/bands/${bandId}/rehearsal-plans`, cookies: { token: cookieA } });
  expect(listed.json().plans[0].songs[0].songId).toBe('song-001');
});
```

Note: note-only path that **omits** `songs` already preserves rows; the bug is UI omitting songId when it **sends** songs. Test the resend path.

- [ ] **Step 2: Frontend draft**

```ts
interface SongDraft {
  songTitle: string;
  songId?: string | null;
}
// openEditForm:
setSongs(plan.songs.map((s) => ({ songTitle: s.songTitle, songId: s.songId })));
// submit filteredSongs already includes songId fields
```

When adding a blank row: `{ songTitle: '' }` (no songId).

- [ ] **Step 3: Commit**

```bash
git commit -m "$(cat <<'EOF'
fix: 编辑排练计划时保留曲目 songId

EOF
)"
```

---

### Task 5: Community feed race guard + retry

**Files:**
- Modify: `frontend/src/pages/CommunityFeed.tsx`
- Test: manual rapid filter toggle; error button uses `t('common.retry')`

- [ ] **Step 1: Replace effect with guarded fetch**

```tsx
useEffect(() => {
  let cancelled = false;
  const requestId = Symbol('feed');
  // or use incrementing let seq = ++fetchSeq
  setStatus('loading');
  void listCommunityPosts({...})
    .then((items) => {
      if (cancelled) return;
      setPosts(items);
      setStatus('ok');
    })
    .catch((err) => {
      if (cancelled) return;
      setError(getApiErrorMessage(err));
      setStatus('error');
    });
  return () => { cancelled = true; };
}, [filter, sort, mineOnly]);
```

Prefer numeric `reqId` ref if overlapping strict-mode double mount must still apply latest — pattern:

```tsx
const reqIdRef = useRef(0);
useEffect(() => {
  const id = ++reqIdRef.current;
  setStatus('loading');
  void listCommunityPosts(...).then((items) => {
    if (id !== reqIdRef.current) return;
    ...
  });
}, [...]);
```

- [ ] **Step 2: Error UI retry**

```tsx
{status === 'error' && (
  <div className="...">
    <p>{error}</p>
    <button type="button" onClick={() => { /* bump reloadKey state */ }}>
      {t('common.retry')}
    </button>
  </div>
)}
```

Add `reloadKey` to deps or call a `load()` function shared by effect and button.

- [ ] **Step 3: Commit**

```bash
git commit -m "$(cat <<'EOF'
fix: 社区列表请求防竞态并支持失败重试

EOF
)"
```

---

### Task 6: Notification / Practice / profile silent failures

**Files:**
- Modify: `frontend/src/components/layout/NotificationBell.tsx`
- Modify: `frontend/src/pages/Practice.tsx`
- Modify: `frontend/src/components/band/BandSection.tsx`
- Modify: `frontend/src/components/shared/SkillQuestionnaire.tsx`
- Modify: `frontend/src/lib/i18n/zh.ts`, `en.ts` — add under `notifications`: `loadFailed`, `markReadFailed` if no suitable key (else reuse `common.requestFailed`)

**Interfaces:**
- SkillQuestionnaire: keep showing dialog on error; add `error` state string above actions
- BandSection `handleProfileSubmit`: rethrow or return; questionnaire catches

- [ ] **Step 1: NotificationBell**

```tsx
const [panelError, setPanelError] = useState('');

// loadPanel catch:
catch {
  setPanelError(t('common.requestFailed'));
  setItems([]);
}

// handleItemClick:
try {
  if (!notification.readAt) {
    await markNotificationRead(notification.id);
    setUnreadCount(...);
    setItems(...);
  }
  setOpen(false);
  navigate(notification.linkPath);
} catch {
  setPanelError(t('common.requestFailed'));
  // do not navigate if mark-read failed? Spec: revert optimistic — so only update UI after await success (already the case if we move setState after await). Keep navigate even if mark fails OR block navigate — **prefer: still navigate, show error toast/panelError, refreshUnreadCount**.
}

// handleMarkAllRead try/catch; on failure do not zero badge
```

Show `panelError` in panel body when set.

- [ ] **Step 2: Practice.tsx**

```tsx
const [refreshError, setRefreshError] = useState('');
const refresh = useCallback(async () => {
  if (!viewBandId) return;
  try {
    setRefreshError('');
    const [monthData, todayData] = await Promise.all([...]);
    setPractices(monthData);
    setTodayMembers(todayData);
  } catch (err) {
    setRefreshError(getApiErrorMessage(err, t('common.requestFailed')));
  }
}, [...]);
```

Also wrap `refreshCheckInStatus` similarly. Render `refreshError` near header.

- [ ] **Step 3: Questionnaire**

```tsx
const [error, setError] = useState('');
async function handleSubmit(...) {
  setLoading(true);
  setError('');
  try {
    await onSubmit(...);
    onClose();
  } catch (err) {
    setError(getApiErrorMessage(err, t('common.saveFailed')));
  } finally {
    setLoading(false);
  }
}
```

`BandSection.handleProfileSubmit` can stay as-is (errors propagate).

- [ ] **Step 4: Commit**

```bash
git commit -m "$(cat <<'EOF'
fix: 通知已读、打卡刷新与资料问卷失败时给出可见反馈

EOF
)"
```

---

### Task 7: Final verification

**Files:** none new

- [ ] **Step 1: Run backend tests**

`cd backend && npm test`  
Expected: PASS

- [ ] **Step 2: Frontend typecheck if available**

`cd frontend && npm run build` (or `tsc --noEmit` per package scripts)  
Expected: success

- [ ] **Step 3: Manual smoke checklist from spec §5**

Invite placeholder, upcoming order, notification scroll, songId edit, filter spam, error UIs.

- [ ] **Step 4: `git status` — only intentional files; branch ahead of origin; no push**

---

## Spec coverage check

| Spec # | Task |
|--------|------|
| 1 Invite 8-char | Task 1 |
| 2 Join error mapping | Task 1 |
| 3 upcoming SQL/two-query | Task 2 |
| 4 deep link | Task 3 |
| 5 silent failures | Task 6 |
| 6 songId | Task 4 |
| 7 feed race + retry | Task 5 |
| Local commit, no push | each task + Task 7 |

## Placeholder scan

No TBD / “add appropriate handling” left; `limit` query note in Task 2 is an explicit inspect step.
