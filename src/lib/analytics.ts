export type AnalyticsRange = "day" | "month" | "year";

const BOT_UA_PATTERN =
  /bot|crawl|spider|slurp|mediapartners|headlesschrome|lighthouse|pingdom|uptimerobot|curl\/|wget\/|python-requests|python-urllib|axios\/|go-http-client|facebookexternalhit|whatsapp|telegrambot|bytespider|gptbot|claudebot|perplexitybot|ahrefs|semrush|mj12bot|dotbot/i;

export function isLikelyBotUserAgent(ua?: string | null): boolean {
  if (!ua || ua.trim().length < 8) return true;
  return BOT_UA_PATTERN.test(ua);
}

export function detectDeviceType(ua?: string | null): "mobile" | "tablet" | "desktop" {
  const s = (ua || "").toLowerCase();
  if (/ipad|tablet|playbook|silk/.test(s)) return "tablet";
  if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry/.test(s)) {
    return "mobile";
  }
  return "desktop";
}

/**
 * Returns start-of-day, start-of-month, and start-of-year timestamps
 * anchored to America/Sao_Paulo (UTC-3, no DST).
 */
export function getBrtWindowBoundaries(now: Date = new Date()): {
  dayStart: Date;
  monthStart: Date;
  yearStart: Date;
  brtYear: number;
  brtMonth: number;
  brtDay: number;
} {
  // Shift by -3 hours to read Brazil wall-clock date components in UTC fields
  const BRT_OFFSET_MS = 3 * 60 * 60 * 1000;
  const brtClock = new Date(now.getTime() - BRT_OFFSET_MS);
  const brtYear = brtClock.getUTCFullYear();
  const brtMonth = brtClock.getUTCMonth(); // 0-indexed
  const brtDay = brtClock.getUTCDate();

  const dayStart = new Date(Date.UTC(brtYear, brtMonth, brtDay, 3, 0, 0, 0));
  const monthStart = new Date(Date.UTC(brtYear, brtMonth, 1, 3, 0, 0, 0));
  const yearStart = new Date(Date.UTC(brtYear, 0, 1, 3, 0, 0, 0));

  return { dayStart, monthStart, yearStart, brtYear, brtMonth, brtDay };
}

export function getBrtBucketKey(date: Date, range: AnalyticsRange): string {
  const BRT_OFFSET_MS = 3 * 60 * 60 * 1000;
  const brt = new Date(date.getTime() - BRT_OFFSET_MS);
  if (range === "day") {
    return `${String(brt.getUTCHours()).padStart(2, "0")}h`;
  }
  if (range === "month") {
    return `${String(brt.getUTCDate()).padStart(2, "0")}/${String(
      brt.getUTCMonth() + 1
    ).padStart(2, "0")}`;
  }
  const months = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  return months[brt.getUTCMonth()] || "Jan";
}

export function buildEmptyBrtBuckets(
  range: AnalyticsRange,
  now: Date = new Date()
): string[] {
  const { brtYear, brtMonth } = getBrtWindowBoundaries(now);
  if (range === "day") {
    return Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, "0")}h`);
  }
  if (range === "month") {
    const daysInMonth = new Date(Date.UTC(brtYear, brtMonth + 1, 0)).getUTCDate();
    return Array.from(
      { length: daysInMonth },
      (_, i) => `${String(i + 1).padStart(2, "0")}/${String(brtMonth + 1).padStart(2, "0")}`
    );
  }
  return [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
}
