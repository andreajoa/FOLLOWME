import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getCurrentUser } from "@/lib/auth";

const cooperationSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(100),
  email: z.string().trim().email("E-mail inválido.").max(120),
  whatsapp: z.string().trim().max(30).optional().nullable(),
  type: z.enum(["SUPPLIER", "RESELLER", "AGENCY", "INFLUENCER"]).default("RESELLER"),
  monthlyVolume: z.string().trim().max(80).optional().nullable(),
  website: z.string().trim().max(200).optional().nullable(),
  message: z.string().trim().min(10, "Descreva sua proposta (mín. 10 caracteres).").max(2000),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const requests = await prisma.cooperationRequest.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ requests });
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  if (!checkRateLimit(`coop:${ip}`, 10, 60_000)) {
    return NextResponse.json(
      { error: "Muitas solicitações. Aguarde um minuto." },
      { status: 429 }
    );
  }

  const user = await getCurrentUser().catch(() => null);
  const parsed = cooperationSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }

  const request = await prisma.cooperationRequest.create({
    data: {
      userId: user?.id ?? null,
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      whatsapp: parsed.data.whatsapp || null,
      type: parsed.data.type,
      monthlyVolume: parsed.data.monthlyVolume || null,
      website: parsed.data.website || null,
      message: parsed.data.message,
      status: "PENDING",
    },
  });

  return NextResponse.json({ request }, { status: 201 });
}
