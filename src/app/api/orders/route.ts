import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { placeSingleOrder } from "@/lib/order-service";

const createOrderSchema = z.object({
  serviceId: z.coerce.number().int().positive(),
  link: z.string().trim().min(3, "Informe o link ou @perfil.").max(500),
  quantity: z.coerce.number().int().positive().optional().default(1),
  dripfeed: z.boolean().optional().default(false),
  runs: z.coerce.number().int().min(2).max(100).optional(),
  interval: z.coerce.number().int().min(5).max(1440).optional(),
  comments: z.string().max(5000).optional(),
});

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const status = req.nextUrl.searchParams.get("status")?.trim().toUpperCase();
  const q = req.nextUrl.searchParams.get("q")?.trim().toLowerCase() ?? "";

  const orders = await prisma.order.findMany({
    where: {
      userId: user.id,
      ...(status && status !== "ALL" ? { status } : {}),
    },
    include: {
      service: {
        select: {
          id: true,
          name: true,
          refill: true,
          refillDays: true,
          cancel: true,
          category: { select: { name: true, network: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const filtered = q
    ? orders.filter((o) =>
        `${o.id} ${o.link} ${o.service.name}`.toLowerCase().includes(q)
      )
    : orders;

  return NextResponse.json({ orders: filtered });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Faça login para enviar pedidos." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados do pedido inválidos." },
        { status: 400 }
      );
    }

    const order = await placeSingleOrder({
      userId: user.id,
      ...parsed.data,
      source: "WEB",
    });

    const refreshed = await prisma.user.findUnique({
      where: { id: user.id },
      select: { balance: true, totalSpent: true },
    });

    return NextResponse.json(
      { order, balance: refreshed?.balance ?? user.balance },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao criar pedido.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
