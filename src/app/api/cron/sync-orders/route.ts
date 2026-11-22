import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getCurrentUser } from "@/lib/auth";
import { syncActiveOrdersWithProviders } from "@/lib/order-service";

export const dynamic = "force-dynamic";

function timingSafeMatch(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

async function handleSync(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim() || "";
  const authHeader = req.headers.get("authorization") || "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const querySecret = req.nextUrl.searchParams.get("secret")?.trim() || "";

  let authorized = false;
  if (cronSecret && ((bearer && timingSafeMatch(bearer, cronSecret)) || (querySecret && timingSafeMatch(querySecret, cronSecret)))) {
    authorized = true;
  }

  if (!authorized) {
    const user = await getCurrentUser().catch(() => null);
    if (user?.role === "ADMIN") {
      authorized = true;
    }
  }

  if (!authorized) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const stats = await syncActiveOrdersWithProviders(100);
  return NextResponse.json({ ok: true, ...stats });
}

export async function POST(req: NextRequest) {
  return handleSync(req);
}

export async function GET(req: NextRequest) {
  return handleSync(req);
}
