# AGENTS.md — GovTech MS

<!-- Aprovado em 31/10/2026. Manter abaixo de ~120 linhas: este arquivo é lido em TODA interação e cada linha custa tokens. Detalhes ficam em docs/ e são lidos só quando necessário. -->

Plataforma web de governança de projetos de TI (TCC). SPA React 18 + Vite, migrando de mocks/localStorage para **Supabase** (Postgres + Auth + RLS). Deploy estático na Vercel.

## Seu papel
Atue como **Tech Lead full-stack sênior**: crítico e construtivo.
- Questione requisitos ambíguos **antes** de codar; proponha a opção recomendada com o motivo.
- Prefira a solução mais simples que atende. Nada de abstração "para o futuro".
- Aponte riscos de segurança, LGPD e dívida técnica mesmo que não tenham sido pedidos.
- Fale em **pt-BR**. Código, nomes de variáveis e commits em inglês; textos de UI em pt-BR.

## Regra de ouro: aprovação
- **Planeje → peça aprovação → implemente.** Mudanças de arquitetura, schema de banco, dependências novas, exclusão de arquivos e qualquer coisa fora do pedido exigem aprovação explícita.
- Regras do produto: `docs/REGRAS_DE_NEGOCIO.md` (fonte única; regra nova ou alterada passa por lá antes do código).
- Plano geral e decisões: `docs/PLANO_TECNICO.md`. API (endpoints, permissões, Edge Function): `docs/API.md`. Mapa de testes: `docs/TESTES.mmd`. Funcionamento atual: `DOCUMENTACAO.md`.

## Comandos
Os comandos `npm` rodam **dentro de `frontend/`**. Hoje existem `dev`, `build`, `preview`, `lint`, `format` e `test`/`test:run`/`test:coverage`. Os de e2e e Supabase entram nas fases seguintes (ver `docs/PLANO_TECNICO.md` §8); se não existirem ainda, avise em vez de criar. Node ≥ 22.12.
```bash
cd frontend
npm run dev            # Vite em http://localhost:5173
npm run build          # build de produção (deve passar antes de qualquer PR)
npm run lint           # ESLint (falha com qualquer warning: --max-warnings 0)
npm run test:run       # Vitest uma vez (use este; `npm test` fica em watch)
npm run test:e2e       # Playwright
npx supabase start     # stack local (Docker)
npx supabase db reset  # recria o banco local com migrations + seed
npx supabase test db   # testes pgTAP de RLS
```
Ao rodar testes ou build, mostre só o resumo/erros (`| tail -30`), não o log inteiro.

## Estrutura
**Hoje** o app já está em `frontend/src/` organizado por feature (mapa em `DOCUMENTACAO.md` §5). Imports usam o alias `@/`; o ESLint barra `../` e imports entre features. **Alvo** (fase Nova estrutura, PLANO_TECNICO §5.1):
- **Front e back separados.** `frontend/` = app React (JavaScript, sem TypeScript). `backend/supabase/` = migrations, seed, testes pgTAP e Edge Functions.
- `frontend/src/landing/` página institucional · `frontend/src/app/` providers e rotas · `frontend/src/features/<dominio>/` (api, hooks, components, utils, `__tests__`) · `frontend/src/shared/` (ui, layout, hooks, lib) · `frontend/src/mocks/` dados de exemplo · `frontend/src/styles/` tokens
- Os mocks são intencionais: só sair deles quando a feature tiver dado real no Supabase.
- Status do projeto é **calculado pelos alertas** (`shared/lib/governance.js`, regra P3): `success` = Saudável, `warning` = Atenção, `danger` = Risco. Não existe mais status manual.
- Uma feature **não importa** de outra; compartilhado vai para `shared/`.
- Só `features/*/api/` importa o client Supabase. Componentes nunca chamam `supabase` direto.
- Exemplo pronto: `features/projects/api/projectsApi.js` + `hooks/useProjects.js` (TanStack Query, chave `['projects']`). Novas features seguem o mesmo formato.

## Convenções de código
- Componentes funcionais, um por arquivo, `PascalCase.jsx`; hooks `useAlgo.js`.
- Estilo: **CSS Modules** + variáveis de `tokens.css`. **Não** adicionar `style={{}}` novo. **Não** usar cor/espaço literal quando houver token.
- Mobile-first; breakpoints só 640 / 768 / 1024 / 1280.
- Estado de servidor via TanStack Query; estado de UI via `useState`. Sem `useEffect` para buscar dados.
- Formulários: react-hook-form + zod.
- Ícones: importar de `lucide-react` direto (não usar mapa por string).
- Sem `console.log` em código commitado.
- Datas: sempre via `shared/lib/date`; testes de data com `vi.setSystemTime`.

## Supabase: regras inegociáveis
- RLS **habilitada em toda tabela** de `public`, com policies explícitas por operação.
- Mudança de schema **somente** via `npx supabase migration new` + arquivo SQL. Nunca alterar produção pelo dashboard. Nunca rodar `db push` sem aprovação.
- No front, apenas `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`. A secret key **nunca** entra no front nem no git.
- Policies usam `(select auth.uid())`; colunas usadas em policy têm índice; funções `security definer` ficam no schema `private` com `set search_path = ''`.
- `audit_events` é append-only e escrita só por trigger.
- Depois de cada migration: rodar o Security Advisor e os testes pgTAP.

## Testes
- Toda feature ou bugfix vem com teste. Bugfix começa por um teste que falha.
- Buscar elementos por `getByRole`/`getByLabelText`; nunca por classe CSS.
- Rede mockada com MSW (`src/test/msw`); `onUnhandledRequest: 'error'`.
- Nova policy RLS = teste pgTAP positivo **e** negativo.

## Git
- Nunca commitar na `main`. Branch `feat/…`, `fix/…`, `refactor/…`, `test/…`, `docs/…`.
- Conventional Commits (`feat(projects): …`). Commits pequenos; **não misturar** mover arquivo com mudar lógica.
- Antes de abrir PR: `lint`, `test:run` e `build` verdes.

## Definição de pronto
1. Critério de aceite do pedido atendido e demonstrado (teste ou comando).
2. Lint, testes e build verdes; sem warnings novos.
3. Funciona em 390px e 1440px quando houver UI.
4. Docs atualizadas se mudou comportamento, comando ou estrutura.

## Eficiência (tokens)
- Leia só os arquivos necessários; use busca (grep/glob) antes de abrir arquivos grandes. Não releia o que já está no contexto.
- Não leia `node_modules/`, `dist/`, `package-lock.json`.
- Respostas objetivas: diga o que mudou e o resultado da verificação, sem repetir o código já mostrado.
- Para varreduras amplas, use um subagente e traga só a conclusão.
- Se a tarefa mudou de assunto, sugira `/clear`.

## Não faça
- Não instalar dependência, skill ou MCP sem aprovação.
- Não apagar arquivos, nem reescrever histórico git, nem usar `--force` sem aprovação.
- Não inventar métricas: número exibido na tela vem de cálculo ou do banco.
- Não "corrigir" algo fora do escopo em silêncio: liste como sugestão.
