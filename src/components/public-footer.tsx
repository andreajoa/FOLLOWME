import Link from "next/link";
import { BrandLogo } from "./brand-logo";
import { AppLocale } from "@/lib/i18n";
import { getLandingCopy } from "@/lib/landing-copy";

interface PublicFooterProps {
  brandName: string;
  supportEmail: string;
  supportWhatsapp: string;
  locale?: AppLocale;
  routePrefix?: "" | "/en" | "/pt";
}

export function PublicFooter({
  brandName,
  supportEmail,
  supportWhatsapp,
  locale = "en",
  routePrefix = "",
}: PublicFooterProps) {
  const f = getLandingCopy(locale).footer;
  const showWhatsapp = supportWhatsapp && supportWhatsapp !== "5511999999999";

  return (
    <footer className="relative bg-[#130d26] text-[#f7f3ff] mt-0">
      {/* FlowNexa 3px gradient signature top accent line */}
      <div
        className="h-[3px] w-full"
        style={{
          background: "linear-gradient(90deg, #ae70f8 0%, #f7b0e8 50%, #6b44e4 100%)",
        }}
      />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-5 space-y-4">
            <BrandLogo name={brandName} inverted />
            <p className="text-sm text-[#b7afc9] max-w-sm leading-relaxed">
              {f.tagline}
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#524268] bg-[#1e1538] px-3.5 py-1.5 text-xs font-medium text-[#c5b5e0]">
              <span className="h-2 w-2 rounded-full bg-[#64d893]" />
              <span>{supportEmail}</span>
              {showWhatsapp ? <span>· +{supportWhatsapp}</span> : null}
            </div>
          </div>

          <div className="md:col-span-2 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#b889ff]">
              {f.networksTitle}
            </h3>
            <ul className="space-y-2.5 text-sm text-[#b7afc9]">
              <li>
                <Link href={`${routePrefix}/instagram`} className="hover:text-white transition-colors">
                  Instagram · TikTok · YouTube
                </Link>
              </li>
              <li>
                <Link
                  href={locale === "pt" ? "/pt/comprar-seguidores-instagram" : "/en/buy-instagram-followers"}
                  className="hover:text-white transition-colors"
                >
                  {locale === "pt" ? "Comprar Seguidores IG" : "Buy Instagram Followers"}
                </Link>
              </li>
              <li>
                <Link
                  href={locale === "pt" ? "/pt/comprar-curtidas-instagram" : "/en/buy-instagram-likes"}
                  className="hover:text-white transition-colors"
                >
                  {locale === "pt" ? "Curtidas & Reels IG" : "Buy Instagram Likes"}
                </Link>
              </li>
              <li>
                <Link
                  href={locale === "pt" ? "/pt/comprar-seguidores-tiktok" : "/en/buy-tiktok-followers"}
                  className="hover:text-white transition-colors"
                >
                  {locale === "pt" ? "Seguidores TikTok Live" : "Buy TikTok Followers"}
                </Link>
              </li>
              <li>
                <Link
                  href={locale === "pt" ? "/pt/comprar-inscritos-youtube" : "/en/buy-youtube-subscribers"}
                  className="hover:text-white transition-colors"
                >
                  {locale === "pt" ? "Inscritos YouTube" : "Buy YouTube Subscribers"}
                </Link>
              </li>
              <li>
                <Link href="/en" className="hover:text-white transition-colors">
                  English (USA · USD)
                </Link>
              </li>
              <li>
                <Link href="/pt" className="hover:text-white transition-colors">
                  Português (Brasil · BRL)
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#b889ff]">
              {f.platformTitle}
            </h3>
            <ul className="space-y-2.5 text-sm text-[#b7afc9]">
              <li>
                <Link href="/servicos" className="hover:text-white transition-colors">
                  {f.servicesCatalog}
                </Link>
              </li>
              <li>
                <Link href="/api-docs" className="hover:text-white transition-colors">
                  {f.apiDocs}
                </Link>
              </li>
              <li>
                <Link href="/parcerias" className="hover:text-white transition-colors">
                  {f.partners}
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  {f.signIn}
                </Link>
              </li>
              <li>
                <Link href="/login?tab=register" className="hover:text-white transition-colors">
                  {f.createAccount}
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#b889ff]">
              {f.helpTitle}
            </h3>
            <ul className="space-y-2.5 text-sm text-[#b7afc9]">
              <li>
                <Link href="/faq" className="hover:text-white transition-colors">
                  {f.faq}
                </Link>
              </li>
              <li>
                <Link href="/termos" className="hover:text-white transition-colors">
                  {f.terms}
                </Link>
              </li>
              <li>
                <Link href="/esqueci-senha" className="hover:text-white transition-colors">
                  {f.resetPassword}
                </Link>
              </li>
              <li>
                <Link href="/painel/tickets" className="hover:text-white transition-colors">
                  {f.supportTicket}
                </Link>
              </li>
              <li>
                <a href="/llms.txt" className="hover:text-white transition-colors font-mono text-xs">
                  llms.txt (AI &amp; Search)
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-[#2a1f47] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#9d92b5]">
            © {new Date().getFullYear()} {brandName}. {f.rights}
          </p>
          <p className="font-mono text-xs text-[#c5b5e0]">{f.paymentsBadge}</p>
        </div>
      </div>
    </footer>
  );
}
