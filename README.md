# Bingo Fácil

Sistema de organização de bingos: criar eventos, vender cartelas e conduzir sorteios ao vivo.

## Stack

- React 19 + TanStack Start (SSR) + TanStack Router
- Turso/libSQL + Drizzle ORM
- Better Auth (email/senha)
- Tailwind CSS 4 + Vite 7

## Rodar localmente

**Pré-requisitos:** Node.js 20+

```bash
npm install
cp .env.example .env
```

Preencha `BETTER_AUTH_SECRET` com pelo menos 32 caracteres.

```bash
npm run dev    # http://localhost:3000
```

## Comandos

| Comando | Propósito |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção → `dist/` |
| `npm start` | Servidor de produção |
| `npm test` | Testes Vitest |
| `npm run lint` | Verificação TypeScript |
| `npm run db:push` | Drizzle push (pode conflitar com migrations inline) |

## Variáveis de ambiente

```env
TURSO_DATABASE_URL=file:./data/bingo-facil.sqlite
TURSO_AUTH_TOKEN=

BETTER_AUTH_SECRET=your-secret-at-least-32-characters-long
BETTER_AUTH_URL=http://localhost:3000
```

Para Turso cloud, use `libsql://...` e defina `TURSO_AUTH_TOKEN`.

## Rotas

```
/login, /signup              → públicas
/_authenticated/*            → protegidas
  /                          → Dashboard
  /create                    → Criar evento
  /vendas                    → Vendas
  /config                    → Configurações
  /event/$eventId            → Gerenciar evento
  /event/$eventId/live       → Sorteio ao vivo
```

## Migração Firebase

Este repositório é a versão migrada de Firebase (Auth + Firestore) para Turso + Better Auth. Veja `HANDOFF.md` para contexto completo da migração.