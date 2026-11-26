import { prisma } from "@/lib/prisma";
import { getCurrentUser, getRequestPreferences } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { isBrazilBlackFridayActive, toBlackFridayConfig } from "@/lib/black-friday";
import { applyEffectiveBrlPricing } from "@/lib/black-friday-server";
import { ServiceCatalogTable } from "@/components/service-catalog-table";

export const dynamic = "force-dynamic";

export default async function PanelServicesPage() {
  const [user, prefs, settings] = await Promise.all([
    getCurrentUser(),
    getRequestPreferences(),
    getSiteSettings(),
  ]);
  const [rawServices, favs] = await Promise.all([
    prisma.service.findMany({
      where: { isActive: true, category: { isActive: true } },
      include: { category: { select: { name: true, nameEn: true, network: true } } },
      orderBy: [{ category: { sortOrder: "asc" } }, { id: "asc" }],
    }),
    prisma.favoriteService.findMany({
      where: { userId: user!.id },
      select: { serviceId: true },
    }),
  ]);

  const bfConfig = toBlackFridayConfig(settings);
  const blackFridayActive = isBrazilBlackFridayActive(
    bfConfig,
    prefs.locale,
    prefs.currency
  );
  const services = applyEffectiveBrlPricing(rawServices, bfConfig);

  const isPt = prefs.locale === "pt";

  return (
    <div className="space-y-6">
      <div>
        <span className="font-mono text-xs uppercase tracking-widest text-[#C8FF2E]">
          {isPt ? "Tabela Completa de Serviços" : "Complete Service Catalog"}
        </span>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold">
          {isPt ? "Serviços Disponíveis" : "Available Services"}
        </h1>
        <p className="mt-1 text-sm text-[#98A0AD]">
          {isPt
            ? "Favorite os serviços que você mais usa para encontrá-los rapidamente na tela de Novo Pedido."
            : "Star your go-to services to access them faster on the New Order screen."}
        </p>
      </div>

      <ServiceCatalogTable
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
          min: s.min,
          max: s.max,
          averageTime: s.averageTime,
          refill: s.refill,
          refillDays: s.refillDays,
          cancel: s.cancel,
          dripfeed: s.dripfeed,
        }))}
        initialFavorites={favs.map((f) => f.serviceId)}
        isLoggedIn={true}
        inPanel={true}
        locale={prefs.locale}
        currency={prefs.currency}
        blackFridayActive={blackFridayActive}
      />
    </div>
  );
}
