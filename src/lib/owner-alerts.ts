import { createHash } from "node:crypto";
import { prisma } from "./prisma";
import { formatCurrencyAmount, AppCurrency } from "./i18n";

export const DEFAULT_OWNER_WHATSAPP = "5511992598585";
const DEFAULT_ATENZA_MCP_URL = "https://www.atenza.online/api/mcp";
const DEFAULT_ATENZA_CONVERSATION_ID = "bbefd13e-2ed3-4953-a8d0-67d1b6449796";
const DEFAULT_WAHA_SESSION = "org_c34c925b_2333153d5f7045e2b027868286128875";

export function formatBrtDateTime(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(d);
}

export function extractProfileHandle(rawLink?: string | null): string {
  if (!rawLink) return "-";
  const trimmed = rawLink.trim();
  if (!trimmed) return "-";
  if (trimmed.startsWith("@")) return trimmed;

  try {
    const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const u = new URL(withProto);
    const host = u.hostname.toLowerCase();
    const parts = u.pathname.split("/").filter(Boolean);
    if (host.includes("instagram.com")) {
      if (parts[0] && !["p", "reel", "reels", "stories", "tv"].includes(parts[0].toLowerCase())) {
        return `@${parts[0]}`;
      }
      if (parts[0]?.toLowerCase() === "stories" && parts[1]) {
        return `@${parts[1]}`;
      }
    }
    if (host.includes("tiktok.com") && parts[0]?.startsWith("@")) {
      return parts[0];
    }
    if (host.includes("youtube.com") && parts[0]?.startsWith("@")) {
      return parts[0];
    }
    if (host.includes("x.com") || host.includes("twitter.com")) {
      if (parts[0] && !["i", "intent", "search"].includes(parts[0].toLowerCase())) {
        return `@${parts[0]}`;
      }
    }
  } catch {
    // Plain handle or partial path
  }
  return trimmed.slice(0, 80);
}

function getAppUrl(): string {
  return (process.env.APP_URL || "https://www.followm.click").replace(/\/+$/, "");
}

function resolveOwnerEmails(fallbackSupportEmail?: string | null): string[] {
  const explicit = (process.env.OWNER_ALERT_EMAIL || "")
    .split(",")
    .map((e) => e.trim())
    .filter((e) => e.includes("@"));
  if (explicit.length > 0) return explicit;

  const admins = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim())
    .filter((e) => e.includes("@"));
  if (admins.length > 0) return admins.slice(0, 2);

  if (fallbackSupportEmail && fallbackSupportEmail.includes("@")) {
    return [fallbackSupportEmail];
  }
  return [];
}

function resolveOwnerPhone(): string {
  const raw =
    process.env.OWNER_ALERT_WHATSAPP?.trim() ||
    process.env.SUPPORT_ALERT_WHATSAPP?.trim() ||
    DEFAULT_OWNER_WHATSAPP;
  return raw.replace(/\D/g, "") || DEFAULT_OWNER_WHATSAPP;
}

function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return ch;
    }
  });
}

async function sendOwnerWhatsAppText(
  text: string,
  idempotencySeed: string
): Promise<{ ok: boolean; provider?: string; error?: string }> {
  const idempotencyKey = `followme-owner-${createHash("sha1")
    .update(idempotencySeed)
    .digest("hex")
    .slice(0, 20)}`;

  const dbSettings = await prisma.siteSetting
    .findUnique({
      where: { id: "default" },
      select: { atenzaMcpToken: true, atenzaConversationId: true },
    })
    .catch(() => null);

  const atenzaToken =
    process.env.ATENZA_MCP_TOKEN?.trim() || dbSettings?.atenzaMcpToken?.trim();
  const atenzaUrl = process.env.ATENZA_MCP_URL?.trim() || DEFAULT_ATENZA_MCP_URL;
  const conversationId =
    process.env.ATENZA_CONVERSATION_ID?.trim() ||
    dbSettings?.atenzaConversationId?.trim() ||
    DEFAULT_ATENZA_CONVERSATION_ID;

  // 1. Primary cloud route: Atenza MCP
  if (atenzaToken && conversationId) {
    try {
      const res = await fetch(atenzaUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${atenzaToken}`,
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
          "User-Agent": "FollowMe-Alerts/1.0",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: Date.now(),
          method: "tools/call",
          params: {
            name: "crm_send_whatsapp_message",
            arguments: {
              conversation_id: conversationId,
              body: text,
              type: "text",
              idempotency_key: idempotencyKey,
            },
          },
        }),
        signal: AbortSignal.timeout(20_000),
      });
      const raw = await res.text();
      if (res.ok && !raw.includes('"isError":true')) {
        return { ok: true, provider: "atenza_mcp" };
      }
    } catch {
      // Fall through to direct WAHA
    }
  }

  // 2. Direct WAHA route
  const wahaBase = process.env.WAHA_API_BASE_URL?.trim()?.replace(/\/+$/, "");
  const wahaKey = process.env.WAHA_API_KEY?.trim();
  const targetPhone = resolveOwnerPhone();

  if (wahaBase && wahaKey && targetPhone) {
    let session = process.env.WAHA_SESSION?.trim() || "";
    if (!session) {
      try {
        const sRes = await fetch(`${wahaBase}/api/sessions`, {
          headers: {
            "X-Api-Key": wahaKey,
            Accept: "application/json",
            "User-Agent": "FollowMe-Alerts/1.0",
          },
          signal: AbortSignal.timeout(10_000),
        });
        if (sRes.ok) {
          const list = (await sRes.json()) as Array<{ name?: string; status?: string }>;
          const working = list.find((s) => s.status === "WORKING" && s.name);
          session = working?.name || list[0]?.name || DEFAULT_WAHA_SESSION;
        }
      } catch {
        session = DEFAULT_WAHA_SESSION;
      }
    }

    try {
      const res = await fetch(`${wahaBase}/api/sendText`, {
        method: "POST",
        headers: {
          "X-Api-Key": wahaKey,
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": "FollowMe-Alerts/1.0",
        },
        body: JSON.stringify({
          session,
          chatId: `${targetPhone}@c.us`,
          text,
        }),
        signal: AbortSignal.timeout(20_000),
      });
      if (res.ok) {
        return { ok: true, provider: `waha_direct:${session}` };
      }
      const errBody = await res.text().catch(() => "");
      return {
        ok: false,
        provider: "waha_direct",
        error: `HTTP ${res.status}: ${errBody.slice(0, 180)}`,
      };
    } catch (err) {
      return {
        ok: false,
        provider: "waha_direct",
        error: err instanceof Error ? err.message : "WAHA request failed",
      };
    }
  }

  return {
    ok: false,
    error: "Canal WhatsApp não configurado (WAHA_API_BASE_URL/WAHA_API_KEY ou ATENZA_MCP_TOKEN).",
  };
}

async function sendOwnerEmail(params: {
  to: string[];
  subject: string;
  headline: string;
  rows: Array<{ label: string; value: string }>;
  footerNote?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY não configurada." };
  }
  if (params.to.length === 0) {
    return { ok: false, error: "Nenhum e-mail de destino configurado." };
  }

  const fromEmail =
    process.env.RESEND_FROM_EMAIL &&
    !process.env.RESEND_FROM_EMAIL.includes("onboarding@resend.dev")
      ? process.env.RESEND_FROM_EMAIL.trim()
      : "FollowMe Alertas <followme@nexaclouds.online>";

  const appUrl = getAppUrl();
  const rowsHtml = params.rows
    .map(
      (r) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #261e3f;color:#a59ac4;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;white-space:nowrap;">${escapeHtml(
          r.label
        )}</td><td style="padding:8px 12px;border-bottom:1px solid #261e3f;color:#f7f3ff;font-size:14px;font-weight:600;">${escapeHtml(
          r.value
        )}</td></tr>`
    )
    .join("");

  const html = `<!doctype html>
<html>
<body style="margin:0;padding:24px;background:#0e0a1b;color:#f7f3ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#16102b;border:1px solid #2e244d;border-radius:16px;padding:24px;">
    <div style="font-family:monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.16em;color:#f8d449;margin-bottom:8px;">
      FOLLOWME · ALERTA OPERACIONAL
    </div>
    <h2 style="margin:0 0 18px;font-size:20px;color:#ffffff;">${escapeHtml(params.headline)}</h2>
    <table style="width:100%;border-collapse:collapse;background:#110c21;border-radius:10px;overflow:hidden;">
      ${rowsHtml}
    </table>
    ${
      params.footerNote
        ? `<p style="margin:16px 0 0;font-size:13px;color:#c9bfe3;line-height:1.5;">${escapeHtml(
            params.footerNote
          )}</p>`
        : ""
    }
    <div style="margin-top:20px;">
      <a href="${appUrl}/dashboard" style="display:inline-block;background:#7c3ee9;color:#ffffff;text-decoration:none;font-weight:700;font-size:13px;padding:10px 18px;border-radius:10px;">
        Abrir Painel /dashboard →
      </a>
    </div>
  </div>
</body>
</html>`;

  const text = [
    params.headline,
    "",
    ...params.rows.map((r) => `${r.label}: ${r.value}`),
    params.footerNote ? `\n${params.footerNote}` : "",
    `\nDashboard: ${appUrl}/dashboard`,
  ].join("\n");

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: params.to,
        subject: params.subject,
        text,
        html,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      const errTxt = await res.text().catch(() => "");
      return { ok: false, error: `Resend HTTP ${res.status}: ${errTxt.slice(0, 160)}` };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro ao enviar e-mail",
    };
  }
}

export async function notifyOwnerPaymentConfirmed(params: {
  depositId: string;
  userName: string;
  userEmail: string;
  amount: number;
  currency: string;
  method: string;
  paidAt: Date;
  latestOrderSummary?: string | null;
  supportEmail?: string | null;
}) {
  const curr = (params.currency === "USD" || params.currency === "EUR"
    ? params.currency
    : "BRL") as AppCurrency;
  const formattedAmount = formatCurrencyAmount(params.amount, curr);
  const whenBrt = formatBrtDateTime(params.paidAt);
  const appUrl = getAppUrl();
  const recipients = resolveOwnerEmails(params.supportEmail);
  const phone = resolveOwnerPhone();

  const waLines = [
    "💰 *PAGAMENTO CONFIRMADO · FollowMe*",
    "",
    `*Quem pagou:* ${params.userName} (${params.userEmail})`,
    `*Valor pago:* ${formattedAmount} (${params.method})`,
    `*Quando pagou:* ${whenBrt} (Brasília)`,
    ...(params.latestOrderSummary
      ? [`*Última solicitação:* ${params.latestOrderSummary}`]
      : []),
    "",
    `📊 *Dashboard:* ${appUrl}/dashboard`,
  ];

  const [emailRes, waRes] = await Promise.all([
    sendOwnerEmail({
      to: recipients,
      subject: `💰 Pagamento confirmado: ${formattedAmount} — ${params.userName}`,
      headline: `Novo pagamento confirmado (${formattedAmount})`,
      rows: [
        { label: "Cliente", value: params.userName },
        { label: "E-mail", value: params.userEmail },
        { label: "Valor Pago", value: formattedAmount },
        { label: "Método", value: params.method },
        { label: "Data e Hora (BRT)", value: whenBrt },
        ...(params.latestOrderSummary
          ? [{ label: "Solicitação", value: params.latestOrderSummary }]
          : []),
      ],
    }),
    sendOwnerWhatsAppText(waLines.join("\n"), `payment-${params.depositId}`),
  ]);

  await prisma.ownerNotificationLog
    .create({
      data: {
        kind: "PAYMENT",
        referenceId: params.depositId,
        recipientEmail: recipients.join(", ") || null,
        recipientPhone: phone,
        emailOk: emailRes.ok,
        emailError: emailRes.error ?? null,
        whatsappOk: waRes.ok,
        whatsappProvider: waRes.provider ?? null,
        whatsappError: waRes.error ?? null,
        summary: `Pagamento ${formattedAmount} de ${params.userName} (${params.userEmail}) em ${whenBrt}`,
      },
    })
    .catch(() => null);

  return { email: emailRes, whatsapp: waRes };
}

export async function notifyOwnerOrderPlaced(params: {
  orderId: number;
  userName: string;
  userEmail: string;
  serviceName: string;
  link: string;
  quantity: number;
  chargeBrl: number;
  createdAt: Date;
  providerName?: string | null;
  status: string;
  failoverUsed?: boolean;
  lastError?: string | null;
  supportEmail?: string | null;
}) {
  const formattedCharge = formatCurrencyAmount(params.chargeBrl, "BRL");
  const whenBrt = formatBrtDateTime(params.createdAt);
  const handle = extractProfileHandle(params.link);
  const appUrl = getAppUrl();
  const recipients = resolveOwnerEmails(params.supportEmail);
  const phone = resolveOwnerPhone();

  const isFailed = params.status === "FAILED";
  const kind = isFailed
    ? "PROVIDER_FAILED"
    : params.failoverUsed
      ? "PROVIDER_FAILOVER"
      : "ORDER";

  const titleEmoji = isFailed ? "🚨" : params.failoverUsed ? "🔄" : "🚀";
  const headline = isFailed
    ? `FALHA NO PROVEDOR — Pedido #${params.orderId} precisa de reenvio`
    : params.failoverUsed
      ? `Pedido #${params.orderId} salvo por FAILOVER automático`
      : `Nova solicitação #${params.orderId} (${formattedCharge})`;

  const waLines = [
    `${titleEmoji} *${headline.toUpperCase()}*`,
    "",
    `*Quem pediu:* ${params.userName}`,
    `*E-mail:* ${params.userEmail}`,
    `*Perfil/Link:* ${handle} (${params.link})`,
    `*Serviço:* ${params.serviceName}`,
    `*Quantidade:* ${params.quantity.toLocaleString("pt-BR")} unidades`,
    `*Valor:* ${formattedCharge}`,
    `*Horário:* ${whenBrt} (Brasília)`,
    `*Provedor:* ${params.providerName || "Sem provedor"}${params.failoverUsed ? " (FAILOVER)" : ""}`,
    `*Status:* ${params.status}`,
    ...(params.lastError ? [`*Erro:* ${params.lastError}`] : []),
    "",
    `📊 *Abrir /dashboard:* ${appUrl}/dashboard`,
  ];

  const [emailRes, waRes] = await Promise.all([
    sendOwnerEmail({
      to: recipients,
      subject: `${titleEmoji} ${headline} — ${params.userName}`,
      headline,
      rows: [
        { label: "Pedido", value: `#${params.orderId}` },
        { label: "Cliente", value: params.userName },
        { label: "E-mail", value: params.userEmail },
        { label: "Perfil / Link", value: `${handle} (${params.link})` },
        { label: "Serviço", value: params.serviceName },
        { label: "Quantidade", value: `${params.quantity.toLocaleString("pt-BR")} unidades` },
        { label: "Valor Pago", value: formattedCharge },
        { label: "Data e Hora (BRT)", value: whenBrt },
        {
          label: "Provedor",
          value: `${params.providerName || "Sem provedor"}${params.failoverUsed ? " (Failover automático)" : ""}`,
        },
        { label: "Status", value: params.status },
        ...(params.lastError ? [{ label: "Erro Provedor", value: params.lastError }] : []),
      ],
      footerNote: isFailed
        ? "Todos os provedores configurados falharam. Acesse o /dashboard e clique em 'Reenviar / Trocar Provedor' para despachar por outro fornecedor em 1 clique."
        : undefined,
    }),
    sendOwnerWhatsAppText(waLines.join("\n"), `order-${params.orderId}-${kind}`),
  ]);

  await prisma.ownerNotificationLog
    .create({
      data: {
        kind,
        referenceId: String(params.orderId),
        recipientEmail: recipients.join(", ") || null,
        recipientPhone: phone,
        emailOk: emailRes.ok,
        emailError: emailRes.error ?? null,
        whatsappOk: waRes.ok,
        whatsappProvider: waRes.provider ?? null,
        whatsappError: waRes.error ?? null,
        summary: `Pedido #${params.orderId} · ${params.userName} · ${params.quantity}x ${params.serviceName} · ${formattedCharge} (${params.status})`,
      },
    })
    .catch(() => null);

  return { email: emailRes, whatsapp: waRes };
}

export async function sendOwnerTestAlert(supportEmail?: string | null) {
  const now = new Date();
  const whenBrt = formatBrtDateTime(now);
  const appUrl = getAppUrl();
  const recipients = resolveOwnerEmails(supportEmail);
  const phone = resolveOwnerPhone();

  const waText = [
    "✅ *TESTE DE ALERTA · FollowMe /dashboard*",
    "",
    `Conexão E-mail + WhatsApp (+${phone}) ativa e operando em tempo real.`,
    `*Horário:* ${whenBrt} (Brasília)`,
    `📊 *Dashboard:* ${appUrl}/dashboard`,
  ].join("\n");

  const [emailRes, waRes] = await Promise.all([
    sendOwnerEmail({
      to: recipients,
      subject: "✅ Teste de Alerta FollowMe (E-mail + WhatsApp)",
      headline: "Alertas de Pagamento e Pedidos Ativos",
      rows: [
        { label: "WhatsApp Destino", value: `+${phone}` },
        { label: "E-mail Destino", value: recipients.join(", ") || "-" },
        { label: "Horário (BRT)", value: whenBrt },
      ],
      footerNote:
        "Sempre que um cliente pagar ou enviar uma solicitação, você receberá o resumo no e-mail e direto no WhatsApp.",
    }),
    sendOwnerWhatsAppText(waText, `test-${now.getTime()}`),
  ]);

  await prisma.ownerNotificationLog
    .create({
      data: {
        kind: "TEST",
        referenceId: "manual-test",
        recipientEmail: recipients.join(", ") || null,
        recipientPhone: phone,
        emailOk: emailRes.ok,
        emailError: emailRes.error ?? null,
        whatsappOk: waRes.ok,
        whatsappProvider: waRes.provider ?? null,
        whatsappError: waRes.error ?? null,
        summary: `Teste manual de alerta em ${whenBrt}`,
      },
    })
    .catch(() => null);

  return { email: emailRes, whatsapp: waRes, recipientEmail: recipients, recipientPhone: phone };
}
