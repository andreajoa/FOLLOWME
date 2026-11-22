import { getCurrentUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

export const dynamic = "force-dynamic";

export default async function TermsPage() {
  const [user, settings] = await Promise.all([
    getCurrentUser(),
    getSiteSettings(),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-[#090A0C]">
      <PublicHeader
        brandName={settings.brandName}
        user={user ? { username: user.username, role: user.role } : null}
      />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6 lg:px-8 space-y-6">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#FF6B2C]">
            Regulamento Oficial
          </span>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-bold tracking-tight">
            Termos de Uso e Política de Reembolso
          </h1>
        </div>

        <div className="surface-card p-6 sm:p-8 space-y-6 text-sm text-[#98A0AD] leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[#F4F5F6]">
              1. Aceitação dos Termos
            </h2>
            <p>
              Ao criar uma conta ou enviar um pedido na plataforma{" "}
              <strong className="text-[#F4F5F6]">{settings.brandName}</strong>,
              você declara concordar integralmente com as regras operacionais
              descritas nesta página.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[#F4F5F6]">
              2. Responsabilidade sobre Links e Perfis
            </h2>
            <p>
              O usuário é responsável por informar links válidos e manter os
              perfis de destino em modo público durante toda a execução do
              pedido. Não envie dois pedidos simultâneos para o mesmo link antes
              que o primeiro seja concluído, pois isso impede o cálculo correto
              da contagem inicial e anula a garantia de reposição.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[#F4F5F6]">
              3. Créditos, Cancelamentos e Reembolso
            </h2>
            <p>
              Pedidos cancelados antes da entrega ou finalizados com status
              Parcial têm o valor correspondente devolvido automaticamente como
              saldo em conta na plataforma. Para saldo recarregado via Pix e
              ainda não utilizado, solicitações de estorno podem ser abertas via
              ticket em até 7 dias corridos após a recarga.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[#F4F5F6]">
              4. Uso da API e Revenda
            </h2>
            <p>
              A chave de API é pessoal e intransferível. Caso suspeite de
              exposição indevida, realize a rotação imediata da chave na aba
              Conta & API. Tentativas de abuso, automação maliciosa contra a
              infraestrutura ou fraudes de pagamento resultam em suspensão da
              conta.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[#F4F5F6]">
              5. Privacidade e Contato
            </h2>
            <p>
              Nunca solicitamos a senha das suas redes sociais. Para dúvidas
              formais, entre em contato pelo e-mail{" "}
              <span className="font-mono text-[#C8FF2E]">
                {settings.supportEmail}
              </span>
              .
            </p>
          </section>
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
