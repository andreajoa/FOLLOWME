"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Bell,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  Globe,
  Layers,
  Mail,
  MessageCircle,
  Monitor,
  MousePointerClick,
  Plus,
  RefreshCw,
  Repeat,
  Search,
  Send,
  Server,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tablet,
  Trash2,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import {
  DEPOSIT_STATUS_META,
  formatBRL,
  formatInt,
  ORDER_STATUS_META,
  PAYMENT_METHOD_LABELS,
} from "@/lib/format";
import { StatusBadge } from "./status-badge";

type RangeOption = "day" | "month" | "year";
type DashboardTab =
  | "overview"
  | "orders"
  | "payments"
  | "failover"
  | "notifications";

interface DispatchAttempt {
  providerId: string;
  providerName: string;
  providerServiceId: string;
  source: string;
  ok: boolean;
  providerOrderId?: string;
  error?: string;
  durationMs: number;
  triedAt: string;
}

interface DashboardOrder {
  id: number;
  userId: string;
  userName: string;
  username: string;
  userEmail: string;
  link: string;
  profileHandle: string;
  serviceId: number;
  serviceName: string;
  network: string;
  quantity: number;
  charge: number;
  cost: number;
  profit: number;
  status: string;
  createdAt: string;
  createdAtBrt: string;
  paidAt: string | null;
  paidAtBrt: string | null;
  paidAmount: number | null;
  paidCurrency: string | null;
  paidMethod: string | null;
  providerId: string | null;
  providerName: string | null;
  providerMode: string | null;
  providerOrderId: string | null;
  failoverUsed: boolean;
  lastError: string | null;
  dispatchAttempts: DispatchAttempt[];
}

interface DashboardPayment {
  id: string;
  txid: string;
  userName: string;
  username: string;
  userEmail: string;
  amount: number;
  amountBrl: number;
  currency: string;
  method: string;
  status: string;
  paidAt: string | null;
  paidAtBrt: string | null;
  createdAt: string;
  createdAtBrt: string;
  latestOrder: {
    id: number;
    serviceName: string;
    link: string;
    profileHandle: string;
    quantity: number;
    status: string;
  } | null;
}

interface DashboardProvider {
  id: string;
  name: string;
  mode: string;
  priority: number;
  cachedBalance: number;
  cachedCurrency: string;
  isActive: boolean;
  lastSyncedAt: string | null;
  servicesCount: number;
  ordersCount: number;
  fallbacksCount: number;
}

interface DashboardFallback {
  id: string;
  serviceId: number;
  serviceName: string;
  network: string;
  providerId: string;
  providerName: string;
  providerMode: string;
  providerActive: boolean;
  providerServiceId: string;
  priority: number;
  isActive: boolean;
}

interface DashboardServiceOption {
  id: number;
  name: string;
  network: string;
  providerId: string | null;
  providerName: string | null;
  providerServiceId: string | null;
}

interface DashboardNotification {
  id: string;
  kind: string;
  referenceId: string | null;
  recipientEmail: string | null;
  recipientPhone: string | null;
  emailOk: boolean;
  emailError: string | null;
  whatsappOk: boolean;
  whatsappProvider: string | null;
  whatsappError: string | null;
  summary: string;
  createdAtBrt: string;
}

interface OverviewPayload {
  range: RangeOption;
  generatedAtBrt: string;
  traffic: {
    day: { visitors: number; pageviews: number; clicks: number };
    month: { visitors: number; pageviews: number; clicks: number };
    year: { visitors: number; pageviews: number; clicks: number };
    range: {
      visitors: number;
      pageviews: number;
      clicks: number;
      clickers: number;
    };
  };
  revenue: {
    dayBrl: number;
    monthBrl: number;
    yearBrl: number;
    rangeBrl: number;
    paidCountDay: number;
    paidCountMonth: number;
    paidCountYear: number;
    paidCountRange: number;
    avgTicketBrl: number;
    conversionRate: number;
    profitRangeBrl: number;
  };
  operations: {
    ordersDayCount: number;
    ordersMonthCount: number;
    ordersYearCount: number;
    ordersRangeCount: number;
    failoverSavedCount: number;
    failedOrdersCount: number;
    totalUsersCount: number;
    activeProvidersCount: number;
    fallbackRoutesCount: number;
  };
  funnel: Array<{ step: string; value: number }>;
  series: Array<{
    bucket: string;
    visitors: number;
    clicks: number;
    orders: number;
    revenueBrl: number;
  }>;
  clickHotspots: Array<{
    label: string;
    area: string;
    path: string;
    href: string | null;
    clicks: number;
    uniqueVisitors: number;
    sharePercent: number;
  }>;
  topPages: Array<{
    path: string;
    views: number;
    clicks: number;
    uniqueVisitors: number;
  }>;
  topSources: Array<{
    source: string;
    views: number;
    visitors: number;
  }>;
  devices: Array<{
    device: string;
    visitors: number;
    percent: number;
  }>;
  countries: Array<{
    country: string;
    views: number;
    visitors: number;
  }>;
  orders: DashboardOrder[];
  payments: DashboardPayment[];
  providers: DashboardProvider[];
  fallbacks: DashboardFallback[];
  services: DashboardServiceOption[];
  notifications: DashboardNotification[];
  channels: {
    ownerPhone: string;
    ownerEmails: string[];
    hasResend: boolean;
    hasWaha: boolean;
    hasAtenzaMcp: boolean;
  };
}

const RANGE_LABELS: Record<RangeOption, string> = {
  day: "Hoje (Dia)",
  month: "Este Mês",
  year: "Este Ano",
};

const ORDER_STATUS_FILTERS = [
  { value: "ALL", label: "Todos" },
  { value: "FAILED", label: "Falhas" },
  { value: "PENDING", label: "Pendentes" },
  { value: "PROCESSING", label: "Processando" },
  { value: "IN_PROGRESS", label: "Em Andamento" },
  { value: "COMPLETED", label: "Concluídos" },
  { value: "PARTIAL", label: "Parciais" },
  { value: "CANCELED", label: "Cancelados" },
];

const NOTIFICATION_KIND_META: Record<string, { label: string; cls: string }> = {
  PAYMENT: {
    label: "Pagamento",
    cls: "border-[#10B981]/40 bg-[#10B981]/15 text-[#34D399]",
  },
  ORDER: {
    label: "Solicitação",
    cls: "border-[#38BDF8]/40 bg-[#38BDF8]/15 text-[#38BDF8]",
  },
  PROVIDER_FAILOVER: {
    label: "Failover Salvo",
    cls: "border-[#F8D449]/40 bg-[#F8D449]/15 text-[#F8D449]",
  },
  PROVIDER_FAILED: {
    label: "Falha Provedor",
    cls: "border-[#EF4444]/40 bg-[#EF4444]/15 text-[#F87171]",
  },
  TEST: {
    label: "Teste",
    cls: "border-[#A78BFA]/40 bg-[#7C3EE9]/20 text-[#C4B5FD]",
  },
};

function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 13 && digits.startsWith("55")) {
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }
  return `+${digits}`;
}

function safeExternalUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("@")) {
    return `https://instagram.com/${trimmed.slice(1)}`;
  }
  if (/^[a-z0-9.-]+\.[a-z]{2,}/i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return null;
}

export function OwnerDashboardClient() {
  const [range, setRange] = useState<RangeOption>("month");
  const [tab, setTab] = useState<DashboardTab>("overview");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [chartMode, setChartMode] = useState<"traffic" | "revenue">("traffic");
  const [hoveredBucket, setHoveredBucket] = useState<number | null>(null);

  const [data, setData] = useState<OverviewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );
  const [copiedKey, setCopiedKey] = useState<string>("");
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  // Test alert state
  const [testingAlert, setTestingAlert] = useState(false);

  // Redispatch modal state
  const [redispatchOrder, setRedispatchOrder] = useState<DashboardOrder | null>(null);
  const [redispatchProviderId, setRedispatchProviderId] = useState("");
  const [redispatchProviderServiceId, setRedispatchProviderServiceId] = useState("");
  const [redispatchBusy, setRedispatchBusy] = useState(false);

  // Add fallback route state
  const [fbServiceId, setFbServiceId] = useState("");
  const [fbProviderId, setFbProviderId] = useState("");
  const [fbProviderServiceId, setFbProviderServiceId] = useState("");
  const [fbPriority, setFbPriority] = useState("1");
  const [fbBusy, setFbBusy] = useState(false);

  // Provider priority edit state
  const [priorityDrafts, setPriorityDrafts] = useState<Record<string, string>>({});
  const [savingPriorityId, setSavingPriorityId] = useState<string>("");

  const flash = useCallback((type: "ok" | "err", text: string) => {
    setNotice({ type, text });
  }, []);

  const loadOverview = useCallback(
    async (silent = false) => {
      if (silent) setRefreshing(true);
      else setLoading(true);
      try {
        const params = new URLSearchParams({
          range,
          status: statusFilter,
        });
        if (searchQuery.trim()) {
          params.set("q", searchQuery.trim());
        }
        const res = await fetch(`/api/dashboard/overview?${params.toString()}`, {
          cache: "no-store",
        });
        const json = await res.json().catch(() => null);
        if (!res.ok || !json) {
          flash("err", json?.error || "Não foi possível carregar os dados do dashboard.");
          return;
        }
        setData(json as OverviewPayload);
        setPriorityDrafts((prev) => {
          const next = { ...prev };
          for (const p of (json as OverviewPayload).providers) {
            if (next[p.id] === undefined) {
              next[p.id] = String(p.priority);
            }
          }
          return next;
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [range, statusFilter, searchQuery, flash]
  );

  useEffect(() => {
    loadOverview(false);
  }, [loadOverview]);

  // Debounce order search
  useEffect(() => {
    const id = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 280);
    return () => clearTimeout(id);
  }, [searchInput]);

  async function handleCopy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((curr) => (curr === key ? "" : curr)), 1600);
    } catch {
      flash("err", "Não foi possível copiar para a área de transferência.");
    }
  }

  async function handleTestAlert() {
    setTestingAlert(true);
    setNotice(null);
    try {
      const res = await fetch("/api/dashboard/test-alert", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        flash("err", json.error || "Falha ao disparar teste de alerta.");
        return;
      }
      const emailStatus = json.email?.ok
        ? "E-mail OK"
        : `E-mail falhou (${json.email?.error || "erro"})`;
      const waStatus = json.whatsapp?.ok
        ? `WhatsApp +${json.recipientPhone} OK`
        : `WhatsApp falhou (${json.whatsapp?.error || "erro"})`;
      flash(
        json.email?.ok && json.whatsapp?.ok ? "ok" : "err",
        `Teste enviado: ${emailStatus} · ${waStatus}`
      );
      await loadOverview(true);
    } finally {
      setTestingAlert(false);
    }
  }

  function openRedispatchModal(order: DashboardOrder) {
    setRedispatchOrder(order);
    const activeProviders = data?.providers.filter((p) => p.isActive) || [];
    const alternative =
      activeProviders.find((p) => p.id !== order.providerId) || activeProviders[0];
    setRedispatchProviderId(alternative?.id || "");
    const matchingFb = data?.fallbacks.find(
      (f) => f.serviceId === order.serviceId && f.providerId === alternative?.id
    );
    setRedispatchProviderServiceId(matchingFb?.providerServiceId || "");
  }

  async function handleRedispatchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!redispatchOrder || !redispatchProviderId) return;
    setRedispatchBusy(true);
    try {
      const res = await fetch("/api/dashboard/failover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "redispatch",
          orderId: redispatchOrder.id,
          providerId: redispatchProviderId,
          providerServiceId: redispatchProviderServiceId.trim() || undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        flash("err", json.error || "Falha ao reenviar pedido para o provedor escolhido.");
        return;
      }
      flash(
        "ok",
        `Pedido #${redispatchOrder.id} reenviado com sucesso via novo provedor!`
      );
      setRedispatchOrder(null);
      await loadOverview(true);
    } finally {
      setRedispatchBusy(false);
    }
  }

  async function handleAddFallback(e: React.FormEvent) {
    e.preventDefault();
    if (!fbServiceId || !fbProviderId || !fbProviderServiceId.trim()) {
      flash("err", "Selecione o serviço, o provedor reserva e o ID do serviço no provedor.");
      return;
    }
    setFbBusy(true);
    try {
      const res = await fetch("/api/dashboard/failover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_fallback",
          serviceId: Number(fbServiceId),
          providerId: fbProviderId,
          providerServiceId: fbProviderServiceId.trim(),
          priority: Number(fbPriority) || 1,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        flash("err", json.error || "Erro ao salvar rota de failover.");
        return;
      }
      flash("ok", "Rota de provedor reserva cadastrada e ativa para failover automático!");
      setFbProviderServiceId("");
      await loadOverview(true);
    } finally {
      setFbBusy(false);
    }
  }

  async function handleRemoveFallback(fallbackId: string) {
    const res = await fetch("/api/dashboard/failover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove_fallback", fallbackId }),
    });
    if (res.ok) {
      flash("ok", "Rota de failover removida.");
      await loadOverview(true);
    } else {
      flash("err", "Não foi possível remover a rota.");
    }
  }

  async function handleSaveProviderPriority(providerId: string) {
    const val = Number(priorityDrafts[providerId]);
    if (!Number.isFinite(val) || val < 1 || val > 99) {
      flash("err", "Prioridade deve ser um número entre 1 e 99 (menor = maior prioridade).");
      return;
    }
    setSavingPriorityId(providerId);
    try {
      const res = await fetch("/api/dashboard/failover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_provider_priority",
          providerId,
          priority: Math.round(val),
        }),
      });
      if (!res.ok) {
        flash("err", "Falha ao atualizar prioridade do provedor.");
        return;
      }
      flash("ok", "Prioridade do provedor atualizada.");
      await loadOverview(true);
    } finally {
      setSavingPriorityId("");
    }
  }

  const chartStats = useMemo(() => {
    const pts = data?.series || [];
    const maxPrimary = Math.max(
      1,
      ...pts.map((p) => (chartMode === "traffic" ? p.visitors : p.revenueBrl))
    );
    const maxSecondary = Math.max(
      1,
      ...pts.map((p) => (chartMode === "traffic" ? p.clicks : p.orders))
    );
    return { pts, maxPrimary, maxSecondary };
  }, [data, chartMode]);

  const maxFunnelValue = useMemo(() => {
    return Math.max(1, ...(data?.funnel.map((f) => f.value) || [1]));
  }, [data]);

  if (loading && !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 rounded-2xl border border-[#2e244d] bg-[#16102b]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-32 rounded-2xl border border-[#2e244d] bg-[#16102b]"
            />
          ))}
        </div>
        <div className="h-72 rounded-2xl border border-[#2e244d] bg-[#16102b]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-[#EF4444]/40 bg-[#18122d] p-8 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-[#F87171]" />
        <h2 className="mt-3 text-lg font-bold text-white">
          Não foi possível carregar o Dashboard
        </h2>
        <p className="mt-1 text-sm text-[#b7afc9]">
          {notice?.text || "Verifique sua sessão de administrador e tente novamente."}
        </p>
        <button
          type="button"
          onClick={() => loadOverview(false)}
          className="mt-4 btn-lime inline-flex h-10 items-center gap-2 px-5 text-xs uppercase font-mono cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Tentar novamente
        </button>
      </div>
    );
  }

  const whatsappReady = data.channels.hasWaha || data.channels.hasAtenzaMcp;
  const emailReady = data.channels.hasResend;

  return (
    <div className="space-y-6">
      {/* Executive Command Header */}
      <section className="rounded-2xl border border-[#2e244d] bg-gradient-to-br from-[#191233] via-[#140e28] to-[#110c21] p-5 sm:p-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f8d449]/40 bg-[#f8d449]/12 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-[#f8d449]">
                <Sparkles className="h-3 w-3" />
                Central Executiva · Tempo Real
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2e244d] bg-[#110c21]/80 px-2.5 py-0.5 font-mono text-[10px] text-[#b7afc9]">
                <Clock className="h-3 w-3 text-[#38bdf8]" />
                BRT: {data.generatedAtBrt}
              </span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-white">
              Painel de Inteligência, Pedidos & Failover
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#b7afc9]">
              Acompanhe quem pagou, perfil do Instagram, horário exato, visitantes (dia/mês/ano),
              cliques e failover multi-provedor com alertas imediatos no e-mail e WhatsApp.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Period Switcher */}
            <div className="inline-flex rounded-xl border border-[#342859] bg-[#110c21] p-1">
              {(["day", "month", "year"] as RangeOption[]).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setRange(opt)}
                  className={`rounded-lg px-3 py-1.5 font-mono text-[11px] font-semibold uppercase transition-colors cursor-pointer ${
                    range === opt
                      ? "bg-[#f8d449] text-[#110c21] font-bold"
                      : "text-[#b7afc9] hover:text-white"
                  }`}
                >
                  {RANGE_LABELS[opt]}
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={testingAlert}
              onClick={handleTestAlert}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#10B981]/50 bg-[#10B981]/15 px-3.5 font-mono text-[11px] font-bold uppercase text-[#34D399] hover:bg-[#10B981]/25 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              {testingAlert ? "Enviando..." : "Testar Alerta WA + E-mail"}
            </button>

            <button
              type="button"
              disabled={refreshing}
              onClick={() => loadOverview(true)}
              className="btn-outline inline-flex h-9 items-center gap-1.5 px-3 font-mono text-[11px] uppercase cursor-pointer"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
              />
              Atualizar
            </button>

            <Link
              href="/admin"
              className="btn-outline inline-flex h-9 items-center gap-1.5 px-3 font-mono text-[11px] uppercase"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-[#fc8ad4]" />
              Admin
            </Link>
          </div>
        </div>

        {/* Live Channel Status Strip */}
        <div className="mt-4 pt-4 border-t border-[#2e244d]/80 flex flex-wrap items-center gap-3 font-mono text-[11px]">
          <div
            className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 ${
              whatsappReady
                ? "border-[#10B981]/40 bg-[#10B981]/10 text-[#34D399]"
                : "border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[#FBBF24]"
            }`}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            WhatsApp:{" "}
            <strong className="tabular-nums">
              {formatPhoneDisplay(data.channels.ownerPhone)}
            </strong>
            <span>{whatsappReady ? "• ATIVO" : "• CONFIGURAR WAHA"}</span>
          </div>

          <div
            className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 ${
              emailReady
                ? "border-[#38BDF8]/40 bg-[#38BDF8]/10 text-[#38BDF8]"
                : "border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[#FBBF24]"
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            E-mail Alertas:{" "}
            <strong>
              {data.channels.ownerEmails[0] || "Admin"}
              {data.channels.ownerEmails.length > 1
                ? ` (+${data.channels.ownerEmails.length - 1})`
                : ""}
            </strong>
            <span>{emailReady ? "• RESEND OK" : "• SEM RESEND"}</span>
          </div>

          <div className="inline-flex items-center gap-2 rounded-lg border border-[#342859] bg-[#110c21]/70 px-2.5 py-1 text-[#c9bfe3]">
            <Server className="h-3.5 w-3.5 text-[#a78bfa]" />
            Provedores Ativos: <strong>{data.operations.activeProvidersCount}</strong> · Rotas
            Reserva: <strong>{data.operations.fallbackRoutesCount}</strong>
          </div>
        </div>
      </section>

      {/* Notice Feedback */}
      {notice && (
        <div
          className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 font-mono text-xs ${
            notice.type === "ok"
              ? "border-[#10B981]/40 bg-[#10B981]/12 text-[#34D399]"
              : "border-[#EF4444]/40 bg-[#EF4444]/12 text-[#F87171]"
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === "ok" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <ShieldAlert className="h-4 w-4 shrink-0" />
            )}
            <span>{notice.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-current opacity-70 hover:opacity-100 cursor-pointer"
            aria-label="Fechar aviso"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Critical Failed Dispatch Alert Banner */}
      {data.operations.failedOrdersCount > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#EF4444]/50 bg-[#EF4444]/12 px-4 py-3.5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-[#F87171] shrink-0" />
            <div>
              <p className="text-sm font-bold text-[#FCA5A5]">
                {data.operations.failedOrdersCount} solicitação(ões) com falha de envio no
                provedor
              </p>
              <p className="text-xs text-[#FECACA]/85">
                Nenhuma venda foi perdida. Clique ao lado para despachar em 1 clique por outro
                provedor reserva.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setStatusFilter("FAILED");
              setTab("orders");
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#EF4444] px-3.5 font-mono text-xs font-bold uppercase text-white hover:bg-[#DC2626] cursor-pointer shrink-0"
          >
            <Repeat className="h-3.5 w-3.5" />
            Reenviar Falhas Agora
          </button>
        </div>
      )}

      {/* KPI Strip — Day / Month / Year always visible */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Visitors Day / Month / Year */}
        <div className="rounded-2xl border border-[#2e244d] bg-[#16102b] p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#9d92ba]">
              Visitantes Únicos ({RANGE_LABELS[range]})
            </span>
            <Users className="h-4 w-4 text-[#38BDF8]" />
          </div>
          <div className="mt-2 font-mono text-3xl font-black text-white tabular-nums">
            {formatInt(data.traffic.range.visitors)}
          </div>
          <div className="mt-1 font-mono text-[11px] text-[#9d92ba] tabular-nums">
            {formatInt(data.traffic.range.pageviews)} visualizações ·{" "}
            {formatInt(data.traffic.range.clicks)} cliques
          </div>
          <div className="mt-3 pt-3 border-t border-[#281f45] grid grid-cols-3 gap-2 font-mono text-[10px]">
            <div>
              <div className="text-[#8b80a6]">HOJE</div>
              <div className="mt-0.5 font-bold text-[#38BDF8] tabular-nums">
                {formatInt(data.traffic.day.visitors)}
              </div>
            </div>
            <div>
              <div className="text-[#8b80a6]">MÊS</div>
              <div className="mt-0.5 font-bold text-[#e5d4ff] tabular-nums">
                {formatInt(data.traffic.month.visitors)}
              </div>
            </div>
            <div>
              <div className="text-[#8b80a6]">ANO</div>
              <div className="mt-0.5 font-bold text-[#f8d449] tabular-nums">
                {formatInt(data.traffic.year.visitors)}
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Revenue Paid Day / Month / Year */}
        <div className="rounded-2xl border border-[#2e244d] bg-[#16102b] p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#9d92ba]">
              Receita Paga ({RANGE_LABELS[range]})
            </span>
            <CreditCard className="h-4 w-4 text-[#34D399]" />
          </div>
          <div className="mt-2 font-mono text-3xl font-black text-[#34D399] tabular-nums">
            {formatBRL(data.revenue.rangeBrl)}
          </div>
          <div className="mt-1 font-mono text-[11px] text-[#9d92ba] tabular-nums">
            {formatInt(data.revenue.paidCountRange)} pagamentos · Ticket{" "}
            {formatBRL(data.revenue.avgTicketBrl)}
          </div>
          <div className="mt-3 pt-3 border-t border-[#281f45] grid grid-cols-3 gap-2 font-mono text-[10px]">
            <div>
              <div className="text-[#8b80a6]">HOJE</div>
              <div className="mt-0.5 font-bold text-[#34D399] tabular-nums">
                {formatBRL(data.revenue.dayBrl)}
              </div>
            </div>
            <div>
              <div className="text-[#8b80a6]">MÊS</div>
              <div className="mt-0.5 font-bold text-[#e5d4ff] tabular-nums">
                {formatBRL(data.revenue.monthBrl)}
              </div>
            </div>
            <div>
              <div className="text-[#8b80a6]">ANO</div>
              <div className="mt-0.5 font-bold text-[#f8d449] tabular-nums">
                {formatBRL(data.revenue.yearBrl)}
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Requests / Orders & Net Profit */}
        <div className="rounded-2xl border border-[#2e244d] bg-[#16102b] p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#9d92ba]">
              Solicitações & Lucro
            </span>
            <TrendingUp className="h-4 w-4 text-[#f8d449]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2.5">
            <span className="font-mono text-3xl font-black text-white tabular-nums">
              {formatInt(data.operations.ordersRangeCount)}
            </span>
            <span className="font-mono text-xs font-bold text-[#f8d449] tabular-nums">
              Lucro {formatBRL(data.revenue.profitRangeBrl)}
            </span>
          </div>
          <div className="mt-1 font-mono text-[11px] text-[#9d92ba] tabular-nums">
            Conversão: <strong className="text-white">{data.revenue.conversionRate}%</strong>{" "}
            (visitantes → pagamento)
          </div>
          <div className="mt-3 pt-3 border-t border-[#281f45] grid grid-cols-3 gap-2 font-mono text-[10px]">
            <div>
              <div className="text-[#8b80a6]">HOJE</div>
              <div className="mt-0.5 font-bold text-white tabular-nums">
                {formatInt(data.operations.ordersDayCount)}
              </div>
            </div>
            <div>
              <div className="text-[#8b80a6]">MÊS</div>
              <div className="mt-0.5 font-bold text-white tabular-nums">
                {formatInt(data.operations.ordersMonthCount)}
              </div>
            </div>
            <div>
              <div className="text-[#8b80a6]">ANO</div>
              <div className="mt-0.5 font-bold text-white tabular-nums">
                {formatInt(data.operations.ordersYearCount)}
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Multi-Provider Failover & Reliability */}
        <div className="rounded-2xl border border-[#2e244d] bg-[#16102b] p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#9d92ba]">
              Motor Multi-Provedor
            </span>
            <Layers className="h-4 w-4 text-[#fc8ad4]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2.5">
            <span className="font-mono text-3xl font-black text-white tabular-nums">
              {data.operations.activeProvidersCount}
            </span>
            <span className="font-mono text-xs text-[#b7afc9]">provedor(es) ativos</span>
          </div>
          <div className="mt-1 font-mono text-[11px] text-[#9d92ba] tabular-nums">
            {data.operations.fallbackRoutesCount} rotas reserva configuradas
          </div>
          <div className="mt-3 pt-3 border-t border-[#281f45] grid grid-cols-2 gap-2 font-mono text-[10px]">
            <div>
              <div className="text-[#8b80a6]">FAILOVERS SALVOS</div>
              <div className="mt-0.5 font-bold text-[#34D399] tabular-nums">
                {formatInt(data.operations.failoverSavedCount)}
              </div>
            </div>
            <div>
              <div className="text-[#8b80a6]">FALHAS PENDENTES</div>
              <div
                className={`mt-0.5 font-bold tabular-nums ${
                  data.operations.failedOrdersCount > 0
                    ? "text-[#F87171]"
                    : "text-[#34D399]"
                }`}
              >
                {formatInt(data.operations.failedOrdersCount)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <nav
        aria-label="Seções do Dashboard"
        className="flex flex-wrap items-center gap-2 border-b border-[#2e244d] pb-3"
      >
        {[
          {
            id: "overview" as DashboardTab,
            label: "Tráfego, Cliques & Funil",
            icon: Activity,
            badge: formatInt(data.traffic.range.clicks),
          },
          {
            id: "orders" as DashboardTab,
            label: "Solicitações & Perfis",
            icon: Layers,
            badge: String(data.orders.length),
            alert: data.operations.failedOrdersCount > 0,
          },
          {
            id: "payments" as DashboardTab,
            label: "Pagamentos Confirmados",
            icon: CreditCard,
            badge: String(data.payments.filter((p) => p.status === "PAID").length),
          },
          {
            id: "failover" as DashboardTab,
            label: "Provedores & Failover",
            icon: Repeat,
            badge: String(data.fallbacks.length),
          },
          {
            id: "notifications" as DashboardTab,
            label: "Alertas E-mail + WhatsApp",
            icon: Bell,
            badge: String(data.notifications.length),
          },
        ].map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3.5 font-mono text-xs font-semibold transition-colors cursor-pointer ${
                active
                  ? "border-[#f8d449] bg-[#f8d449] text-[#110c21] font-bold"
                  : "border-[#2e244d] bg-[#16102b] text-[#c9bfe3] hover:border-[#7c3ee9] hover:text-white"
              }`}
            >
              <item.icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
              <span
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                  item.alert
                    ? "bg-[#EF4444] text-white"
                    : active
                      ? "bg-[#110c21]/15 text-[#110c21]"
                      : "bg-[#241b40] text-[#b7afc9]"
                }`}
              >
                {item.badge}
              </span>
            </button>
          );
        })}
      </nav>

      {/* ═══════════════════════ TAB 1: OVERVIEW (TRAFFIC, CLICKS, FUNNEL) ═══════════════════════ */}
      {tab === "overview" && (
        <div className="space-y-6">
          {/* Interactive Chart + Conversion Funnel */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
            {/* Time-series chart (8 cols) */}
            <div className="xl:col-span-8 rounded-2xl border border-[#2e244d] bg-[#16102b] p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#9d92ba]">
                    Linha do Tempo · {RANGE_LABELS[range]} (Horário de Brasília)
                  </span>
                  <h2 className="mt-0.5 text-base font-bold text-white">
                    {chartMode === "traffic"
                      ? "Visitantes Únicos vs Cliques no Site"
                      : "Receita Paga (R$) vs Solicitações"}
                  </h2>
                </div>
                <div className="inline-flex rounded-lg border border-[#342859] bg-[#110c21] p-0.5 font-mono text-[11px]">
                  <button
                    type="button"
                    onClick={() => setChartMode("traffic")}
                    className={`rounded-md px-2.5 py-1 cursor-pointer ${
                      chartMode === "traffic"
                        ? "bg-[#38BDF8]/20 text-[#38BDF8] font-bold"
                        : "text-[#9d92ba] hover:text-white"
                    }`}
                  >
                    Visitantes & Cliques
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMode("revenue")}
                    className={`rounded-md px-2.5 py-1 cursor-pointer ${
                      chartMode === "revenue"
                        ? "bg-[#34D399]/20 text-[#34D399] font-bold"
                        : "text-[#9d92ba] hover:text-white"
                    }`}
                  >
                    Receita & Pedidos
                  </button>
                </div>
              </div>

              {/* Hovered readout bar */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#281f45] bg-[#110c21]/75 px-3.5 py-2 font-mono text-[11px]">
                {hoveredBucket !== null && chartStats.pts[hoveredBucket] ? (
                  <>
                    <span className="font-bold text-[#f8d449]">
                      Período: {chartStats.pts[hoveredBucket].bucket}
                    </span>
                    <div className="flex flex-wrap items-center gap-4 tabular-nums">
                      <span className="text-[#38BDF8]">
                        Visitantes: <strong>{chartStats.pts[hoveredBucket].visitors}</strong>
                      </span>
                      <span className="text-[#a78bfa]">
                        Cliques: <strong>{chartStats.pts[hoveredBucket].clicks}</strong>
                      </span>
                      <span className="text-[#34D399]">
                        Receita:{" "}
                        <strong>
                          {formatBRL(chartStats.pts[hoveredBucket].revenueBrl)}
                        </strong>
                      </span>
                      <span className="text-[#f8d449]">
                        Pedidos: <strong>{chartStats.pts[hoveredBucket].orders}</strong>
                      </span>
                    </div>
                  </>
                ) : (
                  <span className="text-[#8b80a6]">
                    Passe o mouse sobre qualquer barra para ver visitantes, cliques, pedidos e
                    receita exata do período.
                  </span>
                )}
              </div>

              {/* Bar + Overlay Chart */}
              <div className="mt-4 h-56 flex items-end gap-1 pt-4 overflow-x-auto">
                {chartStats.pts.map((pt, idx) => {
                  const primaryVal =
                    chartMode === "traffic" ? pt.visitors : pt.revenueBrl;
                  const secondaryVal =
                    chartMode === "traffic" ? pt.clicks : pt.orders;
                  const primaryPct = Math.max(
                    primaryVal > 0 ? 6 : 2,
                    Math.round((primaryVal / chartStats.maxPrimary) * 100)
                  );
                  const secondaryPct = Math.max(
                    secondaryVal > 0 ? 6 : 2,
                    Math.round((secondaryVal / chartStats.maxSecondary) * 100)
                  );
                  const showLabel =
                    chartStats.pts.length <= 12 ||
                    idx % (chartStats.pts.length > 24 ? 3 : 2) === 0 ||
                    idx === chartStats.pts.length - 1;

                  return (
                    <div
                      key={pt.bucket}
                      onMouseEnter={() => setHoveredBucket(idx)}
                      onMouseLeave={() => setHoveredBucket(null)}
                      className="flex-1 min-w-[16px] h-full flex flex-col justify-end items-center group cursor-pointer"
                    >
                      <div className="w-full flex-1 flex items-end justify-center gap-[2px] px-[1px]">
                        <div
                          style={{ height: `${primaryPct}%` }}
                          className={`w-1/2 rounded-t-sm transition-all ${
                            chartMode === "traffic"
                              ? "bg-[#38BDF8]/80 group-hover:bg-[#38BDF8]"
                              : "bg-[#34D399]/80 group-hover:bg-[#34D399]"
                          }`}
                        />
                        <div
                          style={{ height: `${secondaryPct}%` }}
                          className={`w-1/2 rounded-t-sm transition-all ${
                            chartMode === "traffic"
                              ? "bg-[#8c42ed]/75 group-hover:bg-[#a78bfa]"
                              : "bg-[#f8d449]/75 group-hover:bg-[#f8d449]"
                          }`}
                        />
                      </div>
                      <span
                        className={`mt-1.5 font-mono text-[9px] tabular-nums ${
                          hoveredBucket === idx
                            ? "text-[#f8d449] font-bold"
                            : "text-[#7d7299]"
                        }`}
                      >
                        {showLabel ? pt.bucket : ""}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 flex items-center gap-5 font-mono text-[11px] text-[#b7afc9]">
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className={`h-2.5 w-2.5 rounded-xs ${
                      chartMode === "traffic" ? "bg-[#38BDF8]" : "bg-[#34D399]"
                    }`}
                  />
                  {chartMode === "traffic" ? "Visitantes Únicos" : "Receita Paga (R$)"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className={`h-2.5 w-2.5 rounded-xs ${
                      chartMode === "traffic" ? "bg-[#8c42ed]" : "bg-[#f8d449]"
                    }`}
                  />
                  {chartMode === "traffic" ? "Cliques no Site" : "Solicitações"}
                </span>
              </div>
            </div>

            {/* Conversion Funnel (4 cols) */}
            <div className="xl:col-span-4 rounded-2xl border border-[#2e244d] bg-[#16102b] p-5 flex flex-col justify-between">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#9d92ba]">
                  Funil de Otimização
                </span>
                <h2 className="mt-0.5 text-base font-bold text-white">
                  Da Visita ao Pagamento
                </h2>

                <div className="mt-4 space-y-3.5">
                  {data.funnel.map((stage, idx) => {
                    const widthPct = Math.max(
                      stage.value > 0 ? 8 : 2,
                      Math.round((stage.value / maxFunnelValue) * 100)
                    );
                    const prevValue = idx > 0 ? data.funnel[idx - 1].value : null;
                    const stepRate =
                      prevValue && prevValue > 0
                        ? Math.round((stage.value / prevValue) * 100)
                        : null;
                    const colors = [
                      "bg-[#38BDF8]",
                      "bg-[#8c42ed]",
                      "bg-[#a78bfa]",
                      "bg-[#34D399]",
                      "bg-[#f8d449]",
                    ];
                    return (
                      <div key={stage.step}>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-[#e5d4ff]">
                            {idx + 1}. {stage.step}
                          </span>
                          <span className="font-mono font-bold text-white tabular-nums">
                            {formatInt(stage.value)}
                            {stepRate !== null && (
                              <span className="ml-1.5 text-[10px] text-[#9d92ba]">
                                ({stepRate}%)
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="mt-1.5 h-2.5 w-full rounded-full bg-[#241b40] overflow-hidden">
                          <div
                            style={{ width: `${widthPct}%` }}
                            className={`h-full rounded-full ${colors[idx] || "bg-[#7c3ee9]"}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Devices Split */}
              <div className="mt-6 pt-4 border-t border-[#281f45]">
                <div className="font-mono text-[10px] uppercase tracking-widest text-[#9d92ba] mb-2.5">
                  Dispositivos dos Visitantes
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {data.devices.map((d) => {
                    const Icon =
                      d.device === "mobile"
                        ? Smartphone
                        : d.device === "tablet"
                          ? Tablet
                          : Monitor;
                    return (
                      <div
                        key={d.device}
                        className="rounded-xl border border-[#281f45] bg-[#110c21]/70 p-2.5 text-center"
                      >
                        <Icon className="mx-auto h-3.5 w-3.5 text-[#a78bfa]" />
                        <div className="mt-1 font-mono text-xs font-bold text-white tabular-nums">
                          {d.percent}%
                        </div>
                        <div className="font-mono text-[10px] uppercase text-[#8b80a6]">
                          {d.device}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Where Users Clicked (Hotspots) + Top Pages / Sources / Countries */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
            {/* Click Map Table (7 cols) */}
            <div className="xl:col-span-7 rounded-2xl border border-[#2e244d] bg-[#16102b] overflow-hidden">
              <div className="p-5 border-b border-[#281f45] flex items-center justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#f8d449]">
                    Mapa de Cliques (Onde os Clientes Clicam)
                  </span>
                  <h3 className="mt-0.5 text-base font-bold text-white">
                    Botões, Pacotes e Links Mais Clicados
                  </h3>
                </div>
                <MousePointerClick className="h-5 w-5 text-[#f8d449]" />
              </div>

              {data.clickHotspots.length === 0 ? (
                <div className="p-8 text-center font-mono text-xs text-[#8b80a6]">
                  Ainda não há cliques registrados neste período. Assim que visitantes clicarem no
                  site, cada botão e link aparecerá aqui em tempo real.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-[#281f45] bg-[#120d24] font-mono text-[10px] uppercase tracking-wider text-[#9d92ba]">
                      <tr>
                        <th className="px-4 py-3">Elemento / Botão</th>
                        <th className="px-4 py-3">Área · Página</th>
                        <th className="px-4 py-3 text-right">Cliques</th>
                        <th className="px-4 py-3 text-right">Únicos</th>
                        <th className="px-4 py-3 text-right">Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#241b40]">
                      {data.clickHotspots.map((item, idx) => (
                        <tr
                          key={`${item.label}-${item.area}-${item.path}-${idx}`}
                          className="hover:bg-[#1e1638]/70 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="font-semibold text-white max-w-[260px] truncate">
                              {item.label}
                            </div>
                            {item.href && (
                              <div className="font-mono text-[10px] text-[#8b80a6] max-w-[260px] truncate">
                                → {item.href}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-block rounded-md border border-[#342859] bg-[#110c21] px-2 py-0.5 font-mono text-[10px] text-[#c4b5fd]">
                              {item.area}
                            </span>
                            <div className="mt-0.5 font-mono text-[10px] text-[#8b80a6]">
                              {item.path}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-[#f8d449] tabular-nums">
                            {formatInt(item.clicks)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-[#c9bfe3] tabular-nums">
                            {formatInt(item.uniqueVisitors)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-2">
                              <div className="w-14 h-1.5 rounded-full bg-[#241b40] overflow-hidden">
                                <div
                                  style={{ width: `${Math.min(100, item.sharePercent)}%` }}
                                  className="h-full bg-[#f8d449]"
                                />
                              </div>
                              <span className="font-mono text-[10px] text-[#b7afc9] tabular-nums w-9 text-right">
                                {item.sharePercent}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Right Column: Top Pages + Sources + Countries (5 cols) */}
            <div className="xl:col-span-5 space-y-5">
              {/* Top Pages */}
              <div className="rounded-2xl border border-[#2e244d] bg-[#16102b] p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-white">Páginas Mais Visitadas</h3>
                  <Globe className="h-4 w-4 text-[#38BDF8]" />
                </div>
                {data.topPages.length === 0 ? (
                  <p className="font-mono text-xs text-[#8b80a6]">
                    Sem visitas registradas neste período.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {data.topPages.slice(0, 8).map((p) => (
                      <div
                        key={p.path}
                        className="flex items-center justify-between gap-2 rounded-lg border border-[#261d42] bg-[#110c21]/70 px-3 py-2 font-mono text-xs"
                      >
                        <span className="truncate text-[#e5d4ff]">{p.path}</span>
                        <span className="shrink-0 text-[11px] text-[#9d92ba] tabular-nums">
                          <strong className="text-[#38BDF8]">{p.uniqueVisitors}</strong> ún ·{" "}
                          {p.views} views · {p.clicks} cliques
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sources & Countries side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-[#2e244d] bg-[#16102b] p-4">
                  <h3 className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#9d92ba] mb-3">
                    Origens / UTM
                  </h3>
                  {data.topSources.length === 0 ? (
                    <p className="font-mono text-xs text-[#7d7299]">Sem dados.</p>
                  ) : (
                    <div className="space-y-2">
                      {data.topSources.slice(0, 6).map((s) => (
                        <div
                          key={s.source}
                          className="flex items-center justify-between gap-2 text-xs"
                        >
                          <span className="truncate text-[#e5d4ff]">{s.source}</span>
                          <span className="font-mono text-[11px] font-bold text-[#34D399] tabular-nums">
                            {s.visitors}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-[#2e244d] bg-[#16102b] p-4">
                  <h3 className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#9d92ba] mb-3">
                    Países (Cloudflare)
                  </h3>
                  {data.countries.length === 0 ? (
                    <p className="font-mono text-xs text-[#7d7299]">Sem dados.</p>
                  ) : (
                    <div className="space-y-2">
                      {data.countries.slice(0, 6).map((c) => (
                        <div
                          key={c.country}
                          className="flex items-center justify-between gap-2 text-xs"
                        >
                          <span className="font-mono font-bold text-white">{c.country}</span>
                          <span className="font-mono text-[11px] text-[#38BDF8] tabular-nums">
                            {c.visitors} ún ({c.views})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Preview of Latest 6 Requests right on Overview */}
          <div className="rounded-2xl border border-[#2e244d] bg-[#16102b] overflow-hidden">
            <div className="p-5 border-b border-[#281f45] flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#34D399]">
                  Últimas Solicitações em Tempo Real
                </span>
                <h3 className="mt-0.5 text-base font-bold text-white">
                  Quem Pediu, E-mail, Perfil do Instagram, Valor e Horário do Pagamento
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTab("orders")}
                className="inline-flex items-center gap-1 font-mono text-xs font-bold text-[#f8d449] hover:underline cursor-pointer"
              >
                Ver todas as solicitações
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#281f45] bg-[#120d24] font-mono text-[10px] uppercase text-[#9d92ba]">
                  <tr>
                    <th className="px-4 py-3">Pedido</th>
                    <th className="px-4 py-3">Cliente · E-mail</th>
                    <th className="px-4 py-3">Perfil / Link</th>
                    <th className="px-4 py-3">Serviço · Qtd</th>
                    <th className="px-4 py-3 text-right">Valor</th>
                    <th className="px-4 py-3">Pago em (BRT)</th>
                    <th className="px-4 py-3">Status · Provedor</th>
                    <th className="px-4 py-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#241b40]">
                  {data.orders.slice(0, 6).map((ord) => {
                    const st = ORDER_STATUS_META[ord.status] || {
                      label: ord.status,
                      tone: "zinc" as const,
                    };
                    const extUrl = safeExternalUrl(ord.link);
                    return (
                      <tr key={ord.id} className="hover:bg-[#1e1638]/70">
                        <td className="px-4 py-3 font-mono font-bold text-white">
                          #{ord.id}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white">{ord.userName}</div>
                          <div className="font-mono text-[11px] text-[#9d92ba]">
                            {ord.userEmail}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-mono font-bold text-[#38BDF8]">
                            {ord.profileHandle}
                          </div>
                          {extUrl ? (
                            <a
                              href={extUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-mono text-[10px] text-[#9d92ba] hover:text-white max-w-[200px] truncate"
                            >
                              {ord.link}
                              <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                            </a>
                          ) : (
                            <div className="font-mono text-[10px] text-[#9d92ba] max-w-[200px] truncate">
                              {ord.link}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-white max-w-[220px] truncate">
                            {ord.serviceName}
                          </div>
                          <div className="font-mono text-[11px] text-[#f8d449] tabular-nums">
                            {formatInt(ord.quantity)} unid.
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-[#34D399] tabular-nums">
                          {formatBRL(ord.charge)}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-[#e5d4ff] tabular-nums">
                          {ord.paidAtBrt || ord.createdAtBrt}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge label={st.label} tone={st.tone} />
                          <div className="mt-1 font-mono text-[10px] text-[#9d92ba]">
                            {ord.providerName || "Sem provedor"}
                            {ord.failoverUsed && (
                              <span className="ml-1 text-[#f8d449] font-bold">
                                · FAILOVER
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => openRedispatchModal(ord)}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#342859] bg-[#110c21] px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase text-[#f8d449] hover:border-[#f8d449] cursor-pointer"
                          >
                            <Repeat className="h-3 w-3" />
                            Reenviar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {data.orders.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-8 text-center font-mono text-xs text-[#8b80a6]"
                      >
                        Nenhuma solicitação encontrada ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════ TAB 2: ALL ORDERS & REQUESTS ═══════════════════════ */}
      {tab === "orders" && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-2xl border border-[#2e244d] bg-[#16102b] p-4">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b80a6]" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar por e-mail, @instagram, link, nome ou #ID..."
                className="input-terminal h-10 w-full pl-9 pr-3 text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {ORDER_STATUS_FILTERS.map((st) => (
                <button
                  key={st.value}
                  type="button"
                  onClick={() => setStatusFilter(st.value)}
                  className={`rounded-lg border px-2.5 py-1.5 font-mono text-[11px] uppercase cursor-pointer transition-colors ${
                    statusFilter === st.value
                      ? st.value === "FAILED"
                        ? "border-[#EF4444] bg-[#EF4444] text-white font-bold"
                        : "border-[#f8d449] bg-[#f8d449] text-[#110c21] font-bold"
                      : "border-[#2e244d] bg-[#110c21] text-[#b7afc9] hover:text-white"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#2e244d] bg-[#16102b] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#281f45] bg-[#120d24] font-mono text-[10px] uppercase text-[#9d92ba]">
                  <tr>
                    <th className="px-4 py-3">#ID · Pedido</th>
                    <th className="px-4 py-3">Cliente · E-mail</th>
                    <th className="px-4 py-3">Perfil Instagram / Link</th>
                    <th className="px-4 py-3">Solicitado</th>
                    <th className="px-4 py-3 text-right">Pago · Lucro</th>
                    <th className="px-4 py-3">Data / Hora Pagamento</th>
                    <th className="px-4 py-3">Provedor · Status</th>
                    <th className="px-4 py-3 text-right">Failover Manual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#241b40]">
                  {data.orders.map((ord) => {
                    const st = ORDER_STATUS_META[ord.status] || {
                      label: ord.status,
                      tone: "zinc" as const,
                    };
                    const extUrl = safeExternalUrl(ord.link);
                    const isExpanded = expandedOrderId === ord.id;
                    return (
                      <tr
                        key={ord.id}
                        className={`align-top transition-colors ${
                          ord.status === "FAILED"
                            ? "bg-[#EF4444]/6 hover:bg-[#EF4444]/10"
                            : "hover:bg-[#1e1638]/70"
                        }`}
                      >
                        <td className="px-4 py-3.5">
                          <div className="font-mono font-bold text-white">#{ord.id}</div>
                          <div className="mt-0.5 font-mono text-[10px] text-[#8b80a6] tabular-nums">
                            {ord.createdAtBrt}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-white">{ord.userName}</div>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <span className="font-mono text-[11px] text-[#b7afc9]">
                              {ord.userEmail}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(ord.userEmail, `email-${ord.id}`)}
                              title="Copiar e-mail"
                              className="text-[#8b80a6] hover:text-white cursor-pointer"
                            >
                              {copiedKey === `email-${ord.id}` ? (
                                <Check className="h-3 w-3 text-[#34D399]" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                          <div className="font-mono text-[10px] text-[#7d7299]">
                            @{ord.username}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-[#38BDF8]">
                              {ord.profileHandle}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(ord.link, `link-${ord.id}`)}
                              title="Copiar link"
                              className="text-[#8b80a6] hover:text-white cursor-pointer"
                            >
                              {copiedKey === `link-${ord.id}` ? (
                                <Check className="h-3 w-3 text-[#34D399]" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                          {extUrl ? (
                            <a
                              href={extUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-0.5 inline-flex items-center gap-1 font-mono text-[10px] text-[#9d92ba] hover:text-[#38BDF8] max-w-[230px] truncate"
                            >
                              {ord.link}
                              <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                            </a>
                          ) : (
                            <div className="mt-0.5 font-mono text-[10px] text-[#9d92ba] max-w-[230px] truncate">
                              {ord.link}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-medium text-white max-w-[220px]">
                            {ord.serviceName}
                          </div>
                          <div className="mt-0.5 font-mono text-[11px] font-bold text-[#f8d449] tabular-nums">
                            {formatInt(ord.quantity)} unidades
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-right font-mono tabular-nums">
                          <div className="font-bold text-[#34D399]">
                            {formatBRL(ord.charge)}
                          </div>
                          <div className="text-[10px] text-[#9d92ba]">
                            Lucro {formatBRL(ord.profit)}
                          </div>
                        </td>

                        <td className="px-4 py-3.5 font-mono text-[11px] tabular-nums">
                          {ord.paidAtBrt ? (
                            <>
                              <div className="font-semibold text-white">
                                {ord.paidAtBrt}
                              </div>
                              <div className="text-[10px] text-[#34D399]">
                                Depósito {formatBRL(ord.paidAmount || 0)} ·{" "}
                                {PAYMENT_METHOD_LABELS[ord.paidMethod || ""] ||
                                  ord.paidMethod ||
                                  "Stripe"}
                              </div>
                            </>
                          ) : (
                            <div className="text-[#8b80a6]">
                              Saldo interno / Admin
                              <div className="text-[10px]">{ord.createdAtBrt}</div>
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <StatusBadge label={st.label} tone={st.tone} />
                          <div className="mt-1 font-mono text-[10px] text-[#c9bfe3]">
                            {ord.providerName || "Sem provedor"}
                            {ord.providerOrderId && (
                              <span className="text-[#8b80a6]">
                                {" "}
                                (#{ord.providerOrderId})
                              </span>
                            )}
                          </div>
                          {ord.failoverUsed && (
                            <span className="mt-1 inline-block rounded border border-[#f8d449]/40 bg-[#f8d449]/15 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-[#f8d449]">
                              Failover Ativado
                            </span>
                          )}
                          {ord.lastError && (
                            <div className="mt-1 font-mono text-[10px] text-[#F87171] max-w-[220px] break-words">
                              Erro: {ord.lastError}
                            </div>
                          )}
                          {ord.dispatchAttempts.length > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedOrderId(isExpanded ? null : ord.id)
                              }
                              className="mt-1 block font-mono text-[10px] text-[#38BDF8] hover:underline cursor-pointer"
                            >
                              {isExpanded
                                ? "Ocultar log de tentativas"
                                : `Ver ${ord.dispatchAttempts.length} tentativa(s)`}
                            </button>
                          )}
                          {isExpanded && ord.dispatchAttempts.length > 0 && (
                            <div className="mt-2 space-y-1 rounded-lg border border-[#2e244d] bg-[#110c21] p-2 font-mono text-[10px]">
                              {ord.dispatchAttempts.map((att, idx) => (
                                <div
                                  key={`${att.providerId}-${idx}`}
                                  className={
                                    att.ok ? "text-[#34D399]" : "text-[#F87171]"
                                  }
                                >
                                  {idx + 1}. {att.providerName} (srv {att.providerServiceId}) →{" "}
                                  {att.ok
                                    ? `OK #${att.providerOrderId} (${att.durationMs}ms)`
                                    : `FALHA: ${att.error} (${att.durationMs}ms)`}
                                </div>
                              ))}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => openRedispatchModal(ord)}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-[10px] font-bold uppercase cursor-pointer transition-colors ${
                              ord.status === "FAILED"
                                ? "border-[#EF4444] bg-[#EF4444] text-white hover:bg-[#DC2626]"
                                : "border-[#f8d449]/40 bg-[#f8d449]/10 text-[#f8d449] hover:bg-[#f8d449]/20"
                            }`}
                          >
                            <Repeat className="h-3 w-3" />
                            Trocar / Reenviar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {data.orders.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-10 text-center font-mono text-xs text-[#8b80a6]"
                      >
                        Nenhuma solicitação corresponde ao filtro atual.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════ TAB 3: PAYMENTS (DEPOSITS) ═══════════════════════ */}
      {tab === "payments" && (
        <div className="rounded-2xl border border-[#2e244d] bg-[#16102b] overflow-hidden">
          <div className="p-5 border-b border-[#281f45]">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#34D399]">
              Histórico Financeiro Real (Stripe Pix & Cartão)
            </span>
            <h2 className="mt-0.5 text-base font-bold text-white">
              Quem Pagou, Quanto Pagou, Data e Hora Exata (Brasília)
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#281f45] bg-[#120d24] font-mono text-[10px] uppercase text-[#9d92ba]">
                <tr>
                  <th className="px-4 py-3">Cliente · E-mail</th>
                  <th className="px-4 py-3 text-right">Valor Pago</th>
                  <th className="px-4 py-3">Método</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Quando Pagou (BRT)</th>
                  <th className="px-4 py-3">Última Solicitação Vinculada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#241b40]">
                {data.payments.map((dep) => {
                  const st = DEPOSIT_STATUS_META[dep.status] || {
                    label: dep.status,
                    tone: "zinc" as const,
                  };
                  return (
                    <tr key={dep.id} className="hover:bg-[#1e1638]/70">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-white">{dep.userName}</div>
                        <div className="font-mono text-[11px] text-[#b7afc9]">
                          {dep.userEmail}
                        </div>
                        <div className="font-mono text-[10px] text-[#7d7299]">
                          TXID: {dep.txid}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono tabular-nums">
                        <div className="font-bold text-[#34D399]">
                          {formatBRL(dep.amountBrl)}
                        </div>
                        {dep.currency !== "BRL" && (
                          <div className="text-[10px] text-[#9d92ba]">
                            Original: {dep.currency} {dep.amount.toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[11px] text-[#e5d4ff]">
                        {PAYMENT_METHOD_LABELS[dep.method] || dep.method}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge label={st.label} tone={st.tone} />
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[11px] tabular-nums">
                        <div className="font-semibold text-white">
                          {dep.paidAtBrt || "Aguardando confirmação"}
                        </div>
                        <div className="text-[10px] text-[#8b80a6]">
                          Criado: {dep.createdAtBrt}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {dep.latestOrder ? (
                          <div>
                            <div className="font-medium text-white max-w-[260px] truncate">
                              #{dep.latestOrder.id} · {dep.latestOrder.serviceName}
                            </div>
                            <div className="font-mono text-[11px] text-[#38BDF8]">
                              {dep.latestOrder.profileHandle} ·{" "}
                              {formatInt(dep.latestOrder.quantity)} unid.
                            </div>
                          </div>
                        ) : (
                          <span className="font-mono text-[11px] text-[#7d7299]">
                            Saldo disponível na conta
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {data.payments.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center font-mono text-xs text-[#8b80a6]"
                    >
                      Nenhum pagamento registrado ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════ TAB 4: MULTI-PROVIDER FAILOVER ═══════════════════════ */}
      {tab === "failover" && (
        <div className="space-y-6">
          {/* Active Providers & Priority */}
          <div className="rounded-2xl border border-[#2e244d] bg-[#16102b] p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#f8d449]">
                  Ordem de Prioridade Multi-Provedor
                </span>
                <h2 className="mt-0.5 text-base font-bold text-white">
                  Provedores Conectados (Failover Automático Ativo)
                </h2>
                <p className="mt-0.5 text-xs text-[#b7afc9]">
                  Se o provedor principal falhar ou ficar sem saldo, o sistema tenta
                  automaticamente as rotas reserva por ordem de prioridade e depois outros
                  provedores ativos compatíveis.
                </p>
              </div>
              <Link
                href="/admin"
                className="btn-lime inline-flex h-9 items-center gap-1.5 px-4 font-mono text-[11px] uppercase shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                Cadastrar Novo Provedor
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {data.providers.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border border-[#2e244d] bg-[#110c21] p-4 flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-white truncate">{p.name}</span>
                      <span
                        className={`rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                          p.isActive && p.mode === "LIVE"
                            ? "border-[#10B981]/40 bg-[#10B981]/15 text-[#34D399]"
                            : "border-[#F59E0B]/40 bg-[#F59E0B]/15 text-[#FBBF24]"
                        }`}
                      >
                        {p.isActive ? p.mode : "INATIVO"}
                      </span>
                    </div>
                    <div className="mt-2 font-mono text-lg font-bold text-[#34D399] tabular-nums">
                      {p.cachedCurrency} {p.cachedBalance.toFixed(2)}
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-[#9d92ba]">
                      {p.servicesCount} serviços · {p.ordersCount} pedidos ·{" "}
                      {p.fallbacksCount} rotas reserva
                    </div>
                    {p.lastSyncedAt && (
                      <div className="mt-0.5 font-mono text-[10px] text-[#7d7299]">
                        Sync: {p.lastSyncedAt}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-[#241b40]">
                    <label className="font-mono text-[10px] uppercase text-[#9d92ba]">
                      Prioridade:
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={priorityDrafts[p.id] ?? String(p.priority)}
                      onChange={(e) =>
                        setPriorityDrafts((prev) => ({
                          ...prev,
                          [p.id]: e.target.value,
                        }))
                      }
                      className="input-terminal h-8 w-16 px-2 text-center font-mono text-xs"
                    />
                    <button
                      type="button"
                      disabled={savingPriorityId === p.id}
                      onClick={() => handleSaveProviderPriority(p.id)}
                      className="btn-outline h-8 px-2.5 font-mono text-[10px] uppercase cursor-pointer"
                    >
                      {savingPriorityId === p.id ? "..." : "Salvar"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Backup Route Form */}
          <div className="rounded-2xl border border-[#2e244d] bg-[#16102b] p-5">
            <h3 className="text-base font-bold text-white">
              Configurar Rota de Provedor Reserva por Serviço
            </h3>
            <p className="mt-0.5 text-xs text-[#b7afc9]">
              Vincule um provedor backup e o ID equivalente no painel dele. Em qualquer erro do
              principal, a troca acontece em milissegundos sem o cliente perceber.
            </p>

            <form
              onSubmit={handleAddFallback}
              className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-3"
            >
              <div className="md:col-span-4">
                <label className="block font-mono text-[10px] uppercase text-[#9d92ba] mb-1">
                  Serviço na Loja
                </label>
                <select
                  value={fbServiceId}
                  onChange={(e) => setFbServiceId(e.target.value)}
                  className="input-terminal h-10 w-full px-3 text-xs"
                  required
                >
                  <option value="">Selecione o serviço...</option>
                  {data.services.map((s) => (
                    <option key={s.id} value={s.id}>
                      #{s.id} · {s.name} ({s.providerName || "Sem prov."})
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="block font-mono text-[10px] uppercase text-[#9d92ba] mb-1">
                  Provedor Reserva
                </label>
                <select
                  value={fbProviderId}
                  onChange={(e) => setFbProviderId(e.target.value)}
                  className="input-terminal h-10 w-full px-3 text-xs"
                  required
                >
                  <option value="">Selecione o provedor...</option>
                  {data.providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.mode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block font-mono text-[10px] uppercase text-[#9d92ba] mb-1">
                  ID no Provedor
                </label>
                <input
                  type="text"
                  value={fbProviderServiceId}
                  onChange={(e) => setFbProviderServiceId(e.target.value)}
                  placeholder="Ex: 4821"
                  className="input-terminal h-10 w-full px-3 font-mono text-xs"
                  required
                />
              </div>

              <div className="md:col-span-1">
                <label className="block font-mono text-[10px] uppercase text-[#9d92ba] mb-1">
                  Ordem
                </label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={fbPriority}
                  onChange={(e) => setFbPriority(e.target.value)}
                  className="input-terminal h-10 w-full px-2 text-center font-mono text-xs"
                />
              </div>

              <div className="md:col-span-2 flex items-end">
                <button
                  type="submit"
                  disabled={fbBusy}
                  className="btn-lime h-10 w-full inline-flex items-center justify-center gap-1.5 font-mono text-xs uppercase cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {fbBusy ? "Salvando..." : "Salvar Rota"}
                </button>
              </div>
            </form>

            {/* Existing Fallback Routes Table */}
            <div className="mt-5 overflow-x-auto rounded-xl border border-[#281f45]">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#281f45] bg-[#120d24] font-mono text-[10px] uppercase text-[#9d92ba]">
                  <tr>
                    <th className="px-4 py-3">Ordem</th>
                    <th className="px-4 py-3">Serviço</th>
                    <th className="px-4 py-3">Provedor Reserva</th>
                    <th className="px-4 py-3">ID no Provedor</th>
                    <th className="px-4 py-3 text-right">Remover</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#241b40]">
                  {data.fallbacks.map((fb) => (
                    <tr key={fb.id} className="hover:bg-[#1e1638]/70">
                      <td className="px-4 py-3 font-mono font-bold text-[#f8d449]">
                        #{fb.priority}
                      </td>
                      <td className="px-4 py-3 font-medium text-white">
                        #{fb.serviceId} · {fb.serviceName}
                      </td>
                      <td className="px-4 py-3 font-mono text-[#c9bfe3]">
                        {fb.providerName}{" "}
                        <span className="text-[10px] text-[#34D399]">({fb.providerMode})</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[#38BDF8]">
                        {fb.providerServiceId}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveFallback(fb.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#EF4444]/40 px-2.5 py-1 font-mono text-[10px] text-[#F87171] hover:bg-[#EF4444]/15 cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))}
                  {data.fallbacks.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-6 text-center font-mono text-xs text-[#8b80a6]"
                      >
                        Nenhuma rota reserva explícita ainda. O motor já faz fallback automático
                        entre provedores LIVE compatíveis, e você pode fixar pares exatos acima.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════ TAB 5: EMAIL + WHATSAPP ALERT AUDIT LOG ═══════════════════════ */}
      {tab === "notifications" && (
        <div className="rounded-2xl border border-[#2e244d] bg-[#16102b] overflow-hidden">
          <div className="p-5 border-b border-[#281f45] flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#34D399]">
                Auditoria em Tempo Real · E-mail + WhatsApp{" "}
                {formatPhoneDisplay(data.channels.ownerPhone)}
              </span>
              <h2 className="mt-0.5 text-base font-bold text-white">
                Histórico de Alertas Enviados ao Dono
              </h2>
            </div>
            <button
              type="button"
              disabled={testingAlert}
              onClick={handleTestAlert}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#10B981]/50 bg-[#10B981]/15 px-3.5 font-mono text-[11px] font-bold uppercase text-[#34D399] hover:bg-[#10B981]/25 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              {testingAlert ? "Enviando..." : "Enviar Teste Agora"}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#281f45] bg-[#120d24] font-mono text-[10px] uppercase text-[#9d92ba]">
                <tr>
                  <th className="px-4 py-3">Horário (BRT)</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Resumo</th>
                  <th className="px-4 py-3">E-mail</th>
                  <th className="px-4 py-3">WhatsApp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#241b40]">
                {data.notifications.map((n) => {
                  const meta = NOTIFICATION_KIND_META[n.kind] || {
                    label: n.kind,
                    cls: "border-[#2e244d] bg-[#21193b] text-[#c9bfe3]",
                  };
                  return (
                    <tr key={n.id} className="hover:bg-[#1e1638]/70">
                      <td className="px-4 py-3 font-mono text-[11px] text-[#b7afc9] whitespace-nowrap tabular-nums">
                        {n.createdAtBrt}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${meta.cls}`}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white max-w-[360px]">{n.summary}</td>
                      <td className="px-4 py-3 font-mono text-[11px]">
                        {n.emailOk ? (
                          <span className="text-[#34D399] font-bold">✓ ENVIADO</span>
                        ) : (
                          <span className="text-[#F87171]">
                            ✗ {n.emailError || "Falha"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px]">
                        {n.whatsappOk ? (
                          <span className="text-[#34D399] font-bold">
                            ✓ ENVIADO ({n.whatsappProvider || "WA"})
                          </span>
                        ) : (
                          <span className="text-[#F87171]">
                            ✗ {n.whatsappError || "Falha"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {data.notifications.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center font-mono text-xs text-[#8b80a6]"
                    >
                      Nenhum alerta disparado ainda. Clique em &quot;Enviar Teste Agora&quot;
                      para testar o recebimento imediato no seu WhatsApp e e-mail.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════ 1-CLICK REDISPATCH / FAILOVER MODAL ═══════════════════════ */}
      {redispatchOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#3a2d61] bg-[#16102b] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#f8d449]">
                  Failover Manual · 1 Clique
                </span>
                <h3 className="mt-1 text-lg font-bold text-white">
                  Reenviar Pedido #{redispatchOrder.id} por Outro Provedor
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRedispatchOrder(null)}
                className="rounded-lg p-1.5 text-[#9d92ba] hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-[#281f45] bg-[#110c21] p-3.5 space-y-1 font-mono text-xs">
              <div className="text-white font-bold">
                {redispatchOrder.serviceName} ({formatInt(redispatchOrder.quantity)} unid.)
              </div>
              <div className="text-[#38BDF8] break-all">
                {redispatchOrder.profileHandle} · {redispatchOrder.link}
              </div>
              <div className="text-[#9d92ba]">
                Cliente: {redispatchOrder.userName} ({redispatchOrder.userEmail})
              </div>
              {redispatchOrder.lastError && (
                <div className="text-[#F87171]">
                  Último erro: {redispatchOrder.lastError}
                </div>
              )}
            </div>

            <form onSubmit={handleRedispatchSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block font-mono text-[10px] uppercase text-[#9d92ba] mb-1">
                  Escolha o Novo Provedor
                </label>
                <select
                  value={redispatchProviderId}
                  onChange={(e) => {
                    const pid = e.target.value;
                    setRedispatchProviderId(pid);
                    const fb = data.fallbacks.find(
                      (f) => f.serviceId === redispatchOrder.serviceId && f.providerId === pid
                    );
                    if (fb) setRedispatchProviderServiceId(fb.providerServiceId);
                  }}
                  className="input-terminal h-10 w-full px-3 text-xs"
                  required
                >
                  <option value="">Selecione um provedor...</option>
                  {data.providers
                    .filter((p) => p.isActive)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.mode}) — Saldo: {p.cachedCurrency}{" "}
                        {p.cachedBalance.toFixed(2)}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase text-[#9d92ba] mb-1">
                  ID do Serviço no Novo Provedor (opcional se já houver rota reserva)
                </label>
                <input
                  type="text"
                  value={redispatchProviderServiceId}
                  onChange={(e) => setRedispatchProviderServiceId(e.target.value)}
                  placeholder="Ex: 1452 (vazio usa rota reserva ou ID padrão)"
                  className="input-terminal h-10 w-full px-3 font-mono text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRedispatchOrder(null)}
                  className="btn-outline h-10 px-4 font-mono text-xs uppercase cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={redispatchBusy}
                  className="btn-lime h-10 px-5 inline-flex items-center gap-1.5 font-mono text-xs uppercase cursor-pointer"
                >
                  <Repeat className="h-3.5 w-3.5" />
                  {redispatchBusy ? "Despachando..." : "Despachar Agora"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
