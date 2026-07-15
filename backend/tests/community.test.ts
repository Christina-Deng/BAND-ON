import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const USER_A = {
  email: 'community-a@test.com',
  password: 'secret123',
  displayName: '用户A',
};

const USER_B = {
  email: 'community-b@test.com',
  password: 'secret123',
  displayName: '用户B',
};

async function registerAndLogin(
  app: Awaited<ReturnType<typeof buildApp>>,
  user: typeof USER_A,
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

describe('community posts', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let cookieA: string;
  let cookieB: string;
  let postId: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
    cookieA = await registerAndLogin(app, USER_A);
    cookieB = await registerAndLogin(app, USER_B);
  });

  afterAll(async () => {
    await prisma.postResponse.deleteMany({
      where: { post: { author: { email: { in: [USER_A.email, USER_B.email] } } } },
    });
    await prisma.communityPost.deleteMany({
      where: { author: { email: { in: [USER_A.email, USER_B.email] } } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [USER_A.email, USER_B.email] } },
    });
    await app.close();
    await prisma.$disconnect();
  });

  it('creates post and lists it', async () => {
    const create = await app.inject({
      method: 'POST',
      url: '/community/posts',
      cookies: { token: cookieA },
      payload: {
        type: 'RECRUITMENT',
        title: '周六操场快闪缺鼓手',
        body: 'Lv3+，下午 3 点',
        location: '学校操场',
      },
    });
    expect(create.statusCode).toBe(201);
    postId = create.json().post.id;
    expect(create.json().post.title).toBe('周六操场快闪缺鼓手');

    const list = await app.inject({
      method: 'GET',
      url: '/community/posts',
      cookies: { token: cookieB },
    });
    expect(list.statusCode).toBe(200);
    expect(list.json().posts.some((p: { id: string }) => p.id === postId)).toBe(true);
  });

  it('allows response and returns 409 on duplicate', async () => {
    const respond = await app.inject({
      method: 'POST',
      url: `/community/posts/${postId}/responses`,
      cookies: { token: cookieB },
      payload: { message: '我可以，有套鼓' },
    });
    expect(respond.statusCode).toBe(201);

    const duplicate = await app.inject({
      method: 'POST',
      url: `/community/posts/${postId}/responses`,
      cookies: { token: cookieB },
      payload: { message: 'again' },
    });
    expect(duplicate.statusCode).toBe(409);
  });

  it('shows responses to author only', async () => {
    const authorView = await app.inject({
      method: 'GET',
      url: `/community/posts/${postId}`,
      cookies: { token: cookieA },
    });
    expect(authorView.statusCode).toBe(200);
    expect(authorView.json().post.isAuthor).toBe(true);
    expect(authorView.json().post.responses).toHaveLength(1);
    expect(authorView.json().post.responses[0].user.displayName).toBe('用户B');

    const viewerView = await app.inject({
      method: 'GET',
      url: `/community/posts/${postId}`,
      cookies: { token: cookieB },
    });
    expect(viewerView.statusCode).toBe(200);
    expect(viewerView.json().post.hasResponded).toBe(true);
    expect(viewerView.json().post.responses).toBeNull();
  });

  it('filters mine and sorts upcoming before latest', async () => {
    const farFuture = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const nearFuture = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const far = await app.inject({
      method: 'POST',
      url: '/community/posts',
      cookies: { token: cookieA },
      payload: {
        type: 'ANNOUNCEMENT',
        title: '下周演出',
        body: '较远的时间',
        eventAt: farFuture,
      },
    });
    const near = await app.inject({
      method: 'POST',
      url: '/community/posts',
      cookies: { token: cookieB },
      payload: {
        type: 'ANNOUNCEMENT',
        title: '后天演出',
        body: '更近的时间',
        eventAt: nearFuture,
      },
    });
    await app.inject({
      method: 'POST',
      url: '/community/posts',
      cookies: { token: cookieA },
      payload: {
        type: 'ANNOUNCEMENT',
        title: '已过期通告',
        body: '过期',
        eventAt: past,
      },
    });

    expect(far.statusCode).toBe(201);
    expect(near.statusCode).toBe(201);

    const upcoming = await app.inject({
      method: 'GET',
      url: '/community/posts?sort=upcoming',
      cookies: { token: cookieA },
    });
    expect(upcoming.statusCode).toBe(200);
    const titles = upcoming.json().posts.map((p: { title: string }) => p.title);
    const nearIdx = titles.indexOf('后天演出');
    const farIdx = titles.indexOf('下周演出');
    const pastIdx = titles.indexOf('已过期通告');
    expect(nearIdx).toBeGreaterThanOrEqual(0);
    expect(farIdx).toBeGreaterThan(nearIdx);
    expect(pastIdx).toBeGreaterThan(farIdx);

    const mine = await app.inject({
      method: 'GET',
      url: '/community/posts?mine=true&sort=latest',
      cookies: { token: cookieA },
    });
    expect(mine.statusCode).toBe(200);
    expect(
      mine.json().posts.every((p: { author: { displayName: string } }) => p.author.displayName === '用户A'),
    ).toBe(true);
  });

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

    // Flood with newer posts that have distant/no event so createdAt-window would drop the near one if limit is small.
    // > limit*3 (30) so the old in-memory window truncates; brief used 12 which cannot fail against take=limit*3.
    for (let i = 0; i < 35; i++) {
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
});
