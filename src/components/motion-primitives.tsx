"use client";

import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";

function checkReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Seamless looping ambient video with zero black-flash reveal and crossfade restart.
 * Respects prefers-reduced-motion by freezing gracefully on the editorial poster frame.
 */
export function AmbientVideoBackdrop({
  src,
  poster,
  className = "",
  playbackRate = 0.85,
  fadeSeconds = 1.1,
}: {
  src: string;
  poster: string;
  className?: string;
  playbackRate?: number;
  fadeSeconds?: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const phaseRef = useRef<"idle" | "in" | "play" | "out">("idle");
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (checkReducedMotion()) {
      video.pause();
      setOpacity(0);
      return;
    }

    video.loop = false;
    video.playbackRate = playbackRate;

    const fadeIn = () => {
      phaseRef.current = "in";
      setOpacity(1);
    };

    const revealWhenFramed = () => {
      if (phaseRef.current !== "idle") return;
      const show = () => {
        if (phaseRef.current !== "idle") return;
        fadeIn();
      };
      const withCallback = video as HTMLVideoElement & {
        requestVideoFrameCallback?: (cb: () => void) => number;
      };
      if (typeof withCallback.requestVideoFrameCallback === "function") {
        withCallback.requestVideoFrameCallback(() => requestAnimationFrame(show));
        return;
      }
      requestAnimationFrame(() => requestAnimationFrame(show));
    };

    const play = () => {
      video.playbackRate = playbackRate;
      video.play().catch(() => {});
    };

    const onPlaying = () => revealWhenFramed();

    const onTimeUpdate = () => {
      if (phaseRef.current !== "play") return;
      const duration = video.duration;
      if (!Number.isFinite(duration) || duration < fadeSeconds + 0.5) return;
      if (video.currentTime < fadeSeconds + 0.3) return;
      const remaining = (duration - video.currentTime) / Math.max(video.playbackRate, 0.2);
      if (remaining <= fadeSeconds) {
        phaseRef.current = "out";
        setOpacity(0);
      }
    };

    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.propertyName !== "opacity" || event.target !== video) return;
      if (phaseRef.current === "out") {
        video.currentTime = 0.05;
        video.playbackRate = playbackRate;
        video.play().catch(() => {});
        requestAnimationFrame(() => fadeIn());
        return;
      }
      if (phaseRef.current === "in") {
        phaseRef.current = "play";
      }
    };

    play();
    if (!video.paused && video.readyState >= 2) revealWhenFramed();

    video.addEventListener("canplay", play);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("transitionend", onTransitionEnd);

    return () => {
      video.removeEventListener("canplay", play);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("transitionend", onTransitionEnd);
    };
  }, [playbackRate, fadeSeconds]);

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={poster}
        alt=""
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay
        muted
        playsInline
        preload="metadata"
        style={{
          opacity,
          transition: `opacity ${fadeSeconds}s cubic-bezier(0.22, 1, 0.36, 1)`,
        }}
        className="absolute inset-0 h-full w-full object-cover object-center will-change-[opacity]"
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
