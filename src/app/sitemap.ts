import type { MetadataRoute } from "next";
import { getGeoKeywordPagesByLocale } from "@/lib/seo-guides";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.APP_URL || "https://followme.nexaclouds.online").replace(/\/+$/, "");
  const now = new Date();

  const localizedPairs: Array<{ path: string; priority: number }> = [
    { path: "", priority: 1.0 },
    { path: "/instagram", priority: 0.95 },
    { path: "/tiktok", priority: 0.95 },
    { path: "/youtube", priority: 0.95 },
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const item of localizedPairs) {
    entries.push(
      {
        url: `${base}${item.path || "/"}`,
        lastModified: now,
        changeFrequency: "daily",
        priority: item.priority,
        alternates: {
          languages: {
            "en-US": `${base}/en${item.path}`,
            "pt-BR": `${base}/pt${item.path}`,
          },
        },
      },
      {
        url: `${base}/en${item.path}`,
        lastModified: now,
        changeFrequency: "daily",
        priority: item.priority,
        alternates: {
          languages: {
            "en-US": `${base}/en${item.path}`,
            "pt-BR": `${base}/pt${item.path}`,
          },
        },
      },
      {
        url: `${base}/pt${item.path}`,
        lastModified: now,
        changeFrequency: "daily",
        priority: item.priority,
        alternates: {
          languages: {
            "pt-BR": `${base}/pt${item.path}`,
            "en-US": `${base}/en${item.path}`,
          },
        },
      }
    );
  }

  // High-intent regional commercial SEO + GEO buyer pages (USA EN-US <-> Brazil PT-BR)
  for (const enPage of getGeoKeywordPagesByLocale("en")) {
    const enUrl = `${base}/en/${enPage.slug}`;
    const ptUrl = `${base}/pt/${enPage.pairedSlug}`;
    entries.push(
      {
        url: enUrl,
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.95,
        alternates: {
          languages: {
            "en-US": enUrl,
            "pt-BR": ptUrl,
          },
        },
      },
      {
        url: ptUrl,
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.95,
        alternates: {
          languages: {
            "pt-BR": ptUrl,
            "en-US": enUrl,
          },
        },
      }
    );
  }

  for (const extra of ["/servicos", "/api-docs", "/parcerias", "/faq", "/termos", "/llms.txt"]) {
    entries.push({
      url: `${base}${extra}`,
      lastModified: now,
      changeFrequency: extra === "/servicos" ? "daily" : "weekly",
      priority: extra === "/servicos" ? 0.9 : 0.75,
    });
  }

  return entries;
}
