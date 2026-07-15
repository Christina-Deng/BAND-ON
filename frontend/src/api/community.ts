import { api } from './client';
import type {
  CommunityPostDetail,
  CommunityPostSummary,
  CommunityPostType,
  CreateCommunityPostInput,
  PostResponseView,
} from '../types/community';

export type CommunitySort = 'upcoming' | 'latest';

export async function listCommunityPosts(options?: {
  type?: CommunityPostType;
  sort?: CommunitySort;
  mine?: boolean;
}) {
  const { data } = await api.get<{ posts: CommunityPostSummary[] }>('/community/posts', {
    params: {
      ...(options?.type ? { type: options.type } : {}),
      ...(options?.sort ? { sort: options.sort } : {}),
      ...(options?.mine ? { mine: 'true' } : {}),
    },
  });
  return data.posts;
}

export async function createCommunityPost(input: CreateCommunityPostInput) {
  const { data } = await api.post<{ post: CommunityPostSummary }>('/community/posts', input);
  return data.post;
}

export async function getCommunityPost(id: string) {
  const { data } = await api.get<{ post: CommunityPostDetail }>(`/community/posts/${id}`);
  return data.post;
}

export async function deleteCommunityPost(id: string) {
  await api.delete(`/community/posts/${id}`);
}

export async function respondToCommunityPost(id: string, message?: string) {
  const { data } = await api.post<{ response: PostResponseView }>(
    `/community/posts/${id}/responses`,
    { message },
  );
  return data.response;
}

export async function cancelCommunityResponse(id: string) {
  await api.delete(`/community/posts/${id}/responses/me`);
}
