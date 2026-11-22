"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, KeyRound, UserPlus } from "lucide-react";

interface AuthFormProps {
  initialTab: "login" | "register";
  initialRef?: string;
  redirectService?: string;
  redirectQty?: string;
  locale?: "pt" | "en" | "es";
}

export function AuthForm({
  initialTab,
  initialRef = "",
  redirectService = "",
  redirectQty = "",
  locale = "en",
}: AuthFormProps) {
  const isPt = locale === "pt";
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

  const destination = (() => {
    const qs = new URLSearchParams();
    if (redirectService) qs.set("service", redirectService);
    if (redirectQty) qs.set("qty", redirectQty);
    const str = qs.toString();
    return str ? `/painel?${str}` : "/painel";
  })();

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
          {isPt ? "Entrar" : "Sign in"}
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
          {isPt ? "Criar Conta" : "Sign up"}
        </button>
      </div>

      <div className="p-6 sm:p-7">
        {tab === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-[#98A0AD] mb-1.5">
                {isPt ? "E-mail ou Usuário" : "Email or Username"}
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={isPt ? "seu@email.com ou @usuario" : "you@email.com or username"}
                className="input-terminal w-full h-11 px-3 text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-mono text-[11px] uppercase tracking-wider text-[#98A0AD]">
                  {isPt ? "Senha" : "Password"}
                </label>
                <Link
                  href="/esqueci-senha"
                  className="font-mono text-[11px] text-[#C8FF2E] hover:underline"
                >
                  {isPt ? "Esqueceu sua senha?" : "Forgot password?"}
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
              {loading
                ? isPt
                  ? "Entrando..."
                  : "Signing in..."
                : isPt
                  ? "Acessar Painel"
                  : "Open Dashboard"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-[#98A0AD] mb-1">
                {isPt ? "Nome Completo" : "Full Name"}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isPt ? "Seu nome ou agência" : "Your name or brand"}
                className="input-terminal w-full h-10 px-3 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-[#98A0AD] mb-1">
                  {isPt ? "Usuário" : "Username"}
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={isPt ? "minhaagencia" : "yourhandle"}
                  className="input-terminal w-full h-10 px-3 text-sm"
                />
              </div>
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-[#98A0AD] mb-1">
                  {isPt ? "WhatsApp (opcional)" : "Phone / WhatsApp (optional)"}
                </label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder={isPt ? "11999999999" : "+1 555 010 2020"}
                  className="input-terminal w-full h-10 px-3 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-[#98A0AD] mb-1">
                {isPt ? "E-mail" : "Email"}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isPt ? "contato@suaagencia.com" : "you@brand.com"}
                className="input-terminal w-full h-10 px-3 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-[#98A0AD] mb-1">
                  {isPt ? "Senha (mín. 6)" : "Password (min 6)"}
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
                  {isPt ? "Código Indicação" : "Referral Code"}
                </label>
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  placeholder={isPt ? "Opcional" : "Optional"}
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
              {loading
                ? isPt
                  ? "Criando Conta..."
                  : "Creating Account..."
                : isPt
                  ? "Criar Conta Grátis"
                  : "Create Free Account"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
