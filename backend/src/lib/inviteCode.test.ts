import { describe, expect, it } from 'vitest';
import { normalizeInviteCode } from './inviteCode.js';

describe('normalizeInviteCode', () => {
  it('lowercases and strips non-hex characters', () => {
    expect(normalizeInviteCode('ABCD-EF12')).toBe('abcdef12');
    expect(normalizeInviteCode('abcd ef12')).toBe('abcdef12');
    expect(normalizeInviteCode('  AbCdEf12  ')).toBe('abcdef12');
  });

  it('returns empty string for missing or invalid input', () => {
    expect(normalizeInviteCode('')).toBe('');
    expect(normalizeInviteCode(null)).toBe('');
    expect(normalizeInviteCode('----')).toBe('');
  });
});
