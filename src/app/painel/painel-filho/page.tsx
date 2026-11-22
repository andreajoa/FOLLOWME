import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { ChildPanelClient } from "@/components/child-panel-client";

export const dynamic = "force-dynamic";

export default async function PanelChildPanelPage() {
  const [user, settings] = await Promise.all([
    getCurrentUser(),
    getSiteSettings(),
  ]);

  const panels = await prisma.childPanel.findMany({
    where: { userId: user!.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <ChildPanelClient
      initialPanels={panels.map((p) => ({
        id: p.id,
        domain: p.domain,
        currency: p.currency,
        adminUsername: p.adminUsername,
        monthlyPrice: p.monthlyPrice,
        status: p.status,
        nameservers: p.nameservers,
        nextBillingAt: p.nextBillingAt.toISOString(),
        createdAt: p.createdAt.toISOString(),
      }))}
      monthlyPrice={settings.childPanelPrice}
      brandName={settings.brandName}
    />
  );
}
