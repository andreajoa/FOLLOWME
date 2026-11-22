import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createSubscriptionOrder } from "@/lib/order-service";

const createSubSchema = z.object({
  serviceId: z.coerce.number().int().positive(),
  username: z.string().trim().min(2, "Informe o @usuário.").max(120),
  min: z.coerce.number().int().positive(),
  max: z.coerce.number().int().positive(),
  posts: z.coerce.number().int().positive().max(1000).optional().nullable(),
  oldPosts: z.coerce.number().int().min(0).max(100).optional().default(0),
  delay: z.coerce.number().int().min(0).max(600).optional().default(0),
  expiry: z.string().optional().nullable(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const subscriptions = await prisma.subscription.findMany({
    where: { userId: user.id },
    include: {
      service: {
        select: { id: true, name: true, rate: true, min: true, max: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ subscriptions });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Faça login para criar assinatura." }, { status: 401 });
  }

  const parsed = createSubSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }

  try {
    const expiryDate = parsed.data.expiry ? new Date(parsed.data.expiry) : null;
    if (expiryDate && Number.isNaN(expiryDate.getTime())) {
      return NextResponse.json({ error: "Data de expiração inválida." }, { status: 400 });
    }

    const subscription = await createSubscriptionOrder({
      userId: user.id,
      serviceId: parsed.data.serviceId,
      username: parsed.data.username,
      min: parsed.data.min,
      max: parsed.data.max,
      posts: parsed.data.posts ?? undefined,
      oldPosts: parsed.data.oldPosts,
      delay: parsed.data.delay,
      expiry: expiryDate,
    });

    const refreshed = await prisma.user.findUnique({
      where: { id: user.id },
      select: { balance: true },
    });

    return NextResponse.json(
      { subscription, balance: refreshed?.balance ?? user.balance },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao criar assinatura." },
      { status: 400 }
    );
  }
}
