import type { CommunityPostType } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { notifyPostResponse } from './notificationService.js';
import type {
  CommunityPostDetail,
  CommunityPostSummary,
  CreateCommunityPostInput,
} from '../types/community.js';

const BODY_PREVIEW_LENGTH = 200;

function previewBody(body: string): string {
  if (body.length <= BODY_PREVIEW_LENGTH) return body;
  return `${body.slice(0, BODY_PREVIEW_LENGTH)}…`;
}

function toIso(date: Date | null | undefined): string | null {
  return date ? date.toISOString() : null;
}

export type CommunitySort = 'upcoming' | 'latest';

export async function listPosts(input?: {
  type?: CommunityPostType;
  limit?: number;
  sort?: CommunitySort;
  mine?: boolean;
  viewerId?: string;
}): Promise<CommunityPostSummary[]> {
  const limit = Math.min(input?.limit ?? 50, 100);
  const sort: CommunitySort = input?.sort === 'latest' ? 'latest' : 'upcoming';

  if (input?.mine && !input.viewerId) {
    throw Object.assign(new Error('未登录'), { statusCode: 401 });
  }

  const posts = await prisma.communityPost.findMany({
    where: {
      ...(input?.type ? { type: input.type } : {}),
      ...(input?.mine && input.viewerId ? { authorId: input.viewerId } : {}),
    },
    // Fetch more than limit when sorting upcoming so we can re-rank in memory.
    orderBy: { createdAt: 'desc' },
    take: sort === 'upcoming' ? Math.min(limit * 3, 150) : limit,
    include: {
      author: { select: { id: true, displayName: true } },
      _count: { select: { responses: true } },
    },
  });

  const mapped = posts.map((post) => ({
    id: post.id,
    type: post.type,
    title: post.title,
    bodyPreview: previewBody(post.body),
    eventAt: toIso(post.eventAt),
    location: post.location,
    budgetNote: post.budgetNote,
    author: post.author,
    responseCount: post._count.responses,
    createdAt: post.createdAt.toISOString(),
    _eventAtMs: post.eventAt?.getTime() ?? null,
    _createdAtMs: post.createdAt.getTime(),
  }));

  const now = Date.now();

  if (sort === 'upcoming') {
    mapped.sort((a, b) => {
      const aUpcoming = a._eventAtMs != null && a._eventAtMs >= now;
      const bUpcoming = b._eventAtMs != null && b._eventAtMs >= now;
      if (aUpcoming && bUpcoming) return (a._eventAtMs ?? 0) - (b._eventAtMs ?? 0);
      if (aUpcoming) return -1;
      if (bUpcoming) return 1;
      return b._createdAtMs - a._createdAtMs;
    });
  }

  return mapped.slice(0, limit).map(({ _eventAtMs: _e, _createdAtMs: _c, ...post }) => post);
}

export async function createPost(input: CreateCommunityPostInput) {
  const title = input.title.trim();
  const body = input.body.trim();
  if (!title) {
    throw Object.assign(new Error('请填写标题'), { statusCode: 400 });
  }
  if (!body) {
    throw Object.assign(new Error('请填写正文'), { statusCode: 400 });
  }

  const post = await prisma.communityPost.create({
    data: {
      authorId: input.authorId,
      type: input.type,
      title,
      body,
      eventAt: input.eventAt ?? null,
      location: input.location?.trim() || null,
      budgetNote: input.budgetNote?.trim() || null,
    },
    include: {
      author: { select: { id: true, displayName: true } },
      _count: { select: { responses: true } },
    },
  });

  return {
    id: post.id,
    type: post.type,
    title: post.title,
    bodyPreview: previewBody(post.body),
    eventAt: toIso(post.eventAt),
    location: post.location,
    budgetNote: post.budgetNote,
    author: post.author,
    responseCount: post._count.responses,
    createdAt: post.createdAt.toISOString(),
  } satisfies CommunityPostSummary;
}

export async function getPost(postId: string, viewerId: string): Promise<CommunityPostDetail> {
  const post = await prisma.communityPost.findUnique({
    where: { id: postId },
    include: {
      author: { select: { id: true, displayName: true } },
      responses: {
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { id: true, displayName: true } } },
      },
      _count: { select: { responses: true } },
    },
  });

  if (!post) {
    throw Object.assign(new Error('帖子不存在'), { statusCode: 404 });
  }

  const isAuthor = post.authorId === viewerId;
  const hasResponded = post.responses.some((r) => r.userId === viewerId);

  return {
    id: post.id,
    type: post.type,
    title: post.title,
    body: post.body,
    eventAt: toIso(post.eventAt),
    location: post.location,
    budgetNote: post.budgetNote,
    author: post.author,
    responseCount: post._count.responses,
    hasResponded,
    isAuthor,
    responses: isAuthor
      ? post.responses.map((r) => ({
          id: r.id,
          message: r.message,
          createdAt: r.createdAt.toISOString(),
          user: r.user,
        }))
      : null,
    createdAt: post.createdAt.toISOString(),
  };
}

export async function deletePost(postId: string, userId: string): Promise<void> {
  const post = await prisma.communityPost.findUnique({ where: { id: postId } });
  if (!post) {
    throw Object.assign(new Error('帖子不存在'), { statusCode: 404 });
  }
  if (post.authorId !== userId) {
    throw Object.assign(new Error('无权删除该帖子'), { statusCode: 403 });
  }
  await prisma.communityPost.delete({ where: { id: postId } });
}

export async function addResponse(input: {
  postId: string;
  userId: string;
  message?: string | null;
}) {
  const post = await prisma.communityPost.findUnique({ where: { id: input.postId } });
  if (!post) {
    throw Object.assign(new Error('帖子不存在'), { statusCode: 404 });
  }
  if (post.authorId === input.userId) {
    throw Object.assign(new Error('不能报名自己的帖子'), { statusCode: 400 });
  }

  const existing = await prisma.postResponse.findUnique({
    where: { postId_userId: { postId: input.postId, userId: input.userId } },
  });
  if (existing) {
    throw Object.assign(new Error('你已经报过名了'), { statusCode: 409 });
  }

  const response = await prisma.postResponse.create({
    data: {
      postId: input.postId,
      userId: input.userId,
      message: input.message?.trim() || null,
    },
    include: { user: { select: { id: true, displayName: true } } },
  });

  await notifyPostResponse({
    postId: input.postId,
    responderUserId: input.userId,
  });

  return {
    id: response.id,
    message: response.message,
    createdAt: response.createdAt.toISOString(),
    user: response.user,
  };
}

export async function removeMyResponse(postId: string, userId: string): Promise<void> {
  const existing = await prisma.postResponse.findUnique({
    where: { postId_userId: { postId, userId } },
  });
  if (!existing) {
    throw Object.assign(new Error('尚未报名'), { statusCode: 404 });
  }
  await prisma.postResponse.delete({ where: { id: existing.id } });
}
