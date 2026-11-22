import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, hashPassword } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";

const requestResetSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido."),
});

const confirmResetSchema = z.object({
  token: z.string().trim().min(20, "Token inválido."),
  password: z.string().min(6, "A nova senha deve ter pelo menos 6 caracteres.").max(100),
});

function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

async function sendResetEmail(to: string, brandName: string, resetUrl: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return false;
  const from =
    process.env.RESEND_FROM_EMAIL?.trim() ||
    `${brandName} <onboarding@resend.dev>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `[${brandName}] Recuperação de senha`,
      html: `
        <div style="font-family:sans-serif;background:#090A0C;color:#F4F5F6;padding:32px;max-width:560px;margin:0 auto;border:1px solid #232730;">
          <h2 style="color:#C8FF2E;margin:0 0 12px;">${brandName} — Redefinir Senha</h2>
          <p style="color:#98A0AD;line-height:1.6;">Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo (link válido por 1 hora):</p>
          <p style="margin:24px 0;">
            <a href="${resetUrl}" style="display:inline-block;background:#C8FF2E;color:#090A0C;padding:12px 24px;font-weight:bold;text-decoration:none;">REDEFINIR MINHA SENHA</a>
          </p>
          <p style="color:#68707E;font-size:12px;">Se você não solicitou isso, ignore este e-mail.</p>
        </div>
      `,
    }),
    signal: AbortSignal.timeout(10000),
  }).catch(() => null);

  return Boolean(res?.ok);
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(`reset:${ip}`, 8, 60_000)) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde um minuto." },
      { status: 429 }
    );
  }

  const parsed = requestResetSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "E-mail inválido." },
      { status: 400 }
    );
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  // Resposta uniforme para evitar enumeração de contas
  if (!user || user.status !== "ACTIVE") {
    return NextResponse.json({
      ok: true,
      message:
        "Se este e-mail estiver cadastrado, enviaremos instruções para redefinir sua senha.",
    });
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  const settings = await getSiteSettings();
  const origin =
    process.env.APP_URL?.trim()?.replace(/\/+$/, "") ||
    `${req.headers.get("x-forwarded-proto") || "https"}://${req.headers.get("host") || "localhost:3000"}`;
  const resetUrl = `${origin}/esqueci-senha?token=${rawToken}`;

  const emailSent = await sendResetEmail(user.email, settings.brandName, resetUrl);

  return NextResponse.json({
    ok: true,
    emailSent,
    message: emailSent
      ? "Enviamos um link de recuperação para o seu e-mail (válido por 1 hora)."
      : "Solicitação registrada. Caso não receba o e-mail em instantes, fale com nosso suporte informando seu e-mail cadastrado.",
  });
}

export async function PATCH(req: NextRequest) {
  const parsed = confirmResetSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }

  const tokenHash = hashToken(parsed.data.token);
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Link de recuperação inválido ou expirado. Solicite um novo." },
      { status: 400 }
    );
  }

  const newHash = await hashPassword(parsed.data.password);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash: newHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    message: "Senha redefinida com sucesso! Agora você já pode entrar.",
  });
}
