import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { confirmDepositAndCredit } from "@/lib/order-service";
import { isStripeConfigured, retrieveStripeCheckoutSession } from "@/lib/stripe";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe não configurado." }, { status: 503 });
  }

  const sessionId = req.nextUrl.searchParams.get("session_id")?.trim();
  if (!sessionId || !sessionId.startsWith("cs_")) {
    return NextResponse.json({ error: "session_id inválido." }, { status: 400 });
  }

  const deposit = await prisma.deposit.findFirst({
    where: {
      OR: [{ stripeSessionId: sessionId }, { externalId: sessionId }],
      userId: user.id,
    },
  });

  if (!deposit) {
    return NextResponse.json({ error: "Depósito não encontrado." }, { status: 404 });
  }

  if (deposit.status === "PAID") {
    return NextResponse.json({
      paid: true,
      alreadyPaid: true,
      deposit,
      balance: user.balance,
    });
  }

  try {
    const session = await retrieveStripeCheckoutSession(sessionId);

    if (session.payment_status === "paid") {
      const result = await confirmDepositAndCredit(
        deposit.id,
        `Pagamento confirmado via Stripe (${session.id})`
      );
      const refreshed = await prisma.user.findUnique({
        where: { id: user.id },
        select: { balance: true },
      });
      return NextResponse.json({
        paid: true,
        alreadyPaid: result.alreadyPaid,
        deposit: result.deposit,
        balance: refreshed?.balance ?? user.balance,
      });
    }

    if (session.status === "expired") {
      await prisma.deposit.updateMany({
        where: { id: deposit.id, status: "PENDING" },
        data: { status: "EXPIRED", note: "Sessão Stripe expirada." },
      });
    }

    return NextResponse.json({
      paid: false,
      status: session.status,
      paymentStatus: session.payment_status,
      deposit,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Não foi possível consultar a Stripe.",
      },
      { status: 502 }
    );
  }
}
