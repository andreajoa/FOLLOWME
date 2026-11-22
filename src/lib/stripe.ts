import crypto from "crypto";

const STRIPE_API_BASE = "https://api.stripe.com/v1";

export type StripeCheckoutMethod = "PIX" | "CARD" | "BOTH";

export interface StripeSessionObject {
  id: string;
  url?: string | null;
  status?: string | null;
  payment_status?: string | null;
  payment_intent?: string | null;
  amount_total?: number | null;
  currency?: string | null;
  client_reference_id?: string | null;
  metadata?: Record<string, string> | null;
  payment_method_types?: string[];
}

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: StripeSessionObject & Record<string, unknown>;
  };
}

export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY?.trim() || "";
  return key.startsWith("sk_live_") || key.startsWith("sk_test_");
}

function getStripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("Stripe não está configurado no servidor (STRIPE_SECRET_KEY ausente).");
  }
  return key;
}

function encodeStripeForm(params: Record<string, string | number | boolean | undefined>): string {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") {
      body.append(k, String(v));
    }
  }
  return body.toString();
}

export async function stripeApiRequest<T>(
  path: string,
  options: {
    method?: "GET" | "POST";
    params?: Record<string, string | number | boolean | undefined>;
    idempotencyKey?: string;
  } = {}
): Promise<T> {
  const method = options.method || "GET";
  const headers: Record<string, string> = {
    Authorization: `Bearer ${getStripeSecretKey()}`,
  };
  if (options.idempotencyKey) {
    headers["Idempotency-Key"] = options.idempotencyKey;
  }

  let body: string | undefined;
  if (method === "POST" && options.params) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    body = encodeStripeForm(options.params);
  }

  const res = await fetch(`${STRIPE_API_BASE}${path}`, {
    method,
    headers,
    body,
    signal: AbortSignal.timeout(15000),
  });

  const data = (await res.json().catch(() => ({}))) as T & {
    error?: { message?: string; code?: string };
  };

  if (!res.ok) {
    const msg = data?.error?.message || `Stripe API error (HTTP ${res.status})`;
    throw new Error(msg);
  }

  return data;
}

export interface CreateStripeDepositInput {
  amountBrl?: number;
  amount?: number;
  currency?: "BRL" | "USD" | "EUR";
  method: StripeCheckoutMethod;
  depositId: string;
  txid: string;
  userId: string;
  userEmail: string;
  brandName: string;
  origin: string;
}

export function buildStripeCheckoutParams(
  input: CreateStripeDepositInput
): Record<string, string | number | boolean | undefined> {
  const currency = (input.currency || "BRL").toUpperCase() as "BRL" | "USD" | "EUR";
  const rawAmount = input.amount ?? input.amountBrl ?? 0;
  const unitAmount = Math.round(rawAmount * 100);
  const pmcPix = process.env.STRIPE_PMC_PIX?.trim();
  const isBrl = currency === "BRL";

  const label = isBrl
    ? input.method === "PIX"
      ? `Recarga de Saldo via Pix — ${input.brandName}`
      : input.method === "CARD"
        ? `Recarga de Saldo via Cartão — ${input.brandName}`
        : `Recarga de Saldo — ${input.brandName}`
    : `Account Balance Top-Up — ${input.brandName}`;

  const description = isBrl
    ? `Crédito instantâneo na conta ${input.brandName} (${input.txid})`
    : `Instant balance credit for ${input.brandName} (${input.txid})`;

  const params: Record<string, string | number | boolean | undefined> = {
    mode: "payment",
    currency: currency.toLowerCase(),
    locale: isBrl ? "pt-BR" : "en",
    client_reference_id: input.depositId,
    customer_email: input.userEmail,
    success_url: `${input.origin}/painel/saldo?stripe=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${input.origin}/painel/saldo?stripe=canceled&deposit=${encodeURIComponent(input.depositId)}`,
    "line_items[0][quantity]": 1,
    "line_items[0][price_data][currency]": currency.toLowerCase(),
    "line_items[0][price_data][unit_amount]": unitAmount,
    "line_items[0][price_data][product_data][name]": label,
    "line_items[0][price_data][product_data][description]": description,
    "metadata[app]": "followme",
    "metadata[depositId]": input.depositId,
    "metadata[userId]": input.userId,
    "metadata[txid]": input.txid,
    "metadata[method]": isBrl ? input.method : "CARD",
    "metadata[currency]": currency,
  };

  if (!isBrl) {
    params["payment_method_types[0]"] = "card";
  } else if (input.method === "PIX") {
    params["payment_method_types[0]"] = "pix";
    params["payment_method_options[pix][expires_after_seconds]"] = 1800;
  } else if (input.method === "CARD") {
    params["payment_method_types[0]"] = "card";
  } else if (pmcPix) {
    params["payment_method_configuration"] = pmcPix;
    params["payment_method_options[pix][expires_after_seconds]"] = 1800;
  } else {
    params["payment_method_types[0]"] = "card";
    params["payment_method_types[1]"] = "pix";
    params["payment_method_options[pix][expires_after_seconds]"] = 1800;
  }

  return params;
}

export async function createStripeDepositCheckout(
  input: CreateStripeDepositInput
): Promise<StripeSessionObject> {
  const params = buildStripeCheckoutParams(input);
  return stripeApiRequest<StripeSessionObject>("/checkout/sessions", {
    method: "POST",
    params,
    idempotencyKey: `followme_dep_${input.depositId}`,
  });
}

export async function retrieveStripeCheckoutSession(
  sessionId: string
): Promise<StripeSessionObject> {
  return stripeApiRequest<StripeSessionObject>(
    `/checkout/sessions/${encodeURIComponent(sessionId)}`,
    { method: "GET" }
  );
}

export function verifyStripeWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  webhookSecret: string,
  toleranceSeconds = 300
): boolean {
  if (!signatureHeader || !webhookSecret) return false;

  const parts = signatureHeader.split(",").map((p) => p.trim());
  let timestamp = "";
  const signatures: string[] = [];

  for (const part of parts) {
    const [k, v] = part.split("=", 2);
    if (k === "t" && v) timestamp = v;
    if (k === "v1" && v) signatures.push(v);
  }

  if (!timestamp || signatures.length === 0) return false;

  const tsNum = Number.parseInt(timestamp, 10);
  if (!Number.isFinite(tsNum)) return false;

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - tsNum) > toleranceSeconds) return false;

  const signedPayload = `${timestamp}.${rawBody}`;
  const expectedHex = crypto
    .createHmac("sha256", webhookSecret)
    .update(signedPayload, "utf8")
    .digest("hex");

  const expectedBuf = Buffer.from(expectedHex, "utf8");
  for (const sig of signatures) {
    const sigBuf = Buffer.from(sig, "utf8");
    if (
      sigBuf.length === expectedBuf.length &&
      crypto.timingSafeEqual(sigBuf, expectedBuf)
    ) {
      return true;
    }
  }
  return false;
}
