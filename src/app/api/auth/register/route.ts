import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  checkRateLimit,
  generateApiKey,
  generateReferralCode,
  hashPassword,
  isAdminEmail,
  setSessionCookie,
} from "@/lib/auth";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome completo.").max(80),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9._-]{3,28}$/, "Usuário deve ter 3-28 caracteres (letras, números, . _ -)."),
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres.").max(100),
  whatsapp: z.string().trim().max(30).optional(),
  referralCode: z.string().trim().max(24).optional(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  if (!checkRateLimit(`reg:${ip}`, 15, 60_000)) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde um minuto." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
        { status: 400 }
      );
    }

    const { name, username, email, password, whatsapp, referralCode } = parsed.data;

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
      select: { email: true, username: true },
    });

    if (existing) {
      return NextResponse.json(
        {
          error:
            existing.email === email
              ? "Este e-mail já está cadastrado."
              : "Este nome de usuário já está em uso.",
        },
        { status: 409 }
      );
    }

    let referredById: string | undefined;
    if (referralCode) {
      const refUser = await prisma.user.findUnique({
        where: { referralCode: referralCode.toUpperCase() },
        select: { id: true },
      });
      if (refUser) {
        referredById = refUser.id;
      }
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        username,
        email,
        passwordHash,
        whatsapp: whatsapp || null,
        role: isAdminEmail(email) ? "ADMIN" : "USER",
        apiKey: generateApiKey(),
        referralCode: generateReferralCode(username),
        referredById,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        balance: true,
      },
    });

    await setSessionCookie(user.id, user.role);
    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json(
      { error: "Não foi possível criar a conta agora." },
      { status: 500 }
    );
  }
}
