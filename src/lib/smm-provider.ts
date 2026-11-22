import crypto from "crypto";

export interface ProviderConfig {
  id: string;
  name: string;
  apiUrl: string;
  apiKey: string;
  mode: string;
}

export interface RemoteSmmService {
  service: string;
  name: string;
  type: string;
  category: string;
  rate: number;
  min: number;
  max: number;
  refill: boolean;
  cancel: boolean;
  dripfeed: boolean;
}

function assertSafePublicUrl(rawUrl: string): URL {
  const parsed = new URL(rawUrl);
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("URL de provedor deve usar HTTP ou HTTPS.");
  }
  const host = parsed.hostname.toLowerCase();
  const blocked = [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "::1",
    "169.254.169.254",
  ];
  if (
    blocked.includes(host) ||
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  ) {
    throw new Error("Endereços de rede privada/local não são permitidos em modo LIVE.");
  }
  return parsed;
}

async function postSmmApi<T>(
  provider: ProviderConfig,
  params: Record<string, string | number | undefined>
): Promise<T> {
  const url = assertSafePublicUrl(provider.apiUrl);
  const body = new URLSearchParams();
  body.set("key", provider.apiKey);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) {
      body.set(k, String(v));
    }
  }

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    throw new Error(`Provedor ${provider.name} respondeu HTTP ${res.status}.`);
  }

  const data = (await res.json()) as T & { error?: string };
  if (data && typeof data === "object" && "error" in data && data.error) {
    throw new Error(`Erro do provedor ${provider.name}: ${data.error}`);
  }
  return data;
}

export async function fetchProviderBalance(
  provider: ProviderConfig
): Promise<{ balance: number; currency: string }> {
  if (provider.mode === "SIMULATED") {
    return { balance: 18420.5, currency: "BRL" };
  }

  const data = await postSmmApi<{ balance: string | number; currency?: string }>(
    provider,
    { action: "balance" }
  );
  return {
    balance: Number.parseFloat(String(data.balance ?? "0")) || 0,
    currency: String(data.currency ?? "USD"),
  };
}

export async function fetchProviderServices(
  provider: ProviderConfig
): Promise<RemoteSmmService[]> {
  if (provider.mode === "SIMULATED") {
    return [
      {
        service: "9101",
        name: "Instagram Seguidores BR VIP | Perfil Verificado + Stories | 60D",
        type: "Default",
        category: "Instagram — Seguidores Brasileiros & Reais",
        rate: 22.0,
        min: 50,
        max: 40000,
        refill: true,
        cancel: true,
        dripfeed: true,
      },
      {
        service: "9102",
        name: "TikTok Salvamentos + Compartilhamentos FYP | Entrega Instantânea",
        type: "Default",
        category: "TikTok — Seguidores, Views & Curtidas",
        rate: 4.5,
        min: 100,
        max: 250000,
        refill: false,
        cancel: true,
        dripfeed: true,
      },
      {
        service: "9103",
        name: "YouTube Shorts Visualizações Brasileiras | Alta Retenção",
        type: "Default",
        category: "YouTube — Inscritos, Views & Horas de Exibição",
        rate: 7.2,
        min: 100,
        max: 500000,
        refill: true,
        cancel: true,
        dripfeed: true,
      },
    ];
  }

  const rawList = await postSmmApi<Array<Record<string, unknown>>>(provider, {
    action: "services",
  });

  if (!Array.isArray(rawList)) {
    throw new Error("Resposta inválida de serviços do provedor.");
  }

  return rawList.map((item) => ({
    service: String(item.service ?? ""),
    name: String(item.name ?? "Serviço sem nome"),
    type: String(item.type ?? "Default"),
    category: String(item.category ?? "Importados"),
    rate: Number.parseFloat(String(item.rate ?? "0")) || 0,
    min: Number.parseInt(String(item.min ?? "10"), 10) || 10,
    max: Number.parseInt(String(item.max ?? "100000"), 10) || 100000,
    refill: Boolean(item.refill),
    cancel: Boolean(item.cancel),
    dripfeed: Boolean(item.dripfeed),
  }));
}

export async function submitProviderOrder(
  provider: ProviderConfig,
  payload: {
    providerServiceId: string;
    link: string;
    quantity: number;
    runs?: number;
    interval?: number;
    comments?: string;
  }
): Promise<{ providerOrderId: string }> {
  if (provider.mode === "SIMULATED") {
    const suffix = crypto.randomInt(100000, 999999);
    return { providerOrderId: `SIM-${suffix}` };
  }

  const data = await postSmmApi<{ order: string | number }>(provider, {
    action: "add",
    service: payload.providerServiceId,
    link: payload.link,
    quantity: payload.quantity,
    runs: payload.runs,
    interval: payload.interval,
    comments: payload.comments,
  });

  if (!data.order) {
    throw new Error("Provedor não retornou ID do pedido.");
  }

  return { providerOrderId: String(data.order) };
}

export async function fetchProviderOrderStatus(
  provider: ProviderConfig,
  providerOrderId: string
): Promise<{
  status: string;
  startCount: number;
  remains: number;
}> {
  if (provider.mode === "SIMULATED") {
    return {
      status: "COMPLETED",
      startCount: 1200,
      remains: 0,
    };
  }

  const data = await postSmmApi<{
    status?: string;
    start_count?: string | number;
    remains?: string | number;
  }>(provider, {
    action: "status",
    order: providerOrderId,
  });

  const normalized = normalizeExternalStatus(String(data.status ?? "Pending"));
  return {
    status: normalized,
    startCount: Number.parseInt(String(data.start_count ?? "0"), 10) || 0,
    remains: Number.parseInt(String(data.remains ?? "0"), 10) || 0,
  };
}

export async function requestProviderRefill(
  provider: ProviderConfig,
  providerOrderId: string
): Promise<{ refillId: string }> {
  if (provider.mode === "SIMULATED") {
    return { refillId: `SIM-REF-${crypto.randomInt(10000, 99999)}` };
  }
  const data = await postSmmApi<{ refill?: string | number }>(provider, {
    action: "refill",
    order: providerOrderId,
  });
  return { refillId: String(data.refill ?? "OK") };
}

export async function cancelProviderOrder(
  provider: ProviderConfig,
  providerOrderId: string
): Promise<boolean> {
  if (provider.mode === "SIMULATED") {
    return true;
  }
  await postSmmApi<unknown>(provider, {
    action: "cancel",
    orders: providerOrderId,
  });
  return true;
}

export function normalizeExternalStatus(rawStatus: string): string {
  const s = rawStatus.trim().toLowerCase();
  if (s === "completed") return "COMPLETED";
  if (s === "in progress" || s === "in_progress") return "IN_PROGRESS";
  if (s === "processing") return "PROCESSING";
  if (s === "partial") return "PARTIAL";
  if (s === "canceled" || s === "cancelled" || s === "refunded") return "CANCELED";
  return "PENDING";
}

export function toExternalSmmStatus(internalStatus: string): string {
  switch (internalStatus) {
    case "COMPLETED":
      return "Completed";
    case "IN_PROGRESS":
      return "In progress";
    case "PROCESSING":
      return "Processing";
    case "PARTIAL":
      return "Partial";
    case "CANCELED":
      return "Canceled";
    default:
      return "Pending";
  }
}
