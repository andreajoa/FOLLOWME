import crypto from "crypto";

function formatEmvField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

function sanitizeAscii(input: string, maxLen: number): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 .\-@]/g, "")
    .trim()
    .slice(0, maxLen);
}

export function computeCrc16Ccitt(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export interface PixBrCodeInput {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  amount: number;
  txid: string;
  description?: string;
}

export function buildPixBrCode(input: PixBrCodeInput): string {
  const merchantAccountInfo = [
    formatEmvField("00", "br.gov.bcb.pix"),
    formatEmvField("01", input.pixKey.trim().slice(0, 77)),
    input.description ? formatEmvField("02", sanitizeAscii(input.description, 40)) : "",
  ].join("");

  const cleanName = sanitizeAscii(input.merchantName || "FOLLOWME", 25) || "FOLLOWME";
  const cleanCity = sanitizeAscii(input.merchantCity || "SAO PAULO", 15) || "SAO PAULO";
  const cleanTxid = input.txid.replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "FOLLOWMEPIX";
  const amountStr = input.amount.toFixed(2);

  const additionalData = formatEmvField("05", cleanTxid);

  const withoutCrc = [
    formatEmvField("00", "01"),
    formatEmvField("01", "12"),
    formatEmvField("26", merchantAccountInfo),
    formatEmvField("52", "0000"),
    formatEmvField("53", "986"),
    formatEmvField("54", amountStr),
    formatEmvField("58", "BR"),
    formatEmvField("59", cleanName),
    formatEmvField("60", cleanCity),
    formatEmvField("62", additionalData),
    "6304",
  ].join("");

  const crc = computeCrc16Ccitt(withoutCrc);
  return `${withoutCrc}${crc}`;
}

export function generateTxId(): string {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 12);
  const rand = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `FLWM${stamp}${rand}`.slice(0, 25);
}

export interface PixChargeRequest {
  gateway: string;
  amount: number;
  txid: string;
  payerEmail: string;
  payerName: string;
  pixKey: string;
  merchantName: string;
  merchantCity: string;
}

export interface PixChargeResult {
  gatewayUsed: string;
  pixCode: string;
  externalId: string;
  note: string;
}

export async function createPixCharge(req: PixChargeRequest): Promise<PixChargeResult> {
  const gw = (req.gateway || "SANDBOX").toUpperCase();

  if (gw === "MERCADOPAGO" && process.env.MERCADOPAGO_ACCESS_TOKEN) {
    const res = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": req.txid,
      },
      body: JSON.stringify({
        transaction_amount: Number(req.amount.toFixed(2)),
        description: `Recarga saldo ${req.merchantName} (${req.txid})`,
        payment_method_id: "pix",
        external_reference: req.txid,
        payer: {
          email: req.payerEmail,
          first_name: req.payerName.split(" ")[0] || "Cliente",
        },
      }),
      signal: AbortSignal.timeout(12000),
    });

    if (res.ok) {
      const json = (await res.json()) as {
        id?: number | string;
        point_of_interaction?: {
          transaction_data?: { qr_code?: string };
        };
      };
      const qr = json.point_of_interaction?.transaction_data?.qr_code;
      if (qr) {
        return {
          gatewayUsed: "MERCADOPAGO",
          pixCode: qr,
          externalId: String(json.id ?? req.txid),
          note: "Cobrança Pix gerada via Mercado Pago API",
        };
      }
    }
  }

  if (gw === "ASAAS" && process.env.ASAAS_API_KEY) {
    const baseUrl =
      process.env.ASAAS_ENVIRONMENT === "production"
        ? "https://api.asaas.com/v3"
        : "https://sandbox.asaas.com/api/v3";

    const res = await fetch(`${baseUrl}/pix/qrCodes/static`, {
      method: "POST",
      headers: {
        access_token: process.env.ASAAS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        addressKey: req.pixKey,
        description: `Recarga ${req.txid}`,
        value: Number(req.amount.toFixed(2)),
        externalReference: req.txid,
      }),
      signal: AbortSignal.timeout(12000),
    });

    if (res.ok) {
      const json = (await res.json()) as { id?: string; payload?: string };
      if (json.payload) {
        return {
          gatewayUsed: "ASAAS",
          pixCode: json.payload,
          externalId: String(json.id ?? req.txid),
          note: "Cobrança Pix gerada via Asaas API",
        };
      }
    }
  }

  const pixCode = buildPixBrCode({
    pixKey: req.pixKey,
    merchantName: req.merchantName,
    merchantCity: req.merchantCity,
    amount: req.amount,
    txid: req.txid,
    description: `Recarga ${req.merchantName}`,
  });

  const fallbackNote =
    gw === "SANDBOX"
      ? "Pix Sandbox pronto — clique em Simular Pagamento ou envie webhook."
      : `Credencial ${gw} não configurada no .env — BR Code EMV gerado com a chave Pix cadastrada.`;

  return {
    gatewayUsed: gw === "SANDBOX" ? "SANDBOX" : `${gw}_FALLBACK`,
    pixCode,
    externalId: `PIX-${req.txid}`,
    note: fallbackNote,
  };
}
