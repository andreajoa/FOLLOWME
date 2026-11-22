"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Pause,
  Play,
  Repeat,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import {
  formatBRL,
  formatDateBR,
  SUBSCRIPTION_STATUS_META,
} from "@/lib/format";
import { StatusBadge } from "./status-badge";

export interface SubscriptionServiceOption {
  id: number;
  name: string;
  rate: number;
  min: number;
  max: number;
  description: string;
}

export interface SubscriptionRow {
  id: number;
  username: string;
  min: number;
  max: number;
  posts: number | null;
  oldPosts: number;
  delay: number;
  expiry: string | null;
  postsDelivered: number;
  status: string;
  createdAt: string;
  service: { id: number; name: string; rate: number };
}

const DELAY_OPTIONS = [0, 5, 10, 15, 20, 30, 40, 50, 60, 90, 120, 180, 240, 360, 480, 600];

export function SubscriptionsClient({
  services,
  initialSubscriptions,
}: {
  services: SubscriptionServiceOption[];
  initialSubscriptions: SubscriptionRow[];
}) {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions);
  const [serviceId, setServiceId] = useState<number>(services[0]?.id ?? 0);
  const [username, setUsername] = useState("");
  const [min, setMin] = useState<number>(services[0]?.min ?? 50);
  const [max, setMax] = useState<number>(Math.max((services[0]?.min ?? 50) * 2, 100));
  const [posts, setPosts] = useState<string>("10");
  const [oldPosts, setOldPosts] = useState<number>(0);
  const [delay, setDelay] = useState<number>(5);
  const [expiry, setExpiry] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const activeService = services.find((s) => s.id === serviceId) ?? services[0];

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          username,
          min,
          max,
          posts: posts.trim() ? Number(posts) : null,
          oldPosts,
          delay,
          expiry: expiry || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Não foi possível criar assinatura.");
        return;
      }
      setSubscriptions((prev) => [
        {
          ...data.subscription,
          expiry: data.subscription.expiry ?? null,
          createdAt: data.subscription.createdAt || new Date().toISOString(),
        },
        ...prev,
      ]);
      setUsername("");
      setSuccess(`Assinatura #${data.subscription.id} ativada para @${data.subscription.username}!`);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function updateStatus(id: number, status: "ACTIVE" | "PAUSED" | "CANCELED") {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/subscriptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao atualizar assinatura.");
        return;
      }
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status } : s))
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <span className="font-mono text-xs uppercase tracking-widest text-[#C8FF2E]">
          Auto-Engajamento em Novos Posts • Padrão SMM v2
        </span>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold">
          Assinaturas Automáticas
        </h1>
        <p className="mt-1 text-sm text-[#98A0AD]">
          Receba curtidas, visualizações ou impressões automaticamente sempre que o perfil publicar conteúdo novo.
        </p>
      </div>

      {success && (
        <div className="flex items-center gap-2 border border-[#10B981]/40 bg-[#10B981]/10 px-4 py-3 font-mono text-xs text-[#34D399]">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 border border-[#EF4444]/40 bg-[#EF4444]/10 px-4 py-3 font-mono text-xs text-[#F87171]">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleCreate} className="surface-card p-5 sm:p-6 space-y-4">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-bold border-b border-[#232730] pb-3">
          Nova Assinatura Automática
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block font-mono text-[11px] uppercase text-[#98A0AD] mb-1">
              Serviço de Auto-Engajamento
            </label>
            <select
              value={serviceId}
              onChange={(e) => {
                const nextId = Number(e.target.value);
                setServiceId(nextId);
                const found = services.find((s) => s.id === nextId);
                if (found) {
                  setMin(found.min);
                  setMax(Math.min(found.max, Math.max(found.min * 2, 100)));
                }
              }}
              className="input-terminal w-full h-11 px-3 text-sm"
            >
              {services.map((s) => (
                <option key={s.id} value={s.id} className="bg-[#111317]">
                  #{s.id} — {s.name} ({formatBRL(s.rate)}/1k)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-mono text-[11px] uppercase text-[#98A0AD] mb-1">
              Usuário (@username do perfil público)
            </label>
            <input
              type="text"
              required
              placeholder="ex: minhaconta"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-terminal w-full h-10 px-3 text-sm"
            />
          </div>

          <div>
            <label className="block font-mono text-[11px] uppercase text-[#98A0AD] mb-1">
              Novos Posts (deixe vazio = ilimitado)
            </label>
            <input
              type="number"
              min={1}
              max={1000}
              placeholder="10"
              value={posts}
              onChange={(e) => setPosts(e.target.value)}
              className="input-terminal w-full h-10 px-3 font-mono text-sm"
            />
          </div>

          <div>
            <label className="block font-mono text-[11px] uppercase text-[#98A0AD] mb-1">
              Quantidade Mínima por Post (mín: {activeService?.min ?? 10})
            </label>
            <input
              type="number"
              required
              min={activeService?.min ?? 10}
              max={activeService?.max ?? 100000}
              value={min}
              onChange={(e) => setMin(Number(e.target.value))}
              className="input-terminal w-full h-10 px-3 font-mono text-sm"
            />
          </div>

          <div>
            <label className="block font-mono text-[11px] uppercase text-[#98A0AD] mb-1">
              Quantidade Máxima por Post (máx: {activeService?.max ?? 100000})
            </label>
            <input
              type="number"
              required
              min={min}
              max={activeService?.max ?? 100000}
              value={max}
              onChange={(e) => setMax(Number(e.target.value))}
              className="input-terminal w-full h-10 px-3 font-mono text-sm"
            />
          </div>

          <div>
            <label className="block font-mono text-[11px] uppercase text-[#98A0AD] mb-1">
              Posts Antigos a Incluir (old_posts)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={oldPosts}
              onChange={(e) => setOldPosts(Number(e.target.value))}
              className="input-terminal w-full h-10 px-3 font-mono text-sm"
            />
          </div>

          <div>
            <label className="block font-mono text-[11px] uppercase text-[#98A0AD] mb-1">
              Atraso após publicação (minutos)
            </label>
            <select
              value={delay}
              onChange={(e) => setDelay(Number(e.target.value))}
              className="input-terminal w-full h-10 px-3 font-mono text-sm"
            >
              {DELAY_OPTIONS.map((d) => (
                <option key={d} value={d} className="bg-[#111317]">
                  {d === 0 ? "0 min (Imediato)" : `${d} minutos`}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block font-mono text-[11px] uppercase text-[#98A0AD] mb-1">
              Data de Expiração (opcional)
            </label>
            <input
              type="date"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              className="input-terminal w-full sm:w-64 h-10 px-3 font-mono text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || services.length === 0}
          className="btn-lime h-11 px-6 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50"
        >
          <Repeat className="h-4 w-4" />
          {submitting ? "Ativando..." : "Ativar Assinatura"}
        </button>
      </form>

      {/* Lista de Assinaturas */}
      <div className="surface-card overflow-hidden">
        <div className="border-b border-[#232730] bg-[#171A20] px-5 py-3.5 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-base font-bold">
            Minhas Assinaturas
          </h2>
          <span className="font-mono text-xs text-[#98A0AD]">
            {subscriptions.length} registros
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#232730] bg-[#0C0E12] font-mono text-[11px] uppercase text-[#98A0AD]">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Perfil</th>
                <th className="px-4 py-3">Serviço</th>
                <th className="px-4 py-3">Qtd / Posts</th>
                <th className="px-4 py-3">Delay</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232730] text-sm">
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[#68707E]">
                    Nenhuma assinatura ativa no momento.
                  </td>
                </tr>
              ) : (
                subscriptions.map((s) => {
                  const meta = SUBSCRIPTION_STATUS_META[s.status] ?? {
                    label: s.status,
                    tone: "zinc" as const,
                  };
                  return (
                    <tr key={s.id} className="hover:bg-[#15181E]">
                      <td className="px-4 py-3 font-mono text-xs text-[#C8FF2E]">
                        #{s.id}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#F4F5F6]">
                        @{s.username}
                        <div className="text-[10px] text-[#68707E]">
                          {formatDateBR(s.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#F4F5F6] max-w-xs">
                        {s.service.name}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#98A0AD]">
                        {s.min}–{s.max} • {s.postsDelivered}/{s.posts ?? "∞"} posts
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#98A0AD]">
                        {s.delay} min
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge label={meta.label} tone={meta.tone} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {s.status !== "CANCELED" && s.status !== "COMPLETED" && (
                          <div className="inline-flex gap-1.5">
                            {s.status === "ACTIVE" ? (
                              <button
                                type="button"
                                disabled={busyId === s.id}
                                onClick={() => updateStatus(s.id, "PAUSED")}
                                className="btn-outline h-8 px-2.5 inline-flex items-center gap-1 font-mono text-[10px] uppercase cursor-pointer"
                              >
                                <Pause className="h-3 w-3" />
                                Pausar
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={busyId === s.id}
                                onClick={() => updateStatus(s.id, "ACTIVE")}
                                className="btn-lime h-8 px-2.5 inline-flex items-center gap-1 font-mono text-[10px] uppercase cursor-pointer"
                              >
                                <Play className="h-3 w-3" />
                                Retomar
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={busyId === s.id}
                              onClick={() => updateStatus(s.id, "CANCELED")}
                              className="border border-[#EF4444]/40 text-[#F87171] hover:bg-[#EF4444]/10 h-8 px-2.5 inline-flex items-center gap-1 font-mono text-[10px] uppercase cursor-pointer"
                            >
                              <XCircle className="h-3 w-3" />
                              Cancelar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
