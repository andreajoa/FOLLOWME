import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redispatchOrderToProvider } from "@/lib/order-service";

export const dynamic = "force-dynamic";

const redispatchSchema = z.object({
  action: z.literal("redispatch"),
  orderId: z.coerce.number().int().positive(),
  providerId: z.string().min(1),
  providerServiceId: z.string().trim().max(80).optional(),
});

const addFallbackSchema = z.object({
  action: z.literal("add_fallback"),
  serviceId: z.coerce.number().int().positive(),
  providerId: z.string().min(1),
  providerServiceId: z.string().trim().min(1).max(80),
  priority: z.coerce.number().int().min(1).max(99).default(1),
});

const removeFallbackSchema = z.object({
  action: z.literal("remove_fallback"),
  fallbackId: z.string().min(1),
});

const prioritySchema = z.object({
  action: z.literal("update_provider_priority"),
  providerId: z.string().min(1),
  priority: z.coerce.number().int().min(1).max(99),
});

export async function POST(req: NextRequest) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const action = String(body?.action || "");

  if (action === "redispatch") {
    const parsed = redispatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos para reenvio." },
        { status: 400 }
      );
    }
    try {
      const order = await redispatchOrderToProvider(parsed.data);
      return NextResponse.json({ ok: true, order });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Falha ao reenviar pedido." },
        { status: 400 }
      );
    }
  }

  if (action === "add_fallback") {
    const parsed = addFallbackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos para fallback." },
        { status: 400 }
      );
    }
    const { serviceId, providerId, providerServiceId, priority } = parsed.data;
    const fallback = await prisma.serviceFallback.upsert({
      where: { serviceId_providerId: { serviceId, providerId } },
      update: { providerServiceId, priority, isActive: true },
      create: { serviceId, providerId, providerServiceId, priority, isActive: true },
      include: {
        provider: { select: { id: true, name: true, mode: true } },
        service: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json({ ok: true, fallback });
  }

  if (action === "remove_fallback") {
    const parsed = removeFallbackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "fallbackId inválido." }, { status: 400 });
    }
    await prisma.serviceFallback.delete({ where: { id: parsed.data.fallbackId } });
    return NextResponse.json({ ok: true });
  }

  if (action === "update_provider_priority") {
    const parsed = prioritySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Prioridade inválida." }, { status: 400 });
    }
    const provider = await prisma.provider.update({
      where: { id: parsed.data.providerId },
      data: { priority: parsed.data.priority },
    });
    return NextResponse.json({ ok: true, provider: { id: provider.id, priority: provider.priority } });
  }

  return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
}
