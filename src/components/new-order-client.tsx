"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  RefreshCw,
  Send,
  ShieldAlert,
  Star,
  Zap,
} from "lucide-react";
import { formatBRL, formatInt } from "@/lib/format";
import { calculateOrderTotals } from "@/lib/pricing";

export interface PanelCategory {
  id: string;
  name: string;
  network: string;
}

export interface PanelService {
  id: number;
  categoryId: string;
  categoryName: string;
  network: string;
  name: string;
  type: string;
  description: string;
  rate: number;
  providerRate: number;
  min: number;
  max: number;
  averageTime: string;
  refill: boolean;
  refillDays: number;
  cancel: boolean;
  dripfeed: boolean;
}

interface NewOrderClientProps {
  categories: PanelCategory[];
  services: PanelService[];
  favoriteIds: number[];
  initialServiceId?: number;
  userBalance: number;
  isAdmin?: boolean;
  stats: {
    totalOrders: number;
    activeOrders: number;
    totalSpent: number;
  };
}

const NETWORKS = [
  { id: "all", label: "Todas" },
  { id: "favorites", label: "★ Favoritos" },
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube" },
  { id: "facebook", label: "Facebook" },
  { id: "other", label: "Outras" },
];

export function NewOrderClient({
  categories,
  services,
  favoriteIds,
  initialServiceId,
  userBalance,
  isAdmin = false,
  stats,
}: NewOrderClientProps) {
  const router = useRouter();
  const initialService =
    services.find((s) => s.id === initialServiceId) ?? services[0];

  const [network, setNetwork] = useState("all");
  const [categoryId, setCategoryId] = useState(
    initialService?.categoryId ?? categories[0]?.id ?? ""
  );
  const [serviceId, setServiceId] = useState<number>(initialService?.id ?? 0);
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState<number>(
    initialService ? Math.max(initialService.min, Math.min(1000, initialService.max)) : 100
  );
  const [comments, setComments] = useState("");
  const [commentUsername, setCommentUsername] = useState("");
  const [answerNumber, setAnswerNumber] = useState("1");
  const [dripfeed, setDripfeed] = useState(false);
  const [runs, setRuns] = useState(2);
  const [interval, setInterval] = useState(60);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const visibleCategories = useMemo(() => {
    if (network === "all") return categories;
    if (network === "favorites") {
      const favCats = new Set(
        services.filter((s) => favoriteIds.includes(s.id)).map((s) => s.categoryId)
      );
      return categories.filter((c) => favCats.has(c.id));
    }
    return categories.filter((c) => c.network === network);
  }, [categories, network, services, favoriteIds]);

  const visibleServices = useMemo(() => {
    const byCat = services.filter((s) => s.categoryId === categoryId);
    if (network === "favorites") {
      return byCat.filter((s) => favoriteIds.includes(s.id));
    }
    return byCat;
  }, [services, categoryId, network, favoriteIds]);

  const activeService = useMemo(
    () =>
      visibleServices.find((s) => s.id === serviceId) ??
      visibleServices[0] ??
      services[0],
    [visibleServices, serviceId, services]
  );

  const effectiveQty = useMemo(() => {
    if (!activeService) return 0;
    if (activeService.type === "PACKAGE") return 1;
    if (activeService.type === "CUSTOM_COMMENTS") {
      return comments
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean).length;
    }
    return Number.isFinite(quantity) ? quantity : 0;
  }, [activeService, comments, quantity]);

  const totals = useMemo(() => {
    if (!activeService) {
      return { totalQuantity: 0, charge: 0, cost: 0, profit: 0 };
    }
    if (activeService.type === "PACKAGE") {
      return {
        totalQuantity: 1,
        charge: activeService.rate,
        cost: activeService.providerRate,
        profit: activeService.rate - activeService.providerRate,
      };
    }
    return calculateOrderTotals({
      rate: activeService.rate,
      providerRate: activeService.providerRate,
      quantity: Math.max(0, effectiveQty),
      dripfeed: dripfeed && activeService.dripfeed,
      runs,
    });
  }, [activeService, effectiveQty, dripfeed, runs]);

  function selectNetwork(net: string) {
    setNetwork(net);
    const nextCats =
      net === "all"
        ? categories
        : net === "favorites"
          ? categories.filter((c) =>
              services.some((s) => s.categoryId === c.id && favoriteIds.includes(s.id))
            )
          : categories.filter((c) => c.network === net);

    const firstCat = nextCats[0];
    if (firstCat) {
      setCategoryId(firstCat.id);
      const firstSrv = services.find(
        (s) =>
          s.categoryId === firstCat.id &&
          (net !== "favorites" || favoriteIds.includes(s.id))
      );
      if (firstSrv) {
        setServiceId(firstSrv.id);
        setQuantity(Math.max(firstSrv.min, Math.min(1000, firstSrv.max)));
        setDripfeed(false);
      }
    }
  }

  function selectCategory(catId: string) {
    setCategoryId(catId);
    const firstSrv = services.find((s) => s.categoryId === catId);
    if (firstSrv) {
      setServiceId(firstSrv.id);
      setQuantity(Math.max(firstSrv.min, Math.min(1000, firstSrv.max)));
      setDripfeed(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeService) return;
    setError("");
    setSuccessMsg("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: activeService.id,
          link,
          quantity: effectiveQty,
          dripfeed: dripfeed && activeService.dripfeed,
          runs: dripfeed ? runs : undefined,
          interval: dripfeed ? interval : undefined,
          comments:
            activeService.type === "CUSTOM_COMMENTS" ? comments : undefined,
          username:
            activeService.type === "COMMENT_LIKES" ? commentUsername : undefined,
          answerNumber:
            activeService.type === "POLL" ? answerNumber : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Não foi possível enviar o pedido.");
        return;
      }

      setSuccessMsg(
        `Pedido #${data.order.id} enviado com sucesso! Valor debitado: ${formatBRL(data.order.charge, true)}.`
      );
      setLink("");
      setComments("");
      setCommentUsername("");
      router.refresh();
    } catch {
      setError("Erro de conexão ao enviar pedido.");
    } finally {
      setSubmitting(false);
    }
  }

  const insufficientBalance = !isAdmin && totals.charge > userBalance;

  return (
    <div className="space-y-6">
      {/* KPIs do cliente */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border border-[#232730] bg-[#111317]">
        {[
          {
            label: "Saldo Atual",
            value: formatBRL(userBalance),
            accent: "text-[#C8FF2E]",
          },
          {
            label: "Total Investido",
            value: formatBRL(stats.totalSpent),
            accent: "text-[#F4F5F6]",
          },
          {
            label: "Pedidos Ativos",
            value: formatInt(stats.activeOrders),
            accent: "text-[#FF8A58]",
          },
          {
            label: "Total de Pedidos",
            value: formatInt(stats.totalOrders),
            accent: "text-[#34D399]",
          },
        ].map((kpi, idx) => (
          <div
            key={kpi.label}
            className={`p-4 sm:p-5 ${
              idx < 3 ? "border-b lg:border-b-0 border-r border-[#232730]" : ""
            }`}
          >
            <div className="font-mono text-[10px] uppercase tracking-widest text-[#98A0AD]">
              {kpi.label}
            </div>
            <div className={`mt-1 font-mono text-xl sm:text-2xl font-bold ${kpi.accent}`}>
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filtro rápido de redes */}
      <div className="flex flex-wrap gap-2">
        {NETWORKS.map((net) => (
          <button
            key={net.id}
            type="button"
            onClick={() => selectNetwork(net.id)}
            className={`h-9 px-3.5 font-mono text-xs uppercase tracking-wider border cursor-pointer transition-colors ${
              network === net.id
                ? "bg-[#C8FF2E] text-[#090A0C] border-[#C8FF2E] font-bold"
                : "bg-[#111317] text-[#98A0AD] border-[#232730] hover:text-[#F4F5F6]"
            }`}
          >
            {net.label}
          </button>
        ))}
      </div>

      {/* Formulário Novo Pedido + Detalhes do Serviço */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 surface-card p-5 sm:p-6 space-y-5"
        >
          <div className="flex items-center justify-between border-b border-[#232730] pb-4">
            <div>
              <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">
                Novo Pedido
              </h1>
              <p className="text-xs text-[#98A0AD]">
                Selecione a categoria, serviço, cole o link e dispare em segundos.
              </p>
            </div>
            <Link
              href="/painel/massa"
              className="font-mono text-xs uppercase text-[#C8FF2E] hover:underline"
            >
              Pedido em Massa →
            </Link>
          </div>

          <div>
            <label
              htmlFor="order-category"
              className="block font-mono text-[11px] uppercase tracking-wider text-[#98A0AD] mb-1.5"
            >
              1. Categoria
            </label>
            <select
              id="order-category"
              value={categoryId}
              onChange={(e) => selectCategory(e.target.value)}
              className="input-terminal w-full h-11 px-3 text-sm"
            >
              {visibleCategories.length === 0 ? (
                <option value="">Nenhuma categoria disponível neste filtro</option>
              ) : (
                visibleCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="order-service"
              className="block font-mono text-[11px] uppercase tracking-wider text-[#98A0AD] mb-1.5"
            >
              2. Serviço
            </label>
            <select
              id="order-service"
              value={activeService?.id ?? ""}
              onChange={(e) => {
                const nextId = Number(e.target.value);
                setServiceId(nextId);
                const found = services.find((s) => s.id === nextId);
                if (found) {
                  setQuantity(Math.max(found.min, Math.min(1000, found.max)));
                  if (!found.dripfeed) setDripfeed(false);
                }
              }}
              className="input-terminal w-full h-11 px-3 text-sm"
            >
              {visibleServices.map((s) => (
                <option key={s.id} value={s.id}>
                  #{s.id} — {s.name} — {formatBRL(s.rate)}/1k
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="order-link"
              className="block font-mono text-[11px] uppercase tracking-wider text-[#98A0AD] mb-1.5"
            >
              3. Link do Perfil ou Publicação
            </label>
            <input
              id="order-link"
              type="text"
              required
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://instagram.com/seu_perfil ou link do vídeo/post"
              className="input-terminal w-full h-11 px-3 text-sm"
            />
          </div>

          {activeService?.type === "SUBSCRIPTIONS" ? (
            <div className="border border-[#C8FF2E]/40 bg-[#C8FF2E]/10 p-4 space-y-2">
              <div className="font-mono text-xs uppercase text-[#C8FF2E]">
                Serviço de Assinatura Automática
              </div>
              <p className="text-xs text-[#D2D7E0]">
                Este serviço monitora novos posts automaticamente. Configure usuário, quantidade min/max, limite de posts e delay na aba de Assinaturas.
              </p>
              <Link
                href="/painel/assinaturas"
                className="btn-lime inline-flex h-9 items-center px-4 font-mono text-xs uppercase"
              >
                Abrir Configurador de Assinaturas →
              </Link>
            </div>
          ) : activeService?.type === "PACKAGE" ? (
            <div className="border border-[#232730] bg-[#0C0E12] p-3.5 font-mono text-xs text-[#98A0AD]">
              Pacote fechado (preço fixo de <strong className="text-[#C8FF2E]">{formatBRL(activeService.rate)}</strong>). Basta informar o link acima.
            </div>
          ) : activeService?.type === "CUSTOM_COMMENTS" ? (
            <div>
              <label
                htmlFor="order-comments"
                className="block font-mono text-[11px] uppercase tracking-wider text-[#98A0AD] mb-1.5"
              >
                4. Comentários Personalizados (1 por linha — {effectiveQty} detectados)
              </label>
              <textarea
                id="order-comments"
                rows={5}
                required
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder={"Amei esse conteúdo!\nExcelente trabalho, parabéns!\nTop demais!"}
                className="input-terminal w-full p-3 text-sm font-mono"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {activeService?.type === "COMMENT_LIKES" && (
                <div>
                  <label
                    htmlFor="order-comment-user"
                    className="block font-mono text-[11px] uppercase tracking-wider text-[#98A0AD] mb-1.5"
                  >
                    Usuário autor do comentário (@username)
                  </label>
                  <input
                    id="order-comment-user"
                    type="text"
                    required
                    value={commentUsername}
                    onChange={(e) => setCommentUsername(e.target.value)}
                    placeholder="@autor_do_comentario"
                    className="input-terminal w-full h-11 px-3 text-sm"
                  />
                </div>
              )}
              {activeService?.type === "POLL" && (
                <div>
                  <label
                    htmlFor="order-answer-num"
                    className="block font-mono text-[11px] uppercase tracking-wider text-[#98A0AD] mb-1.5"
                  >
                    Número da Opção da Enquete (1, 2, 3...)
                  </label>
                  <input
                    id="order-answer-num"
                    type="text"
                    required
                    value={answerNumber}
                    onChange={(e) => setAnswerNumber(e.target.value)}
                    placeholder="1"
                    className="input-terminal w-full h-11 px-3 font-mono text-sm"
                  />
                </div>
              )}
              <div>
                <label
                  htmlFor="order-quantity"
                  className="block font-mono text-[11px] uppercase tracking-wider text-[#98A0AD] mb-1.5"
                >
                  4. Quantidade{" "}
                  {activeService &&
                    `(Min: ${formatInt(activeService.min)} — Max: ${formatInt(activeService.max)})`}
                </label>
                <input
                  id="order-quantity"
                  type="number"
                  required
                  min={activeService?.min ?? 10}
                  max={activeService?.max ?? 100000}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="input-terminal w-full h-11 px-3 font-mono text-sm"
                />
              </div>
            </div>
          )}

          {activeService?.dripfeed && activeService.type !== "CUSTOM_COMMENTS" && (
            <div className="border border-[#232730] bg-[#0C0E12] p-4 space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dripfeed}
                  onChange={(e) => setDripfeed(e.target.checked)}
                  className="h-4 w-4 accent-[#C8FF2E]"
                />
                <span className="font-mono text-xs uppercase tracking-wider text-[#F4F5F6]">
                  Ativar Drip-Feed (Entrega Gradual Orgânica)
                </span>
              </label>

              {dripfeed && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-mono text-[10px] uppercase text-[#98A0AD] mb-1">
                      Rodadas (Runs)
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={100}
                      value={runs}
                      onChange={(e) => setRuns(Math.max(2, Number(e.target.value)))}
                      className="input-terminal w-full h-10 px-3 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] uppercase text-[#98A0AD] mb-1">
                      Intervalo (minutos)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={1440}
                      value={interval}
                      onChange={(e) => setInterval(Math.max(5, Number(e.target.value)))}
                      className="input-terminal w-full h-10 px-3 font-mono text-sm"
                    />
                  </div>
                  <div className="col-span-2 font-mono text-xs text-[#98A0AD]">
                    Total acumulado:{" "}
                    <strong className="text-[#C8FF2E]">
                      {formatInt(totals.totalQuantity)} unidades
                    </strong>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Resumo do Valor */}
          <div className="flex items-center justify-between border border-[#323845] bg-[#0C0E12] px-4 py-3.5">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-[#98A0AD]">
                {isAdmin ? "Modo Admin • Custo na Plataforma" : "Valor Total a Debitar"}
              </div>
              <div className="font-mono text-2xl font-bold text-[#C8FF2E] flex items-baseline gap-2.5">
                {isAdmin ? "R$ 0,00" : formatBRL(totals.charge, true)}
                {isAdmin && (
                  <span className="text-xs font-normal text-[#98A0AD] line-through">
                    {formatBRL(totals.charge, true)}
                  </span>
                )}
              </div>
            </div>
            {isAdmin ? (
              <span className="border border-[#C8FF2E]/40 bg-[#C8FF2E]/10 px-3 py-1.5 font-mono text-[11px] uppercase text-[#C8FF2E]">
                Admin · Uso Grátis Ilimitado
              </span>
            ) : (
              insufficientBalance && (
                <Link
                  href="/painel/saldo"
                  className="border border-[#FF6B2C] bg-[#FF6B2C]/15 px-3 py-2 font-mono text-xs uppercase text-[#FF8A58] hover:bg-[#FF6B2C]/25"
                >
                  Saldo insuficiente • Adicionar Saldo
                </Link>
              )
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 border border-[#EF4444]/40 bg-[#EF4444]/10 px-3.5 py-2.5 text-xs text-[#F87171]">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {successMsg && (
            <div className="flex items-center justify-between gap-2 border border-[#10B981]/40 bg-[#10B981]/10 px-3.5 py-2.5 text-xs text-[#34D399]">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {successMsg}
              </span>
              <Link href="/painel/pedidos" className="font-mono underline shrink-0">
                Ver Pedido →
              </Link>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !activeService || insufficientBalance}
            className="btn-lime h-12 w-full inline-flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-wider cursor-pointer"
          >
            <Send className="h-4 w-4" />
            {submitting ? "Processando Pedido..." : "Enviar Pedido Agora"}
          </button>
        </form>

        {/* Dossiê do Serviço Selecionado */}
        {activeService && (
          <aside className="lg:col-span-5 surface-elevated p-5 sm:p-6 space-y-5">
            <div className="border-b border-[#232730] pb-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-[#C8FF2E]">
                  SERVIÇO #{activeService.id}
                </span>
                {favoriteIds.includes(activeService.id) && (
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#FF8A58]">
                    <Star className="h-3.5 w-3.5 fill-[#FF6B2C] text-[#FF6B2C]" />
                    Favorito
                  </span>
                )}
              </div>
              <h2 className="mt-1.5 font-[family-name:var(--font-display)] text-lg font-bold text-[#F4F5F6]">
                {activeService.name}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="bg-[#0C0E12] border border-[#232730] p-3">
                <div className="text-[#68707E]">PREÇO POR 1.000</div>
                <div className="mt-1 text-base font-bold text-[#C8FF2E]">
                  {formatBRL(activeService.rate)}
                </div>
              </div>
              <div className="bg-[#0C0E12] border border-[#232730] p-3">
                <div className="text-[#68707E]">TEMPO MÉDIO</div>
                <div className="mt-1 text-base font-bold text-[#F4F5F6] flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-[#FF6B2C]" />
                  {activeService.averageTime}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 font-mono text-[11px] uppercase">
              {activeService.refill ? (
                <span className="inline-flex items-center gap-1 border border-[#10B981]/40 bg-[#10B981]/10 px-2.5 py-1 text-[#34D399]">
                  <RefreshCw className="h-3 w-3" />
                  Garantia Reposição {activeService.refillDays}D
                </span>
              ) : (
                <span className="border border-[#232730] bg-[#0C0E12] px-2.5 py-1 text-[#98A0AD]">
                  Sem Reposição
                </span>
              )}
              {activeService.cancel && (
                <span className="border border-[#323845] bg-[#0C0E12] px-2.5 py-1 text-[#F4F5F6]">
                  Botão Cancelar Ativo
                </span>
              )}
              {activeService.dripfeed && (
                <span className="inline-flex items-center gap-1 border border-[#FF6B2C]/40 bg-[#FF6B2C]/10 px-2.5 py-1 text-[#FF8A58]">
                  <Zap className="h-3 w-3" />
                  Drip-Feed
                </span>
              )}
            </div>

            <div className="border border-[#232730] bg-[#0C0E12] p-4 space-y-2">
              <div className="font-mono text-[11px] uppercase tracking-wider text-[#98A0AD]">
                Descrição & Instruções
              </div>
              <p className="whitespace-pre-line text-sm text-[#D2D7E0] leading-relaxed">
                {activeService.description}
              </p>
            </div>

            <div className="border-l-2 border-[#FF6B2C] bg-[#0C0E12] p-3.5 text-xs text-[#98A0AD] leading-relaxed">
              <strong className="text-[#F4F5F6]">Atenção antes de pedir:</strong>{" "}
              verifique se o perfil está em modo público e nunca dispare dois
              pedidos iguais para o mesmo link simultaneamente.
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
