"use client";

import { useState } from "react";
import { CheckCircle2, Handshake, Send, ShieldAlert } from "lucide-react";
import { COOPERATION_STATUS_META, formatDateBR } from "@/lib/format";
import { StatusBadge } from "./status-badge";

export interface CooperationRow {
  id: number;
  name: string;
  email: string;
  type: string;
  monthlyVolume: string | null;
  status: string;
  adminNote: string | null;
  createdAt: string;
}

const TYPES = [
  { value: "RESELLER", label: "Revendedor / Painel SMM (Volume VIP)" },
  { value: "AGENCY", label: "Agência de Marketing / Gestor de Tráfego" },
  { value: "SUPPLIER", label: "Fornecedor Direto de Serviços SMM" },
  { value: "INFLUENCER", label: "Influenciador / Parceiro de Divulgação" },
];

export function CooperationClient({
  brandName,
  defaultName = "",
  defaultEmail = "",
  defaultWhatsapp = "",
  initialRequests = [],
  showHistory = false,
}: {
  brandName: string;
  defaultName?: string;
  defaultEmail?: string;
  defaultWhatsapp?: string;
  initialRequests?: CooperationRow[];
  showHistory?: boolean;
}) {
  const [requests, setRequests] = useState(initialRequests);
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [whatsapp, setWhatsapp] = useState(defaultWhatsapp);
  const [type, setType] = useState("RESELLER");
  const [monthlyVolume, setMonthlyVolume] = useState("");
  const [website, setWebsite] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/cooperation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          whatsapp,
          type,
          monthlyVolume,
          website,
          message,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Não foi possível enviar proposta.");
        return;
      }
      setRequests((prev) => [
        {
          ...data.request,
          createdAt: data.request.createdAt || new Date().toISOString(),
        },
        ...prev,
      ]);
      setMessage("");
      setSuccess(
        `Proposta #${data.request.id} enviada! Nossa equipe comercial da ${brandName} responderá em breve.`
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <span className="font-mono text-xs uppercase tracking-widest text-[#C8FF2E]">
          Cooperation • Revenda VIP &amp; Fornecedores
        </span>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold">
          Programa de Parcerias {brandName}
        </h1>
        <p className="mt-1 text-sm text-[#98A0AD]">
          Tem alto volume mensal, opera uma agência, é fornecedor direto de redes sociais ou quer tarifas personalizadas na API v2? Fale com nosso time comercial.
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
          onSubmit={handleSubmit}
          className="lg:col-span-7 surface-card p-5 sm:p-6 space-y-4"
        >
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold border-b border-[#232730] pb-3 flex items-center gap-2">
            <Handshake className="h-5 w-5 text-[#C8FF2E]" />
            Enviar Proposta de Parceria
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-[11px] uppercase text-[#98A0AD] mb-1">
                Nome / Empresa
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-terminal w-full h-10 px-3 text-sm"
              />
            </div>

            <div>
              <label className="block font-mono text-[11px] uppercase text-[#98A0AD] mb-1">
                E-mail Comercial
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-terminal w-full h-10 px-3 text-sm"
              />
            </div>

            <div>
              <label className="block font-mono text-[11px] uppercase text-[#98A0AD] mb-1">
                WhatsApp / Telegram
              </label>
              <input
                type="text"
                placeholder="5511999999999"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="input-terminal w-full h-10 px-3 text-sm"
              />
            </div>

            <div>
              <label className="block font-mono text-[11px] uppercase text-[#98A0AD] mb-1">
                Tipo de Parceria
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="input-terminal w-full h-10 px-3 text-sm"
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value} className="bg-[#111317]">
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-mono text-[11px] uppercase text-[#98A0AD] mb-1">
                Volume Mensal Estimado
              </label>
              <input
                type="text"
                placeholder="ex: R$ 5.000 - R$ 30.000/mês"
                value={monthlyVolume}
                onChange={(e) => setMonthlyVolume(e.target.value)}
                className="input-terminal w-full h-10 px-3 text-sm"
              />
            </div>

            <div>
              <label className="block font-mono text-[11px] uppercase text-[#98A0AD] mb-1">
                Site / Painel / @Perfil (opcional)
              </label>
              <input
                type="text"
                placeholder="https://..."
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="input-terminal w-full h-10 px-3 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-[11px] uppercase text-[#98A0AD] mb-1">
              Detalhes da Proposta
            </label>
            <textarea
              required
              minLength={10}
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Conte quais serviços você precisa (ou fornece), volume esperado e o que busca na parceria..."
              className="input-terminal w-full p-3 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-lime h-11 px-6 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider cursor-pointer"
          >
            <Send className="h-4 w-4" />
            {submitting ? "Enviando..." : "Enviar Solicitação"}
          </button>
        </form>

        <div className="lg:col-span-5 surface-card p-5 sm:p-6 space-y-4">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold border-b border-[#232730] pb-3">
            Vantagens para Parceiros
          </h2>
          <ul className="space-y-2.5 text-sm text-[#98A0AD]">
            <li>• Tabela de preços diferenciada para grandes volumes via API v2.</li>
            <li>• Integração prioritária para fornecedores diretos de serviços BR e mundiais.</li>
            <li>• Suporte dedicado para agências e donos de Painel Filho.</li>
            <li>• Comissões recorrentes especiais para influenciadores e afiliados top.</li>
          </ul>
        </div>
      </div>

      {showHistory && requests.length > 0 && (
        <div className="surface-card overflow-hidden">
          <div className="border-b border-[#232730] bg-[#171A20] px-5 py-3.5">
            <h2 className="font-[family-name:var(--font-display)] text-base font-bold">
              Minhas Solicitações
            </h2>
          </div>
          <div className="divide-y divide-[#232730]">
            {requests.map((r) => {
              const meta = COOPERATION_STATUS_META[r.status] ?? {
                label: r.status,
                tone: "amber" as const,
              };
              return (
                <div key={r.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="font-mono text-xs text-[#F4F5F6]">
                      #{r.id} • {r.type} {r.monthlyVolume ? `(${r.monthlyVolume})` : ""}
                    </div>
                    <div className="text-xs text-[#68707E]">
                      {formatDateBR(r.createdAt)}
                      {r.adminNote ? ` — Retorno: ${r.adminNote}` : ""}
                    </div>
                  </div>
                  <StatusBadge label={meta.label} tone={meta.tone} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
