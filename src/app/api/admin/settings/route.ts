import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";

export async function GET() {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const settings = await getSiteSettings();
  return NextResponse.json({ settings });
}

const settingsSchema = z.object({
  brandName: z.string().trim().min(2).max(40).optional(),
  brandTagline: z.string().trim().min(5).max(200).optional(),
  announcement: z.string().trim().max(400).optional(),
  supportWhatsapp: z.string().trim().max(30).optional(),
  supportEmail: z.string().trim().email().optional(),
  pixGateway: z.enum(["STRIPE", "SANDBOX", "MERCADOPAGO", "ASAAS", "EFI"]).optional(),
  pixKey: z.string().trim().min(3).max(120).optional(),
  pixMerchantName: z.string().trim().min(2).max(25).optional(),
  pixMerchantCity: z.string().trim().min(2).max(15).optional(),
  minDeposit: z.coerce.number().min(5).max(1000).optional(),
  affiliateRate: z.coerce.number().min(0).max(50).optional(),
  affiliateMinPayout: z.coerce.number().min(1).max(5000).optional(),
  defaultMarkup: z.coerce.number().min(0).max(500).optional(),
  childPanelPrice: z.coerce.number().min(1).max(5000).optional(),
  usdRate: z.coerce.number().min(0.5).max(50).optional(),
  eurRate: z.coerce.number().min(0.5).max(50).optional(),
  stripeEnabled: z.boolean().optional(),
  stripePixEnabled: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const parsed = settingsSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Configurações inválidas." },
      { status: 400 }
    );
  }

  const settings = await prisma.siteSetting.upsert({
    where: { id: "default" },
    update: parsed.data,
    create: { id: "default", ...parsed.data },
  });

  return NextResponse.json({
    settings: {
      ...settings,
      atenzaMcpToken: undefined,
      supportWebhookSecret: undefined,
    },
  });
}
