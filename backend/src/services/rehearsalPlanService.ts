import { prisma } from '../lib/prisma.js';
import {
  notifyRehearsalPlanCreated,
  notifyRehearsalPlanUpdated,
} from './notificationService.js';
import type {
  CreateRehearsalPlanInput,
  RehearsalPlanView,
  UpdateRehearsalPlanInput,
} from '../types/community.js';

async function assertBandMember(bandId: string, userId: string) {
  const membership = await prisma.bandMember.findUnique({
    where: { bandId_userId: { bandId, userId } },
  });
  if (!membership) {
    throw Object.assign(new Error('Not a band member'), { statusCode: 403 });
  }
}

function mapPlan(plan: {
  id: string;
  bandId: string;
  scheduledAt: Date;
  note: string | null;
  createdById: string;
  createdAt: Date;
  songs: Array<{
    id: string;
    songTitle: string;
    songId: string | null;
    sortOrder: number;
  }>;
}): RehearsalPlanView {
  return {
    id: plan.id,
    bandId: plan.bandId,
    scheduledAt: plan.scheduledAt.toISOString(),
    note: plan.note,
    createdById: plan.createdById,
    createdAt: plan.createdAt.toISOString(),
    songs: plan.songs.map((song) => ({
      id: song.id,
      songTitle: song.songTitle,
      songId: song.songId,
      sortOrder: song.sortOrder,
    })),
  };
}

const planInclude = {
  songs: { orderBy: { sortOrder: 'asc' as const } },
};

function songTitlesKey(songs: Array<{ songTitle: string }>): string {
  return songs.map((s) => s.songTitle.trim()).join('\u0000');
}

export async function listPlans(bandId: string, userId: string): Promise<RehearsalPlanView[]> {
  await assertBandMember(bandId, userId);

  const plans = await prisma.rehearsalPlan.findMany({
    where: { bandId },
    orderBy: { scheduledAt: 'desc' },
    include: planInclude,
  });

  return plans.map(mapPlan);
}

export async function createPlan(input: CreateRehearsalPlanInput): Promise<RehearsalPlanView> {
  await assertBandMember(input.bandId, input.userId);

  const songs = input.songs ?? [];
  for (const song of songs) {
    if (!song.songTitle.trim()) {
      throw Object.assign(new Error('请填写曲目名称'), { statusCode: 400 });
    }
  }

  const plan = await prisma.rehearsalPlan.create({
    data: {
      bandId: input.bandId,
      scheduledAt: input.scheduledAt,
      note: input.note?.trim() || null,
      createdById: input.userId,
      songs: {
        create: songs.map((song, index) => ({
          songTitle: song.songTitle.trim(),
          songId: song.songId?.trim() || null,
          sortOrder: index,
        })),
      },
    },
    include: planInclude,
  });

  await notifyRehearsalPlanCreated({
    bandId: input.bandId,
    actorUserId: input.userId,
  });

  return mapPlan(plan);
}

export async function updatePlan(input: UpdateRehearsalPlanInput): Promise<RehearsalPlanView> {
  await assertBandMember(input.bandId, input.userId);

  const existing = await prisma.rehearsalPlan.findFirst({
    where: { id: input.planId, bandId: input.bandId },
    include: planInclude,
  });
  if (!existing) {
    throw Object.assign(new Error('排练计划不存在'), { statusCode: 404 });
  }

  if (input.songs) {
    for (const song of input.songs) {
      if (!song.songTitle.trim()) {
        throw Object.assign(new Error('请填写曲目名称'), { statusCode: 400 });
      }
    }
  }

  const timeChanged =
    input.scheduledAt !== undefined &&
    input.scheduledAt.getTime() !== existing.scheduledAt.getTime();
  const songsChanged =
    input.songs !== undefined &&
    songTitlesKey(input.songs) !== songTitlesKey(existing.songs);

  const plan = await prisma.$transaction(async (tx) => {
    if (input.songs) {
      await tx.rehearsalPlanSong.deleteMany({ where: { planId: input.planId } });
    }

    return tx.rehearsalPlan.update({
      where: { id: input.planId },
      data: {
        ...(input.scheduledAt !== undefined ? { scheduledAt: input.scheduledAt } : {}),
        ...(input.note !== undefined ? { note: input.note?.trim() || null } : {}),
        ...(input.songs
          ? {
              songs: {
                create: input.songs.map((song, index) => ({
                  songTitle: song.songTitle.trim(),
                  songId: song.songId?.trim() || null,
                  sortOrder: index,
                })),
              },
            }
          : {}),
      },
      include: planInclude,
    });
  });

  if (timeChanged || songsChanged) {
    await notifyRehearsalPlanUpdated({
      bandId: input.bandId,
      actorUserId: input.userId,
    });
  }

  return mapPlan(plan);
}

export async function deletePlan(bandId: string, planId: string, userId: string): Promise<void> {
  await assertBandMember(bandId, userId);

  const existing = await prisma.rehearsalPlan.findFirst({
    where: { id: planId, bandId },
  });
  if (!existing) {
    throw Object.assign(new Error('排练计划不存在'), { statusCode: 404 });
  }

  await prisma.rehearsalPlan.delete({ where: { id: planId } });
}
