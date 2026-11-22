export type AppLocale = "pt" | "en" | "es";
export type AppCurrency = "BRL" | "USD" | "EUR";

export const LOCALE_COOKIE = "fm_locale";
export const CURRENCY_COOKIE = "fm_currency";

export const SUPPORTED_LOCALES: Array<{ code: AppLocale; label: string; short: string }> = [
  { code: "pt", label: "Português (BR)", short: "PT" },
  { code: "en", label: "English", short: "EN" },
  { code: "es", label: "Español", short: "ES" },
];

export const SUPPORTED_CURRENCIES: Array<{ code: AppCurrency; symbol: string }> = [
  { code: "BRL", symbol: "R$" },
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
];

export function normalizeLocale(input?: string | null): AppLocale {
  const lower = (input || "").toLowerCase();
  if (lower.startsWith("en")) return "en";
  if (lower.startsWith("es")) return "es";
  return "pt";
}

export function normalizeCurrency(input?: string | null): AppCurrency {
  const upper = (input || "").toUpperCase();
  if (upper === "USD") return "USD";
  if (upper === "EUR") return "EUR";
  return "BRL";
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
  const digits = showMicro && Math.abs(converted) > 0 && Math.abs(converted) < 0.1 ? 4 : 2;
  const intlLocale = currency === "BRL" ? "pt-BR" : currency === "EUR" ? "es-ES" : "en-US";
  return new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(converted);
}

export interface UiDictionary {
  nav: {
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
      services: "Serviços",
      api: "API v2",
      cooperation: "Parcerias",
      faq: "FAQ",
      terms: "Termos",
      login: "Entrar",
      register: "Criar Conta",
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
      badge: "Painel SMM Direto da Fonte",
      titleLine1: "ESCALA SOCIAL EM",
      titleAccent: "TEMPO REAL",
      titleLine2: "PARA AGÊNCIAS E REVENDEDORES.",
      subtitleSuffix:
        "Recarregue via Pix ou Cartão pela Stripe com crédito automático 24h, controle assinaturas, painel filho e revenda via API v2.",
      minDepositLabel: "Recarga Mín.",
      ordersProcessedLabel: "Pedidos Processados",
      activeUsersLabel: "Contas Ativas",
      ctaCatalog: "Ver Catálogo Completo",
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
      services: "Services",
      api: "API v2",
      cooperation: "Cooperation",
      faq: "FAQ",
      terms: "Terms",
      login: "Sign in",
      register: "Sign up",
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
      cooperation: "Cooperation",
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
      badge: "Direct Source SMM Panel",
      titleLine1: "REAL-TIME SOCIAL",
      titleAccent: "GROWTH ENGINE",
      titleLine2: "FOR AGENCIES & RESELLERS.",
      subtitleSuffix:
        "Top up instantly via Stripe Card or Pix 24/7, automate drip-feed & subscriptions, launch your own Child Panel, and resell via API v2.",
      minDepositLabel: "Min. Deposit",
      ordersProcessedLabel: "Orders Processed",
      activeUsersLabel: "Active Accounts",
      ctaCatalog: "Explore Full Catalog",
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
      services: "Servicios",
      api: "API v2",
      cooperation: "Alianzas",
      faq: "FAQ",
      terms: "Términos",
      login: "Entrar",
      register: "Registrarse",
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
      badge: "Panel SMM Directo de la Fuente",
      titleLine1: "ESCALA SOCIAL EN",
      titleAccent: "TIEMPO REAL",
      titleLine2: "PARA AGENCIAS Y REVENDEDORES.",
      subtitleSuffix:
        "Recarga al instante con Tarjeta o Pix vía Stripe 24/7, automatiza suscripciones, crea tu Panel Hijo y revende con API v2.",
      minDepositLabel: "Recarga Mín.",
      ordersProcessedLabel: "Pedidos Procesados",
      activeUsersLabel: "Cuentas Activas",
      ctaCatalog: "Ver Catálogo Completo",
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
  return DICTIONARIES[locale] || DICTIONARIES.pt;
}
