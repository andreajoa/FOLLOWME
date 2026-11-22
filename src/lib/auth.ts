import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

export const SESSION_COOKIE_NAME = "velosmm_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

function getSigningKey(): string {
  const configured = process.env.SESSION_SECRET;
  if (configured && configured.length >= 16) {
    return configured;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET environment variable must be configured in production.");
  }
  return "velosmm-ephemeral-dev-only-key-not-for-prod";
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateApiKey(): string {
  return `vsmm_${crypto.randomBytes(20).toString("hex")}`;
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
  store.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
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
      createdAt: true,
    },
  });

  if (!user || user.status !== "ACTIVE") return null;
  return user;
}

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  bucketKey: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const existing = rateBuckets.get(bucketKey);

  if (!existing || existing.resetAt <= now) {
    rateBuckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (existing.count >= maxRequests) {
    return false;
  }

  existing.count += 1;
  return true;
}
