const TONE_CLASSES: Record<string, string> = {
  lime: "bg-[#C8FF2E]/15 text-[#C8FF2E] border-[#C8FF2E]/40",
  emerald: "bg-[#10B981]/15 text-[#34D399] border-[#10B981]/40",
  amber: "bg-[#F59E0B]/15 text-[#FBBF24] border-[#F59E0B]/40",
  orange: "bg-[#FF6B2C]/15 text-[#FF8A58] border-[#FF6B2C]/40",
  red: "bg-[#EF4444]/15 text-[#F87171] border-[#EF4444]/40",
  zinc: "bg-[#232730] text-[#98A0AD] border-[#323845]",
};

interface StatusBadgeProps {
  label: string;
  tone: "lime" | "emerald" | "amber" | "orange" | "red" | "zinc";
}

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 border font-mono text-[11px] uppercase tracking-wider font-medium ${TONE_CLASSES[tone]}`}
    >
      <span className="h-1.5 w-1.5 bg-current" aria-hidden="true" />
      {label}
    </span>
  );
}
