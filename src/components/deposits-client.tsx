"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCircle2,
  Copy,
  QrCode,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import {
  DEPOSIT_STATUS_META,
  formatBRL,
  formatDateBR,
} from "@/lib/format";
import { StatusBadge } from "./status-badge";
import { QrCodeBox } from "./qr-code-box";

export interface DepositItem {
  id: string;
  amount: number;
  method: string;
  gateway: string;
  txid: string;
  pixCode: string | null;
  status: string;
  note: string | null;
  createdAt: string;
}

interface DepositsClientProps {
  initialDeposits: DepositItem[];
  minDeposit: number;
  gateway: string;
}

const PRESETS = [20, 50, 100, 250, 500];

export function DepositsClient({
  initialDeposits,
  minDeposit,
  gateway,
}: DepositsClientProps) {
  const router = useRouter();
  const [deposits, setDeposits] = useState(initialDeposits);
  const [amount, setAmount] = useState<number>(Math.max(50, minDeposit));
  const [activeDeposit, setActiveDeposit] = useState<DepositItem | null>(
    initialDeposits.find((d) => d.status === "PENDING" && d.pixCode) ?? null
  );
  const [creating, setCreating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleGeneratePix(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setCreating(true);
    try {
      const res = await fetch("/api/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Não foi possível gerar cobrança Pix.");
        return;
      }
      const created: DepositItem = {
        ...data.deposit,
        createdAt: data.deposit.createdAt,
      };
      setActiveDeposit(created);
      setDeposits((prev) => [created, ...prev]);
    } catch {
      setError("Erro de rede.");
    } finally {
      setCreating(false);
    }
  }

  async function handleSandboxConfirm(depositId: string) {
    setError("");
    setConfirming(true);
    try {
      const res = await fetch(`/api/deposits/${depositId}/confirm`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Falha ao confirmar pagamento.");
        return;
      }
      setDeposits((prev) =>
        prev.map((d) => (d.id === depositId ? { ...d, status: "PAID" } : d))
      );
      setActiveDeposit(null);
      setSuccess(
        `Pagamento Pix confirmado! Seu novo saldo é ${formatBRL(data.balance)}.`
      );
      router.refresh();
    } finally {
      setConfirming(false);
    }
  }

  function copyPixCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div>
        <span className="font-mono text-xs uppercase tracking-widest text-[#C8FF2E]">
          Crédito Instantâneo 24/7 • Gateway {gateway}
        </span>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold">
          Adicionar Saldo via Pix
        </h1>
        <p className="mt-1 text-sm text-[#98A0AD]">
          Sem taxas adicionais. Recarga mínima de {formatBRL(minDeposit)}.
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
          onSubmit={handleGeneratePix}
          className="lg:col-span-6 surface-card p-5 sm:p-6 space-y-5"
        >
          <div>
            <div className="font-mono text-[11px] uppercase tracking-wider text-[#98A0AD] mb-2">
              Valores Rápidos
            </div>
            <div className="grid grid-cols-5 gap-2">
              {PRESETS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val)}
                  className={`h-10 font-mono text-xs border cursor-pointer ${
                    amount === val
                      ? "bg-[#C8FF2E] text-[#090A0C] border-[#C8FF2E] font-bold"
                      : "bg-[#0C0E12] text-[#F4F5F6] border-[#232730] hover:border-[#C8FF2E]"
                  }`}
                >
                  R$ {val}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="pix-amount"
              className="block font-mono text-[11px] uppercase tracking-wider text-[#98A0AD] mb-1.5"
            >
              Valor da Recarga (BRL)
            </label>
            <input
              id="pix-amount"
              type="number"
              step="0.01"
              min={minDeposit}
              required
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="input-terminal w-full h-12 px-4 font-mono text-lg font-bold"
            />
          </div>

          <button
            type="submit"
            disabled={creating}
            className="btn-lime h-12 w-full inline-flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-wider cursor-pointer"
          >
            <QrCode className="h-4 w-4" />
            {creating ? "Gerando Pix..." : `Gerar QR Code Pix de ${formatBRL(amount)}`}
          </button>

          <p className="font-mono text-[11px] text-[#68707E] leading-relaxed">
            • Liberação automática via webhook Pix (Mercado Pago / Asaas / Efí).
            <br />• Em modo SANDBOX local, você pode simular o pagamento em 1 clique ao lado.
          </p>
        </form>

        {/* Área do QR Code Pix Gerado */}
        <div className="lg:col-span-6 surface-elevated p-5 sm:p-6">
          {activeDeposit && activeDeposit.pixCode ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#232730] pb-3">
                <div>
                  <div className="font-mono text-[11px] uppercase text-[#C8FF2E]">
                    Pix Gerado • {activeDeposit.txid}
                  </div>
                  <div className="font-mono text-2xl font-bold text-[#F4F5F6]">
                    {formatBRL(activeDeposit.amount)}
                  </div>
                </div>
                <StatusBadge label="Aguardando Pix" tone="amber" />
              </div>

              <div className="flex justify-center py-2">
                <QrCodeBox value={activeDeposit.pixCode} />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#98A0AD] mb-1">
                  Pix Copia e Cola (BR Code EMV)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={activeDeposit.pixCode}
                    className="input-terminal flex-1 h-10 px-3 font-mono text-xs text-[#98A0AD]"
                  />
                  <button
                    type="button"
                    onClick={() => copyPixCode(activeDeposit.pixCode!)}
                    className="btn-outline h-10 px-3 inline-flex items-center gap-1.5 font-mono text-xs uppercase cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-[#34D399]" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copiar
                      </>
                    )}
                  </button>
                </div>
              </div>

              {(activeDeposit.gateway === "SANDBOX" ||
                activeDeposit.gateway.endsWith("_FALLBACK")) && (
                <button
                  type="button"
                  disabled={confirming}
                  onClick={() => handleSandboxConfirm(activeDeposit.id)}
                  className="w-full h-11 border border-[#10B981] bg-[#10B981]/15 text-[#34D399] hover:bg-[#10B981]/25 font-mono text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" />
                  {confirming
                    ? "Confirmando..."
                    : "Simular Pagamento Pix Aprovado (Teste Local)"}
                </button>
              )}
            </div>
          ) : (
            <div className="py-12 text-center space-y-2">
              <QrCode className="h-10 w-10 text-[#323845] mx-auto" />
              <div className="font-[family-name:var(--font-display)] text-base font-bold text-[#F4F5F6]">
                Nenhum Pix pendente aberto
              </div>
              <p className="text-xs text-[#98A0AD]">
                Informe o valor ao lado para gerar seu QR Code e código Copia e
                Cola instantaneamente.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Histórico de recargas */}
      <div className="border border-[#232730] bg-[#111317] overflow-x-auto">
        <div className="border-b border-[#232730] bg-[#171A20] px-4 py-3 font-mono text-xs uppercase tracking-wider text-[#F4F5F6]">
          Histórico de Depósitos & Créditos
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#232730] bg-[#0C0E12] font-mono text-[11px] uppercase text-[#98A0AD]">
              <th className="px-4 py-2.5">Data</th>
              <th className="px-4 py-2.5">TXID</th>
              <th className="px-4 py-2.5">Método</th>
              <th className="px-4 py-2.5 text-right">Valor</th>
              <th className="px-4 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#232730] text-sm">
            {deposits.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center font-mono text-xs text-[#98A0AD]"
                >
                  Nenhuma recarga registrada ainda.
                </td>
              </tr>
            ) : (
              deposits.map((d) => {
                const meta = DEPOSIT_STATUS_META[d.status] ?? {
                  label: d.status,
                  tone: "zinc" as const,
                };
                return (
                  <tr key={d.id} className="hover:bg-[#171A20]">
                    <td className="px-4 py-3 font-mono text-xs text-[#98A0AD]">
                      {formatDateBR(d.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#F4F5F6]">
                      {d.txid}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#98A0AD]">
                      {d.method} ({d.gateway})
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-[#C8FF2E]">
                      {formatBRL(d.amount)}
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
  );
}
