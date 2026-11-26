import { prisma } from "./prisma";
import { getSiteSettings } from "./settings";
import {
  BLACK_FRIDAY_REGULAR_MULTIPLIER,
  BlackFridayConfig,
  getEffectiveBrlRate,
  isBlackFridayEndedByTime,
  roundCurrency,
  toBlackFridayConfig,
} from "./black-friday";

export interface BlackFridayCronResult {
  ok: true;
  action: "still_active" | "finalized" | "already_finalized" | "disabled";
  endsAt: string;
  finalizedAt: string | null;
  updatedServices: number;
  remainingSeconds?: number;
}

export function applyEffectiveBrlPricing<T extends { rate: number }>(
  services: T[],
  config: BlackFridayConfig,
  now: Date = new Date()
): T[] {
  if (!config.enabled || config.finalizedAt || !isBlackFridayEndedByTime(config, now)) {
    return services;
  }
  return services.map((service) => ({
    ...service,
    rate: getEffectiveBrlRate(service.rate, config, now),
  }));
}

/**
 * Idempotently ends Brazil Black Friday at/after Dec 15, 2026 00:00 BRT:
 * - Disables Black Friday promo flags in SiteSetting
 * - Permanently doubles all BRL Service.rate values (2x)
 * - Keeps US USD Service.rateUsd untouched
 * - Guarded by atomic conditional update on blackFridayFinalizedAt IS NULL so
 *   concurrent or repeated cron runs can never double prices more than once.
 */
export async function finalizeBrazilBlackFridayIfDue(
  now: Date = new Date()
): Promise<BlackFridayCronResult> {
  const settings = await getSiteSettings();
  const config = toBlackFridayConfig(settings);

  if (config.finalizedAt) {
    return {
      ok: true,
      action: "already_finalized",
      endsAt: config.endsAt,
      finalizedAt: config.finalizedAt,
      updatedServices: 0,
    };
  }

  if (!config.enabled) {
    return {
      ok: true,
      action: "disabled",
      endsAt: config.endsAt,
      finalizedAt: null,
      updatedServices: 0,
    };
  }

  if (!isBlackFridayEndedByTime(config, now)) {
    const remainingSeconds = Math.max(
      0,
      Math.floor((new Date(config.endsAt).getTime() - now.getTime()) / 1000)
    );
    return {
      ok: true,
      action: "still_active",
      endsAt: config.endsAt,
      finalizedAt: null,
      updatedServices: 0,
      remainingSeconds,
    };
  }

  const outcome = await prisma.$transaction(async (tx) => {
    const claimed = await tx.siteSetting.updateMany({
      where: {
        id: "default",
        blackFridayEnabled: true,
        blackFridayFinalizedAt: null,
      },
      data: {
        blackFridayEnabled: false,
        blackFridayFinalizedAt: now,
      },
    });

    if (claimed.count === 0) {
      return { alreadyFinalized: true, updatedServices: 0 };
    }

    const services = await tx.service.findMany({
      select: { id: true, rate: true },
    });

    for (const service of services) {
      const doubledRate = roundCurrency(
        service.rate * BLACK_FRIDAY_REGULAR_MULTIPLIER
      );
      await tx.service.update({
        where: { id: service.id },
        data: { rate: doubledRate },
      });
    }

    await tx.serviceUpdate.create({
      data: {
        serviceName: "Tabela Brasil (BRL)",
        type: "RATE_UP",
        details:
          "Black Friday Brasil encerrada automaticamente em 15/12 — preços em BRL atualizados para o valor regular (2x). Preços em USD (EUA) mantidos inalterados.",
      },
    });

    return { alreadyFinalized: false, updatedServices: services.length };
  });

  if (outcome.alreadyFinalized) {
    const refreshed = await getSiteSettings();
    const refreshedConfig = toBlackFridayConfig(refreshed);
    return {
      ok: true,
      action: "already_finalized",
      endsAt: refreshedConfig.endsAt,
      finalizedAt: refreshedConfig.finalizedAt,
      updatedServices: 0,
    };
  }

  return {
    ok: true,
    action: "finalized",
    endsAt: config.endsAt,
    finalizedAt: now.toISOString(),
    updatedServices: outcome.updatedServices,
  };
}
