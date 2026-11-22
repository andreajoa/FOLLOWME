"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Layers, Send, ShieldAlert } from "lucide-react";
import { parseMassOrderText } from "@/lib/pricing";
import { formatBRL } from "@/lib/format";

interface MassOrderClientProps {
  serviceRates: Record<number, { name: string; rate: number }>;
  sampleServiceId: number;
}

export function MassOrderClient({
  serviceRates,
  sampleServiceId,
}: MassOrderClientProps) {
  const router = useRouter();
  const [lines, setLines] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    createdCount: number;
    failedCount: number;
    created: Array<{ lineNumber: number; orderId: number; charge: number }>;
    failed: Array<{ lineNumber: number; reason: string }>;
  } | null>(null);
  const [error, setError] = useState("");

  const preview = useMemo(() => {
    const parsed = parseMassOrderText(lines);
    let estimatedTotal = 0;
    for (const item of parsed.valid) {
      const s = serviceRates[item.serviceId];
      if (s) {
        estimatedTotal += (item.quantity / 1000) * s.rate;
      }
    }
    return { ...parsed, estimatedTotal };
  }, [lines, serviceRates]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders/mass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Falha ao enviar lote.");
        return;
      }
      setResult(data);
      if (data.createdCount > 0 && data.failedCount === 0) {
        setLines("");
      }
      router.refresh();
    } catch {
      setError("Erro de rede.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <span className="font-mono text-xs uppercase tracking-widest text-[#C8FF2E]">
          Alta Produtividade para Agências
        </span>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold">
          Pedido em Massa
        </h1>
        <p className="mt-1 text-sm text-[#98A0AD]">
          Envie até 50 pedidos de uma única vez usando 1 linha por pedido no
          formato padrão SMM.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-8 surface-card p-5 sm:p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <label
              htmlFor="mass-textarea"
              className="font-mono text-xs uppercase tracking-wider text-[#98A0AD]"
            >
              Formato: service_id | link | quantidade
            </label>
            <button
              type="button"
              onClick={() =>
                setLines(
                  `${sampleServiceId} | https://instagram.com/cliente_alpha | 250\n${sampleServiceId} | https://instagram.com/cliente_beta | 500`
                )
              }
              className="font-mono text-[11px] uppercase text-[#C8FF2E] hover:underline cursor-pointer"
            >
              Inserir exemplo
            </button>
          </div>

          <textarea
            id="mass-textarea"
            rows={10}
            value={lines}
            onChange={(e) => setLines(e.target.value)}
            placeholder={`${sampleServiceId} | https://instagram.com/perfil1 | 500\n${sampleServiceId} | https://instagram.com/perfil2 | 1000`}
            className="input-terminal w-full p-4 font-mono text-xs leading-6"
          />

          <div className="grid grid-cols-3 gap-3 border border-[#232730] bg-[#0C0E12] p-3.5 font-mono text-xs">
            <div>
              <span className="text-[#68707E]">LINHAS VÁLIDAS</span>
              <div className="mt-0.5 text-base font-bold text-[#34D399]">
                {preview.valid.length}
              </div>
            </div>
            <div>
              <span className="text-[#68707E]">ERROS DE SINTAXE</span>
              <div className="mt-0.5 text-base font-bold text-[#FF8A58]">
                {preview.errors.length}
              </div>
            </div>
            <div>
              <span className="text-[#68707E]">TOTAL ESTIMADO</span>
              <div className="mt-0.5 text-base font-bold text-[#C8FF2E]">
                {formatBRL(preview.estimatedTotal, true)}
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 border border-[#EF4444]/40 bg-[#EF4444]/10 p-3 text-xs text-[#F87171]">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || preview.valid.length === 0}
            className="btn-lime h-12 w-full inline-flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-wider cursor-pointer"
          >
            <Send className="h-4 w-4" />
            {submitting
              ? "Disparando Lote..."
              : `Enviar ${preview.valid.length} Pedido(s) em Massa`}
          </button>

          {result && (
            <div className="border border-[#323845] bg-[#0C0E12] p-4 space-y-3 font-mono text-xs">
              <div className="flex items-center gap-2 text-[#34D399] font-bold">
                <CheckCircle2 className="h-4 w-4" />
                Concluído: {result.createdCount} criado(s), {result.failedCount} com erro.
              </div>
              {result.created.length > 0 && (
                <div className="space-y-1 text-[#D2D7E0]">
                  {result.created.map((c) => (
                    <div key={c.orderId}>
                      Linha {c.lineNumber}: Pedido #{c.orderId} ({formatBRL(c.charge, true)})
                    </div>
                  ))}
                </div>
              )}
              {result.failed.length > 0 && (
                <div className="space-y-1 text-[#F87171]">
                  {result.failed.map((f, i) => (
                    <div key={i}>
                      Linha {f.lineNumber}: {f.reason}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </form>

        <aside className="lg:col-span-4 surface-elevated p-5 space-y-4">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#FF6B2C]">
            <Layers className="h-4 w-4" />
            Regras de Envio em Lote
          </div>
          <ul className="space-y-2.5 text-sm text-[#98A0AD] leading-relaxed">
            <li>• Separe as colunas com barra vertical <code className="font-mono text-[#C8FF2E]">|</code> ou ponto e vírgula <code className="font-mono text-[#C8FF2E]">;</code>.</li>
            <li>• Consulte os IDs numéricos exatos na aba <strong className="text-[#F4F5F6]">Serviços</strong>.</li>
            <li>• Cada linha é validada e debitada individualmente — se uma linha falhar, as demais continuam normalmente.</li>
            <li>• Limite de 50 linhas por lote para processamento instantâneo.</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
