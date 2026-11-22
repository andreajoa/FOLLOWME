import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { requestProviderRefill } from "@/lib/smm-provider";

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
    return NextResponse.json({ error: "ID de pedido inválido." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { service: true, provider: true },
  });

  if (!order || (order.userId !== user.id && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }

  if (!order.service.refill) {
    return NextResponse.json(
      { error: "Este serviço não possui garantia de reposição." },
      { status: 400 }
    );
  }

  if (order.status !== "COMPLETED" && order.status !== "PARTIAL") {
    return NextResponse.json(
      { error: "Reposição só pode ser solicitada após a conclusão do pedido." },
      { status: 400 }
    );
  }

  if (order.refillStatus === "REQUESTED") {
    return NextResponse.json(
      { error: "Já existe uma solicitação de reposição em andamento para este pedido." },
      { status: 409 }
    );
  }

  if (order.provider && order.providerOrderId && order.provider.isActive) {
    try {
      await requestProviderRefill(order.provider, order.providerOrderId);
    } catch (err) {
      return NextResponse.json(
        {
          error:
            err instanceof Error
              ? err.message
              : "Fornecedor não aceitou reposição no momento.",
        },
        { status: 502 }
      );
    }
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      refillStatus: "REQUESTED",
      refillRequestedAt: new Date(),
    },
  });

  return NextResponse.json({ order: updated });
}
