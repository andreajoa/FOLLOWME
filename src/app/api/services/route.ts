import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get("q")?.trim().toLowerCase() ?? "";
  const network = req.nextUrl.searchParams.get("network")?.trim().toLowerCase() ?? "";

  const [user, categories, services] = await Promise.all([
    getCurrentUser(),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.service.findMany({
      where: { isActive: true, category: { isActive: true } },
      include: {
        category: { select: { id: true, name: true, slug: true, network: true } },
      },
      orderBy: [{ category: { sortOrder: "asc" } }, { id: "asc" }],
    }),
  ]);

  const filtered = services.filter((s) => {
    if (network && network !== "all" && s.category.network !== network) {
      return false;
    }
    if (search) {
      const hay = `${s.id} ${s.name} ${s.category.name} ${s.description}`.toLowerCase();
      return hay.includes(search);
    }
    return true;
  });

  let favoriteIds: number[] = [];
  if (user) {
    const favs = await prisma.favoriteService.findMany({
      where: { userId: user.id },
      select: { serviceId: true },
    });
    favoriteIds = favs.map((f) => f.serviceId);
  }

  return NextResponse.json({
    categories,
    services: filtered.map((s) => ({
      id: s.id,
      categoryId: s.categoryId,
      categoryName: s.category.name,
      network: s.category.network,
      name: s.name,
      type: s.type,
      description: s.description,
      rate: s.rate,
      min: s.min,
      max: s.max,
      averageTime: s.averageTime,
      refill: s.refill,
      refillDays: s.refillDays,
      cancel: s.cancel,
      dripfeed: s.dripfeed,
      isFeatured: s.isFeatured,
    })),
    favoriteIds,
  });
}

const favSchema = z.object({
  serviceId: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Faça login para favoritar serviços." }, { status: 401 });
  }

  const parsed = favSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Serviço inválido." }, { status: 400 });
  }

  const existing = await prisma.favoriteService.findUnique({
    where: {
      userId_serviceId: {
        userId: user.id,
        serviceId: parsed.data.serviceId,
      },
    },
  });

  if (existing) {
    await prisma.favoriteService.delete({ where: { id: existing.id } });
    return NextResponse.json({ favorited: false });
  }

  await prisma.favoriteService.create({
    data: {
      userId: user.id,
      serviceId: parsed.data.serviceId,
    },
  });
  return NextResponse.json({ favorited: true });
}
