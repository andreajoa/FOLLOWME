import { prisma } from "@/lib/prisma";
import { MassOrderClient } from "@/components/mass-order-client";

export const dynamic = "force-dynamic";

export default async function MassOrderPage() {
  const services = await prisma.service.findMany({
    where: { isActive: true },
    select: { id: true, name: true, rate: true },
    orderBy: { id: "asc" },
  });

  const serviceRates: Record<number, { name: string; rate: number }> = {};
  for (const s of services) {
    serviceRates[s.id] = { name: s.name, rate: s.rate };
  }

  return (
    <MassOrderClient
      serviceRates={serviceRates}
      sampleServiceId={services[0]?.id ?? 1}
    />
  );
}
