import Link from "next/link";
import { BrandLogo } from "./brand-logo";

interface PublicFooterProps {
  brandName: string;
  supportEmail: string;
  supportWhatsapp: string;
}

export function PublicFooter({
  brandName,
  supportEmail,
  supportWhatsapp,
}: PublicFooterProps) {
  return (
    <footer className="border-t border-[#232730] bg-[#0C0E12] mt-20">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          <div className="md:col-span-5 space-y-3">
            <BrandLogo name={brandName} />
            <p className="text-sm text-[#98A0AD] max-w-sm leading-relaxed">
              Infraestrutura automatizada de marketing em mídias sociais para
              agências, gestores de tráfego, criadores e revendedores com Pix
              24 horas e API v2 padrão de mercado.
            </p>
            <p className="font-mono text-xs text-[#68707E]">
              Suporte: {supportEmail} • WhatsApp +{supportWhatsapp}
            </p>
          </div>

          <div className="md:col-span-3 space-y-2.5">
            <h3 className="font-mono text-xs uppercase tracking-widest text-[#C8FF2E]">
              Plataforma
            </h3>
            <ul className="space-y-2 text-sm text-[#98A0AD]">
              <li>
                <Link href="/servicos" className="hover:text-[#F4F5F6]">
                  Catálogo de Serviços
                </Link>
              </li>
              <li>
                <Link href="/api-docs" className="hover:text-[#F4F5F6]">
                  Documentação API v2
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#F4F5F6]">
                  Acessar Painel
                </Link>
              </li>
              <li>
                <Link href="/login?tab=register" className="hover:text-[#F4F5F6]">
                  Abrir Conta Grátis
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-2.5">
            <h3 className="font-mono text-xs uppercase tracking-widest text-[#C8FF2E]">
              Ajuda & Políticas
            </h3>
            <ul className="space-y-2 text-sm text-[#98A0AD]">
              <li>
                <Link href="/faq" className="hover:text-[#F4F5F6]">
                  Perguntas Frequentes (FAQ)
                </Link>
              </li>
              <li>
                <Link href="/termos" className="hover:text-[#F4F5F6]">
                  Termos de Uso e Política de Reembolso
                </Link>
              </li>
              <li>
                <Link href="/painel/tickets" className="hover:text-[#F4F5F6]">
                  Abrir Ticket de Suporte
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-[#232730] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-xs text-[#68707E]">
            © {new Date().getFullYear()} {brandName}. Todos os direitos reservados.
          </p>
          <p className="font-mono text-xs text-[#68707E]">
            PIX 24/7 • API v2 REST • SISTEMA AUTOMATIZADO
          </p>
        </div>
      </div>
    </footer>
  );
}
