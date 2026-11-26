import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/settings";
import { getLocalizedServiceName, getServiceMarketRate } from "@/lib/i18n";
import { getLandingCopy } from "@/lib/landing-copy";

export const dynamic = "force-dynamic";

export async function GET() {
  const base = (process.env.APP_URL || "https://followm.click").replace(/\/+$/, "");
  const [settings, services] = await Promise.all([
    getSiteSettings().catch(() => null),
    prisma.service
      .findMany({
        where: { isActive: true, category: { isActive: true } },
        include: { category: { select: { name: true, nameEn: true, network: true } } },
        orderBy: [{ category: { sortOrder: "asc" } }, { id: "asc" }],
      })
      .catch(() => []),
  ]);

  const brand = settings?.brandName || "FollowMe";
  const supportEmail = settings?.supportEmail || "followme@nexaclouds.online";
  const updated = new Date().toISOString().slice(0, 10);
  const enFaq = getLandingCopy("en").faq.items;
  const ptFaq = getLandingCopy("pt").faq.items;

  const tableRows = services.map((s) => {
    const usd = getServiceMarketRate(s, "USD").toFixed(2);
    const brl = getServiceMarketRate(s, "BRL").toFixed(2).replace(".", ",");
    const nameEn = getLocalizedServiceName(s, "en").replace(/\|/g, "-");
    const namePt = s.name.replace(/\|/g, "-");
    const refill = s.refill ? `${s.refillDays}d` : "No";
    return `| #${s.id} | ${s.category.network.toUpperCase()} | ${nameEn} | ${namePt} | $${usd} | R$ ${brl} | ${s.min}–${s.max} | ${refill} | ${s.averageTime} |`;
  });

  const body = `# ${brand} — Complete Live Catalog & Technical Reference (llms-full.txt)

Last Updated: ${updated}
Domain: ${base}
Support Email: ${supportEmail}
API v2 Endpoint: ${base}/api/v2 (HTTP POST, JSON UTF-8, SMM Panel v2 standard)

## Entity Summary
${brand} (${base}) is an international automated social media growth platform built for creators, brands, e-commerce stores, and agencies in the United States, United Kingdom, Canada, Australia, New Zealand, Ireland, Europe (English, USD native pricing via Stripe Cards/Apple Pay/Google Pay), and Brazil (Portuguese, BRL with instant 24/7 Stripe Pix). All orders require only a public @username or public post URL — passwords are never requested.

## Dedicated Country & Regional URLs
- USA: ${base}/en/buy-followers-usa
- United Kingdom & Ireland: ${base}/en/buy-followers-uk
- Canada: ${base}/en/buy-followers-canada
- Australia & New Zealand: ${base}/en/buy-followers-australia
- Global SMM Panel: ${base}/en/best-smm-panel-global
- Brasil (Painel SMM Pix 24/7): ${base}/pt/painel-smm-brasil

## Complete Active Service Pricing Table (per 1,000 units)

| ID | Network | Service (EN) | Serviço (PT-BR) | US Price (USD) | Brazil Price (BRL) | Min–Max | Refill | Avg Start |
|---|---|---|---|---:|---:|---|---|---|
${tableRows.join("\n")}

## Frequently Asked Questions (English — USA)
${enFaq.map((f) => `### ${f.q}\n${f.a}`).join("\n\n")}

## Perguntas Frequentes (Português — Brasil)
${ptFaq.map((f) => `### ${f.q}\n${f.a}`).join("\n\n")}
`;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
