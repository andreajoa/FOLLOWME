import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { applyMarkup } from "@/lib/pricing";
import { inferMetricType, suggestUsMarketRate } from "@/lib/i18n";
import {
  fetchProviderBalance,
  fetchProviderServices,
  RemoteSmmService,
} from "@/lib/smm-provider";

function slugifyCategory(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

function inferNetwork(name: string): string {
  const low = name.toLowerCase();
  if (low.includes("instagram") || low.includes("reel")) return "instagram";
  if (low.includes("tiktok")) return "tiktok";
  if (low.includes("youtube")) return "youtube";
  if (low.includes("facebook")) return "facebook";
  return "other";
}

async function upsertRemoteService(
  provider: { id: string; name: string; currencyRate: number; markupPercent: number },
  remote: RemoteSmmService,
  overrides?: {
    customRateBrl?: number;
    customRateUsd?: number;
    customNamePt?: string;
    customNameEn?: string;
  }
) {
  const slug = slugifyCategory(remote.category) || "importados";
  const network = inferNetwork(`${remote.category} ${remote.name}`);
  const metricType = inferMetricType(remote.name, remote.type);
  const category = await prisma.category.upsert({
    where: { slug },
    update: {},
    create: {
      name: remote.category.slice(0, 90),
      nameEn: remote.category.slice(0, 90),
      slug,
      network,
      sortOrder: 50,
    },
  });

  const { convertedCost, sellRate } = applyMarkup(
    remote.rate,
    provider.currencyRate,
    provider.markupPercent
  );

  const finalRateBrl =
    overrides?.customRateBrl && overrides.customRateBrl > 0
      ? overrides.customRateBrl
      : sellRate;
  const finalRateUsd =
    overrides?.customRateUsd && overrides.customRateUsd > 0
      ? overrides.customRateUsd
      : suggestUsMarketRate(finalRateBrl, network, metricType);

  const existing = await prisma.service.findFirst({
    where: {
      providerId: provider.id,
      providerServiceId: remote.service,
    },
  });

  if (existing) {
    await prisma.service.update({
      where: { id: existing.id },
      data: {
        rate: finalRateBrl,
        rateUsd: finalRateUsd,
        providerRate: convertedCost,
        metricType,
        nameEn: overrides?.customNameEn || existing.nameEn || remote.name.slice(0, 180),
        min: remote.min,
        max: remote.max,
        refill: remote.refill,
        cancel: remote.cancel,
        dripfeed: remote.dripfeed,
      },
    });
    return "updated" as const;
  }

  await prisma.service.create({
    data: {
      categoryId: category.id,
      providerId: provider.id,
      providerServiceId: remote.service,
      name: (overrides?.customNamePt || remote.name).slice(0, 180),
      nameEn: (overrides?.customNameEn || remote.name).slice(0, 180),
      metricType,
      type: remote.type.toLowerCase().includes("comment")
        ? "CUSTOM_COMMENTS"
        : "DEFAULT",
      description: `Sincronizado automaticamente via ${provider.name} (ID externo #${remote.service}).`,
      descriptionEn: `Automated delivery via global provider (ID #${remote.service}). No password required.`,
      rate: finalRateBrl,
      rateUsd: finalRateUsd,
      providerRate: convertedCost,
      min: remote.min,
      max: remote.max,
      refill: remote.refill,
      cancel: remote.cancel,
      dripfeed: remote.dripfeed,
      isActive: true,
    },
  });
  return "imported" as const;
}

export async function GET() {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const providers = await prisma.provider.findMany({
    include: { _count: { select: { services: true, orders: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    providers: providers.map((p) => ({
      ...p,
      apiKeyMasked:
        p.apiKey.length > 8
          ? `${p.apiKey.slice(0, 4)}••••${p.apiKey.slice(-4)}`
          : "••••",
      apiKey: undefined,
    })),
  });
}

const createProviderSchema = z.object({
  name: z.string().trim().min(2).max(80),
  apiUrl: z.string().trim().url("URL da API inválida."),
  apiKey: z.string().trim().min(3, "Informe a API Key do fornecedor."),
  mode: z.enum(["LIVE", "SIMULATED"]).default("LIVE"),
  markupPercent: z.coerce.number().min(0).max(500).default(40),
  currencyRate: z.coerce.number().min(0.01).max(100).default(1),
});

export async function POST(req: NextRequest) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const body = await req.json();

  if (body.action === "preview" && typeof body.providerId === "string") {
    const provider = await prisma.provider.findUnique({
      where: { id: body.providerId },
    });
    if (!provider) {
      return NextResponse.json({ error: "Provedor não encontrado." }, { status: 404 });
    }

    try {
      const [balanceRes, remoteServices] = await Promise.all([
        fetchProviderBalance(provider),
        fetchProviderServices(provider),
      ]);

      await prisma.provider.update({
        where: { id: provider.id },
        data: {
          cachedBalance: balanceRes.balance,
          cachedCurrency: balanceRes.currency,
        },
      });

      const query = String(body.query || "").trim().toLowerCase();
      const networkFilter = String(body.network || "all").toLowerCase();

      const filtered = remoteServices
        .filter((r) => {
          const net = inferNetwork(`${r.category} ${r.name}`);
          if (networkFilter !== "all" && net !== networkFilter) return false;
          if (query) {
            const hay = `${r.service} ${r.name} ${r.category}`.toLowerCase();
            if (!hay.includes(query)) return false;
          }
          return true;
        })
        .slice(0, 120)
        .map((r) => {
          const network = inferNetwork(`${r.category} ${r.name}`);
          const metricType = inferMetricType(r.name, r.type);
          const { convertedCost, sellRate } = applyMarkup(
            r.rate,
            provider.currencyRate,
            provider.markupPercent
          );
          return {
            ...r,
            network,
            metricType,
            convertedCostBrl: convertedCost,
            suggestedRateBrl: sellRate,
            suggestedRateUsd: suggestUsMarketRate(sellRate, network, metricType),
          };
        });

      return NextResponse.json({
        balance: balanceRes.balance,
        currency: balanceRes.currency,
        totalRemote: remoteServices.length,
        services: filtered,
      });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Falha ao consultar catálogo remoto." },
        { status: 502 }
      );
    }
  }

  if (
    body.action === "import_selected" &&
    typeof body.providerId === "string" &&
    Array.isArray(body.serviceIds)
  ) {
    const provider = await prisma.provider.findUnique({
      where: { id: body.providerId },
    });
    if (!provider) {
      return NextResponse.json({ error: "Provedor não encontrado." }, { status: 404 });
    }

    const wanted = new Set(body.serviceIds.map((id: unknown) => String(id)));
    if (wanted.size === 0) {
      return NextResponse.json(
        { error: "Selecione ao menos um serviço para importar." },
        { status: 400 }
      );
    }

    try {
      const [balanceRes, remoteServices] = await Promise.all([
        fetchProviderBalance(provider),
        fetchProviderServices(provider),
      ]);

      let imported = 0;
      let updated = 0;
      for (const remote of remoteServices) {
        if (!wanted.has(remote.service)) continue;
        const result = await upsertRemoteService(provider, remote);
        if (result === "imported") imported += 1;
        else updated += 1;
      }

      await prisma.provider.update({
        where: { id: provider.id },
        data: {
          cachedBalance: balanceRes.balance,
          cachedCurrency: balanceRes.currency,
          lastSyncedAt: new Date(),
        },
      });

      return NextResponse.json({
        synced: true,
        imported,
        updated,
        balance: balanceRes.balance,
        currency: balanceRes.currency,
      });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Falha na importação seletiva." },
        { status: 502 }
      );
    }
  }

  if (body.action === "sync" && typeof body.providerId === "string") {
    const provider = await prisma.provider.findUnique({
      where: { id: body.providerId },
    });
    if (!provider) {
      return NextResponse.json({ error: "Provedor não encontrado." }, { status: 404 });
    }

    try {
      const [balanceRes, remoteServices] = await Promise.all([
        fetchProviderBalance(provider),
        fetchProviderServices(provider),
      ]);

      let imported = 0;
      let updated = 0;

      for (const remote of remoteServices.slice(0, 80)) {
        const result = await upsertRemoteService(provider, remote);
        if (result === "imported") imported += 1;
        else updated += 1;
      }

      await prisma.provider.update({
        where: { id: provider.id },
        data: {
          cachedBalance: balanceRes.balance,
          cachedCurrency: balanceRes.currency,
          lastSyncedAt: new Date(),
        },
      });

      return NextResponse.json({
        synced: true,
        imported,
        updated,
        balance: balanceRes.balance,
        currency: balanceRes.currency,
      });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Falha na sincronização." },
        { status: 502 }
      );
    }
  }

  const parsed = createProviderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }

  const provider = await prisma.provider.create({
    data: parsed.data,
  });

  return NextResponse.json({ provider: { ...provider, apiKey: undefined } }, { status: 201 });
}
