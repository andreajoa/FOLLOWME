"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Clock,
  Info,
  RefreshCw,
  Search,
  Star,
  X,
  Zap,
} from "lucide-react";
import { formatInt, NETWORK_LABELS } from "@/lib/format";
import {
  AppCurrency,
  AppLocale,
  formatCurrencyAmount,
  getLocalizedServiceDescription,
  getLocalizedServiceName,
  getServiceMarketRate,
} from "@/lib/i18n";
import { getBlackFridayPricePair } from "@/lib/black-friday";
import { BlackFridayNoticeStrip, BlackFridayTag } from "./black-friday-ui";

export interface CatalogService {
  id: number;
  categoryId: string;
  categoryName: string;
  network: string;
  name: string;
  nameEn?: string | null;
  metricType?: string | null;
  type: string;
  description: string;
  descriptionEn?: string | null;
  rate: number;
  rateUsd?: number | null;
  min: number;
  max: number;
  averageTime: string;
  refill: boolean;
  refillDays: number;
  cancel: boolean;
  dripfeed: boolean;
}

interface ServiceCatalogTableProps {
  services: CatalogService[];
  initialFavorites?: number[];
  isLoggedIn: boolean;
  inPanel?: boolean;
  locale?: AppLocale;
  currency?: AppCurrency;
  blackFridayActive?: boolean;
}

export function ServiceCatalogTable({
  services,
  initialFavorites = [],
  isLoggedIn,
  inPanel = false,
  locale = "en",
  currency = "USD",
  blackFridayActive = false,
}: ServiceCatalogTableProps) {
  const isPt = locale === "pt";
  const NETWORK_TABS = [
    { key: "all", label: isPt ? "Todas Redes" : "All Networks" },
    { key: "instagram", label: "Instagram" },
    { key: "tiktok", label: "TikTok" },
    { key: "youtube", label: "YouTube" },
    { key: "facebook", label: "Facebook" },
    { key: "other", label: isPt ? "Outras Redes" : "Other Networks" },
  ];
  const [network, setNetwork] = useState("all");
  const [query, setQuery] = useState("");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [onlyRefill, setOnlyRefill] = useState(false);
  const [favorites, setFavorites] = useState<number[]>(initialFavorites);
  const [inspectService, setInspectService] = useState<CatalogService | null>(null);

  async function toggleFavorite(serviceId: number) {
    if (!isLoggedIn) return;
    setFavorites((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
    await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceId }),
    }).catch(() => null);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return services.filter((s) => {
      if (network !== "all" && s.network !== network) return false;
      if (onlyFavorites && !favorites.includes(s.id)) return false;
      if (onlyRefill && !s.refill) return false;
      if (q) {
        const displayName = getLocalizedServiceName(s, locale);
        const hay = `${s.id} ${s.name} ${displayName} ${s.categoryName} ${s.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [services, network, query, onlyFavorites, onlyRefill, favorites, locale]);

  const grouped = useMemo(() => {
    const map = new Map<string, CatalogService[]>();
    for (const s of filtered) {
      const list = map.get(s.categoryName) ?? [];
      list.push(s);
      map.set(s.categoryName, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const dark = inPanel;

  return (
    <div className="space-y-5">
      {blackFridayActive && (
        <BlackFridayNoticeStrip tone={dark ? "dark" : "light"} />
      )}
      {/* Barra de filtros */}
      <div className="surface-card p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap gap-2">
          {NETWORK_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setNetwork(tab.key)}
              className={`h-9 rounded-full px-4 text-xs font-bold border transition-colors cursor-pointer ${
                network === tab.key
                  ? "bg-[#7c3ee9] text-white border-[#7c3ee9]"
                  : dark
                    ? "bg-[#120d23] text-[#b7afc9] border-[#2e244d] hover:border-[#8c42ed] hover:text-white"
                    : "bg-[#faf8fd] text-[#5e5868] border-[#ece5f2] hover:border-[#cbb6f0] hover:text-[#111015]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-[#796b89] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                isPt
                  ? "Buscar por ID, rede social ou nome do serviço..."
                  : "Search by ID, platform, or service name..."
              }
              className="input-terminal w-full h-10 pl-9 pr-3 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOnlyRefill((v) => !v)}
              className={`h-10 rounded-xl px-3.5 border text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 ${
                onlyRefill
                  ? "border-[#10B981] bg-[#10B981]/15 text-[#0f8c5f]"
                  : dark
                    ? "border-[#2e244d] bg-[#120d23] text-[#b7afc9]"
                    : "border-[#ece5f2] bg-[#faf8fd] text-[#5e5868]"
              }`}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {isPt ? "Com Reposição" : "Refill Only"}
            </button>

            {isLoggedIn && (
              <button
                type="button"
                onClick={() => setOnlyFavorites((v) => !v)}
                className={`h-10 rounded-xl px-3.5 border text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 ${
                  onlyFavorites
                    ? "border-[#7c3ee9] bg-[#f3ebff] text-[#7c3ee9]"
                    : dark
                      ? "border-[#2e244d] bg-[#120d23] text-[#b7afc9]"
                      : "border-[#ece5f2] bg-[#faf8fd] text-[#5e5868]"
                }`}
              >
                <Star className="h-3.5 w-3.5" />
                {isPt ? `Favoritos (${favorites.length})` : `Favorites (${favorites.length})`}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grupos de serviços */}
      {grouped.length === 0 ? (
        <div className="surface-card p-10 text-center text-sm text-[#796b89]">
          {isPt
            ? "Nenhum serviço encontrado com esses filtros."
            : "No services match your filters."}
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([categoryName, items]) => (
            <div
              key={categoryName}
              className={`overflow-hidden rounded-[18px] border ${
                dark
                  ? "border-[#2e244d] bg-[#18122d]"
                  : "border-[#ece5f2] bg-white shadow-[0_12px_32px_rgba(52,27,76,0.06)]"
              }`}
            >
              <div
                className={`flex items-center justify-between border-b px-5 py-3.5 ${
                  dark
                    ? "border-[#2e244d] bg-[#21193b]"
                    : "border-[#ece5f2] bg-[#faf8fd]"
                }`}
              >
                <h2
                  className={`font-[family-name:var(--font-display)] text-sm sm:text-base font-extrabold ${
                    dark ? "text-[#f7f3ff]" : "text-[#111015]"
                  }`}
                >
                  {categoryName}
                </h2>
                <span className="rounded-full bg-[#f3ebff] px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#7c3ee9]">
                  {items.length} {isPt ? "serviço(s)" : "service(s)"}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr
                      className={`border-b font-mono text-[11px] uppercase tracking-wider ${
                        dark
                          ? "border-[#2e244d] bg-[#120d23] text-[#b7afc9]"
                          : "border-[#ece5f2] bg-[#fcfbfe] text-[#796b89]"
                      }`}
                    >
                      {isLoggedIn && <th className="px-3 py-2.5 w-10">★</th>}
                      <th className="px-3 py-2.5 w-16">ID</th>
                      <th className="px-3 py-2.5">{isPt ? "Serviço" : "Service"}</th>
                      <th className="px-3 py-2.5 text-right">{isPt ? "Valor / 1k" : "Rate / 1k"}</th>
                      <th className="px-3 py-2.5 text-right">Min / Max</th>
                      <th className="px-3 py-2.5">{isPt ? "Tempo Médio" : "Avg. Time"}</th>
                      <th className="px-3 py-2.5 text-right">{isPt ? "Ação" : "Action"}</th>
                    </tr>
                  </thead>
                  <tbody
                    className={`divide-y text-sm ${
                      dark ? "divide-[#2e244d]" : "divide-[#f1ebf8]"
                    }`}
                  >
                    {items.map((s) => {
                      const isFav = favorites.includes(s.id);
                      const marketRate = getServiceMarketRate(s, currency);
                      return (
                        <tr
                          key={s.id}
                          className={
                            dark
                              ? "hover:bg-[#21193b] transition-colors"
                              : "hover:bg-[#faf7ff] transition-colors"
                          }
                        >
                          {isLoggedIn && (
                            <td className="px-3 py-3">
                              <button
                                type="button"
                                aria-label="Favorite service"
                                onClick={() => toggleFavorite(s.id)}
                                className="cursor-pointer text-[#8b80a6] hover:text-[#7c3ee9]"
                              >
                                <Star
                                  className={`h-4 w-4 ${
                                    isFav ? "fill-[#7c3ee9] text-[#7c3ee9]" : ""
                                  }`}
                                />
                              </button>
                            </td>
                          )}
                          <td className="px-3 py-3 font-mono text-xs font-bold text-[#7c3ee9]">
                            #{s.id}
                          </td>
                          <td className="px-3 py-3">
                            <div
                              className={`font-semibold ${
                                dark ? "text-[#f7f3ff]" : "text-[#111015]"
                              }`}
                            >
                              {getLocalizedServiceName(s, locale)}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5 font-mono text-[10px] uppercase">
                              <span
                                className={`rounded-full px-2 py-0.5 border ${
                                  dark
                                    ? "border-[#2e244d] bg-[#120d23] text-[#b7afc9]"
                                    : "border-[#ece5f2] bg-[#faf8fd] text-[#66616d]"
                                }`}
                              >
                                {NETWORK_LABELS[s.network] || s.network}
                              </span>
                              {s.refill && (
                                <span className="rounded-full bg-[#eafbf1] px-2 py-0.5 text-[#137a43] font-bold">
                                  {isPt ? `Reposição ${s.refillDays}D` : `Refill ${s.refillDays}D`}
                                </span>
                              )}
                              {s.dripfeed && (
                                <span className="rounded-full bg-[#f3ebff] px-2 py-0.5 text-[#7c3ee9] font-bold">
                                  Drip-Feed
                                </span>
                              )}
                              {s.cancel && (
                                <span
                                  className={`rounded-full px-2 py-0.5 border ${
                                    dark
                                      ? "border-[#3c2f63] text-[#b7afc9]"
                                      : "border-[#ece5f2] text-[#66616d]"
                                  }`}
                                >
                                  {isPt ? "Cancelável" : "Cancelable"}
                                </span>
                              )}
                            </div>
                          </td>
                          <td
                            className={`px-3 py-3 text-right font-mono font-extrabold whitespace-nowrap ${
                              dark ? "text-[#b889ff]" : "text-[#7c3ee9]"
                            }`}
                          >
                            {blackFridayActive && (
                              <div className="text-[11px] font-semibold text-[#8c829b] line-through tabular-nums">
                                {formatCurrencyAmount(
                                  getBlackFridayPricePair(marketRate, true).compareAtPrice ?? 0,
                                  currency
                                )}
                              </div>
                            )}
                            <div className="inline-flex items-center justify-end gap-1.5">
                              <span className="tabular-nums">
                                {formatCurrencyAmount(marketRate, currency)}
                              </span>
                              {blackFridayActive && (
                                <BlackFridayTag tone={dark ? "dark" : "light"} compact />
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right font-mono text-xs text-[#796b89] whitespace-nowrap">
                            {formatInt(s.min)} / {formatInt(s.max)}
                          </td>
                          <td className="px-3 py-3 font-mono text-xs text-[#796b89] whitespace-nowrap">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {s.averageTime}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setInspectService(s)}
                                className={`inline-flex h-8 items-center gap-1 rounded-lg border px-2.5 text-[11px] font-bold cursor-pointer ${
                                  dark
                                    ? "border-[#3c2f63] text-[#b7afc9] hover:text-white"
                                    : "border-[#ece5f2] text-[#5e5868] hover:border-[#7c3ee9] hover:text-[#7c3ee9]"
                                }`}
                              >
                                <Info className="h-3.5 w-3.5" />
                                {isPt ? "Ver" : "Info"}
                              </button>
                              <Link
                                href={
                                  inPanel || isLoggedIn
                                    ? `/painel?service=${s.id}`
                                    : `/login?tab=register&service=${s.id}`
                                }
                                className="btn-lime inline-flex h-8 items-center px-3 text-[11px] font-bold uppercase"
                              >
                                {isPt ? "Pedir" : "Order"}
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de descrição detalhada */}
      {inspectService && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#130d26]/75 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-[22px] border border-[#ece5f2] bg-white p-6 space-y-4 text-[#111015] shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#ece5f2] pb-4">
              <div>
                <span className="font-mono text-xs font-bold text-[#7c3ee9]">
                  SERVIÇO #{inspectService.id}
                </span>
                <h3 className="mt-1 font-[family-name:var(--font-display)] text-lg font-extrabold text-[#111015]">
                  {getLocalizedServiceName(inspectService, locale)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectService(null)}
                className="p-1 text-[#796b89] hover:text-[#111015] cursor-pointer"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 font-mono text-xs">
              <div className="rounded-xl bg-[#faf8fd] border border-[#ece5f2] p-3">
                <div className="text-[#796b89]">{isPt ? "PREÇO / 1.000" : "RATE / 1,000"}</div>
                {blackFridayActive && (
                  <div className="mt-1 text-[11px] font-semibold text-[#8c829b] line-through tabular-nums">
                    {formatCurrencyAmount(
                      getBlackFridayPricePair(
                        getServiceMarketRate(inspectService, currency),
                        true
                      ).compareAtPrice ?? 0,
                      currency
                    )}
                  </div>
                )}
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-base font-extrabold text-[#7c3ee9]">
                  <span className="tabular-nums">
                    {formatCurrencyAmount(
                      getServiceMarketRate(inspectService, currency),
                      currency
                    )}
                  </span>
                  {blackFridayActive && <BlackFridayTag compact />}
                </div>
              </div>
              <div className="rounded-xl bg-[#faf8fd] border border-[#ece5f2] p-3">
                <div className="text-[#796b89]">MIN</div>
                <div className="mt-1 text-base font-extrabold text-[#111015]">
                  {formatInt(inspectService.min)}
                </div>
              </div>
              <div className="rounded-xl bg-[#faf8fd] border border-[#ece5f2] p-3">
                <div className="text-[#796b89]">MAX</div>
                <div className="mt-1 text-base font-extrabold text-[#111015]">
                  {formatInt(inspectService.max)}
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-[#faf8fd] border border-[#ece5f2] p-4">
              <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#796b89] mb-2">
                {isPt ? "Descrição e Regras de Entrega" : "Delivery Details"}
              </div>
              <p className="whitespace-pre-line text-sm text-[#4a4354] leading-relaxed">
                {getLocalizedServiceDescription(inspectService, locale)}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="inline-flex items-center gap-1.5 font-mono text-xs text-[#66616d]">
                <Zap className="h-3.5 w-3.5 text-[#7c3ee9]" />
                {isPt ? "Tempo médio:" : "Avg. start:"} {inspectService.averageTime}
              </span>
              <Link
                href={
                  isLoggedIn
                    ? `/painel?service=${inspectService.id}`
                    : `/login?tab=register&service=${inspectService.id}`
                }
                className="btn-lime inline-flex h-10 items-center px-5 text-xs font-bold uppercase"
              >
                {isPt ? "Fazer Pedido Agora" : "Order Now"}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
