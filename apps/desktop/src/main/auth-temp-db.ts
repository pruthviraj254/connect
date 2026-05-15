/**
 * In-memory users + sessions for local development until a real API is wired.
 * Passwords are stored in plain text in RAM only — never ship this pattern to production.
 */
import { randomBytes, randomUUID } from 'node:crypto';

export type TempUserRecord = {
  email: string;
  password: string;
  displayName: string;
};

const usersByEmail = new Map<string, TempUserRecord>();

function seedUsers(): void {
  const seeds: TempUserRecord[] = [
    { email: 'admin@onerx.health', password: 'Operator123!', displayName: 'Alex Operator' },
    { email: 'demo@onerx.health', password: 'DemoPass123!', displayName: 'Demo Operator' },
  ];
  for (const u of seeds) {
    usersByEmail.set(normalizeEmail(u.email), { ...u, email: normalizeEmail(u.email) });
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

seedUsers();

export function findUser(email: string): TempUserRecord | undefined {
  return usersByEmail.get(normalizeEmail(email));
}

export function registerTempUser(
  email: string,
  password: string,
  displayName: string,
): { ok: true; user: TempUserRecord } | { ok: false; error: 'email_taken' } {
  const key = normalizeEmail(email);
  if (usersByEmail.has(key)) {
    return { ok: false, error: 'email_taken' };
  }
  const trimmed = displayName.trim();
  const name =
    trimmed.length > 0 ? trimmed.slice(0, 120) : (key.split('@')[0] ?? 'Operator').slice(0, 120);
  const user: TempUserRecord = { email: key, password, displayName: name };
  usersByEmail.set(key, user);
  return { ok: true, user };
}

export function verifyPassword(email: string, password: string): boolean {
  const user = findUser(email);
  return Boolean(user && user.password === password);
}

export function rotatePasswordForUser(email: string): string | null {
  const key = normalizeEmail(email);
  const user = usersByEmail.get(key);
  if (!user) {
    return null;
  }
  const next = randomBytes(12).toString('base64url').slice(0, 16);
  user.password = next;
  return next;
}

type SessionRecord = {
  email: string;
  displayName: string;
};

const sessionsByToken = new Map<string, SessionRecord>();

export function createSession(email: string, displayName: string): string {
  const token = randomUUID();
  sessionsByToken.set(token, { email: normalizeEmail(email), displayName });
  return token;
}

export function deleteSession(token: string): void {
  sessionsByToken.delete(token);
}

export function getSession(token: string): SessionRecord | undefined {
  return sessionsByToken.get(token);
}
