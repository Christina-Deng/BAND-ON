import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const MEMBER = {
  email: 'plan-member@test.com',
  password: 'secret123',
  displayName: '队员',
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
  let outsiderCookie: string;
  let bandId: string;
  let planId: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
    memberCookie = await registerAndLogin(app, MEMBER);
    outsiderCookie = await registerAndLogin(app, OUTSIDER);

    const createBand = await app.inject({
      method: 'POST',
      url: '/bands',
      cookies: { token: memberCookie },
      payload: { name: '测试乐队' },
    });
    bandId = createBand.json().band.id;
  });

  afterAll(async () => {
    await prisma.rehearsalPlanSong.deleteMany({
      where: { plan: { band: { members: { some: { user: { email: MEMBER.email } } } } } },
    });
    await prisma.rehearsalPlan.deleteMany({
      where: { band: { members: { some: { user: { email: MEMBER.email } } } } },
    });
    await prisma.bandMember.deleteMany({
      where: { user: { email: { in: [MEMBER.email, OUTSIDER.email] } } },
    });
    await prisma.band.deleteMany({
      where: { members: { none: {} } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [MEMBER.email, OUTSIDER.email] } },
    });
    await app.close();
    await prisma.$disconnect();
  });

  it('member creates plan with songs', async () => {
    const create = await app.inject({
      method: 'POST',
      url: `/bands/${bandId}/rehearsal-plans`,
      cookies: { token: memberCookie },
      payload: {
        scheduledAt: '2026-07-12T14:00:00.000Z',
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
