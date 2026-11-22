import Link from "next/link";
import { Zap } from "lucide-react";

interface BrandLogoProps {
  name: string;
  href?: string;
  compact?: boolean;
  inverted?: boolean;
}

export function BrandLogo({
  name,
  href = "/",
  compact = false,
  inverted = false,
}: BrandLogoProps) {
  const splitIdx = name.toLowerCase().startsWith("follow") ? 6 : Math.ceil(name.length / 2);
  const firstPart = name.slice(0, splitIdx);
  const secondPart = name.slice(splitIdx);

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 group focus:outline-none"
    >
      <span
        className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] text-white shadow-[0_6px_16px_rgba(124,62,233,0.32)] transition-transform group-hover:scale-105"
        style={{
          background: "linear-gradient(160deg, #fc8ad4 0%, #7432ed 100%)",
        }}
      >
        <Zap className="h-4 w-4 fill-white text-white" />
      </span>
      {!compact && (
        <span
          className={`font-[family-name:var(--font-display)] text-[1.22rem] font-black tracking-[-0.04em] ${
            inverted ? "text-[#f7f3ff]" : "text-[#111015]"
          }`}
        >
          {firstPart}
          <span className={inverted ? "text-[#b889ff]" : "text-[#813be9]"}>
            {secondPart}
          </span>
        </span>
      )}
    </Link>
  );
}
