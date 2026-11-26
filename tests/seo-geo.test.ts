import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import {
  buildInternationalAlternates,
  COUNTRY_HUB_HREFLANG,
  GEO_KEYWORD_PAGES,
  GLOBAL_SERVED_COUNTRIES,
  findGeoKeywordPage,
} from "@/lib/seo-guides";

describe("FollowMe Global SEO & GEO (Brazil, USA, Canada, UK, Australia & Worldwide)", () => {
  it("exposes all 14 international & regional buyer/country hubs with unique slugs per locale", () => {
    expect(GEO_KEYWORD_PAGES.length).toBe(14);
    const keys = GEO_KEYWORD_PAGES.map((p) => `${p.locale}/${p.slug}`);
    expect(new Set(keys).size).toBe(keys.length);

    for (const slug of [
      "buy-followers-usa",
      "buy-followers-uk",
      "buy-followers-canada",
      "buy-followers-australia",
      "best-smm-panel-global",
    ]) {
      const page = findGeoKeywordPage("en", slug);
      expect(page, `Missing EN country hub ${slug}`).toBeDefined();
      expect(page?.faq.length).toBeGreaterThanOrEqual(4);
      expect(page?.facts.length).toBeGreaterThanOrEqual(4);
      expect(page?.comparisonRows.length).toBeGreaterThanOrEqual(4);
    }

    const brHub = findGeoKeywordPage("pt", "painel-smm-brasil");
    expect(brHub).toBeDefined();
    expect(brHub?.currency).toBe("BRL");
    expect(brHub?.faq.length).toBeGreaterThanOrEqual(4);
  });

  it("emits reciprocal multi-country hreflang covering BR, US, CA, GB, AU, NZ, IE, PT and x-default", () => {
    const alts = buildInternationalAlternates("/en", "/pt");
    for (const code of ["en-US", "en-CA", "en-GB", "en-AU", "en-NZ", "en-IE", "en", "pt-BR", "pt-PT", "x-default"]) {
      expect(alts[code], `Missing hreflang ${code}`).toBeTruthy();
      expect(COUNTRY_HUB_HREFLANG[code], `Missing country hub hreflang ${code}`).toBeTruthy();
    }
    expect(GLOBAL_SERVED_COUNTRIES).toContain("BR");
    expect(GLOBAL_SERVED_COUNTRIES).toContain("US");
    expect(GLOBAL_SERVED_COUNTRIES).toContain("CA");
    expect(GLOBAL_SERVED_COUNTRIES).toContain("GB");
    expect(GLOBAL_SERVED_COUNTRIES).toContain("AU");
  });

  it("generates followm.click sitemap & AI-friendly robots.txt with full regional URLs", () => {
    const prev = process.env.APP_URL;
    process.env.APP_URL = "https://followm.click";
    try {
      const entries = sitemap();
      const urls = entries.map((e) => e.url);
      expect(urls.every((u) => u.startsWith("https://followm.click"))).toBe(true);
      expect(urls).toContain("https://followm.click/");
      expect(urls).toContain("https://followm.click/en/buy-followers-usa");
      expect(urls).toContain("https://followm.click/en/buy-followers-uk");
      expect(urls).toContain("https://followm.click/en/buy-followers-canada");
      expect(urls).toContain("https://followm.click/en/buy-followers-australia");
      expect(urls).toContain("https://followm.click/en/best-smm-panel-global");
      expect(urls).toContain("https://followm.click/pt/painel-smm-brasil");
      expect(urls).toContain("https://followm.click/llms.txt");
      expect(urls).toContain("https://followm.click/llms-full.txt");

      const ukEntry = entries.find((e) => e.url === "https://followm.click/en/buy-followers-uk");
      expect(ukEntry?.alternates?.languages?.["en-GB"]).toBe("https://followm.click/en/buy-followers-uk");
      expect(ukEntry?.alternates?.languages?.["en-CA"]).toBe("https://followm.click/en/buy-followers-canada");
      expect(ukEntry?.alternates?.languages?.["en-AU"]).toBe("https://followm.click/en/buy-followers-australia");
      expect(ukEntry?.alternates?.languages?.["pt-BR"]).toBe("https://followm.click/pt/painel-smm-brasil");

      const rob = robots();
      expect(rob.sitemap).toBe("https://followm.click/sitemap.xml");
      expect(rob.host).toBe("https://followm.click");
    } finally {
      if (prev === undefined) delete process.env.APP_URL;
      else process.env.APP_URL = prev;
    }
  });
});
