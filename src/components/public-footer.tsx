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
    <footer className="border-t border-[#232730] bg-[#0C0E12] mt-20">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-5 space-y-4">
            <BrandLogo name={brandName} />
            <p className="text-sm text-[#98A0AD] max-w-sm leading-relaxed">
              {f.tagline}
            </p>
            <p className="font-mono text-xs text-[#68707E]">
              {supportEmail}
              {showWhatsapp ? ` · WhatsApp +${supportWhatsapp}` : ""}
            </p>
          </div>

          <div className="md:col-span-2 space-y-3">
            <h3 className="font-mono text-xs uppercase tracking-widest text-[#C8FF2E]">
              {f.networksTitle}
            </h3>
            <ul className="space-y-2 text-sm text-[#98A0AD]">
              <li>
                <Link href={`${routePrefix}/instagram`} className="hover:text-[#F4F5F6]">
                  Instagram
                </Link>
              </li>
              <li>
                <Link href={`${routePrefix}/tiktok`} className="hover:text-[#F4F5F6]">
                  TikTok
                </Link>
              </li>
              <li>
                <Link href={`${routePrefix}/youtube`} className="hover:text-[#F4F5F6]">
                  YouTube
                </Link>
              </li>
              <li>
                <Link href="/en" className="hover:text-[#F4F5F6]">
                  English (USA · USD)
                </Link>
              </li>
              <li>
                <Link href="/pt" className="hover:text-[#F4F5F6]">
                  Português (Brasil · BRL)
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-3">
            <h3 className="font-mono text-xs uppercase tracking-widest text-[#C8FF2E]">
              {f.platformTitle}
            </h3>
            <ul className="space-y-2 text-sm text-[#98A0AD]">
              <li>
                <Link href="/servicos" className="hover:text-[#F4F5F6]">
                  {f.servicesCatalog}
                </Link>
              </li>
              <li>
                <Link href="/api-docs" className="hover:text-[#F4F5F6]">
                  {f.apiDocs}
                </Link>
              </li>
              <li>
                <Link href="/parcerias" className="hover:text-[#F4F5F6]">
                  {f.partners}
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#F4F5F6]">
                  {f.signIn}
                </Link>
              </li>
              <li>
                <Link href="/login?tab=register" className="hover:text-[#F4F5F6]">
                  {f.createAccount}
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h3 className="font-mono text-xs uppercase tracking-widest text-[#C8FF2E]">
              {f.helpTitle}
            </h3>
            <ul className="space-y-2 text-sm text-[#98A0AD]">
              <li>
                <Link href="/faq" className="hover:text-[#F4F5F6]">
                  {f.faq}
                </Link>
              </li>
              <li>
                <Link href="/termos" className="hover:text-[#F4F5F6]">
                  {f.terms}
                </Link>
              </li>
              <li>
                <Link href="/esqueci-senha" className="hover:text-[#F4F5F6]">
                  {f.resetPassword}
                </Link>
              </li>
              <li>
                <Link href="/painel/tickets" className="hover:text-[#F4F5F6]">
                  {f.supportTicket}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-[#232730] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-xs text-[#68707E]">
            © {new Date().getFullYear()} {brandName}. {f.rights}
          </p>
          <p className="font-mono text-xs text-[#68707E]">{f.paymentsBadge}</p>
        </div>
      </div>
    </footer>
  );
}
