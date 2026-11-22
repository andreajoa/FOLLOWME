"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Loader2,
  QrCode,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Zap,
} from "lucide-react";
import {
  DEPOSIT_STATUS_META,
  formatBRL,
  formatDateBR,
  PAYMENT_METHOD_LABELS,
} from "@/lib/format";
import { StatusBadge } from "./status-badge";

export interface DepositItem {
  id: string;
  amount: number;
  method: string;
  gateway: string;
  txid: string;
  checkoutUrl: string | null;
  stripeSessionId: string | null;
  status: string;
  note: string | null;
  createdAt: string;
}

interface DepositsClientProps {
  initialDeposits: DepositItem[];
  minDeposit: number;
  stripeConfigured: boolean;
  stripeEnabled: boolean;
  stripePixEnabled: boolean;
}

const PRESETS = [10, 25, 50, 100, 250, 500];

export function DepositsClient({
  initialDeposits,
  minDeposit,
  stripeConfigured,
  stripeEnabled,
  stripePixEnabled,
}: DepositsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [deposits, setDeposits] = useState(initialDeposits);
  const [method, setMethod] = useState<"PIX" | "CARD" | "BOTH">(
    stripePixEnabled ? "PIX" : "CARD"
  );
  const [amount, setAmount] = useState<number>(Math.max(50, minDeposit));
  const [creating, setCreating] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const stripeState = searchParams.get("stripe");
    const sessionId = searchParams.get("session_id");

    if (stripeState === "canceled") {
      setError("Checkout cancelado. Nenhuma cobrança foi realizada.");
      return;
    }

    if (stripeState === "success" && sessionId) {
      let active = true;
      setVerifying(true);
      fetch(`/api/deposits/stripe/verify?session_id=${encodeURIComponent(sessionId)}`)
        .then((r) => r.json())
        .then((data) => {
          if (!active) return;
          if (data.paid) {
            setSuccess(
              `Pagamento confirmado via Stripe! Seu saldo atualizado é ${formatBRL(data.balance ?? 0)}.`
            );
            if (data.deposit?.id) {
              setDeposits((prev) =>
                prev.map((d) =>
                  d.id === data.deposit.id ? { ...d, status: "PAID" } : d
                )
              );
            }
            router.refresh();
          } else if (data.error) {
            setError(data.error);
          } else {
            setSuccess(
              "Pagamento recebido e em processamento pela Stripe. Assim que compensar, seu saldo será creditado automaticamente."
            );
          }
        })
        .catch(() => {
          if (active) setError("Não foi possível confirmar o status agora. Atualize em instantes.");
        })
        .finally(() => {
          if (active) setVerifying(false);
        });

      return () => {
        active = false;
      };
    }
  }, [searchParams, router]);

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setCreating(true);
    try {
      const res = await fetch("/api/deposits/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, method }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Não foi possível iniciar o checkout Stripe.");
        return;
      }
      if (data.deposit) {
        setDeposits((prev) => [
          {
            ...data.deposit,
            createdAt: data.deposit.createdAt || new Date().toISOString(),
          },
          ...prev,
        ]);
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Erro de conexão ao iniciar o checkout.");
    } finally {
      setCreating(false);
    }
  }

  async function handleCheckStatus(sessionId: string) {
    setError("");
    setSuccess("");
    setVerifying(true);
    try {
      const res = await fetch(
        `/api/deposits/stripe/verify?session_id=${encodeURIComponent(sessionId)}`
      );
      const data = await res.json();
      if (data.paid) {
        setDeposits((prev) =>
          prev.map((d) =>
            d.stripeSessionId === sessionId ? { ...d, status: "PAID" } : d
          )
        );
        setSuccess(
          `Pagamento confirmado! Novo saldo: ${formatBRL(data.balance ?? 0)}.`
        );
        router.refresh();
      } else if (data.error) {
        setError(data.error);
      } else {
        setError("Pagamento ainda aguardando compensação na Stripe.");
      }
    } finally {
      setVerifying(false);
    }
  }

  const minAllowed = Math.max(minDeposit, 5);
  const canPay = stripeConfigured && stripeEnabled;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#C8FF2E]">
            Checkout Oficial Stripe • Crédito Automático 24/7
          </span>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold">
            Adicionar Saldo (Pix &amp; Cartão)
          </h1>
          <p className="mt-1 text-sm text-[#98A0AD]">
            Pague com Pix instantâneo ou Cartão de Crédito/Débito via Stripe. Recarga mínima de{" "}
            {formatBRL(minAllowed)}.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 border border-[#10B981]/40 bg-[#10B981]/10 px-3 py-1.5 font-mono text-[11px] uppercase text-[#34D399]">
          <ShieldCheck className="h-3.5 w-3.5" />
          Ambiente Criptografado Stripe
        </div>
      </div>

      {verifying && (
        <div className="flex items-center gap-2 border border-[#C8FF2E]/40 bg-[#C8FF2E]/10 px-4 py-3 font-mono text-xs text-[#C8FF2E]">
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          Confirmando pagamento junto à Stripe...
        </div>
      )}

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

      {!canPay && (
        <div className="border border-[#FF6B2C]/40 bg-[#FF6B2C]/10 px-4 py-3 font-mono text-xs text-[#FFB393]">
          Checkout Stripe indisponível no momento. Verifique as chaves STRIPE_SECRET_KEY ou contate o suporte.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleCheckout}
          className="lg:col-span-7 surface-card p-5 sm:p-6 space-y-5"
        >
          {/* Seletor de Forma de Pagamento */}
          <div>
            <div className="font-mono text-[11px] uppercase tracking-wider text-[#98A0AD] mb-2">
              1. Escolha a Forma de Pagamento
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {stripePixEnabled && (
                <button
                  type="button"
                  onClick={() => setMethod("PIX")}
                  className={`p-3.5 border text-left transition-colors cursor-pointer ${
                    method === "PIX"
                      ? "border-[#C8FF2E] bg-[#C8FF2E]/10 text-[#F4F5F6]"
                      : "border-[#232730] bg-[#0C0E12] text-[#98A0AD] hover:border-[#323845]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <QrCode className="h-4 w-4 text-[#C8FF2E]" />
                    <span className="font-mono text-[10px] uppercase text-[#10B981]">
                      Instantâneo
                    </span>
                  </div>
                  <div className="mt-2 font-semibold text-sm text-[#F4F5F6]">
                    Pix (Stripe)
                  </div>
                  <div className="text-[11px] text-[#98A0AD]">
                    QR Code + Copia e Cola
                  </div>
                </button>
              )}

              <button
                type="button"
                onClick={() => setMethod("CARD")}
                className={`p-3.5 border text-left transition-colors cursor-pointer ${
                  method === "CARD"
                    ? "border-[#C8FF2E] bg-[#C8FF2E]/10 text-[#F4F5F6]"
                    : "border-[#232730] bg-[#0C0E12] text-[#98A0AD] hover:border-[#323845]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <CreditCard className="h-4 w-4 text-[#FF6B2C]" />
                  <span className="font-mono text-[10px] uppercase text-[#C8FF2E]">
                    Global
                  </span>
                </div>
                <div className="mt-2 font-semibold text-sm text-[#F4F5F6]">
                  Cartão de Crédito
                </div>
                <div className="text-[11px] text-[#98A0AD]">
                  Visa, Master, Amex
                </div>
              </button>

              {stripePixEnabled && (
                <button
                  type="button"
                  onClick={() => setMethod("BOTH")}
                  className={`p-3.5 border text-left transition-colors cursor-pointer ${
                    method === "BOTH"
                      ? "border-[#C8FF2E] bg-[#C8FF2E]/10 text-[#F4F5F6]"
                      : "border-[#232730] bg-[#0C0E12] text-[#98A0AD] hover:border-[#323845]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Zap className="h-4 w-4 text-[#C8FF2E]" />
                    <span className="font-mono text-[10px] uppercase text-[#98A0AD]">
                      Flexível
                    </span>
                  </div>
                  <div className="mt-2 font-semibold text-sm text-[#F4F5F6]">
                    Pix ou Cartão
                  </div>
                  <div className="text-[11px] text-[#98A0AD]">
                    Escolha na tela Stripe
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Presets de valor */}
          <div>
            <div className="font-mono text-[11px] uppercase tracking-wider text-[#98A0AD] mb-2">
              2. Valores Rápidos (BRL)
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
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

          {/* Valor customizado */}
          <div>
            <label
              htmlFor="deposit-amount"
              className="block font-mono text-[11px] uppercase tracking-wider text-[#98A0AD] mb-1.5"
            >
              3. Valor da Recarga (R$)
            </label>
            <input
              id="deposit-amount"
              type="number"
              step="0.01"
              min={minAllowed}
              max={50000}
              required
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="input-terminal w-full h-12 px-4 font-mono text-lg font-bold"
            />
          </div>

          <button
            type="submit"
            disabled={creating || !canPay}
            className="btn-lime h-12 w-full inline-flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50"
          >
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Abrindo Checkout Stripe...
              </>
            ) : (
              <>
                {method === "PIX" ? (
                  <QrCode className="h-4 w-4" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                Pagar {formatBRL(amount)} via{" "}
                {method === "PIX"
                  ? "Pix (Stripe)"
                  : method === "CARD"
                    ? "Cartão (Stripe)"
                    : "Stripe (Pix / Cartão)"}
                <ArrowUpRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Informações de Segurança & Fluxo */}
        <div className="lg:col-span-5 surface-card p-5 sm:p-6 space-y-4">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold border-b border-[#232730] pb-3">
            Como funciona a recarga automática
          </h2>
          <ol className="space-y-3 text-sm text-[#98A0AD]">
            <li className="flex gap-3">
              <span className="font-mono text-xs text-[#C8FF2E] font-bold">01</span>
              <span>
                Escolha <strong className="text-[#F4F5F6]">Pix</strong> ou{" "}
                <strong className="text-[#F4F5F6]">Cartão de Crédito</strong> e o valor desejado.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-xs text-[#C8FF2E] font-bold">02</span>
              <span>
                Você será redirecionado ao checkout seguro oficial da{" "}
                <strong className="text-[#F4F5F6]">Stripe</strong> para finalizar o pagamento.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-xs text-[#C8FF2E] font-bold">03</span>
              <span>
                Assim que o pagamento é confirmado via webhook, seu saldo cai automaticamente em segundos — pronto para criar pedidos, assinaturas ou usar a API v2.
              </span>
            </li>
          </ol>

          <div className="border-t border-[#232730] pt-4 font-mono text-[11px] text-[#68707E] space-y-1">
            <div>• Sem taxas ocultas: o valor pago entra 100% em saldo.</div>
            <div>• Programa de afiliados credita comissão automaticamente.</div>
            <div>• Histórico completo com TXID disponível abaixo.</div>
          </div>
        </div>
      </div>

      {/* Histórico de Recargas */}
      <div className="surface-card overflow-hidden">
        <div className="border-b border-[#232730] bg-[#171A20] px-5 py-3.5 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-base font-bold">
            Histórico de Recargas
          </h2>
          <span className="font-mono text-xs text-[#98A0AD]">
            {deposits.length} registros
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#232730] bg-[#0C0E12] font-mono text-[11px] uppercase text-[#98A0AD]">
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">TXID</th>
                <th className="px-4 py-3">Método</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232730] text-sm">
              {deposits.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-[#68707E]"
                  >
                    Nenhuma recarga realizada ainda.
                  </td>
                </tr>
              ) : (
                deposits.map((d) => {
                  const meta = DEPOSIT_STATUS_META[d.status] ?? {
                    label: d.status,
                    tone: "zinc" as const,
                  };
                  return (
                    <tr key={d.id} className="hover:bg-[#15181E]">
                      <td className="px-4 py-3 font-mono text-xs text-[#98A0AD] whitespace-nowrap">
                        {formatDateBR(d.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#F4F5F6]">
                        {d.txid}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#98A0AD]">
                        {PAYMENT_METHOD_LABELS[d.method] || d.method}
                      </td>
                      <td className="px-4 py-3 font-mono text-sm font-bold text-[#C8FF2E]">
                        {formatBRL(d.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge label={meta.label} tone={meta.tone} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {d.status === "PENDING" && (
                          <div className="inline-flex items-center gap-2">
                            {d.checkoutUrl && (
                              <a
                                href={d.checkoutUrl}
                                className="btn-lime inline-flex h-8 items-center gap-1 px-2.5 font-mono text-[10px] uppercase"
                              >
                                Pagar
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                            {d.stripeSessionId && (
                              <button
                                type="button"
                                disabled={verifying}
                                onClick={() => handleCheckStatus(d.stripeSessionId!)}
                                className="btn-outline inline-flex h-8 items-center gap-1 px-2.5 font-mono text-[10px] uppercase cursor-pointer"
                              >
                                <RefreshCw className="h-3 w-3" />
                                Verificar
                              </button>
                            )}
                          </div>
                        )}
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
