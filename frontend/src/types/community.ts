export type CommunityPostType = 'ANNOUNCEMENT' | 'RECRUITMENT' | 'GIG_REQUEST';

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

export interface RehearsalPlanSong {
  id: string;
  songTitle: string;
  songId: string | null;
  sortOrder: number;
}

export interface RehearsalPlan {
  id: string;
  bandId: string;
  scheduledAt: string;
  note: string | null;
  createdById: string;
  createdAt: string;
  songs: RehearsalPlanSong[];
}

export interface CreateCommunityPostInput {
  type: CommunityPostType;
  title: string;
  body: string;
  eventAt?: string | null;
  location?: string | null;
  budgetNote?: string | null;
}

export interface CreateRehearsalPlanInput {
  scheduledAt: string;
  note?: string | null;
  songs?: Array<{ songTitle: string; songId?: string | null }>;
}
