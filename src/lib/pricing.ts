export function round4(value: number): number {
  return Math.round((value + Number.EPSILON) * 10000) / 10000;
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export interface OrderCalculationInput {
  rate: number;
  providerRate: number;
  quantity: number;
  dripfeed?: boolean;
  runs?: number;
}

export interface OrderCalculationResult {
  totalQuantity: number;
  charge: number;
  cost: number;
  profit: number;
}

export function calculateOrderTotals(
  input: OrderCalculationInput
): OrderCalculationResult {
  const effectiveRuns = input.dripfeed && input.runs && input.runs > 1 ? Math.floor(input.runs) : 1;
  const totalQuantity = Math.floor(input.quantity) * effectiveRuns;
  const charge = round4((totalQuantity / 1000) * input.rate);
  const cost = round4((totalQuantity / 1000) * input.providerRate);
  const profit = round4(charge - cost);
  return { totalQuantity, charge, cost, profit };
}

export function applyMarkup(
  providerRate: number,
  currencyRate: number,
  markupPercent: number
): { convertedCost: number; sellRate: number } {
  const convertedCost = round4(Math.max(0, providerRate) * Math.max(0.01, currencyRate));
  const multiplier = 1 + Math.max(0, markupPercent) / 100;
  const sellRate = round2(Math.max(0.05, convertedCost * multiplier));
  return { convertedCost, sellRate };
}

export interface ParsedMassOrderLine {
  lineNumber: number;
  serviceId: number;
  link: string;
  quantity: number;
}

export interface MassOrderParseResult {
  valid: ParsedMassOrderLine[];
  errors: { lineNumber: number; raw: string; reason: string }[];
}

export function parseMassOrderText(rawText: string): MassOrderParseResult {
  const lines = rawText.split(/\r?\n/);
  const valid: ParsedMassOrderLine[] = [];
  const errors: { lineNumber: number; raw: string; reason: string }[] = [];

  lines.forEach((rawLine, index) => {
    const trimmed = rawLine.trim();
    if (!trimmed) return;
    const lineNumber = index + 1;

    const parts = trimmed.includes("|")
      ? trimmed.split("|").map((p) => p.trim())
      : trimmed.includes(";")
        ? trimmed.split(";").map((p) => p.trim())
        : trimmed.split(/\s+/).map((p) => p.trim());

    if (parts.length < 3) {
      errors.push({
        lineNumber,
        raw: trimmed,
        reason: "Formato inválido. Use: service_id | link | quantidade",
      });
      return;
    }

    const serviceId = Number.parseInt(parts[0], 10);
    const link = parts[1];
    const quantity = Number.parseInt(parts[2], 10);

    if (!Number.isInteger(serviceId) || serviceId <= 0) {
      errors.push({ lineNumber, raw: trimmed, reason: "ID de serviço inválido." });
      return;
    }

    if (!link || link.length < 3) {
      errors.push({ lineNumber, raw: trimmed, reason: "Link ou usuário inválido." });
      return;
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      errors.push({ lineNumber, raw: trimmed, reason: "Quantidade inválida." });
      return;
    }

    valid.push({ lineNumber, serviceId, link, quantity });
  });

  return { valid, errors };
}
