import type { MetadataRoute } from "next";

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

  for (const extra of ["/servicos", "/api-docs", "/parcerias", "/faq", "/termos"]) {
    entries.push({
      url: `${base}${extra}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75,
    });
  }

  return entries;
}
