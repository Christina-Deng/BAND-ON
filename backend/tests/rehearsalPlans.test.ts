import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const MEMBER = {
  email: 'plan-member@test.com',
  password: 'secret123',
  displayName: '队员',
};

const TEAMMATE = {
  email: 'plan-teammate@test.com',
  password: 'secret123',
  displayName: '队友',
};

const OUTSIDER = {
  email: 'plan-outsider@test.com',
  password: 'secret123',
  displayName: '路人',
};

async function registerAndLogin(
  app: Awaited<ReturnType<typeof buildApp>>,
  user: typeof MEMBER,
) {
  await app.inject({
    method: 'POST',
    url: '/auth/register',
    payload: user,
  });

  const login = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { email: user.email, password: user.password },
  });

  const cookie = login.cookies.find((c) => c.name === 'token');
  if (!cookie?.value) throw new Error('missing auth cookie');
  return cookie.value;
}

describe('rehearsal plans', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let memberCookie: string;
  let teammateCookie: string;
  let outsiderCookie: string;
  let bandId: string;
  let inviteCode: string;
  let planId: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
    memberCookie = await registerAndLogin(app, MEMBER);
    teammateCookie = await registerAndLogin(app, TEAMMATE);
    outsiderCookie = await registerAndLogin(app, OUTSIDER);

    const createBand = await app.inject({
      method: 'POST',
      url: '/bands',
      cookies: { token: memberCookie },
      payload: { name: '测试乐队' },
    });
    bandId = createBand.json().band.id;
    inviteCode = createBand.json().band.inviteCode;

    await app.inject({
      method: 'POST',
      url: '/bands/join',
      cookies: { token: teammateCookie },
      payload: { inviteCode },
    });
  });

  afterAll(async () => {
    await prisma.notification.deleteMany({
      where: {
        user: { email: { in: [MEMBER.email, TEAMMATE.email, OUTSIDER.email] } },
      },
    });
    await prisma.rehearsalPlanSong.deleteMany({
      where: { plan: { band: { members: { some: { user: { email: MEMBER.email } } } } } },
    });
    await prisma.rehearsalPlan.deleteMany({
      where: { band: { members: { some: { user: { email: MEMBER.email } } } } },
    });
    await prisma.bandMember.deleteMany({
      where: { user: { email: { in: [MEMBER.email, TEAMMATE.email, OUTSIDER.email] } } },
    });
    await prisma.band.deleteMany({
      where: { members: { none: {} } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [MEMBER.email, TEAMMATE.email, OUTSIDER.email] } },
    });
    await app.close();
    await prisma.$disconnect();
  });

  it('member creates plan with songs and notifies teammates', async () => {
    const create = await app.inject({
      method: 'POST',
      url: `/bands/${bandId}/rehearsal-plans`,
      cookies: { token: memberCookie },
      payload: {
        scheduledAt: '2026-08-12T14:00:00.000Z',
        note: '第一次合练',
        songs: [{ songTitle: '晴天' }, { songTitle: '七里香' }],
      },
    });
    expect(create.statusCode).toBe(201);
    planId = create.json().plan.id;
    expect(create.json().plan.songs).toHaveLength(2);

    const list = await app.inject({
      method: 'GET',
      url: `/bands/${bandId}/rehearsal-plans`,
      cookies: { token: memberCookie },
    });
    expect(list.statusCode).toBe(200);
    expect(list.json().plans.some((p: { id: string }) => p.id === planId)).toBe(true);

    const notes = await app.inject({
      method: 'GET',
      url: '/notifications',
      cookies: { token: teammateCookie },
    });
    expect(notes.statusCode).toBe(200);
    expect(
      notes.json().notifications.some(
        (n: { type: string }) => n.type === 'REHEARSAL_PLAN_CREATED',
      ),
    ).toBe(true);
  });

  it('notifies on song change but not on note-only update', async () => {
    const before = await app.inject({
      method: 'GET',
      url: '/notifications',
      cookies: { token: teammateCookie },
    });
    const beforeCount = before.json().notifications.filter(
      (n: { type: string }) => n.type === 'REHEARSAL_PLAN_UPDATED',
    ).length;

    const noteOnly = await app.inject({
      method: 'PATCH',
      url: `/bands/${bandId}/rehearsal-plans/${planId}`,
      cookies: { token: memberCookie },
      payload: {
        scheduledAt: '2026-08-12T14:00:00.000Z',
        note: '只改备注',
        songs: [{ songTitle: '晴天' }, { songTitle: '七里香' }],
      },
    });
    expect(noteOnly.statusCode).toBe(200);

    const afterNote = await app.inject({
      method: 'GET',
      url: '/notifications',
      cookies: { token: teammateCookie },
    });
    const afterNoteCount = afterNote.json().notifications.filter(
      (n: { type: string }) => n.type === 'REHEARSAL_PLAN_UPDATED',
    ).length;
    expect(afterNoteCount).toBe(beforeCount);

    const songChange = await app.inject({
      method: 'PATCH',
      url: `/bands/${bandId}/rehearsal-plans/${planId}`,
      cookies: { token: memberCookie },
      payload: {
        scheduledAt: '2026-08-12T14:00:00.000Z',
        note: '只改备注',
        songs: [{ songTitle: '晴天' }, { songTitle: '七里香' }, { songTitle: '稻香' }],
      },
    });
    expect(songChange.statusCode).toBe(200);

    const afterSongs = await app.inject({
      method: 'GET',
      url: '/notifications',
      cookies: { token: teammateCookie },
    });
    const afterSongsCount = afterSongs.json().notifications.filter(
      (n: { type: string }) => n.type === 'REHEARSAL_PLAN_UPDATED',
    ).length;
    expect(afterSongsCount).toBe(beforeCount + 1);
  });

  it('deletes plan without notifying', async () => {
    const before = await app.inject({
      method: 'GET',
      url: '/notifications/unread-count',
      cookies: { token: teammateCookie },
    });
    const beforeCount = before.json().count as number;

    const del = await app.inject({
      method: 'DELETE',
      url: `/bands/${bandId}/rehearsal-plans/${planId}`,
      cookies: { token: memberCookie },
    });
    expect(del.statusCode).toBe(204);

    const after = await app.inject({
      method: 'GET',
      url: '/notifications/unread-count',
      cookies: { token: teammateCookie },
    });
    expect(after.json().count).toBe(beforeCount);
  });

  it('rejects non-member with 403', async () => {
    const list = await app.inject({
      method: 'GET',
      url: `/bands/${bandId}/rehearsal-plans`,
      cookies: { token: outsiderCookie },
    });
    expect(list.statusCode).toBe(403);
  });
});
