import type { MetadataRoute } from "next";
import {
  buildInternationalAlternates,
  COUNTRY_HUB_HREFLANG,
  GEO_KEYWORD_PAGES,
} from "@/lib/seo-guides";

function absolutizeAlternates(
  base: string,
  map: Record<string, string>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [lang, path] of Object.entries(map)) {
    out[lang] = `${base}${path}`;
  }
  return out;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.APP_URL || "https://followm.click").replace(/\/+$/, "");
  const now = new Date();

  const localizedPairs: Array<{ path: string; priority: number }> = [
    { path: "", priority: 1.0 },
    { path: "/instagram", priority: 0.95 },
    { path: "/tiktok", priority: 0.95 },
    { path: "/youtube", priority: 0.95 },
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const item of localizedPairs) {
    const languages = absolutizeAlternates(
      base,
      buildInternationalAlternates(`/en${item.path}`, `/pt${item.path}`)
    );
    entries.push(
      {
        url: `${base}${item.path || "/"}`,
        lastModified: now,
        changeFrequency: "daily",
        priority: item.priority,
        alternates: { languages },
      },
      {
        url: `${base}/en${item.path}`,
        lastModified: now,
        changeFrequency: "daily",
        priority: item.priority,
        alternates: { languages },
      },
      {
        url: `${base}/pt${item.path}`,
        lastModified: now,
        changeFrequency: "daily",
        priority: item.priority,
        alternates: { languages },
      }
    );
  }

  // Regional & country-specific high-intent SEO + GEO buyer pages (USA, UK, Canada, Australia, Global & Brazil)
  const countryHubLanguages = absolutizeAlternates(base, COUNTRY_HUB_HREFLANG);
  for (const page of GEO_KEYWORD_PAGES) {
    const url = `${base}/${page.locale}/${page.slug}`;
    const languages =
      page.regionCluster === "country-hub"
        ? countryHubLanguages
        : absolutizeAlternates(
            base,
            buildInternationalAlternates(
              page.locale === "en" ? `/en/${page.slug}` : `/en/${page.pairedSlug}`,
              page.locale === "pt" ? `/pt/${page.slug}` : `/pt/${page.pairedSlug}`
            )
          );
    entries.push({
      url,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
      alternates: { languages },
    });
  }

  for (const extra of ["/servicos", "/api-docs", "/parcerias", "/faq", "/termos", "/llms.txt", "/llms-full.txt"]) {
    entries.push({
      url: `${base}${extra}`,
      lastModified: now,
      changeFrequency: extra === "/servicos" ? "daily" : "weekly",
      priority: extra === "/servicos" ? 0.9 : 0.75,
    });
  }

  return entries;
}
