import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, setSessionCookie, verifyPassword } from "@/lib/auth";

const loginSchema = z.object({
  identifier: z.string().trim().min(2, "Informe seu e-mail ou usuário."),
  password: z.string().min(1, "Informe sua senha."),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  if (!checkRateLimit(`login:${ip}`, 25, 60_000)) {
    return NextResponse.json(
      { error: "Muitas tentativas de login. Aguarde 1 minuto." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Credenciais inválidas." },
        { status: 400 }
      );
    }

    const idLower = parsed.data.identifier.toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: idLower }, { username: idLower }],
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário ou senha incorretos." },
        { status: 401 }
      );
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Sua conta está suspensa. Entre em contato com o suporte." },
        { status: 403 }
      );
    }

    const ok = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { error: "Usuário ou senha incorretos." },
        { status: 401 }
      );
    }

    await setSessionCookie(user.id, user.role);
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        balance: user.balance,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Erro ao autenticar." }, { status: 500 });
  }
}
