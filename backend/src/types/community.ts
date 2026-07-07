import type { CommunityPostType } from '@prisma/client';

export interface CreateCommunityPostInput {
  authorId: string;
  type: CommunityPostType;
  title: string;
  body: string;
  eventAt?: Date | null;
  location?: string | null;
  budgetNote?: string | null;
}

export interface PostAuthorSummary {
  id: string;
  displayName: string;
}

export interface CommunityPostSummary {
  id: string;
  type: CommunityPostType;
  title: string;
  bodyPreview: string;
  eventAt: string | null;
  location: string | null;
  budgetNote: string | null;
  author: PostAuthorSummary;
  responseCount: number;
  createdAt: string;
}

export interface PostResponseView {
  id: string;
  message: string | null;
  createdAt: string;
  user: PostAuthorSummary;
}

export interface CommunityPostDetail {
  id: string;
  type: CommunityPostType;
  title: string;
  body: string;
  eventAt: string | null;
  location: string | null;
  budgetNote: string | null;
  author: PostAuthorSummary;
  responseCount: number;
  hasResponded: boolean;
  isAuthor: boolean;
  responses: PostResponseView[] | null;
  createdAt: string;
}

export interface RehearsalPlanSongInput {
  songTitle: string;
  songId?: string | null;
}

export interface CreateRehearsalPlanInput {
  bandId: string;
  userId: string;
  scheduledAt: Date;
  note?: string | null;
  songs?: RehearsalPlanSongInput[];
}

export interface UpdateRehearsalPlanInput {
  bandId: string;
  planId: string;
  userId: string;
  scheduledAt?: Date;
  note?: string | null;
  songs?: RehearsalPlanSongInput[];
}

export interface RehearsalPlanSongView {
  id: string;
  songTitle: string;
  songId: string | null;
  sortOrder: number;
}

export interface RehearsalPlanView {
  id: string;
  bandId: string;
  scheduledAt: string;
  note: string | null;
  createdById: string;
  createdAt: string;
  songs: RehearsalPlanSongView[];
}
