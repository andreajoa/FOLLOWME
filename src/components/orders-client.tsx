"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  RotateCcw,
  Search,
  XCircle,
} from "lucide-react";
import {
  formatBRL,
  formatDateBR,
  formatInt,
  ORDER_STATUS_META,
} from "@/lib/format";
import { StatusBadge } from "./status-badge";

export interface ClientOrderRow {
  id: number;
  link: string;
  quantity: number;
  charge: number;
  startCount: number;
  remains: number;
  status: string;
  refillStatus: string | null;
  source: string;
  dripfeed: boolean;
  runs: number | null;
  interval: number | null;
  createdAt: string;
  service: {
    id: number;
    name: string;
    refill: boolean;
    refillDays: number;
    cancel: boolean;
  };
}

const STATUS_TABS = [
  { key: "ALL", label: "Todos" },
  { key: "PENDING", label: "Pendentes" },
  { key: "IN_PROGRESS", label: "Em Andamento" },
  { key: "COMPLETED", label: "Concluídos" },
  { key: "PARTIAL", label: "Parciais" },
  { key: "CANCELED", label: "Cancelados" },
];

export function OrdersClient({ initialOrders }: { initialOrders: ClientOrderRow[] }) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "ALL" && o.status !== statusFilter) return false;
      if (q && !`${o.id} ${o.link} ${o.service.name}`.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [orders, statusFilter, query]);

  async function handleRefill(orderId: number) {
    setBusyId(orderId);
    setNotice(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/refill`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setNotice({ type: "err", text: data.error || "Falha ao solicitar reposição." });
        return;
      }
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, refillStatus: "REQUESTED" } : o
        )
      );
      setNotice({
        type: "ok",
        text: `Reposição solicitada para o pedido #${orderId}!`,
      });
    } finally {
      setBusyId(null);
    }
  }

  async function handleCancel(orderId: number) {
    setBusyId(orderId);
    setNotice(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setNotice({ type: "err", text: data.error || "Não foi possível cancelar." });
        return;
      }
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: "CANCELED" } : o
        )
      );
      setNotice({
        type: "ok",
        text: `Pedido #${orderId} cancelado e estornado para seu saldo.`,
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#C8FF2E]">
            Acompanhamento em Tempo Real
          </span>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold">
            Meus Pedidos
          </h1>
        </div>
        <Link
          href="/painel"
          className="btn-lime inline-flex h-10 items-center px-4 font-mono text-xs uppercase"
        >
          + Novo Pedido
        </Link>
      </div>

      {notice && (
        <div
          className={`flex items-center gap-2 border px-4 py-3 text-xs font-mono ${
            notice.type === "ok"
              ? "border-[#10B981]/40 bg-[#10B981]/10 text-[#34D399]"
              : "border-[#EF4444]/40 bg-[#EF4444]/10 text-[#F87171]"
          }`}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {notice.text}
        </div>
      )}

      <div className="surface-card p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`h-8 px-3 font-mono text-[11px] uppercase border cursor-pointer ${
                statusFilter === tab.key
                  ? "bg-[#C8FF2E] text-[#090A0C] border-[#C8FF2E] font-bold"
                  : "bg-[#0C0E12] text-[#98A0AD] border-[#232730] hover:text-[#F4F5F6]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="h-4 w-4 text-[#68707E] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrar por ID do pedido, link ou serviço..."
            className="input-terminal w-full h-10 pl-9 pr-3 text-sm"
          />
        </div>
      </div>

      <div className="border border-[#232730] bg-[#111317] overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#232730] bg-[#0C0E12] font-mono text-[11px] uppercase tracking-wider text-[#98A0AD]">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Serviço & Link</th>
              <th className="px-4 py-3 text-right">Cobrado</th>
              <th className="px-4 py-3 text-right">Qtd / Restante</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#232730] text-sm">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center font-mono text-xs text-[#98A0AD]"
                >
                  Nenhum pedido encontrado neste filtro.
                </td>
              </tr>
            ) : (
              filtered.map((o) => {
                const meta = ORDER_STATUS_META[o.status] ?? {
                  label: o.status,
                  tone: "zinc" as const,
                };
                const canRefill =
                  o.service.refill &&
                  (o.status === "COMPLETED" || o.status === "PARTIAL") &&
                  o.refillStatus !== "REQUESTED";
                const canCancel =
                  o.service.cancel &&
                  ["PENDING", "PROCESSING", "IN_PROGRESS"].includes(o.status);

                return (
                  <tr key={o.id} className="hover:bg-[#171A20]">
                    <td className="px-4 py-3.5 font-mono text-xs text-[#C8FF2E] whitespace-nowrap">
                      #{o.id}
                      <div className="text-[10px] text-[#68707E]">{o.source}</div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-[#98A0AD] whitespace-nowrap">
                      {formatDateBR(o.createdAt)}
                    </td>
                    <td className="px-4 py-3.5 max-w-md">
                      <div className="font-medium text-[#F4F5F6] line-clamp-1">
                        {o.service.name}
                      </div>
                      <a
                        href={o.link.startsWith("http") ? o.link : `https://${o.link}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-0.5 inline-flex items-center gap-1 font-mono text-xs text-[#98A0AD] hover:text-[#C8FF2E] break-all"
                      >
                        {o.link}
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                      {o.dripfeed && (
                        <div className="font-mono text-[10px] text-[#FF8A58]">
                          DRIP-FEED: {o.runs}x a cada {o.interval} min
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-[#F4F5F6] whitespace-nowrap">
                      {formatBRL(o.charge, true)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-xs whitespace-nowrap">
                      <div className="text-[#F4F5F6]">{formatInt(o.quantity)}</div>
                      <div className="text-[#68707E]">
                        Início: {formatInt(o.startCount)} • Resta: {formatInt(o.remains)}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <StatusBadge label={meta.label} tone={meta.tone} />
                      {o.refillStatus === "REQUESTED" && (
                        <div className="mt-1 font-mono text-[10px] text-[#34D399]">
                          REFIL SOLICITADO
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {canRefill && (
                          <button
                            type="button"
                            disabled={busyId === o.id}
                            onClick={() => handleRefill(o.id)}
                            className="inline-flex h-8 items-center gap-1 border border-[#10B981]/50 bg-[#10B981]/10 px-2.5 font-mono text-[11px] uppercase text-[#34D399] hover:bg-[#10B981]/20 cursor-pointer"
                          >
                            <RefreshCw className="h-3 w-3" />
                            Repor
                          </button>
                        )}
                        {canCancel && (
                          <button
                            type="button"
                            disabled={busyId === o.id}
                            onClick={() => handleCancel(o.id)}
                            className="inline-flex h-8 items-center gap-1 border border-[#EF4444]/40 bg-[#EF4444]/10 px-2.5 font-mono text-[11px] uppercase text-[#F87171] hover:bg-[#EF4444]/20 cursor-pointer"
                          >
                            <XCircle className="h-3 w-3" />
                            Cancelar
                          </button>
                        )}
                        <Link
                          href={`/painel?service=${o.service.id}`}
                          title="Pedir novamente"
                          className="inline-flex h-8 items-center gap-1 border border-[#323845] px-2 font-mono text-[11px] uppercase text-[#98A0AD] hover:text-[#F4F5F6]"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
