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
