import type { AppCurrency, AppLocale } from "./i18n";

/**
 * Brazil Black Friday deadline: Dec 15, 2026 at 00:00 America/Sao_Paulo (UTC-3).
 * Promotional prices apply through Dec 14, 2026 23:59:59 BRT.
 */
export const BLACK_FRIDAY_ENDS_AT_ISO = "2026-12-15T03:00:00.000Z";
export const BLACK_FRIDAY_REGULAR_MULTIPLIER = 2;

/**
 * Profitable Brazil Black Friday BRL rates per 1,000 units.
 * Every rate is strictly above verified Brazilian wholesale (FonteSMM / TopFama)
 * with at least 20%+ margin even during Black Friday, and doubles cleanly on Dec 15 00:00 BRT.
 */
export const PROFITABLE_BLACK_FRIDAY_BRL_RATES: Record<
  string,
  { rate: number; providerRate: number }
> = {
  "1091": { rate: 14.9, providerRate: 8.5 },
  "1092": { rate: 69.9, providerRate: 42.6 },
  "1093": { rate: 22.0, providerRate: 12.5 },
  "1094": { rate: 39.9, providerRate: 23.0 },
  "1001": { rate: 24.9, providerRate: 16.5 },
  "1002": { rate: 36.9, providerRate: 24.0 },
  "1003": { rate: 16.5, providerRate: 10.8 },
  "1010": { rate: 9.8, providerRate: 6.1 },
  "1011": { rate: 6.9, providerRate: 4.2 },
  "1020": { rate: 9.9, providerRate: 6.0 },
  "1021": { rate: 1.4, providerRate: 0.75 },
  "1022": { rate: 6.9, providerRate: 4.2 },
  "1023": { rate: 5.5, providerRate: 3.1 },
  "1030": { rate: 159.9, providerRate: 118.25 },
  "1031": { rate: 149.9, providerRate: 118.25 },
  "2001": { rate: 24.9, providerRate: 14.5 },
  "2002": { rate: 1.9, providerRate: 1.2 },
  "2003": { rate: 7.9, providerRate: 4.88 },
  "2004": { rate: 69.9, providerRate: 49.98 },
  "3001": { rate: 189.9, providerRate: 132.22 },
  "3002": { rate: 14.9, providerRate: 9.24 },
  "3003": { rate: 199.9, providerRate: 153.24 },
  "3004": { rate: 19.9, providerRate: 12.0 },
  "4001": { rate: 14.9, providerRate: 7.15 },
  "4002": { rate: 11.9, providerRate: 5.4 },
  "5001": { rate: 19.9, providerRate: 6.3 },
  "5002": { rate: 11.5, providerRate: 5.2 },
  "5003": { rate: 29.9, providerRate: 19.0 },
  "5004": { rate: 14.9, providerRate: 8.5 },
};

export interface BlackFridayConfig {
  enabled: boolean;
  endsAt: string;
  finalizedAt: string | null;
}

export const DEFAULT_BLACK_FRIDAY_CONFIG: BlackFridayConfig = {
  enabled: true,
  endsAt: BLACK_FRIDAY_ENDS_AT_ISO,
  finalizedAt: null,
};

export function roundCurrency(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

export function toBlackFridayConfig(
  settings?: {
    blackFridayEnabled?: boolean | null;
    blackFridayEndsAt?: Date | string | null;
    blackFridayFinalizedAt?: Date | string | null;
  } | null
): BlackFridayConfig {
  if (!settings) {
    return DEFAULT_BLACK_FRIDAY_CONFIG;
  }
  const endsAt =
    settings.blackFridayEndsAt instanceof Date
      ? settings.blackFridayEndsAt.toISOString()
      : typeof settings.blackFridayEndsAt === "string" && settings.blackFridayEndsAt
        ? settings.blackFridayEndsAt
        : BLACK_FRIDAY_ENDS_AT_ISO;

  const finalizedAt =
    settings.blackFridayFinalizedAt instanceof Date
      ? settings.blackFridayFinalizedAt.toISOString()
      : typeof settings.blackFridayFinalizedAt === "string" &&
          settings.blackFridayFinalizedAt
        ? settings.blackFridayFinalizedAt
        : null;

  return {
    enabled: settings.blackFridayEnabled ?? true,
    endsAt,
    finalizedAt,
  };
}

export function isBlackFridayEndedByTime(
  config: BlackFridayConfig,
  now: Date = new Date()
): boolean {
  const endMs = new Date(config.endsAt).getTime();
  if (!Number.isFinite(endMs)) return false;
  return now.getTime() >= endMs;
}

/**
 * Black Friday promo is strictly Brazil-only (Portuguese + BRL)
 * and automatically deactivates on Dec 15, 2026 00:00 BRT.
 */
export function isBrazilBlackFridayActive(
  config: BlackFridayConfig,
  locale: AppLocale,
  currency: AppCurrency,
  now: Date = new Date()
): boolean {
  if (locale !== "pt" || currency !== "BRL") {
    return false;
  }
  if (!config.enabled || config.finalizedAt) {
    return false;
  }
  return !isBlackFridayEndedByTime(config, now);
}

/**
 * Returns the authoritative BRL rate for a service.
 * Fail-safe: if Dec 15 00:00 BRT has already passed before the cron persists
 * the 2x update in PostgreSQL, this immediately returns 2x so expired promo
 * rates are never billed. Once finalizedAt is set, DB already stores the 2x
 * regular rate, so this returns rawRate untouched (never doubles twice).
 */
export function getEffectiveBrlRate(
  rawRate: number,
  config: BlackFridayConfig,
  now: Date = new Date()
): number {
  const safe = Number.isFinite(rawRate) ? rawRate : 0;
  if (config.enabled && !config.finalizedAt && isBlackFridayEndedByTime(config, now)) {
    return roundCurrency(safe * BLACK_FRIDAY_REGULAR_MULTIPLIER);
  }
  return safe;
}

export function getBlackFridayPricePair(
  currentPrice: number,
  blackFridayActive: boolean
): {
  currentPrice: number;
  compareAtPrice: number | null;
  isBlackFriday: boolean;
} {
  const safe = Number.isFinite(currentPrice) ? currentPrice : 0;
  if (!blackFridayActive) {
    return {
      currentPrice: safe,
      compareAtPrice: null,
      isBlackFriday: false,
    };
  }
  return {
    currentPrice: safe,
    compareAtPrice: roundCurrency(safe * BLACK_FRIDAY_REGULAR_MULTIPLIER),
    isBlackFriday: true,
  };
}
