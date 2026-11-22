import { prisma } from "@/lib/prisma";
import { getCurrentUser, getRequestPreferences } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { ServiceCatalogTable } from "@/components/service-catalog-table";

export const dynamic = "force-dynamic";

export default async function PublicServicesPage() {
  const [user, settings, prefs, services] = await Promise.all([
    getCurrentUser(),
    getSiteSettings(),
    getRequestPreferences(),
    prisma.service.findMany({
      where: { isActive: true, category: { isActive: true } },
      include: { category: { select: { name: true, nameEn: true, network: true } } },
      orderBy: [{ category: { sortOrder: "asc" } }, { id: "asc" }],
    }),
  ]);

  let favoriteIds: number[] = [];
  if (user) {
    const favs = await prisma.favoriteService.findMany({
      where: { userId: user.id },
      select: { serviceId: true },
    });
    favoriteIds = favs.map((f) => f.serviceId);
  }

  const isPt = prefs.locale === "pt";

  return (
    <div className="min-h-screen flex flex-col bg-[#090A0C]">
      <PublicHeader
        brandName={settings.brandName}
        user={user ? { username: user.username, role: user.role } : null}
        locale={prefs.locale}
        currency={prefs.currency}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <span className="font-mono text-xs uppercase tracking-widest text-[#C8FF2E]">
            {isPt ? "Catálogo Oficial Atualizado" : "Live Market Pricing"}
          </span>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-bold tracking-tight">
            {isPt ? "Todos os Serviços por Rede Social" : "All Social Growth Services"}
          </h1>
          <p className="mt-2 text-sm text-[#98A0AD]">
            {isPt ? (
              <>
                Todos os valores abaixo correspondem ao preço por{" "}
                <strong className="text-[#F4F5F6]">1.000 unidades</strong> em{" "}
                <strong className="text-[#F4F5F6]">{prefs.currency}</strong>.
              </>
            ) : (
              <>
                All rates below are transparent retail prices per{" "}
                <strong className="text-[#F4F5F6]">1,000 units</strong> in{" "}
                <strong className="text-[#F4F5F6]">{prefs.currency}</strong>. Order any quantity within min and max limits.
              </>
            )}
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
          initialFavorites={favoriteIds}
          isLoggedIn={Boolean(user)}
          locale={prefs.locale}
          currency={prefs.currency}
        />
      </main>

      <PublicFooter
        brandName={settings.brandName}
        supportEmail={settings.supportEmail}
        supportWhatsapp={settings.supportWhatsapp}
        locale={prefs.locale}
      />
    </div>
  );
}
