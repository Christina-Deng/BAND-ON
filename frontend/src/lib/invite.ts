export const PENDING_INVITE_CODE_KEY = 'band-on_pending_invite_code';
export const LEGACY_PENDING_INVITE_CODE_KEY = 'bandmate_pending_invite_code';

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

export function buildInviteShareText(
  bandName: string,
  inviteCode: string,
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  return [
    t('band.invite.line1', { name: bandName }),
    t('band.invite.line2', { code: inviteCode }),
    t('band.invite.line3', { url: buildJoinUrl(inviteCode) }),
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
  const current = normalizeInviteCode(sessionStorage.getItem(PENDING_INVITE_CODE_KEY));
  if (current) return current;
  const legacy = normalizeInviteCode(sessionStorage.getItem(LEGACY_PENDING_INVITE_CODE_KEY));
  if (legacy) {
    sessionStorage.setItem(PENDING_INVITE_CODE_KEY, legacy);
    return legacy;
  }
  return null;
}

export function clearPendingInviteCode(): void {
  sessionStorage.removeItem(PENDING_INVITE_CODE_KEY);
  sessionStorage.removeItem(LEGACY_PENDING_INVITE_CODE_KEY);
}

export async function copyText(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}
