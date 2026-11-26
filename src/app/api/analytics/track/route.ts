import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { detectDeviceType, isLikelyBotUserAgent } from "@/lib/analytics";

export const dynamic = "force-dynamic";

const trackSchema = z.object({
  eventType: z.enum(["PAGE_VIEW", "CLICK"]),
  visitorId: z.string().trim().min(4).max(80),
  sessionId: z.string().trim().max(80).optional().nullable(),
  path: z.string().trim().min(1).max(260),
  targetLabel: z.string().trim().max(160).optional().nullable(),
  targetHref: z.string().trim().max(260).optional().nullable(),
  targetArea: z.string().trim().max(80).optional().nullable(),
  elementTag: z.string().trim().max(30).optional().nullable(),
  referrer: z.string().trim().max(260).optional().nullable(),
  utmSource: z.string().trim().max(80).optional().nullable(),
  utmMedium: z.string().trim().max(80).optional().nullable(),
  utmCampaign: z.string().trim().max(80).optional().nullable(),
  locale: z.string().trim().max(20).optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json().catch(() => null);
    const parsed = trackSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const data = parsed.data;
    // Never pollute marketing analytics with owner admin/dashboard clicks
    if (data.path.startsWith("/admin") || data.path.startsWith("/dashboard")) {
      return NextResponse.json({ ok: true, skipped: "internal" });
    }

    const ua = req.headers.get("user-agent") || "";
    const isBot = isLikelyBotUserAgent(ua);
    const deviceType = detectDeviceType(ua);
    const country =
      req.headers.get("cf-ipcountry")?.trim().toUpperCase().slice(0, 8) || null;

    let cleanReferrer: string | null = null;
    if (data.referrer) {
      try {
        const u = new URL(data.referrer);
        cleanReferrer = u.hostname.replace(/^www\./, "").slice(0, 120);
      } catch {
        cleanReferrer = data.referrer.slice(0, 120);
      }
    }

    await prisma.analyticsEvent.create({
      data: {
        eventType: data.eventType,
        visitorId: data.visitorId,
        sessionId: data.sessionId || null,
        path: data.path,
        targetLabel: data.targetLabel || null,
        targetHref: data.targetHref || null,
        targetArea: data.targetArea || null,
        elementTag: data.elementTag || null,
        referrer: cleanReferrer,
        utmSource: data.utmSource || null,
        utmMedium: data.utmMedium || null,
        utmCampaign: data.utmCampaign || null,
        deviceType,
        locale: data.locale || null,
        country,
        isBot,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
