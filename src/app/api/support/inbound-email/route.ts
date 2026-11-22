import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  sendWhatsAppSupportAlert,
  WhatsAppDeliveryResult,
} from "@/lib/support-notify";

const inboundEmailSchema = z.object({
  fromEmail: z.string().trim().email(),
  fromName: z.string().trim().max(160).optional().nullable(),
  toEmail: z.string().trim().max(160).default("suporte@followme.nexaclouds.online"),
  subject: z.string().trim().max(300).default("(Sem assunto)"),
  bodyText: z.string().trim().max(15000).default(""),
  skipWhatsApp: z.boolean().optional(),
});

async function isAuthorized(req: NextRequest): Promise<boolean> {
  const auth = req.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;

  const dbSetting = await prisma.siteSetting
    .findUnique({
      where: { id: "default" },
      select: { supportWebhookSecret: true },
    })
    .catch(() => null);

  const validSecrets = [
    process.env.SUPPORT_WEBHOOK_SECRET?.trim(),
    process.env.CRON_SECRET?.trim(),
    dbSetting?.supportWebhookSecret?.trim(),
  ].filter(Boolean);

  return validSecrets.length > 0 && validSecrets.includes(token);
}

export async function POST(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const parsed = inboundEmailSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Payload inválido." },
      { status: 400 }
    );
  }

  const alreadySent = Boolean(parsed.data.skipWhatsApp);

  const record = await prisma.supportEmail.create({
    data: {
      fromEmail: parsed.data.fromEmail.toLowerCase(),
      fromName: parsed.data.fromName || null,
      toEmail: parsed.data.toEmail.toLowerCase(),
      subject: parsed.data.subject || "(Sem assunto)",
      bodyText: parsed.data.bodyText || "(Sem conteúdo em texto)",
      status: "OPEN",
      whatsappSent: alreadySent,
    },
  });

  let waResult: WhatsAppDeliveryResult = { ok: alreadySent };
  if (!alreadySent) {
    waResult = await sendWhatsAppSupportAlert({
      kind: "EMAIL",
      referenceId: record.id,
      senderName: record.fromName,
      senderEmail: record.fromEmail,
      subject: record.subject,
      message: record.bodyText,
    });

    await prisma.supportEmail.update({
      where: { id: record.id },
      data: {
        whatsappSent: waResult.ok,
        whatsappError: waResult.ok ? null : waResult.error || "Falha no envio",
      },
    });
  }

  return NextResponse.json({
    ok: true,
    id: record.id,
    whatsappSent: waResult.ok,
    whatsappError: waResult.ok ? null : waResult.error,
  });
}
