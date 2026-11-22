import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { cancelAndRefundOrder } from "@/lib/order-service";
import { fetchProviderOrderStatus } from "@/lib/smm-provider";

export async function GET() {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const orders = await prisma.order.findMany({
    include: {
      user: { select: { username: true, email: true } },
      service: { select: { id: true, name: true } },
      provider: { select: { name: true, mode: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 150,
  });

  return NextResponse.json({ orders });
}

const patchOrderSchema = z.object({
  orderId: z.coerce.number().int().positive(),
  action: z.enum(["status", "sync_provider", "refund_cancel", "complete_refill"]),
  status: z
    .enum(["PENDING", "PROCESSING", "IN_PROGRESS", "COMPLETED", "PARTIAL", "CANCELED"])
    .optional(),
  remains: z.coerce.number().int().min(0).optional(),
});

export async function PATCH(req: NextRequest) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const parsed = patchOrderSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 });
  }

  const { orderId, action, status, remains } = parsed.data;

  if (action === "refund_cancel") {
    try {
      const order = await cancelAndRefundOrder(orderId, admin.id, true);
      return NextResponse.json({ order });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Erro ao cancelar." },
        { status: 400 }
      );
    }
  }

  if (action === "complete_refill") {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { refillStatus: "COMPLETED" },
    });
    return NextResponse.json({ order });
  }

  if (action === "sync_provider") {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { provider: true },
    });
    if (!order || !order.provider || !order.providerOrderId) {
      return NextResponse.json(
        { error: "Pedido não vinculado a um provedor externo." },
        { status: 400 }
      );
    }
    const remote = await fetchProviderOrderStatus(order.provider, order.providerOrderId);
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: remote.status,
        startCount: remote.startCount,
        remains: remote.remains,
      },
    });
    return NextResponse.json({ order: updated });
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      ...(status ? { status } : {}),
      ...(remains !== undefined ? { remains } : status === "COMPLETED" ? { remains: 0 } : {}),
    },
  });

  return NextResponse.json({ order: updated });
}
