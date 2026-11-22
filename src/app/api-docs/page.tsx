import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

export const dynamic = "force-dynamic";

const ENDPOINTS = [
  {
    title: "1. Listar Serviços",
    action: "services",
    params: [
      { name: "key", desc: "Sua chave secreta de API (gerada em Conta & API)" },
      { name: "action", desc: "services" },
    ],
    response: `[
  {
    "service": 1,
    "name": "Seguidores Instagram Brasileiros | Perfis Reais | Reposição 30 Dias",
    "type": "Default",
    "category": "Instagram — Seguidores Brasileiros & Reais",
    "rate": "24.90",
    "min": "50",
    "max": "50000",
    "refill": true,
    "cancel": true,
    "dripfeed": true
  }
]`,
  },
  {
    title: "2. Criar Novo Pedido",
    action: "add",
    params: [
      { name: "key", desc: "Sua chave de API" },
      { name: "action", desc: "add" },
      { name: "service", desc: "ID numérico do serviço" },
      { name: "link", desc: "Link do perfil, publicação ou vídeo" },
      { name: "quantity", desc: "Quantidade desejada (dentro do min/max)" },
      { name: "runs (opcional)", desc: "Número de execuções para Drip-Feed" },
      { name: "interval (opcional)", desc: "Intervalo em minutos entre execuções" },
    ],
    response: `{
  "order": 1042
}`,
  },
  {
    title: "3. Consultar Status (Individual ou Múltiplos)",
    action: "status",
    params: [
      { name: "key", desc: "Sua chave de API" },
      { name: "action", desc: "status" },
      { name: "order", desc: "ID de um pedido único (ou use 'orders=1,2,3' até 100 IDs)" },
    ],
    response: `{
  "charge": "24.9000",
  "start_count": "14200",
  "status": "In progress",
  "remains": "350",
  "currency": "BRL"
}`,
  },
  {
    title: "4. Solicitar Reposição (Refill)",
    action: "refill",
    params: [
      { name: "key", desc: "Sua chave de API" },
      { name: "action", desc: "refill" },
      { name: "order", desc: "ID do pedido concluído elegível a reposição" },
    ],
    response: `{
  "refill": "1042"
}`,
  },
  {
    title: "5. Cancelar Pedido(s)",
    action: "cancel",
    params: [
      { name: "key", desc: "Sua chave de API" },
      { name: "action", desc: "cancel" },
      { name: "orders", desc: "IDs separados por vírgula (ex: 1042,1043)" },
    ],
    response: `[
  { "order": 1042, "cancel": 1 }
]`,
  },
  {
    title: "6. Consultar Saldo da Conta",
    action: "balance",
    params: [
      { name: "key", desc: "Sua chave de API" },
      { name: "action", desc: "balance" },
    ],
    response: `{
  "balance": "150.0000",
  "currency": "BRL"
}`,
  },
];

export default async function ApiDocsPage() {
  const [user, settings] = await Promise.all([
    getCurrentUser(),
    getSiteSettings(),
  ]);

  const baseUrl = process.env.APP_URL || "http://localhost:3000";

  return (
    <div className="min-h-screen flex flex-col bg-[#090A0C]">
      <PublicHeader
        brandName={settings.brandName}
        user={user ? { username: user.username, role: user.role } : null}
      />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6 lg:px-8 space-y-8">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#C8FF2E]">
            Integração para Revendedores & Lojas
          </span>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-bold tracking-tight">
            Documentação API v2
          </h1>
          <p className="mt-2 text-sm text-[#98A0AD]">
            Compatível com qualquer painel SMM, WooCommerce, Shopify, N8N ou
            sistema próprio.
          </p>
        </div>

        {/* Resumo técnico */}
        <div className="grid grid-cols-1 sm:grid-cols-3 border border-[#232730] bg-[#111317] font-mono text-xs">
          <div className="p-4 border-b sm:border-b-0 sm:border-r border-[#232730]">
            <div className="text-[#68707E]">MÉTODO HTTP</div>
            <div className="mt-1 text-sm font-bold text-[#C8FF2E]">POST</div>
          </div>
          <div className="p-4 border-b sm:border-b-0 sm:border-r border-[#232730]">
            <div className="text-[#68707E]">URL DA API</div>
            <div className="mt-1 text-sm font-bold text-[#F4F5F6] break-all">
              {baseUrl}/api/v2
            </div>
          </div>
          <div className="p-4">
            <div className="text-[#68707E]">FORMATO DE RESPOSTA</div>
            <div className="mt-1 text-sm font-bold text-[#F4F5F6]">JSON (UTF-8)</div>
          </div>
        </div>

        {user ? (
          <div className="border border-[#C8FF2E]/40 bg-[#C8FF2E]/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-mono text-xs uppercase text-[#C8FF2E]">
                Sua Chave de API Ativa
              </div>
              <div className="mt-1 font-mono text-sm text-[#F4F5F6] break-all">
                {user.apiKey}
              </div>
            </div>
            <Link
              href="/painel/conta"
              className="btn-outline inline-flex h-9 items-center px-3 font-mono text-xs uppercase shrink-0"
            >
              Gerenciar Chave
            </Link>
          </div>
        ) : (
          <div className="surface-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-sm text-[#98A0AD]">
              Crie sua conta gratuitamente para gerar sua chave de API exclusiva.
            </p>
            <Link
              href="/login?tab=register"
              className="btn-lime inline-flex h-10 items-center px-4 font-mono text-xs uppercase shrink-0"
            >
              Gerar API Key Grátis
            </Link>
          </div>
        )}

        {/* Endpoints */}
        <div className="space-y-6">
          {ENDPOINTS.map((ep) => (
            <section
              key={ep.action}
              className="border border-[#232730] bg-[#111317]"
            >
              <div className="flex items-center justify-between border-b border-[#232730] bg-[#171A20] px-5 py-3.5">
                <h2 className="font-[family-name:var(--font-display)] text-base font-bold text-[#F4F5F6]">
                  {ep.title}
                </h2>
                <span className="font-mono text-xs text-[#C8FF2E]">
                  action={ep.action}
                </span>
              </div>

              <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-wider text-[#98A0AD] mb-2">
                    Parâmetros
                  </div>
                  <div className="divide-y divide-[#232730] border border-[#232730] bg-[#0C0E12]">
                    {ep.params.map((p) => (
                      <div key={p.name} className="px-3 py-2 text-xs">
                        <span className="font-mono font-bold text-[#FF6B2C]">
                          {p.name}
                        </span>
                        <span className="ml-2 text-[#98A0AD]">{p.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="font-mono text-[11px] uppercase tracking-wider text-[#98A0AD] mb-2">
                    Exemplo de Retorno
                  </div>
                  <pre className="overflow-x-auto border border-[#232730] bg-[#0C0E12] p-3.5 font-mono text-xs text-[#34D399] leading-5">
                    {ep.response}
                  </pre>
                </div>
              </div>
            </section>
          ))}
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
