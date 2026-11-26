import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getRequestPreferences } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { ServiceCatalogTable } from "@/components/service-catalog-table";
import { getLocalizedServiceName, getServiceMarketRate } from "@/lib/i18n";
import { isBrazilBlackFridayActive, toBlackFridayConfig } from "@/lib/black-friday";
import { applyEffectiveBrlPricing } from "@/lib/black-friday-server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const prefs = await getRequestPreferences().catch(() => ({
    locale: "en" as const,
    currency: "USD" as const,
  }));
  const isPt = prefs.locale === "pt";
  return {
    title: isPt
      ? "Catálogo Completo de Serviços SMM e Preços | FollowMe"
      : "Full Social Growth Service Catalog & Live USD Rates | FollowMe",
    description: isPt
      ? "Compare todos os 26 serviços ativos para Instagram, TikTok, YouTube, Facebook, Telegram, X e Spotify com preços por 1.000 unidades em Reais e reposição garantida."
      : "Compare all 26 live services for Instagram, TikTok, YouTube, Facebook, Telegram, X, and Spotify with transparent per-1,000 USD pricing and refill warranties.",
    alternates: { canonical: "/servicos" },
  };
}

export default async function PublicServicesPage() {
  const [user, settings, prefs, rawServices] = await Promise.all([
    getCurrentUser(),
    getSiteSettings(),
    getRequestPreferences(),
    prisma.service.findMany({
      where: { isActive: true, category: { isActive: true } },
      include: { category: { select: { name: true, nameEn: true, network: true } } },
      orderBy: [{ category: { sortOrder: "asc" } }, { id: "asc" }],
    }),
  ]);

  const bfConfig = toBlackFridayConfig(settings);
  const blackFridayActive = isBrazilBlackFridayActive(
    bfConfig,
    prefs.locale,
    prefs.currency
  );
  const services = applyEffectiveBrlPricing(rawServices, bfConfig);

  let favoriteIds: number[] = [];
  if (user) {
    const favs = await prisma.favoriteService.findMany({
      where: { userId: user.id },
      select: { serviceId: true },
    });
    favoriteIds = favs.map((f) => f.serviceId);
  }

  const isPt = prefs.locale === "pt";
  const appUrl = (process.env.APP_URL || "https://followme.nexaclouds.online").replace(/\/+$/, "");

  const catalogJsonLd = {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name: isPt
      ? `${settings.brandName} — Catálogo Completo de Serviços (${prefs.currency})`
      : `${settings.brandName} — Full Social Growth Catalog (${prefs.currency})`,
    url: `${appUrl}/servicos`,
    itemListElement: services.map((s) => ({
      "@type": "Offer",
      name: getLocalizedServiceName(s, prefs.locale),
      price: getServiceMarketRate(s, prefs.currency).toFixed(2),
      priceCurrency: prefs.currency,
      availability: "https://schema.org/InStock",
      url: `${appUrl}/servicos`,
    })),
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8fd] text-[#111015]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(catalogJsonLd) }}
      />
      <div className="fn-hero-canvas border-b border-[#ece5f2]">
        <PublicHeader
          brandName={settings.brandName}
          user={user ? { username: user.username, role: user.role } : null}
          locale={prefs.locale}
          currency={prefs.currency}
          blackFridayActive={blackFridayActive}
        />

        <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="fn-eyebrow-pill inline-flex items-center gap-2 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-[#18141d]">
            <span className="h-2 w-2 rounded-full bg-[#8c42ed]" />
            <span>{isPt ? "Catálogo Oficial Atualizado" : "Live Market Pricing"}</span>
          </div>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl sm:text-4xl lg:text-5xl font-black tracking-[-0.045em] text-[#111015]">
            {isPt ? "Todos os Serviços por Rede Social" : "All Social Growth Services"}
          </h1>
          <p className="mt-2.5 text-sm sm:text-base font-medium text-[#66616d]">
            {isPt ? (
              <>
                Todos os valores abaixo correspondem ao preço por{" "}
                <strong className="text-[#111015]">1.000 unidades</strong> em{" "}
                <strong className="text-[#7c3ee9]">{prefs.currency}</strong>.
              </>
            ) : (
              <>
                All rates below are transparent retail prices per{" "}
                <strong className="text-[#111015]">1,000 units</strong> in{" "}
                <strong className="text-[#7c3ee9]">{prefs.currency}</strong>. Order any quantity within min and max limits.
              </>
            )}
          </p>
        </div>
      </div>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
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
          blackFridayActive={blackFridayActive}
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
