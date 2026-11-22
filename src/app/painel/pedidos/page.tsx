import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { OrdersClient } from "@/components/orders-client";

export const dynamic = "force-dynamic";

export default async function PanelOrdersPage() {
  const user = (await getCurrentUser())!;
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: {
      service: {
        select: {
          id: true,
          name: true,
          refill: true,
          refillDays: true,
          cancel: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <OrdersClient
      initialOrders={orders.map((o) => ({
        ...o,
        createdAt: o.createdAt.toISOString(),
      }))}
    />
  );
}
