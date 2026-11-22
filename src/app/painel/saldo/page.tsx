import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
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
    <DepositsClient
      initialDeposits={deposits.map((d) => ({
        id: d.id,
        amount: d.amount,
        method: d.method,
        gateway: d.gateway,
        txid: d.txid,
        pixCode: d.pixCode,
        status: d.status,
        note: d.note,
        createdAt: d.createdAt.toISOString(),
      }))}
      minDeposit={settings.minDeposit}
      gateway={settings.pixGateway}
    />
  );
}
