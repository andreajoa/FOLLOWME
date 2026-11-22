"use client";

import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";

function checkReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Continuous looping real video backdrop.
 * Always plays smoothly when in viewport and never gets stuck on a static poster frame.
 */
export function AmbientVideoBackdrop({
  src,
  poster,
  className = "",
  playbackRate = 1,
}: {
  src: string;
  poster: string;
  className?: string;
  playbackRate?: number;
  fadeSeconds?: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.defaultMuted = true;
    video.muted = true;
    video.loop = true;
    video.playbackRate = playbackRate;

    if (checkReducedMotion()) {
      video.pause();
      return;
    }

    const ensurePlaying = () => {
      if (!video) return;
      video.playbackRate = playbackRate;
      if (video.paused) {
        video.play().catch(() => {});
      }
    };

    ensurePlaying();

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          ensurePlaying();
        }
      },
      { threshold: 0.05 }
    );
    obs.observe(video);

    video.addEventListener("loadeddata", ensurePlaying);
    video.addEventListener("canplay", ensurePlaying);
    video.addEventListener("ended", ensurePlaying);

    return () => {
      obs.disconnect();
      video.removeEventListener("loadeddata", ensurePlaying);
      video.removeEventListener("canplay", ensurePlaying);
      video.removeEventListener("ended", ensurePlaying);
    };
  }, [playbackRate, src]);

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden bg-[#090A0C] ${className}`} aria-hidden="true">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
    </div>
  );
}

/**
 * Interactive cursor-tracked light surface using CSS variables (zero React re-renders).
 */
export function SpotlightSurface({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse" || checkReducedMotion()) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${Math.round(e.clientX - rect.left)}px`);
    el.style.setProperty("--my", `${Math.round(e.clientY - rect.top)}px`);
    el.style.setProperty("--spot-op", "1");
  }

  function handlePointerLeave() {
    ref.current?.style.setProperty("--spot-op", "0");
  }

  return (
    <div
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`spotlight-surface relative ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * GPU-accelerated scroll reveal driven strictly by IntersectionObserver (no scroll event listeners).
 */
export function ScrollReveal({
  children,
  delayMs = 0,
  className = "",
}: {
  children: ReactNode;
  delayMs?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (checkReducedMotion()) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: visible ? `${delayMs}ms` : "0ms",
      }}
      className={`scroll-reveal ${visible ? "is-visible" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * Smooth ease-out odometer counter triggered once when entering the viewport.
 */
export function OdometerNumber({
  target,
  prefix = "",
  suffix = "",
  locale = "en",
}: {
  target: number;
  prefix?: string;
  suffix?: string;
  locale?: "pt" | "en" | "es";
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(target);
  const startedRef = useRef(false);

  useEffect(() => {
    if (target === 0 || checkReducedMotion()) {
      setDisplay(target);
      return;
    }
    const el = ref.current;
    if (!el) return;

    let rafId = 0;
    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || startedRef.current) return;
        startedRef.current = true;
        obs.disconnect();

        const duration = 1100;
        const startTime = performance.now();
        const startVal = Math.floor(target * 0.25);

        const tick = (now: number) => {
          const progress = Math.min(1, (now - startTime) / duration);
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplay(Math.round(startVal + (target - startVal) * eased));
          if (progress < 1) {
            rafId = requestAnimationFrame(tick);
          }
        };
        rafId = requestAnimationFrame(tick);
      },
      { threshold: 0.25 }
    );

    obs.observe(el);
    return () => {
      obs.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [target]);

  const intlLocale = locale === "pt" ? "pt-BR" : locale === "es" ? "es-ES" : "en-US";
  const formatted = new Intl.NumberFormat(intlLocale).format(display);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
