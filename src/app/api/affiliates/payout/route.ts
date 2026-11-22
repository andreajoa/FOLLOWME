import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { generateTxId } from "@/lib/pix";
import { round2 } from "@/lib/pricing";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const settings = await getSiteSettings();
  if (user.affiliateBalance < settings.affiliateMinPayout) {
    return NextResponse.json(
      {
        error: `Saldo mínimo para resgate é R$ ${settings.affiliateMinPayout.toFixed(2)}.`,
      },
      { status: 400 }
    );
  }

  const amount = round2(user.affiliateBalance);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.updateMany({
        where: { id: user.id, affiliateBalance: { gte: amount } },
        data: {
          affiliateBalance: { decrement: amount },
          balance: { increment: amount },
        },
      });

      if (updated.count === 0) {
        throw new Error("Saldo de afiliado insuficiente.");
      }

      await tx.affiliateEarning.updateMany({
        where: { referrerId: user.id, status: "AVAILABLE" },
        data: { status: "PAID_OUT" },
      });

      await tx.deposit.create({
        data: {
          userId: user.id,
          amount,
          method: "AFFILIATE_TRANSFER",
          gateway: "INTERNAL",
          txid: generateTxId(),
          status: "PAID",
          paidAt: new Date(),
          note: "Resgate de comissão de afiliados para saldo do painel",
        },
      });

      return tx.user.findUnique({
        where: { id: user.id },
        select: { balance: true, affiliateBalance: true },
      });
    });

    return NextResponse.json({
      transferred: amount,
      balance: result?.balance ?? 0,
      affiliateBalance: result?.affiliateBalance ?? 0,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao resgatar comissão." },
      { status: 400 }
    );
  }
}
