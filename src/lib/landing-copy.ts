import type { AppLocale } from "./i18n";

export interface LandingFaqItem {
  q: string;
  a: string;
}

export interface PainPointCopy {
  tag: string;
  title: string;
  pain: string;
  fix: string;
  statBefore: string;
  statAfter: string;
  statLabel: string;
}

export interface LandingCopy {
  metaTitle: string;
  metaDescription: string;
  hero: {
    eyebrow: string;
    headlineStart: string;
    headlineAccent: string;
    subtext: string;
    primaryCta: string;
    secondaryCta: string;
    visualCaption: string;
  };
  proofStrip: Array<{
    value: number;
    prefix?: string;
    suffix: string;
    label: string;
  }>;
  selector: {
    heading: string;
    subtext: string;
    stepNetwork: string;
    stepGoal: string;
    stepTier: string;
    stepQuantity: string;
    popularBadge: string;
    per1kLabel: string;
    startTimeLabel: string;
    refillLabel: string;
    noPasswordNote: string;
    orderBtnPrefix: string;
    allServicesLink: string;
    goals: {
      followers: string;
      subscribers: string;
      likes: string;
      views: string;
      comments: string;
    };
    emptyState: string;
  };
  pains: {
    eyebrow: string;
    heading: string;
    subtext: string;
    beforeLabel: string;
    afterLabel: string;
    items: [PainPointCopy, PainPointCopy, PainPointCopy];
  };
  directory: {
    heading: string;
    subtext: string;
    fromLabel: string;
    per1k: string;
    viewAllNetwork: string;
    orderNow: string;
  };
  howItWorks: {
    heading: string;
    subtext: string;
    paymentNote: string;
    steps: Array<{
      num: string;
      title: string;
      desc: string;
    }>;
  };
  faq: {
    heading: string;
    subtext: string;
    items: LandingFaqItem[];
  };
  agencyBanner: {
    heading: string;
    subtext: string;
    ctaApi: string;
    ctaPartners: string;
  };
  footer: {
    tagline: string;
    platformTitle: string;
    networksTitle: string;
    helpTitle: string;
    servicesCatalog: string;
    apiDocs: string;
    partners: string;
    signIn: string;
    createAccount: string;
    faq: string;
    terms: string;
    resetPassword: string;
    supportTicket: string;
    rights: string;
    paymentsBadge: string;
  };
}

export const LANDING_COPY: Record<AppLocale, LandingCopy> = {
  en: {
    metaTitle: "FollowMe | Buy Instagram, TikTok & YouTube Followers, Likes & Views",
    metaDescription:
      "Turn quiet social profiles into instant credibility. Order Instagram followers, TikTok views, and YouTube subscribers with transparent US pricing, 30-day refill, and zero passwords required.",
    hero: {
      eyebrow: "STARTS IN MINUTES · ZERO PASSWORDS REQUIRED",
      headlineStart: "Great content shouldn't ",
      headlineAccent: "look empty.",
      subtext:
        "Turn a quiet profile into instant social proof. Choose Instagram, TikTok, or YouTube followers, likes, and views in 60 seconds.",
      primaryCta: "Choose Your Package",
      secondaryCta: "View All Prices",
      visualCaption: "Automated delivery · Stripe checkout",
    },
    proofStrip: [
      { value: 42800, suffix: "+", label: "Orders delivered" },
      { value: 2, suffix: " min", label: "Average start time" },
      { value: 0, suffix: "", label: "Passwords ever asked" },
      { value: 365, suffix: "d", label: "Max refill protection" },
    ],
    selector: {
      heading: "Pick your network. See the exact price.",
      subtext:
        "Select a platform, choose followers, likes, views, or comments, and lock your exact package in one click.",
      stepNetwork: "1. Network",
      stepGoal: "2. What you want",
      stepTier: "3. Delivery tier",
      stepQuantity: "4. Select package",
      popularBadge: "Most Popular",
      per1kLabel: "per 1,000",
      startTimeLabel: "Avg. start",
      refillLabel: "day refill",
      noPasswordNote: "Only your public @username or post link. Never your password.",
      orderBtnPrefix: "Continue with",
      allServicesLink: "Compare full catalog",
      goals: {
        followers: "Followers",
        subscribers: "Subscribers",
        likes: "Likes",
        views: "Views",
        comments: "Comments",
      },
      emptyState: "Select another metric or view our full catalog.",
    },
    pains: {
      eyebrow: "WHY GREAT PROFILES STAY INVISIBLE",
      heading: "People check your numbers before they trust your offer.",
      subtext:
        "You already put hours into filming, writing, and building. Low social proof quietly kills clicks before anyone reads your bio.",
      beforeLabel: "Without momentum",
      afterLabel: "With FollowMe",
      items: [
        {
          tag: "THE COLD-START WALL",
          title: "Your best video dies at 140 views.",
          pain: "Algorithms measure early velocity in the first 30 minutes. Strong content posted to a small audience rarely gets pushed to Explore or For You.",
          fix: "Trigger instant views, likes, and realistic comments right after publishing so every reel or short looks worth watching.",
          statBefore: "140 views",
          statAfter: "10,000+ views",
          statLabel: "First-hour momentum",
        },
        {
          tag: "THE 3-SECOND TRUST CHECK",
          title: "Shoppers and sponsors judge your brand in 3 seconds.",
          pain: "When ad traffic or cold prospects tap your profile and see 230 followers, they bounce to a louder competitor even when your product is better.",
          fix: "Build an established follower baseline with refill protection so every profile visit converts into DMs, clicks, and sales.",
          statBefore: "230 followers",
          statAfter: "5,000+ followers",
          statLabel: "Instant credibility",
        },
        {
          tag: "MONTHS YOU DON'T HAVE",
          title: "Waiting 18 months for organic proof stalls launches.",
          pain: "New stores, podcasts, creators, and client accounts burn cash on ads while trying to earn basic credibility from scratch.",
          fix: "Launch on day one with social authority across Instagram, TikTok, and YouTube, or automate gradual drip-feed delivery.",
          statBefore: "18 months",
          statAfter: "Under 10 min",
          statLabel: "Time to authority",
        },
      ],
    },
    directory: {
      heading: "Clear pricing across every major network.",
      subtext:
        "No hidden subscriptions, no confusing reseller codes. Every rate below is transparent US market pricing per 1,000.",
      fromLabel: "From",
      per1k: "/ 1,000",
      viewAllNetwork: "See all packages",
      orderNow: "Order",
    },
    howItWorks: {
      heading: "Live in three steps. Zero friction.",
      subtext: "Built so creators buy in 60 seconds and agencies scale thousands of orders.",
      paymentNote: "Secure Stripe checkout in USD (Credit Card, Debit Card, Apple Pay & Google Pay).",
      steps: [
        {
          num: "01",
          title: "Choose your exact package",
          desc: "Pick Instagram, TikTok, or YouTube and select the exact count of followers, likes, views, or comments with upfront pricing.",
        },
        {
          num: "02",
          title: "Paste your public link",
          desc: "Enter only your public @username or video URL. We never ask for your password or account access.",
        },
        {
          num: "03",
          title: "Pay via Stripe and watch it grow",
          desc: "Checkout securely in USD. Automated delivery begins in minutes with live order tracking and refill protection.",
        },
      ],
    },
    faq: {
      heading: "Direct answers before you order.",
      subtext: "Everything creators, brands, and agencies ask about safety, speed, refills, and payments.",
      items: [
        {
          q: "Do I ever need to share my Instagram, TikTok, or YouTube password?",
          a: "Never. FollowMe only needs your public username or post URL. Your login credentials stay 100% private and your account stays fully under your control.",
        },
        {
          q: "How fast does delivery start after checkout?",
          a: "Most follower, like, and view orders start automatically within 2 to 15 minutes after confirmation. You can also enable Drip-Feed inside the dashboard for gradual, natural-looking delivery.",
        },
        {
          q: "What happens if followers drop after delivery?",
          a: "Services marked with Refill (30, 60, or 365 days) include one-click refill protection right inside your Orders dashboard so your count stays protected.",
        },
        {
          q: "Are US prices one-time or recurring subscriptions?",
          a: "All standard follower, like, view, and comment packages are one-time orders funded from your account balance via Stripe in USD. Optional Auto-Likes subscriptions are available separately only if you turn them on.",
        },
        {
          q: "Can agencies and resellers automate orders with an API?",
          a: "Yes. Every account includes a personal API v2 key compatible with standard SMM workflows, plus Mass Orders and white-label Child Panels for agencies.",
        },
      ],
    },
    agencyBanner: {
      heading: "Running an agency or reselling growth?",
      subtext:
        "Connect directly to our SMM Panel API v2, submit up to 500 mass orders at once, or launch your own white-label Child Panel.",
      ctaApi: "Read API v2 Docs",
      ctaPartners: "Agency Partnerships",
    },
    footer: {
      tagline:
        "Fast, transparent social growth for Instagram, TikTok, and YouTube. Secure Stripe checkout, refill protection, and API v2 automation.",
      platformTitle: "Platform",
      networksTitle: "Popular Services",
      helpTitle: "Support & Legal",
      servicesCatalog: "Full Service Catalog",
      apiDocs: "API v2 Documentation",
      partners: "Agency & Reseller Program",
      signIn: "Sign in to Dashboard",
      createAccount: "Create Free Account",
      faq: "Frequently Asked Questions",
      terms: "Terms & Refund Policy",
      resetPassword: "Reset Password",
      supportTicket: "Open Support Ticket",
      rights: "All rights reserved.",
      paymentsBadge: "STRIPE USD & BRL · NO PASSWORD REQUIRED · 24/7 AUTOMATED",
    },
  },
  pt: {
    metaTitle: "FollowMe | Comprar Seguidores, Curtidas e Views no Instagram, TikTok e YouTube",
    metaDescription:
      "Transforme perfis parados em autoridade imediata. Seguidores, curtidas, visualizações e comentários para Instagram, TikTok e YouTube com Pix instantâneo via Stripe e reposição garantida.",
    hero: {
      eyebrow: "INÍCIO EM MINUTOS · SEM PEDIR SENHA",
      headlineStart: "Conteúdo bom não pode ",
      headlineAccent: "parecer abandonado.",
      subtext:
        "Transforme um perfil parado em prova social imediata. Escolha seguidores, curtidas, views ou comentários para Instagram, TikTok e YouTube em 60 segundos.",
      primaryCta: "Escolher Meu Pacote",
      secondaryCta: "Ver Tabela Completa",
      visualCaption: "Entrega automática · Pix e Cartão via Stripe",
    },
    proofStrip: [
      { value: 42800, suffix: "+", label: "Pedidos entregues" },
      { value: 2, suffix: " min", label: "Início médio" },
      { value: 0, suffix: "", label: "Senhas solicitadas" },
      { value: 365, suffix: "d", label: "Garantia máxima de refil" },
    ],
    selector: {
      heading: "Escolha a rede. Veja o preço exato na hora.",
      subtext:
        "Selecione Instagram, TikTok ou YouTube, escolha o que precisa (seguidores, curtidas, views ou comentários) e contrate em 1 clique.",
      stepNetwork: "1. Rede social",
      stepGoal: "2. O que você quer",
      stepTier: "3. Nível de entrega",
      stepQuantity: "4. Escolha o pacote",
      popularBadge: "Mais Pedido",
      per1kLabel: "por 1.000",
      startTimeLabel: "Início médio",
      refillLabel: "dias de reposição",
      noPasswordNote: "Só precisamos do @usuário ou link público. Nunca pedimos sua senha.",
      orderBtnPrefix: "Continuar com",
      allServicesLink: "Comparar catálogo completo",
      goals: {
        followers: "Seguidores",
        subscribers: "Inscritos",
        likes: "Curtidas",
        views: "Visualizações",
        comments: "Comentários",
      },
      emptyState: "Escolha outra métrica ou explore o catálogo completo.",
    },
    pains: {
      eyebrow: "POR QUE PERFIS BONS SÃO IGNORADOS",
      heading: "As pessoas olham seus números antes de confiar no seu trabalho.",
      subtext:
        "Você investe horas gravando, editando e anunciando. Um perfil com números baixos derruba sua conversão antes mesmo do visitante ler sua bio.",
      beforeLabel: "Sem prova social",
      afterLabel: "Com a FollowMe",
      items: [
        {
          tag: "A BARREIRA DO ZERO",
          title: "Seu melhor vídeo trava em 140 visualizações.",
          pain: "O algoritmo testa o ritmo de engajamento nos primeiros 30 minutos. Conteúdo bom postado em perfil frio quase nunca chega ao Explorar ou For You.",
          fix: "Destrave visualizações, curtidas e comentários nos primeiros minutos após postar para dar tração imediata a cada Reel ou vídeo.",
          statBefore: "140 views",
          statAfter: "10.000+ views",
          statLabel: "Tração na primeira hora",
        },
        {
          tag: "O JULGAMENTO EM 3 SEGUNDOS",
          title: "Clientes e marcas julgam sua credibilidade em 3 segundos.",
          pain: "Quem vem de um anúncio ou indicação abre seu perfil, vê 230 seguidores e fecha a aba para comprar de um concorrente que parece maior.",
          fix: "Construa uma base sólida de seguidores com proteção contra quedas (Reposição) para transformar visitas em mensagens e vendas.",
          statBefore: "230 seguidores",
          statAfter: "5.000+ seguidores",
          statLabel: "Autoridade imediata",
        },
        {
          tag: "TEMPO QUE VOCÊ NÃO TEM",
          title: "Esperar 18 meses para parecer grande atrasa seu caixa.",
          pain: "Lojas novas, lançamentos, criadores e clientes de agência queimam verba de tráfego enquanto tentam provar que são confiáveis.",
          fix: "Comece já com presença estabelecida no Instagram, TikTok e YouTube, com entrega rápida ou gradual (Drip-Feed) no seu ritmo.",
          statBefore: "18 meses",
          statAfter: "Menos de 10 min",
          statLabel: "Tempo até parecer grande",
        },
      ],
    },
    directory: {
      heading: "Serviços organizados por rede, sem confusão.",
      subtext:
        "Sem assinatura escondida e sem linguagem complicada. Veja exatamente quanto custa cada serviço em Reais por 1.000 unidades.",
      fromLabel: "A partir de",
      per1k: "/ 1.000",
      viewAllNetwork: "Ver todos os pacotes",
      orderNow: "Pedir",
    },
    howItWorks: {
      heading: "Do clique à entrega em 3 passos simples.",
      subtext: "Feito para criadores comprarem em 60 segundos e agências escalarem centenas de perfis.",
      paymentNote: "Checkout oficial Stripe em Reais: Pix com crédito imediato 24/7 ou Cartão de Crédito.",
      steps: [
        {
          num: "01",
          title: "Escolha rede, serviço e quantidade",
          desc: "Veja o preço exato na tela para seguidores, curtidas, visualizações ou comentários no Instagram, TikTok ou YouTube.",
        },
        {
          num: "02",
          title: "Cole apenas o @perfil ou link público",
          desc: "Nenhuma senha é pedida. Basta o link público do perfil, post, Reel ou vídeo que vai receber a entrega.",
        },
        {
          num: "03",
          title: "Pague no Pix ou Cartão e acompanhe",
          desc: "Saldo creditado automaticamente pela Stripe. A entrega começa em minutos com acompanhamento em tempo real e botão de reposição.",
        },
      ],
    },
    faq: {
      heading: "Respostas diretas antes de pedir.",
      subtext: "Tudo o que criadores, lojas e agências perguntam sobre segurança, velocidade, reposição e Pix.",
      items: [
        {
          q: "Preciso informar a senha do meu Instagram, TikTok ou YouTube?",
          a: "Nunca. A FollowMe precisa apenas do seu @usuário ou link público da publicação. Sua senha permanece 100% privada.",
        },
        {
          q: "Quanto tempo demora para começar a entrega?",
          a: "A maioria dos pedidos de seguidores, curtidas e visualizações inicia automaticamente entre 2 e 15 minutos após a confirmação. Você também pode ativar Drip-Feed para entrega gradual.",
        },
        {
          q: "E se cair algum seguidor depois da entrega?",
          a: "Os serviços com selo de Reposição (30, 60 ou 365 dias) contam com botão de reposição (Refill) direto na aba Meus Pedidos para recompor eventuais quedas.",
        },
        {
          q: "Como funciona o pagamento no Brasil?",
          a: "Você adiciona saldo em Reais via Checkout oficial da Stripe usando Pix instantâneo 24/7 ou Cartão de Crédito. Não há mensalidade obrigatória.",
        },
        {
          q: "Agências e revendedores podem automatizar via API?",
          a: "Sim. Toda conta inclui chave de API v2 compatível com o padrão mundial de painéis SMM, além de Pedido em Massa e Painel Filho White-Label.",
        },
      ],
    },
    agencyBanner: {
      heading: "Atende clientes ou revende crescimento social?",
      subtext:
        "Integre direto na API v2 padrão SMM, dispare pedidos em massa em segundos ou crie seu próprio Painel Filho com sua marca.",
      ctaApi: "Documentação API v2",
      ctaPartners: "Programa de Parcerias",
    },
    footer: {
      tagline:
        "Crescimento social rápido e transparente para Instagram, TikTok e YouTube. Pagamento Stripe Pix e Cartão 24/7, garantia de reposição e API v2.",
      platformTitle: "Plataforma",
      networksTitle: "Redes Populares",
      helpTitle: "Suporte e Políticas",
      servicesCatalog: "Catálogo Completo",
      apiDocs: "Documentação API v2",
      partners: "Parcerias e Revenda",
      signIn: "Acessar Painel",
      createAccount: "Criar Conta Grátis",
      faq: "Perguntas Frequentes",
      terms: "Termos e Reembolso",
      resetPassword: "Recuperar Senha",
      supportTicket: "Abrir Ticket de Suporte",
      rights: "Todos os direitos reservados.",
      paymentsBadge: "STRIPE PIX E CARTÃO 24/7 · SEM SENHA · API v2",
    },
  },
  es: {
    metaTitle: "FollowMe | Comprar Seguidores, Likes y Vistas para Instagram, TikTok y YouTube",
    metaDescription:
      "Convierte perfiles silenciosos en autoridad inmediata. Seguidores, likes, vistas y comentarios para Instagram, TikTok y YouTube con pagos Stripe y garantía de reposición.",
    hero: {
      eyebrow: "INICIO EN MINUTOS · SIN CONTRASEÑA",
      headlineStart: "Tu buen contenido no puede ",
      headlineAccent: "parecer vacío.",
      subtext:
        "Convierte un perfil quieto en prueba social inmediata. Elige seguidores, likes y vistas para Instagram, TikTok o YouTube en 60 segundos.",
      primaryCta: "Elegir Mi Paquete",
      secondaryCta: "Ver Todos los Precios",
      visualCaption: "Entrega automatizada · Pago Stripe",
    },
    proofStrip: [
      { value: 42800, suffix: "+", label: "Pedidos entregados" },
      { value: 2, suffix: " min", label: "Inicio promedio" },
      { value: 0, suffix: "", label: "Contraseñas pedidas" },
      { value: 365, suffix: "d", label: "Máxima reposición" },
    ],
    selector: {
      heading: "Elige la red. Ve el precio exacto al instante.",
      subtext:
        "Selecciona Instagram, TikTok o YouTube, elige seguidores, likes, vistas o comentarios y ordena en un clic.",
      stepNetwork: "1. Red social",
      stepGoal: "2. Qué necesitas",
      stepTier: "3. Nivel de entrega",
      stepQuantity: "4. Selecciona paquete",
      popularBadge: "Más Popular",
      per1kLabel: "por 1,000",
      startTimeLabel: "Inicio prom.",
      refillLabel: "días reposición",
      noPasswordNote: "Solo tu @usuario o enlace público. Nunca tu contraseña.",
      orderBtnPrefix: "Continuar con",
      allServicesLink: "Ver catálogo completo",
      goals: {
        followers: "Seguidores",
        subscribers: "Suscriptores",
        likes: "Likes",
        views: "Vistas",
        comments: "Comentarios",
      },
      emptyState: "Selecciona otra métrica o explora el catálogo completo.",
    },
    pains: {
      eyebrow: "POR QUÉ BUENOS PERFILES PASAN DESAPERCIBIDOS",
      heading: "La gente mira tus números antes de confiar en tu oferta.",
      subtext:
        "Inviertes horas creando contenido. Sin prueba social inicial, los visitantes se van antes de leer tu biografía.",
      beforeLabel: "Sin impulso",
      afterLabel: "Con FollowMe",
      items: [
        {
          tag: "EL MURO DEL ARRANQUE EN FRÍO",
          title: "Tu mejor video se frena en 140 vistas.",
          pain: "Los algoritmos miden la velocidad en los primeros 30 minutos. Un perfil pequeño rara vez recibe alcance orgánico inicial.",
          fix: "Activa vistas, likes y comentarios apenas publicas para impulsar cada video desde el minuto uno.",
          statBefore: "140 vistas",
          statAfter: "10,000+ vistas",
          statLabel: "Impulso inicial",
        },
        {
          tag: "JUICIO EN 3 SEGUNDOS",
          title: "Clientes y marcas evalúan tu perfil en 3 segundos.",
          pain: "Cuando alguien llega desde un anuncio y ve pocos seguidores, compra en un competidor que luce más consolidado.",
          fix: "Construye autoridad inmediata con garantía de reposición para convertir visitas en mensajes y ventas.",
          statBefore: "230 seguidores",
          statAfter: "5,000+ seguidores",
          statLabel: "Credibilidad inmediata",
        },
        {
          tag: "MESES QUE NO TIENES",
          title: "Esperar 18 meses frena cualquier lanzamiento.",
          pain: "Tiendas nuevas, creadores y agencias gastan en anuncios mientras intentan ganar credibilidad básica.",
          fix: "Lanza desde el día uno con presencia sólida en Instagram, TikTok y YouTube, o programa entrega gradual.",
          statBefore: "18 meses",
          statAfter: "Menos de 10 min",
          statLabel: "Tiempo hacia autoridad",
        },
      ],
    },
    directory: {
      heading: "Precios claros organizados por red.",
      subtext: "Sin suscripciones ocultas. Cada tarifa corresponde a 1,000 unidades.",
      fromLabel: "Desde",
      per1k: "/ 1,000",
      viewAllNetwork: "Ver todos los paquetes",
      orderNow: "Pedir",
    },
    howItWorks: {
      heading: "En marcha en tres pasos simples.",
      subtext: "Diseñado para creadores rápidos y agencias con alto volumen.",
      paymentNote: "Pago seguro con Stripe (Tarjeta de Crédito/Débito, Apple Pay y Google Pay).",
      steps: [
        {
          num: "01",
          title: "Elige tu paquete exacto",
          desc: "Selecciona red, métrica y cantidad con el precio final visible desde el inicio.",
        },
        {
          num: "02",
          title: "Pega tu enlace público",
          desc: "Solo necesitamos tu @usuario o enlace del video. Jamás pedimos contraseñas.",
        },
        {
          num: "03",
          title: "Paga con Stripe y mira el avance",
          desc: "Entrega automatizada en minutos con seguimiento en vivo y protección de reposición.",
        },
      ],
    },
    faq: {
      heading: "Respuestas claras antes de ordenar.",
      subtext: "Todo sobre seguridad, tiempos de entrega, reposición y pagos.",
      items: [
        {
          q: "¿Necesito compartir mi contraseña?",
          a: "Nunca. FollowMe solo necesita tu nombre de usuario o enlace público.",
        },
        {
          q: "¿Qué tan rápido empieza la entrega?",
          a: "La mayoría de pedidos inician entre 2 y 15 minutos tras la confirmación.",
        },
        {
          q: "¿Qué pasa si bajan algunos seguidores?",
          a: "Los servicios con garantía de reposición (30 a 365 días) permiten activar Refill con un clic en tu panel.",
        },
        {
          q: "¿Son pagos únicos o suscripciones?",
          a: "Todos los paquetes estándar son pagos únicos desde tu saldo recargado vía Stripe.",
        },
        {
          q: "¿Tienen API para agencias y revendedores?",
          a: "Sí, incluimos API v2 estándar SMM, pedidos masivos y Panel Hijo marca blanca.",
        },
      ],
    },
    agencyBanner: {
      heading: "¿Tienes agencia o revendes crecimiento social?",
      subtext:
        "Conéctate a nuestra API v2 estándar SMM, envía pedidos masivos o lanza tu propio Panel Hijo.",
      ctaApi: "Ver Docs API v2",
      ctaPartners: "Alianzas para Agencias",
    },
    footer: {
      tagline:
        "Crecimiento social transparente para Instagram, TikTok y YouTube con pagos Stripe, garantía de reposición y API v2.",
      platformTitle: "Plataforma",
      networksTitle: "Redes Populares",
      helpTitle: "Soporte y Legal",
      servicesCatalog: "Catálogo Completo",
      apiDocs: "Documentación API v2",
      partners: "Alianzas y Revendedores",
      signIn: "Entrar al Panel",
      createAccount: "Crear Cuenta Gratis",
      faq: "Preguntas Frecuentes",
      terms: "Términos y Reembolsos",
      resetPassword: "Restablecer Contraseña",
      supportTicket: "Abrir Ticket",
      rights: "Todos los derechos reservados.",
      paymentsBadge: "STRIPE USD & BRL · SIN CONTRASEÑA · AUTOMATIZADO 24/7",
    },
  },
};

export function getLandingCopy(locale: AppLocale): LandingCopy {
  return LANDING_COPY[locale] || LANDING_COPY.en;
}
