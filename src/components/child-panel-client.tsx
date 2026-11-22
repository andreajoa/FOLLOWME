"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Globe, Server, ShieldAlert } from "lucide-react";
import {
  CHILD_PANEL_STATUS_META,
  formatBRL,
  formatDateBR,
} from "@/lib/format";
import { StatusBadge } from "./status-badge";

export interface ChildPanelRow {
  id: number;
  domain: string;
  currency: string;
  adminUsername: string;
  monthlyPrice: number;
  status: string;
  nameservers: string;
  nextBillingAt: string;
  createdAt: string;
}

export function ChildPanelClient({
  initialPanels,
  monthlyPrice,
  brandName,
}: {
  initialPanels: ChildPanelRow[];
  monthlyPrice: number;
  brandName: string;
}) {
  const router = useRouter();
  const [panels, setPanels] = useState(initialPanels);
  const [domain, setDomain] = useState("");
  const [currency, setCurrency] = useState<"BRL" | "USD" | "EUR">("BRL");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleOrderPanel(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (adminPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/child-panels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain,
          currency,
          adminUsername,
          adminPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Não foi possível contratar o Painel Filho.");
        return;
      }

      setPanels((prev) => [
        {
          ...data.panel,
          nextBillingAt: data.panel.nextBillingAt,
          createdAt: data.panel.createdAt || new Date().toISOString(),
        },
        ...prev,
      ]);
      setDomain("");
      setAdminUsername("");
      setAdminPassword("");
      setConfirmPassword("");
      setSuccess(
        `Painel Filho solicitado para ${data.panel.domain}! Aponte os nameservers indicados abaixo.`
      );
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <span className="font-mono text-xs uppercase tracking-widest text-[#C8FF2E]">
          White-Label Revenda • Seu Próprio Painel SMM
        </span>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold">
          Painel Filho (Child Panel)
        </h1>
        <p className="mt-1 text-sm text-[#98A0AD]">
          Tenha seu próprio painel SMM com domínio próprio conectado automaticamente ao estoque e à API do {brandName}.
        </p>
      </div>

      {success && (
        <div className="flex items-center gap-2 border border-[#10B981]/40 bg-[#10B981]/10 px-4 py-3 font-mono text-xs text-[#34D399]">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 border border-[#EF4444]/40 bg-[#EF4444]/10 px-4 py-3 font-mono text-xs text-[#F87171]">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleOrderPanel}
          className="lg:col-span-7 surface-card p-5 sm:p-6 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[#232730] pb-3">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">
              Configurar Novo Painel Filho
            </h2>
            <span className="font-mono text-sm font-bold text-[#C8FF2E]">
              {formatBRL(monthlyPrice)} / mês
            </span>
          </div>

          <div>
            <label className="block font-mono text-[11px] uppercase text-[#98A0AD] mb-1">
              Seu Domínio
            </label>
            <input
              type="text"
              required
              placeholder="ex: meupainelsmm.com.br"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="input-terminal w-full h-10 px-3 text-sm"
            />
          </div>

          <div className="border border-[#C8FF2E]/30 bg-[#0C0E12] p-3.5 font-mono text-xs space-y-1">
            <div className="text-[#C8FF2E] uppercase">
              Aponte seu domínio para os servidores DNS:
            </div>
            <div className="text-[#F4F5F6]">NS1: ns1.followme.nexaclouds.online</div>
            <div className="text-[#F4F5F6]">NS2: ns2.followme.nexaclouds.online</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-[11px] uppercase text-[#98A0AD] mb-1">
                Moeda do Painel
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as "BRL" | "USD" | "EUR")}
                className="input-terminal w-full h-10 px-3 font-mono text-sm"
              >
                <option value="BRL" className="bg-[#111317]">BRL (R$)</option>
                <option value="USD" className="bg-[#111317]">USD ($)</option>
                <option value="EUR" className="bg-[#111317]">EUR (€)</option>
              </select>
            </div>

            <div>
              <label className="block font-mono text-[11px] uppercase text-[#98A0AD] mb-1">
                Usuário Administrador
              </label>
              <input
                type="text"
                required
                placeholder="admin"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                className="input-terminal w-full h-10 px-3 text-sm"
              />
            </div>

            <div>
              <label className="block font-mono text-[11px] uppercase text-[#98A0AD] mb-1">
                Senha do Admin
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="input-terminal w-full h-10 px-3 text-sm"
              />
            </div>

            <div>
              <label className="block font-mono text-[11px] uppercase text-[#98A0AD] mb-1">
                Confirmar Senha
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-terminal w-full h-10 px-3 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-lime h-11 w-full inline-flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-wider cursor-pointer"
          >
            <Server className="h-4 w-4" />
            {submitting
              ? "Processando..."
              : `Contratar Painel Filho (${formatBRL(monthlyPrice)}/mês)`}
          </button>
        </form>

        <div className="lg:col-span-5 surface-card p-5 sm:p-6 space-y-4">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold border-b border-[#232730] pb-3">
            O que está incluso
          </h2>
          <ul className="space-y-2.5 text-sm text-[#98A0AD]">
            <li>• Domínio próprio com certificado SSL gratuito.</li>
            <li>• Catálogo inteiro conectado ao {brandName} com sua margem de lucro livre.</li>
            <li>• Receba pagamentos dos seus clientes direto na sua conta Stripe/Pix.</li>
            <li>• Painel administrativo próprio para gerenciar seus usuários e tickets.</li>
            <li>• Ativação rápida em até 24h após o apontamento DNS.</li>
          </ul>
        </div>
      </div>

      {/* Painéis contratados */}
      <div className="surface-card overflow-hidden">
        <div className="border-b border-[#232730] bg-[#171A20] px-5 py-3.5 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-base font-bold">
            Meus Painéis Filhos
          </h2>
          <span className="font-mono text-xs text-[#98A0AD]">{panels.length} painéis</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#232730] bg-[#0C0E12] font-mono text-[11px] uppercase text-[#98A0AD]">
                <th className="px-4 py-3">Domínio</th>
                <th className="px-4 py-3">Moeda</th>
                <th className="px-4 py-3">Admin</th>
                <th className="px-4 py-3">Mensalidade</th>
                <th className="px-4 py-3">Próx. Cobrança</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232730] text-sm">
              {panels.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[#68707E]">
                    Você ainda não contratou um Painel Filho.
                  </td>
                </tr>
              ) : (
                panels.map((p) => {
                  const meta = CHILD_PANEL_STATUS_META[p.status] ?? {
                    label: p.status,
                    tone: "zinc" as const,
                  };
                  return (
                    <tr key={p.id} className="hover:bg-[#15181E]">
                      <td className="px-4 py-3 font-mono text-xs text-[#F4F5F6] flex items-center gap-2">
                        <Globe className="h-3.5 w-3.5 text-[#C8FF2E]" />
                        {p.domain}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#98A0AD]">
                        {p.currency}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#98A0AD]">
                        @{p.adminUsername}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-[#C8FF2E]">
                        {formatBRL(p.monthlyPrice)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#98A0AD]">
                        {formatDateBR(p.nextBillingAt)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge label={meta.label} tone={meta.tone} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
