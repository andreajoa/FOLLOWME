"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { LandingFaqItem } from "@/lib/landing-copy";

export function FaqAccordion({ items }: { items: LandingFaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number>(0);

  return (
    <div className="divide-y divide-[#e5e2ee] border-y border-[#e5e2ee]">
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
              <span className="font-[family-name:var(--font-display)] text-base sm:text-lg font-bold tracking-[-0.02em] text-[#111015] group-hover:text-[#7c3ee9] transition-colors">
                {item.q}
              </span>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-200 ${
                  isOpen
                    ? "rotate-45 border-[#7c3ee9] bg-[#7c3ee9] text-white"
                    : "border-[#d8cee8] bg-[#f7f3ff] text-[#7c3ee9] group-hover:border-[#7c3ee9]"
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
                <p className="pb-6 pr-10 text-sm sm:text-base text-[#5e5868] leading-relaxed max-w-[68ch]">
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
