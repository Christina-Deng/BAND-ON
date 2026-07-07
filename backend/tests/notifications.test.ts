import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const AUTHOR = {
  email: 'notify-author@test.com',
  password: 'secret123',
  displayName: '帖主',
};

const MEMBER = {
  email: 'notify-member@test.com',
  password: 'secret123',
  displayName: '队友',
};

const RESPONDER = {
  email: 'notify-responder@test.com',
  password: 'secret123',
  displayName: '报名者',
};

async function registerAndLogin(
  app: Awaited<ReturnType<typeof buildApp>>,
  user: typeof AUTHOR,
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

describe('notifications', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let authorCookie: string;
  let memberCookie: string;
  let responderCookie: string;
  let bandId: string;
  let postId: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
    authorCookie = await registerAndLogin(app, AUTHOR);
    memberCookie = await registerAndLogin(app, MEMBER);
    responderCookie = await registerAndLogin(app, RESPONDER);

    const bandRes = await app.inject({
      method: 'POST',
      url: '/bands',
      cookies: { token: authorCookie },
      payload: { name: '通知测试乐队' },
    });
    bandId = bandRes.json().band.id;

    await app.inject({
      method: 'POST',
      url: '/bands/join',
      cookies: { token: memberCookie },
      payload: { inviteCode: bandRes.json().band.inviteCode },
    });

    const postRes = await app.inject({
      method: 'POST',
      url: '/community/posts',
      cookies: { token: authorCookie },
      payload: {
        type: 'RECRUITMENT',
        title: '缺鼓手',
        body: '来报名',
      },
    });
    postId = postRes.json().post.id;
  });

  afterAll(async () => {
    await prisma.notification.deleteMany({
      where: {
        user: { email: { in: [AUTHOR.email, MEMBER.email, RESPONDER.email] } },
      },
    });
    await prisma.postResponse.deleteMany({
      where: { post: { author: { email: AUTHOR.email } } },
    });
    await prisma.communityPost.deleteMany({
      where: { author: { email: AUTHOR.email } },
    });
    await prisma.practiceLog.deleteMany({
      where: { band: { name: '通知测试乐队' } },
    });
    await prisma.bandMember.deleteMany({
      where: { user: { email: { in: [AUTHOR.email, MEMBER.email, RESPONDER.email] } } },
    });
    await prisma.band.deleteMany({ where: { name: '通知测试乐队' } });
    await prisma.user.deleteMany({
      where: { email: { in: [AUTHOR.email, MEMBER.email, RESPONDER.email] } },
    });
    await app.close();
    await prisma.$disconnect();
  });

  it('notifies bandmates on practice check-in', async () => {
    const boundary = '----testboundary';
    const body = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="bandId"',
      '',
      bandId,
      `--${boundary}`,
      'Content-Disposition: form-data; name="durationMinutes"',
      '',
      '30',
      `--${boundary}--`,
      '',
    ].join('\r\n');

    await app.inject({
      method: 'POST',
      url: '/practices',
      cookies: { token: authorCookie },
      headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
      payload: body,
    });

    const countRes = await app.inject({
      method: 'GET',
      url: '/notifications/unread-count',
      cookies: { token: memberCookie },
    });
    expect(countRes.json().count).toBeGreaterThanOrEqual(1);

    const listRes = await app.inject({
      method: 'GET',
      url: '/notifications',
      cookies: { token: memberCookie },
    });
    const hit = listRes.json().notifications.find(
      (n: { type: string }) => n.type === 'PRACTICE_CHECKIN',
    );
    expect(hit?.metadata.actorName).toBe('帖主');
    expect(hit?.linkPath).toBe('/practice');
  });

  it('notifies post author on response', async () => {
    await app.inject({
      method: 'POST',
      url: `/community/posts/${postId}/responses`,
      cookies: { token: responderCookie },
      payload: { message: '我可以' },
    });

    const countRes = await app.inject({
      method: 'GET',
      url: '/notifications/unread-count',
      cookies: { token: authorCookie },
    });
    expect(countRes.json().count).toBeGreaterThanOrEqual(1);

    const listRes = await app.inject({
      method: 'GET',
      url: '/notifications',
      cookies: { token: authorCookie },
    });
    const hit = listRes.json().notifications.find(
      (n: { type: string }) => n.type === 'POST_RESPONSE',
    );
    expect(hit?.metadata.actorName).toBe('报名者');
    expect(hit?.linkPath).toBe(`/community/${postId}`);
  });

  it('marks all notifications as read', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/notifications/mark-all-read',
      cookies: { token: memberCookie },
    });
    expect(res.statusCode).toBe(200);

    const countRes = await app.inject({
      method: 'GET',
      url: '/notifications/unread-count',
      cookies: { token: memberCookie },
    });
    expect(countRes.json().count).toBe(0);
  });
});
