import { describe, it, expect } from "vitest";
import {
  applyMarkup,
  calculateOrderTotals,
  parseMassOrderText,
} from "@/lib/pricing";
import { buildPixBrCode, computeCrc16Ccitt } from "@/lib/pix";
import { signSessionToken, verifySessionToken } from "@/lib/auth";
import { normalizeExternalStatus, toExternalSmmStatus } from "@/lib/smm-provider";

describe("VeloSMM Core Engine", () => {
  it("calculates normal and drip-feed order totals accurately", () => {
    const simple = calculateOrderTotals({
      rate: 24.9,
      providerRate: 16.5,
      quantity: 500,
    });
    expect(simple.totalQuantity).toBe(500);
    expect(simple.charge).toBe(12.45);
    expect(simple.cost).toBe(8.25);
    expect(simple.profit).toBe(4.2);

    const drip = calculateOrderTotals({
      rate: 10,
      providerRate: 6,
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
    const res = applyMarkup(2.0, 5.5, 40);
    expect(res.convertedCost).toBe(11);
    expect(res.sellRate).toBe(15.4);
  });

  it("parses mass order lines with valid and invalid entries", () => {
    const input = [
      "1 | https://instagram.com/user1 | 500",
      "2;https://tiktok.com/@creator;1000",
      "invalid line here",
      "3 | https://youtube.com/watch?v=abc | -50",
    ].join("\n");

    const parsed = parseMassOrderText(input);
    expect(parsed.valid).toHaveLength(2);
    expect(parsed.valid[0]).toEqual({
      lineNumber: 1,
      serviceId: 1,
      link: "https://instagram.com/user1",
      quantity: 500,
    });
    expect(parsed.errors).toHaveLength(2);
  });

  it("generates a valid EMV Pix BR Code with CRC16-CCITT checksum", () => {
    const code = buildPixBrCode({
      pixKey: "pix@velosmm.com.br",
      merchantName: "VELOSMM DIGITAL",
      merchantCity: "SAO PAULO",
      amount: 50.0,
      txid: "VSMM20261119TEST01",
    });

    expect(code.startsWith("000201")).toBe(true);
    expect(code).toContain("br.gov.bcb.pix");
    expect(code).toContain("540550.00");
    const body = code.slice(0, -4);
    const crc = code.slice(-4);
    expect(computeCrc16Ccitt(body)).toBe(crc);
  });

  it("signs and verifies HMAC session tokens and rejects tampering", () => {
    const token = signSessionToken("user_123", "ADMIN");
    const verified = verifySessionToken(token);
    expect(verified?.uid).toBe("user_123");
    expect(verified?.role).toBe("ADMIN");

    const tampered = `${token.slice(0, -3)}xxx`;
    expect(verifySessionToken(tampered)).toBeNull();
  });

  it("normalizes and converts SMM provider order statuses", () => {
    expect(normalizeExternalStatus("In progress")).toBe("IN_PROGRESS");
    expect(normalizeExternalStatus("Completed")).toBe("COMPLETED");
    expect(normalizeExternalStatus("Cancelled")).toBe("CANCELED");
    expect(toExternalSmmStatus("IN_PROGRESS")).toBe("In progress");
    expect(toExternalSmmStatus("COMPLETED")).toBe("Completed");
  });
});
