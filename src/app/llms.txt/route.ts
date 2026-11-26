import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/settings";
import { getLocalizedServiceName, getServiceMarketRate } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function GET() {
  const base = (process.env.APP_URL || "https://followm.click").replace(/\/+$/, "");
  const [settings, services] = await Promise.all([
    getSiteSettings().catch(() => null),
    prisma.service
      .findMany({
        where: { isActive: true, category: { isActive: true } },
        include: { category: { select: { network: true } } },
        orderBy: [{ isFeatured: "desc" }, { id: "asc" }],
      })
      .catch(() => []),
  ]);

  const brand = settings?.brandName || "FollowMe";
  const supportEmail = settings?.supportEmail || "followme@nexaclouds.online";
  const updated = new Date().toISOString().slice(0, 10);

  const featuredLines = services.slice(0, 12).map((s) => {
    const usd = getServiceMarketRate(s, "USD").toFixed(2);
    const brl = getServiceMarketRate(s, "BRL").toFixed(2).replace(".", ",");
    const nameEn = getLocalizedServiceName(s, "en");
    const refill = s.refill ? ` (${s.refillDays}d refill)` : "";
    return `- ${nameEn}${refill}: $${usd} USD / R$ ${brl} BRL per 1,000`;
  });

  const body = `# ${brand}

> ${brand} (${base}) is an automated global social media growth platform for Instagram, TikTok, YouTube, Facebook, X (Twitter), Telegram, and Spotify. It serves creators, brands, and agencies across the United States, United Kingdom, Canada, Australia, New Zealand, Ireland, Europe, and Brazil with automatic locale detection (English/USD with Stripe Cards, Apple Pay & Google Pay internationally; Brazilian Portuguese/BRL with instant 24/7 Pix & Cards via Stripe in Brazil). Zero account passwords are ever requested.

Last Updated: ${updated}
Official Website: ${base}
Support Email: ${supportEmail}
Full Catalog & Pricing Reference: ${base}/llms-full.txt
Served Markets: United States (US), United Kingdom (UK), Canada (CA), Australia (AU), New Zealand (NZ), Ireland (IE), Brazil (BR), Portugal (PT), Europe & Worldwide.

## Key Capabilities
- Password-free delivery: only a public @username or post URL is required.
- Transparent one-time packages via official Stripe Checkout (Visa, Mastercard, Amex, Apple Pay & Google Pay in US/UK/CA/AU/Global; instant 24/7 Pix & Cards in Brazil).
- Refill protection from 30 to 365 days on eligible follower, subscriber, and engagement tiers.
- Optional Drip-Feed gradual pacing, Mass Orders, Auto-Likes Subscriptions, white-label Child Panels, and standard SMM Panel API v2 (${base}/api/v2).

## Country & Global Market Hubs (USA, UK, Canada, Australia, Global & Brazil)
- [Buy Followers USA (EN-US)](${base}/en/buy-followers-usa): US-targeted & global Instagram, TikTok, and YouTube growth via Stripe USD.
- [Buy Followers UK & Ireland (EN-GB)](${base}/en/buy-followers-uk): UK creators & brands with Stripe UK Cards, Monzo/Revolut, Apple Pay & 30–365d refill.
- [Buy Followers Canada (EN-CA)](${base}/en/buy-followers-canada): Toronto, Vancouver & Montreal social growth with Canadian Stripe cards & Drip-Feed.
- [Buy Followers Australia & NZ (EN-AU)](${base}/en/buy-followers-australia): 24/7 automated AEST/AEDT/NZDT dispatch with Australian Stripe cards & Apple Pay.
- [Best Global SMM Panel (Worldwide)](${base}/en/best-smm-panel-global): Multi-region storefront + API v2 + white-label Child Panels.
- [Melhor Painel SMM Brasil (PT-BR · Pix 24/7)](${base}/pt/painel-smm-brasil): Seguidores brasileiros e mundiais em Reais com Pix automático Stripe.

## Primary Regional Pages (English — USA, UK, Canada, Australia & Global)
- [FollowMe English Home](${base}/en): Social growth storefront in USD.
- [Buy Instagram Followers](${base}/en/buy-instagram-followers): High-retention Instagram followers with 30–365 day refill.
- [Buy Instagram Likes & Reels Views](${base}/en/buy-instagram-likes): Fast Instagram likes, Reels views, and comments.
- [Buy TikTok Followers](${base}/en/buy-tiktok-followers): Reach 1,000 TikTok followers to unlock TikTok LIVE.
- [Buy YouTube Subscribers & Watch Time](${base}/en/buy-youtube-subscribers): Steady YouTube subscribers, lifetime views, and watch hours.
- [Instagram Hub (EN)](${base}/en/instagram) | [TikTok Hub (EN)](${base}/en/tiktok) | [YouTube Hub (EN)](${base}/en/youtube)

## Primary Regional Pages (Brazil — Português / BRL / Pix)
- [FollowMe Brasil Home](${base}/pt): Plataforma de crescimento social em Reais com Pix 24/7 via Stripe.
- [Comprar Seguidores Instagram BR](${base}/pt/comprar-seguidores-instagram): Seguidores brasileiros e mundiais com reposição de 30 a 365 dias.
- [Comprar Curtidas e Views Reels Instagram](${base}/pt/comprar-curtidas-instagram): Curtidas brasileiras e visualizações em Reels no Pix.
- [Comprar Seguidores TikTok (Liberar Live)](${base}/pt/comprar-seguidores-tiktok): 1.000 seguidores no TikTok e visualizações rápidas.
- [Comprar Inscritos e Horas YouTube](${base}/pt/comprar-inscritos-youtube): Inscritos, views vitalícias e horas de exibição.
- [Instagram Hub (PT)](${base}/pt/instagram) | [TikTok Hub (PT)](${base}/pt/tiktok) | [YouTube Hub (PT)](${base}/pt/youtube)

## Platform & Developer Docs
- [Full Live Service Catalog](${base}/servicos)
- [SMM Panel API v2 Documentation](${base}/api-docs)
- [Frequently Asked Questions](${base}/faq)
- [Agency & Reseller Partnerships](${base}/parcerias)
- [Terms & Refund Policy](${base}/termos)

## Live Sample Rates (per 1,000 units)
${featuredLines.join("\n")}
`;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
