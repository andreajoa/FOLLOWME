import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { isBrazilBlackFridayActive, toBlackFridayConfig } from "@/lib/black-friday";
import { applyEffectiveBrlPricing } from "@/lib/black-friday-server";
import {
  AppCurrency,
  AppLocale,
  formatCurrencyAmount,
  getLocalizedServiceName,
  getServiceMarketRate,
  inferMetricType,
} from "@/lib/i18n";
import { PublicHeader } from "./public-header";
import { PublicFooter } from "./public-footer";
import { PackageSelector, StorefrontService } from "./package-selector";
import { FaqAccordion } from "./faq-accordion";
import { ScrollReveal } from "./motion-primitives";
import type { LandingFaqItem } from "@/lib/landing-copy";

export type PlatformSlug = "instagram" | "tiktok" | "youtube";

interface PlatformCopyBundle {
  title: string;
  description: string;
  eyebrow: string;
  headline: string;
  accent: string;
  subtext: string;
  benefits: string[];
  faq: LandingFaqItem[];
}

const PLATFORM_COPY: Record<PlatformSlug, Record<"en" | "pt", PlatformCopyBundle>> = {
  instagram: {
    en: {
      title: "Buy Instagram Followers, Likes, Views & Comments (USA) | FollowMe",
      description:
        "Order high-retention Instagram followers, instant likes, Reels views, and custom comments in USD. Starts in minutes, 30 to 365 day refill protection, zero passwords required.",
      eyebrow: "INSTAGRAM GROWTH · US MARKET PRICING",
      headline: "Buy Instagram followers, likes and Reels views ",
      accent: "without risking your account.",
      subtext:
        "Choose exact packages in USD with instant start, refill protection, and zero password access. Built for US creators, brands, and agencies.",
      benefits: [
        "Only your public @username or post link is needed",
        "Refill protection from 30 to 365 days on eligible follower tiers",
        "Optional Drip-Feed gradual pacing to keep growth natural",
      ],
      faq: [
        {
          q: "How much do 1,000 Instagram followers cost in the US?",
          a: "High-retention Instagram followers on FollowMe start at $11.99 per 1,000 for global 90-day refill tiers and $14.99 to $24.99 per 1,000 for premium active-look tiers.",
        },
        {
          q: "Is buying Instagram followers safe without my password?",
          a: "Yes. FollowMe never asks for your Instagram password or login access. Make sure your account is set to Public while your order is delivered.",
        },
        {
          q: "Can I order Instagram Reels views, likes, and custom comments together?",
          a: "Yes. Switch between Followers, Likes, Views, and Comments right inside the package builder above or combine multiple posts inside the dashboard.",
        },
      ],
    },
    pt: {
      title: "Comprar Seguidores Instagram, Curtidas, Views em Reels e Comentários | FollowMe",
      description:
        "Compre seguidores brasileiros e mundiais no Instagram, curtidas, visualizações em Reels e comentários personalizados com Pix instantâneo via Stripe e reposição garantida.",
      eyebrow: "CRESCIMENTO NO INSTAGRAM · PIX E CARTÃO",
      headline: "Seguidores, curtidas e views em Reels no Instagram ",
      accent: "com entrega rápida e sem senha.",
      subtext:
        "Veja exatamente quanto custa cada pacote em Reais, pague no Pix ou Cartão via Stripe e acompanhe em tempo real com garantia de reposição.",
      benefits: [
        "Precisamos apenas do seu @usuário ou link público",
        "Opções de seguidores brasileiros e mundiais com reposição de 30 a 365 dias",
        "Drip-Feed disponível para entrega gradual com ritmo natural",
      ],
      faq: [
        {
          q: "Quanto custam 1.000 seguidores no Instagram na FollowMe?",
          a: "No Brasil, 1.000 seguidores mundiais estáveis com reposição saem a partir de R$ 12,90 e seguidores brasileiros a partir de R$ 26,90 por milheiro.",
        },
        {
          q: "Preciso deixar meu Instagram aberto ou passar senha?",
          a: "Nunca pedimos sua senha. Basta manter o perfil em modo público durante a entrega para que os seguidores e curtidas sejam contabilizados.",
        },
        {
          q: "Posso comprar curtidas e visualizações em Reels no mesmo painel?",
          a: "Sim. Basta alternar entre Seguidores, Curtidas, Visualizações e Comentários no seletor acima e contratar em segundos.",
        },
      ],
    },
  },
  tiktok: {
    en: {
      title: "Buy TikTok Followers, Views & Likes (USA) | FollowMe",
      description:
        "Reach 1,000 TikTok followers to unlock TikTok LIVE and boost For You momentum with instant TikTok views and likes. Transparent USD pricing via Stripe.",
      eyebrow: "TIKTOK GROWTH · UNLOCK LIVE & FYP MOMENTUM",
      headline: "Unlock 1,000 TikTok followers and push your videos ",
      accent: "past the 200-view wall.",
      subtext:
        "Order TikTok followers, fast video views, and stable likes in USD. Zero password required, instant delivery start, and 30-day refill protection.",
      benefits: [
        "Reach the 1,000-follower threshold for TikTok LIVE faster",
        "High-speed video views starting at $1.49 per 1,000",
        "One-time Stripe checkout in USD with real-time status tracking",
      ],
      faq: [
        {
          q: "Can buying 1,000 TikTok followers help unlock TikTok LIVE?",
          a: "Yes. Reaching 1,000 followers satisfies TikTok's follower count threshold while keeping your account public and password-free.",
        },
        {
          q: "How fast do TikTok views and likes start?",
          a: "Most TikTok view and like orders begin delivering within 1 to 10 minutes after checkout.",
        },
      ],
    },
    pt: {
      title: "Comprar Seguidores TikTok, Visualizações e Curtidas no Brasil | FollowMe",
      description:
        "Libere as Lives com 1.000 seguidores no TikTok e impulsione seus vídeos no FYP com visualizações e curtidas instantâneas. Pague via Pix ou Cartão na Stripe.",
      eyebrow: "CRESCIMENTO NO TIKTOK · LIBERE LIVES E FYP",
      headline: "Chegue a 1.000 seguidores no TikTok e tire seus vídeos ",
      accent: "da trava das 200 views.",
      subtext:
        "Pacotes claros de seguidores, visualizações rápidas e curtidas para TikTok em Reais com Pix automático via Stripe e garantia de reposição.",
      benefits: [
        "Ajuda a bater os 1.000 seguidores para liberar TikTok Live",
        "Visualizações rápidas a partir de R$ 0,79 por 1.000",
        "Sem senha: informe apenas o link público do perfil ou vídeo",
      ],
      faq: [
        {
          q: "Comprar 1.000 seguidores no TikTok libera a opção de Live?",
          a: "Sim. Ao atingir 1.000 seguidores com o perfil público, você cumpre o requisito mínimo de seguidores exigido pelo TikTok para abrir transmissões ao vivo.",
        },
        {
          q: "Em quanto tempo entram as visualizações e curtidas?",
          a: "Visualizações no TikTok costumam iniciar em 1 a 5 minutos após a confirmação do pedido.",
        },
      ],
    },
  },
  youtube: {
    en: {
      title: "Buy YouTube Subscribers, High-Retention Views & Likes (USA) | FollowMe",
      description:
        "Build YouTube channel credibility with steady subscribers, high-retention views, and video likes. Transparent US pricing in USD, refill warranty, no login needed.",
      eyebrow: "YOUTUBE GROWTH · HIGH-RETENTION DELIVERY",
      headline: "Grow your YouTube channel with steady subscribers ",
      accent: "and high-retention views.",
      subtext:
        "Designed for creators, podcasts, and brands building authority on YouTube. Clear USD pricing, gradual natural pacing, and refill protection.",
      benefits: [
        "Steady natural daily delivery speed for channel safety",
        "High-retention views and likes to strengthen CTR and social proof",
        "30 to 365 day refill protection on eligible YouTube packages",
      ],
      faq: [
        {
          q: "How fast are YouTube subscribers delivered?",
          a: "YouTube subscribers are delivered gradually (typically 100 to 300 per day) so channel growth looks steady and maintains high retention.",
        },
        {
          q: "Do I need to give access to my YouTube Studio?",
          a: "Never. Provide only your public channel link or public video URL.",
        },
      ],
    },
    pt: {
      title: "Comprar Inscritos YouTube, Views Alta Retenção e Likes | FollowMe",
      description:
        "Fortaleça seu canal com inscritos estáveis, visualizações de alta retenção, horas de exibição e likes no YouTube. Pagamento Pix ou Cartão via Stripe.",
      eyebrow: "CRESCIMENTO NO YOUTUBE · ALTA RETENÇÃO",
      headline: "Fortaleça seu canal no YouTube com inscritos estáveis ",
      accent: "e views de alta retenção.",
      subtext:
        "Feito para criadores, podcasts e empresas que querem credibilidade real no YouTube. Preço claro em Reais, entrega gradual e garantia de reposição.",
      benefits: [
        "Velocidade natural diária para manter estabilidade do canal",
        "Visualizações de alta retenção e likes para reforçar prova social",
        "Garantia de reposição de 30 a 365 dias nos pacotes elegíveis",
      ],
      faq: [
        {
          q: "Qual a velocidade de entrega dos inscritos no YouTube?",
          a: "A entrega acontece de forma gradual (cerca de 100 a 300 inscritos por dia) para manter naturalidade e alta retenção no canal.",
        },
        {
          q: "Preciso dar acesso ao meu YouTube Studio?",
          a: "Nunca. Basta informar o link público do seu canal ou do vídeo.",
        },
      ],
    },
  },
};

export function buildPlatformMetadata(
  platform: PlatformSlug,
  locale: AppLocale,
  routePrefix: "" | "/en" | "/pt"
): Metadata {
  const bundle = PLATFORM_COPY[platform][locale === "pt" ? "pt" : "en"];
  return {
    title: bundle.title,
    description: bundle.description,
    alternates: {
      canonical: `${routePrefix}/${platform}`,
      languages: {
        "en-US": `/en/${platform}`,
        "pt-BR": `/pt/${platform}`,
        "x-default": `/en/${platform}`,
      },
    },
    openGraph: {
      title: bundle.title,
      description: bundle.description,
      locale: locale === "pt" ? "pt_BR" : "en_US",
      type: "website",
      images: ["/media/hero-creator.jpg"],
    },
  };
}

export async function PlatformSeoPage({
  platform,
  locale,
  currency,
  routePrefix = "",
}: {
  platform: PlatformSlug;
  locale: AppLocale;
  currency: AppCurrency;
  routePrefix?: "" | "/en" | "/pt";
}) {
  const [user, settings, rawServices] = await Promise.all([
    getCurrentUser(),
    getSiteSettings(),
    prisma.service.findMany({
      where: { isActive: true, category: { isActive: true } },
      include: { category: { select: { name: true, nameEn: true, network: true } } },
      orderBy: [{ isFeatured: "desc" }, { id: "asc" }],
    }),
  ]);

  const bfConfig = toBlackFridayConfig(settings);
  const blackFridayActive = isBrazilBlackFridayActive(bfConfig, locale, currency);
  const services = applyEffectiveBrlPricing(rawServices, bfConfig);

  const langKey = locale === "pt" ? "pt" : "en";
  const bundle = PLATFORM_COPY[platform][langKey];
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

  const platformOnly = storefrontServices.filter((s) => s.network === platform);

  const updatedIso = new Date().toISOString().slice(0, 10);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${appUrl}/#organization`,
        name: settings.brandName,
        url: appUrl,
        email: settings.supportEmail,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: settings.brandName, item: `${appUrl}${routePrefix || "/"}` },
          { "@type": "ListItem", position: 2, name: platform.toUpperCase(), item: `${appUrl}${routePrefix}/${platform}` },
        ],
      },
      {
        "@type": "Service",
        name: bundle.title,
        provider: { "@id": `${appUrl}/#organization` },
        areaServed: locale === "pt" ? ["BR"] : ["US", "CA", "GB", "AU"],
        description: bundle.description,
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: `${settings.brandName} ${platform} (${currency})`,
          itemListElement: platformOnly.slice(0, 10).map((s) => ({
            "@type": "Offer",
            name: getLocalizedServiceName(s, locale),
            price: getServiceMarketRate(s, currency).toFixed(2),
            priceCurrency: currency,
            availability: "https://schema.org/InStock",
            url: `${appUrl}${routePrefix}/${platform}`,
          })),
        },
      },
      {
        "@type": "Article",
        headline: bundle.title,
        description: bundle.description,
        datePublished: "2026-10-01",
        dateModified: updatedIso,
        author: {
          "@type": "Organization",
          name: `${settings.brandName} Growth Editorial Team`,
          url: appUrl,
        },
        publisher: { "@id": `${appUrl}/#organization` },
        inLanguage: locale === "pt" ? "pt-BR" : "en-US",
      },
      {
        "@type": "FAQPage",
        mainEntity: bundle.faq.map((f) => ({
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
          locale={locale}
          currency={currency}
          routePrefix={routePrefix}
          blackFridayActive={blackFridayActive}
        />

        <section>
          <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="fn-eyebrow-pill inline-flex items-center gap-2 px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider text-[#18141d]">
                <span className="h-2 w-2 rounded-full bg-[#8c42ed]" />
                <span>{bundle.eyebrow}</span>
              </div>
              <h1 className="mt-5 font-[family-name:var(--font-display)] text-4xl sm:text-5xl font-black tracking-[-0.05em] leading-[1.05] text-[#111015]">
                {bundle.headline}
                <span className="fn-sticker mt-1">{bundle.accent}</span>
              </h1>
              <p className="mt-5 text-base sm:text-lg font-medium text-[#66616d] leading-relaxed max-w-[60ch]">
                {bundle.subtext}
              </p>

              <ul className="mt-6 flex flex-col sm:flex-row flex-wrap gap-x-6 gap-y-2.5 text-sm font-semibold text-[#3f3947]">
                {bundle.benefits.map((b) => (
                  <li key={b} className="inline-flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#7c3ee9] shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-10">
              <PackageSelector
                services={storefrontServices}
                locale={locale}
                currency={currency}
                isLoggedIn={Boolean(user)}
                initialNetwork={platform}
                blackFridayActive={blackFridayActive}
              />
            </div>
          </div>
        </section>
      </div>

      <main className="flex-1">
        {/* Transparent full list for this platform */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <ScrollReveal>
            <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-black tracking-[-0.04em] text-[#111015] mb-6">
              {locale === "pt"
                ? `Todos os pacotes disponíveis para ${platform.charAt(0).toUpperCase() + platform.slice(1)}`
                : `All ${platform.charAt(0).toUpperCase() + platform.slice(1)} packages`}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {platformOnly.map((s) => {
                const rate = getServiceMarketRate(s, currency);
                return (
                  <div
                    key={s.id}
                    className="surface-card p-6 flex flex-col justify-between gap-5 hover:border-[#cbb6f0] transition-colors"
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
                        {getLocalizedServiceName(s, locale)}
                      </h3>
                    </div>

                    <div className="flex items-end justify-between border-t border-[#ece5f2] pt-4">
                      <div>
                        <div className="font-mono text-2xl font-extrabold text-[#7c3ee9]">
                          {formatCurrencyAmount(rate, currency)}
                        </div>
                        <div className="font-mono text-[11px] text-[#796b89]">
                          {s.type === "PACKAGE"
                            ? locale === "pt"
                              ? "pacote fechado"
                              : "flat package"
                            : locale === "pt"
                              ? "por 1.000"
                              : "per 1,000"}
                        </div>
                      </div>
                      <Link
                        href={
                          user
                            ? `/painel?service=${s.id}&qty=1000`
                            : `/login?tab=register&service=${s.id}&qty=1000`
                        }
                        className="btn-lime inline-flex h-10 items-center gap-1.5 px-4 text-xs font-bold uppercase tracking-wider"
                      >
                        {locale === "pt" ? "Pedir" : "Order"}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollReveal>
        </section>

        {/* Platform FAQ inside FlowNexa Violet Band */}
        <section className="fn-violet-band py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-[26px] bg-white p-7 sm:p-10 text-[#111015] shadow-[0_20px_50px_rgba(32,12,72,0.22)]">
              <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-black tracking-[-0.04em] mb-6">
                {locale === "pt" ? "Dúvidas frequentes" : "Frequently asked questions"}
              </h2>
              <FaqAccordion items={bundle.faq} />
            </div>
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
