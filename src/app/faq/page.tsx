import Link from "next/link";
import { getCurrentUser, getRequestPreferences } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

export const dynamic = "force-dynamic";

const FAQS = [
  {
    q: "Como funciona a recarga de saldo via Stripe (Pix e Cartão)?",
    a: "Dentro do painel, clique em 'Adicionar Saldo', escolha Pix ou Cartão de Crédito/Débito e informe o valor desejado. Você finaliza no checkout oficial da Stripe e assim que o pagamento é confirmado, o saldo entra automaticamente em sua conta 24 horas por dia.",
  },
  {
    q: "O perfil precisa estar público para receber o serviço?",
    a: "Sim. Contas privadas bloqueiam a contagem inicial e a entrega. Mantenha o perfil em modo PÚBLICO até o pedido mudar para o status Concluído.",
  },
  {
    q: "O que significa Reposição (Refill) de 30 ou 365 dias?",
    a: "Caso ocorra alguma queda na contagem dentro do prazo de garantia do serviço contratado, basta clicar no botão 'Solicitar Reposição' na tela de Pedidos para repor gratuitamente a diferença.",
  },
  {
    q: "Como funcionam as Assinaturas Automáticas (Subscriptions)?",
    a: "Na aba 'Assinaturas', informe seu @usuário, quantidade mínima/máxima por postagem e delay. Sempre que o perfil publicar conteúdo novo, o sistema dispara o engajamento automaticamente.",
  },
  {
    q: "O que é o Painel Filho (Child Panel)?",
    a: "É o seu próprio painel SMM com domínio próprio conectado automaticamente ao nosso estoque e API v2. Você define suas margens, recebe na sua conta e opera sua própria marca de revenda.",
  },
  {
    q: "O que é Drip-Feed (Entrega Gradual)?",
    a: "Permite fracionar um pedido maior em várias rodadas com intervalo definido em minutos. Por exemplo: 5 rodadas de 200 curtidas a cada 60 minutos (total de 1.000 curtidas entregues de forma orgânica).",
  },
  {
    q: "Posso revender os serviços na minha loja ou outro painel?",
    a: "Sim! Toda conta recebe gratuitamente uma API Key padrão SMM v2 em 'Conta & API', compatível com qualquer painel revendedor, loja WooCommerce/Shopify ou automações.",
  },
  {
    q: "Como funciona o Programa de Afiliados?",
    a: "Compartilhe seu link exclusivo de indicação disponível na aba 'Afiliados'. Sempre que um convidado cadastrado pelo seu link recarregar saldo via Stripe (Pix ou Cartão), você recebe comissão automaticamente.",
  },
];

export default async function FaqPage() {
  const [user, settings, prefs] = await Promise.all([
    getCurrentUser(),
    getSiteSettings(),
    getRequestPreferences(),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-[#090A0C]">
      <PublicHeader
        brandName={settings.brandName}
        user={user ? { username: user.username, role: user.role } : null}
        locale={prefs.locale}
        currency={prefs.currency}
      />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6 lg:px-8 space-y-8">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#C8FF2E]">
            Central de Ajuda
          </span>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-bold tracking-tight">
            Perguntas Frequentes (FAQ)
          </h1>
          <p className="mt-2 text-sm text-[#98A0AD]">
            Tudo o que você precisa saber sobre pedidos, Pix automático,
            reposições e revenda via API.
          </p>
        </div>

        <div className="divide-y divide-[#232730] border border-[#232730] bg-[#111317]">
          {FAQS.map((item, idx) => (
            <details key={idx} open={idx === 0} className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-[family-name:var(--font-display)] text-base font-bold text-[#F4F5F6]">
                <span>
                  <span className="mr-3 font-mono text-xs text-[#C8FF2E]">
                    0{idx + 1}
                  </span>
                  {item.q}
                </span>
                <span className="font-mono text-lg text-[#98A0AD] group-open:rotate-45 transition-transform">
                  +
                </span>
              </summary>
              <p className="mt-3 pl-8 text-sm text-[#98A0AD] leading-relaxed">
                {item.a}
              </p>
            </details>
          ))}
        </div>

        <div className="surface-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">
              Ainda ficou com alguma dúvida?
            </h2>
            <p className="text-sm text-[#98A0AD]">
              Nossa equipe atende diretamente via Ticket interno dentro do painel.
            </p>
          </div>
          <Link
            href={user ? "/painel/tickets" : "/login"}
            className="btn-lime inline-flex h-11 items-center px-5 font-mono text-xs uppercase tracking-wider shrink-0"
          >
            Abrir Ticket de Suporte
          </Link>
        </div>
      </main>

      <PublicFooter
        brandName={settings.brandName}
        supportEmail={settings.supportEmail}
        supportWhatsapp={settings.supportWhatsapp}
      />
    </div>
  );
}
