import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser, getRequestPreferences } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SMM Panel API v2 Documentation — Resellers & Agencies | FollowMe",
  description:
    "Full SMM Panel API v2 reference for FollowMe: services, orders, drip-feed, subscriptions, refill, cancel, and balance endpoints compatible with Perfect Panel, Shopify, and N8N.",
  alternates: { canonical: "/api-docs" },
};

const ENDPOINTS = [
  {
    title: "1. Listar Serviços (Service list)",
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
    "rate": "26.90",
    "min": "50",
    "max": "50000",
    "refill": true,
    "cancel": true,
    "dripfeed": true
  }
]`,
  },
  {
    title: "2. Criar Novo Pedido (Default / Package / Comments / Comment Likes / Poll)",
    action: "add",
    params: [
      { name: "key", desc: "Sua chave de API" },
      { name: "action", desc: "add" },
      { name: "service", desc: "ID numérico do serviço" },
      { name: "link", desc: "Link do perfil, publicação ou vídeo" },
      { name: "quantity", desc: "Quantidade desejada (Default / Comment Likes / Poll)" },
      { name: "runs / interval (opcional)", desc: "Execuções e intervalo em minutos para Drip-Feed" },
      { name: "comments (Custom Comments)", desc: "Lista de comentários separados por \\n" },
      { name: "username (Comment Likes)", desc: "Usuário autor do comentário" },
      { name: "answer_number (Poll)", desc: "Número da opção da enquete" },
    ],
    response: `{
  "order": 1042
}`,
  },
  {
    title: "3. Criar Assinatura Automática (Subscriptions)",
    action: "add (Subscriptions)",
    params: [
      { name: "key", desc: "Sua chave de API" },
      { name: "action", desc: "add" },
      { name: "service", desc: "ID de um serviço tipo Subscriptions" },
      { name: "username", desc: "Usuário do perfil público monitorado" },
      { name: "min / max", desc: "Quantidade mínima e máxima por novo post" },
      { name: "posts (opcional)", desc: "Limite de novos posts (omita para ilimitado)" },
      { name: "old_posts (opcional)", desc: "Quantidade de posts antigos a engajar" },
      { name: "delay", desc: "Atraso em minutos (0, 5, 10, 15, 30, 60...)" },
      { name: "expiry (opcional)", desc: "Data de expiração (d/m/Y)" },
    ],
    response: `{
  "order": 58,
  "subscription": 58
}`,
  },
  {
    title: "4. Consultar Status (Individual ou Múltiplos)",
    action: "status",
    params: [
      { name: "key", desc: "Sua chave de API" },
      { name: "action", desc: "status" },
      { name: "order", desc: "ID de um pedido único (ou use 'orders=1,2,3' até 100 IDs)" },
    ],
    response: `{
  "charge": "26.9000",
  "start_count": "14200",
  "status": "In progress",
  "remains": "350",
  "currency": "BRL"
}`,
  },
  {
    title: "5. Solicitar Reposição (Individual ou Múltiplos Refills)",
    action: "refill",
    params: [
      { name: "key", desc: "Sua chave de API" },
      { name: "action", desc: "refill" },
      { name: "order", desc: "ID de um pedido único elegível" },
      { name: "orders (múltiplo)", desc: "Até 100 IDs separados por vírgula (ex: 1042,1043)" },
    ],
    response: `{
  "refill": "1042"
}`,
  },
  {
    title: "6. Status da Reposição (Individual ou Múltiplos)",
    action: "refill_status",
    params: [
      { name: "key", desc: "Sua chave de API" },
      { name: "action", desc: "refill_status" },
      { name: "refill", desc: "ID da reposição (ou 'refills=1042,1043' para múltiplas)" },
    ],
    response: `{
  "status": "Completed"
}`,
  },
  {
    title: "7. Cancelar Pedido(s)",
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
    title: "8. Consultar Saldo da Conta",
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
  const [user, settings, prefs] = await Promise.all([
    getCurrentUser(),
    getSiteSettings(),
    getRequestPreferences(),
  ]);

  const baseUrl = (process.env.APP_URL || "https://followme.nexaclouds.online").replace(
    /\/+$/,
    ""
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8fd] text-[#111015]">
      <div className="fn-hero-canvas border-b border-[#ece5f2]">
        <PublicHeader
          brandName={settings.brandName}
          user={user ? { username: user.username, role: user.role } : null}
          locale={prefs.locale}
          currency={prefs.currency}
        />

        <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <span className="fn-eyebrow-pill inline-flex items-center gap-2 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-[#18141d]">
            <span className="h-2 w-2 rounded-full bg-[#8c42ed]" />
            Integração para Revendedores, Painéis Filhos &amp; Lojas
          </span>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-black tracking-[-0.045em] text-[#111015]">
            Documentação API v2
          </h1>
          <p className="mt-2 text-sm sm:text-base font-medium text-[#66616d]">
            100% compatível com o padrão mundial SMM Panel v2 (Perfect Panel,
            WooCommerce, Shopify, N8N ou sistemas próprios).
          </p>
        </div>
      </div>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 rounded-[18px] border border-[#ece5f2] bg-white shadow-[0_12px_32px_rgba(52,27,76,0.06)] font-mono text-xs overflow-hidden">
          <div className="p-4 border-b sm:border-b-0 sm:border-r border-[#ece5f2]">
            <div className="text-[#796b89]">MÉTODO HTTP</div>
            <div className="mt-1 text-sm font-extrabold text-[#7c3ee9]">POST</div>
          </div>
          <div className="p-4 border-b sm:border-b-0 sm:border-r border-[#ece5f2]">
            <div className="text-[#796b89]">URL DA API</div>
            <div className="mt-1 text-sm font-bold text-[#111015] break-all">
              {baseUrl}/api/v2
            </div>
          </div>
          <div className="p-4">
            <div className="text-[#796b89]">FORMATO DE RESPOSTA</div>
            <div className="mt-1 text-sm font-bold text-[#111015]">JSON (UTF-8)</div>
          </div>
        </div>

        {user ? (
          <div className="rounded-[18px] border-2 border-[#7c3ee9] bg-[#f6f1ff] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-mono text-xs font-bold uppercase text-[#7c3ee9]">
                Sua Chave de API Ativa
              </div>
              <div className="mt-1 font-mono text-sm font-semibold text-[#111015] break-all">
                {user.apiKey}
              </div>
            </div>
            <Link
              href="/painel/conta"
              className="btn-outline inline-flex h-9 items-center px-3 text-xs font-bold uppercase shrink-0"
            >
              Gerenciar Chave
            </Link>
          </div>
        ) : (
          <div className="surface-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-sm font-medium text-[#5e5868]">
              Crie sua conta gratuitamente para gerar sua chave de API exclusiva.
            </p>
            <Link
              href="/login?tab=register"
              className="btn-lime inline-flex h-10 items-center px-4 text-xs font-bold uppercase shrink-0"
            >
              Gerar API Key Grátis
            </Link>
          </div>
        )}

        <div className="space-y-6">
          {ENDPOINTS.map((ep) => (
            <section
              key={ep.title}
              className="overflow-hidden rounded-[18px] border border-[#ece5f2] bg-white shadow-[0_10px_28px_rgba(52,27,76,0.05)]"
            >
              <div className="flex items-center justify-between border-b border-[#ece5f2] bg-[#faf8fd] px-5 py-3.5">
                <h2 className="font-[family-name:var(--font-display)] text-base font-extrabold text-[#111015]">
                  {ep.title}
                </h2>
                <span className="rounded-full bg-[#f3ebff] px-2.5 py-0.5 font-mono text-xs font-bold text-[#7c3ee9]">
                  action={ep.action}
                </span>
              </div>

              <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#796b89] mb-2">
                    Parâmetros
                  </div>
                  <div className="divide-y divide-[#ece5f2] rounded-xl border border-[#ece5f2] bg-[#faf8fd]">
                    {ep.params.map((p) => (
                      <div key={p.name} className="px-3.5 py-2.5 text-xs">
                        <span className="font-mono font-bold text-[#7c3ee9]">
                          {p.name}
                        </span>
                        <span className="ml-2 text-[#5e5868]">{p.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#796b89] mb-2">
                    Exemplo de Retorno
                  </div>
                  <pre className="overflow-x-auto rounded-xl border border-[#2e244d] bg-[#130d26] p-4 font-mono text-xs text-[#64d893] leading-5">
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
        locale={prefs.locale}
      />
    </div>
  );
}
