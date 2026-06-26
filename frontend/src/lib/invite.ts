export const PENDING_INVITE_CODE_KEY = 'bandmate_pending_invite_code';

export function normalizeInviteCode(code: string | null | undefined): string | null {
  if (!code) return null;
  const trimmed = code.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

/** Public frontend origin for invite links. Falls back to current page origin. */
export function getInviteLinkOrigin(): string {
  const configured = import.meta.env.VITE_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, '');
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

export function buildJoinUrl(inviteCode: string): string {
  return `${getInviteLinkOrigin()}/join?code=${encodeURIComponent(inviteCode)}`;
}

export function buildInviteShareText(bandName: string, inviteCode: string): string {
  return [
    `来 BandMate 加入我们的乐队「${bandName}」吧！`,
    `邀请码：${inviteCode}`,
    `打开链接即可加入：${buildJoinUrl(inviteCode)}`,
  ].join('\n');
}

export function setPendingInviteCode(code: string): void {
  sessionStorage.setItem(PENDING_INVITE_CODE_KEY, code);
}

export function getPendingInviteCode(): string | null {
  return normalizeInviteCode(sessionStorage.getItem(PENDING_INVITE_CODE_KEY));
}

export function clearPendingInviteCode(): void {
  sessionStorage.removeItem(PENDING_INVITE_CODE_KEY);
}

export async function copyText(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}
