import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/settings";
import { isStripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const settings = await getSiteSettings().catch(() => null);
    return NextResponse.json({
      ok: true,
      db: "ok",
      brand: settings?.brandName || "FollowMe",
      stripeConfigured: isStripeConfigured(),
      stripeWebhookConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
      stripePixConfigured: Boolean(process.env.STRIPE_PMC_PIX || isStripeConfigured()),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Health check error:", err);
    return NextResponse.json(
      {
        ok: false,
        db: "error",
        error: "Database unreachable",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
