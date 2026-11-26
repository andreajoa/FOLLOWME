import { prisma } from "@/lib/prisma";
import { getCurrentUser, getRequestPreferences } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { isBrazilBlackFridayActive, toBlackFridayConfig } from "@/lib/black-friday";
import { applyEffectiveBrlPricing } from "@/lib/black-friday-server";
import { NewOrderClient } from "@/components/new-order-client";

export const dynamic = "force-dynamic";

export default async function PanelHomePage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string; qty?: string }>;
}) {
  const [user, prefs, settings, sp] = await Promise.all([
    getCurrentUser(),
    getRequestPreferences(),
    getSiteSettings(),
    searchParams,
  ]);
  const initialServiceId = sp.service ? Number.parseInt(sp.service, 10) : undefined;
  const initialQuantity = sp.qty ? Number.parseInt(sp.qty, 10) : undefined;
  const isPt = prefs.locale === "pt";

  const [categories, rawServices, favorites, totalOrders, activeOrders] =
    await Promise.all([
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.service.findMany({
        where: { isActive: true, category: { isActive: true } },
        include: { category: { select: { name: true, nameEn: true, network: true } } },
        orderBy: [{ category: { sortOrder: "asc" } }, { id: "asc" }],
      }),
      prisma.favoriteService.findMany({
        where: { userId: user!.id },
        select: { serviceId: true },
      }),
      prisma.order.count({ where: { userId: user!.id } }),
      prisma.order.count({
        where: {
          userId: user!.id,
          status: { in: ["PENDING", "PROCESSING", "IN_PROGRESS"] },
        },
      }),
    ]);

  const bfConfig = toBlackFridayConfig(settings);
  const blackFridayActive = isBrazilBlackFridayActive(
    bfConfig,
    prefs.locale,
    prefs.currency
  );
  const services = applyEffectiveBrlPricing(rawServices, bfConfig);

  return (
    <NewOrderClient
      categories={categories.map((c) => ({
        id: c.id,
        name: isPt ? c.name : c.nameEn || c.name,
        network: c.network,
      }))}
      services={services.map((s) => ({
        id: s.id,
        categoryId: s.categoryId,
        categoryName: isPt ? s.category.name : s.category.nameEn || s.category.name,
        network: s.category.network,
        name: s.name,
        nameEn: s.nameEn,
        metricType: s.metricType,
        type: s.type,
        description: s.description,
        descriptionEn: s.descriptionEn,
        rate: s.rate,
        rateUsd: s.rateUsd,
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
      initialQuantity={
        initialQuantity && Number.isInteger(initialQuantity) && initialQuantity > 0
          ? initialQuantity
          : undefined
      }
      userBalance={user!.balance}
      isAdmin={user!.role === "ADMIN"}
      locale={prefs.locale}
      currency={prefs.currency}
      blackFridayActive={blackFridayActive}
      rates={{ usdRate: settings.usdRate, eurRate: settings.eurRate }}
      stats={{
        totalOrders,
        activeOrders,
        totalSpent: user!.totalSpent,
      }}
    />
  );
}
