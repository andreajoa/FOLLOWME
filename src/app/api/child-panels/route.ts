import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";

const createChildPanelSchema = z.object({
  domain: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)+$/,
      "Informe um domínio válido (ex: meupainelsmm.com.br)."
    ),
  currency: z.enum(["BRL", "USD", "EUR"]).default("BRL"),
  adminUsername: z
    .string()
    .trim()
    .min(3, "Usuário admin deve ter ao menos 3 caracteres.")
    .max(32)
    .regex(/^[a-zA-Z0-9._-]+$/, "Use apenas letras, números, ponto, _ ou -."),
  adminPassword: z
    .string()
    .min(6, "Senha do painel filho deve ter ao menos 6 caracteres.")
    .max(100),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const [panels, settings] = await Promise.all([
    prisma.childPanel.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        domain: true,
        currency: true,
        adminUsername: true,
        monthlyPrice: true,
        status: true,
        nameservers: true,
        nextBillingAt: true,
        createdAt: true,
      },
    }),
    getSiteSettings(),
  ]);

  return NextResponse.json({
    panels,
    monthlyPrice: settings.childPanelPrice,
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Faça login para contratar um Painel Filho." }, { status: 401 });
  }

  const parsed = createChildPanelSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }

  const existingDomain = await prisma.childPanel.findUnique({
    where: { domain: parsed.data.domain },
  });
  if (existingDomain) {
    return NextResponse.json(
      { error: "Este domínio já está cadastrado em outro Painel Filho." },
      { status: 409 }
    );
  }

  const settings = await getSiteSettings();
  const price = Math.max(1, settings.childPanelPrice);
  const passwordHash = await hashPassword(parsed.data.adminPassword);
  const nextBillingAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  try {
    const panel = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.updateMany({
        where: {
          id: user.id,
          status: "ACTIVE",
          balance: { gte: price },
        },
        data: {
          balance: { decrement: price },
          totalSpent: { increment: price },
        },
      });

      if (updated.count === 0) {
        throw new Error(
          `Saldo insuficiente. Recarregue ao menos R$ ${price.toFixed(2)} via Pix ou Cartão (Stripe).`
        );
      }

      return tx.childPanel.create({
        data: {
          userId: user.id,
          domain: parsed.data.domain,
          currency: parsed.data.currency,
          adminUsername: parsed.data.adminUsername,
          adminPasswordHash: passwordHash,
          monthlyPrice: price,
          status: "PENDING",
          nextBillingAt,
        },
        select: {
          id: true,
          domain: true,
          currency: true,
          adminUsername: true,
          monthlyPrice: true,
          status: true,
          nameservers: true,
          nextBillingAt: true,
          createdAt: true,
        },
      });
    });

    const refreshed = await prisma.user.findUnique({
      where: { id: user.id },
      select: { balance: true },
    });

    return NextResponse.json(
      { panel, balance: refreshed?.balance ?? user.balance },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao contratar Painel Filho." },
      { status: 400 }
    );
  }
}
