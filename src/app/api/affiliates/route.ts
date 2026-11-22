import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const [referralsCount, earnings, settings] = await Promise.all([
    prisma.user.count({ where: { referredById: user.id } }),
    prisma.affiliateEarning.findMany({
      where: { referrerId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    getSiteSettings(),
  ]);

  const totalEarned = earnings.reduce((acc, item) => acc + item.amount, 0);

  return NextResponse.json({
    referralCode: user.referralCode,
    clicks: user.affiliateClicks,
    referralsCount,
    availableBalance: user.affiliateBalance,
    totalEarned,
    commissionRate: settings.affiliateRate,
    minPayout: settings.affiliateMinPayout,
    earnings,
  });
}
