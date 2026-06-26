import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  withCredentials: true,
});

/** Turn backend-relative upload paths into absolute URLs for media playback. */
export function resolveMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
}

/** Extract a human-readable message from axios / API errors. */
export function getApiErrorMessage(error: unknown, fallback = '请求失败，请稍后重试'): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return '无法连接后端服务，请确认 backend 已启动（npm run dev，端口 3000）';
    }
    const data = error.response.data as { error?: { message?: string } } | undefined;
    if (data?.error?.message) return data.error.message;
    if (error.response.status === 409) return '该邮箱已被注册';
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
