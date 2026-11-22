import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { confirmDepositAndCredit } from "@/lib/order-service";
import {
  StripeWebhookEvent,
  verifyStripeWebhookSignature,
} from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim() || "";
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET não configurado." },
      { status: 503 }
    );
  }

  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!verifyStripeWebhookSignature(rawBody, signature, webhookSecret)) {
    return NextResponse.json(
      { error: "Assinatura Stripe inválida." },
      { status: 400 }
    );
  }

  let event: StripeWebhookEvent;
  try {
    event = JSON.parse(rawBody) as StripeWebhookEvent;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const session = event.data?.object;
  if (!session) {
    return NextResponse.json({ received: true, ignored: "no_object" });
  }

  // Isolamento multi-app: ignora eventos da mesma conta Stripe que pertencem a outros projetos.
  if (session.metadata?.app !== "followme") {
    return NextResponse.json({ received: true, ignored: "other_app" });
  }

  const depositId = session.metadata?.depositId || session.client_reference_id;
  const deposit = await prisma.deposit.findFirst({
    where: {
      OR: [
        ...(depositId ? [{ id: depositId }] : []),
        ...(session.id ? [{ stripeSessionId: session.id }] : []),
      ],
    },
  });

  if (!deposit) {
    return NextResponse.json({ received: true, ignored: "deposit_not_found" });
  }

  try {
    if (
      (event.type === "checkout.session.completed" &&
        session.payment_status === "paid") ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const result = await confirmDepositAndCredit(
        deposit.id,
        `Confirmado automaticamente via webhook Stripe (${event.type})`
      );
      return NextResponse.json({
        received: true,
        credited: !result.alreadyPaid,
        alreadyPaid: result.alreadyPaid,
      });
    }

    if (event.type === "checkout.session.expired") {
      await prisma.deposit.updateMany({
        where: { id: deposit.id, status: "PENDING" },
        data: { status: "EXPIRED", note: "Sessão Stripe expirada." },
      });
      return NextResponse.json({ received: true, expired: true });
    }

    if (event.type === "checkout.session.async_payment_failed") {
      await prisma.deposit.updateMany({
        where: { id: deposit.id, status: "PENDING" },
        data: { status: "REJECTED", note: "Pagamento assíncrono Stripe recusado." },
      });
      return NextResponse.json({ received: true, failed: true });
    }

    return NextResponse.json({ received: true, eventType: event.type });
  } catch (err) {
    console.error("Stripe webhook processing error:", err);
    return NextResponse.json(
      { error: "Falha ao processar evento Stripe." },
      { status: 500 }
    );
  }
}
