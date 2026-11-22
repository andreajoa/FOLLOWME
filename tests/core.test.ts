import { describe, expect, it } from "vitest";
import crypto from "crypto";
import {
  applyMarkup,
  calculateOrderTotals,
  parseMassOrderText,
} from "../src/lib/pricing";
import { buildPixBrCode, computeCrc16Ccitt } from "../src/lib/pix";
import { signSessionToken, verifySessionToken } from "../src/lib/auth";
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
  formatMoney,
  getDictionary,
  normalizeCurrency,
  normalizeLocale,
} from "../src/lib/i18n";

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

  it("normalizes and converts SMM provider order statuses", () => {
    expect(normalizeExternalStatus("In progress")).toBe("IN_PROGRESS");
    expect(normalizeExternalStatus("Completed")).toBe("COMPLETED");
    expect(normalizeExternalStatus("Cancelled")).toBe("CANCELED");
    expect(toExternalSmmStatus("IN_PROGRESS")).toBe("In progress");
    expect(toExternalSmmStatus("PARTIAL")).toBe("Partial");
  });

  it("handles i18n locales and multi-currency conversion", () => {
    expect(normalizeLocale("en-US")).toBe("en");
    expect(normalizeLocale("es-ES")).toBe("es");
    expect(normalizeLocale("pt-BR")).toBe("pt");
    expect(normalizeCurrency("usd")).toBe("USD");
    expect(getDictionary("en").sidebar.childPanel).toBe("Child Panel");
    expect(convertFromBrl(55, "USD", { usdRate: 5.5 })).toBeCloseTo(10, 4);
    expect(formatMoney(55, "USD", { usdRate: 5.5 })).toContain("10.00");
  });
});
