/** Invite codes are 8-char hex; tolerate spaces, dashes, and mixed case from paste. */
export function normalizeInviteCode(code: string | null | undefined): string {
  if (!code) return '';
  return code.toLowerCase().replace(/[^a-f0-9]/g, '');
}
