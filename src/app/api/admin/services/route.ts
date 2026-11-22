import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const [categories, services, providers] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.service.findMany({
      include: {
        category: { select: { name: true, network: true } },
        provider: { select: { name: true } },
      },
      orderBy: [{ category: { sortOrder: "asc" } }, { id: "asc" }],
    }),
    prisma.provider.findMany({ select: { id: true, name: true, mode: true } }),
  ]);

  return NextResponse.json({ categories, services, providers });
}

const createServiceSchema = z.object({
  categoryId: z.string().min(1),
  providerId: z.string().optional().nullable(),
  providerServiceId: z.string().optional().nullable(),
  name: z.string().trim().min(3).max(200),
  type: z.enum(["DEFAULT", "CUSTOM_COMMENTS", "PACKAGE"]).default("DEFAULT"),
  description: z.string().trim().min(2).max(2000),
  rate: z.coerce.number().positive(),
  providerRate: z.coerce.number().min(0).default(0),
  min: z.coerce.number().int().positive().default(10),
  max: z.coerce.number().int().positive().default(100000),
  averageTime: z.string().trim().max(60).default("15 minutos"),
  refill: z.boolean().default(false),
  refillDays: z.coerce.number().int().min(0).default(30),
  cancel: z.boolean().default(false),
  dripfeed: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const parsed = createServiceSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }

  const service = await prisma.service.create({
    data: {
      ...parsed.data,
      providerId: parsed.data.providerId || null,
      providerServiceId: parsed.data.providerServiceId || null,
    },
  });

  await prisma.serviceUpdate.create({
    data: {
      serviceId: service.id,
      serviceName: service.name,
      type: "NEW",
      details: `Novo serviço adicionado a R$ ${service.rate.toFixed(2)} / 1.000.`,
    },
  });

  return NextResponse.json({ service }, { status: 201 });
}

const patchServiceSchema = z.object({
  id: z.coerce.number().int().positive(),
  rate: z.coerce.number().positive().optional(),
  providerRate: z.coerce.number().min(0).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  refill: z.boolean().optional(),
  name: z.string().trim().min(3).optional(),
});

export async function PATCH(req: NextRequest) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const parsed = patchServiceSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const { id, ...updates } = parsed.data;
  const previous = await prisma.service.findUnique({ where: { id } });
  if (!previous) {
    return NextResponse.json({ error: "Serviço não encontrado." }, { status: 404 });
  }

  const service = await prisma.service.update({
    where: { id },
    data: updates,
  });

  if (updates.rate !== undefined && updates.rate !== previous.rate) {
    await prisma.serviceUpdate.create({
      data: {
        serviceId: service.id,
        serviceName: service.name,
        type: updates.rate < previous.rate ? "RATE_DOWN" : "RATE_UP",
        details: `Valor atualizado de R$ ${previous.rate.toFixed(2)} para R$ ${updates.rate.toFixed(2)} / 1.000.`,
      },
    });
  }

  return NextResponse.json({ service });
}
