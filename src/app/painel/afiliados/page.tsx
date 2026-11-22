import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { AffiliatesClient } from "@/components/affiliates-client";

export const dynamic = "force-dynamic";

export default async function PanelAffiliatesPage() {
  const [user, settings] = await Promise.all([
    getCurrentUser(),
    getSiteSettings(),
  ]);

  const [referralsCount, earnings] = await Promise.all([
    prisma.user.count({ where: { referredById: user!.id } }),
    prisma.affiliateEarning.findMany({
      where: { referrerId: user!.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const totalEarned = earnings.reduce((acc, e) => acc + e.amount, 0);

  return (
    <AffiliatesClient
      referralCode={user!.referralCode}
      clicks={user!.affiliateClicks}
      referralsCount={referralsCount}
      availableBalance={user!.affiliateBalance}
      totalEarned={totalEarned}
      commissionRate={settings.affiliateRate}
      minPayout={settings.affiliateMinPayout}
      earnings={earnings.map((e) => ({
        ...e,
        createdAt: e.createdAt.toISOString(),
      }))}
      appUrl={process.env.APP_URL || "http://localhost:3000"}
    />
  );
}
