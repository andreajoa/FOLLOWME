import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { NewOrderClient } from "@/components/new-order-client";

export const dynamic = "force-dynamic";

export default async function PanelHomePage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const user = (await getCurrentUser())!;
  const sp = await searchParams;
  const initialServiceId = sp.service ? Number.parseInt(sp.service, 10) : undefined;

  const [categories, services, favorites, totalOrders, activeOrders] =
    await Promise.all([
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.service.findMany({
        where: { isActive: true, category: { isActive: true } },
        include: { category: { select: { name: true, network: true } } },
        orderBy: [{ category: { sortOrder: "asc" } }, { id: "asc" }],
      }),
      prisma.favoriteService.findMany({
        where: { userId: user.id },
        select: { serviceId: true },
      }),
      prisma.order.count({ where: { userId: user.id } }),
      prisma.order.count({
        where: {
          userId: user.id,
          status: { in: ["PENDING", "PROCESSING", "IN_PROGRESS"] },
        },
      }),
    ]);

  return (
    <NewOrderClient
      categories={categories.map((c) => ({
        id: c.id,
        name: c.name,
        network: c.network,
      }))}
      services={services.map((s) => ({
        id: s.id,
        categoryId: s.categoryId,
        categoryName: s.category.name,
        network: s.category.network,
        name: s.name,
        type: s.type,
        description: s.description,
        rate: s.rate,
        providerRate: s.providerRate,
        min: s.min,
        max: s.max,
        averageTime: s.averageTime,
        refill: s.refill,
        refillDays: s.refillDays,
        cancel: s.cancel,
        dripfeed: s.dripfeed,
      }))}
      favoriteIds={favorites.map((f) => f.serviceId)}
      initialServiceId={
        initialServiceId && Number.isInteger(initialServiceId)
          ? initialServiceId
          : undefined
      }
      userBalance={user.balance}
      isAdmin={user.role === "ADMIN"}
      stats={{
        totalOrders,
        activeOrders,
        totalSpent: user.totalSpent,
      }}
    />
  );
}
