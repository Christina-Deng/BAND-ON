import crypto from 'node:crypto';
import { Instrument, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import {
  calculateSkillLevel,
  type QuestionnaireAnswers,
} from './skillAssessment.js';

function generateInviteCode(): string {
  return crypto.randomBytes(4).toString('hex');
}

export async function createBand(input: {
  userId: string;
  name: string;
  stylePreferences?: string[];
}) {
  let inviteCode = generateInviteCode();
  while (await prisma.band.findUnique({ where: { inviteCode } })) {
    inviteCode = generateInviteCode();
  }

  const band = await prisma.band.create({
    data: {
      name: input.name,
      stylePreferences:
        input.stylePreferences && input.stylePreferences.length > 0
          ? input.stylePreferences
          : undefined,
      inviteCode,
      createdById: input.userId,
      members: {
        create: {
          userId: input.userId,
          instrument: Instrument.OTHER,
          skillLevel: 1,
        },
      },
    },
    include: {
      members: {
        include: { user: { select: { id: true, displayName: true } } },
      },
    },
  });

  return band;
}

export async function joinBand(input: { userId: string; inviteCode: string }) {
  const band = await prisma.band.findUnique({ where: { inviteCode: input.inviteCode } });
  if (!band) {
    throw Object.assign(new Error('邀请码无效'), { statusCode: 404 });
  }

  const alreadyMember = await prisma.bandMember.findUnique({
    where: { bandId_userId: { bandId: band.id, userId: input.userId } },
  });
  if (alreadyMember) {
    throw Object.assign(new Error('你已加入该乐队'), { statusCode: 409 });
  }

  await prisma.bandMember.create({
    data: {
      bandId: band.id,
      userId: input.userId,
      instrument: Instrument.OTHER,
      skillLevel: 1,
    },
  });

  return getBand(band.id, input.userId);
}

export async function getBand(bandId: string, userId: string) {
  const membership = await prisma.bandMember.findUnique({
    where: { bandId_userId: { bandId, userId } },
  });
  if (!membership) {
    throw Object.assign(new Error('Not a band member'), { statusCode: 403 });
  }

  return prisma.band.findUniqueOrThrow({
    where: { id: bandId },
    include: {
      members: {
        include: {
          user: { select: { id: true, displayName: true } },
        },
      },
    },
  });
}

export async function getMyBands(userId: string) {
  const memberships = await prisma.bandMember.findMany({
    where: { userId },
    select: { bandId: true },
    orderBy: { joinedAt: 'asc' },
  });

  if (memberships.length === 0) return [];

  return Promise.all(memberships.map((m) => getBand(m.bandId, userId)));
}

export async function updateBand(input: {
  bandId: string;
  userId: string;
  name: string;
  stylePreferences?: string[];
}) {
  const membership = await prisma.bandMember.findUnique({
    where: { bandId_userId: { bandId: input.bandId, userId: input.userId } },
  });
  if (!membership) {
    throw Object.assign(new Error('你不是该乐队成员'), { statusCode: 403 });
  }

  const name = input.name.trim();
  if (!name) {
    throw Object.assign(new Error('请填写乐队名称'), { statusCode: 400 });
  }

  return prisma.band.update({
    where: { id: input.bandId },
    data: {
      name,
      stylePreferences:
        input.stylePreferences && input.stylePreferences.length > 0
          ? input.stylePreferences
          : Prisma.DbNull,
    },
    include: {
      members: {
        include: {
          user: { select: { id: true, displayName: true } },
        },
      },
    },
  });
}

export async function updateMyMemberProfile(input: {
  bandId: string;
  userId: string;
  instrument: Instrument;
  questionnaireAnswers: QuestionnaireAnswers;
}) {
  const membership = await prisma.bandMember.findUnique({
    where: { bandId_userId: { bandId: input.bandId, userId: input.userId } },
  });
  if (!membership) {
    throw Object.assign(new Error('Not a band member'), { statusCode: 403 });
  }

  const skillLevel = calculateSkillLevel(input.questionnaireAnswers);

  return prisma.bandMember.update({
    where: { id: membership.id },
    data: {
      instrument: input.instrument,
      questionnaireAnswers: input.questionnaireAnswers as unknown as Prisma.InputJsonValue,
      skillLevel,
    },
    include: {
      user: { select: { id: true, displayName: true } },
    },
  });
}

export async function leaveBand(input: { bandId: string; userId: string }) {
  const membership = await prisma.bandMember.findUnique({
    where: { bandId_userId: { bandId: input.bandId, userId: input.userId } },
  });
  if (!membership) {
    throw Object.assign(new Error('你不是该乐队成员'), { statusCode: 403 });
  }

  const memberCount = await prisma.bandMember.count({
    where: { bandId: input.bandId },
  });

  await prisma.$transaction(async (tx) => {
    await tx.practiceLog.deleteMany({
      where: { bandId: input.bandId, userId: input.userId },
    });
    await tx.bandMember.delete({ where: { id: membership.id } });

    if (memberCount === 1) {
      await tx.band.delete({ where: { id: input.bandId } });
    }
  });

  return { disbanded: memberCount === 1 };
}
