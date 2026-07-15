import type { NotificationType, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export interface NotificationMetadata {
  actorName?: string;
  bandName?: string;
  postTitle?: string;
  durationMinutes?: number;
}

export interface NotificationView {
  id: string;
  type: NotificationType;
  metadata: NotificationMetadata;
  linkPath: string;
  readAt: string | null;
  createdAt: string;
}

export async function notifyPracticeCheckIn(input: {
  bandId: string;
  actorUserId: string;
  durationMinutes: number;
}) {
  const band = await prisma.band.findUnique({
    where: { id: input.bandId },
    include: {
      members: {
        where: { userId: { not: input.actorUserId } },
        include: { user: { select: { id: true, displayName: true } } },
      },
    },
  });
  if (!band || band.members.length === 0) return;

  const actor = await prisma.user.findUnique({
    where: { id: input.actorUserId },
    select: { displayName: true },
  });
  if (!actor) return;

  const metadata: NotificationMetadata = {
    actorName: actor.displayName,
    bandName: band.name,
    durationMinutes: input.durationMinutes,
  };

  await prisma.notification.createMany({
    data: band.members.map((member) => ({
      userId: member.userId,
      type: 'PRACTICE_CHECKIN' as const,
      metadata: metadata as Prisma.InputJsonValue,
      linkPath: '/practice',
    })),
  });
}

export async function notifyPostResponse(input: {
  postId: string;
  responderUserId: string;
}) {
  const post = await prisma.communityPost.findUnique({
    where: { id: input.postId },
    select: { id: true, title: true, authorId: true },
  });
  if (!post || post.authorId === input.responderUserId) return;

  const responder = await prisma.user.findUnique({
    where: { id: input.responderUserId },
    select: { displayName: true },
  });
  if (!responder) return;

  const metadata: NotificationMetadata = {
    actorName: responder.displayName,
    postTitle: post.title,
  };

  await prisma.notification.create({
    data: {
      userId: post.authorId,
      type: 'POST_RESPONSE',
      metadata: metadata as Prisma.InputJsonValue,
      linkPath: `/community/${post.id}`,
    },
  });
}

async function notifyBandMates(input: {
  bandId: string;
  actorUserId: string;
  type: 'REHEARSAL_PLAN_CREATED' | 'REHEARSAL_PLAN_UPDATED';
}) {
  const band = await prisma.band.findUnique({
    where: { id: input.bandId },
    include: {
      members: {
        where: { userId: { not: input.actorUserId } },
        select: { userId: true },
      },
    },
  });
  if (!band || band.members.length === 0) return;

  const actor = await prisma.user.findUnique({
    where: { id: input.actorUserId },
    select: { displayName: true },
  });
  if (!actor) return;

  const metadata: NotificationMetadata = {
    actorName: actor.displayName,
    bandName: band.name,
  };

  await prisma.notification.createMany({
    data: band.members.map((member) => ({
      userId: member.userId,
      type: input.type,
      metadata: metadata as Prisma.InputJsonValue,
      linkPath: '/',
    })),
  });
}

export async function notifyRehearsalPlanCreated(input: {
  bandId: string;
  actorUserId: string;
}) {
  await notifyBandMates({
    ...input,
    type: 'REHEARSAL_PLAN_CREATED',
  });
}

export async function notifyRehearsalPlanUpdated(input: {
  bandId: string;
  actorUserId: string;
}) {
  await notifyBandMates({
    ...input,
    type: 'REHEARSAL_PLAN_UPDATED',
  });
}

function mapNotification(row: {
  id: string;
  type: NotificationType;
  metadata: unknown;
  linkPath: string;
  readAt: Date | null;
  createdAt: Date;
}): NotificationView {
  return {
    id: row.id,
    type: row.type,
    metadata: (row.metadata ?? {}) as NotificationMetadata,
    linkPath: row.linkPath,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listNotifications(userId: string, limit = 30): Promise<NotificationView[]> {
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: Math.min(limit, 100),
  });
  return rows.map(mapNotification);
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, readAt: null },
  });
}

export async function markAsRead(userId: string, notificationId: string): Promise<void> {
  const row = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });
  if (!row) {
    throw Object.assign(new Error('通知不存在'), { statusCode: 404 });
  }
  if (row.readAt) return;

  await prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
  });
}

export async function markAllAsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}
