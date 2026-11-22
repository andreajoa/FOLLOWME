import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { isStripeConfigured } from "@/lib/stripe";
import { DepositsClient } from "@/components/deposits-client";

export const dynamic = "force-dynamic";

export default async function PanelDepositsPage() {
  const [user, settings] = await Promise.all([
    getCurrentUser(),
    getSiteSettings(),
  ]);

  const deposits = await prisma.deposit.findMany({
    where: { userId: user!.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <Suspense fallback={<div className="font-mono text-xs text-[#98A0AD]">Carregando...</div>}>
      <DepositsClient
        initialDeposits={deposits.map((d) => ({
          id: d.id,
          amount: d.amount,
          method: d.method,
          gateway: d.gateway,
          txid: d.txid,
          checkoutUrl: d.checkoutUrl,
          stripeSessionId: d.stripeSessionId,
          status: d.status,
          note: d.note,
          createdAt: d.createdAt.toISOString(),
        }))}
        minDeposit={settings.minDeposit}
        stripeConfigured={isStripeConfigured()}
        stripeEnabled={settings.stripeEnabled}
        stripePixEnabled={settings.stripePixEnabled}
      />
    </Suspense>
  );
}
