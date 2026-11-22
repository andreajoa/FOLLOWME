"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Lock,
  RefreshCw,
  SlidersHorizontal,
  Zap,
} from "lucide-react";
import { formatBRL, formatInt } from "@/lib/format";

export interface PublicServiceItem {
  id: number;
  name: string;
  categoryName: string;
  network: string;
  rate: number;
  min: number;
  max: number;
  averageTime: string;
  refill: boolean;
  refillDays: number;
  dripfeed: boolean;
}

interface LandingInteractiveProps {
  services: PublicServiceItem[];
  isLoggedIn: boolean;
}

export function LandingInteractive({
  services,
  isLoggedIn,
}: LandingInteractiveProps) {
  const router = useRouter();
  const [selectedServiceId, setSelectedServiceId] = useState<number>(
    services[0]?.id ?? 0
  );
  const [quantity, setQuantity] = useState<number>(1000);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const selectedService = useMemo(
    () => services.find((s) => s.id === selectedServiceId) ?? services[0],
    [services, selectedServiceId]
  );

  const estimatedPrice = useMemo(() => {
    if (!selectedService) return 0;
    const clamped = Math.max(selectedService.min, Math.min(selectedService.max, quantity || 0));
    return (clamped / 1000) * selectedService.rate;
  }, [selectedService, quantity]);

  async function handleQuickLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoggingIn(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || "Falha ao entrar.");
        return;
      }
      router.push(data.user?.role === "ADMIN" ? "/admin" : "/painel");
      router.refresh();
    } catch {
      setLoginError("Erro de conexão.");
    } finally {
      setLoggingIn(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-stretch">
      {/* Calculadora Real de Pedidos (7 cols) */}
      <div className="lg:col-span-7 surface-card p-6 sm:p-7 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-[#232730] pb-4 mb-5">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-[#C8FF2E]" />
              <span className="font-mono text-xs uppercase tracking-widest text-[#C8FF2E]">
                Simulador ao Vivo de Pedido
              </span>
            </div>
            <span className="font-mono text-[11px] text-[#98A0AD]">
              PREÇOS REAIS DO CATÁLOGO
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="sim-service"
                className="block font-mono text-[11px] uppercase tracking-wider text-[#98A0AD] mb-1.5"
              >
                Serviço em Destaque
              </label>
              <select
                id="sim-service"
                value={selectedService?.id ?? ""}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setSelectedServiceId(id);
                  const found = services.find((s) => s.id === id);
                  if (found) {
                    setQuantity(Math.max(found.min, Math.min(1000, found.max)));
                  }
                }}
                className="input-terminal w-full h-11 px-3 text-sm"
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    #{s.id} — {s.name} ({formatBRL(s.rate)}/1k)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="sim-qty"
                  className="block font-mono text-[11px] uppercase tracking-wider text-[#98A0AD] mb-1.5"
                >
                  Quantidade ({selectedService ? `${formatInt(selectedService.min)} – ${formatInt(selectedService.max)}` : ""})
                </label>
                <input
                  id="sim-qty"
                  type="number"
                  min={selectedService?.min ?? 10}
                  max={selectedService?.max ?? 100000}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="input-terminal w-full h-11 px-3 font-mono text-sm"
                />
              </div>

              <div className="bg-[#0C0E12] border border-[#232730] px-4 py-2.5 flex flex-col justify-center">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#98A0AD]">
                  Valor Total Estimado
                </span>
                <span className="font-mono text-2xl font-bold text-[#C8FF2E]">
                  {formatBRL(estimatedPrice, true)}
                </span>
              </div>
            </div>

            {selectedService && (
              <div className="flex flex-wrap items-center gap-3 pt-1 font-mono text-xs text-[#98A0AD]">
                <span className="inline-flex items-center gap-1.5 border border-[#232730] bg-[#0C0E12] px-2.5 py-1">
                  <Clock className="h-3.5 w-3.5 text-[#C8FF2E]" />
                  Tempo médio: {selectedService.averageTime}
                </span>
                {selectedService.refill && (
                  <span className="inline-flex items-center gap-1.5 border border-[#10B981]/40 bg-[#10B981]/10 text-[#34D399] px-2.5 py-1">
                    <RefreshCw className="h-3.5 w-3.5" />
                    Reposição {selectedService.refillDays}D
                  </span>
                )}
                {selectedService.dripfeed && (
                  <span className="inline-flex items-center gap-1.5 border border-[#FF6B2C]/40 bg-[#FF6B2C]/10 text-[#FF8A58] px-2.5 py-1">
                    <Zap className="h-3.5 w-3.5" />
                    Drip-Feed ativo
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-5 border-t border-[#232730]">
          <Link
            href={
              isLoggedIn
                ? `/painel?service=${selectedService?.id ?? ""}`
                : `/login?tab=register&service=${selectedService?.id ?? ""}`
            }
            className="btn-lime inline-flex h-12 flex-1 items-center justify-center gap-2 px-5 text-xs font-mono uppercase tracking-wider"
          >
            {isLoggedIn ? "Enviar Este Pedido Agora" : "Criar Conta e Enviar Pedido"}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/servicos"
            className="btn-outline inline-flex h-12 items-center justify-center px-5 text-xs font-mono uppercase tracking-wider"
          >
            Ver Tabela Completa
          </Link>
        </div>
      </div>

      {/* Acesso Rápido / Login Direto no Estilo FonteSMM (5 cols) */}
      <div className="lg:col-span-5 surface-elevated p-6 sm:p-7 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-[#232730] pb-4 mb-5">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-[#FF6B2C]" />
              <span className="font-mono text-xs uppercase tracking-widest text-[#F4F5F6]">
                Acesso Rápido ao Painel
              </span>
            </div>
            <span className="font-mono text-[10px] text-[#10B981]">
              ● ONLINE 24/7
            </span>
          </div>

          {isLoggedIn ? (
            <div className="space-y-4 py-4">
              <p className="text-sm text-[#98A0AD] leading-relaxed">
                Sua sessão está ativa. Acesse seu painel para disparar novos
                pedidos, enviar lotes em massa ou recarregar saldo via Pix.
              </p>
              <Link
                href="/painel"
                className="btn-lime inline-flex h-12 w-full items-center justify-center gap-2 text-xs font-mono uppercase tracking-wider"
              >
                Abrir Meu Painel
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleQuickLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="quick-id"
                  className="block font-mono text-[11px] uppercase tracking-wider text-[#98A0AD] mb-1.5"
                >
                  Usuário ou E-mail
                </label>
                <input
                  id="quick-id"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="seu@email.com ou usuario"
                  className="input-terminal w-full h-11 px-3 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="quick-pass"
                  className="block font-mono text-[11px] uppercase tracking-wider text-[#98A0AD] mb-1.5"
                >
                  Senha
                </label>
                <input
                  id="quick-pass"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-terminal w-full h-11 px-3 text-sm"
                />
              </div>

              {loginError && (
                <p className="border border-[#EF4444]/40 bg-[#EF4444]/10 px-3 py-2 text-xs text-[#F87171]">
                  {loginError}
                </p>
              )}

              <button
                type="submit"
                disabled={loggingIn}
                className="btn-lime h-12 w-full text-xs font-mono uppercase tracking-wider cursor-pointer"
              >
                {loggingIn ? "Autenticando..." : "Entrar no Painel"}
              </button>
            </form>
          )}
        </div>

        <div className="mt-5 border-t border-[#232730] pt-4 flex flex-col gap-2 text-xs text-[#98A0AD]">
          <div className="flex items-center justify-between">
            <span>Ainda não tem conta?</span>
            <Link
              href="/login?tab=register"
              className="font-mono uppercase text-[#C8FF2E] hover:underline"
            >
              Cadastrar grátis →
            </Link>
          </div>
          <p className="font-mono text-[11px] text-[#68707E]">
            Demo local: demo@velosmm.com.br / Demo@123
          </p>
        </div>
      </div>
    </div>
  );
}
