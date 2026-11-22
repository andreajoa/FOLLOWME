import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { CooperationClient } from "@/components/cooperation-client";

export const dynamic = "force-dynamic";

export default async function PanelCooperationPage() {
  const [user, settings] = await Promise.all([
    getCurrentUser(),
    getSiteSettings(),
  ]);

  const requests = await prisma.cooperationRequest.findMany({
    where: { userId: user!.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return (
    <CooperationClient
      brandName={settings.brandName}
      defaultName={user!.name}
      defaultEmail={user!.email}
      defaultWhatsapp={user!.whatsapp || ""}
      showHistory
      initialRequests={requests.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        type: r.type,
        monthlyVolume: r.monthlyVolume,
        status: r.status,
        adminNote: r.adminNote,
        createdAt: r.createdAt.toISOString(),
      }))}
    />
  );
}
