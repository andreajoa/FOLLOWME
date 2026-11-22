export type AppLocale = "pt" | "en" | "es";
export type AppCurrency = "BRL" | "USD" | "EUR";
export type ServiceMetricType = "followers" | "likes" | "views" | "comments" | "other";

export const LOCALE_COOKIE = "fm_locale";
export const CURRENCY_COOKIE = "fm_currency";

export const SUPPORTED_LOCALES: Array<{ code: AppLocale; label: string; short: string }> = [
  { code: "en", label: "English (US)", short: "EN" },
  { code: "pt", label: "Português (BR)", short: "PT" },
  { code: "es", label: "Español", short: "ES" },
];

export const SUPPORTED_CURRENCIES: Array<{ code: AppCurrency; symbol: string }> = [
  { code: "USD", symbol: "$" },
  { code: "BRL", symbol: "R$" },
  { code: "EUR", symbol: "€" },
];

export function normalizeLocale(input?: string | null): AppLocale {
  const lower = (input || "").toLowerCase();
  if (lower.startsWith("pt")) return "pt";
  if (lower.startsWith("es")) return "es";
  return "en";
}

export function normalizeCurrency(input?: string | null): AppCurrency {
  const upper = (input || "").toUpperCase();
  if (upper === "BRL") return "BRL";
  if (upper === "EUR") return "EUR";
  return "USD";
}

export function defaultCurrencyForLocale(locale: AppLocale): AppCurrency {
  if (locale === "pt") return "BRL";
  return "USD";
}

/**
 * Detects user language and native market currency from browser Accept-Language header.
 * English computers -> EN + USD (US market pricing).
 * Portuguese computers -> PT + BRL (Brazil market pricing).
 * Spanish computers -> ES + USD.
 */
export function detectPreferencesFromAcceptLanguage(
  acceptLanguage?: string | null
): { locale: AppLocale; currency: AppCurrency } {
  if (!acceptLanguage || !acceptLanguage.trim()) {
    return { locale: "en", currency: "USD" };
  }

  const parsed = acceptLanguage
    .split(",")
    .map((part) => {
      const [tagRaw, qRaw] = part.trim().split(";");
      const tag = (tagRaw || "").trim().toLowerCase();
      const qMatch = qRaw?.match(/q=([0-9.]+)/);
      const q = qMatch ? Number.parseFloat(qMatch[1]) : 1;
      return { tag, q: Number.isFinite(q) ? q : 0 };
    })
    .filter((entry) => entry.tag.length > 0)
    .sort((a, b) => b.q - a.q);

  for (const item of parsed) {
    if (item.tag.startsWith("pt")) {
      return { locale: "pt", currency: "BRL" };
    }
    if (item.tag.startsWith("en")) {
      return { locale: "en", currency: "USD" };
    }
    if (item.tag.startsWith("es")) {
      return {
        locale: "es",
        currency: item.tag === "es-es" ? "EUR" : "USD",
      };
    }
  }

  return { locale: "en", currency: "USD" };
}

export function inferMetricType(name: string, type = "DEFAULT"): ServiceMetricType {
  const hay = `${name} ${type}`.toLowerCase();
  if (
    hay.includes("coment") ||
    hay.includes("comment") ||
    type === "CUSTOM_COMMENTS"
  ) {
    return "comments";
  }
  if (
    hay.includes("seguidor") ||
    hay.includes("follower") ||
    hay.includes("inscrit") ||
    hay.includes("subscrib") ||
    hay.includes("membro") ||
    hay.includes("member")
  ) {
    return "followers";
  }
  if (
    hay.includes("curtida") ||
    hay.includes("like") ||
    type === "COMMENT_LIKES" ||
    type === "SUBSCRIPTIONS"
  ) {
    return "likes";
  }
  if (
    hay.includes("visualiza") ||
    hay.includes("view") ||
    hay.includes("play") ||
    hay.includes("watch") ||
    hay.includes("espectador") ||
    hay.includes("storie")
  ) {
    return "views";
  }
  return "other";
}

/**
 * Native US retail price floor when a service does not yet have an explicit rateUsd.
 * Reflects US consumer market pricing (Buzzoid/Twicsy/SocialWick benchmarks),
 * never a raw BRL exchange-rate division.
 */
export function suggestUsMarketRate(
  rateBrl: number,
  network = "instagram",
  metricType: ServiceMetricType = "followers"
): number {
  const net = network.toLowerCase();
  const baseFromBrl = rateBrl > 0 ? rateBrl * 0.65 : 9.99;

  if (metricType === "followers") {
    if (net === "youtube") return Math.max(29.99, Math.round(baseFromBrl * 100) / 100);
    if (net === "tiktok") return Math.max(14.99, Math.round(baseFromBrl * 100) / 100);
    return Math.max(12.99, Math.round(baseFromBrl * 100) / 100);
  }
  if (metricType === "likes") {
    return Math.max(4.99, Math.round(baseFromBrl * 100) / 100);
  }
  if (metricType === "views") {
    if (net === "youtube") return Math.max(5.99, Math.round(baseFromBrl * 100) / 100);
    return Math.max(1.49, Math.round(baseFromBrl * 100) / 100);
  }
  if (metricType === "comments") {
    return Math.max(39.9, Math.round(baseFromBrl * 100) / 100);
  }
  return Math.max(9.99, Math.round(baseFromBrl * 100) / 100);
}

/**
 * Returns the native retail rate per 1,000 units for the active market currency.
 * BRL -> native Brazil price (`service.rate`)
 * USD -> native US retail price (`service.rateUsd` or US market benchmark)
 * EUR -> native European retail price derived from US retail tier
 */
export function getServiceMarketRate(
  service: {
    rate: number;
    rateUsd?: number | null;
    network?: string;
    metricType?: string | null;
    name?: string;
    type?: string;
  },
  currency: AppCurrency
): number {
  if (currency === "BRL") {
    return Number.isFinite(service.rate) ? service.rate : 0;
  }
  const metric = (service.metricType as ServiceMetricType | undefined) ||
    inferMetricType(service.name || "", service.type);
  const usdPrice =
    typeof service.rateUsd === "number" && service.rateUsd > 0
      ? service.rateUsd
      : suggestUsMarketRate(service.rate, service.network, metric);

  if (currency === "EUR") {
    return Math.round(usdPrice * 0.92 * 100) / 100;
  }
  return usdPrice;
}

export function formatCurrencyAmount(
  amount: number,
  currency: AppCurrency = "USD",
  showMicro = false
): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const digits = showMicro && Math.abs(safe) > 0 && Math.abs(safe) < 0.1 ? 4 : 2;
  const intlLocale =
    currency === "BRL" ? "pt-BR" : currency === "EUR" ? "es-ES" : "en-US";
  return new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(safe);
}

export function formatNumberForLocale(value: number, locale: AppLocale): string {
  const intlLocale = locale === "pt" ? "pt-BR" : locale === "es" ? "es-ES" : "en-US";
  return new Intl.NumberFormat(intlLocale).format(Math.round(value));
}

export function getLocalizedServiceName(
  service: { name: string; nameEn?: string | null },
  locale: AppLocale
): string {
  if (locale === "pt") return service.name;
  return service.nameEn?.trim() || service.name;
}

export function getLocalizedServiceDescription(
  service: { description: string; descriptionEn?: string | null },
  locale: AppLocale
): string {
  if (locale === "pt") return service.description;
  return service.descriptionEn?.trim() || service.description;
}

export function convertFromBrl(
  amountBrl: number,
  currency: AppCurrency,
  rates: { usdRate?: number; eurRate?: number } = {}
): number {
  const safe = Number.isFinite(amountBrl) ? amountBrl : 0;
  if (currency === "USD") return safe / Math.max(0.1, rates.usdRate || 5.5);
  if (currency === "EUR") return safe / Math.max(0.1, rates.eurRate || 6.0);
  return safe;
}

export function formatMoney(
  amountBrl: number,
  currency: AppCurrency = "BRL",
  rates: { usdRate?: number; eurRate?: number } = {},
  showMicro = false
): string {
  const converted = convertFromBrl(amountBrl, currency, rates);
  return formatCurrencyAmount(converted, currency, showMicro);
}

export interface UiDictionary {
  nav: {
    instagram: string;
    tiktok: string;
    youtube: string;
    services: string;
    api: string;
    cooperation: string;
    faq: string;
    terms: string;
    login: string;
    register: string;
    panel: string;
    admin: string;
  };
  sidebar: {
    availableBalance: string;
    addFundsBtn: string;
    newOrder: string;
    massOrder: string;
    subscriptions: string;
    services: string;
    orders: string;
    addFunds: string;
    affiliates: string;
    childPanel: string;
    cooperation: string;
    tickets: string;
    updates: string;
    account: string;
    adminPanel: string;
    spent: string;
    logout: string;
    operationalPanel: string;
    apiDocs: string;
  };
  hero: {
    badge: string;
    titleLine1: string;
    titleAccent: string;
    titleLine2: string;
    subtitleSuffix: string;
    minDepositLabel: string;
    ordersProcessedLabel: string;
    activeUsersLabel: string;
    ctaCatalog: string;
    ctaApi: string;
  };
  auth: {
    loginTab: string;
    registerTab: string;
    forgotPassword: string;
    resetTitle: string;
  };
}

const DICTIONARIES: Record<AppLocale, UiDictionary> = {
  pt: {
    nav: {
      instagram: "Instagram",
      tiktok: "TikTok",
      youtube: "YouTube",
      services: "Todos Serviços",
      api: "API v2",
      cooperation: "Parcerias",
      faq: "FAQ",
      terms: "Termos",
      login: "Entrar",
      register: "Começar Agora",
      panel: "Painel",
      admin: "Admin",
    },
    sidebar: {
      availableBalance: "Saldo Disponível",
      addFundsBtn: "+ Adicionar Saldo",
      newOrder: "Novo Pedido",
      massOrder: "Pedido em Massa",
      subscriptions: "Assinaturas",
      services: "Serviços",
      orders: "Meus Pedidos",
      addFunds: "Adicionar Saldo",
      affiliates: "Afiliados",
      childPanel: "Painel Filho",
      cooperation: "Parcerias",
      tickets: "Tickets",
      updates: "Atualizações",
      account: "Conta & API",
      adminPanel: "Painel Admin",
      spent: "Gasto",
      logout: "Sair",
      operationalPanel: "Painel Operacional",
      apiDocs: "Docs API",
    },
    hero: {
      badge: "Entrega em Minutos • Sem Senha",
      titleLine1: "CONTEÚDO BOM NÃO PODE",
      titleAccent: "PARECER ABANDONADO.",
      titleLine2: "",
      subtitleSuffix:
        "Escolha Instagram, TikTok ou YouTube e receba seguidores, curtidas, visualizações e comentários com preço transparente e Pix instantâneo.",
      minDepositLabel: "A partir de",
      ordersProcessedLabel: "Pedidos Entregues",
      activeUsersLabel: "Criadores e Marcas",
      ctaCatalog: "Escolher Meu Pacote",
      ctaApi: "Documentação API v2",
    },
    auth: {
      loginTab: "Entrar",
      registerTab: "Criar Conta",
      forgotPassword: "Esqueceu sua senha?",
      resetTitle: "Recuperar Senha",
    },
  },
  en: {
    nav: {
      instagram: "Instagram",
      tiktok: "TikTok",
      youtube: "YouTube",
      services: "All Services",
      api: "API v2",
      cooperation: "Partners",
      faq: "FAQ",
      terms: "Terms",
      login: "Sign in",
      register: "Get Started",
      panel: "Dashboard",
      admin: "Admin",
    },
    sidebar: {
      availableBalance: "Available Balance",
      addFundsBtn: "+ Add Funds",
      newOrder: "New Order",
      massOrder: "Mass Order",
      subscriptions: "Subscriptions",
      services: "Services",
      orders: "Orders",
      addFunds: "Add Funds",
      affiliates: "Affiliates",
      childPanel: "Child Panel",
      cooperation: "Partners",
      tickets: "Tickets",
      updates: "Updates",
      account: "Account & API",
      adminPanel: "Admin Panel",
      spent: "Spent",
      logout: "Logout",
      operationalPanel: "Operations Console",
      apiDocs: "API Docs",
    },
    hero: {
      badge: "Starts in Minutes • No Password Needed",
      titleLine1: "GREAT CONTENT SHOULDN'T",
      titleAccent: "LOOK EMPTY.",
      titleLine2: "",
      subtitleSuffix:
        "Turn a quiet profile into instant social proof. Pick Instagram, TikTok, or YouTube followers, likes, views, and comments in 60 seconds.",
      minDepositLabel: "Starting at",
      ordersProcessedLabel: "Orders Delivered",
      activeUsersLabel: "Creators & Brands",
      ctaCatalog: "Choose Your Package",
      ctaApi: "API v2 Documentation",
    },
    auth: {
      loginTab: "Sign in",
      registerTab: "Sign up",
      forgotPassword: "Forgot password?",
      resetTitle: "Reset Password",
    },
  },
  es: {
    nav: {
      instagram: "Instagram",
      tiktok: "TikTok",
      youtube: "YouTube",
      services: "Servicios",
      api: "API v2",
      cooperation: "Alianzas",
      faq: "FAQ",
      terms: "Términos",
      login: "Entrar",
      register: "Empezar Ahora",
      panel: "Panel",
      admin: "Admin",
    },
    sidebar: {
      availableBalance: "Saldo Disponible",
      addFundsBtn: "+ Añadir Saldo",
      newOrder: "Nuevo Pedido",
      massOrder: "Pedido Masivo",
      subscriptions: "Suscripciones",
      services: "Servicios",
      orders: "Mis Pedidos",
      addFunds: "Añadir Saldo",
      affiliates: "Afiliados",
      childPanel: "Panel Hijo",
      cooperation: "Alianzas",
      tickets: "Tickets",
      updates: "Actualizaciones",
      account: "Cuenta & API",
      adminPanel: "Panel Admin",
      spent: "Gastado",
      logout: "Salir",
      operationalPanel: "Panel Operativo",
      apiDocs: "Docs API",
    },
    hero: {
      badge: "Entrega en Minutos • Sin Contraseña",
      titleLine1: "TU CONTENIDO NO PUEDE",
      titleAccent: "PARECER VACÍO.",
      titleLine2: "",
      subtitleSuffix:
        "Convierte un perfil silencioso en prueba social inmediata. Elige seguidores, likes, vistas y comentarios para Instagram, TikTok y YouTube.",
      minDepositLabel: "Desde",
      ordersProcessedLabel: "Pedidos Entregados",
      activeUsersLabel: "Creadores y Marcas",
      ctaCatalog: "Elegir Mi Paquete",
      ctaApi: "Documentación API v2",
    },
    auth: {
      loginTab: "Entrar",
      registerTab: "Crear Cuenta",
      forgotPassword: "¿Olvidaste tu contraseña?",
      resetTitle: "Restablecer Contraseña",
    },
  },
};

export function getDictionary(locale: AppLocale): UiDictionary {
  return DICTIONARIES[locale] || DICTIONARIES.en;
}
