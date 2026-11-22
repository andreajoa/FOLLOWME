"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, KeyRound, UserPlus } from "lucide-react";

interface AuthFormProps {
  initialTab: "login" | "register";
  initialRef?: string;
  redirectService?: string;
}

export function AuthForm({
  initialTab,
  initialRef = "",
  redirectService = "",
}: AuthFormProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">(initialTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Login
  const [identifier, setIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState(initialRef);

  const destination = redirectService
    ? `/painel?service=${encodeURIComponent(redirectService)}`
    : "/painel";

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Falha ao entrar.");
        return;
      }
      router.push(data.user?.role === "ADMIN" ? "/admin" : destination);
      router.refresh();
    } catch {
      setError("Erro de rede ao conectar.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          username,
          email,
          whatsapp,
          password,
          referralCode: referralCode || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Não foi possível cadastrar.");
        return;
      }
      router.push(destination);
      router.refresh();
    } catch {
      setError("Erro de rede ao cadastrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md border border-[#323845] bg-[#111317]">
      <div className="grid grid-cols-2 border-b border-[#232730]">
        <button
          type="button"
          onClick={() => {
            setTab("login");
            setError("");
          }}
          className={`flex h-12 items-center justify-center gap-2 font-mono text-xs uppercase tracking-wider cursor-pointer transition-colors ${
            tab === "login"
              ? "bg-[#C8FF2E] text-[#090A0C] font-bold"
              : "bg-[#0C0E12] text-[#98A0AD] hover:text-[#F4F5F6]"
          }`}
        >
          <KeyRound className="h-3.5 w-3.5" />
          Entrar
        </button>
        <button
          type="button"
          onClick={() => {
            setTab("register");
            setError("");
          }}
          className={`flex h-12 items-center justify-center gap-2 font-mono text-xs uppercase tracking-wider cursor-pointer transition-colors ${
            tab === "register"
              ? "bg-[#C8FF2E] text-[#090A0C] font-bold"
              : "bg-[#0C0E12] text-[#98A0AD] hover:text-[#F4F5F6]"
          }`}
        >
          <UserPlus className="h-3.5 w-3.5" />
          Criar Conta
        </button>
      </div>

      <div className="p-6 sm:p-7">
        {tab === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-[#98A0AD] mb-1.5">
                E-mail ou Usuário
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="seu@email.com ou @usuario"
                className="input-terminal w-full h-11 px-3 text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-mono text-[11px] uppercase tracking-wider text-[#98A0AD]">
                  Senha
                </label>
                <Link
                  href="/esqueci-senha"
                  className="font-mono text-[11px] text-[#C8FF2E] hover:underline"
                >
                  Esqueceu sua senha?
                </Link>
              </div>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="input-terminal w-full h-11 px-3 text-sm"
              />
            </div>

            {error && (
              <p className="border border-[#EF4444]/40 bg-[#EF4444]/10 px-3 py-2 text-xs text-[#F87171]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-lime h-12 w-full inline-flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-wider cursor-pointer"
            >
              {loading ? "Entrando..." : "Acessar Painel"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-[#98A0AD] mb-1">
                Nome Completo
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome ou agência"
                className="input-terminal w-full h-10 px-3 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-[#98A0AD] mb-1">
                  Usuário
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="minhaagencia"
                  className="input-terminal w-full h-10 px-3 text-sm"
                />
              </div>
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-[#98A0AD] mb-1">
                  WhatsApp (opcional)
                </label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="11999999999"
                  className="input-terminal w-full h-10 px-3 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-[#98A0AD] mb-1">
                E-mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contato@suaagencia.com"
                className="input-terminal w-full h-10 px-3 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-[#98A0AD] mb-1">
                  Senha (mín. 6)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-terminal w-full h-10 px-3 text-sm"
                />
              </div>
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-[#98A0AD] mb-1">
                  Código Indicação
                </label>
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  placeholder="Opcional"
                  className="input-terminal w-full h-10 px-3 font-mono text-sm uppercase"
                />
              </div>
            </div>

            {error && (
              <p className="border border-[#EF4444]/40 bg-[#EF4444]/10 px-3 py-2 text-xs text-[#F87171]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-lime h-12 w-full inline-flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-wider cursor-pointer"
            >
              {loading ? "Criando Conta..." : "Criar Conta Grátis"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
