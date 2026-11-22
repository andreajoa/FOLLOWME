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
}: PackageSelectorProps) {
  const copy = getLandingCopy(locale).selector;
  const [network, setNetwork] = useState<"instagram" | "tiktok" | "youtube">(initialNetwork);
  const [metric, setMetric] = useState<ServiceMetricType>("followers");
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
    () => enriched.filter((s) => s.network === network && s.type !== "PACKAGE" && s.type !== "SUBSCRIPTIONS"),
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
    return valid.length > 0 ? valid : [activeService.min, Math.min(activeService.max, activeService.min * 5)];
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
    <SpotlightSurface className="border border-[#232730] bg-[#111317] p-6 sm:p-8 lg:p-10">
      <div className="space-y-8">
        {/* Step 1 + Step 2 Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end border-b border-[#232730] pb-7">
          <div className="lg:col-span-5">
            <div className="font-mono text-[11px] text-[#98A0AD] mb-2.5">
              {copy.stepNetwork}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {NETWORKS.map((net) => {
                const active = network === net.id;
                return (
                  <button
                    key={net.id}
                    type="button"
                    onClick={() => handleNetworkChange(net.id)}
                    className={`h-12 px-3 font-[family-name:var(--font-display)] text-sm font-bold border transition-all cursor-pointer active:scale-[0.98] ${
                      active
                        ? "border-[#C8FF2E] bg-[#C8FF2E] text-[#090A0C]"
                        : "border-[#2A2F3A] bg-[#0B0D11] text-[#D2D7E0] hover:border-[#C8FF2E]/60 hover:text-[#F4F5F6]"
                    }`}
                  >
                    {net.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="font-mono text-[11px] text-[#98A0AD] mb-2.5">
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
                    className={`h-12 px-4 inline-flex items-center gap-2 border text-sm font-semibold transition-all cursor-pointer active:scale-[0.98] ${
                      active
                        ? "border-[#C8FF2E] bg-[#C8FF2E]/12 text-[#C8FF2E]"
                        : "border-[#2A2F3A] bg-[#0B0D11] text-[#98A0AD] hover:border-[#3A4150] hover:text-[#F4F5F6]"
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

        {/* Step 3: Tier Selector (when multiple tiers exist for this network + metric) */}
        {tierServices.length > 1 && (
          <div>
            <div className="font-mono text-[11px] text-[#98A0AD] mb-2.5">
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
                    className={`p-4 border text-left transition-all cursor-pointer active:scale-[0.99] ${
                      isSelected
                        ? "border-[#C8FF2E] bg-[#161A1E]"
                        : "border-[#232730] bg-[#0B0D11] hover:border-[#38404F]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-semibold text-[#F4F5F6] leading-snug">
                        {srv.displayName}
                      </span>
                      {isSelected && (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center bg-[#C8FF2E] text-[#090A0C]">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between font-mono text-xs">
                      <span className="text-[#C8FF2E] font-bold">
                        {formatCurrencyAmount(srv.marketRate, currency)} {copy.per1kLabel}
                      </span>
                      {srv.refill && (
                        <span className="text-[#98A0AD]">
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

        {/* Step 4: Crystal-Clear Quantity Package Cards */}
        {activeService ? (
          <div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="font-mono text-[11px] text-[#98A0AD]">
                {copy.stepQuantity}
              </div>
              <div className="font-mono text-xs text-[#98A0AD]">
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
                    className={`relative flex flex-col justify-between p-4 sm:p-5 border text-left transition-all cursor-pointer active:scale-[0.98] ${
                      isSelected
                        ? "border-[#C8FF2E] bg-[#C8FF2E]/10"
                        : "border-[#232730] bg-[#0B0D11] hover:border-[#3D4555]"
                    }`}
                  >
                    {isPopular && (
                      <span className="mb-2 inline-block self-start bg-[#C8FF2E] px-2 py-0.5 font-mono text-[10px] font-bold text-[#090A0C]">
                        {copy.popularBadge}
                      </span>
                    )}
                    <div>
                      <div className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold text-[#F4F5F6] tabular-nums">
                        {formatNumberForLocale(qty, locale)}
                      </div>
                      <div className="mt-0.5 text-xs text-[#98A0AD]">
                        {metricLabel(activeMetric)}
                      </div>
                    </div>
                    <div className="mt-5 pt-3 border-t border-[#232730] flex items-baseline justify-between">
                      <span className="font-mono text-lg sm:text-xl font-bold text-[#C8FF2E] tabular-nums">
                        {formatCurrencyAmount(price, currency)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Instant Summary & Action Bar */}
            <div className="mt-7 flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-t border-[#232730] pt-6">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[#98A0AD]">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-[#C8FF2E]" />
                  {copy.noPasswordNote}
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono">
                  <Clock className="h-3.5 w-3.5 text-[#C8FF2E]" />
                  {copy.startTimeLabel}: {activeService.averageTime}
                </span>
                {activeService.refill && (
                  <span className="inline-flex items-center gap-1.5 font-mono text-[#F4F5F6]">
                    <RefreshCw className="h-3.5 w-3.5 text-[#C8FF2E]" />
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
                  className="btn-outline inline-flex h-12 items-center justify-center px-5 text-sm font-medium whitespace-nowrap"
                >
                  {copy.allServicesLink}
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-10 text-center text-sm text-[#98A0AD]">
            {copy.emptyState}
          </div>
        )}
      </div>
    </SpotlightSurface>
  );
}
