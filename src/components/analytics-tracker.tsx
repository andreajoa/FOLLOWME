"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const VISITOR_KEY = "fm_vid_v1";
const SESSION_KEY = "fm_sid_v1";

function getOrCreateId(storage: Storage, key: string): string {
  try {
    const existing = storage.getItem(key);
    if (existing && existing.length >= 8) return existing;
    const next =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
    storage.setItem(key, next);
    return next;
  } catch {
    return `anon-${Math.random().toString(36).slice(2, 12)}`;
  }
}

function sendEvent(payload: Record<string, unknown>) {
  const body = JSON.stringify(payload);
  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon("/api/analytics/track", blob)) {
        return;
      }
    }
  } catch {
    // Fallback to keepalive fetch
  }
  fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => null);
}

function inferArea(el: HTMLElement): string {
  const explicit = el.closest("[data-track-area]")?.getAttribute("data-track-area");
  if (explicit) return explicit.slice(0, 60);
  if (el.closest("header")) return "header";
  if (el.closest("footer")) return "footer";
  if (el.closest("#packages")) return "seletor_pacotes";
  if (el.closest("table")) return "tabela_servicos";
  if (el.closest("form")) return "formulario";
  const section = el.closest("section");
  if (section?.id) return section.id.slice(0, 60);
  if (el.closest("nav")) return "navegacao";
  if (el.closest("main")) return "conteudo";
  return "pagina";
}

function inferLabel(el: HTMLElement): string {
  const custom = el.getAttribute("data-track") || el.getAttribute("aria-label");
  if (custom && custom.trim()) return custom.trim().slice(0, 140);
  const text = (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
  if (text) return text.slice(0, 140);
  const href = el.getAttribute("href");
  if (href) return href.slice(0, 140);
  return el.tagName.toLowerCase();
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string>("");

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/dashboard")) {
      return;
    }

    const visitorId = getOrCreateId(window.localStorage, VISITOR_KEY);
    const sessionId = getOrCreateId(window.sessionStorage, SESSION_KEY);
    const searchParams = new URLSearchParams(window.location.search);

    if (lastTrackedPath.current !== pathname) {
      lastTrackedPath.current = pathname;
      sendEvent({
        eventType: "PAGE_VIEW",
        visitorId,
        sessionId,
        path: pathname,
        referrer: document.referrer || null,
        utmSource: searchParams.get("utm_source"),
        utmMedium: searchParams.get("utm_medium"),
        utmCampaign: searchParams.get("utm_campaign"),
        locale: document.documentElement.lang || navigator.language || null,
      });
    }

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const clickable = target.closest(
        'a, button, [role="button"], [data-track]'
      ) as HTMLElement | null;
      if (!clickable) return;

      const label = inferLabel(clickable);
      if (!label) return;

      sendEvent({
        eventType: "CLICK",
        visitorId,
        sessionId,
        path: window.location.pathname || pathname,
        targetLabel: label,
        targetHref: clickable.getAttribute("href"),
        targetArea: inferArea(clickable),
        elementTag: clickable.tagName.toLowerCase(),
        locale: document.documentElement.lang || navigator.language || null,
      });
    };

    document.addEventListener("click", handleClick, { capture: true, passive: true });
    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
    };
  }, [pathname]);

  return null;
}
