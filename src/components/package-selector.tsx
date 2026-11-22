"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Clock,
  Heart,
  MessageSquare,
  Play,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  AppCurrency,
  AppLocale,
  formatCurrencyAmount,
  formatNumberForLocale,
  getLocalizedServiceName,
  getServiceMarketRate,
  inferMetricType,
  ServiceMetricType,
} from "@/lib/i18n";
import { getLandingCopy } from "@/lib/landing-copy";
import { SpotlightSurface } from "./motion-primitives";

export interface StorefrontService {
  id: number;
  name: string;
  nameEn?: string | null;
  categoryName: string;
  network: string;
  metricType?: string | null;
  type: string;
  rate: number;
  rateUsd?: number | null;
  min: number;
  max: number;
  averageTime: string;
  refill: boolean;
  refillDays: number;
  dripfeed: boolean;
}

interface PackageSelectorProps {
  services: StorefrontService[];
  locale: AppLocale;
  currency: AppCurrency;
  isLoggedIn: boolean;
  initialNetwork?: "instagram" | "tiktok" | "youtube";
  initialMetric?: ServiceMetricType;
}

const NETWORKS: Array<{ id: "instagram" | "tiktok" | "youtube"; label: string }> = [
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube" },
];

const QUANTITIES_BY_METRIC: Record<ServiceMetricType, number[]> = {
  followers: [100, 500, 1000, 2500, 5000],
  likes: [100, 500, 1000, 2500, 5000],
  views: [1000, 5000, 10000, 25000, 50000],
  comments: [10, 25, 50, 100, 250],
  other: [100, 500, 1000, 2500, 5000],
};

function computePackagePrice(ratePer1k: number, quantity: number, type: string): number {
  if (type === "PACKAGE") return ratePer1k;
  const raw = (quantity / 1000) * ratePer1k;
  return Math.max(0.49, Math.round(raw * 100) / 100);
}

export function PackageSelector({
  services,
  locale,
  currency,
  isLoggedIn,
  initialNetwork = "instagram",
  initialMetric = "followers",
}: PackageSelectorProps) {
  const copy = getLandingCopy(locale).selector;
  const [network, setNetwork] = useState<"instagram" | "tiktok" | "youtube">(initialNetwork);
  const [metric, setMetric] = useState<ServiceMetricType>(initialMetric);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [selectedQty, setSelectedQty] = useState<number>(1000);

  const enriched = useMemo(
    () =>
      services.map((s) => ({
        ...s,
        resolvedMetric:
          (s.metricType as ServiceMetricType | undefined) ||
          inferMetricType(s.name, s.type),
        displayName: getLocalizedServiceName(s, locale),
        marketRate: getServiceMarketRate(s, currency),
      })),
    [services, locale, currency]
  );

  const networkServices = useMemo(
    () =>
      enriched.filter(
        (s) => s.network === network && s.type !== "PACKAGE" && s.type !== "SUBSCRIPTIONS"
      ),
    [enriched, network]
  );

  const availableMetrics = useMemo(() => {
    const order: ServiceMetricType[] = ["followers", "likes", "views", "comments"];
    return order.filter((m) => networkServices.some((s) => s.resolvedMetric === m));
  }, [networkServices]);

  const activeMetric: ServiceMetricType = availableMetrics.includes(metric)
    ? metric
    : availableMetrics[0] || "followers";

  const tierServices = useMemo(
    () =>
      networkServices
        .filter((s) => s.resolvedMetric === activeMetric)
        .sort((a, b) => a.marketRate - b.marketRate),
    [networkServices, activeMetric]
  );

  const activeService = useMemo(() => {
    if (selectedServiceId) {
      const exact = tierServices.find((s) => s.id === selectedServiceId);
      if (exact) return exact;
    }
    return tierServices.find((s) => s.refill) || tierServices[0] || null;
  }, [tierServices, selectedServiceId]);

  const quantityOptions = useMemo(() => {
    const base = QUANTITIES_BY_METRIC[activeMetric] || QUANTITIES_BY_METRIC.followers;
    if (!activeService) return base;
    const valid = base.filter((q) => q >= activeService.min && q <= activeService.max);
    return valid.length > 0
      ? valid
      : [activeService.min, Math.min(activeService.max, activeService.min * 5)];
  }, [activeMetric, activeService]);

  const effectiveQty = quantityOptions.includes(selectedQty)
    ? selectedQty
    : quantityOptions[Math.min(2, quantityOptions.length - 1)] || 1000;

  const finalPrice = activeService
    ? computePackagePrice(activeService.marketRate, effectiveQty, activeService.type)
    : 0;

  const metricLabel = (m: ServiceMetricType) => {
    if (m === "followers") {
      return network === "youtube" ? copy.goals.subscribers : copy.goals.followers;
    }
    if (m === "likes") return copy.goals.likes;
    if (m === "views") return copy.goals.views;
    if (m === "comments") return copy.goals.comments;
    return copy.goals.followers;
  };

  const metricIcon = (m: ServiceMetricType) => {
    if (m === "followers") return Users;
    if (m === "likes") return Heart;
    if (m === "views") return Play;
    return MessageSquare;
  };

  function handleNetworkChange(nextNet: "instagram" | "tiktok" | "youtube") {
    setNetwork(nextNet);
    setMetric("followers");
    setSelectedServiceId(null);
    setSelectedQty(1000);
  }

  function handleMetricChange(nextMetric: ServiceMetricType) {
    setMetric(nextMetric);
    setSelectedServiceId(null);
    const defaults = QUANTITIES_BY_METRIC[nextMetric];
    setSelectedQty(defaults[Math.min(2, defaults.length - 1)] || 1000);
  }

  const orderHref = activeService
    ? isLoggedIn
      ? `/painel?service=${activeService.id}&qty=${effectiveQty}`
      : `/login?tab=register&service=${activeService.id}&qty=${effectiveQty}`
    : "/servicos";

  return (
    <SpotlightSurface className="rounded-[24px] border-2 border-[#e5ddf3] bg-white p-6 sm:p-8 lg:p-10 shadow-[0_20px_54px_rgba(61,27,108,0.09)]">
      <div className="space-y-8">
        {/* Step 1 + Step 2 Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end border-b border-[#ece5f2] pb-7">
          <div className="lg:col-span-5">
            <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#796b89] mb-2.5">
              {copy.stepNetwork}
            </div>
            <div className="grid grid-cols-3 gap-2 rounded-[16px] bg-[#f4f0fb] p-1.5 border border-[#e6dcf5]">
              {NETWORKS.map((net) => {
                const active = network === net.id;
                return (
                  <button
                    key={net.id}
                    type="button"
                    onClick={() => handleNetworkChange(net.id)}
                    className={`h-11 rounded-[11px] px-3 text-sm font-bold transition-all cursor-pointer active:scale-[0.98] ${
                      active
                        ? "bg-[#161b30] text-white shadow-[0_6px_16px_rgba(22,27,48,0.2)]"
                        : "bg-transparent text-[#574f63] hover:text-[#111015] hover:bg-white/70"
                    }`}
                  >
                    {net.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#796b89] mb-2.5">
              {copy.stepGoal}
            </div>
            <div className="flex flex-wrap gap-2">
              {availableMetrics.map((m) => {
                const Icon = metricIcon(m);
                const active = activeMetric === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleMetricChange(m)}
                    className={`h-12 rounded-full px-4 inline-flex items-center gap-2 border-2 text-sm font-bold transition-all cursor-pointer active:scale-[0.98] ${
                      active
                        ? "border-[#7c3ee9] bg-[#f3ebff] text-[#6730cf] shadow-[0_4px_12px_rgba(124,62,233,0.14)]"
                        : "border-[#ece5f2] bg-[#faf8fd] text-[#5c5468] hover:border-[#c8b2ef] hover:text-[#111015]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {metricLabel(m)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step 3: Tier Selector */}
        {tierServices.length > 1 && (
          <div>
            <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#796b89] mb-2.5">
              {copy.stepTier}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {tierServices.slice(0, 3).map((srv) => {
                const isSelected = activeService?.id === srv.id;
                return (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => setSelectedServiceId(srv.id)}
                    className={`rounded-[16px] p-4 border-2 text-left transition-all cursor-pointer active:scale-[0.99] ${
                      isSelected
                        ? "border-[#7c3ee9] bg-[#f7f2ff] shadow-[0_8px_22px_rgba(124,62,233,0.12)]"
                        : "border-[#ece5f2] bg-[#fcfbfe] hover:border-[#cbb6f0]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-bold text-[#111015] leading-snug">
                        {srv.displayName}
                      </span>
                      {isSelected && (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#7c3ee9] text-white">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between font-mono text-xs">
                      <span className="text-[#7c3ee9] font-extrabold">
                        {formatCurrencyAmount(srv.marketRate, currency)} {copy.per1kLabel}
                      </span>
                      {srv.refill && (
                        <span className="rounded-full bg-[#eafbf1] px-2 py-0.5 text-[11px] font-semibold text-[#137a43]">
                          {srv.refillDays}d {copy.refillLabel}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4: Quantity Package Cards */}
        {activeService ? (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#796b89]">
                {copy.stepQuantity}
              </div>
              <div className="rounded-full bg-[#f3ebff] px-3 py-1 font-mono text-xs font-semibold text-[#6730cf]">
                {activeService.displayName}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {quantityOptions.map((qty, idx) => {
                const price = computePackagePrice(
                  activeService.marketRate,
                  qty,
                  activeService.type
                );
                const isSelected = effectiveQty === qty;
                const isPopular = idx === Math.min(2, quantityOptions.length - 1);

                return (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => setSelectedQty(qty)}
                    className={`relative flex flex-col justify-between rounded-[18px] p-4 sm:p-5 border-2 text-left transition-all cursor-pointer active:scale-[0.98] ${
                      isSelected
                        ? "border-[#7c3ee9] bg-[#f4ecff] shadow-[0_10px_24px_rgba(124,62,233,0.16)]"
                        : "border-[#ece5f2] bg-[#faf8fd] hover:border-[#cbb6f0] hover:bg-white"
                    }`}
                  >
                    {isPopular && (
                      <span className="mb-2 inline-block self-start rounded-full bg-[#7c3ee9] px-2.5 py-0.5 font-mono text-[10px] font-bold text-white">
                        {copy.popularBadge}
                      </span>
                    )}
                    <div>
                      <div className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-black tracking-[-0.04em] text-[#111015] tabular-nums">
                        {formatNumberForLocale(qty, locale)}
                      </div>
                      <div className="mt-0.5 text-xs font-medium text-[#66616d]">
                        {metricLabel(activeMetric)}
                      </div>
                    </div>
                    <div className="mt-5 pt-3 border-t border-[#e5ddf2] flex items-baseline justify-between">
                      <span className="font-mono text-lg sm:text-xl font-extrabold text-[#7c3ee9] tabular-nums">
                        {formatCurrencyAmount(price, currency)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Instant Summary & Action Bar */}
            <div className="mt-7 flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-t border-[#ece5f2] pt-6">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-[#5e5868]">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-[#7c3ee9]" />
                  {copy.noPasswordNote}
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono">
                  <Clock className="h-3.5 w-3.5 text-[#7c3ee9]" />
                  {copy.startTimeLabel}: {activeService.averageTime}
                </span>
                {activeService.refill && (
                  <span className="inline-flex items-center gap-1.5 font-mono font-semibold text-[#111015]">
                    <RefreshCw className="h-3.5 w-3.5 text-[#7c3ee9]" />
                    {activeService.refillDays} {copy.refillLabel}
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                <Link
                  href={orderHref}
                  className="btn-lime inline-flex h-12 items-center justify-center gap-2 px-6 text-sm font-bold whitespace-nowrap"
                >
                  {copy.orderBtnPrefix} {formatNumberForLocale(effectiveQty, locale)}{" "}
                  {metricLabel(activeMetric)} ({formatCurrencyAmount(finalPrice, currency)})
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/servicos"
                  className="btn-outline inline-flex h-12 items-center justify-center px-5 text-sm font-semibold whitespace-nowrap"
                >
                  {copy.allServicesLink}
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-10 text-center text-sm text-[#66616d]">
            {copy.emptyState}
          </div>
        )}
      </div>
    </SpotlightSurface>
  );
}
