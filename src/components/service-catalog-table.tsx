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
}

export function ServiceCatalogTable({
  services,
  initialFavorites = [],
  isLoggedIn,
  inPanel = false,
  locale = "en",
  currency = "USD",
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

  return (
    <div className="space-y-5">
      {/* Barra de filtros */}
      <div className="surface-card p-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          {NETWORK_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setNetwork(tab.key)}
              className={`h-9 px-3.5 font-mono text-xs uppercase tracking-wider border transition-colors cursor-pointer ${
                network === tab.key
                  ? "bg-[#C8FF2E] text-[#090A0C] border-[#C8FF2E] font-bold"
                  : "bg-[#0C0E12] text-[#98A0AD] border-[#232730] hover:border-[#323845] hover:text-[#F4F5F6]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-[#68707E] absolute left-3 top-1/2 -translate-y-1/2" />
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
              className={`h-10 px-3 border font-mono text-xs uppercase cursor-pointer inline-flex items-center gap-1.5 ${
                onlyRefill
                  ? "border-[#10B981] bg-[#10B981]/15 text-[#34D399]"
                  : "border-[#232730] bg-[#0C0E12] text-[#98A0AD]"
              }`}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {isPt ? "Com Reposição" : "Refill Only"}
            </button>

            {isLoggedIn && (
              <button
                type="button"
                onClick={() => setOnlyFavorites((v) => !v)}
                className={`h-10 px-3 border font-mono text-xs uppercase cursor-pointer inline-flex items-center gap-1.5 ${
                  onlyFavorites
                    ? "border-[#FF6B2C] bg-[#FF6B2C]/15 text-[#FF8A58]"
                    : "border-[#232730] bg-[#0C0E12] text-[#98A0AD]"
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
        <div className="surface-card p-10 text-center font-mono text-sm text-[#98A0AD]">
          Nenhum serviço encontrado com esses filtros.
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([categoryName, items]) => (
            <div key={categoryName} className="border border-[#232730] bg-[#111317]">
              <div className="flex items-center justify-between border-b border-[#232730] bg-[#171A20] px-4 py-3">
                <h2 className="font-[family-name:var(--font-display)] text-sm sm:text-base font-bold text-[#F4F5F6]">
                  {categoryName}
                </h2>
                <span className="font-mono text-[11px] text-[#C8FF2E]">
                  {items.length} serviço(s)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#232730] bg-[#0C0E12] font-mono text-[11px] uppercase tracking-wider text-[#98A0AD]">
                      {isLoggedIn && <th className="px-3 py-2.5 w-10">★</th>}
                      <th className="px-3 py-2.5 w-16">ID</th>
                      <th className="px-3 py-2.5">{isPt ? "Serviço" : "Service"}</th>
                      <th className="px-3 py-2.5 text-right">{isPt ? "Valor / 1k" : "Rate / 1k"}</th>
                      <th className="px-3 py-2.5 text-right">Min / Max</th>
                      <th className="px-3 py-2.5">{isPt ? "Tempo Médio" : "Avg. Time"}</th>
                      <th className="px-3 py-2.5 text-right">{isPt ? "Ação" : "Action"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#232730] text-sm">
                    {items.map((s) => {
                      const isFav = favorites.includes(s.id);
                      const marketRate = getServiceMarketRate(s, currency);
                      return (
                        <tr key={s.id} className="hover:bg-[#171A20] transition-colors">
                          {isLoggedIn && (
                            <td className="px-3 py-3">
                              <button
                                type="button"
                                aria-label="Favorite service"
                                onClick={() => toggleFavorite(s.id)}
                                className="cursor-pointer text-[#68707E] hover:text-[#FF6B2C]"
                              >
                                <Star
                                  className={`h-4 w-4 ${
                                    isFav ? "fill-[#FF6B2C] text-[#FF6B2C]" : ""
                                  }`}
                                />
                              </button>
                            </td>
                          )}
                          <td className="px-3 py-3 font-mono text-xs text-[#C8FF2E]">
                            #{s.id}
                          </td>
                          <td className="px-3 py-3">
                            <div className="font-medium text-[#F4F5F6]">
                              {getLocalizedServiceName(s, locale)}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase">
                              <span className="border border-[#232730] bg-[#0C0E12] px-1.5 py-0.5 text-[#98A0AD]">
                                {NETWORK_LABELS[s.network] || s.network}
                              </span>
                              {s.refill && (
                                <span className="border border-[#10B981]/40 bg-[#10B981]/10 px-1.5 py-0.5 text-[#34D399]">
                                  {isPt ? `Reposição ${s.refillDays}D` : `Refill ${s.refillDays}D`}
                                </span>
                              )}
                              {s.dripfeed && (
                                <span className="border border-[#FF6B2C]/40 bg-[#FF6B2C]/10 px-1.5 py-0.5 text-[#FF8A58]">
                                  Drip-Feed
                                </span>
                              )}
                              {s.cancel && (
                                <span className="border border-[#323845] px-1.5 py-0.5 text-[#98A0AD]">
                                  {isPt ? "Cancelável" : "Cancelable"}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right font-mono font-bold text-[#F4F5F6] whitespace-nowrap">
                            {formatCurrencyAmount(marketRate, currency)}
                          </td>
                          <td className="px-3 py-3 text-right font-mono text-xs text-[#98A0AD] whitespace-nowrap">
                            {formatInt(s.min)} / {formatInt(s.max)}
                          </td>
                          <td className="px-3 py-3 font-mono text-xs text-[#98A0AD] whitespace-nowrap">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3 text-[#68707E]" />
                              {s.averageTime}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setInspectService(s)}
                                className="inline-flex h-8 items-center gap-1 border border-[#323845] px-2.5 font-mono text-[11px] uppercase text-[#98A0AD] hover:border-[#F4F5F6] hover:text-[#F4F5F6] cursor-pointer"
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
                                className="btn-lime inline-flex h-8 items-center px-2.5 font-mono text-[11px] uppercase"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg border border-[#323845] bg-[#111317] p-6 space-y-4">
            <div className="flex items-start justify-between gap-4 border-b border-[#232730] pb-4">
              <div>
                <span className="font-mono text-xs text-[#C8FF2E]">
                  SERVIÇO #{inspectService.id}
                </span>
                <h3 className="mt-1 font-[family-name:var(--font-display)] text-lg font-bold text-[#F4F5F6]">
                  {getLocalizedServiceName(inspectService, locale)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectService(null)}
                className="p-1 text-[#98A0AD] hover:text-[#F4F5F6] cursor-pointer"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 font-mono text-xs">
              <div className="bg-[#0C0E12] border border-[#232730] p-3">
                <div className="text-[#68707E]">{isPt ? "PREÇO / 1.000" : "RATE / 1,000"}</div>
                <div className="mt-1 text-base font-bold text-[#C8FF2E]">
                  {formatCurrencyAmount(
                    getServiceMarketRate(inspectService, currency),
                    currency
                  )}
                </div>
              </div>
              <div className="bg-[#0C0E12] border border-[#232730] p-3">
                <div className="text-[#68707E]">MIN</div>
                <div className="mt-1 text-base font-bold text-[#F4F5F6]">
                  {formatInt(inspectService.min)}
                </div>
              </div>
              <div className="bg-[#0C0E12] border border-[#232730] p-3">
                <div className="text-[#68707E]">MAX</div>
                <div className="mt-1 text-base font-bold text-[#F4F5F6]">
                  {formatInt(inspectService.max)}
                </div>
              </div>
            </div>

            <div className="bg-[#0C0E12] border border-[#232730] p-4">
              <div className="font-mono text-[11px] uppercase tracking-wider text-[#98A0AD] mb-2">
                {isPt ? "Descrição e Regras de Entrega" : "Delivery Details"}
              </div>
              <p className="whitespace-pre-line text-sm text-[#D2D7E0] leading-relaxed">
                {getLocalizedServiceDescription(inspectService, locale)}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="inline-flex items-center gap-1.5 font-mono text-xs text-[#98A0AD]">
                <Zap className="h-3.5 w-3.5 text-[#FF6B2C]" />
                {isPt ? "Tempo médio:" : "Avg. start:"} {inspectService.averageTime}
              </span>
              <Link
                href={
                  isLoggedIn
                    ? `/painel?service=${inspectService.id}`
                    : `/login?tab=register&service=${inspectService.id}`
                }
                className="btn-lime inline-flex h-10 items-center px-5 font-mono text-xs uppercase"
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
