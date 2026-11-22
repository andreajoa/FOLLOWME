import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createPixCharge, generateTxId } from "@/lib/pix";
import { getSiteSettings } from "@/lib/settings";
import { round2 } from "@/lib/pricing";

const depositSchema = z.object({
  amount: z.coerce.number().positive("Valor deve ser maior que zero.").max(50000),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const [deposits, settings] = await Promise.all([
    prisma.deposit.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    getSiteSettings(),
  ]);

  return NextResponse.json({
    deposits,
    minDeposit: settings.minDeposit,
    gateway: settings.pixGateway,
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Faça login para adicionar saldo." }, { status: 401 });
  }

  const settings = await getSiteSettings();
  const parsed = depositSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Valor inválido." },
      { status: 400 }
    );
  }

  const amount = round2(parsed.data.amount);
  if (amount < settings.minDeposit) {
    return NextResponse.json(
      { error: `O valor mínimo de recarga é R$ ${settings.minDeposit.toFixed(2)}.` },
      { status: 400 }
    );
  }

  const txid = generateTxId();
  const pixCharge = await createPixCharge({
    gateway: settings.pixGateway,
    amount,
    txid,
    payerEmail: user.email,
    payerName: user.name,
    pixKey: settings.pixKey,
    merchantName: settings.pixMerchantName,
    merchantCity: settings.pixMerchantCity,
  });

  const deposit = await prisma.deposit.create({
    data: {
      userId: user.id,
      amount,
      method: "PIX",
      gateway: pixCharge.gatewayUsed,
      externalId: pixCharge.externalId,
      txid,
      pixCode: pixCharge.pixCode,
      status: "PENDING",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      note: pixCharge.note,
    },
  });

  return NextResponse.json({ deposit }, { status: 201 });
}
