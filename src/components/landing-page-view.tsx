import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Code2,
  CreditCard,
  QrCode,
  ShieldCheck,
  Sparkles,
  TrendingUp,
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
  const isPt = locale === "pt";
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

  const painEvidenceCards = [
    {
      num: "01",
      pain: copy.pains.items[0],
      video: "/media/pain-loop-1.mp4?v=flow2",
      poster: "/media/pain-invisible.jpg?v=flow2",
      cardClass: "fn-evidence-mint",
      accentColor: "#64d893",
      pillBg: "bg-[#e7faef] text-[#0e6b38]",
    },
    {
      num: "02",
      pain: copy.pains.items[1],
      video: "/media/pain-loop-2.mp4?v=flow2",
      poster: "/media/pain-trust.jpg?v=flow2",
      cardClass: "fn-evidence-gold",
      accentColor: "#f8d449",
      pillBg: "bg-[#fef7d8] text-[#7c5c00]",
    },
    {
      num: "03",
      pain: copy.pains.items[2],
      video: "/media/pain-loop-3.mp4?v=flow2",
      poster: "/media/pain-slow.jpg?v=flow2",
      cardClass: "fn-evidence-aqua",
      accentColor: "#68d4cf",
      pillBg: "bg-[#e5faf8] text-[#0e6a66]",
    },
  ];

  const tickerItems = isPt
    ? [
        "Instagram Seguidores BR & Mundiais",
        "TikTok Views & Seguidores LIVE",
        "YouTube Inscritos & Alta Retenção",
        "Pagamento Pix & Cartão via Stripe",
        "Zero Senha · Apenas @usuário",
        "Reposição 30 a 365 Dias",
      ]
    : [
        "Instagram Followers & Reels Views",
        "TikTok LIVE Unlock & FYP Views",
        "YouTube Subscribers & Watch Time",
        "Stripe Verified USD Checkout",
        "Zero Password · Public @handle Only",
        "30 to 365-Day Refill Protection",
      ];

  const updatedIso = new Date().toISOString().slice(0, 10);

  const liveOfferItems = directoryGroups.flatMap((group) =>
    group.rows.map((row) => ({
      "@type": "Offer",
      name: `${group.label} ${row.label} — ${row.serviceName}`,
      price: row.rate.toFixed(2),
      priceCurrency: currency,
      availability: "https://schema.org/InStock",
      url: `${appUrl}${group.href}`,
    }))
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
        description: copy.metaDescription,
        areaServed: ["US", "BR", "CA", "GB", "AU"],
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: settings.supportEmail,
          availableLanguage: ["English", "Portuguese", "Spanish"],
        },
      },
      {
        "@type": "WebSite",
        "@id": `${appUrl}/#website`,
        name: settings.brandName,
        url: appUrl,
        publisher: { "@id": `${appUrl}/#organization` },
        inLanguage: locale === "pt" ? "pt-BR" : locale === "es" ? "es" : "en-US",
      },
      {
        "@type": "Service",
        name: copy.metaTitle,
        description: copy.metaDescription,
        provider: { "@id": `${appUrl}/#organization` },
        areaServed: locale === "pt" ? ["BR"] : ["US", "CA", "GB", "AU"],
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: `${settings.brandName} Social Growth Catalog (${currency})`,
          itemListElement: liveOfferItems,
        },
      },
      {
        "@type": "HowTo",
        name: copy.howItWorks.heading,
        description: copy.howItWorks.subtext,
        step: copy.howItWorks.steps.map((s, idx) => ({
          "@type": "HowToStep",
          position: idx + 1,
          name: s.title,
          text: s.desc,
        })),
      },
      {
        "@type": "Article",
        headline: copy.metaTitle,
        description: copy.metaDescription,
        datePublished: "2026-10-01",
        dateModified: updatedIso,
        author: {
          "@type": "Organization",
          name: `${settings.brandName} Growth Editorial Team`,
          url: appUrl,
        },
        publisher: { "@id": `${appUrl}/#organization` },
        inLanguage: locale === "pt" ? "pt-BR" : locale === "es" ? "es" : "en-US",
      },
      {
        "@type": "VideoObject",
        name: isPt
          ? "FollowMe — Como transformar um perfil parado em autoridade imediata"
          : "FollowMe — Turning quiet social profiles into instant credibility",
        description: copy.hero.subtext,
        thumbnailUrl: `${appUrl}/media/hero-creator.jpg`,
        contentUrl: `${appUrl}/media/hero-loop.mp4`,
        uploadDate: "2026-11-22",
        duration: "PT10S",
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
    <div className="min-h-screen flex flex-col bg-[#faf8fd] text-[#111015]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* TOP HERO ZONE — FlowNexa Diagonal Lilac Grid + Lavender/Pink Radial Halos */}
      <div className="fn-hero-canvas">
        <PublicHeader
          brandName={settings.brandName}
          user={user ? { username: user.username, role: user.role } : null}
          locale={locale}
          currency={currency}
          routePrefix={routePrefix}
        />

        {/* SECTION 1: FLOWNEXA ASYMMETRIC 53/47 HERO WITH STICKER H1 & REAL FLOW VIDEO DEVICE */}
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 pt-10 pb-16 sm:px-6 sm:pt-14 sm:pb-20 lg:px-8 lg:pt-16 lg:pb-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
              {/* Left 53% (7 cols on lg) */}
              <div className="lg:col-span-6 xl:col-span-7 reveal-up">
                <div className="fn-eyebrow-pill inline-flex items-center gap-2 px-4 py-1.5 text-xs font-bold text-[#18141d]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#8c42ed]" />
                  <span>{copy.hero.eyebrow}</span>
                </div>

                <h1 className="mt-6 font-[family-name:var(--font-display)] text-[2.45rem] sm:text-[3.25rem] lg:text-[3.75rem] font-black tracking-[-0.055em] leading-[1.04] text-[#111015]">
                  {copy.hero.headlineStart}
                  <span className="fn-sticker mt-2">
                    {copy.hero.headlineAccent}
                  </span>
                </h1>

                <p className="mt-6 max-w-[54ch] text-base sm:text-lg font-medium text-[#66616d] leading-relaxed">
                  {copy.hero.subtext}
                </p>

                <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                  <a
                    href="#packages"
                    className="btn-lime inline-flex h-[52px] items-center justify-center gap-2 px-7 text-sm sm:text-base font-bold whitespace-nowrap"
                  >
                    {copy.hero.primaryCta}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                  <Link
                    href="/servicos"
                    className="btn-outline inline-flex h-[52px] items-center justify-center gap-2 px-6 text-sm sm:text-base font-semibold whitespace-nowrap"
                  >
                    {copy.hero.secondaryCta}
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm font-semibold text-[#574f63]">
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-[#7c3ee9]" />
                    {isPt ? "Zero senha necessária" : "Zero password required"}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-[#7c3ee9]" />
                    {isPt ? "Pix & Cartão via Stripe" : "Stripe Verified USD"}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-[#7c3ee9]" />
                    {isPt ? "Garantia de reposição" : "Refill protection"}
                  </span>
                </div>
              </div>

              {/* Right 47% (5-6 cols on lg): FlowNexa radial violet/pink halo + dark-bezel real video showcase */}
              <div className="lg:col-span-6 xl:col-span-5 relative reveal-up">
                <div
                  className="pointer-events-none absolute -inset-6 rounded-full opacity-90 blur-2xl"
                  style={{
                    background:
                      "radial-gradient(circle at 42% 45%, #e9c9ff 0%, #f5dcfa 46%, transparent 74%)",
                  }}
                  aria-hidden="true"
                />

                <div className="relative">
                  {/* Top-left neo-brutalist live badge */}
                  <div className="hidden sm:inline-flex items-center gap-2 rounded-2xl border-2 border-[#18141d] bg-white px-3.5 py-2 shadow-[5px_5px_0_#18141d] absolute -top-5 -left-4 z-20">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e9ddfa] text-[#7c3ee9]">
                      <TrendingUp className="h-4 w-4" />
                    </span>
                    <div className="leading-tight">
                      <div className="text-[11px] font-extrabold text-[#111015]">
                        {isPt ? "+1.000 Seguidores" : "+1,000 Followers"}
                      </div>
                      <div className="text-[10px] font-semibold text-[#66616d]">
                        {isPt ? "Início automático em minutos" : "Auto-starts in minutes"}
                      </div>
                    </div>
                  </div>

                  {/* Sleek FlowNexa showcase device frame playing REAL Google Flow video */}
                  <div className="relative rounded-[30px] border-[9px] border-[#242432] bg-[#141022] shadow-[0_28px_70px_rgba(61,27,108,0.22)] overflow-hidden aspect-[16/11]">
                    <AmbientVideoBackdrop
                      src="/media/hero-loop.mp4?v=flow2"
                      poster="/media/hero-creator.jpg?v=flow2"
                      playbackRate={1}
                    />
                    <div
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#130d26]/70 via-transparent to-transparent"
                      aria-hidden="true"
                    />
                    <div className="pointer-events-none absolute bottom-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2 rounded-xl bg-white/95 backdrop-blur-sm border border-[#ece5f2] px-3.5 py-2.5 shadow-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#64d893] shrink-0" />
                        <span className="truncate text-xs font-extrabold text-[#111015]">
                          {isPt ? "Autoridade imediata · 24h no ar" : "Instant social proof · Live 24/7"}
                        </span>
                      </div>
                      <span className="rounded-full bg-[#f3ebff] px-2.5 py-0.5 font-mono text-[11px] font-extrabold text-[#7c3ee9] shrink-0">
                        {currency}
                      </span>
                    </div>
                  </div>

                  {/* Bottom-right floating proof pill */}
                  <div className="hidden sm:inline-flex items-center gap-2 rounded-2xl border-2 border-[#18141d] bg-[#64d893] px-3.5 py-2 shadow-[5px_5px_0_#18141d] absolute -bottom-5 -right-3 z-20 text-[#111015]">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-xs font-black tracking-tight">
                      {isPt ? "Reposição 30–365D" : "30–365D Refill"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <main className="flex-1">
        {/* SECTION 2: FLOWNEXA PURE WHITE SOCIAL-PROOF & METRICS STRIP */}
        <section className="border-y border-[#ece5f2] bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 divide-x divide-[#ece5f2]">
              {copy.proofStrip.map((item) => (
                <div key={item.label} className="px-4 py-7 sm:px-6">
                  <div className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-black tracking-[-0.04em] text-[#7c3ee9]">
                    <OdometerNumber
                      target={item.value}
                      prefix={item.prefix}
                      suffix={item.suffix}
                      locale={locale}
                    />
                  </div>
                  <div className="mt-1 text-xs sm:text-sm font-semibold text-[#66616d]">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subtle infinite FlowNexa ticker bar */}
          <div className="border-t border-[#f1ebf8] bg-[#faf8fd] py-3 overflow-hidden">
            <div className="animate-marquee gap-8 items-center">
              {[...tickerItems, ...tickerItems].map((label, idx) => (
                <div
                  key={`${label}-${idx}`}
                  className="inline-flex items-center gap-3 px-4 text-xs font-bold text-[#5a5168] whitespace-nowrap"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#8c42ed]" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 3: FLOWNEXA CENTERED CONVERSION STATEMENT + INTERACTIVE PACKAGE BUILDER */}
        <section
          id="packages"
          className="relative scroll-mt-24 overflow-hidden py-20 sm:py-24"
          style={{
            background: "linear-gradient(180deg, #f3f0ff 0%, #ffffff 38%, #faf8fd 100%)",
          }}
        >
          {/* Decorative FlowNexa pastel floating blobs */}
          <div
            className="pointer-events-none absolute -left-24 top-16 h-64 w-64 rounded-full bg-[#e5c2fa]/45 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -right-24 bottom-16 h-64 w-64 rounded-full bg-[#fbe0ee]/55 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="mx-auto max-w-3xl text-center mb-12">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#dfd2f5] bg-white px-4 py-1.5 text-xs font-bold text-[#7c3ee9] shadow-sm">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>
                    {isPt
                      ? "Escolha clara por rede · Preço exato na hora"
                      : "Clear network-by-network packages · Exact USD pricing"}
                  </span>
                </div>
                <h2 className="mt-4 font-[family-name:var(--font-display)] text-3xl sm:text-4xl lg:text-5xl font-black tracking-[-0.05em] leading-[1.05] text-[#111015]">
                  {copy.selector.heading}
                </h2>
                <p className="mt-4 mx-auto text-base sm:text-lg font-medium text-[#66616d] leading-relaxed max-w-[60ch]">
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
          </div>
        </section>

        {/* SECTION 4: REAL-WORLD PROBLEM VIDEOS IN FLOWNEXA POP-BRUTALIST EVIDENCE CARDS */}
        <section className="fn-evidence-bg border-y border-[#ece5f2] py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
            <ScrollReveal>
              <div className="mx-auto max-w-3xl text-center">
                <div className="fn-eyebrow-pill inline-flex items-center gap-2 px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider text-[#18141d]">
                  <span className="h-2 w-2 rounded-full bg-[#dd6bb4]" />
                  <span>{copy.pains.eyebrow}</span>
                </div>
                <h2 className="mt-5 font-[family-name:var(--font-display)] text-3xl sm:text-4xl lg:text-5xl font-black tracking-[-0.05em] leading-[1.06] text-[#111015]">
                  {copy.pains.heading}
                </h2>
                <p className="mt-4 mx-auto text-base sm:text-lg font-medium text-[#66616d] leading-relaxed max-w-[62ch]">
                  {copy.pains.subtext}
                </p>
              </div>
            </ScrollReveal>

            {/* 3 FlowNexa Pop-Brutalist Cards (Mint #64d893, Gold #f8d449, Aqua #68d4cf) with real Google Flow videos */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-7 lg:gap-8">
              {painEvidenceCards.map((card, idx) => (
                <ScrollReveal key={card.num} delayMs={idx * 90}>
                  <article
                    className={`fn-evidence-card ${card.cardClass} h-full flex flex-col overflow-hidden`}
                  >
                    {/* Real Looping Human Video Viewport */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden border-b-[4px] border-[#111016] bg-[#161124]">
                      <AmbientVideoBackdrop
                        src={card.video}
                        poster={card.poster}
                        playbackRate={1}
                      />
                      <div
                        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#111016]/75 via-transparent to-transparent"
                        aria-hidden="true"
                      />
                      <div className="pointer-events-none absolute top-3 left-3">
                        <span
                          className="fn-evidence-num font-[family-name:var(--font-display)] text-4xl font-black leading-none"
                          style={{ color: card.accentColor }}
                        >
                          {card.num}
                        </span>
                      </div>
                      <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 rounded-xl border-2 border-[#111016] bg-white/95 px-3 py-1.5 font-mono text-[11px] font-bold">
                        <span className="text-[#c83a3a] line-through">
                          {card.pain.statBefore}
                        </span>
                        <span className="text-[#7c3ee9] font-extrabold">
                          → {card.pain.statAfter}
                        </span>
                      </div>
                    </div>

                    <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between gap-5">
                      <div>
                        <span
                          className={`inline-block rounded-full px-3 py-1 font-mono text-[11px] font-bold ${card.pillBg}`}
                        >
                          {card.pain.tag}
                        </span>
                        <h3 className="mt-3 font-[family-name:var(--font-display)] text-xl sm:text-2xl font-black tracking-[-0.035em] leading-snug text-[#111015]">
                          {card.pain.title}
                        </h3>
                        <p className="mt-3 text-sm text-[#5e5868] leading-relaxed">
                          {card.pain.pain}
                        </p>
                        <p className="mt-2.5 text-sm font-semibold text-[#111015] leading-relaxed">
                          {card.pain.fix}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 rounded-xl border-2 border-[#111016] bg-[#faf8fd] p-3 text-xs">
                        <div>
                          <div className="font-mono text-[10px] uppercase text-[#796b89]">
                            {copy.pains.beforeLabel}
                          </div>
                          <div className="mt-0.5 font-mono font-bold text-[#9c3232] line-through">
                            {card.pain.statBefore}
                          </div>
                        </div>
                        <div className="border-l border-[#dfd7ec] pl-3">
                          <div className="font-mono text-[10px] uppercase text-[#7c3ee9]">
                            {copy.pains.afterLabel}
                          </div>
                          <div className="mt-0.5 font-mono font-extrabold text-[#111015]">
                            {card.pain.statAfter}
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 5: FLOWNEXA DOTTED VIOLET SHOWCASE BAND (PRICE DIRECTORY + 3-STEP FLOW) */}
        <section className="fn-violet-band relative overflow-hidden">
          {/* FlowNexa Curved White Top Wave */}
          <div className="w-full overflow-hidden leading-none" aria-hidden="true">
            <svg
              viewBox="0 0 1440 72"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="block w-full h-[38px] sm:h-[58px]"
              preserveAspectRatio="none"
            >
              <path
                d="M0,0 L1440,0 L1440,22 Q720,84 0,22 Z"
                fill="#ffffff"
              />
            </svg>
          </div>

          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 space-y-16">
            {/* Platform Price Directory */}
            <div>
              <ScrollReveal>
                <div className="mx-auto max-w-3xl text-center mb-12">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/12 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
                    {isPt ? "Tabela Transparente por Rede" : "Transparent Platform Rates"}
                  </span>
                  <h2 className="mt-4 font-[family-name:var(--font-display)] text-3xl sm:text-4xl lg:text-5xl font-black tracking-[-0.05em] leading-[1.06] text-white">
                    {copy.directory.heading}
                  </h2>
                  <p className="mt-4 mx-auto text-base sm:text-lg text-[#ece4ff] leading-relaxed max-w-[60ch]">
                    {copy.directory.subtext}
                  </p>
                </div>
              </ScrollReveal>

              <div className="space-y-6">
                {directoryGroups.map((group, groupIdx) => (
                  <ScrollReveal key={group.id} delayMs={groupIdx * 80}>
                    <div className="overflow-hidden rounded-[22px] bg-white text-[#111015] shadow-[0_18px_42px_rgba(32,12,72,0.22)]">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#ece5f2] bg-[#faf8fd] px-6 py-4">
                        <h3 className="font-[family-name:var(--font-display)] text-xl sm:text-2xl font-black tracking-[-0.03em] text-[#111015]">
                          {group.label}
                        </h3>
                        <Link
                          href={group.href}
                          className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#7c3ee9] hover:underline"
                        >
                          {copy.directory.viewAllNetwork}
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#ece5f2]">
                        {group.rows.map((row) => (
                          <div
                            key={`${group.id}-${row.metric}`}
                            className="p-6 flex flex-col justify-between gap-5 hover:bg-[#f9f6ff] transition-colors"
                          >
                            <div>
                              <div className="text-xs font-bold text-[#796b89]">
                                {group.label} · {row.label}
                              </div>
                              <div className="mt-3 flex items-baseline gap-1.5">
                                <span className="font-mono text-2xl font-extrabold text-[#7c3ee9] tabular-nums">
                                  {formatCurrencyAmount(row.rate, currency)}
                                </span>
                                <span className="font-mono text-xs text-[#796b89]">
                                  {copy.directory.per1k}
                                </span>
                              </div>
                              <p className="mt-2 text-xs font-medium text-[#5e5868] leading-relaxed line-clamp-2">
                                {row.serviceName}
                              </p>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-[#ece5f2]">
                              <span className="font-mono text-[11px] font-semibold text-[#66616d]">
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
                                className="inline-flex items-center gap-1 text-xs font-extrabold text-[#7c3ee9] hover:text-[#56249f]"
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
            </div>

            {/* 3-Step Flow inside the Violet Showcase Band */}
            <div className="pt-4">
              <ScrollReveal>
                <div className="mx-auto max-w-2xl text-center mb-10">
                  <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-black tracking-[-0.045em] text-white">
                    {copy.howItWorks.heading}
                  </h2>
                  <p className="mt-3 text-base text-[#ece4ff] leading-relaxed">
                    {copy.howItWorks.subtext}
                  </p>
                </div>
              </ScrollReveal>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {copy.howItWorks.steps.map((step, idx) => (
                  <ScrollReveal key={step.num} delayMs={idx * 90}>
                    <div className="h-full rounded-[20px] bg-white/95 p-7 text-[#111015] shadow-[0_14px_34px_rgba(32,12,72,0.2)] flex flex-col justify-between gap-5">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f2e8ff] font-mono text-lg font-black text-[#7c3ee9]">
                        {step.num}
                      </span>
                      <div>
                        <h3 className="font-[family-name:var(--font-display)] text-xl font-black tracking-[-0.03em] text-[#111015]">
                          {step.title}
                        </h3>
                        <p className="mt-2.5 text-sm font-medium text-[#5e5868] leading-relaxed">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-[18px] border border-white/25 bg-white/12 backdrop-blur-sm px-6 py-4 text-xs sm:text-sm text-white">
                <div className="flex items-center gap-3">
                  {currency === "BRL" ? (
                    <QrCode className="h-4 w-4 text-[#f8d449] shrink-0" />
                  ) : (
                    <CreditCard className="h-4 w-4 text-[#f8d449] shrink-0" />
                  )}
                  <span className="font-medium">{copy.howItWorks.paymentNote}</span>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 font-mono text-xs font-extrabold text-[#111015]">
                  <ShieldCheck className="h-4 w-4 text-[#7c3ee9]" />
                  Stripe Verified
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 6: FLOWNEXA GEO SUMMARY + FAQ SHOWCASE (WHITE ROUNDED CARDS OVER VIOLET DOTTED BACKDROP) */}
        <section className="fn-violet-band pt-4 pb-16 sm:pb-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-8">
            {/* GEO Answer-First Entity Definition & Comparison Table (built for users + AI search citations) */}
            <ScrollReveal>
              <div className="rounded-[26px] bg-white p-7 sm:p-10 text-[#111015] shadow-[0_22px_54px_rgba(32,12,72,0.22)] space-y-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#ece5f2] pb-5">
                  <div className="max-w-2xl">
                    <span className="font-mono text-xs font-extrabold uppercase tracking-widest text-[#7945dc]">
                      {isPt ? "Resumo Comparativo Oficial" : "Official Comparison & Facts"}
                    </span>
                    <h2 className="mt-1.5 font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-black tracking-[-0.04em] text-[#111015]">
                      {isPt
                        ? `Por que criadores e agências escolhem a ${settings.brandName}`
                        : `Why creators and agencies choose ${settings.brandName}`}
                    </h2>
                    <p className="mt-2 text-sm text-[#5e5868] leading-relaxed">
                      {isPt ? (
                        <>
                          <dfn className="not-italic font-bold text-[#111015]">{settings.brandName}</dfn> é uma plataforma automatizada de crescimento social para Instagram, TikTok e YouTube com preços transparentes em Reais, pagamento Pix 24/7 via Stripe, garantia de reposição de até 365 dias e zero pedido de senha.
                        </>
                      ) : (
                        <>
                          <dfn className="not-italic font-bold text-[#111015]">{settings.brandName}</dfn> is defined as an automated social growth platform for Instagram, TikTok, and YouTube with transparent US pricing in USD, Stripe checkout, up to 365-day refill protection, and zero passwords ever required.
                        </>
                      )}
                    </p>
                  </div>
                  <div className="text-xs font-mono text-[#796b89] shrink-0">
                    <div>{isPt ? "Equipe Editorial FollowMe" : "FollowMe Growth Editorial Team"}</div>
                    <time dateTime={updatedIso}>
                      {isPt ? `Atualizado em ${updatedIso}` : `Last updated ${updatedIso}`}
                    </time>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-[#ece5f2] bg-[#faf8fd] font-mono text-[11px] uppercase tracking-wider text-[#796b89]">
                        <th className="px-4 py-3">{isPt ? "Critério" : "Criteria"}</th>
                        <th className="px-4 py-3 text-[#7c3ee9]">{settings.brandName}</th>
                        <th className="px-4 py-3">
                          {isPt ? "Agências / Crescimento Frio" : "Traditional Agencies / Cold Start"}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1ebf8]">
                      <tr>
                        <td className="px-4 py-3 font-bold text-[#111015]">
                          {isPt ? "Segurança da conta" : "Account security"}
                        </td>
                        <td className="px-4 py-3 font-semibold text-[#137a43]">
                          {isPt ? "Zero senha (apenas @público)" : "Zero passwords (public @handle only)"}
                        </td>
                        <td className="px-4 py-3 text-[#66616d]">
                          {isPt ? "Frequentemente exigem login e senha" : "Often demand account credentials"}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-bold text-[#111015]">
                          {isPt ? "Tempo de início" : "Delivery start speed"}
                        </td>
                        <td className="px-4 py-3 font-semibold text-[#137a43]">
                          {isPt ? "2 a 15 minutos (24/7 automático)" : "2–15 minutes (24/7 automated)"}
                        </td>
                        <td className="px-4 py-3 text-[#66616d]">
                          {isPt ? "Semanas ou meses sem tração" : "Months of cold posting"}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-bold text-[#111015]">
                          {isPt ? "Garantia contra quedas" : "Refill protection"}
                        </td>
                        <td className="px-4 py-3 font-semibold text-[#137a43]">
                          {isPt ? "Reposição de 30 a 365 dias" : "30 to 365-day refill warranty"}
                        </td>
                        <td className="px-4 py-3 text-[#66616d]">
                          {isPt ? "Sem garantia contratual" : "No drop protection"}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-bold text-[#111015]">
                          {isPt ? "Preço e pagamento" : "Pricing & checkout"}
                        </td>
                        <td className="px-4 py-3 font-semibold text-[#137a43]">
                          {isPt
                            ? "Pacote avulso em R$ no Pix/Cartão Stripe"
                            : "Transparent one-time USD via Stripe"}
                        </td>
                        <td className="px-4 py-3 text-[#66616d]">
                          {isPt ? "Mensalidades a partir de R$ 1.500/mês" : "$500–$2,500/mo agency retainers"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Regional Keyword Hubs (crawlable internal links for Google & AI engines) */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="font-mono text-[11px] font-bold uppercase text-[#796b89] mr-1">
                    {isPt ? "Guias diretos:" : "Direct guides:"}
                  </span>
                  {(isPt
                    ? [
                        { href: "/pt/comprar-seguidores-instagram", label: "Comprar Seguidores Instagram" },
                        { href: "/pt/comprar-curtidas-instagram", label: "Comprar Curtidas & Reels" },
                        { href: "/pt/comprar-seguidores-tiktok", label: "Comprar Seguidores TikTok" },
                        { href: "/pt/comprar-inscritos-youtube", label: "Comprar Inscritos YouTube" },
                      ]
                    : [
                        { href: "/en/buy-instagram-followers", label: "Buy Instagram Followers" },
                        { href: "/en/buy-instagram-likes", label: "Buy Instagram Likes & Reels" },
                        { href: "/en/buy-tiktok-followers", label: "Buy TikTok Followers" },
                        { href: "/en/buy-youtube-subscribers", label: "Buy YouTube Subscribers" },
                      ]
                  ).map((g) => (
                    <Link
                      key={g.href}
                      href={g.href}
                      className="rounded-full border border-[#e3d7f7] bg-[#f8f4ff] px-3 py-1 text-xs font-bold text-[#6730cf] hover:bg-[#7c3ee9] hover:text-white transition-colors"
                    >
                      {g.label}
                    </Link>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal>
              <div className="rounded-[26px] bg-white p-7 sm:p-11 lg:p-12 text-[#111015] shadow-[0_22px_54px_rgba(32,12,72,0.24)]">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                  <div className="lg:col-span-4">
                    <span className="font-mono text-xs font-extrabold uppercase tracking-widest text-[#7945dc]">
                      FAQ
                    </span>
                    <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-black tracking-[-0.045em] leading-tight text-[#111015]">
                      {copy.faq.heading}
                    </h2>
                    <p className="mt-4 text-sm sm:text-base font-medium text-[#66616d] leading-relaxed">
                      {copy.faq.subtext}
                    </p>
                    <div className="mt-7">
                      <a
                        href="#packages"
                        className="btn-lime inline-flex h-12 items-center gap-2 px-6 text-sm font-bold whitespace-nowrap"
                      >
                        {copy.hero.primaryCta}
                        <ArrowRight className="h-4 w-4" />
                      </a>
                    </div>
                  </div>

                  <div className="lg:col-span-8">
                    <FaqAccordion items={copy.faq.items} />
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Agency / API v2 Strip */}
            <ScrollReveal delayMs={100}>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 rounded-[24px] border-2 border-[#18141d] bg-white p-7 sm:p-9 text-[#111015] shadow-[8px_8px_0_#130d26]">
                <div className="flex items-start gap-4 max-w-2xl">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f2e8ff] text-[#7c3ee9]">
                    <Code2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-[family-name:var(--font-display)] text-xl sm:text-2xl font-black tracking-[-0.03em] text-[#111015]">
                      {copy.agencyBanner.heading}
                    </h3>
                    <p className="mt-1.5 text-sm font-medium text-[#66616d] leading-relaxed">
                      {copy.agencyBanner.subtext}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <Link
                    href="/api-docs"
                    className="btn-lime inline-flex h-11 items-center gap-2 px-5 text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                  >
                    {copy.agencyBanner.ctaApi}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href="/parcerias"
                    className="btn-outline inline-flex h-11 items-center gap-2 px-5 text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                  >
                    {copy.agencyBanner.ctaPartners}
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </div>
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
