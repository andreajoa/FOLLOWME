import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.APP_URL || "https://followme.nexaclouds.online").replace(/\/+$/, "");
  return {
    rules: [
      {
        userAgent: [
          "*",
          "Googlebot",
          "Bingbot",
          "GPTBot",
          "OAI-SearchBot",
          "ClaudeBot",
          "PerplexityBot",
        ],
        allow: "/",
        disallow: ["/admin", "/painel", "/api/admin", "/api/auth"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
