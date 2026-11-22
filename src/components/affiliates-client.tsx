"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CheckCircle2, Copy, Wallet } from "lucide-react";
import { formatBRL, formatDateBR, formatInt } from "@/lib/format";

interface AffiliateEarningItem {
  id: string;
  depositAmount: number;
  commissionRate: number;
  amount: number;
  status: string;
  createdAt: string;
}

interface AffiliatesClientProps {
  referralCode: string;
  clicks: number;
  referralsCount: number;
  availableBalance: number;
  totalEarned: number;
  commissionRate: number;
  minPayout: number;
  earnings: AffiliateEarningItem[];
  appUrl: string;
}

export function AffiliatesClient({
  referralCode,
  clicks,
  referralsCount,
  availableBalance,
  totalEarned,
  commissionRate,
  minPayout,
  earnings,
  appUrl,
}: AffiliatesClientProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const inviteUrl = `${appUrl}/login?tab=register&ref=${referralCode}`;

  function copyLink() {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handlePayout() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/affiliates/payout", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Não foi possível resgatar.");
        return;
      }
      setMessage(
        `${formatBRL(data.transferred)} transferidos para o saldo principal da sua conta!`
      );
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <span className="font-mono text-xs uppercase tracking-widest text-[#C8FF2E]">
          Indique & Ganhe {commissionRate}% Recorrente
        </span>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold">
          Programa de Afiliados
        </h1>
        <p className="mt-1 text-sm text-[#98A0AD]">
          Ganhe {commissionRate}% de comissão automática sobre cada recarga via
          Stripe (Pix ou Cartão) feita pelos usuários que se cadastrarem pelo seu link.
        </p>
      </div>

      {/* Link de indicação */}
      <div className="surface-card p-5 space-y-3">
        <label
          htmlFor="affiliate-invite-url"
          className="block font-mono text-[11px] uppercase tracking-wider text-[#98A0AD]"
        >
          Seu Link Exclusivo de Indicação
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            id="affiliate-invite-url"
            type="text"
            readOnly
            value={inviteUrl}
            className="input-terminal flex-1 h-11 px-3 font-mono text-xs text-[#C8FF2E]"
          />
          <button
            type="button"
            onClick={copyLink}
            className="btn-lime h-11 px-5 inline-flex items-center justify-center gap-2 font-mono text-xs uppercase cursor-pointer"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Link Copiado!" : "Copiar Link"}
          </button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border border-[#232730] bg-[#111317]">
        {[
          { label: "Taxa de Comissão", val: `${commissionRate}%`, cls: "text-[#FF8A58]" },
          { label: "Cadastros / Cliques", val: `${formatInt(referralsCount)} / ${formatInt(clicks)}`, cls: "text-[#F4F5F6]" },
          { label: "Total Acumulado", val: formatBRL(totalEarned), cls: "text-[#34D399]" },
          { label: "Disponível p/ Resgate", val: formatBRL(availableBalance), cls: "text-[#C8FF2E]" },
        ].map((item, idx) => (
          <div
            key={item.label}
            className={`p-4 sm:p-5 ${
              idx < 3 ? "border-b lg:border-b-0 border-r border-[#232730]" : ""
            }`}
          >
            <div className="font-mono text-[10px] uppercase tracking-widest text-[#98A0AD]">
              {item.label}
            </div>
            <div className={`mt-1 font-mono text-xl sm:text-2xl font-bold ${item.cls}`}>
              {item.val}
            </div>
          </div>
        ))}
      </div>

      {/* Ação de resgate */}
      <div className="surface-elevated p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="font-[family-name:var(--font-display)] text-base font-bold">
            Converter Comissão em Saldo no Painel
          </div>
          <p className="text-xs text-[#98A0AD]">
            Resgate mínimo: {formatBRL(minPayout)}. Transferência instantânea para
            fazer pedidos.
          </p>
        </div>
        <button
          type="button"
          disabled={busy || availableBalance < minPayout}
          onClick={handlePayout}
          className="btn-lime h-11 px-5 inline-flex items-center gap-2 font-mono text-xs uppercase cursor-pointer shrink-0"
        >
          <Wallet className="h-4 w-4" />
          {busy ? "Transferindo..." : "Transferir para Saldo"}
        </button>
      </div>

      {message && (
        <div className="flex items-center gap-2 border border-[#10B981]/40 bg-[#10B981]/10 px-4 py-3 font-mono text-xs text-[#34D399]">
          <CheckCircle2 className="h-4 w-4" />
          {message}
        </div>
      )}
      {error && (
        <div className="border border-[#EF4444]/40 bg-[#EF4444]/10 px-4 py-3 font-mono text-xs text-[#F87171]">
          {error}
        </div>
      )}

      {/* Extrato */}
      <div className="border border-[#232730] bg-[#111317] overflow-x-auto">
        <div className="border-b border-[#232730] bg-[#171A20] px-4 py-3 font-mono text-xs uppercase">
          Extrato de Comissões
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#232730] bg-[#0C0E12] font-mono text-[11px] uppercase text-[#98A0AD]">
              <th className="px-4 py-2.5">Data</th>
              <th className="px-4 py-2.5 text-right">Recarga do Indicado</th>
              <th className="px-4 py-2.5 text-right">Taxa</th>
              <th className="px-4 py-2.5 text-right">Sua Comissão</th>
              <th className="px-4 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#232730] text-sm font-mono">
            {earnings.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-xs text-[#98A0AD]">
                  Nenhuma comissão recebida ainda. Compartilhe seu link acima!
                </td>
              </tr>
            ) : (
              earnings.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-3 text-xs text-[#98A0AD]">
                    {formatDateBR(e.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right text-xs">
                    {formatBRL(e.depositAmount)}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-[#98A0AD]">
                    {e.commissionRate}%
                  </td>
                  <td className="px-4 py-3 text-right text-xs font-bold text-[#C8FF2E]">
                    +{formatBRL(e.amount)}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#34D399]">
                    {e.status === "PAID_OUT" ? "Resgatado" : "Disponível"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
