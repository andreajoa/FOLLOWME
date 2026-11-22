"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { LandingFaqItem } from "@/lib/landing-copy";

export function FaqAccordion({ items }: { items: LandingFaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number>(0);

  return (
    <div className="divide-y divide-[#232730] border-y border-[#232730]">
      {items.map((item, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div key={item.q} className="py-1">
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpenIndex(isOpen ? -1 : idx)}
              className="flex w-full items-center justify-between gap-6 py-5 text-left cursor-pointer group"
            >
              <span className="font-[family-name:var(--font-display)] text-base sm:text-lg font-semibold text-[#F4F5F6] group-hover:text-[#C8FF2E] transition-colors">
                {item.q}
              </span>
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center border border-[#323845] text-[#C8FF2E] transition-transform duration-200 ${
                  isOpen ? "rotate-45 border-[#C8FF2E] bg-[#C8FF2E]/10" : ""
                }`}
              >
                <Plus className="h-4 w-4" />
              </span>
            </button>
            <div
              className="grid transition-[grid-template-rows] duration-250 ease-out"
              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <p className="pb-6 pr-10 text-sm sm:text-base text-[#98A0AD] leading-relaxed max-w-[68ch]">
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
