import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import {
  formatCurrencyAmount,
  getLocalizedServiceName,
  getServiceMarketRate,
  inferMetricType,
} from "@/lib/i18n";
import type { GeoKeywordPageConfig } from "@/lib/seo-guides";
import { PublicHeader } from "./public-header";
import { PublicFooter } from "./public-footer";
import { PackageSelector, StorefrontService } from "./package-selector";
import { FaqAccordion } from "./faq-accordion";
import { ScrollReveal } from "./motion-primitives";

export function buildGeoKeywordMetadata(config: GeoKeywordPageConfig): Metadata {
  const enPath =
    config.locale === "en" ? `/en/${config.slug}` : `/en/${config.pairedSlug}`;
  const ptPath =
    config.locale === "pt" ? `/pt/${config.slug}` : `/pt/${config.pairedSlug}`;
  const canonical = config.locale === "pt" ? ptPath : enPath;

  return {
    title: config.metaTitle,
    description: config.metaDescription,
    keywords: config.keywords,
    alternates: {
      canonical,
      languages: {
        "en-US": enPath,
        "pt-BR": ptPath,
        "x-default": enPath,
      },
    },
    openGraph: {
      title: config.metaTitle,
      description: config.metaDescription,
      locale: config.locale === "pt" ? "pt_BR" : "en_US",
      type: "website",
      images: ["/media/hero-creator.jpg"],
    },
    twitter: {
      card: "summary_large_image",
      title: config.metaTitle,
      description: config.metaDescription,
      images: ["/media/hero-creator.jpg"],
    },
  };
}

export async function GeoKeywordPage({ config }: { config: GeoKeywordPageConfig }) {
  const [user, settings, services] = await Promise.all([
    getCurrentUser(),
    getSiteSettings(),
    prisma.service.findMany({
      where: { isActive: true, category: { isActive: true } },
      include: { category: { select: { name: true, nameEn: true, network: true } } },
      orderBy: [{ isFeatured: "desc" }, { id: "asc" }],
    }),
  ]);

  const isPt = config.locale === "pt";
  const routePrefix = isPt ? "/pt" : "/en";
  const appUrl = (process.env.APP_URL || "https://followme.nexaclouds.online").replace(
    /\/+$/,
    ""
  );
  const pageUrl = `${appUrl}${routePrefix}/${config.slug}`;
  const updatedIso = new Date().toISOString().slice(0, 10);

  const storefrontServices: StorefrontService[] = services.map((s) => ({
    id: s.id,
    name: s.name,
    nameEn: s.nameEn,
    categoryName: isPt ? s.category.name : s.category.nameEn || s.category.name,
    network: s.category.network,
    metricType: s.metricType || inferMetricType(s.name, s.type),
    type: s.type,
    rate: s.rate,
    rateUsd: s.rateUsd,
    min: s.min,
    max: s.max,
    averageTime: s.averageTime,
    refill: s.refill,
    refillDays: s.refillDays,
    dripfeed: s.dripfeed,
  }));

  const focusedServices = storefrontServices.filter(
    (s) => s.network === config.platform && s.type !== "PACKAGE" && s.type !== "SUBSCRIPTIONS"
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${appUrl}/#organization`,
        name: settings.brandName,
        url: appUrl,
        email: settings.supportEmail,
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: settings.supportEmail,
          availableLanguage: ["English", "Portuguese", "Spanish"],
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: settings.brandName,
            item: `${appUrl}${routePrefix}`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: config.platform.charAt(0).toUpperCase() + config.platform.slice(1),
            item: `${appUrl}${routePrefix}/${config.platform}`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: config.metaTitle,
            item: pageUrl,
          },
        ],
      },
      {
        "@type": "Service",
        name: config.metaTitle,
        description: config.metaDescription,
        provider: { "@id": `${appUrl}/#organization` },
        areaServed: isPt ? ["BR"] : ["US", "CA", "GB", "AU"],
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: `${settings.brandName} ${config.platform} packages`,
          itemListElement: focusedServices.slice(0, 8).map((s) => ({
            "@type": "Offer",
            name: getLocalizedServiceName(s, config.locale),
            price: getServiceMarketRate(s, config.currency).toFixed(2),
            priceCurrency: config.currency,
            availability: "https://schema.org/InStock",
            url: pageUrl,
          })),
        },
      },
      {
        "@type": "HowTo",
        name: config.stepsHeading,
        step: config.steps.map((st, idx) => ({
          "@type": "HowToStep",
          position: idx + 1,
          name: st.title,
          text: st.detail,
        })),
      },
      {
        "@type": "Article",
        headline: config.metaTitle,
        description: config.metaDescription,
        datePublished: "2026-10-01",
        dateModified: updatedIso,
        author: {
          "@type": "Organization",
          name: `${settings.brandName} Growth Editorial Team`,
          url: appUrl,
        },
        publisher: { "@id": `${appUrl}/#organization` },
        inLanguage: isPt ? "pt-BR" : "en-US",
      },
      {
        "@type": "FAQPage",
        mainEntity: config.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8fd] text-[#111015]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="fn-hero-canvas border-b border-[#ece5f2]">
        <PublicHeader
          brandName={settings.brandName}
          user={user ? { username: user.username, role: user.role } : null}
          locale={config.locale}
          currency={config.currency}
          routePrefix={routePrefix}
        />

        <section className="mx-auto max-w-7xl px-4 py-12 sm:py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="fn-eyebrow-pill inline-flex items-center gap-2 px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider text-[#18141d]">
              <span className="h-2 w-2 rounded-full bg-[#8c42ed]" />
              <span>{config.eyebrow}</span>
            </div>

            <h1 className="mt-5 font-[family-name:var(--font-display)] text-4xl sm:text-5xl font-black tracking-[-0.05em] leading-[1.05] text-[#111015]">
              {config.h1Start}
              <span className="fn-sticker mt-1">{config.h1Sticker}</span>
            </h1>

            <p className="mt-5 text-base sm:text-lg font-medium text-[#66616d] leading-relaxed max-w-[62ch]">
              {config.intro}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-[#796b89]">
              <span>
                {isPt ? "Por Equipe Editorial FollowMe" : "By FollowMe Growth Editorial Team"}
              </span>
              <span>·</span>
              <time dateTime={updatedIso}>
                {isPt ? `Atualizado em ${updatedIso}` : `Last updated ${updatedIso}`}
              </time>
            </div>
          </div>

          <div className="mt-10">
            <PackageSelector
              services={storefrontServices}
              locale={config.locale}
              currency={config.currency}
              isLoggedIn={Boolean(user)}
              initialNetwork={config.platform}
              initialMetric={config.metric}
            />
          </div>
        </section>
      </div>

      <main className="flex-1">
        {/* GEO Answer-First Capsule + Live Comparison Table */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-10">
          <ScrollReveal>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-5 surface-card p-6 sm:p-8 space-y-4">
                <span className="font-mono text-xs font-extrabold uppercase tracking-widest text-[#7c3ee9]">
                  {config.tldrLabel}
                </span>
                <h2 className="font-[family-name:var(--font-display)] text-2xl font-black tracking-[-0.035em] text-[#111015]">
                  <dfn className="not-italic">{settings.brandName}</dfn>{" "}
                  {isPt ? "em números reais" : "at a glance"}
                </h2>
                <p className="text-sm sm:text-base text-[#4a4354] leading-relaxed">
                  {config.tldrDefinition}
                </p>
                <ul className="space-y-2.5 pt-2 text-sm font-medium text-[#3f3947]">
                  {config.facts.map((fact) => (
                    <li key={fact} className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-[#7c3ee9] shrink-0 mt-0.5" />
                      <span>{fact}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lg:col-span-7 surface-card overflow-hidden">
                <div className="border-b border-[#ece5f2] bg-[#faf8fd] px-6 py-4">
                  <h2 className="font-[family-name:var(--font-display)] text-xl font-black tracking-[-0.03em] text-[#111015]">
                    {config.comparisonHeading}
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-[#ece5f2] bg-[#fcfbfe] font-mono text-[11px] uppercase tracking-wider text-[#796b89]">
                        <th className="px-5 py-3">{isPt ? "Critério" : "Criteria"}</th>
                        <th className="px-5 py-3 text-[#7c3ee9]">{settings.brandName}</th>
                        <th className="px-5 py-3">
                          {isPt ? "Abordagem Tradicional" : "Traditional Approach"}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1ebf8]">
                      {config.comparisonRows.map((row) => (
                        <tr key={row.criterion}>
                          <td className="px-5 py-3.5 font-bold text-[#111015]">
                            {row.criterion}
                          </td>
                          <td className="px-5 py-3.5 font-semibold text-[#137a43]">
                            {row.followMe}
                          </td>
                          <td className="px-5 py-3.5 text-[#66616d]">{row.traditional}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Step-by-Step Ordered Guide */}
          <ScrollReveal>
            <div className="surface-card p-6 sm:p-8">
              <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-black tracking-[-0.04em] text-[#111015] mb-6">
                {config.stepsHeading}
              </h2>
              <ol className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {config.steps.map((st, idx) => (
                  <li
                    key={st.title}
                    className="rounded-2xl border border-[#ece5f2] bg-[#faf8fd] p-5 space-y-2.5"
                  >
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#7c3ee9] font-mono text-sm font-black text-white">
                      0{idx + 1}
                    </span>
                    <h3 className="font-[family-name:var(--font-display)] text-lg font-extrabold text-[#111015]">
                      {st.title}
                    </h3>
                    <p className="text-sm text-[#5e5868] leading-relaxed">{st.detail}</p>
                  </li>
                ))}
              </ol>
            </div>
          </ScrollReveal>

          {/* Live Platform Service Cards */}
          <ScrollReveal>
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-black tracking-[-0.04em] text-[#111015] mb-6">
                {isPt
                  ? `Tabela atualizada de preços (${config.currency}) — ${config.platform.toUpperCase()}`
                  : `Live ${config.platform.toUpperCase()} Pricing (${config.currency})`}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {focusedServices.map((s) => {
                  const rate = getServiceMarketRate(s, config.currency);
                  return (
                    <div
                      key={s.id}
                      className="surface-card p-6 flex flex-col justify-between gap-5"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 font-mono text-xs text-[#796b89]">
                          <span>#{s.id}</span>
                          {s.refill && (
                            <span className="rounded-full bg-[#eafbf1] px-2.5 py-0.5 text-[#137a43] font-bold inline-flex items-center gap-1">
                              <ShieldCheck className="h-3.5 w-3.5" />
                              {s.refillDays}d refill
                            </span>
                          )}
                        </div>
                        <h3 className="mt-2 font-[family-name:var(--font-display)] text-lg font-extrabold text-[#111015]">
                          {getLocalizedServiceName(s, config.locale)}
                        </h3>
                      </div>

                      <div className="flex items-end justify-between border-t border-[#ece5f2] pt-4">
                        <div>
                          <div className="font-mono text-2xl font-extrabold text-[#7c3ee9]">
                            {formatCurrencyAmount(rate, config.currency)}
                          </div>
                          <div className="font-mono text-[11px] text-[#796b89]">
                            {isPt ? "por 1.000" : "per 1,000"}
                          </div>
                        </div>
                        <Link
                          href={
                            user
                              ? `/painel?service=${s.id}&qty=1000`
                              : `/login?tab=register&service=${s.id}&qty=1000`
                          }
                          className="btn-lime inline-flex h-10 items-center gap-1.5 px-4 text-xs font-bold uppercase"
                        >
                          {isPt ? "Pedir" : "Order"}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* FAQ Band */}
        <section className="fn-violet-band py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-[26px] bg-white p-7 sm:p-10 text-[#111015] shadow-[0_20px_50px_rgba(32,12,72,0.22)]">
              <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-black tracking-[-0.04em] mb-6">
                {config.faqHeading}
              </h2>
              <FaqAccordion items={config.faq} />
            </div>
          </div>
        </section>
      </main>

      <PublicFooter
        brandName={settings.brandName}
        supportEmail={settings.supportEmail}
        supportWhatsapp={settings.supportWhatsapp}
        locale={config.locale}
        routePrefix={routePrefix}
      />
    </div>
  );
}
