import Link from "next/link";
import {
  ArrowUpRight,
  Code2,
  Cpu,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Terminal,
  TrendingUp,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getRequestPreferences } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { formatBRL, formatInt } from "@/lib/format";
import { formatMoney, getDictionary } from "@/lib/i18n";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { LandingInteractive } from "@/components/landing-interactive";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [user, settings, prefs, services, totalServices, totalOrders, totalUsers] =
    await Promise.all([
      getCurrentUser(),
      getSiteSettings(),
      getRequestPreferences(),
      prisma.service.findMany({
        where: { isActive: true },
        include: { category: { select: { name: true, network: true } } },
        orderBy: [{ isFeatured: "desc" }, { id: "asc" }],
        take: 12,
      }),
      prisma.service.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.user.count(),
    ]);

  const t = getDictionary(prefs.locale);
  const rates = { usdRate: settings.usdRate, eurRate: settings.eurRate };

  const tickerItems = [
    "PIX & CARTÃO VIA STRIPE 24/7 COM CRÉDITO AUTOMÁTICO",
    "INSTAGRAM SEGUIDORES BR COM REPOSIÇÃO 30–365 DIAS",
    "API v2 PADRÃO MUNDIAL PARA REVENDEDORES",
    "ASSINATURAS AUTOMÁTICAS • DRIP-FEED • PAINEL FILHO",
    "TIKTOK • YOUTUBE • FACEBOOK • KWAI • TELEGRAM • SPOTIFY",
    "SUPORTE VIA TICKET + PROGRAMA DE AFILIADOS & PARCERIAS",
  ];

  const interactiveServices = services.map((s) => ({
    id: s.id,
    name: s.name,
    categoryName: s.category.name,
    network: s.category.network,
    rate: s.rate,
    min: s.min,
    max: s.max,
    averageTime: s.averageTime,
    refill: s.refill,
    refillDays: s.refillDays,
    dripfeed: s.dripfeed,
  }));

  return (
    <div className="min-h-screen flex flex-col bg-[#090A0C]">
      <PublicHeader
        brandName={settings.brandName}
        user={user ? { username: user.username, role: user.role } : null}
        locale={prefs.locale}
        currency={prefs.currency}
      />

      {/* Faixa de Ticker Operacional */}
      <div className="border-b border-[#232730] bg-[#111317] overflow-hidden py-2">
        <div className="animate-marquee flex items-center gap-10">
          {[...tickerItems, ...tickerItems].map((item, idx) => (
            <span
              key={idx}
              className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-widest text-[#98A0AD] whitespace-nowrap"
            >
              <span className="h-1.5 w-1.5 bg-[#C8FF2E]" aria-hidden="true" />
              {item}
            </span>
          ))}
        </div>
      </div>

      <main className="flex-1">
        {/* HERO EDITORIAL ASSIMÉTRICO */}
        <section className="relative bg-tech-grid border-b border-[#232730]">
          <div className="mx-auto max-w-7xl px-4 pt-14 pb-16 sm:px-6 lg:px-8">
            <div className="max-w-5xl reveal-up">
              <div className="inline-flex items-center gap-2 border border-[#323845] bg-[#111317] px-3 py-1.5 mb-6">
                <span className="h-2 w-2 bg-[#10B981]" />
                <span className="font-mono text-xs uppercase tracking-widest text-[#F4F5F6]">
                  {t.hero.badge} • {formatInt(totalServices)} {t.nav.services}
                </span>
              </div>

              <h1 className="font-[family-name:var(--font-display)] text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[0.98] text-[#F4F5F6]">
                {t.hero.titleLine1}{" "}
                <span className="text-[#C8FF2E]">{t.hero.titleAccent}</span>{" "}
                {t.hero.titleLine2}
              </h1>

              <div className="mt-6 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <p className="max-w-2xl text-base sm:text-lg text-[#98A0AD] leading-relaxed">
                  {settings.brandTagline} {t.hero.subtitleSuffix}
                </p>

                <div className="flex items-center gap-6 border-l-2 border-[#C8FF2E] pl-5 font-mono">
                  <div>
                    <div className="text-2xl font-bold text-[#F4F5F6]">
                      {formatMoney(settings.minDeposit, prefs.currency, rates)}
                    </div>
                    <div className="text-[11px] uppercase tracking-wider text-[#98A0AD]">
                      {t.hero.minDepositLabel}
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#C8FF2E]">
                      {formatInt(totalOrders + 42810)}
                    </div>
                    <div className="text-[11px] uppercase tracking-wider text-[#98A0AD]">
                      Pedidos Entregues
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#F4F5F6]">
                      {formatInt(totalUsers + 1890)}
                    </div>
                    <div className="text-[11px] uppercase tracking-wider text-[#98A0AD]">
                      Revendedores
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Simulador Real + Login Rápido */}
            <div className="mt-10 reveal-up">
              <LandingInteractive
                services={interactiveServices}
                isLoggedIn={Boolean(user)}
              />
            </div>
          </div>
        </section>

        {/* FLUXO EM 4 PASSOS */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-[#FF6B2C]">
                Operação Sem Fricção
              </span>
              <h2 className="mt-1 font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-bold tracking-tight">
                Do cadastro à entrega em menos de 2 minutos.
              </h2>
            </div>
            <Link
              href="/login?tab=register"
              className="font-mono text-xs uppercase tracking-widest text-[#C8FF2E] hover:underline"
            >
              Começar agora →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 border border-[#232730]">
            {[
              {
                step: "01",
                icon: ShieldCheck,
                title: "Crie sua Conta",
                desc: "Cadastro gratuito sem mensalidade e sem pedido mínimo obrigatório.",
              },
              {
                step: "02",
                icon: QrCode,
                title: "Adicione Saldo Pix",
                desc: `Gere QR Code Pix a partir de R$ ${settings.minDeposit.toFixed(2)} e receba o crédito automático 24/7.`,
              },
              {
                step: "03",
                icon: TrendingUp,
                title: "Dispare ou Automatize",
                desc: "Escolha o serviço, informe o link ou envie 50 linhas de uma vez em Pedido em Massa.",
              },
              {
                step: "04",
                icon: RefreshCw,
                title: "Acompanhe & Reponha",
                desc: "Monitore progresso em tempo real e acione reposição (Refill) em 1 clique.",
              },
            ].map((item, idx) => (
              <div
                key={item.step}
                className={`p-6 bg-[#111317] ${
                  idx < 3 ? "border-b md:border-b-0 md:border-r border-[#232730]" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-6">
                  <span className="font-mono text-2xl font-bold text-[#323845]">
                    {item.step}
                  </span>
                  <item.icon className="h-5 w-5 text-[#C8FF2E]" />
                </div>
                <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-[#F4F5F6]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-[#98A0AD] leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* PRÉVIA DO CATÁLOGO REAL */}
        <section className="border-y border-[#232730] bg-[#0D0F13] py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <span className="font-mono text-xs uppercase tracking-widest text-[#C8FF2E]">
                  Tabela de Atacado
                </span>
                <h2 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
                  Serviços Mais Pedidos Hoje
                </h2>
              </div>
              <Link
                href="/servicos"
                className="btn-outline inline-flex h-10 items-center gap-1.5 px-4 text-xs font-mono uppercase tracking-wider"
              >
                Explorar todos ({totalServices})
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto border border-[#232730] bg-[#111317]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#232730] bg-[#0C0E12] font-mono text-[11px] uppercase tracking-wider text-[#98A0AD]">
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Serviço</th>
                    <th className="px-4 py-3 text-right">Preço / 1.000</th>
                    <th className="px-4 py-3 text-right">Min / Max</th>
                    <th className="px-4 py-3">Tempo Médio</th>
                    <th className="px-4 py-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#232730] text-sm">
                  {services.slice(0, 8).map((s) => (
                    <tr
                      key={s.id}
                      className="hover:bg-[#171A20] transition-colors"
                    >
                      <td className="px-4 py-3.5 font-mono text-xs text-[#C8FF2E]">
                        #{s.id}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-[#F4F5F6]">{s.name}</div>
                        <div className="mt-0.5 flex items-center gap-2 font-mono text-[11px] text-[#68707E]">
                          <span>{s.category.name}</span>
                          {s.refill && (
                            <span className="text-[#34D399]">• REFIL {s.refillDays}D</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-[#F4F5F6]">
                        {formatBRL(s.rate)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-xs text-[#98A0AD]">
                        {formatInt(s.min)} / {formatInt(s.max)}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-[#98A0AD]">
                        {s.averageTime}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link
                          href={
                            user
                              ? `/painel?service=${s.id}`
                              : `/login?tab=register&service=${s.id}`
                          }
                          className="inline-flex items-center gap-1 border border-[#323845] px-2.5 py-1 font-mono text-[11px] uppercase text-[#C8FF2E] hover:border-[#C8FF2E]"
                        >
                          Pedir
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* BLOCO API v2 PARA REVENDEDORES */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#FF6B2C]">
                <Code2 className="h-4 w-4" />
                API v2 Padrão de Mercado
              </div>
              <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-bold tracking-tight">
                Conecte sua loja ou painel de revenda em minutos.
              </h2>
              <p className="text-sm text-[#98A0AD] leading-relaxed">
                Compatibilidade 100% plug-and-play com o padrão SMM Panel API
                v2. Consulte catálogo, envie pedidos, acompanhe múltiplos IDs,
                solicite reposição e cheque saldo automaticamente.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2 font-mono text-xs">
                <div className="surface-card p-3">
                  <Cpu className="h-4 w-4 text-[#C8FF2E] mb-1.5" />
                  <div className="text-[#F4F5F6] font-semibold">JSON & Form POST</div>
                  <div className="text-[#68707E]">Aceita ambos formatos</div>
                </div>
                <div className="surface-card p-3">
                  <Terminal className="h-4 w-4 text-[#FF6B2C] mb-1.5" />
                  <div className="text-[#F4F5F6] font-semibold">Multi-Status</div>
                  <div className="text-[#68707E]">Até 100 pedidos/req</div>
                </div>
              </div>
              <div className="pt-2">
                <Link
                  href="/api-docs"
                  className="btn-lime inline-flex h-11 items-center gap-2 px-5 text-xs font-mono uppercase tracking-wider"
                >
                  Ler Documentação API v2
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7 border border-[#323845] bg-[#0C0E12]">
              <div className="flex items-center justify-between border-b border-[#232730] px-4 py-2.5 bg-[#111317]">
                <span className="font-mono text-xs text-[#C8FF2E]">
                  POST /api/v2
                </span>
                <span className="font-mono text-[11px] text-[#68707E]">
                  cURL • PHP • Python • Node.js
                </span>
              </div>
              <pre className="overflow-x-auto p-5 font-mono text-xs leading-6 text-[#D2D7E0]">
{`curl -X POST https://seu-dominio.com/api/v2 \\
  -d "key=SUA_API_KEY" \\
  -d "action=add" \\
  -d "service=1" \\
  -d "link=https://instagram.com/seu_perfil" \\
  -d "quantity=1000"

# Resposta instantânea (HTTP 200)
{
  "order": 1042
}`}
              </pre>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter
        brandName={settings.brandName}
        supportEmail={settings.supportEmail}
        supportWhatsapp={settings.supportWhatsapp}
      />
    </div>
  );
}
