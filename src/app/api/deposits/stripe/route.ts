import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { generateTxId } from "@/lib/pix";
import { round2 } from "@/lib/pricing";
import { getSiteSettings } from "@/lib/settings";
import {
  createStripeDepositCheckout,
  isStripeConfigured,
  StripeCheckoutMethod,
} from "@/lib/stripe";

const stripeDepositSchema = z.object({
  amount: z.coerce.number().positive("Valor deve ser maior que zero.").max(50000),
  method: z.enum(["PIX", "CARD", "BOTH"]).optional().default("PIX"),
  currency: z.enum(["BRL", "USD", "EUR"]).optional(),
});

function resolveOrigin(req: NextRequest): string {
  const configured = process.env.APP_URL?.trim();
  if (configured && configured.startsWith("http")) {
    return configured.replace(/\/+$/, "");
  }
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (host) return `${proto}://${host}`;
  return "http://localhost:3000";
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Faça login para adicionar saldo." },
      { status: 401 }
    );
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Pagamentos via Stripe não estão configurados neste servidor." },
      { status: 503 }
    );
  }

  const settings = await getSiteSettings();
  if (!settings.stripeEnabled) {
    return NextResponse.json(
      { error: "Recargas via Stripe estão temporariamente desativadas." },
      { status: 503 }
    );
  }

  const parsed = stripeDepositSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Valor inválido." },
      { status: 400 }
    );
  }

  const amount = round2(parsed.data.amount);
  const currency = (parsed.data.currency || "BRL").toUpperCase() as "BRL" | "USD" | "EUR";
  const isBrl = currency === "BRL";
  const method: StripeCheckoutMethod = isBrl ? parsed.data.method : "CARD";
  const minRequired = isBrl ? Math.max(settings.minDeposit, 5) : 5;

  if (amount < minRequired) {
    return NextResponse.json(
      {
        error: isBrl
          ? `O valor mínimo de recarga é R$ ${minRequired.toFixed(2)}.`
          : `Minimum top-up amount is $${minRequired.toFixed(2)} ${currency}.`,
      },
      { status: 400 }
    );
  }

  if (isBrl && method === "PIX" && !settings.stripePixEnabled) {
    return NextResponse.json(
      { error: "Recarga via Pix está temporariamente desativada." },
      { status: 400 }
    );
  }

  const txid = generateTxId();
  const depositMethod =
    method === "PIX" ? "STRIPE_PIX" : method === "CARD" ? "STRIPE_CARD" : "STRIPE";

  const deposit = await prisma.deposit.create({
    data: {
      userId: user.id,
      amount,
      currency,
      method: depositMethod,
      gateway: "STRIPE",
      txid,
      status: "PENDING",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      note: !isBrl
        ? `Stripe Checkout (${currency} Card) awaiting payment`
        : method === "PIX"
          ? "Checkout Stripe Pix aguardando pagamento"
          : method === "CARD"
            ? "Checkout Stripe Cartão aguardando pagamento"
            : "Checkout Stripe (Cartão / Pix) aguardando pagamento",
    },
  });

  try {
    const origin = resolveOrigin(req);
    const session = await createStripeDepositCheckout({
      amount,
      currency,
      method,
      depositId: deposit.id,
      txid,
      userId: user.id,
      userEmail: user.email,
      brandName: settings.brandName,
      origin,
    });

    if (!session.url) {
      throw new Error("Stripe não retornou URL de checkout.");
    }

    const updated = await prisma.deposit.update({
      where: { id: deposit.id },
      data: {
        stripeSessionId: session.id,
        externalId: session.id,
        checkoutUrl: session.url,
      },
    });

    return NextResponse.json(
      {
        url: session.url,
        sessionId: session.id,
        deposit: updated,
      },
      { status: 201 }
    );
  } catch (err) {
    await prisma.deposit
      .update({
        where: { id: deposit.id },
        data: {
          status: "REJECTED",
          note: err instanceof Error ? err.message.slice(0, 240) : "Erro Stripe",
        },
      })
      .catch(() => null);

    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? `Erro ao iniciar pagamento Stripe: ${err.message}`
            : "Erro ao criar sessão de pagamento Stripe.",
      },
      { status: 502 }
    );
  }
}
