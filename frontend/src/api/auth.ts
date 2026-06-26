import { api } from './client';
import type { ThemeId } from '../lib/theme';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  themePreference: ThemeId | null;
}

export async function register(input: {
  email: string;
  password: string;
  displayName: string;
}) {
  const { data } = await api.post<{ user: AuthUser }>('/auth/register', input);
  return data.user;
}

export async function login(input: { email: string; password: string }) {
  const { data } = await api.post<{ user: AuthUser }>('/auth/login', input);
  return data.user;
}

export async function logout() {
  await api.post('/auth/logout');
}

export async function getMe() {
  const { data } = await api.get<{ user: AuthUser }>('/auth/me');
  return data.user;
}

export async function updateMe(input: {
  displayName?: string;
  themePreference?: ThemeId | null;
}) {
  const { data } = await api.patch<{ user: AuthUser }>('/auth/me', input);
  return data.user;
}

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}) {
  await api.post('/auth/change-password', input);
}
