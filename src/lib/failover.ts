import { ProviderConfig, submitProviderOrder } from "./smm-provider";

export interface DispatchCandidate {
  provider: ProviderConfig;
  providerServiceId: string;
  source: "primary" | "explicit_fallback" | "auto_compatible";
  priority: number;
}

export interface DispatchAttemptRecord {
  providerId: string;
  providerName: string;
  providerServiceId: string;
  source: DispatchCandidate["source"];
  ok: boolean;
  providerOrderId?: string;
  error?: string;
  durationMs: number;
  triedAt: string;
}

export interface FailoverDispatchResult {
  ok: boolean;
  providerId: string | null;
  providerName: string | null;
  providerOrderId: string | null;
  providerMode: string | null;
  failoverUsed: boolean;
  lastError: string | null;
  attempts: DispatchAttemptRecord[];
}

/**
 * Builds a deduplicated, priority-ordered list of providers to try for an order:
 * 1. Primary provider assigned to the service
 * 2. Explicit backup providers configured in ServiceFallback (ordered by priority ASC)
 * 3. Compatible services on other active providers (same network/metric/type + min/max match)
 */
export function buildDispatchCandidates(params: {
  primary?: { provider: ProviderConfig | null; providerServiceId: string | null };
  explicitFallbacks?: Array<{
    provider: ProviderConfig;
    providerServiceId: string;
    priority: number;
    isActive: boolean;
  }>;
  autoCompatible?: Array<{
    provider: ProviderConfig;
    providerServiceId: string;
    priority: number;
  }>;
}): DispatchCandidate[] {
  const candidates: DispatchCandidate[] = [];
  const seen = new Set<string>();

  const pushUnique = (candidate: DispatchCandidate) => {
    const key = `${candidate.provider.id}:${candidate.providerServiceId}`;
    if (!candidate.providerServiceId || seen.has(key)) return;
    seen.add(key);
    candidates.push(candidate);
  };

  if (params.primary?.provider && params.primary.providerServiceId) {
    pushUnique({
      provider: params.primary.provider,
      providerServiceId: params.primary.providerServiceId,
      source: "primary",
      priority: 0,
    });
  }

  const sortedExplicit = [...(params.explicitFallbacks || [])]
    .filter((f) => f.isActive)
    .sort((a, b) => a.priority - b.priority);

  for (const fb of sortedExplicit) {
    pushUnique({
      provider: fb.provider,
      providerServiceId: fb.providerServiceId,
      source: "explicit_fallback",
      priority: fb.priority,
    });
  }

  const sortedAuto = [...(params.autoCompatible || [])].sort(
    (a, b) => a.priority - b.priority
  );
  for (const auto of sortedAuto) {
    pushUnique({
      provider: auto.provider,
      providerServiceId: auto.providerServiceId,
      source: "auto_compatible",
      priority: 100 + auto.priority,
    });
  }

  return candidates;
}

export async function executeDispatchWithFailover(
  candidates: DispatchCandidate[],
  payload: {
    link: string;
    quantity?: number;
    runs?: number;
    interval?: number;
    comments?: string;
    username?: string;
    answerNumber?: string;
  },
  submitFn: typeof submitProviderOrder = submitProviderOrder
): Promise<FailoverDispatchResult> {
  const attempts: DispatchAttemptRecord[] = [];
  let lastError: string | null = null;

  for (let idx = 0; idx < candidates.length; idx++) {
    const candidate = candidates[idx];
    const started = Date.now();
    try {
      const res = await submitFn(candidate.provider, {
        providerServiceId: candidate.providerServiceId,
        ...payload,
      });

      attempts.push({
        providerId: candidate.provider.id,
        providerName: candidate.provider.name,
        providerServiceId: candidate.providerServiceId,
        source: candidate.source,
        ok: true,
        providerOrderId: res.providerOrderId,
        durationMs: Date.now() - started,
        triedAt: new Date().toISOString(),
      });

      return {
        ok: true,
        providerId: candidate.provider.id,
        providerName: candidate.provider.name,
        providerOrderId: res.providerOrderId,
        providerMode: candidate.provider.mode,
        failoverUsed: idx > 0 || candidate.source !== "primary",
        lastError: null,
        attempts,
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro desconhecido no provedor.";
      lastError = `${candidate.provider.name}: ${message}`;
      attempts.push({
        providerId: candidate.provider.id,
        providerName: candidate.provider.name,
        providerServiceId: candidate.providerServiceId,
        source: candidate.source,
        ok: false,
        error: message,
        durationMs: Date.now() - started,
        triedAt: new Date().toISOString(),
      });
    }
  }

  return {
    ok: false,
    providerId: candidates[0]?.provider.id ?? null,
    providerName: candidates[0]?.provider.name ?? null,
    providerOrderId: null,
    providerMode: candidates[0]?.provider.mode ?? null,
    failoverUsed: false,
    lastError: lastError || "Nenhum provedor ativo configurado para este serviço.",
    attempts,
  };
}
