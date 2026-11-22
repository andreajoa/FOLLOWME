import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";

export async function GET() {
  const [user, settings] = await Promise.all([
    getCurrentUser(),
    getSiteSettings(),
  ]);

  return NextResponse.json({
    user,
    settings: {
      brandName: settings.brandName,
      brandTagline: settings.brandTagline,
      announcement: settings.announcement,
      supportWhatsapp: settings.supportWhatsapp,
      supportEmail: settings.supportEmail,
      pixGateway: settings.pixGateway,
      minDeposit: settings.minDeposit,
      affiliateRate: settings.affiliateRate,
      affiliateMinPayout: settings.affiliateMinPayout,
    },
  });
}
