import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import {
  AppCurrency,
  AppLocale,
  CURRENCY_COOKIE,
  LOCALE_COOKIE,
  normalizeCurrency,
  normalizeLocale,
} from "./i18n";

export const SESSION_COOKIE_NAME = "followme_session";
const LEGACY_SESSION_COOKIE_NAME = "velosmm_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

function getSigningKey(): string {
  const configured = process.env.SESSION_SECRET;
  if (configured && configured.length >= 16) {
    return configured;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET environment variable must be configured in production.");
  }
  return "followme-ephemeral-dev-only-key-not-for-prod";
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateApiKey(): string {
  return `flwm_${crypto.randomBytes(20).toString("hex")}`;
}

export function generateReferralCode(seedText: string): string {
  const clean = seedText
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6)
    .padEnd(4, "X");
  const suffix = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `${clean}${suffix}`;
}

export function isAdminEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  const list = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(normalized);
}

interface SessionPayload {
  uid: string;
  role: string;
  exp: number;
}

export function signSessionToken(userId: string, role: string): string {
  const payload: SessionPayload = {
    uid: userId,
    role,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", getSigningKey())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  const dotIdx = token.indexOf(".");
  if (dotIdx <= 0) return null;

  const encoded = token.slice(0, dotIdx);
  const providedSig = token.slice(dotIdx + 1);
  const expectedSig = crypto
    .createHmac("sha256", getSigningKey())
    .update(encoded)
    .digest("base64url");

  const providedBuf = Buffer.from(providedSig);
  const expectedBuf = Buffer.from(expectedSig);
  if (
    providedBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(providedBuf, expectedBuf)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as SessionPayload;
    if (!parsed.uid || !parsed.exp || parsed.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function setSessionCookie(userId: string, role: string): Promise<void> {
  const token = signSessionToken(userId, role);
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  const clearOpts = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
  store.set(SESSION_COOKIE_NAME, "", clearOpts);
  store.set(LEGACY_SESSION_COOKIE_NAME, "", clearOpts);
}

export async function getRequestPreferences(): Promise<{
  locale: AppLocale;
  currency: AppCurrency;
}> {
  const store = await cookies();
  const locale = normalizeLocale(store.get(LOCALE_COOKIE)?.value);
  const currency = normalizeCurrency(store.get(CURRENCY_COOKIE)?.value);
  return { locale, currency };
}

export async function getCurrentUser() {
  const store = await cookies();
  const token =
    store.get(SESSION_COOKIE_NAME)?.value ||
    store.get(LEGACY_SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = verifySessionToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.uid },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      status: true,
      balance: true,
      totalSpent: true,
      apiKey: true,
      referralCode: true,
      affiliateBalance: true,
      affiliateClicks: true,
      whatsapp: true,
      locale: true,
      currency: true,
      timezone: true,
      createdAt: true,
    },
  });

  if (!user || user.status !== "ACTIVE") return null;
  return user;
}

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  maxRequests = 60,
  windowMs = 60_000
): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= maxRequests) {
    return false;
  }
  bucket.count += 1;
  return true;
}
