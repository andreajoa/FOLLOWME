import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { confirmDepositAndCredit } from "@/lib/order-service";

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await context.params;
  const deposit = await prisma.deposit.findUnique({ where: { id } });
  if (!deposit) {
    return NextResponse.json({ error: "Depósito não encontrado." }, { status: 404 });
  }

  const isAdmin = user.role === "ADMIN";
  const allowDevSandbox =
    process.env.NODE_ENV !== "production" &&
    process.env.ALLOW_SANDBOX_CONFIRM === "true";
  const isOwnerSandbox =
    allowDevSandbox &&
    deposit.userId === user.id &&
    deposit.gateway === "SANDBOX";

  if (!isAdmin && !isOwnerSandbox) {
    return NextResponse.json(
      { error: "Aguarde a confirmação automática da Stripe ou contate o suporte." },
      { status: 403 }
    );
  }

  try {
    const result = await confirmDepositAndCredit(
      deposit.id,
      isAdmin
        ? `Confirmado manualmente por ${user.username}`
        : "Confirmado em modo Sandbox local"
    );

    const refreshed = await prisma.user.findUnique({
      where: { id: deposit.userId },
      select: { balance: true },
    });

    return NextResponse.json({
      deposit: result.deposit,
      alreadyPaid: result.alreadyPaid,
      balance: refreshed?.balance ?? 0,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao confirmar depósito." },
      { status: 400 }
    );
  }
}
