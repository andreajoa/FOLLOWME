import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Code2,
  CreditCard,
  QrCode,
  ShieldCheck,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import {
  AppCurrency,
  AppLocale,
  formatCurrencyAmount,
  getLocalizedServiceName,
  getServiceMarketRate,
  inferMetricType,
  ServiceMetricType,
} from "@/lib/i18n";
import { getLandingCopy } from "@/lib/landing-copy";
import { PublicHeader } from "./public-header";
import { PublicFooter } from "./public-footer";
import { PackageSelector, StorefrontService } from "./package-selector";
import {
  AmbientVideoBackdrop,
  OdometerNumber,
  ScrollReveal,
  SpotlightSurface,
} from "./motion-primitives";
import { FaqAccordion } from "./faq-accordion";

interface LandingPageViewProps {
  locale: AppLocale;
  currency: AppCurrency;
  routePrefix?: "" | "/en" | "/pt";
}

const NETWORK_ORDER: Array<{
  id: "instagram" | "tiktok" | "youtube";
  label: string;
}> = [
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube" },
];

export async function LandingPageView({
  locale,
  currency,
  routePrefix = "",
}: LandingPageViewProps) {
  const [user, settings, services] = await Promise.all([
    getCurrentUser(),
    getSiteSettings(),
    prisma.service.findMany({
      where: { isActive: true, category: { isActive: true } },
      include: { category: { select: { name: true, nameEn: true, network: true } } },
      orderBy: [{ isFeatured: "desc" }, { id: "asc" }],
    }),
  ]);

  const copy = getLandingCopy(locale);
  const appUrl = (process.env.APP_URL || "https://followme.nexaclouds.online").replace(/\/+$/, "");

  const storefrontServices: StorefrontService[] = services.map((s) => ({
    id: s.id,
    name: s.name,
    nameEn: s.nameEn,
    categoryName: locale === "pt" ? s.category.name : s.category.nameEn || s.category.name,
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

  // Build crisp network-by-network directory (Instagram, TikTok, YouTube)
  const directoryGroups = NETWORK_ORDER.map((net) => {
    const netItems = storefrontServices.filter(
      (s) => s.network === net.id && s.type !== "PACKAGE" && s.type !== "SUBSCRIPTIONS"
    );
    const metricOrder: ServiceMetricType[] = ["followers", "likes", "views", "comments"];
    const rows = metricOrder
      .map((m) => {
        const matches = netItems
          .filter((s) => (s.metricType || inferMetricType(s.name, s.type)) === m)
          .sort((a, b) => getServiceMarketRate(a, currency) - getServiceMarketRate(b, currency));
        const best = matches.find((s) => s.refill) || matches[0];
        if (!best) return null;
        const label =
          m === "followers"
            ? net.id === "youtube"
              ? copy.selector.goals.subscribers
              : copy.selector.goals.followers
            : m === "likes"
              ? copy.selector.goals.likes
              : m === "views"
                ? copy.selector.goals.views
                : copy.selector.goals.comments;
        return {
          metric: m,
          label,
          serviceId: best.id,
          serviceName: getLocalizedServiceName(best, locale),
          rate: getServiceMarketRate(best, currency),
          refillDays: best.refill ? best.refillDays : 0,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    return {
      ...net,
      rows,
      href: `${routePrefix}/${net.id}`,
    };
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: settings.brandName,
        url: appUrl,
        email: settings.supportEmail,
        description: copy.metaDescription,
      },
      {
        "@type": "WebSite",
        name: settings.brandName,
        url: appUrl,
        inLanguage: locale === "pt" ? "pt-BR" : locale === "es" ? "es" : "en-US",
      },
      {
        "@type": "FAQPage",
        mainEntity: copy.faq.items.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.a,
          },
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090A0C] text-[#F4F5F6]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PublicHeader
        brandName={settings.brandName}
        user={user ? { username: user.username, role: user.role } : null}
        locale={locale}
        currency={currency}
        routePrefix={routePrefix}
      />

      <main className="flex-1">
        {/* SECTION 1: CINEMATIC AMBIENT VIDEO HERO (Pain-first hook, fits above the fold) */}
        <section className="relative min-h-[82dvh] flex items-center overflow-hidden border-b border-[#232730]">
          <AmbientVideoBackdrop
            src="/media/hero-loop.mp4"
            poster="/media/hero-creator.jpg"
            playbackRate={0.82}
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#090A0C] via-[#090A0C]/88 to-[#090A0C]/25"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#090A0C] via-transparent to-[#090A0C]/40"
            aria-hidden="true"
          />

          <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="max-w-2xl reveal-up">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#C8FF2E]">
                {copy.hero.eyebrow}
              </p>

              <h1 className="mt-5 font-[family-name:var(--font-display)] text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.03] text-[#F4F5F6]">
                {copy.hero.headlineStart}
                <span className="text-[#C8FF2E]">{copy.hero.headlineAccent}</span>
              </h1>

              <p className="mt-6 max-w-[52ch] text-base sm:text-lg text-[#D2D7E0] leading-relaxed">
                {copy.hero.subtext}
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                <a
                  href="#packages"
                  className="btn-lime inline-flex h-12 items-center justify-center gap-2 px-7 text-sm font-bold whitespace-nowrap"
                >
                  {copy.hero.primaryCta}
                  <ArrowRight className="h-4 w-4" />
                </a>
                <Link
                  href="/servicos"
                  className="btn-outline inline-flex h-12 items-center justify-center gap-2 px-6 text-sm font-medium bg-[#090A0C]/60 whitespace-nowrap"
                >
                  {copy.hero.secondaryCta}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: ANIMATED PROOF METRICS BAR (lives directly under hero) */}
        <section className="border-b border-[#232730] bg-[#0D0F14]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 divide-x divide-[#232730]">
              {copy.proofStrip.map((item) => (
                <div key={item.label} className="px-4 py-7 sm:px-6">
                  <div className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold text-[#C8FF2E]">
                    <OdometerNumber
                      target={item.value}
                      prefix={item.prefix}
                      suffix={item.suffix}
                      locale={locale}
                    />
                  </div>
                  <div className="mt-1 text-xs sm:text-sm text-[#98A0AD]">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 3: INSTANT INTERACTIVE PACKAGE BUILDER */}
        <section
          id="packages"
          className="scroll-mt-20 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
        >
          <ScrollReveal>
            <div className="max-w-2xl mb-10">
              <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.08]">
                {copy.selector.heading}
              </h2>
              <p className="mt-4 text-base text-[#98A0AD] leading-relaxed max-w-[60ch]">
                {copy.selector.subtext}
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delayMs={80}>
            <PackageSelector
              services={storefrontServices}
              locale={locale}
              currency={currency}
              isLoggedIn={Boolean(user)}
            />
          </ScrollReveal>
        </section>

        {/* SECTION 4: VISUAL PAIN-POINT STORYTELLING (Looping videos + editorial photos) */}
        <section className="border-y border-[#232730] bg-[#0C0E12] py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
            <ScrollReveal>
              <div className="max-w-2xl">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#C8FF2E]">
                  {copy.pains.eyebrow}
                </p>
                <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.08]">
                  {copy.pains.heading}
                </h2>
                <p className="mt-4 text-base text-[#98A0AD] leading-relaxed max-w-[62ch]">
                  {copy.pains.subtext}
                </p>
              </div>
            </ScrollReveal>

            {/* Pain 1: Featured full-width asymmetric 7/5 row with looping ambient video */}
            <ScrollReveal>
              <SpotlightSurface className="grid grid-cols-1 lg:grid-cols-12 border border-[#232730] bg-[#111317] overflow-hidden">
                <div className="lg:col-span-7 relative min-h-[300px] sm:min-h-[380px] overflow-hidden bg-[#090A0C]">
                  <AmbientVideoBackdrop
                    src="/media/pain-loop-1.mp4"
                    poster="/media/pain-invisible.jpg"
                    playbackRate={0.9}
                  />
                  <div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#090A0C]/70 via-transparent to-transparent"
                    aria-hidden="true"
                  />
                </div>

                <div className="lg:col-span-5 p-7 sm:p-10 flex flex-col justify-between gap-6">
                  <div>
                    <span className="font-mono text-[11px] text-[#C8FF2E]">
                      {copy.pains.items[0].tag}
                    </span>
                    <h3 className="mt-3 font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold leading-tight text-[#F4F5F6]">
                      {copy.pains.items[0].title}
                    </h3>
                    <p className="mt-4 text-sm sm:text-base text-[#98A0AD] leading-relaxed">
                      {copy.pains.items[0].pain}
                    </p>
                    <p className="mt-3 text-sm sm:text-base text-[#F4F5F6] leading-relaxed">
                      {copy.pains.items[0].fix}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 border border-[#232730] bg-[#0B0D11]">
                    <div className="p-4 border-r border-[#232730]">
                      <div className="text-[11px] text-[#68707E]">
                        {copy.pains.beforeLabel}
                      </div>
                      <div className="mt-1 font-mono text-base font-bold text-[#98A0AD] line-through">
                        {copy.pains.items[0].statBefore}
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="text-[11px] text-[#C8FF2E]">
                        {copy.pains.afterLabel}
                      </div>
                      <div className="mt-1 font-mono text-base font-bold text-[#C8FF2E]">
                        {copy.pains.items[0].statAfter}
                      </div>
                    </div>
                  </div>
                </div>
              </SpotlightSurface>
            </ScrollReveal>

            {/* Pain 2 & Pain 3: Asymmetric 5/7 Editorial Spread with looping studio motion */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {[
                {
                  pain: copy.pains.items[1],
                  video: "/media/pain-loop-2.mp4",
                  poster: "/media/pain-trust.jpg",
                  span: "lg:col-span-5",
                },
                {
                  pain: copy.pains.items[2],
                  video: "/media/pain-loop-3.mp4",
                  poster: "/media/pain-slow.jpg",
                  span: "lg:col-span-7",
                },
              ].map((block, idx) => (
                <ScrollReveal key={block.pain.tag} delayMs={idx * 100} className={block.span}>
                  <SpotlightSurface className="h-full flex flex-col border border-[#232730] bg-[#111317] overflow-hidden">
                    <div className="relative h-64 sm:h-72 overflow-hidden bg-[#090A0C]">
                      <AmbientVideoBackdrop
                        src={block.video}
                        poster={block.poster}
                        playbackRate={0.9}
                      />
                      <div
                        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#111317] via-transparent to-transparent"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="p-7 sm:p-8 flex-1 flex flex-col justify-between gap-6">
                      <div>
                        <span className="font-mono text-[11px] text-[#C8FF2E]">
                          {block.pain.tag}
                        </span>
                        <h3 className="mt-2.5 font-[family-name:var(--font-display)] text-2xl font-bold leading-snug text-[#F4F5F6]">
                          {block.pain.title}
                        </h3>
                        <p className="mt-3 text-sm text-[#98A0AD] leading-relaxed">
                          {block.pain.pain}
                        </p>
                        <p className="mt-2.5 text-sm text-[#F4F5F6] leading-relaxed">
                          {block.pain.fix}
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-[#232730] pt-4 font-mono text-xs">
                        <span className="text-[#68707E] line-through">
                          {block.pain.statBefore}
                        </span>
                        <span className="text-[#C8FF2E] font-bold">
                          {block.pain.statAfter}
                        </span>
                      </div>
                    </div>
                  </SpotlightSurface>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 5: CLEAR PLATFORM-BY-PLATFORM PRICE DIRECTORY (Instagram, TikTok, YouTube) */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="max-w-2xl mb-12">
              <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.08]">
                {copy.directory.heading}
              </h2>
              <p className="mt-4 text-base text-[#98A0AD] leading-relaxed max-w-[60ch]">
                {copy.directory.subtext}
              </p>
            </div>
          </ScrollReveal>

          <div className="space-y-8">
            {directoryGroups.map((group, groupIdx) => (
              <ScrollReveal key={group.id} delayMs={groupIdx * 80}>
                <div className="border border-[#232730] bg-[#111317]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#232730] bg-[#15181F] px-6 py-4">
                    <h3 className="font-[family-name:var(--font-display)] text-xl sm:text-2xl font-bold text-[#F4F5F6]">
                      {group.label}
                    </h3>
                    <Link
                      href={group.href}
                      className="inline-flex items-center gap-1.5 font-mono text-xs text-[#C8FF2E] hover:underline"
                    >
                      {copy.directory.viewAllNetwork}
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#232730]">
                    {group.rows.map((row) => (
                      <div
                        key={`${group.id}-${row.metric}`}
                        className="p-6 flex flex-col justify-between gap-5 hover:bg-[#161921] transition-colors"
                      >
                        <div>
                          <div className="text-xs font-mono text-[#98A0AD]">
                            {group.label} · {row.label}
                          </div>
                          <div className="mt-3 flex items-baseline gap-1.5">
                            <span className="font-mono text-2xl font-bold text-[#C8FF2E] tabular-nums">
                              {formatCurrencyAmount(row.rate, currency)}
                            </span>
                            <span className="font-mono text-xs text-[#68707E]">
                              {copy.directory.per1k}
                            </span>
                          </div>
                          <p className="mt-2 text-xs text-[#98A0AD] leading-relaxed line-clamp-2">
                            {row.serviceName}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-[#232730]">
                          <span className="font-mono text-[11px] text-[#98A0AD]">
                            {row.refillDays > 0
                              ? `${row.refillDays}d refill`
                              : copy.directory.fromLabel}
                          </span>
                          <Link
                            href={
                              user
                                ? `/painel?service=${row.serviceId}&qty=1000`
                                : `/login?tab=register&service=${row.serviceId}&qty=1000`
                            }
                            className="inline-flex items-center gap-1 font-mono text-xs font-bold text-[#C8FF2E] hover:underline"
                          >
                            {copy.directory.orderNow}
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* SECTION 6: 3-STEP FRICTIONLESS FLOW */}
        <section className="border-y border-[#232730] bg-[#0C0E12] py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="max-w-2xl mb-12">
                <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-bold tracking-tight">
                  {copy.howItWorks.heading}
                </h2>
                <p className="mt-3 text-base text-[#98A0AD] leading-relaxed">
                  {copy.howItWorks.subtext}
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-3 border border-[#232730] bg-[#111317] divide-y md:divide-y-0 md:divide-x divide-[#232730]">
              {copy.howItWorks.steps.map((step, idx) => (
                <ScrollReveal key={step.num} delayMs={idx * 90}>
                  <div className="p-7 sm:p-8 h-full flex flex-col justify-between gap-6">
                    <span className="font-mono text-3xl font-bold text-[#C8FF2E]">
                      {step.num}
                    </span>
                    <div>
                      <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-[#F4F5F6]">
                        {step.title}
                      </h3>
                      <p className="mt-2.5 text-sm text-[#98A0AD] leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border border-[#232730] bg-[#111317] px-6 py-4 text-xs sm:text-sm text-[#98A0AD]">
              <div className="flex items-center gap-3">
                {currency === "BRL" ? (
                  <QrCode className="h-4 w-4 text-[#C8FF2E] shrink-0" />
                ) : (
                  <CreditCard className="h-4 w-4 text-[#C8FF2E] shrink-0" />
                )}
                <span>{copy.howItWorks.paymentNote}</span>
              </div>
              <span className="inline-flex items-center gap-1.5 font-mono text-xs text-[#F4F5F6]">
                <ShieldCheck className="h-4 w-4 text-[#C8FF2E]" />
                Stripe Verified
              </span>
            </div>
          </div>
        </section>

        {/* SECTION 7: GEO-OPTIMIZED FAQ ACCORDION + COMPACT AGENCY STRIP */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <ScrollReveal className="lg:col-span-4">
              <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
                {copy.faq.heading}
              </h2>
              <p className="mt-4 text-sm sm:text-base text-[#98A0AD] leading-relaxed">
                {copy.faq.subtext}
              </p>
              <div className="mt-7">
                <a
                  href="#packages"
                  className="btn-lime inline-flex h-11 items-center gap-2 px-6 text-sm font-bold whitespace-nowrap"
                >
                  {copy.hero.primaryCta}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </ScrollReveal>

            <ScrollReveal delayMs={80} className="lg:col-span-8">
              <FaqAccordion items={copy.faq.items} />
            </ScrollReveal>
          </div>

          {/* Compact Agency / Reseller Strip */}
          <ScrollReveal delayMs={120}>
            <div className="mt-16 flex flex-col lg:flex-row lg:items-center justify-between gap-6 border border-[#232730] bg-[#111317] p-7 sm:p-9">
              <div className="flex items-start gap-4 max-w-2xl">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-[#323845] bg-[#0B0D11]">
                  <Code2 className="h-5 w-5 text-[#C8FF2E]" />
                </div>
                <div>
                  <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-[#F4F5F6]">
                    {copy.agencyBanner.heading}
                  </h3>
                  <p className="mt-1.5 text-sm text-[#98A0AD] leading-relaxed">
                    {copy.agencyBanner.subtext}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <Link
                  href="/api-docs"
                  className="btn-outline inline-flex h-11 items-center gap-2 px-5 text-xs font-mono uppercase tracking-wider whitespace-nowrap"
                >
                  {copy.agencyBanner.ctaApi}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/parcerias"
                  className="btn-outline inline-flex h-11 items-center gap-2 px-5 text-xs font-mono uppercase tracking-wider whitespace-nowrap"
                >
                  {copy.agencyBanner.ctaPartners}
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </section>
      </main>

      <PublicFooter
        brandName={settings.brandName}
        supportEmail={settings.supportEmail}
        supportWhatsapp={settings.supportWhatsapp}
        locale={locale}
        routePrefix={routePrefix}
      />
    </div>
  );
}
