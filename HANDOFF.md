# Handoff: Bingo Fácil — Migração Firebase → Turso

**Sessão Grok:** `019eb2d3-4630-7fe0-9bb3-c0e3af5f8ad4`  
**Data:** 2026-06-10  
**Projeto:** `/Users/matheuspuppe/Desktop/Projetos/bingo-facil-turso` (repo novo — migrado de `bingo-facil`)  
**Branch:** `main` (commit `81ef6dd`)  
**Modelo:** `grok-composer-2.5-fast`  
**Status:** Migração funcional completa — polish operacional pendente

---

## 1. Objetivo

Migrar o **Bingo Fácil** de Firebase (Auth + Firestore) para uma stack self-hosted com **Turso/libSQL + Drizzle ORM + Better Auth**, mantendo o fluxo completo do organizador: signup → criar evento → vender cartelas → sorteio ao vivo.

---

## 2. Contexto essencial

### Stack atual

| Camada | Tecnologia |
|--------|------------|
| Framework | React 19 + **TanStack Start** (SSR) + **TanStack Router** |
| Build | Vite 7 |
| Estilo | Tailwind CSS 4 |
| Auth | **Better Auth** (email/senha) com adapter Drizzle SQLite |
| Banco | **Turso/libSQL** via `@libsql/client` + **Drizzle ORM** |
| Data layer | TanStack `createServerFn` (`src/server/*.functions.ts`) |
| PDF | `pdf-lib` (exportação client-side) |
| Testes | Vitest (17 testes) + Playwright browser E2E (manual, falhando) |

### Rotas

```
/login, /signup                    → públicas
/_authenticated/*                  → protegidas (redirect → /login)
  /                                → Dashboard
  /create                          → Criar evento
  /vendas                          → Vendas
  /config                          → Configurações
  /event/$eventId                  → Gerenciar evento
  /event/$eventId/live             → Sorteio ao vivo / projeção
/api/auth/$                        → Better Auth handler
```

### Fluxo de dados

1. **Auth:** Better Auth em `/api/auth/*` → cookies de sessão → `getSessionFn` protege `/_authenticated`
2. **DB:** `getDbReady()` roda migrations inline SQL no boot → queries Drizzle em `events.server.ts`
3. **Firestore subcollections consolidadas:**
   - `draws` → `events.drawnNumbers` (JSON array)
   - `winners` → calculado client-side em `LiveDraw.tsx` via `checkWinner()`

### Variáveis de ambiente

```env
TURSO_DATABASE_URL=file:./data/bingo-facil.sqlite   # local; libsql://... para Turso cloud
TURSO_AUTH_TOKEN=                                    # obrigatório só para Turso remoto

BETTER_AUTH_SECRET=your-secret-at-least-32-characters-long
BETTER_AUTH_URL=http://localhost:3000                # deve bater com a origem deployada
```

Opcional (E2E browser): `E2E_BASE_URL=http://localhost:3020`

---

## 3. O que foi feito na sessão

### Migração core (completa)

- [x] Removido Firebase/Firestore do código da aplicação (sem imports Firebase restantes)
- [x] Auth migrado: Firebase Auth → Better Auth (`src/lib/auth.server.ts`, `src/lib/auth-client.ts`)
- [x] DB migrado para Turso/libSQL com schema Drizzle:
  - Tabelas auth: `user`, `session`, `account`, `verification`
  - Tabelas app: `events`, `cards`
- [x] Server layer reescrito: CRUD em `src/server/events.server.ts`, exposto via `events.functions.ts`
- [x] Migrations inline em `src/lib/db/index.ts` (`CREATE TABLE IF NOT EXISTS`)
- [x] Rotas migradas para TanStack Router file-based (`src/app/`)
- [x] Páginas atualizadas: Dashboard, CreateEvent, EventManage, LiveDraw, Vendas, Settings
- [x] Testes adicionados:
  - `src/server/events.server.test.ts` — 9 testes
  - `src/test/e2e-flow.test.ts` — fluxo completo signup→evento→venda→sorteio
  - `src/lib/bingo.test.ts` — 6 testes
  - `src/app/login.test.tsx` — 1 teste
- [x] TypeScript limpo (`npm run lint` passa)
- [x] Build passa (`npm run build` → `dist/client/` + `dist/server/`)
- [x] SQLite local em `data/bingo-facil.sqlite`

### Arquivos removidos (staged, não commitados)

- `src/lib/firebase.ts`, `src/lib/firestoreUtils.ts`
- `src/App.tsx`, `src/main.tsx`, `index.html`
- `firebase-applet-config.json`, `firebase-blueprint.json`

### Arquivos novos (untracked)

```
src/app/                    # Rotas TanStack
src/features/auth/          # UI login/signup
src/server/                 # Business logic + server functions
src/lib/db/                 # Schema + init
src/lib/auth-client.ts
src/lib/auth.server.ts
src/router.tsx
src/routeTree.gen.ts        # Auto-gerado — não editar
src/test/                   # Helpers + E2E flow test
scripts/e2e-browser.mjs     # Playwright smoke test
drizzle.config.ts
vitest.config.ts
data/                       # SQLite local
```

---

## 4. Estado atual

### Verificações (2026-06-10)

| Comando | Resultado |
|---------|-----------|
| `npm test` | ✅ 17/17 passando |
| `npm run lint` | ✅ `tsc --noEmit` limpo |
| `npm run build` | ✅ Build OK |
| `npm start` | ❌ Caminho errado (`.output/` vs `dist/`) |
| Browser E2E (`scripts/e2e-browser.mjs`) | ❌ Timeout na criação de evento |

### Git

- **Branch:** `main` @ `81ef6dd` ("feat: Add phone number for sold cards")
- **Working tree:** mudanças extensas não commitadas (migração inteira)
- **Remote:** `https://github.com/puppe1990/bingo-facil.git`

### O que funciona

- Signup/login com Better Auth
- CRUD de eventos e cartelas via server functions
- Venda de cartelas com telefone
- Sorteio ao vivo (polling 1.5s)
- Exportação PDF de cartelas
- Fluxo E2E completo em Vitest (banco in-memory)

### O que não funciona / está pendente

| Item | Prioridade | Detalhe |
|------|------------|---------|
| `npm start` | Alta | Aponta para `.output/server/index.mjs`; build gera `dist/server/server.js` |
| Browser E2E | Média | Timeout após "Gerar e Finalizar Evento" — provável issue com `fill()` em input controlado React (default 100 cartelas) ou erro silencioso no `createEventFn` |
| Erros silenciosos na UI | Média | `CreateEvent.tsx` faz `catch` sem feedback visual |
| Script de migração Firestore | Média | Não existe — dados antigos do Firebase não são importados |
| README desatualizado | Baixa | Ainda referencia AI Studio / `GEMINI_API_KEY` |
| Deps não usadas | Baixa | `@google-cloud/storage`, `@google/genai`, `express` |
| `firestore.rules` | Baixa | Artefato legado no root |
| Dual migration strategy | Baixa | Inline SQL em `index.ts` vs `drizzle-kit push` — sem pasta `migrations/` |
| Realtime multi-device | Baixa | Live draw usa polling, não websockets |
| Settings stubs | Baixa | Security, Notifications, Subscription são UI-only |
| Limite de cartelas inconsistente | Baixa | Form `max="1000"`, Zod permite até `10000` |

---

## 5. Como rodar

```bash
cd /Users/matheuspuppe/Desktop/Projetos/bingo-facil
npm install
cp .env.example .env          # preencher BETTER_AUTH_SECRET (32+ chars)
npm run dev                   # http://localhost:3000
```

| Comando | Propósito |
|---------|-----------|
| `npm run dev` | Dev server (porta 3000) |
| `npm run build` | Build produção → `dist/` |
| `npm test` | Vitest (17 testes) |
| `npm run test:watch` | Vitest watch |
| `npm run lint` | TypeScript check |
| `npm run db:push` | Drizzle push (pode conflitar com inline migrations) |

**Produção (até corrigir `start`):**
```bash
npm run build
node dist/server/server.js
```

**Browser E2E manual:**
```bash
npm run dev -- --port 3020
node scripts/e2e-browser.mjs
```

---

## 6. Próximos passos recomendados

### Imediato (antes de commitar)

1. **Corrigir `npm start`** — apontar para `dist/server/server.js` (verificar entry exato pós-build)
2. **Commitar a migração** — working tree tem toda a migração unstaged
3. **Corrigir feedback de erro** em `CreateEvent.tsx` — mostrar toast/alert quando `createEventFn` falha

### Curto prazo

4. **Corrigir browser E2E** — usar `page.locator().fill()` com trigger de evento React, ou reduzir default de cartelas no teste
5. **Atualizar README** — documentar Turso + Better Auth, remover referências Firebase/Gemini
6. **Limpar legado** — remover `firestore.rules`, deps não usadas, renomear `package.json` de `"react-example"`

### Se houver dados em produção no Firebase

7. **Criar script de migração** Firestore → Turso (users, events, cards)
8. **Documentar deploy** — Turso cloud + `BETTER_AUTH_URL` em produção

---

## 7. Arquivos-chave para quem continuar

```
src/server/events.server.ts     # Toda a lógica de negócio
src/server/events.functions.ts  # RPC wrappers (createServerFn)
src/lib/db/index.ts             # Init DB + migrations inline
src/lib/db/schema.ts            # Schema Drizzle
src/lib/auth.server.ts          # Config Better Auth
src/lib/bingo.ts                # Geração de cartelas + checkWinner
src/app/_authenticated.tsx      # Guard de autenticação
src/pages/CreateEvent.tsx         # Criação de evento (erros silenciosos aqui)
src/pages/LiveDraw.tsx            # Sorteio ao vivo (polling)
src/test/e2e-flow.test.ts         # E2E Vitest — referência do fluxo esperado
scripts/e2e-browser.mjs            # E2E Playwright — falhando
```

---

## 8. Artefatos da sessão

| Artefato | Caminho |
|----------|---------|
| Sessão Grok | `~/.grok/sessions/%2FUsers%2Fmatheuspuppe%2FDesktop%2FProjetos%2Fbingo-facil/019eb2d3-4630-7fe0-9bb3-c0e3af5f8ad4/` |
| Screenshot E2E failure | `e2e-failure.png` (project root) |
| Este handoff | `HANDOFF.md` |

Para retomar a sessão no Grok: `/resume` → selecionar sessão `019eb2d3-4630-7fe0-9bb3-c0e3af5f8ad4`.

---

*Gerado em 2026-06-10 a partir da sessão Grok "Migrate Firebase System to Turso Database".*