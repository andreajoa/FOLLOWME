import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { confirmDepositAndCredit } from "@/lib/order-service";

function timingSafeMatch(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

export async function POST(req: NextRequest) {
  const configuredSecret = process.env.PIX_WEBHOOK_SECRET || "";
  const providedSecret =
    req.headers.get("x-webhook-secret") ||
    req.nextUrl.searchParams.get("secret") ||
    "";

  if (!configuredSecret || !timingSafeMatch(providedSecret, configuredSecret)) {
    return NextResponse.json({ error: "Assinatura de webhook inválida." }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      txid?: string;
      externalId?: string;
      external_reference?: string;
      status?: string;
      payment?: { externalReference?: string; status?: string };
    };

    const ref =
      body.txid ||
      body.externalId ||
      body.external_reference ||
      body.payment?.externalReference;
    const status = (body.status || body.payment?.status || "approved").toLowerCase();

    if (!ref) {
      return NextResponse.json({ error: "Referência txid ausente." }, { status: 400 });
    }

    if (!["approved", "paid", "received", "confirmed"].includes(status)) {
      return NextResponse.json({ ignored: true, status });
    }

    const deposit = await prisma.deposit.findFirst({
      where: {
        OR: [{ txid: ref }, { externalId: ref }],
      },
    });

    if (!deposit) {
      return NextResponse.json({ error: "Depósito não encontrado." }, { status: 404 });
    }

    const result = await confirmDepositAndCredit(
      deposit.id,
      "Pagamento Pix confirmado via webhook automático"
    );

    return NextResponse.json({ ok: true, alreadyPaid: result.alreadyPaid });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Falha ao processar webhook." }, { status: 500 });
  }
}
