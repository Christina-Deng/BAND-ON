import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';
const VALID_THEMES = new Set(['indigo', 'rock', 'paper', 'light']);

function normalizeThemePreference(theme: string | null): string | null {
  if (theme === 'amber') return 'paper';
  return theme;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  themePreference: string | null;
}

function toAuthUser(user: {
  id: string;
  email: string;
  displayName: string;
  themePreference: string | null;
}): AuthUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    themePreference: normalizeThemePreference(user.themePreference),
  };
}

export async function register(input: {
  email: string;
  password: string;
  displayName: string;
}): Promise<AuthUser> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw Object.assign(new Error('Email already registered'), { statusCode: 409 });
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      displayName: input.displayName.trim(),
    },
  });

  return toAuthUser(user);
}

export async function login(input: {
  email: string;
  password: string;
}): Promise<{ user: AuthUser; token: string }> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  return {
    user: toAuthUser(user),
    token,
  };
}

export async function getMe(userId: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  return toAuthUser(user);
}

export async function updateMe(
  userId: string,
  input: { displayName?: string; themePreference?: string | null },
): Promise<AuthUser> {
  const data: { displayName?: string; themePreference?: string | null } = {};

  if (input.displayName !== undefined) {
    const displayName = input.displayName.trim();
    if (!displayName) {
      throw Object.assign(new Error('Display name is required'), { statusCode: 400 });
    }
    if (displayName.length > 50) {
      throw Object.assign(new Error('Display name is too long'), { statusCode: 400 });
    }
    data.displayName = displayName;
  }

  if (input.themePreference !== undefined) {
    const themePreference = normalizeThemePreference(input.themePreference);
    if (themePreference !== null && !VALID_THEMES.has(themePreference)) {
      throw Object.assign(new Error('Invalid theme preference'), { statusCode: 400 });
    }
    data.themePreference = themePreference;
  }

  if (Object.keys(data).length === 0) {
    throw Object.assign(new Error('No fields to update'), { statusCode: 400 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
  });

  return toAuthUser(user);
}

export async function changePassword(
  userId: string,
  input: { currentPassword: string; newPassword: string },
): Promise<void> {
  if (!input.currentPassword || !input.newPassword) {
    throw Object.assign(new Error('Current and new password are required'), { statusCode: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 });
  }

  const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!valid) {
    throw Object.assign(new Error('Current password is incorrect'), { statusCode: 401 });
  }

  const passwordHash = await bcrypt.hash(input.newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}

export function verifyToken(token: string): { userId: string } {
  return jwt.verify(token, JWT_SECRET) as { userId: string };
}
