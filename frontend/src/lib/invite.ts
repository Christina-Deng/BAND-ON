export const PENDING_INVITE_CODE_KEY = 'bandmate_pending_invite_code';

/** Invite codes are 8-char hex; tolerate spaces, dashes, and mixed case from paste. */
export function normalizeInviteCode(code: string | null | undefined): string | null {
  if (!code) return null;
  const normalized = code.toLowerCase().replace(/[^a-f0-9]/g, '');
  return normalized.length > 0 ? normalized : null;
}

/** Public frontend origin for invite links. Set VITE_APP_URL in production builds. */
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

/** True when production build has no explicit public app URL (invite links may be wrong). */
export function isInviteLinkOriginConfigured(): boolean {
  return Boolean(import.meta.env.VITE_APP_URL?.trim());
}

export function setPendingInviteCode(code: string): void {
  const normalized = normalizeInviteCode(code);
  if (normalized) sessionStorage.setItem(PENDING_INVITE_CODE_KEY, normalized);
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
