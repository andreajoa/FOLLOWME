import { describe, expect, it } from "vitest";
import crypto from "crypto";
import {
  applyMarkup,
  calculateOrderTotals,
  parseMassOrderText,
} from "../src/lib/pricing";
import { buildPixBrCode, computeCrc16Ccitt } from "../src/lib/pix";
import { isAdminEmail, signSessionToken, verifySessionToken } from "../src/lib/auth";
import {
  normalizeExternalStatus,
  toExternalSmmStatus,
} from "../src/lib/smm-provider";
import {
  buildStripeCheckoutParams,
  verifyStripeWebhookSignature,
} from "../src/lib/stripe";
import {
  convertFromBrl,
  detectPreferencesFromAcceptLanguage,
  formatMoney,
  getDictionary,
  getServiceMarketRate,
  normalizeCurrency,
  normalizeLocale,
} from "../src/lib/i18n";
import {
  BLACK_FRIDAY_ENDS_AT_ISO,
  DEFAULT_BLACK_FRIDAY_CONFIG,
  PROFITABLE_BLACK_FRIDAY_BRL_RATES,
  getBlackFridayPricePair,
  getEffectiveBrlRate,
  isBrazilBlackFridayActive,
} from "../src/lib/black-friday";
import {
  buildDispatchCandidates,
  executeDispatchWithFailover,
} from "../src/lib/failover";
import {
  buildEmptyBrtBuckets,
  detectDeviceType,
  getBrtBucketKey,
  getBrtWindowBoundaries,
  isLikelyBotUserAgent,
} from "../src/lib/analytics";
import { extractProfileHandle } from "../src/lib/owner-alerts";

describe("FollowMe Core Engine", () => {
  it("calculates normal and drip-feed order totals accurately", () => {
    const standard = calculateOrderTotals({
      rate: 25.0,
      providerRate: 15.0,
      quantity: 500,
    });
    expect(standard.totalQuantity).toBe(500);
    expect(standard.charge).toBe(12.5);
    expect(standard.cost).toBe(7.5);
    expect(standard.profit).toBe(5);

    const drip = calculateOrderTotals({
      rate: 10.0,
      providerRate: 6.0,
      quantity: 200,
      dripfeed: true,
      runs: 5,
    });
    expect(drip.totalQuantity).toBe(1000);
    expect(drip.charge).toBe(10);
    expect(drip.cost).toBe(6);
    expect(drip.profit).toBe(4);
  });

  it("applies provider currency conversion and markup percentage", () => {
    const { convertedCost, sellRate } = applyMarkup(2.0, 5.5, 40);
    expect(convertedCost).toBe(11);
    expect(sellRate).toBe(15.4);
  });

  it("parses mass order lines with valid and invalid entries", () => {
    const sample = `
      1 | https://instagram.com/perfil1 | 500
      3; https://instagram.com/p/abc; 1000
      invalid_line
      2 | https://tiktok.com/@user | -50
    `;
    const result = parseMassOrderText(sample);
    expect(result.valid).toHaveLength(2);
    expect(result.valid[0]).toMatchObject({
      serviceId: 1,
      link: "https://instagram.com/perfil1",
      quantity: 500,
    });
    expect(result.valid[1]).toMatchObject({
      serviceId: 3,
      quantity: 1000,
    });
    expect(result.errors).toHaveLength(2);
  });

  it("generates a valid EMV Pix BR Code with CRC16-CCITT checksum", () => {
    const payload = buildPixBrCode({
      pixKey: "pix@followme.nexaclouds.online",
      merchantName: "FOLLOWME DIGITAL",
      merchantCity: "SAO PAULO",
      amount: 50.0,
      txid: "FLWM20261122TEST01",
    });

    expect(payload.startsWith("000201")).toBe(true);
    expect(payload).toContain("br.gov.bcb.pix");
    expect(payload).toContain("540550.00");

    const bodyWithoutCrc = payload.slice(0, -4);
    const actualCrc = payload.slice(-4);
    expect(actualCrc).toBe(computeCrc16Ccitt(bodyWithoutCrc));
  });

  it("builds Stripe Checkout params for PIX, CARD, and BOTH modes", () => {
    const base = {
      amountBrl: 50,
      depositId: "dep_123",
      txid: "FLWM123456",
      userId: "usr_1",
      userEmail: "cliente@followme.app",
      brandName: "FollowMe",
      origin: "https://followme.nexaclouds.online",
    };

    const pixParams = buildStripeCheckoutParams({ ...base, method: "PIX" });
    expect(pixParams["payment_method_types[0]"]).toBe("pix");
    expect(pixParams["line_items[0][price_data][unit_amount]"]).toBe(5000);
    expect(pixParams["metadata[app]"]).toBe("followme");

    const cardParams = buildStripeCheckoutParams({ ...base, method: "CARD" });
    expect(cardParams["payment_method_types[0]"]).toBe("card");
    expect(cardParams["payment_method_types[1]"]).toBeUndefined();

    const usdParams = buildStripeCheckoutParams({
      ...base,
      amount: 14.99,
      currency: "USD",
      method: "CARD",
    });
    expect(usdParams.currency).toBe("usd");
    expect(usdParams.locale).toBe("en");
    expect(usdParams["line_items[0][price_data][unit_amount]"]).toBe(1499);
    expect(usdParams["payment_method_types[0]"]).toBe("card");
  });

  it("verifies valid Stripe webhook signatures and rejects tampered/expired ones", () => {
    const secret = "whsec_test_secret_followme_1234567890";
    const body = JSON.stringify({ id: "evt_1", type: "checkout.session.completed" });
    const now = Math.floor(Date.now() / 1000);
    const sig = crypto
      .createHmac("sha256", secret)
      .update(`${now}.${body}`, "utf8")
      .digest("hex");

    expect(verifyStripeWebhookSignature(body, `t=${now},v1=${sig}`, secret)).toBe(true);
    expect(verifyStripeWebhookSignature(body + "x", `t=${now},v1=${sig}`, secret)).toBe(false);

    const oldTs = now - 600;
    const oldSig = crypto
      .createHmac("sha256", secret)
      .update(`${oldTs}.${body}`, "utf8")
      .digest("hex");
    expect(verifyStripeWebhookSignature(body, `t=${oldTs},v1=${oldSig}`, secret)).toBe(false);
  });

  it("signs and verifies HMAC session tokens and rejects tampering", () => {
    const token = signSessionToken("user_123", "ADMIN");
    const verified = verifySessionToken(token);
    expect(verified?.uid).toBe("user_123");
    expect(verified?.role).toBe("ADMIN");

    const tampered = `${token.slice(0, -2)}xx`;
    expect(verifySessionToken(tampered)).toBeNull();
  });

  it("matches configured ADMIN_EMAILS case-insensitively", () => {
    const prev = process.env.ADMIN_EMAILS;
    process.env.ADMIN_EMAILS = "contact@andre-almieda.online, andrealmeidaca23@gmail.com";
    expect(isAdminEmail("CONTACT@andre-almieda.online")).toBe(true);
    expect(isAdminEmail("andrealmeidaca23@gmail.com")).toBe(true);
    expect(isAdminEmail("cliente@externo.com")).toBe(false);
    process.env.ADMIN_EMAILS = prev;
  });

  it("normalizes and converts SMM provider order statuses", () => {
    expect(normalizeExternalStatus("In progress")).toBe("IN_PROGRESS");
    expect(normalizeExternalStatus("Completed")).toBe("COMPLETED");
    expect(normalizeExternalStatus("Cancelled")).toBe("CANCELED");
    expect(toExternalSmmStatus("IN_PROGRESS")).toBe("In progress");
    expect(toExternalSmmStatus("PARTIAL")).toBe("Partial");
  });

  it("handles i18n locales, browser auto-detection, and native US vs BR market pricing", () => {
    expect(normalizeLocale("en-US")).toBe("en");
    expect(normalizeLocale("es-ES")).toBe("es");
    expect(normalizeLocale("pt-BR")).toBe("pt");
    expect(normalizeCurrency("usd")).toBe("USD");
    expect(getDictionary("en").sidebar.childPanel).toBe("Child Panel");
    expect(convertFromBrl(55, "USD", { usdRate: 5.5 })).toBeCloseTo(10, 4);
    expect(formatMoney(55, "USD", { usdRate: 5.5 })).toContain("10.00");

    // Browser Accept-Language auto-detection
    expect(detectPreferencesFromAcceptLanguage("en-US,en;q=0.9")).toEqual({
      locale: "en",
      currency: "USD",
    });
    expect(detectPreferencesFromAcceptLanguage("pt-BR,pt;q=0.9,en-US;q=0.8")).toEqual({
      locale: "pt",
      currency: "BRL",
    });
    expect(detectPreferencesFromAcceptLanguage("es-MX,es;q=0.9")).toEqual({
      locale: "es",
      currency: "USD",
    });

    // Native US pricing uses rateUsd directly (NOT BRL FX division)
    const sampleService = { rate: 19.9, rateUsd: 14.99, network: "instagram", metricType: "followers" };
    expect(getServiceMarketRate(sampleService, "BRL")).toBe(19.9);
    expect(getServiceMarketRate(sampleService, "USD")).toBe(14.99);
  });

  it("enforces Brazil-only Black Friday pricing with automatic 2x switch on Dec 15 00:00 BRT", () => {
    const duringBf = new Date("2026-12-14T23:59:59-03:00");
    const exactCutoff = new Date("2026-12-15T00:00:00-03:00");
    expect(exactCutoff.toISOString()).toBe(BLACK_FRIDAY_ENDS_AT_ISO);

    // Strictly Brazil-only (PT + BRL) while active
    expect(isBrazilBlackFridayActive(DEFAULT_BLACK_FRIDAY_CONFIG, "pt", "BRL", duringBf)).toBe(true);
    expect(isBrazilBlackFridayActive(DEFAULT_BLACK_FRIDAY_CONFIG, "en", "USD", duringBf)).toBe(false);
    expect(isBrazilBlackFridayActive(DEFAULT_BLACK_FRIDAY_CONFIG, "es", "EUR", duringBf)).toBe(false);
    expect(isBrazilBlackFridayActive(DEFAULT_BLACK_FRIDAY_CONFIG, "pt", "USD", duringBf)).toBe(false);
    expect(isBrazilBlackFridayActive(DEFAULT_BLACK_FRIDAY_CONFIG, "en", "BRL", duringBf)).toBe(false);

    // Automatically turns off at Dec 15 00:00 BRT
    expect(isBrazilBlackFridayActive(DEFAULT_BLACK_FRIDAY_CONFIG, "pt", "BRL", exactCutoff)).toBe(false);

    // Strikethrough compare-at price is exact 2x during Black Friday, null when inactive
    expect(getBlackFridayPricePair(24.9, true)).toEqual({
      currentPrice: 24.9,
      compareAtPrice: 49.8,
      isBlackFriday: true,
    });
    expect(getBlackFridayPricePair(49.8, false)).toEqual({
      currentPrice: 49.8,
      compareAtPrice: null,
      isBlackFriday: false,
    });

    // Fail-safe BRL pricing: before Dec 15 = BF rate; at Dec 15 before cron = 2x; after cron finalized = stored rate (no double-doubling!)
    expect(getEffectiveBrlRate(24.9, DEFAULT_BLACK_FRIDAY_CONFIG, duringBf)).toBe(24.9);
    expect(getEffectiveBrlRate(24.9, DEFAULT_BLACK_FRIDAY_CONFIG, exactCutoff)).toBe(49.8);
    const finalizedConfig = {
      enabled: false,
      endsAt: BLACK_FRIDAY_ENDS_AT_ISO,
      finalizedAt: exactCutoff.toISOString(),
    };
    expect(getEffectiveBrlRate(49.8, finalizedConfig, exactCutoff)).toBe(49.8);
    expect(isBrazilBlackFridayActive(finalizedConfig, "pt", "BRL", duringBf)).toBe(false);
  });

  it("keeps every Brazil Black Friday BRL rate strictly above wholesale cost", () => {
    const entries = Object.entries(PROFITABLE_BLACK_FRIDAY_BRL_RATES);
    expect(entries.length).toBe(29);
    for (const [id, pricing] of entries) {
      expect(pricing.rate, `Service ${id} must be priced above wholesale`).toBeGreaterThan(
        pricing.providerRate * 1.2
      );
    }
  });

  it("executes multi-provider failover in priority order and records full trace", async () => {
    const primary = {
      id: "prov_a",
      name: "Provedor A",
      apiUrl: "https://a.example/api/v2",
      apiKey: "key_a",
      mode: "LIVE",
    };
    const backup1 = {
      id: "prov_b",
      name: "Provedor B",
      apiUrl: "https://b.example/api/v2",
      apiKey: "key_b",
      mode: "LIVE",
    };
    const backup2 = {
      id: "prov_c",
      name: "Provedor C",
      apiUrl: "https://c.example/api/v2",
      apiKey: "key_c",
      mode: "LIVE",
    };

    const candidates = buildDispatchCandidates({
      primary: { provider: primary, providerServiceId: "101" },
      explicitFallbacks: [
        { provider: backup2, providerServiceId: "303", priority: 2, isActive: true },
        { provider: backup1, providerServiceId: "202", priority: 1, isActive: true },
        // Duplicate should be deduplicated
        { provider: primary, providerServiceId: "101", priority: 3, isActive: true },
      ],
    });

    expect(candidates.map((c) => c.provider.id)).toEqual(["prov_a", "prov_b", "prov_c"]);

    // Primary fails -> Backup 1 succeeds with failoverUsed=true
    const saved = await executeDispatchWithFailover(
      candidates,
      { link: "https://instagram.com/cliente_teste", quantity: 1000 },
      async (provider, params) => {
        if (provider.id === "prov_a") {
          throw new Error("Insufficient balance on Provedor A");
        }
        return { providerOrderId: `OK-${provider.id}-${params.providerServiceId}` };
      }
    );

    expect(saved.ok).toBe(true);
    expect(saved.failoverUsed).toBe(true);
    expect(saved.providerId).toBe("prov_b");
    expect(saved.providerOrderId).toBe("OK-prov_b-202");
    expect(saved.attempts).toHaveLength(2);
    expect(saved.attempts[0].ok).toBe(false);
    expect(saved.attempts[1].ok).toBe(true);

    // All providers fail -> returns ok=false with complete trace
    const allFailed = await executeDispatchWithFailover(
      candidates,
      { link: "https://instagram.com/cliente_teste", quantity: 1000 },
      async (provider) => {
        throw new Error(`Timeout ${provider.name}`);
      }
    );
    expect(allFailed.ok).toBe(false);
    expect(allFailed.attempts).toHaveLength(3);
    expect(allFailed.lastError).toContain("Provedor C");
  });

  it("computes BRT analytics windows, buckets, bot filtering, and profile handles", () => {
    const sampleDate = new Date("2026-11-26T18:30:00.000Z"); // 15:30 BRT
    const bounds = getBrtWindowBoundaries(sampleDate);
    expect(bounds.dayStart.toISOString()).toBe("2026-11-26T03:00:00.000Z");
    expect(bounds.monthStart.toISOString()).toBe("2026-11-01T03:00:00.000Z");
    expect(bounds.yearStart.toISOString()).toBe("2026-01-01T03:00:00.000Z");

    expect(getBrtBucketKey(sampleDate, "day")).toBe("15h");
    expect(getBrtBucketKey(sampleDate, "month")).toBe("26/11");
    expect(getBrtBucketKey(sampleDate, "year")).toBe("Nov");
    expect(buildEmptyBrtBuckets("day", sampleDate)).toHaveLength(24);
    expect(buildEmptyBrtBuckets("month", sampleDate)).toHaveLength(30);
    expect(buildEmptyBrtBuckets("year", sampleDate)).toHaveLength(12);

    expect(isLikelyBotUserAgent("Googlebot/2.1")).toBe(true);
    expect(isLikelyBotUserAgent("curl/8.4.0")).toBe(true);
    expect(
      isLikelyBotUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148"
      )
    ).toBe(false);
    expect(
      detectDeviceType(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148"
      )
    ).toBe("mobile");
    expect(detectDeviceType("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")).toBe(
      "desktop"
    );

    expect(extractProfileHandle("https://instagram.com/andrealmeida.br/")).toBe(
      "@andrealmeida.br"
    );
    expect(extractProfileHandle("https://www.instagram.com/stories/loja_vip/12345/")).toBe(
      "@loja_vip"
    );
    expect(extractProfileHandle("https://www.tiktok.com/@criador_top/video/999")).toBe(
      "@criador_top"
    );
    expect(extractProfileHandle("@perfil_direto")).toBe("@perfil_direto");
  });
});
