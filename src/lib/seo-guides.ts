import type { ServiceMetricType } from "./i18n";

export type SeoPlatform = "instagram" | "tiktok" | "youtube";

export interface GeoComparisonRow {
  criterion: string;
  followMe: string;
  traditional: string;
}

export interface GeoKeywordPageConfig {
  id: string;
  locale: "en" | "pt";
  currency: "USD" | "BRL";
  slug: string;
  pairedSlug: string;
  platform: SeoPlatform;
  metric: ServiceMetricType;
  regionCluster?: "country-hub";
  ogLocale?: string;
  inLanguage?: string;
  areaServed?: string[];
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  eyebrow: string;
  h1Start: string;
  h1Sticker: string;
  intro: string;
  tldrLabel: string;
  tldrDefinition: string;
  facts: string[];
  comparisonHeading: string;
  comparisonRows: GeoComparisonRow[];
  stepsHeading: string;
  steps: Array<{ title: string; detail: string }>;
  faqHeading: string;
  faq: Array<{ q: string; a: string }>;
}

export const GLOBAL_SERVED_COUNTRIES = [
  "US",
  "BR",
  "CA",
  "GB",
  "AU",
  "NZ",
  "IE",
  "PT",
  "DE",
  "FR",
  "ES",
  "MX",
] as const;

export const COUNTRY_HUB_HREFLANG: Record<string, string> = {
  "en-US": "/en/buy-followers-usa",
  "en-GB": "/en/buy-followers-uk",
  "en-IE": "/en/buy-followers-uk",
  "en-CA": "/en/buy-followers-canada",
  "en-AU": "/en/buy-followers-australia",
  "en-NZ": "/en/buy-followers-australia",
  en: "/en/best-smm-panel-global",
  "pt-BR": "/pt/painel-smm-brasil",
  "pt-PT": "/pt/painel-smm-brasil",
  "x-default": "/en/best-smm-panel-global",
};

export function buildInternationalAlternates(enPath: string, ptPath: string): Record<string, string> {
  return {
    "en-US": enPath,
    "en-CA": enPath,
    "en-GB": enPath,
    "en-AU": enPath,
    "en-NZ": enPath,
    "en-IE": enPath,
    en: enPath,
    "pt-BR": ptPath,
    "pt-PT": ptPath,
    "x-default": enPath,
  };
}

export const GEO_KEYWORD_PAGES: GeoKeywordPageConfig[] = [
  // 1. EN — Buy Instagram Followers USA
  {
    id: "ig-followers",
    locale: "en",
    currency: "USD",
    slug: "buy-instagram-followers",
    pairedSlug: "comprar-seguidores-instagram",
    platform: "instagram",
    metric: "followers",
    metaTitle: "Buy Instagram Followers (USA) — Instant & 365D Refill | FollowMe",
    metaDescription:
      "Buy high-retention Instagram followers in the US starting at $11.99 per 1,000. Zero password needed, Stripe USD checkout, starts in 2-15 min with up to 365-day refill.",
    keywords: [
      "buy instagram followers",
      "buy instagram followers usa",
      "real looking instagram followers",
      "instagram growth service usd",
      "high retention instagram followers",
    ],
    eyebrow: "INSTAGRAM FOLLOWERS · USA MARKET (USD)",
    h1Start: "Buy Instagram followers with ",
    h1Sticker: "up to 365-day refill.",
    intro:
      "Turn cold profile visits into immediate credibility. Pick exact Instagram follower packages in USD, enter only your public @username, and start delivery in minutes via Stripe.",
    tldrLabel: "Quick Facts & Definition",
    tldrDefinition:
      "FollowMe is defined as an automated social growth platform that delivers high-retention Instagram followers, likes, Reels views, and custom comments in USD without ever asking for your password.",
    facts: [
      "US retail rates start at $11.99 per 1,000 global followers and $19.99–$24.99 per 1,000 for regional & USA-targeted tiers.",
      "Zero passwords or OAuth tokens required — only your public Instagram @username.",
      "Up to 365-day refill protection plus optional Drip-Feed gradual pacing.",
      "One-time Stripe checkout in USD (Credit Card, Debit Card, Apple Pay & Google Pay).",
    ],
    comparisonHeading: "FollowMe vs. Slow Organic-Only Launch",
    comparisonRows: [
      {
        criterion: "Time to 1,000+ social proof",
        followMe: "Starts in 2–15 minutes",
        traditional: "6 to 18 months of cold posting",
      },
      {
        criterion: "Password / account login",
        followMe: "Never requested (0% login risk)",
        traditional: "Agencies often demand password access",
      },
      {
        criterion: "Drop protection",
        followMe: "30 to 365-day refill warranty included",
        traditional: "Unpredictable churn with paid shoutouts",
      },
      {
        criterion: "Transparent pricing",
        followMe: "Exact one-time USD packages",
        traditional: "$500–$2,500/mo agency retainers",
      },
    ],
    stepsHeading: "How to buy Instagram followers safely in 3 steps",
    steps: [
      {
        title: "Choose your follower tier and exact count",
        detail:
          "Compare global 90-day, HQ 365-day, and USA-targeted tiers in USD with upfront per-1,000 pricing.",
      },
      {
        title: "Enter your public Instagram @username",
        detail:
          "Make sure your profile is set to Public before ordering. FollowMe never asks for your password.",
      },
      {
        title: "Complete one-time Stripe checkout",
        detail:
          "Your order dispatches automatically in minutes with live tracking and one-click refill inside your dashboard.",
      },
    ],
    faqHeading: "Buy Instagram Followers (USA) — Frequently Asked Questions",
    faq: [
      {
        q: "How much do 1,000 Instagram followers cost in the USA on FollowMe?",
        a: "In short, 1,000 Instagram followers on FollowMe cost $11.99 for global 90-day refill tiers, $14.99 for HQ 365-day refill tiers, and $24.99 for USA-targeted 60-day refill followers.",
      },
      {
        q: "Is it safe to buy Instagram followers without giving my password?",
        a: "Yes. Because FollowMe only requires your public @username and never requests login credentials or third-party app authorization, your account stays 100% under your control.",
      },
      {
        q: "How fast do Instagram followers arrive after paying via Stripe?",
        a: "Most orders begin delivering within 2 to 15 minutes. For larger launches, you can enable Drip-Feed inside the dashboard to spread growth naturally over hours or days.",
      },
      {
        q: "What if some followers drop later?",
        a: "Every refill-eligible tier (30, 60, 90, or 365 days) includes a Refill button inside your Orders page so drops are replenished automatically at no extra cost.",
      },
    ],
  },

  // 2. PT — Comprar Seguidores Instagram Brasil
  {
    id: "ig-followers",
    locale: "pt",
    currency: "BRL",
    slug: "comprar-seguidores-instagram",
    pairedSlug: "buy-instagram-followers",
    platform: "instagram",
    metric: "followers",
    metaTitle: "Comprar Seguidores Instagram BR & Mundiais no Pix | FollowMe",
    metaDescription:
      "Compre seguidores brasileiros e mundiais no Instagram a partir de R$ 12,90 por 1.000. Sem senha, pagamento Pix instantâneo via Stripe e reposição de 30 a 365 dias.",
    keywords: [
      "comprar seguidores instagram",
      "comprar seguidores brasileiros instagram",
      "comprar seguidores no pix",
      "seguidores instagram reais reposicao",
      "painel smm brasil pix",
    ],
    eyebrow: "SEGUIDORES INSTAGRAM · BRASIL (PIX & CARTÃO)",
    h1Start: "Comprar seguidores no Instagram ",
    h1Sticker: "com Pix e reposição.",
    intro:
      "Pare de perder clientes por parecer um perfil pequeno. Escolha seguidores brasileiros ou mundiais no Instagram com preço transparente em Reais, Pix automático via Stripe e zero pedido de senha.",
    tldrLabel: "Resumo Direto & Definição",
    tldrDefinition:
      "A FollowMe é uma plataforma automatizada de crescimento social que entrega seguidores brasileiros e mundiais, curtidas, visualizações em Reels e comentários no Instagram em Reais, sem pedir sua senha.",
    facts: [
      "Preços transparentes em Reais: a partir de R$ 12,90/1.000 mundiais (90D) e R$ 26,90/1.000 seguidores brasileiros (30D).",
      "Nunca pedimos sua senha: informe apenas o seu @usuário público.",
      "Reposição garantida de 30 a 365 dias + opção de Drip-Feed (entrega gradual).",
      "Recarga automática 24h via Checkout oficial da Stripe com Pix instantâneo ou Cartão.",
    ],
    comparisonHeading: "FollowMe vs. Crescer do Zero sem Prova Social",
    comparisonRows: [
      {
        criterion: "Tempo para construir prova social",
        followMe: "Início em 2 a 15 minutos",
        traditional: "6 a 18 meses postando no escuro",
      },
      {
        criterion: "Segurança da conta",
        followMe: "Zero senha (apenas @público)",
        traditional: "Automação invasiva pede login",
      },
      {
        criterion: "Proteção contra quedas",
        followMe: "Garantia de reposição 30 a 365 dias",
        traditional: "Sem garantia após sorteios",
      },
      {
        criterion: "Custo real",
        followMe: "A partir de R$ 12,90 por 1.000",
        traditional: "R$ 1.500+/mês em tráfego frio",
      },
    ],
    stepsHeading: "Como comprar seguidores no Instagram com segurança em 3 passos",
    steps: [
      {
        title: "Escolha seguidores brasileiros ou mundiais",
        detail:
          "Selecione o nível de entrega desejado e a quantidade exata vendo o preço final em Reais na hora.",
      },
      {
        title: "Informe apenas o seu @usuário público",
        detail:
          "Deixe o perfil em modo Público durante a entrega. Jamais solicitamos senha ou acesso ao Instagram.",
      },
      {
        title: "Pague no Pix ou Cartão via Stripe",
        detail:
          "O saldo entra na hora 24/7, o pedido dispara automaticamente e você acompanha tudo pelo painel.",
      },
    ],
    faqHeading: "Dúvidas Frequentes sobre Comprar Seguidores no Instagram",
    faq: [
      {
        q: "Quanto custam 1.000 seguidores no Instagram na FollowMe?",
        a: "Em resumo, 1.000 seguidores mundiais com reposição de 90 dias custam R$ 12,90, mundiais HQ 365 dias custam R$ 19,90 e seguidores brasileiros com reposição de 30 dias custam R$ 26,90.",
      },
      {
        q: "É seguro comprar seguidores sem passar minha senha?",
        a: "Sim. Como nunca pedimos sua senha nem acesso à sua conta — apenas o @usuário público — seu login permanece 100% protegido.",
      },
      {
        q: "Em quanto tempo entram os seguidores após pagar o Pix?",
        a: "O Pix via Stripe é confirmado em segundos e a maioria dos pedidos inicia automaticamente entre 2 e 15 minutos.",
      },
      {
        q: "E se cair algum seguidor depois?",
        a: "Os pacotes com garantia (30, 60, 90 ou 365 dias) possuem botão de Reposição (Refill) dentro da aba Meus Pedidos.",
      },
    ],
  },

  // 3. EN — Buy Instagram Likes & Reels Views USA
  {
    id: "ig-likes",
    locale: "en",
    currency: "USD",
    slug: "buy-instagram-likes",
    pairedSlug: "comprar-curtidas-instagram",
    platform: "instagram",
    metric: "likes",
    metaTitle: "Buy Instagram Likes & Reels Views (USA) — Fast Delivery | FollowMe",
    metaDescription:
      "Boost your posts and Reels in minutes. Buy Instagram likes from $5.99/1k and Reels views from $1.99/1k in USD via Stripe. Zero password required.",
    keywords: [
      "buy instagram likes",
      "buy instagram reels views",
      "instant instagram likes usd",
      "buy instagram auto likes",
      "instagram engagement boost usa",
    ],
    eyebrow: "INSTAGRAM LIKES & REELS · USA (USD)",
    h1Start: "Buy Instagram likes & Reels views ",
    h1Sticker: "that trigger reach.",
    intro:
      "Algorithms reward posts with fast early engagement. Send high-retention likes, Reels views, saves, and custom comments minutes after publishing — zero password required.",
    tldrLabel: "Quick Facts & Definition",
    tldrDefinition:
      "Buying Instagram likes and Reels views on FollowMe means accelerating early post velocity with transparent USD packages that start within 1–5 minutes using only your public post link.",
    facts: [
      "Instagram likes start at $5.99 per 1,000; Reels views + reach start at $1.99 per 1,000.",
      "Optional Auto-Likes subscriptions automatically engage every new post you publish.",
      "Supports Drip-Feed pacing so likes arrive smoothly instead of all in one second.",
      "Zero login required — paste only the public post or Reel URL.",
    ],
    comparisonHeading: "FollowMe Instant Boost vs. Unassisted Posts",
    comparisonRows: [
      {
        criterion: "First-30-minute velocity",
        followMe: "Starts in 1–5 minutes automatically",
        traditional: "Stalls under 30 likes on cold accounts",
      },
      {
        criterion: "Ad & sponsor social proof",
        followMe: "Strong like-to-view ratio on launch",
        traditional: "Paid ads look ignored with 4 likes",
      },
      {
        criterion: "Control & pacing",
        followMe: "Instant or Drip-Feed gradual delivery",
        traditional: "No control over organic reach",
      },
    ],
    stepsHeading: "How to order Instagram likes & Reels views",
    steps: [
      {
        title: "Select Likes, Reels Views, or Comments",
        detail: "Switch tabs in the builder above and choose the exact package count in USD.",
      },
      {
        title: "Paste your public post or Reel link",
        detail: "Keep your account public while delivering. No password is ever needed.",
      },
      {
        title: "Check out via Stripe and track live",
        detail: "Delivery starts in minutes and updates automatically inside your dashboard.",
      },
    ],
    faqHeading: "Buy Instagram Likes — Frequently Asked Questions",
    faq: [
      {
        q: "How fast do Instagram likes start after I order?",
        a: "Simply put, most Instagram like and Reels view orders begin delivering within 1 to 5 minutes after confirmation.",
      },
      {
        q: "Can I split likes or automate likes on every new post?",
        a: "Yes. You can use our Mass Order tool for multiple posts or turn on Auto-Likes Subscriptions so every future post receives likes automatically.",
      },
      {
        q: "Do I need to share my Instagram login?",
        a: "Never. Only the public link to your Instagram post or Reel is required.",
      },
    ],
  },

  // 4. PT — Comprar Curtidas Instagram Brasil
  {
    id: "ig-likes",
    locale: "pt",
    currency: "BRL",
    slug: "comprar-curtidas-instagram",
    pairedSlug: "buy-instagram-likes",
    platform: "instagram",
    metric: "likes",
    metaTitle: "Comprar Curtidas Instagram & Views Reels no Pix | FollowMe",
    metaDescription:
      "Impulsione seus posts e Reels em minutos. Curtidas brasileiras a partir de R$ 6,90/1.000 e views em Reels a partir de R$ 1,40/1.000 no Pix via Stripe, sem senha.",
    keywords: [
      "comprar curtidas instagram",
      "comprar curtidas brasileiras instagram",
      "comprar visualizacoes reels instagram",
      "curtidas instagram no pix",
      "aumentar engajamento instagram",
    ],
    eyebrow: "CURTIDAS & REELS INSTAGRAM · BRASIL (PIX)",
    h1Start: "Comprar curtidas e views em Reels ",
    h1Sticker: "em poucos minutos.",
    intro:
      "Dê tração imediata nos primeiros minutos após publicar. Contrate curtidas brasileiras, visualizações em Reels, salvamentos e comentários personalizados no Pix sem informar senha.",
    tldrLabel: "Resumo Direto & Definição",
    tldrDefinition:
      "Comprar curtidas e views em Reels na FollowMe significa acelerar a prova social e a velocidade inicial das suas publicações usando apenas o link público do post, com início em 1 a 5 minutos.",
    facts: [
      "Curtidas brasileiras 30D por R$ 6,90/1.000 e visualizações em Reels + Alcance por R$ 1,40/1.000.",
      "Salvamentos a partir de R$ 3,90/1.000 e comentários positivos ou personalizados.",
      "Opção de Auto-Curtidas por assinatura para engajar cada post novo automaticamente.",
      "Pagamento via Pix instantâneo ou Cartão pela Stripe, sem pedir senha.",
    ],
    comparisonHeading: "Post Impulsionado na FollowMe vs. Post Frio",
    comparisonRows: [
      {
        criterion: "Engajamento nos primeiros minutos",
        followMe: "Começa em 1 a 5 minutos",
        traditional: "Fica parado com menos de 20 curtidas",
      },
      {
        criterion: "Prova social em anúncios",
        followMe: "Post e Reel com aspecto validado",
        traditional: "Tráfego pago caro por falta de confiança",
      },
      {
        criterion: "Ritmo da entrega",
        followMe: "Imediato ou gradual (Drip-Feed)",
        traditional: "Sem previsibilidade orgânica",
      },
    ],
    stepsHeading: "Como comprar curtidas e views no Instagram em 3 passos",
    steps: [
      {
        title: "Escolha Curtidas, Visualizações ou Comentários",
        detail: "Selecione o serviço e a quantidade desejada já com o valor final em Reais.",
      },
      {
        title: "Cole o link público do post ou Reel",
        detail: "Mantenha o perfil aberto durante a entrega. Nenhuma senha é solicitada.",
      },
      {
        title: "Pague no Pix via Stripe e acompanhe",
        detail: "A entrega dispara automaticamente em minutos e aparece em tempo real no painel.",
      },
    ],
    faqHeading: "Dúvidas Frequentes sobre Curtidas e Reels no Instagram",
    faq: [
      {
        q: "Quanto custam 1.000 curtidas brasileiras no Instagram?",
        a: "Na FollowMe, 1.000 curtidas brasileiras com reposição de 30 dias custam R$ 6,90, e 1.000 visualizações em Reels custam R$ 1,40.",
      },
      {
        q: "Funciona para posts patrocinados e anúncios?",
        a: "Sim. Basta colar o link público da publicação ou Reel. Quanto maior a prova social no criativo, melhor a confiança de quem vê o anúncio.",
      },
      {
        q: "Preciso informar minha senha?",
        a: "Nunca. Apenas o link público da publicação.",
      },
    ],
  },

  // 5. EN — Buy TikTok Followers USA
  {
    id: "tt-followers",
    locale: "en",
    currency: "USD",
    slug: "buy-tiktok-followers",
    pairedSlug: "comprar-seguidores-tiktok",
    platform: "tiktok",
    metric: "followers",
    metaTitle: "Buy TikTok Followers (USA) — Unlock 1,000 LIVE Fast | FollowMe",
    metaDescription:
      "Reach 1,000 TikTok followers to unlock TikTok LIVE and push past the 200-view cap. High-retention followers ($16.99/1k) & fast views ($1.49/1k) via Stripe USD.",
    keywords: [
      "buy tiktok followers",
      "buy 1000 tiktok followers for live",
      "buy tiktok views usa",
      "unlock tiktok live followers",
      "tiktok growth service usd",
    ],
    eyebrow: "TIKTOK FOLLOWERS & VIEWS · USA (USD)",
    h1Start: "Buy TikTok followers and unlock ",
    h1Sticker: "TikTok LIVE fast.",
    intro:
      "Stop waiting months to hit 1,000 followers or breaking out of 200-view jail. Order high-retention TikTok followers, fast video views, and stable likes in USD with zero password required.",
    tldrLabel: "Quick Facts & Definition",
    tldrDefinition:
      "FollowMe helps TikTok creators and brands reach the 1,000-follower milestone required for TikTok LIVE and TikTok Shop credibility with fast USD packages and 30-day refill protection.",
    facts: [
      "TikTok HQ Followers (30-day refill): $16.99 per 1,000; ultra-fast TikTok Views: $1.49 per 1,000.",
      "Helps satisfy TikTok's 1,000-follower threshold for LIVE streaming faster.",
      "TikTok Likes (60-day refill) at $6.99/1,000 and LIVE viewers available on demand.",
      "Zero passwords needed — enter only your public TikTok @handle or video URL.",
    ],
    comparisonHeading: "FollowMe TikTok Growth vs. Starting From 0",
    comparisonRows: [
      {
        criterion: "Reaching 1,000 followers for LIVE",
        followMe: "Starts within minutes",
        traditional: "Weeks or months stuck under 300 views",
      },
      {
        criterion: "Account privacy & safety",
        followMe: "Public handle only (zero login)",
        traditional: "Bot apps risk password lockouts",
      },
      {
        criterion: "Refill protection",
        followMe: "30 to 60-day refill warranty",
        traditional: "No recovery on drop-offs",
      },
    ],
    stepsHeading: "How to get 1,000 TikTok followers safely",
    steps: [
      {
        title: "Pick TikTok Followers, Views, or Likes",
        detail: "Choose 1,000 followers (or any custom quantity) and view the exact USD rate.",
      },
      {
        title: "Paste your public TikTok profile link",
        detail: "Make sure your TikTok account is public. No password is ever requested.",
      },
      {
        title: "Pay once via Stripe",
        detail: "Delivery starts automatically and you can track completion in real time.",
      },
    ],
    faqHeading: "Buy TikTok Followers (USA) — Frequently Asked Questions",
    faq: [
      {
        q: "Can buying 1,000 TikTok followers unlock TikTok LIVE?",
        a: "In short, yes — reaching 1,000 followers on a public account that meets TikTok's age and community guidelines satisfies the follower count requirement for TikTok LIVE.",
      },
      {
        q: "How much do 1,000 TikTok followers and views cost on FollowMe?",
        a: "High-quality TikTok followers with 30-day refill are $16.99 per 1,000, and ultra-fast TikTok video views are $1.49 per 1,000.",
      },
      {
        q: "Do I need to give access to my TikTok account?",
        a: "Never. Provide only your public @username or public TikTok video link.",
      },
    ],
  },

  // 6. PT — Comprar Seguidores TikTok Brasil
  {
    id: "tt-followers",
    locale: "pt",
    currency: "BRL",
    slug: "comprar-seguidores-tiktok",
    pairedSlug: "buy-tiktok-followers",
    platform: "tiktok",
    metric: "followers",
    metaTitle: "Comprar Seguidores TikTok — Liberar Live 1.000 no Pix | FollowMe",
    metaDescription:
      "Bata 1.000 seguidores no TikTok para liberar Live e saia da trava das 200 views. Seguidores HQ R$ 14,90/1k e views R$ 0,79/1k no Pix via Stripe, sem senha.",
    keywords: [
      "comprar seguidores tiktok",
      "comprar 1000 seguidores tiktok liberar live",
      "comprar visualizacoes tiktok",
      "seguidores tiktok no pix",
      "sair das 200 views tiktok",
    ],
    eyebrow: "SEGUIDORES & VIEWS TIKTOK · BRASIL (PIX)",
    h1Start: "Comprar seguidores no TikTok e ",
    h1Sticker: "liberar suas Lives.",
    intro:
      "Chegue aos 1.000 seguidores no TikTok para liberar transmissões ao vivo e tire seus vídeos da trava das 200 visualizações. Pagamento via Pix na Stripe e entrega rápida sem pedir senha.",
    tldrLabel: "Resumo Direto & Definição",
    tldrDefinition:
      "A FollowMe permite atingir os 1.000 seguidores no TikTok exigidos para liberar Lives, além de impulsionar visualizações e curtidas em vídeos no Brasil com Pix automático e garantia de reposição.",
    facts: [
      "1.000 Seguidores TikTok HQ (reposição 30D) por R$ 14,90; 1.000 Views ultra rápidas por R$ 0,79.",
      "1.000 Curtidas TikTok (reposição 60D) por R$ 4,90 e espectadores para TikTok LIVE.",
      "Ajuda a cumprir o requisito de 1.000 seguidores para abrir Live e link na bio.",
      "Apenas o @usuário público — jamais pedimos senha.",
    ],
    comparisonHeading: "FollowMe no TikTok vs. Travado nas 200 Views",
    comparisonRows: [
      {
        criterion: "Atingir 1.000 seguidores para Live",
        followMe: "Início em minutos após o Pix",
        traditional: "Meses tentando romper o alcance inicial",
      },
      {
        criterion: "Segurança do perfil",
        followMe: "Zero senha (apenas link público)",
        traditional: "Apps duvidosos pedem acesso à conta",
      },
      {
        criterion: "Garantia de estabilidade",
        followMe: "Reposição de 30 a 60 dias",
        traditional: "Sem suporte ou reposição",
      },
    ],
    stepsHeading: "Como comprar seguidores no TikTok no Pix em 3 passos",
    steps: [
      {
        title: "Escolha Seguidores, Views ou Curtidas TikTok",
        detail: "Selecione 1.000 seguidores (ou o volume desejado) com preço transparente em Reais.",
      },
      {
        title: "Informe o link público do seu perfil ou vídeo",
        detail: "Mantenha a conta pública durante a entrega. Sem senha.",
      },
      {
        title: "Conclua no Pix ou Cartão via Stripe",
        detail: "Entrega iniciada automaticamente em minutos com status em tempo real.",
      },
    ],
    faqHeading: "Dúvidas Frequentes sobre Comprar Seguidores no TikTok",
    faq: [
      {
        q: "Comprar 1.000 seguidores no TikTok libera a opção de fazer Live?",
        a: "Sim. Ao atingir 1.000 seguidores em um perfil público que cumpre as diretrizes de idade do TikTok, você atende ao requisito mínimo de seguidores para liberar Lives.",
      },
      {
        q: "Quanto custam 1.000 seguidores e 1.000 views no TikTok?",
        a: "Na FollowMe, 1.000 seguidores HQ com reposição de 30 dias saem por R$ 14,90 e 1.000 visualizações ultra rápidas saem por R$ 0,79.",
      },
      {
        q: "Quanto tempo leva para começar a entrega?",
        a: "Visualizações costumam começar em 1 a 5 minutos; seguidores iniciam geralmente entre 5 e 20 minutos após a confirmação do Pix.",
      },
    ],
  },

  // 7. EN — Buy YouTube Subscribers & Watch Time USA
  {
    id: "yt-subscribers",
    locale: "en",
    currency: "USD",
    slug: "buy-youtube-subscribers",
    pairedSlug: "comprar-inscritos-youtube",
    platform: "youtube",
    metric: "followers",
    metaTitle: "Buy YouTube Subscribers & Watch Time (USA) — Refill | FollowMe",
    metaDescription:
      "Grow your YouTube channel safely with steady subscribers ($49.90/1k), lifetime views ($6.99/1k), likes, and 4,000h watch time in USD. Zero YouTube Studio login.",
    keywords: [
      "buy youtube subscribers",
      "buy youtube watch time hours",
      "buy high retention youtube views",
      "youtube monetization growth usd",
      "buy youtube likes usa",
    ],
    eyebrow: "YOUTUBE SUBSCRIBERS & WATCH TIME · USA (USD)",
    h1Start: "Buy YouTube subscribers & ",
    h1Sticker: "high-retention views.",
    intro:
      "Build channel authority and accelerate monetization milestones with steady daily subscriber pacing, lifetime views, likes, and watch time hours — zero YouTube Studio access required.",
    tldrLabel: "Quick Facts & Definition",
    tldrDefinition:
      "FollowMe provides steady YouTube subscribers, lifetime video views, likes, and watch-time hours in USD with 30-day refill protection and natural daily delivery speeds.",
    facts: [
      "YouTube Subscribers (30-day refill): $49.90 per 1,000; Lifetime Views: $6.99 per 1,000.",
      "YouTube Watch Time (30-day refill): $79.90 per 1,000 hours; YouTube Likes: $7.99 per 1,000.",
      "Steady daily pacing designed for channel safety and realistic retention.",
      "Never asks for Google or YouTube Studio login — only your public channel or video URL.",
    ],
    comparisonHeading: "FollowMe YouTube Growth vs. Unassisted Channels",
    comparisonRows: [
      {
        criterion: "Channel authority & CTR",
        followMe: "Credible subscriber & view counts fast",
        traditional: "Viewers skip videos with 32 views",
      },
      {
        criterion: "Delivery safety",
        followMe: "Steady daily pacing + 30D refill",
        traditional: "Risky sub-for-sub groups cause drops",
      },
      {
        criterion: "Account credentials",
        followMe: "Public URL only (zero Studio access)",
        traditional: "Managers often request channel access",
      },
    ],
    stepsHeading: "How to grow your YouTube channel in 3 steps",
    steps: [
      {
        title: "Choose Subscribers, Views, Watch Time, or Likes",
        detail: "Pick the exact YouTube package in USD inside the builder above.",
      },
      {
        title: "Paste your public YouTube channel or video URL",
        detail: "Ensure subscriber count is public and video embedding is enabled. Zero login required.",
      },
      {
        title: "Complete Stripe checkout",
        detail: "Track steady daily progress and refill protection inside your FollowMe dashboard.",
      },
    ],
    faqHeading: "Buy YouTube Subscribers — Frequently Asked Questions",
    faq: [
      {
        q: "How fast are YouTube subscribers delivered?",
        a: "In short, YouTube subscribers are delivered at a steady natural pace so your channel maintains high retention and safety.",
      },
      {
        q: "Can I also buy YouTube views, likes, and watch-time hours?",
        a: "Yes. FollowMe offers lifetime YouTube views ($6.99/1k), likes ($7.99/1k), and watch-time hours ($79.90/1k) all from one dashboard.",
      },
      {
        q: "Do I ever need to grant access to my YouTube Studio?",
        a: "Never. FollowMe only requires your public channel link or public video link.",
      },
    ],
  },

  // 8. PT — Comprar Inscritos YouTube Brasil
  {
    id: "yt-subscribers",
    locale: "pt",
    currency: "BRL",
    slug: "comprar-inscritos-youtube",
    pairedSlug: "buy-youtube-subscribers",
    platform: "youtube",
    metric: "followers",
    metaTitle: "Comprar Inscritos YouTube, Views & Horas no Pix | FollowMe",
    metaDescription:
      "Fortaleça seu canal no YouTube com inscritos 30D (R$ 149,90/1k), views vitalícias (R$ 14,90/1k), likes e horas de exibição no Pix via Stripe. Sem senha.",
    keywords: [
      "comprar inscritos youtube",
      "comprar horas de exibicao youtube",
      "comprar visualizacoes youtube alta retencao",
      "monetizar canal youtube rapido",
      "comprar likes youtube pix",
    ],
    eyebrow: "INSCRITOS & HORAS YOUTUBE · BRASIL (PIX)",
    h1Start: "Comprar inscritos e horas ",
    h1Sticker: "no YouTube com segurança.",
    intro:
      "Dê autoridade ao seu canal e acelere suas metas de monetização com inscritos estáveis, visualizações vitalícias, likes e horas de exibição — pagamento via Pix na Stripe e sem acesso ao YouTube Studio.",
    tldrLabel: "Resumo Direto & Definição",
    tldrDefinition:
      "A FollowMe entrega inscritos no YouTube, visualizações vitalícias, likes e horas de exibição (Watch Time) em Reais via Pix, com ritmo natural diário e garantia de reposição de 30 dias.",
    facts: [
      "Inscritos YouTube (reposição 30D) por R$ 149,90/1.000; Views vitalícias por R$ 14,90/1.000.",
      "Horas de Exibição (Watch Time 30D) por R$ 149,90/1.000; Likes 30D por R$ 6,90/1.000.",
      "Entrega gradual diária para preservar naturalidade e retenção do canal.",
      "Nunca pedimos login do Google ou YouTube Studio — apenas o link público.",
    ],
    comparisonHeading: "FollowMe no YouTube vs. Canal sem Tração Inicial",
    comparisonRows: [
      {
        criterion: "Autoridade e taxa de clique (CTR)",
        followMe: "Canal com números que geram confiança",
        traditional: "Público ignora vídeos com 40 views",
      },
      {
        criterion: "Segurança na entrega",
        followMe: "Velocidade natural + reposição 30D",
        traditional: "Grupos de troca geram quedas bruscas",
      },
      {
        criterion: "Privacidade da conta",
        followMe: "Somente URL pública do canal/vídeo",
        traditional: "Sem necessidade de compartilhar acesso",
      },
    ],
    stepsHeading: "Como comprar inscritos e views no YouTube em 3 passos",
    steps: [
      {
        title: "Escolha Inscritos, Views, Watch Time ou Likes",
        detail: "Selecione o pacote no construtor acima vendo o valor exato em Reais.",
      },
      {
        title: "Informe o link público do canal ou vídeo",
        detail: "Mantenha a contagem de inscritos visível e o vídeo público. Zero senha.",
      },
      {
        title: "Pague no Pix ou Cartão via Stripe",
        detail: "Acompanhe a evolução diária e a garantia de reposição direto no painel.",
      },
    ],
    faqHeading: "Dúvidas Frequentes sobre Inscritos e Views no YouTube",
    faq: [
      {
        q: "Qual é a velocidade de entrega dos inscritos no YouTube?",
        a: "Os inscritos são entregues em ritmo gradual diário para manter alta estabilidade e naturalidade no crescimento do canal.",
      },
      {
        q: "Vocês também vendem horas de exibição e visualizações?",
        a: "Sim. Temos visualizações vitalícias (R$ 14,90/1.000), likes (R$ 6,90/1.000) e horas de exibição Watch Time (R$ 149,90/1.000).",
      },
      {
        q: "Preciso dar acesso ao meu YouTube Studio?",
        a: "Nunca. Basta informar o link público do seu canal ou vídeo.",
      },
    ],
  },

  // 9. EN-US — Dedicated United States Social Growth Hub
  {
    id: "country-usa",
    locale: "en",
    currency: "USD",
    slug: "buy-followers-usa",
    pairedSlug: "painel-smm-brasil",
    platform: "instagram",
    metric: "followers",
    regionCluster: "country-hub",
    ogLocale: "en_US",
    inLanguage: "en-US",
    areaServed: ["US"],
    metaTitle: "Buy Instagram, TikTok & YouTube Followers USA — Instant & 365D Refill | FollowMe",
    metaDescription:
      "Trusted US social growth platform for Instagram followers, TikTok LIVE unlocks, and YouTube subscribers. Stripe USD checkout (Cards, Apple Pay, Google Pay), zero password, 30–365 day refill.",
    keywords: [
      "buy followers usa",
      "buy instagram followers usa",
      "buy tiktok followers usa",
      "buy youtube subscribers usa",
      "best smm panel usa stripe",
      "high retention social media growth united states",
    ],
    eyebrow: "UNITED STATES (USD) · STRIPE APPLE PAY & CARDS",
    h1Start: "Grow Instagram, TikTok & YouTube in the USA ",
    h1Sticker: "without sharing your password.",
    intro:
      "Built for US creators, DTC e-commerce brands, local businesses, and agencies from New York to Los Angeles. Order exact follower, like, and view packages in USD with transparent Stripe checkout and up to 365-day refill.",
    tldrLabel: "Quick Summary (USA Market)",
    tldrDefinition:
      "FollowMe is a password-free automated social growth platform serving the United States in native USD pricing, supporting Instagram, TikTok, and YouTube with Stripe checkout, Drip-Feed pacing, and 30–365 day refill protection.",
    facts: [
      "Native US pricing in USD starting at $1.99/1k Reels views, $5.99/1k likes, and $11.99/1k high-retention followers (plus dedicated USA-targeted tiers).",
      "Checkout processed securely by Stripe with US Credit/Debit Cards, Apple Pay, and Google Pay — zero recurring traps.",
      "Zero passwords or account logins requested: enter only your public @handle or video URL.",
      "Automated dispatch starts in 2–15 minutes with Drip-Feed pacing and 30–365 day refill inside your dashboard.",
    ],
    comparisonHeading: "FollowMe USA vs. Traditional US Social Agencies",
    comparisonRows: [
      {
        criterion: "Upfront cost",
        followMe: "One-time packages from $1.99 USD",
        traditional: "$1,000–$3,500/mo agency retainers",
      },
      {
        criterion: "Account security",
        followMe: "Public @handle only (zero password)",
        traditional: "Requires account login or Business Manager access",
      },
      {
        criterion: "Delivery speed",
        followMe: "Starts in 2–15 minutes + optional Drip-Feed",
        traditional: "Weeks of onboarding before launch",
      },
      {
        criterion: "Retention warranty",
        followMe: "Up to 365-day one-click refill",
        traditional: "No follower retention guarantees",
      },
    ],
    stepsHeading: "How to boost your social proof in the United States in 3 steps",
    steps: [
      {
        title: "Pick Instagram, TikTok, or YouTube and your exact count",
        detail:
          "Compare global 90-day, HQ 365-day, and USA-targeted tiers in USD with clear per-1,000 rates.",
      },
      {
        title: "Paste your public @username or post URL",
        detail:
          "Keep your profile Public during delivery. FollowMe never asks for passwords or 2FA codes.",
      },
      {
        title: "Pay once via Stripe USD and track live",
        detail:
          "Complete checkout with Card, Apple Pay, or Google Pay and monitor real-time order progress and refill status.",
      },
    ],
    faqHeading: "FollowMe USA — Frequently Asked Questions",
    faq: [
      {
        q: "Does FollowMe offer USA-targeted followers and likes?",
        a: "Yes. FollowMe includes dedicated USA-targeted Instagram and engagement tiers alongside high-retention global 90-day and 365-day refill options, all priced transparently in USD.",
      },
      {
        q: "Which payment methods work for US customers?",
        a: "US customers pay securely via Stripe Checkout using Visa, Mastercard, American Express, Discover, Apple Pay, and Google Pay with instant wallet crediting.",
      },
      {
        q: "Is FollowMe safe for US creators and brand accounts?",
        a: "Yes. FollowMe never requests your password, OAuth token, or admin access — only your public @username or link — and supports gradual Drip-Feed pacing for natural velocity.",
      },
      {
        q: "Can US marketing agencies connect via API v2?",
        a: "Yes. FollowMe exposes a full SMM Panel API v2 endpoint (/api/v2) plus white-label Child Panels for agencies managing multiple client accounts.",
      },
    ],
  },

  // 10. EN-GB — Dedicated United Kingdom Social Growth Hub
  {
    id: "country-uk",
    locale: "en",
    currency: "USD",
    slug: "buy-followers-uk",
    pairedSlug: "comprar-seguidores-instagram",
    platform: "instagram",
    metric: "followers",
    regionCluster: "country-hub",
    ogLocale: "en_GB",
    inLanguage: "en-GB",
    areaServed: ["GB", "IE"],
    metaTitle: "Buy Instagram, TikTok & YouTube Followers UK — Safe & Fast | FollowMe",
    metaDescription:
      "Grow your Instagram, TikTok, and YouTube presence across the UK & Ireland without sharing your password. Fast delivery, 30–365 day refill, and Stripe checkout with UK Cards & Apple Pay.",
    keywords: [
      "buy instagram followers uk",
      "buy tiktok followers uk",
      "buy youtube subscribers uk",
      "buy followers united kingdom",
      "best smm panel uk",
      "buy instagram likes uk safe",
    ],
    eyebrow: "UNITED KINGDOM & IRELAND · STRIPE CARDS & APPLE PAY",
    h1Start: "Buy Instagram, TikTok & YouTube followers in the UK ",
    h1Sticker: "with 365-day refill.",
    intro:
      "Designed for UK creators, independent brands, musicians, and London or Manchester agencies who need instant credibility without handing over login access. Pay securely with UK Visa/Mastercard, Apple Pay, or Google Pay via Stripe.",
    tldrLabel: "Quick Summary (UK & Ireland)",
    tldrDefinition:
      "FollowMe is a password-free automated social growth platform available across the United Kingdom and Ireland for Instagram, TikTok, and YouTube, featuring Stripe checkout, Drip-Feed delivery, and 30–365 day refill protection.",
    facts: [
      "Serves creators and businesses across London, Manchester, Birmingham, Edinburgh, Glasgow, Bristol, and Dublin.",
      "Instant Stripe checkout accepts UK Visa, Mastercard, Monzo, Revolut, Starling, Apple Pay, and Google Pay (transparent USD billing converted automatically by your bank/card).",
      "Zero passwords or login sharing — submit only your public @handle or video URL.",
      "High-retention followers, Reels views, TikTok LIVE 1,000-follower packages, and YouTube subscribers with 30–365 day refill.",
    ],
    comparisonHeading: "FollowMe UK vs. Traditional Growth Methods",
    comparisonRows: [
      {
        criterion: "Setup & password safety",
        followMe: "Public @handle only — zero login needed",
        traditional: "Risky bots & agencies ask for Instagram passwords",
      },
      {
        criterion: "Time to first results",
        followMe: "Automated start in 2–15 minutes (24/7 GMT/BST)",
        traditional: "Months of low-reach organic posts",
      },
      {
        criterion: "UK payment compatibility",
        followMe: "Stripe UK Cards, Apple Pay, Google Pay, Revolut/Monzo",
        traditional: "Unverified offshore gateways or wire transfers",
      },
      {
        criterion: "Drop protection",
        followMe: "30 to 365-day dashboard Refill button",
        traditional: "No refill guarantee",
      },
    ],
    stepsHeading: "How UK creators order safely on FollowMe in 3 steps",
    steps: [
      {
        title: "Choose your network and package",
        detail:
          "Select Instagram, TikTok, or YouTube followers, likes, views, or watch hours with full refill terms shown upfront.",
      },
      {
        title: "Enter your public @username or link",
        detail:
          "Ensure the profile or video is public. FollowMe never asks for passwords or email access.",
      },
      {
        title: "Checkout with Stripe UK Card or Apple Pay",
        detail:
          "Orders dispatch automatically 24/7 across GMT/BST with live tracking and one-click refill.",
      },
    ],
    faqHeading: "Buy Followers UK — Frequently Asked Questions",
    faq: [
      {
        q: "Can I pay with a UK debit card, Monzo, Revolut, or Apple Pay?",
        a: "Yes. FollowMe uses official Stripe Checkout, supporting all UK Visa, Mastercard, Amex, Monzo, Revolut, Starling cards, Apple Pay, and Google Pay with instant order activation.",
      },
      {
        q: "Will FollowMe ever ask for my Instagram or TikTok password?",
        a: "Never. Every order only requires your public @username or public post URL, keeping your account completely safe.",
      },
      {
        q: "How fast does delivery start for UK orders?",
        a: "Our automated system runs 24/7 regardless of timezone; most Instagram, TikTok, and YouTube orders begin within 2 to 15 minutes.",
      },
      {
        q: "Do UK orders include refill protection?",
        a: "Yes. Eligible follower, subscriber, and engagement packages include 30, 60, 90, or 365-day refill directly inside your Orders panel.",
      },
    ],
  },

  // 11. EN-CA — Dedicated Canada Social Growth Hub
  {
    id: "country-canada",
    locale: "en",
    currency: "USD",
    slug: "buy-followers-canada",
    pairedSlug: "comprar-seguidores-instagram",
    platform: "instagram",
    metric: "followers",
    regionCluster: "country-hub",
    ogLocale: "en_CA",
    inLanguage: "en-CA",
    areaServed: ["CA"],
    metaTitle: "Buy Instagram, TikTok & YouTube Followers Canada — Fast & Safe | FollowMe",
    metaDescription:
      "Automated Instagram, TikTok, and YouTube growth for Canadian creators, shops, and agencies. Zero password required, Stripe checkout with Canadian Cards & Apple Pay, 30–365 day refill.",
    keywords: [
      "buy instagram followers canada",
      "buy tiktok followers canada",
      "buy youtube subscribers canada",
      "buy followers canada safe",
      "best smm panel canada",
      "canadian instagram growth service",
    ],
    eyebrow: "CANADA · TORONTO · VANCOUVER · MONTREAL",
    h1Start: "Buy Instagram, TikTok & YouTube followers in Canada ",
    h1Sticker: "with instant start.",
    intro:
      "Built for Canadian creators, local storefronts, realtors, and digital agencies from Toronto and Vancouver to Montreal and Calgary. Build instant social proof with Stripe-verified checkout, zero password requests, and up to 365-day refill.",
    tldrLabel: "Quick Summary (Canada Market)",
    tldrDefinition:
      "FollowMe is a password-free social growth platform serving Canada across Instagram, TikTok, and YouTube, offering transparent packages, Stripe checkout with Canadian cards & Apple Pay, Drip-Feed pacing, and 30–365 day refill protection.",
    facts: [
      "Trusted by creators, e-commerce brands, and agencies across Toronto, Vancouver, Montreal, Calgary, Ottawa, and Edmonton.",
      "Official Stripe Checkout accepts Canadian Visa, Mastercard, Amex, Apple Pay, and Google Pay with instant balance confirmation.",
      "No passwords or OAuth logins ever requested — only your public @handle or video URL.",
      "North American & global high-retention tiers, TikTok LIVE 1,000-follower packages, and API v2 automation for Canadian resellers.",
    ],
    comparisonHeading: "FollowMe Canada vs. Slow Cold Organic Launch",
    comparisonRows: [
      {
        criterion: "Credibility speed",
        followMe: "Starts in 2–15 minutes across EST/PST",
        traditional: "Months posting to low-engagement feeds",
      },
      {
        criterion: "Password risk",
        followMe: "0% — public @username only",
        traditional: "Manual growth bots request login credentials",
      },
      {
        criterion: "Gradual pacing",
        followMe: "Built-in Drip-Feed scheduler included",
        traditional: "Sudden unnatural spikes on cheap sites",
      },
      {
        criterion: "Refill warranty",
        followMe: "30 to 365-day refill button in dashboard",
        traditional: "No retention warranty",
      },
    ],
    stepsHeading: "How to grow your social profiles in Canada in 3 steps",
    steps: [
      {
        title: "Choose Instagram, TikTok, or YouTube tier",
        detail:
          "Review minimum counts, start speed, and 30–365 day refill badges before ordering.",
      },
      {
        title: "Enter only your public @handle or URL",
        detail:
          "Set your profile to Public before checkout. Zero passwords or private access needed.",
      },
      {
        title: "Pay via Stripe (Canadian Cards / Apple Pay)",
        detail:
          "Your campaign begins automatically in minutes with live progress tracking and API v2 support.",
      },
    ],
    faqHeading: "Buy Followers Canada — Frequently Asked Questions",
    faq: [
      {
        q: "Can Canadian customers pay with Canadian credit or debit cards?",
        a: "Yes. Stripe Checkout accepts Canadian Visa, Mastercard, Visa Debit, Amex, Apple Pay, and Google Pay seamlessly, converting from transparent USD package rates automatically.",
      },
      {
        q: "Do you support North American targeted Instagram followers?",
        a: "Yes. Alongside global 90-day and 365-day high-retention packages, FollowMe offers North American / USA-targeted tiers ideal for Canadian and US audiences.",
      },
      {
        q: "Is it safe for Canadian business and creator accounts?",
        a: "Yes. FollowMe never asks for your password or account login and lets you enable Drip-Feed delivery for gradual, natural growth.",
      },
      {
        q: "Can I unlock TikTok LIVE in Canada with 1,000 followers?",
        a: "Yes. Ordering 1,000 TikTok followers helps Canadian creators meet TikTok's follower threshold to unlock LIVE streaming and clickable bio links faster.",
      },
    ],
  },

  // 12. EN-AU — Dedicated Australia & New Zealand Social Growth Hub
  {
    id: "country-australia",
    locale: "en",
    currency: "USD",
    slug: "buy-followers-australia",
    pairedSlug: "comprar-seguidores-instagram",
    platform: "instagram",
    metric: "followers",
    regionCluster: "country-hub",
    ogLocale: "en_AU",
    inLanguage: "en-AU",
    areaServed: ["AU", "NZ"],
    metaTitle: "Buy Instagram, TikTok & YouTube Followers Australia — Fast & Safe | FollowMe",
    metaDescription:
      "Automated Instagram, TikTok, and YouTube growth for Australia & New Zealand. Zero password required, 24/7 dispatch across AEST/AEDT, Stripe checkout with AU Cards & Apple Pay, 30–365d refill.",
    keywords: [
      "buy instagram followers australia",
      "buy tiktok followers australia",
      "buy youtube subscribers australia",
      "buy followers australia safe",
      "best smm panel australia",
      "buy instagram likes australia",
    ],
    eyebrow: "AUSTRALIA & NEW ZEALAND · 24/7 AEST DISPATCH",
    h1Start: "Buy Instagram, TikTok & YouTube followers in Australia ",
    h1Sticker: "with 24/7 dispatch.",
    intro:
      "Built for Australian and New Zealand creators, hospitality venues, fitness brands, and online stores from Sydney and Melbourne to Brisbane, Perth, and Auckland. Zero passwords, instant Stripe checkout, and 30–365 day refill protection.",
    tldrLabel: "Quick Summary (Australia & NZ)",
    tldrDefinition:
      "FollowMe is a password-free automated social growth platform serving Australia and New Zealand across Instagram, TikTok, and YouTube, with 24/7 dispatch across AEST/AEDT/NZDT, Stripe card & Apple Pay checkout, and up to 365-day refill.",
    facts: [
      "24/7 automated dispatch tailored for Sydney, Melbourne, Brisbane, Perth, Adelaide, and Auckland timezones.",
      "Official Stripe Checkout supports Australian Visa, Mastercard, Amex, Apple Pay, and Google Pay with instant balance crediting.",
      "Zero password or login sharing — only your public @username or post link is needed.",
      "High-retention followers, Reels views, TikTok LIVE packs, and YouTube watch hours with 30–365 day refill.",
    ],
    comparisonHeading: "FollowMe Australia vs. Slow Cold-Start Social Feeds",
    comparisonRows: [
      {
        criterion: "Timezone availability",
        followMe: "100% automated 24/7 (AEST / AEDT / AWST / NZDT)",
        traditional: "Manual teams delayed across overseas hours",
      },
      {
        criterion: "Account privacy",
        followMe: "Zero passwords — public @handle only",
        traditional: "Growth bots ask for Instagram login details",
      },
      {
        criterion: "Checkout trust",
        followMe: "Verified Stripe Checkout (AU Cards, Apple Pay, Google Pay)",
        traditional: "Sketchy non-Stripe payment links",
      },
      {
        criterion: "Drop protection",
        followMe: "Up to 365-day automated Refill button",
        traditional: "No refill coverage after drops",
      },
    ],
    stepsHeading: "How Australian creators boost their profiles in 3 steps",
    steps: [
      {
        title: "Choose your social network and package",
        detail:
          "Pick Instagram, TikTok, or YouTube followers, likes, views, or comments with exact pricing upfront.",
      },
      {
        title: "Enter your public @handle or video URL",
        detail:
          "Keep your profile public while the order runs. Never share your password with anyone.",
      },
      {
        title: "Complete one-time Stripe checkout",
        detail:
          "Pay with Australian Card, Apple Pay, or Google Pay and watch delivery start within minutes.",
      },
    ],
    faqHeading: "Buy Followers Australia — Frequently Asked Questions",
    faq: [
      {
        q: "Does FollowMe work with Australian bank cards and Apple Pay?",
        a: "Yes. Stripe Checkout accepts Australian Visa, Mastercard, Amex, Apple Pay, and Google Pay from CommBank, NAB, ANZ, Westpac, Up, and Wise with automatic conversion from USD.",
      },
      {
        q: "How fast do orders start in Australian timezones?",
        a: "Delivery is fully automated 24/7, so orders placed in Sydney, Melbourne, Brisbane, Perth, or Auckland typically start within 2 to 15 minutes.",
      },
      {
        q: "Do I need to give my Instagram, TikTok, or YouTube password?",
        a: "Never. FollowMe only asks for your public @username or public link.",
      },
      {
        q: "Are Australian agencies eligible for API v2 and Child Panels?",
        a: "Yes. Agencies across Australia and New Zealand can automate bulk orders via our SMM Panel API v2 (/api/v2) or launch a white-label Child Panel.",
      },
    ],
  },

  // 13. EN Global — Worldwide Best SMM Panel Hub (x-default for country cluster)
  {
    id: "country-global",
    locale: "en",
    currency: "USD",
    slug: "best-smm-panel-global",
    pairedSlug: "painel-smm-brasil",
    platform: "instagram",
    metric: "followers",
    regionCluster: "country-hub",
    ogLocale: "en_US",
    inLanguage: "en",
    areaServed: ["US", "CA", "GB", "AU", "NZ", "IE", "BR", "PT", "DE", "FR", "ES", "MX"],
    metaTitle: "Best Global SMM Panel (USA, UK, Canada, Australia & Brazil) — Stripe & API v2 | FollowMe",
    metaDescription:
      "Automated worldwide SMM panel for Instagram, TikTok, YouTube, X, Facebook, Telegram, and Spotify. Dual-market USD & BRL Pix Stripe checkout, API v2, Child Panels, and 30–365d refill.",
    keywords: [
      "best smm panel",
      "global smm panel stripe",
      "smm panel api v2",
      "buy social media followers worldwide",
      "smm panel usa uk canada australia",
      "cheapest high retention smm panel",
    ],
    eyebrow: "GLOBAL SMM PLATFORM · USA · UK · CA · AU · BR",
    h1Start: "The automated global SMM panel ",
    h1Sticker: "built for creators & agencies.",
    intro:
      "Serving creators, e-commerce brands, and resellers in the United States, United Kingdom, Canada, Australia, Europe, and Brazil. Transparent USD & BRL pricing, official Stripe checkout (Cards, Apple Pay, Google Pay & Brazil Pix 24/7), zero passwords, and full API v2.",
    tldrLabel: "Global Platform Overview",
    tldrDefinition:
      "FollowMe (followm.click) is a multi-region automated SMM panel serving the USA, UK, Canada, Australia, New Zealand, Europe, and Brazil with Instagram, TikTok, and YouTube growth, Stripe Checkout, API v2, Drip-Feed, and 30–365 day refill warranties.",
    facts: [
      "Automatic language & currency localization: English/USD for USA, UK, Canada, Australia & global visitors; Portuguese/BRL with instant 24/7 Pix for Brazil.",
      "Official Stripe payment rails (Visa, Mastercard, Amex, Apple Pay, Google Pay, and Brazil Pix).",
      "Zero passwords required on every order — public @username or URL only.",
      "Enterprise-ready tools: Mass Orders, Auto-Likes Subscriptions, Drip-Feed, Affiliate Program, White-Label Child Panels, and standard SMM Panel API v2 (/api/v2).",
    ],
    comparisonHeading: "FollowMe Global vs. Legacy Offshore SMM Panels",
    comparisonRows: [
      {
        criterion: "Payment trust & speed",
        followMe: "Official Stripe (Cards, Apple Pay, Google Pay & Pix 24/7)",
        traditional: "Crypto-only or unreliable third-party processors",
      },
      {
        criterion: "Regional localization",
        followMe: "Native EN/USD (US, UK, CA, AU) + PT-BR/BRL (Brazil)",
        traditional: "Single clunky currency with hidden FX markups",
      },
      {
        criterion: "Refill transparency",
        followMe: "Clear 30/60/90/365-day refill badges + dashboard button",
        traditional: "Hidden drop rates with manual ticket friction",
      },
      {
        criterion: "Agency automation",
        followMe: "Full API v2 + Mass Orders + White-Label Child Panel",
        traditional: "Manual ordering only",
      },
    ],
    stepsHeading: "How to start using FollowMe globally in 3 steps",
    steps: [
      {
        title: "Browse live packages or connect via API v2",
        detail:
          "Use the instant package builder on the storefront or plug your API key into /api/v2.",
      },
      {
        title: "Submit your public @handle or content URL",
        detail:
          "Zero logins or passwords required across Instagram, TikTok, YouTube, and other networks.",
      },
      {
        title: "Fund via Stripe and scale automatically",
        detail:
          "Top up instantly in USD or BRL Pix and monitor delivery, Drip-Feed, and refills 24/7.",
      },
    ],
    faqHeading: "Global SMM Panel — Frequently Asked Questions",
    faq: [
      {
        q: "Which countries does FollowMe support?",
        a: "FollowMe serves customers worldwide, with optimized checkout and regional landing pages for the United States, United Kingdom, Canada, Australia, New Zealand, Ireland, Brazil, and Europe.",
      },
      {
        q: "Does FollowMe offer a standard SMM Panel API v2?",
        a: "Yes. Developers and agencies can automate services, balance checks, orders, multi-status checks, and refills via HTTP POST at https://followm.click/api/v2.",
      },
      {
        q: "Are passwords ever needed to grow an account?",
        a: "Never. Every service works strictly with public usernames or public content URLs.",
      },
      {
        q: "What refill guarantees are available?",
        a: "Depending on the selected tier, services include 30, 60, 90, or 365-day refill protection triggered directly from your dashboard or API.",
      },
    ],
  },

  // 14. PT-BR — Dedicated Brazil SMM Panel Hub
  {
    id: "country-brazil",
    locale: "pt",
    currency: "BRL",
    slug: "painel-smm-brasil",
    pairedSlug: "best-smm-panel-global",
    platform: "instagram",
    metric: "followers",
    regionCluster: "country-hub",
    ogLocale: "pt_BR",
    inLanguage: "pt-BR",
    areaServed: ["BR", "PT"],
    metaTitle: "Melhor Painel SMM do Brasil com Pix 24/7 e Reposição — Instagram, TikTok e YouTube | FollowMe",
    metaDescription:
      "Painel SMM brasileiro automatizado com Pix 24/7 via Stripe, preços transparentes em Reais, seguidores brasileiros e mundiais, API v2 para revendedores e garantia de reposição até 365 dias.",
    keywords: [
      "painel smm brasil",
      "melhor painel smm brasileiro pix",
      "comprar seguidores instagram pix 24h",
      "painel smm barato confiavel",
      "revender seguidores api v2 brasil",
      "comprar views reels tiktok youtube brasil",
    ],
    eyebrow: "PAINEL SMM BRASIL (BRL) · PIX AUTOMÁTICO 24/7",
    h1Start: "O melhor painel SMM do Brasil ",
    h1Sticker: "com Pix 24/7 e garantia.",
    intro:
      "Criado para criadores, negócios locais, e-commerces, artistas e agências de todo o Brasil. Compre seguidores brasileiros ou mundiais, curtidas, views em Reels, TikTok e YouTube em Reais, com Pix automático via Stripe e zero pedido de senha.",
    tldrLabel: "Resumo Direto (Brasil · BRL)",
    tldrDefinition:
      "A FollowMe (followm.click) é um painel SMM automatizado no Brasil que entrega seguidores, curtidas, visualizações e inscritos para Instagram, TikTok e YouTube em Reais, com recarga instantânea via Pix Stripe 24/7, API v2 e reposição de 30 a 365 dias.",
    facts: [
      "Recarga instantânea 24 horas via Checkout oficial da Stripe no Pix ou Cartão de Crédito em Reais (BRL).",
      "Seguidores brasileiros e mundiais para Instagram, pacotes para liberar Live no TikTok e inscritos/views no YouTube.",
      "Zero senha: basta informar seu @usuário público ou link do vídeo/post.",
      "Ferramentas profissionais: Pedido em Massa, Drip-Feed (entrega gradual), Assinaturas de Auto-Likes, Painel Filho White-Label e API Pública v2.",
    ],
    comparisonHeading: "FollowMe Brasil vs. Sites Genéricos de Seguidores",
    comparisonRows: [
      {
        criterion: "Pagamento no Brasil",
        followMe: "Pix automático 24/7 e Cartão via Stripe oficial",
        traditional: "Aprovação manual ou boletos lentos",
      },
      {
        criterion: "Segurança da conta",
        followMe: "Nunca pede senha — apenas @público",
        traditional: "Apps pedem login e colocam a conta em risco",
      },
      {
        criterion: "Garantia de reposição",
        followMe: "Botão de Reposição 30 a 365 dias no painel",
        traditional: "Sem suporte quando há queda",
      },
      {
        criterion: "Escala para agências",
        followMe: "API v2 + Pedido em Massa + Painel Filho",
        traditional: "Apenas pedidos avulsos sem automação",
      },
    ],
    stepsHeading: "Como usar o Painel SMM FollowMe no Brasil em 3 passos",
    steps: [
      {
        title: "Escolha a rede social e o pacote em Reais",
        detail:
          "Compare seguidores brasileiros, mundiais 90D/365D, curtidas, Reels views, TikTok e YouTube.",
      },
      {
        title: "Cole apenas seu @usuário ou link público",
        detail:
          "Mantenha o perfil em modo Público durante a entrega. Jamais pedimos sua senha.",
      },
      {
        title: "Pague no Pix 24/7 ou Cartão via Stripe",
        detail:
          "O saldo libera em segundos e o pedido inicia em minutos com acompanhamento ao vivo no painel.",
      },
    ],
    faqHeading: "Painel SMM Brasil — Dúvidas Frequentes",
    faq: [
      {
        q: "O Pix na FollowMe cai na hora mesmo de madrugada ou fim de semana?",
        a: "Sim. O Pix é processado automaticamente pelo Checkout oficial da Stripe 24 horas por dia, 7 dias por semana, liberando o saldo em segundos.",
      },
      {
        q: "Vocês têm seguidores brasileiros reais e garantia de reposição?",
        a: "Sim. Oferecemos categorias dedicadas de seguidores brasileiros e curtidas brasileiras, além de pacotes mundiais HQ com garantia de reposição de 30, 60, 90 ou 365 dias.",
      },
      {
        q: "Agências e revendedores podem integrar via API v2?",
        a: "Sim. Nossa API v2 padrão SMM (https://followm.click/api/v2) e o módulo de Painel Filho White-Label permitem revender serviços automaticamente.",
      },
      {
        q: "Preciso informar a senha do Instagram, TikTok ou YouTube?",
        a: "Nunca. Apenas o @usuário público ou o link da publicação/vídeo é necessário.",
      },
    ],
  },
];

export function findGeoKeywordPage(
  locale: "en" | "pt",
  slug: string
): GeoKeywordPageConfig | undefined {
  return GEO_KEYWORD_PAGES.find((p) => p.locale === locale && p.slug === slug);
}

export function getGeoKeywordPagesByLocale(locale: "en" | "pt"): GeoKeywordPageConfig[] {
  return GEO_KEYWORD_PAGES.filter((p) => p.locale === locale);
}
