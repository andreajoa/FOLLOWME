import { Tag } from "lucide-react";

export function BlackFridayTopBanner() {
  return (
    <div
      role="region"
      aria-label="Preços de Black Friday Brasil"
      className="w-full bg-[#111015] text-white border-b border-[#f8d449]/35"
    >
      <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-xs sm:text-[13px] font-bold">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#f8d449] px-2.5 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider text-[#111015]">
          <Tag className="h-3 w-3" />
          BLACK FRIDAY
        </span>
        <span>
          PREÇOS DE BLACK FRIDAY NO BRASIL (50% OFF) — Válido até{" "}
          <span className="text-[#f8d449]">14/12</span>. Em{" "}
          <span className="text-[#f8d449]">15/12</span> os preços voltam ao dobro.
        </span>
      </div>
    </div>
  );
}

export function BlackFridayTag({
  tone = "light",
  compact = false,
}: {
  tone?: "light" | "dark";
  compact?: boolean;
}) {
  const palette =
    tone === "dark"
      ? "bg-[#f8d449] text-[#111015] border-[#f8d449]"
      : "bg-[#111015] text-[#f8d449] border-[#111015]";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-mono font-black uppercase tracking-wider whitespace-nowrap ${palette} ${
        compact ? "px-1.5 py-0.5 text-[9px] leading-none" : "px-2 py-0.5 text-[10px] leading-none"
      }`}
    >
      BLACK FRIDAY
    </span>
  );
}

export function BlackFridayNoticeStrip({ tone = "light" }: { tone?: "light" | "dark" }) {
  if (tone === "dark") {
    return (
      <div className="rounded-xl border border-[#f8d449]/40 bg-[#1a1529] px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2 text-[#f7f3ff] font-semibold">
          <BlackFridayTag tone="dark" />
          <span>
            Preços de Black Friday exclusivos para o Brasil (50% OFF). A partir de{" "}
            <strong className="text-[#f8d449]">15/12 às 00h</strong>, os valores passam automaticamente para o dobro.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-[#111015] bg-[#111015] text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-[0_12px_30px_rgba(17,16,21,0.16)]">
      <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm font-bold">
        <BlackFridayTag tone="dark" />
        <span>
          Preços de Black Friday (50% OFF) ativos somente no Brasil até{" "}
          <span className="text-[#f8d449]">14/12</span> — em{" "}
          <span className="text-[#f8d449]">15/12</span> voltam automaticamente ao dobro.
        </span>
      </div>
    </div>
  );
}
