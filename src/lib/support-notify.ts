import { createHash } from "node:crypto";
import { prisma } from "./prisma";

export interface SupportAlertPayload {
  kind: "EMAIL" | "TICKET" | "TICKET_REPLY" | "COOPERATION";
  referenceId?: string | number;
  senderName?: string | null;
  senderEmail: string;
  senderUsername?: string | null;
  senderWhatsapp?: string | null;
  subject: string;
  message: string;
  orderId?: number | null;
}

export interface WhatsAppDeliveryResult {
  ok: boolean;
  provider?: "atenza_mcp" | "waha_direct";
  messageId?: string | null;
  error?: string;
}

const DEFAULT_ADMIN_WHATSAPP = "5511992598585";
const DEFAULT_ATENZA_MCP_URL = "https://www.atenza.online/api/mcp";
const DEFAULT_ATENZA_CONVERSATION_ID = "bbefd13e-2ed3-4953-a8d0-67d1b6449796";

function formatSupportWhatsAppText(payload: SupportAlertPayload): string {
  const appUrl = (
    process.env.APP_URL || "https://followme.nexaclouds.online"
  ).replace(/\/+$/, "");

  const headerMap: Record<SupportAlertPayload["kind"], string> = {
    EMAIL: "📩 *FollowMe · Novo E-mail no Suporte*",
    TICKET: "🎫 *FollowMe · Novo Ticket de Suporte*",
    TICKET_REPLY: "💬 *FollowMe · Nova Resposta em Ticket*",
    COOPERATION: "🤝 *FollowMe · Nova Proposta Comercial*",
  };

  const whoParts = [
    payload.senderName?.trim(),
    payload.senderUsername ? `@${payload.senderUsername}` : null,
    `<${payload.senderEmail}>`,
  ].filter(Boolean);

  const lines: string[] = [
    headerMap[payload.kind],
    "",
    `*De:* ${whoParts.join(" ")}`,
    `*Assunto:* ${payload.subject.trim() || "(Sem assunto)"}`,
  ];

  if (payload.referenceId !== undefined) {
    lines.push(`*Ref:* #${payload.referenceId}`);
  }
  if (payload.orderId) {
    lines.push(`*Pedido:* #${payload.orderId}`);
  }
  if (payload.senderWhatsapp) {
    lines.push(`*WhatsApp do cliente:* ${payload.senderWhatsapp}`);
  }

  const cleanBody = payload.message.trim().slice(0, 2800);
  lines.push("", "*O que a pessoa escreveu:*", cleanBody || "(Mensagem vazia)");
  lines.push(
    "",
    `🔗 *Painel Admin:* ${appUrl}/admin`,
    "💡 _Você pode responder direto no painel /admin (aba Suporte & E-mails) ou pedir para o assistente responder/corrigir._"
  );

  return lines.join("\n");
}

export async function sendWhatsAppSupportAlert(
  payload: SupportAlertPayload
): Promise<WhatsAppDeliveryResult> {
  const text = formatSupportWhatsAppText(payload);
  const idempotencyKey = `followme-support-${payload.kind}-${payload.referenceId ?? "0"}-${createHash(
    "sha1"
  )
    .update(`${payload.senderEmail}|${payload.subject}|${payload.message.slice(0, 300)}`)
    .digest("hex")
    .slice(0, 16)}`;

  const dbSettings = await prisma.siteSetting
    .findUnique({
      where: { id: "default" },
      select: { atenzaMcpToken: true, atenzaConversationId: true },
    })
    .catch(() => null);

  const atenzaToken =
    process.env.ATENZA_MCP_TOKEN?.trim() ||
    dbSettings?.atenzaMcpToken?.trim();
  const atenzaUrl =
    process.env.ATENZA_MCP_URL?.trim() || DEFAULT_ATENZA_MCP_URL;
  const conversationId =
    process.env.ATENZA_CONVERSATION_ID?.trim() ||
    dbSettings?.atenzaConversationId?.trim() ||
    DEFAULT_ATENZA_CONVERSATION_ID;

  // 1. Primary 24/7 Cloud Route: Atenza MCP (crm_send_whatsapp_message -> +5511992598585)
  if (atenzaToken && conversationId) {
    try {
      const res = await fetch(atenzaUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${atenzaToken}`,
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
          "User-Agent": "FollowMe-Support/1.0",
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
        signal: AbortSignal.timeout(25_000),
      });

      const raw = await res.text();
      if (res.ok && !raw.includes('"isError":true')) {
        const match = raw.match(/"message_id"\s*:\s*"([^"]+)"/);
        return {
          ok: true,
          provider: "atenza_mcp",
          messageId: match?.[1] ?? null,
        };
      }
    } catch {
      // Fallback to direct WAHA if configured
    }
  }

  // 2. Fallback Route: Direct WAHA API (/api/sendText)
  const wahaBase = process.env.WAHA_API_BASE_URL?.trim()?.replace(/\/+$/, "");
  const wahaKey = process.env.WAHA_API_KEY?.trim();
  const wahaSession =
    process.env.WAHA_SESSION?.trim() ||
    "org_c34c925b_2333153d5f7045e2b027868286128875";
  const targetPhone = (
    process.env.SUPPORT_ALERT_WHATSAPP?.trim() || DEFAULT_ADMIN_WHATSAPP
  ).replace(/\D/g, "");

  if (wahaBase && wahaKey && targetPhone) {
    try {
      const res = await fetch(`${wahaBase}/api/sendText`, {
        method: "POST",
        headers: {
          "X-Api-Key": wahaKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          session: wahaSession,
          chatId: `${targetPhone}@c.us`,
          text,
        }),
        signal: AbortSignal.timeout(25_000),
      });
      const data = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
      if (res.ok) {
        return {
          ok: true,
          provider: "waha_direct",
          messageId: data.id ?? null,
        };
      }
      return {
        ok: false,
        provider: "waha_direct",
        error: data.error || `HTTP ${res.status}`,
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
    error: "Nenhum canal WhatsApp (ATENZA_MCP_TOKEN ou WAHA_API_BASE_URL) configurado.",
  };
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

export async function sendSupportEmailReply(params: {
  toEmail: string;
  toName?: string | null;
  subject: string;
  replyBody: string;
  originalMessage?: string | null;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY não configurada." };
  }

  const fromEmail =
    process.env.RESEND_SUPPORT_FROM?.trim() ||
    (process.env.RESEND_FROM_EMAIL &&
    !process.env.RESEND_FROM_EMAIL.includes("onboarding@resend.dev")
      ? process.env.RESEND_FROM_EMAIL.trim()
      : "FollowMe Support <followme@nexaclouds.online>");

  const replyTo =
    process.env.SUPPORT_REPLY_TO_EMAIL?.trim() || "followme@nexaclouds.online";

  const cleanSubject = /^re:/i.test(params.subject.trim())
    ? params.subject.trim()
    : `Re: ${params.subject.trim() || "Atendimento FollowMe"}`;

  const safeReplyHtml = escapeHtml(params.replyBody.trim()).replace(/\n/g, "<br/>");
  const quotedHtml = params.originalMessage
    ? `<div style="margin-top:24px;padding-top:16px;border-top:1px solid #232730;color:#98A0AD;font-size:12px;">
         <div style="margin-bottom:6px;font-weight:600;">Mensagem anterior:</div>
         <div style="white-space:pre-wrap;">${escapeHtml(params.originalMessage.trim())}</div>
       </div>`
    : "";

  const html = `<!doctype html>
<html>
<body style="margin:0;padding:24px;background:#090A0C;color:#F4F5F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#111317;border:1px solid #232730;padding:28px;">
    <div style="font-family:monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.18em;color:#C8FF2E;margin-bottom:14px;">
      FOLLOWME · SUPORTE OFICIAL
    </div>
    <div style="font-size:15px;line-height:1.65;color:#F4F5F6;">
      ${safeReplyHtml}
    </div>
    <div style="margin-top:24px;font-size:13px;color:#98A0AD;">
      Atenciosamente,<br/>
      <strong style="color:#F4F5F6;">Equipe FollowMe</strong><br/>
      <a href="https://followme.nexaclouds.online" style="color:#C8FF2E;text-decoration:none;">followme.nexaclouds.online</a>
    </div>
    ${quotedHtml}
  </div>
</body>
</html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [params.toEmail.trim()],
      reply_to: replyTo,
      subject: cleanSubject,
      text: `${params.replyBody.trim()}\n\n--\nEquipe FollowMe\nhttps://followme.nexaclouds.online`,
      html,
    }),
  });

  const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!res.ok) {
    return {
      ok: false,
      error: data.message || `Falha no envio Resend (HTTP ${res.status})`,
    };
  }

  return { ok: true, id: data.id };
}
