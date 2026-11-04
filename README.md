# GovTech

Plataforma web de governança de projetos de TI (TCC). Front-end em React + Vite; back-end em Supabase (Postgres, Auth e RLS).

## Estrutura

```
govtech/
├── frontend/   app React + Vite (todos os comandos npm rodam aqui)
├── backend/    Supabase: migrations, seed, testes pgTAP e Edge Functions (fase Supabase)
├── docs/       plano técnico (PLANO_TECNICO.md), API (API.md) e mapa de testes (TESTES.mmd)
├── AGENTS.md   regras do projeto para pessoas e agentes de IA
└── DOCUMENTACAO.md  funcionamento atual do sistema
```

## Começando

Requisito: **Node 22.12 ou mais novo**.

```bash
cd frontend
npm install        # instala as dependências e o hook de pre-commit (Husky)
cp .env.example .env.local   # e preencha com a URL e a chave publicável do Supabase
npm run dev        # http://localhost:5173
```

Os testes não precisam do `.env.local`: usam um Supabase simulado (MSW, em `src/test/msw`).

## Comandos (dentro de `frontend/`)

| Comando | Para quê |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção em `frontend/dist` |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run test:run` | Testes uma vez (Vitest) |
| `npm test` | Testes em modo watch |
| `npm run test:coverage` | Testes com cobertura |

## Fluxo de trabalho

- Nunca commitar na `main`. Branches `feat/…`, `fix/…`, `refactor/…`, `test/…`, `docs/…` e PR para a `main`.
- O hook de pre-commit roda ESLint e Prettier nos arquivos alterados.
- O CI (GitHub Actions) roda lint, testes e build em todo PR.

## Deploy (Vercel)

O projeto da Vercel deve usar **Root Directory = `frontend`**. O `frontend/vercel.json` já define o build do Vite e o redirecionamento das rotas da SPA para o `index.html`.
