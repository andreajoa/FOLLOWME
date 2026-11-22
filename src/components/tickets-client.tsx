"use client";

import { useState } from "react";
import { MessageSquare, Plus, Send } from "lucide-react";
import { formatDateBR, TICKET_STATUS_META } from "@/lib/format";
import { StatusBadge } from "./status-badge";

export interface TicketThread {
  id: number;
  subject: string;
  orderId: number | null;
  status: string;
  updatedAt: string;
  messages: Array<{
    id: string;
    isAdmin: boolean;
    body: string;
    createdAt: string;
    sender: { name: string; username: string };
  }>;
}

const SUBJECT_OPTIONS = [
  "Dúvida sobre Pedido",
  "Solicitar Reposição / Queda",
  "Pagamento Pix / Saldo",
  "Integração API v2",
  "Outro Assunto",
];

export function TicketsClient({
  initialTickets,
}: {
  initialTickets: TicketThread[];
}) {
  const [tickets, setTickets] = useState(initialTickets);
  const [selectedId, setSelectedId] = useState<number | null>(
    initialTickets[0]?.id ?? null
  );
  const [subject, setSubject] = useState(SUBJECT_OPTIONS[0]);
  const [orderId, setOrderId] = useState("");
  const [message, setMessage] = useState("");
  const [replyText, setReplyText] = useState("");
  const [creating, setCreating] = useState(false);
  const [replying, setReplying] = useState(false);
  const [error, setError] = useState("");

  const activeTicket = tickets.find((t) => t.id === selectedId) ?? null;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          orderId: orderId ? Number(orderId) : null,
          message,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Não foi possível abrir o ticket.");
        return;
      }
      const created: TicketThread = data.ticket;
      setTickets((prev) => [created, ...prev]);
      setSelectedId(created.id);
      setOrderId("");
      setMessage("");
    } finally {
      setCreating(false);
    }
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!activeTicket || !replyText.trim()) return;
    setReplying(true);
    try {
      const res = await fetch(`/api/tickets/${activeTicket.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: replyText }),
      });
      const data = await res.json();
      if (res.ok) {
        setTickets((prev) =>
          prev.map((t) =>
            t.id === activeTicket.id
              ? {
                  ...t,
                  status: data.status,
                  messages: [...t.messages, data.message],
                }
              : t
          )
        );
        setReplyText("");
      }
    } finally {
      setReplying(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <span className="font-mono text-xs uppercase tracking-widest text-[#C8FF2E]">
          Atendimento Direto
        </span>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold">
          Tickets de Suporte
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Abrir novo ticket */}
        <form
          onSubmit={handleCreate}
          className="lg:col-span-5 surface-card p-5 space-y-4"
        >
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#C8FF2E] border-b border-[#232730] pb-3">
            <Plus className="h-4 w-4" />
            Abrir Novo Ticket
          </div>

          <div>
            <label className="block font-mono text-[11px] uppercase text-[#98A0AD] mb-1">
              Assunto
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="input-terminal w-full h-10 px-3 text-sm"
            >
              {SUBJECT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-mono text-[11px] uppercase text-[#98A0AD] mb-1">
              ID do Pedido (opcional)
            </label>
            <input
              type="number"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Ex: 1001"
              className="input-terminal w-full h-10 px-3 font-mono text-sm"
            />
          </div>

          <div>
            <label className="block font-mono text-[11px] uppercase text-[#98A0AD] mb-1">
              Mensagem
            </label>
            <textarea
              rows={4}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Descreva sua dúvida ou solicitação..."
              className="input-terminal w-full p-3 text-sm"
            />
          </div>

          {error && (
            <p className="border border-[#EF4444]/40 bg-[#EF4444]/10 p-2.5 text-xs text-[#F87171]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={creating}
            className="btn-lime h-11 w-full font-mono text-xs uppercase tracking-wider cursor-pointer"
          >
            {creating ? "Enviando..." : "Enviar Ticket"}
          </button>
        </form>

        {/* Lista + Chat */}
        <div className="lg:col-span-7 space-y-4">
          <div className="border border-[#232730] bg-[#111317] divide-y divide-[#232730]">
            {tickets.length === 0 ? (
              <div className="p-8 text-center font-mono text-xs text-[#98A0AD]">
                Você ainda não abriu nenhum ticket.
              </div>
            ) : (
              tickets.map((t) => {
                const meta = TICKET_STATUS_META[t.status] ?? {
                  label: t.status,
                  tone: "zinc" as const,
                };
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedId(t.id)}
                    className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                      selectedId === t.id ? "bg-[#171A20]" : "hover:bg-[#14171D]"
                    }`}
                  >
                    <div>
                      <div className="font-mono text-xs text-[#C8FF2E]">
                        Ticket #{t.id}
                        {t.orderId ? ` • Pedido #${t.orderId}` : ""}
                      </div>
                      <div className="text-sm font-semibold text-[#F4F5F6]">
                        {t.subject}
                      </div>
                    </div>
                    <StatusBadge label={meta.label} tone={meta.tone} />
                  </button>
                );
              })
            )}
          </div>

          {activeTicket && (
            <div className="surface-elevated p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#232730] pb-3">
                <div className="flex items-center gap-2 font-mono text-xs text-[#F4F5F6]">
                  <MessageSquare className="h-4 w-4 text-[#C8FF2E]" />
                  #{activeTicket.id} — {activeTicket.subject}
                </div>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {activeTicket.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3.5 border text-sm ${
                      m.isAdmin
                        ? "border-[#C8FF2E]/40 bg-[#C8FF2E]/5 ml-4"
                        : "border-[#232730] bg-[#0C0E12] mr-4"
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-[10px] text-[#98A0AD] mb-1.5">
                      <span className={m.isAdmin ? "text-[#C8FF2E] font-bold" : ""}>
                        {m.isAdmin ? "SUPORTE OFICIAL" : `@${m.sender.username}`}
                      </span>
                      <span>{formatDateBR(m.createdAt)}</span>
                    </div>
                    <p className="text-[#D2D7E0] whitespace-pre-wrap">{m.body}</p>
                  </div>
                ))}
              </div>

              {activeTicket.status !== "CLOSED" && (
                <form onSubmit={handleReply} className="flex gap-2 pt-2 border-t border-[#232730]">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Escreva uma resposta..."
                    className="input-terminal flex-1 h-10 px-3 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={replying}
                    className="btn-lime h-10 px-4 inline-flex items-center gap-1.5 font-mono text-xs uppercase cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Enviar
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
