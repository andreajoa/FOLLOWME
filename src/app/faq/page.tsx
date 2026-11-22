import Link from "next/link";
import { getCurrentUser, getRequestPreferences } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { getLandingCopy } from "@/lib/landing-copy";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { FaqAccordion } from "@/components/faq-accordion";

export const dynamic = "force-dynamic";

export default async function FaqPage() {
  const [user, settings, prefs] = await Promise.all([
    getCurrentUser(),
    getSiteSettings(),
    getRequestPreferences(),
  ]);

  const copy = getLandingCopy(prefs.locale);
  const isPt = prefs.locale === "pt";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: copy.faq.items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090A0C]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicHeader
        brandName={settings.brandName}
        user={user ? { username: user.username, role: user.role } : null}
        locale={prefs.locale}
        currency={prefs.currency}
      />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-14 sm:px-6 lg:px-8 space-y-10">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#C8FF2E]">
            {isPt ? "Central de Ajuda" : "Help Center"}
          </span>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-bold tracking-tight">
            {copy.faq.heading}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[#98A0AD]">
            {copy.faq.subtext}
          </p>
        </div>

        <FaqAccordion items={copy.faq.items} />

        <div className="surface-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">
              {isPt ? "Ainda ficou com alguma dúvida?" : "Still have a question?"}
            </h2>
            <p className="text-sm text-[#98A0AD]">
              {isPt
                ? "Nossa equipe atende diretamente via Ticket interno dentro do painel."
                : "Our team responds directly through your account Support Tickets."}
            </p>
          </div>
          <Link
            href={user ? "/painel/tickets" : "/login"}
            className="btn-lime inline-flex h-11 items-center px-5 font-mono text-xs uppercase tracking-wider shrink-0"
          >
            {isPt ? "Abrir Ticket de Suporte" : "Open Support Ticket"}
          </Link>
        </div>
      </main>

      <PublicFooter
        brandName={settings.brandName}
        supportEmail={settings.supportEmail}
        supportWhatsapp={settings.supportWhatsapp}
        locale={prefs.locale}
      />
    </div>
  );
}
