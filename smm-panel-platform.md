# FollowMe | Dual-Market Social Growth Platform (US USD & Brazil BRL)

## Overview
Plataforma web full-stack **FollowMe** (100% whitelabel no Admin), construída com **Next.js 15 + TypeScript + Tailwind CSS v4 + Prisma + PostgreSQL (Neon São Paulo)** e deploy em produção no **NexaCloud** (`https://followme.nexaclouds.online`).

## Recursos Implementados
- [x] **Auto-detecção de Idioma & Preços Nativos por Mercado (EUA vs. Brasil):**
  - Detecção automática via cabeçalho `Accept-Language` do navegador (computadores em inglês recebem interface EN-US + preços nativos dos EUA em USD `rateUsd`; computadores em português recebem PT-BR + preços nativos do Brasil em BRL `rate`).
  - Preços em USD são nativos de mercado (benchmark Buzzoid/Twicsy/SocialWick/SidesMedia), não conversão de câmbio.
- [x] **Landing Page de Alta Conversão & Motion Cutting Edge:**
  - Hero com vídeo ambiente em loop suave (`/media/hero-loop.mp4` + poster `/media/hero-creator.jpg`), hook direto de dor do cliente e CTAs acima da dobra.
  - Seletor interativo claro por **Rede (Instagram · TikTok · YouTube) → Métrica (Seguidores · Curtidas · Views · Comentários) → Nível → Pacotes prontos**.
  - Seção de dores reais com fotos editoriais exclusivas + vídeos em loop, efeitos de cursor spotlight, odômetros animados e reveal em scroll (respeitando `prefers-reduced-motion`).
  - Diretório de preços separado por plataforma + fluxo de 3 passos + FAQ accordion estruturado.
- [x] **SEO & GEO Internacional (EUA + Brasil):**
  - Páginas rastreáveis nativas `/en`, `/pt`, `/instagram`, `/tiktok`, `/youtube`, `/en/instagram`, `/en/tiktok`, `/en/youtube`, `/pt/instagram`, `/pt/tiktok`, `/pt/youtube`.
  - `sitemap.xml` com `hreflang` (`en-US`, `pt-BR`), `robots.txt` liberado para motores tradicionais e de IA (`Googlebot`, `GPTBot`, `OAI-SearchBot`, `ClaudeBot`, `PerplexityBot`), e JSON-LD (`Organization`, `WebSite`, `Service`, `FAQPage`, `BreadcrumbList`).
- [x] **Pagamentos Reais Multi-Moeda via Stripe:**
  - Checkout oficial Stripe em **USD** (Cartão / Apple Pay / Google Pay) para o mercado americano e em **BRL** (**Pix instantâneo + Cartão**) para o Brasil.
  - Webhook oficial `POST /api/deposits/stripe/webhook` com validação HMAC-SHA256, isolamento multi-app (`metadata.app = "followme"`) e conversão contábil segura para o ledger interno.
- [x] **Painel do Cliente & Admin Completo (`/painel/*`, `/admin`, `/api/v2`):**
  - Novo Pedido, Pedido em Massa, Assinaturas, Catálogo com Favoritos, Histórico com Refill/Cancel, Afiliados, Painel Filho White-Label, Parcerias, Tickets e API Pública v2.
  - Modo `ADMIN` gratuito ilimitado + auto-papel via `ADMIN_EMAILS`.
  - **Importação Seletiva de Fornecedores Globais (`/admin`):** presets para MoreThanPanel, Peakerr, SMMHeaven, SMMFollows, JustAnotherPanel e FonteSMM com busca ao vivo e escolha exata dos IDs a importar já com preços BR + EUA.

## Verification Checklist
- [x] Unit tests (`npm test`) — 10/10 passing
- [x] Type check (`npx tsc --noEmit`) — clean
- [x] Lint (`npm run lint`) — clean (0 warnings, 0 errors)
- [x] Production build (`npm run build`) — clean
- [x] PostgreSQL schema push & US/BR market backfill
- [x] Zero em-dashes & full Pre-Flight design audit
