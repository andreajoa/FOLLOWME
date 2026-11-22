import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { cancelAndRefundOrder } from "@/lib/order-service";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await context.params;
  const orderId = Number.parseInt(id, 10);
  if (!Number.isInteger(orderId)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  try {
    const order = await cancelAndRefundOrder(orderId, user.id, user.role === "ADMIN");
    const refreshed = await prisma.user.findUnique({
      where: { id: user.id },
      select: { balance: true },
    });
    return NextResponse.json({ order, balance: refreshed?.balance ?? user.balance });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Não foi possível cancelar." },
      { status: 400 }
    );
  }
}
