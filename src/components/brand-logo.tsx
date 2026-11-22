import Link from "next/link";

interface BrandLogoProps {
  name: string;
  href?: string;
  compact?: boolean;
}

export function BrandLogo({ name, href = "/", compact = false }: BrandLogoProps) {
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2.5 group focus:outline-none"
    >
      <span className="inline-flex h-8 w-8 items-center justify-center bg-[#C8FF2E] text-[#090A0C] font-mono text-xs font-bold tracking-tighter border border-[#C8FF2E] group-hover:bg-[#D7FF63] transition-colors">
        {initials}
      </span>
      {!compact && (
        <span className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-[#F4F5F6]">
          {name}
          <span className="ml-1.5 font-mono text-[10px] uppercase tracking-widest text-[#C8FF2E] border border-[#C8FF2E]/40 px-1.5 py-0.5 align-middle">
            SMM
          </span>
        </span>
      )}
    </Link>
  );
}
