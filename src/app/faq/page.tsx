import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser, getRequestPreferences } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { getLandingCopy } from "@/lib/landing-copy";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { FaqAccordion } from "@/components/faq-accordion";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const prefs = await getRequestPreferences().catch(() => ({
    locale: "en" as const,
    currency: "USD" as const,
  }));
  const isPt = prefs.locale === "pt";
  return {
    title: isPt
      ? "Perguntas Frequentes (FAQ) — Segurança, Pix e Reposição | FollowMe"
      : "Frequently Asked Questions — Safety, Refills & Stripe USD | FollowMe",
    description: isPt
      ? "Respostas diretas sobre segurança sem senha, velocidade de entrega, garantia de reposição 30 a 365 dias, Pix via Stripe e API v2 na FollowMe."
      : "Direct answers on password-free delivery, start times, 30–365 day refill protection, Stripe USD payments, and SMM Panel API v2 on FollowMe.",
    alternates: { canonical: "/faq" },
  };
}

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
    <div className="min-h-screen flex flex-col fn-hero-canvas text-[#111015]">
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
          <span className="fn-eyebrow-pill inline-flex items-center gap-2 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-[#18141d]">
            <span className="h-2 w-2 rounded-full bg-[#8c42ed]" />
            {isPt ? "Central de Ajuda" : "Help Center"}
          </span>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-black tracking-[-0.045em] text-[#111015]">
            {copy.faq.heading}
          </h1>
          <p className="mt-2 text-sm sm:text-base font-medium text-[#66616d]">
            {copy.faq.subtext}
          </p>
        </div>

        <div className="rounded-[24px] border border-[#ece5f2] bg-white p-6 sm:p-9 shadow-[0_14px_38px_rgba(52,27,76,0.06)]">
          <FaqAccordion items={copy.faq.items} />
        </div>

        <div className="surface-card p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-lg font-extrabold text-[#111015]">
              {isPt ? "Ainda ficou com alguma dúvida?" : "Still have a question?"}
            </h2>
            <p className="text-sm text-[#66616d]">
              {isPt
                ? "Nossa equipe atende diretamente via Ticket interno dentro do painel ou pelo e-mail de suporte."
                : "Our team responds directly through your account Support Tickets or support email."}
            </p>
          </div>
          <Link
            href={user ? "/painel/tickets" : "/login"}
            className="btn-lime inline-flex h-11 items-center px-5 text-xs font-bold uppercase tracking-wider shrink-0"
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
