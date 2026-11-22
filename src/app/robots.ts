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
          "ChatGPT-User",
          "ClaudeBot",
          "Claude-Web",
          "anthropic-ai",
          "PerplexityBot",
          "Google-Extended",
          "Applebot-Extended",
          "CCBot",
        ],
        allow: ["/", "/en/", "/pt/", "/llms.txt", "/llms-full.txt"],
        disallow: ["/admin", "/painel", "/api/admin", "/api/auth"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
