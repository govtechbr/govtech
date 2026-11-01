# GovTech MS — Plano Técnico (Back-end Supabase, Refatoração, Testes, Responsividade)

> **Status (01/11/2026):** ✅ Limpeza (branch `chore/limpeza`) · ✅ Qualidade: ESLint, Prettier e Husky (branch `chore/qualidade`) · ✅ Skills instaladas · ✅ Testes P0 (branch `test/setup`, §14) · Supabase `govtech-br` em São Paulo, vazio · ✅ **Nova estrutura concluída** (§15) · próxima fase: **Supabase**.
>
> Autor: Tech Lead (IA) · Data: 31/10/2026 · Base: commit `193c764` (branch `main`)

## Índice

1. [Diagnóstico crítico do estado atual](#1-diagnóstico-crítico-do-estado-atual)
2. [Questionamentos ao time (precisam de resposta)](#2-questionamentos-ao-time-precisam-de-resposta)
3. [Arquitetura alvo](#3-arquitetura-alvo)
4. [Back-end com Supabase](#4-back-end-com-supabase)
5. [Refatoração do front-end](#5-refatoração-do-front-end)
6. [Estratégia de testes](#6-estratégia-de-testes)
7. [Roadmap de responsividade](#7-roadmap-de-responsividade)
8. [Roadmap consolidado (ordem de execução)](#8-roadmap-consolidado-ordem-de-execução)
9. [Skills e ferramentas de IA recomendadas](#9-skills-e-ferramentas-de-ia-recomendadas)
10. [Baixo consumo de tokens, alta entrega](#10-baixo-consumo-de-tokens-alta-entrega)
11. [Checklist de aprovação](#11-checklist-de-aprovação)
12. [Referências](#12-referências)
13. [Qualidade: lint e formatação](#13-qualidade-lint-e-formatação--aprovado-e-aplicado-em-31102026)
14. [Testes](#14-testes--aprovado-e-aplicado-em-01112026)
15. [Nova estrutura](#15-nova-estrutura--concluída-em-01112026)
16. [Proposta: fase Supabase (aguardando aprovação)](#16-proposta-fase-supabase-primeira-entrega-aguardando-aprovação)

---

## 1. Diagnóstico crítico do estado atual

### O que está bom
- **Regras de negócio isoladas** em `utils/projectUtils.js` (funções puras, fáceis de testar).
- **Design tokens** em `tokens.css` com tema claro/escuro: boa base para um design system.
- **Defensividade** no `normalizeProject` e nos `try/catch` de storage.
- **Deploy simples** na Vercel com rewrite de SPA correto.

### O que está ruim (e por que importa)

| # | Problema | Evidência | Impacto | Prioridade |
|---|---|---|---|---|
| 1 | **Duas arquiteturas de navegação convivendo** | `App.jsx` (rotas) e `pages/DashboardPage.jsx` (estado `active` + `switch`) | Duas sidebars na Visão geral, dois estados de projetos e duas lógicas de tema. Bug garantido ao plugar o back-end | 🔴 |
| 2 | **Persistência gravando na chave `"undefined"`** | `utils/storageUtils.js` usa `STORAGE_KEYS.projects` (minúsculo) | Dados "funcionam" por acidente | 🔴 |
| 3 | **Filtros por campo inexistente** | `ProjectsPage.jsx:168,174` filtra `p.status`, que o `normalizeProject` descarta | Indicadores "Em atenção" e "Riscos críticos" ficam sempre em 0 | 🔴 |
| 4 | **Sem autenticação nem proteção de rota** | `useState(true)` em `App.jsx:57` | Inaceitável num produto de *governança* | 🔴 |
| 5 | **Sem `src/`, lint, formatter ou testes** | raiz do repo, `package.json` só tem dev/build/preview | Nenhuma rede de segurança para refatorar | 🔴 |
| 6 | **~330 estilos inline** + 2 CSS globais de ~1.500 linhas cada | `grep "style={{"` | Responsividade inviável (inline não aceita media query), CSS sem escopo | 🟠 |
| 7 | **10 breakpoints diferentes** (390, 640, 760, 768, 900, 1024, 1100…) | `app.css`, `index.css` | Layout inconsistente entre telas | 🟠 |
| 8 | **Mocks dentro dos componentes** e valores fixos ("4.2 dias", "92%") | `OverviewPage`, `AuditPage`, `RbacPage` | Dado falso disfarçado de métrica | 🟠 |
| 9 | **Código morto** (8 arquivos, 3 com 0 linhas) | ver `DOCUMENTACAO.md §16` | Ruído para humanos e para a IA (gasta tokens) | 🟡 |
| 10 | **`console.log` de debug** imprimindo a lista inteira a cada render | `ProjectsPage.jsx:53-58,88` | Ruído e vazamento de dados no console | 🟡 |
| 11 | **Histórico git reescrito** (1 commit) e `DOCUMENTACAO.md` citando commit/caminho antigos (`8ed3a40`, `govtech-ms`) | `git log` | Documentação desatualizada; perda de rastreabilidade | 🟡 |
| 12 | **Trabalho direto na `main`** | 1 branch | Sem revisão; contradiz a proposta do próprio produto (governança de PRs) | 🟡 |

**Situação em 31/10/2026:**
- ✅ Resolvidos na limpeza: #1, #2, #3 (status manual), #8 (mocks centralizados em `data/`; continuam mocks, por decisão), #9, #10, #11, #12 (trabalho na branch `chore/limpeza`). Bônus: o `App.jsx` não salvava os projetos; agora salva.
- ⏸️ #4 (auth/rotas): adiado pelo time, entra com o Supabase.
- 📝 #5 (lint/formatação): proposta na §13, **aguardando aprovação**.
- 🗓️ #6 e #7 (estilos inline e breakpoints): fase **Nova estrutura**.

> **Leitura de Tech Lead:** o produto *vende governança, rastreabilidade e controle de acesso*, mas o código não pratica nenhum dos três. Para a banca do TCC esse é o ponto mais vulnerável, e por isso **autenticação + RLS + auditoria real** são a espinha do plano.

---

## 2. Questionamentos ao time (respondidos em 31/10/2026)

| # | Pergunta | Decisão do time | Consequência no plano |
|---|---|---|---|
| Q1 | Data de entrega | **18/11/2026** (18 dias) | Roadmap recortado (§8). GitHub real, Realtime, CSV e chatbot com IA ficam fora |
| Q2 | Multi-organização? | **Sim**. Projeto Supabase **`govtech-br`** (ref `dulcrbaxzcmfgoikvocl`, região `sa-east-1` São Paulo, por LGPD e latência). O antigo `govtech` (`us-east-1`) foi apagado | Fase Supabase começa direto pelas migrations |
| Q3 | Cadastro aberto ou convite? | **Cadastro aberto** | No cadastro o usuário escolhe: **criar organização** (informa o nome da empresa e vira admin) ou **entrar com o código da organização** (entra como `viewer`; o admin promove). Ver §4.3 |
| Q4 | Auth/proteção de rotas | **Ver depois** | Entra junto com o Supabase |
| Q5 | TypeScript? | **Não** | Fica JavaScript. zod valida dados nas bordas |
| Q6 | Status do projeto | **Manual** | ✅ Já implementado (`constants/projectStatus.js`). O semáforo de prazo continua como informação separada |
| Q7 | Auditoria | **Só para revisão** | Log simples por trigger, sem cadeia de hash |
| Q8 | Dados pessoais | **Nome, e-mail e chave de API do GitHub**. A chave **entra no escopo até 18/11**: "sem ela o projeto não avança" | Ver §4.7: chave no Vault + Edge Function `github-sync` que busca repositórios, PRs e branches sob demanda |
| Q9 | Chatbot com IA | **A definir** | Fora do escopo até 18/11 |
| Q10 | Landing page | **Fica, em pastas separadas**; o botão de login chama o sistema | `frontend/src/landing/` separado de `frontend/src/app/` |
| Q11 | Pausa do Supabase Free | **Ok** | Reativar na véspera da defesa |
| Q12 | Pessoas no projeto | **2** | Branch por tarefa + PR revisado pelo colega |
| Q13 | Fórmulas dos KPIs | **Pode deixar** | Números fixos ficam até haver dados reais |
| — | Separar back e front | **Sim, pastas diferentes** | `frontend/` e `backend/` na raiz (§5.1) |
| — | Repositório remoto | **GitHub** `oguilhermekenzo/govtech` (privado), já conectado como `origin` | Subir as branches e abrir PRs para a `main` |
| — | Chave do GitHub | **Uma por projeto**, cadastrada pelo admin | Ver §4.7 |
| — | Lint, Husky, skills, arquitetura, estrutura, testes, roadmap | **Aprovados** | Executados: Qualidade e skills. Próxima: Testes (§14) |

## 3. Arquitetura alvo

```mermaid
flowchart LR
  subgraph Browser["Navegador (SPA React + Vite)"]
    UI[Páginas / Componentes] --> HK[Hooks de dados<br/>TanStack Query]
    HK --> API[Camada api/ por feature]
    API --> SB[supabase-js client]
  end

  subgraph Supabase
    AUTH[Auth<br/>e-mail + GitHub OAuth]
    PG[(Postgres<br/>RLS em todas as tabelas)]
    RT[Realtime]
    EF[Edge Functions<br/>webhook GitHub, convites]
    VAULT[Vault<br/>segredos]
    CRON[pg_cron<br/>sync agendado]
  end

  SB -- JWT --> AUTH
  SB -- REST/PostgREST --> PG
  SB -- websocket --> RT
  GH[GitHub] -- webhook assinado --> EF
  EF --> PG
  EF --> VAULT
  CRON --> EF
  Vercel[[Vercel: hospeda o build estático]] -.-> Browser
```

**Princípios:**
1. **O banco é a fronteira de segurança.** O front esconde botões por conveniência; quem *impede* é a RLS.
2. **Nenhum segredo no front.** O browser só conhece a *publishable key* (`sb_publishable_…`). A *secret key* (`sb_secret_…`, antiga `service_role`) só existe em Edge Functions.
3. **Schema como código.** Toda mudança de banco é uma *migration* versionada no git, nunca um clique no dashboard de produção.
4. **Front desacoplado do provedor.** Componentes não importam `supabase` diretamente; passam por `features/*/api`. Isso também facilita os testes.

---

## 4. Back-end com Supabase

### 4.1 Serviços do Supabase que vamos usar

| Serviço | Uso no GovTech | Fase |
|---|---|---|
| **Postgres + PostgREST** | Todas as entidades | 3 |
| **Auth** | Login e-mail/senha, convite por e-mail; depois GitHub OAuth | 3 |
| **RLS** | RBAC real por organização | 3 |
| **Triggers + funções** | Auditoria automática, `updated_at`, criação de `profile` | 3 |
| **Views** | KPIs (lead time, taxa de aprovação, status de projetos) | 4 |
| **Edge Functions** (Deno) | Webhook do GitHub, convite de usuários, export CSV | 5 |
| **Vault** | Token do GitHub App | 5 |
| **Realtime** | Feed de atividade e alertas ao vivo (opcional) | 6 |
| **pg_cron** | Sync periódico com GitHub e ping anti-pausa | 5 |

### 4.2 Modelo de dados (proposta)

```mermaid
erDiagram
  organizations ||--o{ organization_members : tem
  profiles ||--o{ organization_members : participa
  organizations ||--o{ projects : possui
  organizations ||--o{ repositories : possui
  projects }o--o{ repositories : "project_repositories"
  repositories ||--o{ pull_requests : tem
  repositories ||--o{ branches : tem
  organizations ||--o{ audit_events : registra
  organizations ||--|| organization_settings : configura
  profiles ||--|| user_preferences : prefere
  organizations ||--o{ integrations : conecta

  organization_members {
    uuid organization_id PK
    uuid user_id PK
    app_role role
  }
  projects {
    uuid id PK
    uuid organization_id FK
    text name
    date deadline
    text priority
    smallint progress
    uuid owner_id FK
  }
  pull_requests {
    uuid id PK
    uuid repository_id FK
    int number
    pr_status status
    timestamptz opened_at
    timestamptz merged_at
  }
  audit_events {
    bigint id PK
    uuid organization_id FK
    uuid actor_id
    text action
    text entity
    jsonb diff
    text hash
    timestamptz created_at
  }
```

Mapeamento a partir do mock atual (`data/mockData.js`):

| Mock atual | Tabela | Observação |
|---|---|---|
| `profile` | `profiles` | 1:1 com `auth.users`, criado por trigger |
| `services` | `repositories` | `deploy`, `team` e `language` viram colunas |
| `projects` | `projects` + `project_repositories` | `repositories: string[]` vira tabela N:N |
| `pullRequests` / `branches` | `pull_requests` / `branches` | Alimentados pelo GitHub (fase 5) ou seed |
| `auditEvents` | `audit_events` | Escrito **só por trigger**, nunca pelo cliente |
| `accessRoles` | enum `app_role` + `organization_members` | Admin, Developer, Stakeholder, Viewer |
| `settings` (localStorage) | `organization_settings` + `user_preferences` | Tema é preferência do usuário; fuso é da organização |
| `repoStats`, "4.2 dias", "92%" | mantidos como mock (Q13) | Viram views SQL depois do TCC |
| chave de API do GitHub (Q8) | `github_credentials` (guarda só o id do segredo) + **Vault** | Lida apenas por Edge Function; o dono pode cadastrar/apagar, ninguém lê o valor pelo front |

### 4.3 Esboço SQL (primeira migration)

```sql
-- supabase/migrations/<timestamp>_core_schema.sql
create type public.app_role as enum ('admin', 'developer', 'stakeholder', 'viewer');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  -- código para entrar na organização no cadastro (aleatório, o admin pode gerar outro)
  join_code text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 8)),
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.app_role not null default 'viewer',
  primary key (organization_id, user_id)
);
create index on public.organization_members (user_id);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  description text,
  deadline date,
  owner_id uuid references public.profiles (id),
  priority text not null default 'medium' check (priority in ('high', 'medium', 'low')),
  progress smallint not null default 0 check (progress between 0 and 100),
  created_by uuid default auth.uid() references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.projects (organization_id);

-- Funções auxiliares de RLS ficam num schema NÃO exposto pela API
create schema if not exists private;

create function private.has_org_role(org uuid, roles public.app_role[])
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = org
      and m.user_id = (select auth.uid())
      and m.role = any (roles)
  );
$$;

alter table public.projects enable row level security;

create policy "membros leem projetos" on public.projects
  for select to authenticated
  using (private.has_org_role(organization_id,
         array['admin','developer','stakeholder','viewer']::public.app_role[]));

create policy "admin/dev criam projetos" on public.projects
  for insert to authenticated
  with check (private.has_org_role(organization_id,
              array['admin','developer']::public.app_role[]));

create policy "admin/dev editam projetos" on public.projects
  for update to authenticated
  using (private.has_org_role(organization_id, array['admin','developer']::public.app_role[]))
  with check (private.has_org_role(organization_id, array['admin','developer']::public.app_role[]));

create policy "só admin exclui projetos" on public.projects
  for delete to authenticated
  using (private.has_org_role(organization_id, array['admin']::public.app_role[]));
```

**Regras de RLS que valem para todas as tabelas:**
- `enable row level security` em **toda** tabela do schema `public`, sem exceção.
- Usar `(select auth.uid())` (com `select`) nas policies, pois o Postgres avalia uma vez por query, não por linha.
- Indexar toda coluna usada em policy (`organization_id`, `user_id`).
- Funções `security definer` sempre com `set search_path = ''` e em schema `private`.
- `audit_events`: só policy de `select`. Nenhuma de `insert/update/delete` para `authenticated`; quem escreve é o trigger.
- RLS sem policy devolve `[]` **sem erro**. Todo "a lista veio vazia" deve começar a investigação pelas policies.
- Rodar o **Security Advisor** (`get_advisors`) a cada migration.

**Cadastro e entrada na organização (Q3):** a tela de cadastro tem duas opções.
- **Criar organização:** informa o nome da empresa; a `rpc create_organization(name)` cria a organização e o vínculo como `admin`.
- **Entrar com código:** informa o `join_code`; a `rpc join_organization(code)` (`security definer` em `private`) cria o vínculo como `viewer`. O admin promove depois na tela de RBAC e pode gerar um código novo se ele vazar.
- Entrar **só pelo nome** da empresa não é seguro (qualquer pessoa entraria em qualquer organização); o nome serve para criar e para exibir.

### 4.4 Auditoria (simples, para revisão — Q7)

Trigger genérico `private.audit_row()` em `projects`, `organization_members` e `repositories` grava `action` (`INSERT/UPDATE/DELETE`), `entity`, `entity_id`, `actor_id = auth.uid()`, `diff` (jsonb `old`/`new`) e `created_at`. Sem cadeia de hash. A tela de Auditoria passa a listar esses eventos no lugar do mock.

### 4.5 Ambiente e fluxo de trabalho

```
backend/supabase/
├── config.toml
├── migrations/          ← SQL versionado (fonte da verdade)
├── seed.sql             ← dados de demo (vindos de data/mockData.js)
├── functions/           ← Edge Functions (Deno/TS)
│   ├── github-webhook/
│   └── invite-member/
└── tests/               ← pgTAP: testes de RLS
```

| Etapa | Comando | Observação |
|---|---|---|
| Instalar CLI | `npm i -D supabase` | Versão fixada por projeto |
| Subir stack local (Docker) | `npx supabase start` | Postgres, Auth e Studio locais |
| Nova migration | `npx supabase migration new core_schema` | |
| Recriar banco local + seed | `npx supabase db reset` | Rodar a cada mudança |
| Testar RLS | `npx supabase test db` | pgTAP |
| Aplicar no remoto | `npx supabase db push` | **Só via CI** depois de configurado |

**Ambientes:** `local` (Docker) → `staging` (projeto Supabase de teste, preview da Vercel) → `production`. Variáveis na Vercel: `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`. Criar `.env.example` versionado; `.env.local` já está no `.gitignore`.

### 4.6 Integração no front (contrato)

```js
// src/shared/lib/supabase.js — único lugar que cria o client
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
)

// src/features/projects/api/projectsApi.js — snake_case do banco vira camelCase aqui
export async function listProjects(organizationId) {
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, description, deadline, priority, progress, owner:profiles(full_name), project_repositories(repository_id)')
    .eq('organization_id', organizationId)
    .order('deadline')
  if (error) throw error
  return data.map(toProject)
}

// src/features/projects/hooks/useProjects.js — cache, loading e erro via TanStack Query
export const useProjects = (orgId) =>
  useQuery({ queryKey: ['projects', orgId], queryFn: () => listProjects(orgId) })
```

- **Auth:** `AuthProvider` (contexto) escuta `supabase.auth.onAuthStateChange`; `<ProtectedRoute>` redireciona para `/login`; `<Can role="admin">` esconde ações na UI.
- **Estado de servidor** (projetos, PRs…) fica no TanStack Query. **Estado de UI** (modal aberto, aba) fica em `useState`. **Preferências** ficam em `user_preferences`, com `localStorage` só como cache de tema para evitar o "flash" ao carregar.
- **Transição sem big-bang:** na fase 2 a camada `api/` é criada *ainda usando localStorage*. Na fase 3 só o corpo dessas funções muda; páginas e testes de componente ficam intactos.

---

### 4.7 Integração com o GitHub via chave de API (no escopo até 18/11)

Sem webhook nem GitHub App (não cabem no prazo): sincronização **sob demanda**, por um botão "Sincronizar" na tela de Repositórios.

```mermaid
sequenceDiagram
  participant U as Usuário (admin)
  participant F as Front
  participant DB as Postgres (RLS)
  participant V as Vault
  participant EF as Edge Function github-sync
  participant GH as API do GitHub
  U->>F: cola a chave (fine-grained, só leitura)
  F->>DB: rpc save_github_token(project, token)
  DB->>V: vault.create_secret(token)
  DB-->>F: ok (devolve só os 4 últimos caracteres)
  U->>F: clica "Sincronizar"
  F->>EF: POST com o JWT do usuário
  EF->>DB: confere se é membro da organização
  EF->>V: lê o segredo (service role, só no servidor)
  EF->>GH: lista repos, PRs e branches
  EF->>DB: upsert em repositories, pull_requests, branches
  F->>DB: select (RLS por organização)
```

- **Tipo de chave:** *fine-grained personal access token*, só leitura (Metadata, Contents e Pull requests), restrito aos repositórios necessários.
- **Uma chave por projeto** (decisão de 01/11): cada projeto aponta para repositórios que podem ser de donos diferentes no GitHub.
- **Onde fica:** `vault.secrets`, criptografada. A tabela `github_credentials(project_id primary key, organization_id, secret_id, token_last4, created_by, created_at)` guarda só a referência (`organization_id` repetido para a policy de RLS, com índice). Nenhuma policy permite ao front ler o segredo.
- **Quem pode:** só o admin da organização cadastra, troca ou remove a chave de um projeto (`rpc save_github_token(project_id, token)`). Qualquer membro vê os dados sincronizados. A sincronização (`github-sync`) recebe o `project_id`.
- **Validação:** ao salvar, a Edge Function chama `GET /user` no GitHub para confirmar que a chave funciona antes de guardar.

## 5. Refatoração do front-end

### 5.1 Estrutura alvo: back e front separados

```
govtech/
├── frontend/                  ← app React + Vite (tudo que roda no navegador)
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── public/                ← favicon etc.
│   └── src/
│       ├── main.jsx
│       ├── landing/           ← página institucional (Q10), separada do sistema
│       ├── app/               ← o sistema: App.jsx, router.jsx, providers/
│       ├── features/
│       │   ├── auth/          ← LoginPage, cadastro, AuthProvider, ProtectedRoute
│       │   ├── dashboard/
│       │   ├── projects/      ← api/, hooks/, components/, utils/, __tests__/
│       │   ├── repositories/
│       │   ├── audit/
│       │   ├── rbac/
│       │   └── settings/
│       ├── shared/            ← ui/, layout/, hooks/, lib/ (supabase.js), constants/
│       ├── mocks/             ← mockData.js (continua sendo a fonte até o Supabase)
│       ├── styles/            ← tokens.css, reset.css, global.css
│       └── test/              ← setup.js, msw/, utils/
├── backend/
│   └── supabase/              ← config.toml, migrations/, seed.sql, functions/, tests/
├── docs/
├── .gitattributes / .editorconfig
└── README.md
```

- A Vercel passa a usar **Root Directory = `frontend`**, e o `vercel.json` vai para dentro de `frontend/`.
- O CLI do Supabase roda a partir de `backend/` (`npx supabase <comando> --workdir backend`).
- `landing/` e `app/` não importam um do outro. O botão "Entrar" da landing só navega para `/login`.

**Regras de dependência** (verificáveis com `eslint-plugin-boundaries` ou revisão):
- `features/A` **não importa** de `features/B`. O que é compartilhado sobe para `shared/`.
- `shared/` não importa de `features/`.
- Só `features/*/api` importa `shared/lib/supabase`.

### 5.2 Decisões técnicas

| Tema | Decisão | Alternativa descartada | Por quê |
|---|---|---|---|
| Estilo | **CSS Modules** + tokens existentes | Tailwind | Zero dependência nova, reaproveita `tokens.css`, resolve escopo e permite media query (inline não permite) |
| Roteamento | Rotas **aninhadas** com `<Outlet>` + `lazy()` | 6 rotas renderizando o mesmo layout + `switch` | Remove a duplicação do `DashboardPage`; code-splitting da Landing (655 linhas) |
| Estado servidor | **TanStack Query v5** | `useEffect` + `useState` manual | Cache, retry, loading/erro e invalidação prontos |
| Formulários | **react-hook-form + zod** | estado manual | Validação declarativa; o mesmo schema zod valida a resposta da API |
| Toast | `ToastProvider` + `useToast()` | prop `onToast` repassada em cascata | Elimina *prop drilling* |
| Ícones | Importar o componente Lucide direto | `Icon name="..."` com mapa de strings | Erro de digitação vira erro de build, não ícone silencioso; tree-shaking |
| Qualidade | **ESLint** (react, react-hooks, jsx-a11y, import) + **Prettier** + **Husky/lint-staged** | — | Pré-requisito para refatorar com segurança |
| Linguagem | **JavaScript** (Q5) | TypeScript | Decisão do time; zod valida dados nas bordas (formulários e respostas da API) |

### 5.3 Componentes do design system (`shared/ui`)

Extraídos do que já se repete no código:

| Componente | Substitui |
|---|---|
| `Button` (variants: primary, secondary, ghost, danger; sizes) | dezenas de `<button style={{...}}>` |
| `Card` / `Panel` | `.panel`, `.metric-card` |
| `StatCard` | já existe, só ganha CSS Module |
| `Badge` | `StatusBadge` + selos inline |
| `Modal` | `ModalShell`, com foco preso, `Esc`, `aria-modal`, e *sheet* no mobile |
| `Tabs` | abas de Repositórios e Configurações |
| `DataTable` / `ResponsiveList` | tabelas de RBAC, Auditoria e PRs (vira cards no mobile) |
| `EmptyState`, `Skeleton`, `ErrorState` | estados ausentes hoje (necessários com back-end) |
| `ProgressBar`, `Switch`, `Field` | Projetos e Configurações |

### 5.4 Ordem segura da refatoração

1. **Faxina** (sem mudar comportamento): remover código morto, `console.log`, imports não usados; corrigir as chaves de storage.
2. **Rede de segurança:** ESLint, Prettier, Vitest, e **testes de caracterização** em `projectUtils`, `storageUtils` e no fluxo de Projetos *antes* de mover arquivos.
3. **Mover para `src/`** com alias `@/` no `vite.config.js` (commit só de movimentação, sem mudar código).
4. **Unificar navegação:** rotas aninhadas, apagar `DashboardPage` e `DashboardLayout`, centralizar o tema num `ThemeProvider`.
5. **Extrair `shared/ui`** e migrar inline → CSS Modules, uma feature por PR.
6. **Mover mocks** de dentro dos componentes para `api/` (ainda locais), preparando a fase do Supabase.

Cada passo = 1 PR pequeno, com CI verde. Nunca misturar "mover arquivo" com "mudar lógica" no mesmo commit.

---

## 6. Estratégia de testes

Detalhamento completo, com a lista de casos, em [`docs/TESTES.mmd`](./TESTES.mmd).

**Modelo: Testing Trophy** (Kent C. Dodds). A maior parte do valor está nos testes de **integração de componente** (renderizar a página e interagir como usuário), apoiados por análise estática e unitários das regras puras, com poucos E2E críticos.

| Camada | Ferramenta | O que cobre | Meta |
|---|---|---|---|
| Estática | ESLint, Prettier, (TS) | Erros de digitação, hooks, a11y | 0 erros no CI |
| Unitário | **Vitest** | `projectStatus`, `normalizeProject`, formatadores, mappers da API, hooks | ≥ 90% de linhas em `utils/` e `api/` |
| Integração de componente | **Vitest + React Testing Library + user-event + jest-dom** | Páginas e modais, com rede mockada | Todos os fluxos de §6 do `.mmd` |
| Mock de rede | **MSW v2** | Intercepta as chamadas REST do supabase-js | `onUnhandledRequest: 'error'` |
| Banco / RLS | **pgTAP** (`supabase test db`) | Cada policy, positiva e negativa | 1 teste por papel × operação × tabela |
| E2E | **Playwright** | Login → CRUD de projeto → logout; RBAC; 3 viewports | ≤ 10 cenários, rodando no CI |
| Acessibilidade | `vitest-axe` / `@axe-core/playwright` | Violações WCAG 2.2 AA | 0 violações sérias |

**Convenções:**
- Testar **comportamento**, não implementação: buscar por `getByRole`/`getByLabelText`, nunca por classe CSS.
- Datas: `vi.useFakeTimers()` + `vi.setSystemTime()`. O semáforo de prazo depende de "hoje"; sem isso o teste quebra sozinho com o passar do tempo.
- Arquivo de teste ao lado do código (`__tests__/` na feature).
- `renderWithProviders()` único (Router + QueryClient + Auth fake + Toast).
- Cobertura é sinal, não meta: o CI barra apenas abaixo de 70% global e 90% em `utils/`.

Scripts propostos no `package.json`:
```json
"test": "vitest",
"test:run": "vitest run",
"test:coverage": "vitest run --coverage",
"test:e2e": "playwright test",
"test:db": "supabase test db",
"lint": "eslint .",
"format": "prettier --write ."
```

**CI (GitHub Actions)** em todo PR: `lint` → `test:run --coverage` → `build` → (com Supabase) `supabase db reset && supabase test db` → `test:e2e` contra o preview da Vercel.

---

## 7. Roadmap de responsividade

### 7.1 Princípios
- **Mobile-first:** estilo base para 360px; `min-width` para crescer.
- **Um conjunto de breakpoints**, em tokens (substitui os 10 atuais):

| Token | Largura | Alvo |
|---|---|---|
| `--bp-sm` | 640px | celular grande / paisagem |
| `--bp-md` | 768px | tablet retrato |
| `--bp-lg` | 1024px | tablet paisagem / notebook pequeno — **sidebar fixa a partir daqui** |
| `--bp-xl` | 1280px | desktop |

> Variáveis CSS não funcionam dentro de `@media`. Os valores ficam documentados em `tokens.css` e são usados literalmente, ou via `@custom-media` com PostCSS (opcional).

- **Container queries** (`@container`) para cards e painéis que mudam de layout conforme o espaço do *painel*, não da tela.
- **Tipografia e espaçamento fluidos** com `clamp()`.
- **Alvos de toque ≥ 44×44px**; WCAG 2.2 (2.5.8) exige no mínimo 24×24.
- Respeitar `prefers-reduced-motion`.

### 7.2 Fases

| Fase | Entrega | Critério de pronto |
|---|---|---|
| **R0 — Auditoria** | Screenshots de todas as telas em 360, 390, 768, 1024, 1440; lista de quebras | Planilha de issues por tela |
| **R1 — Fundação** | Tokens de breakpoint, `clamp()`, reset, `useMediaQuery`; fim dos estilos inline nas telas críticas | 0 scroll horizontal em 360px |
| **R2 — Shell** | Sidebar vira *drawer* abaixo de `lg` (com foco preso e `Esc`); Topbar compacta; GlobalSearch em tela cheia no mobile | Navegar todas as rotas no celular |
| **R3 — Conteúdo** | Grids de KPI `auto-fit/minmax`; gráficos SVG com `viewBox` e `width: 100%`; **tabelas viram lista de cards** abaixo de `md` (RBAC, Auditoria, PRs) | Nenhuma informação escondida ou cortada |
| **R4 — Interação** | Modais viram *bottom sheet*/tela cheia no mobile; formulários em 1 coluna; teclado virtual não cobre o botão "Salvar" | Fluxo de criar projeto completo no celular |
| **R5 — Verificação** | Playwright com 3 projetos (mobile/tablet/desktop) + screenshots; Lighthouse mobile ≥ 90 em Performance e Acessibilidade | CI verde nos 3 viewports |

Ordem das telas (impacto × uso): Login → Shell → Visão geral → Projetos → Repositórios → Auditoria → RBAC → Configurações → Landing.

---

## 8. Roadmap consolidado (ordem de execução)

Ordem definida pelo time: **limpeza → qualidade → testes → nova estrutura → Supabase**. Prazo: **18/11/2026**, 2 devs.

> ⚠️ **Alerta de Tech Lead:** o roadmap original completo (≈ 21 semanas para 1 dev) não cabe em 18 dias. O recorte abaixo prioriza o que a banca vai cobrar: **login real, dados persistidos com RLS por organização e código organizado e testado**. O que ficou de fora entra como "trabalhos futuros" no texto do TCC.

| Fase | Datas | Escopo | Pronto quando |
|---|---|---|---|
| ✅ **Limpeza** | 31/10 | Itens #1–3 e #8–12 do diagnóstico | Build ok; verificado no navegador |
| ✅ **Qualidade** | 31/10 | ESLint 9 + Prettier + Husky/lint-staged + LF; 0 erros (17 avisos de acessibilidade ficam para a nova estrutura) | `npm run lint` sem erros |
| **Testes** | 01–04/11 | Vitest + RTL (§14); casos **P0** do `TESTES.mmd`; CI no GitHub Actions | ~30 testes verdes no CI |
| **Nova estrutura** (Dev A) | 04–10/11 | `frontend/` + `backend/`; `src/` por feature; landing separada; rotas aninhadas; CSS Modules e breakpoints únicos nas telas críticas | Testes P0 verdes; sem scroll horizontal em 390px nessas telas |
| **Supabase: base** (Dev B, em paralelo) | 04–09/11 | Migrations (orgs, membros, profiles, projects, audit), RLS, Auth com cadastro, seed | Testes pgTAP de RLS verdes |
| **Supabase: integração** | 10–14/11 | Front lendo e gravando no banco; chave do GitHub no Vault; Edge Function `github-sync`; Repositórios com dados reais | Cadastro → login → CRUD de projeto → sincronizar GitHub, em produção |
| **Folga** | 15–17/11 | Correções, deploy final, roteiro da demo | Demo ensaiada |
| 🎓 **Defesa** | 18/11 | — | — |

**Divisão sugerida para 2 devs** (a partir de "Nova estrutura"): Dev A no front (estrutura, CSS, telas) e Dev B no back (Supabase, migrations, RLS). Os dois se encontram na camada `features/*/api`.

**Fora do escopo até 18/11:** webhook e GitHub App (a sincronização é sob demanda, §4.7), Realtime, export CSV, convites, chatbot com IA, E2E completo com Playwright e responsividade das telas secundárias (Repositórios, Auditoria, RBAC, Configurações).

## 9. Skills e ferramentas de IA recomendadas

Pesquisadas com a skill **find-skills** (`npx skills find …`, catálogo [skills.sh](https://skills.sh/)). **Nenhuma foi instalada.** Aguardam sua aprovação.

| Skill | Fonte / instalações | Para quê | Comando |
|---|---|---|---|
| `supabase` | supabase/agent-skills (oficial) · 351.8K | Guia geral, segurança, Auth e RLS. Recomendada pelo próprio MCP do Supabase | `npx skills add supabase/agent-skills@supabase` |
| `supabase-postgres-best-practices` | supabase/agent-skills (oficial) · 468.2K | Schema, índices, performance de RLS | `npx skills add supabase/agent-skills@supabase-postgres-best-practices` |
| `vercel-react-best-practices` | vercel-labs (oficial) · 857.4K | Performance e padrões React. *Parte é focada em Next.js; usar só o que se aplica a SPA* | `npx skills add vercel-labs/agent-skills@vercel-react-best-practices` |
| `vercel-composition-patterns` | vercel-labs (oficial) · 429.5K | Componentização (compound components, composição) para o `shared/ui` | `npx skills add vercel-labs/agent-skills@vercel-composition-patterns` |
| `vitest` | antfu/skills · 45.3K | Autor do Vitest/Vite; configuração e padrões | `npx skills add antfu/skills@vitest` |
| `adapt` | pbakaus/impeccable · 81.7K | Adaptar UI a múltiplos viewports (fases R) | `npx skills add pbakaus/impeccable@adapt` |
| `claude-md-improver` | anthropics/claude-plugins-official · 13.3K | Manter o CLAUDE.md/AGENTS.md enxuto | `npx skills add anthropics/claude-plugins-official@claude-md-improver` |

**Já disponíveis nesta máquina e úteis aqui:** `superpowers:test-driven-development`, `superpowers:writing-plans`, `superpowers:systematic-debugging`, `frontend-design`, `andrej-karpathy-skills:karpathy-guidelines`, `code-review`, `security-review`. O conector **Supabase MCP** também já está ligado (migrations, advisors, geração de tipos).

> Instalar **por projeto** (sem `-g`) para o time compartilhar a mesma versão. Antes de instalar, revisar o `SKILL.md` de cada uma: skill é instrução executada pela IA, então é superfície de ataque (*supply chain*).

---

## 10. Baixo consumo de tokens, alta entrega

### 10.1 O que já mudei na proposta para economizar
- **`AGENTS.md` curto (≈100 linhas)** na raiz ([`AGENTS.md`](../AGENTS.md)). Ele é lido **em toda mensagem**: cada linha custa tokens para sempre. Detalhes ficam em docs linkados e só são lidos quando necessário (*progressive disclosure*).
- **Apagar código morto** (F0) também economiza: a IA para de ler e raciocinar sobre arquivos que não importam.
- **Estrutura por feature:** uma tarefa em "projetos" pede para ler 1 pasta, não o repo inteiro.

### 10.2 Hábitos que mais fazem diferença (do maior para o menor impacto)

| # | Hábito | Por quê |
|---|---|---|
| 1 | **`/clear` ao trocar de assunto.** Uma conversa = uma tarefa | Todo o histórico é reenviado a cada mensagem; contexto velho é custo puro |
| 2 | **Escolher o modelo pela tarefa** (`/model`): Sonnet/Haiku para tarefas rotineiras (renomear, escrever testes de um padrão já definido, CSS); Opus para arquitetura e bugs difíceis | Diferença de custo de várias vezes por token |
| 3 | **Planejar antes de executar** (Plan mode / pedir "só o plano") | Corrigir um plano custa centenas de tokens; desfazer código custa milhares |
| 4 | **Prompts com endereço:** "em `@pages/ProjectsPage.jsx` linhas 160–180, o contador X…" e não "a página de projetos está estranha" | Evita a IA varrer o projeto para achar o lugar |
| 5 | **Critério de pronto no prompt:** "pronto quando `npm run test:run` passar" | A IA para no ponto certo, sem idas e vindas |
| 6 | **`/compact <foco>` cedo**, não quando o contexto já está cheio. Ex.: `/compact manter só decisões do schema` | Resumo guiado preserva o que importa |
| 7 | **`/context` e `/usage`** para ver onde os tokens estão indo | Medir antes de otimizar |
| 8 | **Desligar plugins/MCPs que não são deste projeto.** Hoje sua sessão carrega descrições de Gmail, Gamma, Notion, Vercel (~200 ferramentas), HyperFrames/Remotion (vídeo) etc. | Cada skill/ferramenta listada ocupa contexto em toda sessão. Para este repo bastam Supabase e, talvez, Vercel |
| 9 | **Não colar logs inteiros:** colar o erro + 10 linhas, ou pedir para a IA rodar `npm test 2>&1 \| tail -30` | Logs são os maiores "comedores" de contexto |
| 10 | **Pedir respostas curtas quando basta:** "responda em até 5 linhas", "só o diff" | Saída também é token (e mais cara que entrada) |
| 11 | **Subagentes para explorações amplas** ("ache todos os usos de X") | O resultado volta resumido e o contexto principal fica limpo. Use com moderação: subagente também consome |
| 12 | **Bloquear leitura de pastas inúteis** em `.claude/settings.json` | Evita leituras acidentais de `dist/` e `node_modules/` |

```json
// .claude/settings.json (proposta)
{
  "permissions": {
    "deny": ["Read(./node_modules/**)", "Read(./dist/**)", "Read(./package-lock.json)"]
  }
}
```

### 10.3 Feedback direto sobre o seu prompt de hoje
- ✅ **Bom:** pediu tudo de uma vez (uma única leitura do código serviu para tudo), deu o papel ("Tech Lead") e exigiu aprovação.
- ⚠️ **Melhorável:** faltou dizer **prazo do TCC**, **quem lê** os documentos (você, a banca, o time?) e **formato/tamanho esperado**. Isso me obrigou a assumir escopo. Um template rápido:

```
Contexto: <1 linha>     Objetivo: <resultado verificável>
Arquivos: @a @b         Restrições: <o que não mudar>
Pronto quando: <teste/comando>   Formato: <tamanho/estilo da resposta>
```

---

## 11. Checklist de aprovação

- [x] **A.** Respostas Q1–Q13 (§2)
- [x] **Limpeza**: itens 1, 2, 3, 8, 9, 10, 11 e 12 aplicados
- [x] **Qualidade**: lint, formatação e Husky (§13), aplicados
- [x] **Testes**: dependências, configuração, CI e testes P0 (§14)
- [x] **Bug do prazo** (§14.5): `getProjectStatus` corrigido
- [x] **B/C.** Arquitetura e modelo de dados ajustados às decisões (§3–§4)
- [x] **E.** Estrutura `frontend/` + `backend/` (§5.1)
- [x] **G.** Stack e metas de testes (§6 + `TESTES.mmd`)
- [x] **H.** Responsividade recortada às telas críticas (§7 e §8)
- [x] **I.** Roadmap com prazo de 18/11 (§8)
- [x] **J.** Skills instaladas no projeto: `supabase`, `supabase-postgres-best-practices`, `vitest`
- [x] **K.** `AGENTS.md` / `CLAUDE.md`: aprovados e movidos para a raiz

## 12. Referências

**Oficiais**
- Supabase: [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) · [RLS performance](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv) · [Local development / CLI](https://supabase.com/docs/guides/local-development) · [Testing (pgTAP)](https://supabase.com/docs/guides/database/testing) · [API keys](https://supabase.com/docs/guides/api/api-keys) · [AI skills](https://supabase.com/docs/guides/getting-started/ai-skills.md)
- Claude Code: [Memory / CLAUDE.md](https://docs.anthropic.com/en/docs/claude-code/memory) · [Costs](https://docs.anthropic.com/en/docs/claude-code/costs)
- [AGENTS.md (especificação aberta)](https://agents.md/)
- [Vitest](https://vitest.dev/) · [Testing Library](https://testing-library.com/docs/react-testing-library/intro/) · [MSW](https://mswjs.io/) · [Playwright](https://playwright.dev/) · [TanStack Query](https://tanstack.com/query/latest)
- [WCAG 2.2 — Target Size (2.5.8)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) · [MDN: Container queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries)
- Kent C. Dodds: [The Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)

**Comunidade (consultadas nesta pesquisa; usar como apoio, não como fonte primária)**
- CLAUDE.md: [Danny Willems — Memory system](https://dannywillems.github.io/2026/01/16/claude-code-memory-system.html) · [memx — best practices](https://memx.app/blog/claude-md-best-practices/) · [LowCode Agency — guia](https://www.lowcode.agency/blog/claude-md-guide)
- Tokens: [KDnuggets — 7 formas de reduzir tokens](https://www.kdnuggets.com/7-practical-ways-to-reduce-claude-code-token-usage) · [MindStudio — token management](https://www.mindstudio.ai/blog/how-to-manage-claude-code-token-usage) · [DEV — 9 ways](https://dev.to/developer_harsh/9-ways-to-cut-token-consumption-in-claude-code-3jpd)
- Supabase: [Leanware — best practices](https://leanware.co/insights/supabase-best-practices) · [DEV — do dashboard ao git](https://dev.to/simicdev/supabase-workflows-from-dashboard-to-git-based-development-4080)
- Testes: [DEV — Vitest + MSW + Playwright](https://dev.to/juan_deto/configure-vitest-msw-and-playwright-in-a-react-project-with-vite-and-ts-1d92) · [MSW + Testing Library](https://helpmetest.com/blog/msw-react-testing-library/)
- AGENTS.md: [DEV — novo padrão](https://dev.to/webdevtodayjason/agentsmd-a-new-standard-for-coding-agents-4jcm) · [mdskills — spec](https://www.mdskills.ai/specs/agents-md)

---

## 13. Qualidade: lint e formatação (✅ aprovado e aplicado em 31/10/2026)

Aplicado como proposto, com dois ajustes: `.prettierignore` (não reformatar `.md`/`.mmd`) e a ordem dos commits (correções antes da formatação, porque o hook do Husky barra commits com erro de lint).

### 13.1 Dependências (dev), versões conferidas no npm em 31/10/2026

| Pacote | Versão | Para quê |
|---|---|---|
| `eslint` | 9.39.5 | Analisador. **Fica no 9**: `eslint-plugin-react` e `jsx-a11y` ainda não suportam o ESLint 10 |
| `@eslint/js` | 9.39.5 | Regras recomendadas de JavaScript |
| `eslint-plugin-react` | 7.37.5 | Regras de JSX/React |
| `eslint-plugin-react-hooks` | 7.1.1 | Regras dos hooks (evita bugs de `useEffect`) |
| `eslint-plugin-react-refresh` | 0.5.7 | Avisa quando um arquivo quebra o hot reload do Vite |
| `eslint-plugin-jsx-a11y` | 6.10.2 | Acessibilidade |
| `globals` | 17.13.0 | Variáveis globais do navegador |
| `prettier` | 3.9.10 | Formatação automática |
| `eslint-config-prettier` | 10.1.8 | Desliga regras do ESLint que brigam com o Prettier |

Opcional, recomendado para 2 devs: `husky` 9.1.7 + `lint-staged` 17.6.0, que rodam lint e formatação só nos arquivos alterados, a cada commit.

### 13.2 Arquivos que serão criados

`eslint.config.js`
```js
import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import prettier from 'eslint-config-prettier'

export default [
  { ignores: ['dist', 'node_modules'] },
  js.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  reactHooks.configs.flat.recommended,
  jsxA11y.flatConfigs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
    },
    settings: { react: { version: 'detect' } },
    plugins: { 'react-refresh': reactRefresh },
    rules: {
      'react/prop-types': 'off',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'no-console': ['warn', { allow: ['error'] }],
      'no-unused-vars': ['error', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
    },
  },
  prettier,
]
```

`.prettierrc`: segue o estilo que o código já usa (sem ponto e vírgula, aspas simples)
```json
{ "semi": false, "singleQuote": true, "trailingComma": "all", "printWidth": 100 }
```

`.editorconfig` e `.gitattributes`: padronizam o final de linha em LF. Hoje o git avisa sobre conversão LF/CRLF em vários arquivos; com 2 devs isso vira diffs falsos.
```
# .gitattributes
* text=auto eol=lf
```

Scripts no `package.json`:
```json
"lint": "eslint .",
"lint:fix": "eslint . --fix",
"format": "prettier --write .",
"format:check": "prettier --check ."
```

### 13.3 Como será aplicado (3 commits separados)
1. `chore: add eslint and prettier`: só configuração e dependências.
2. `style: format codebase with prettier`: formatação automática do repositório inteiro, **sem nenhuma mudança de lógica**, para não misturar com o resto.
3. `fix: resolve lint errors`: correções apontadas pelo lint, revisadas uma a uma. Problemas de acessibilidade em massa (ex.: `div` clicável) ficam como aviso e vão para a fase de nova estrutura.

---

## 14. Testes (✅ aprovado e aplicado em 01/11/2026)

Aplicado como proposto na branch `test/setup`: 32 testes verdes (4 deles expuseram o bug da §14.5, já corrigido). O CI roda em push na `main` e em todo PR (não em todo push, para não rodar duas vezes no mesmo commit). Versões conferidas no npm em 31/10/2026.

### 14.1 Dependências (dev)

| Pacote | Versão | Para quê |
|---|---|---|
| `vitest` | 5.0.5 | Executor de testes (usa a config do Vite; aceita o Vite 6.4 do projeto) |
| `@vitest/coverage-v8` | 5.0.5 | Relatório de cobertura |
| `jsdom` | 30.1.3 | "Navegador falso" para renderizar componentes |
| `@testing-library/react` | 16.3.3 | Renderizar e consultar componentes como o usuário vê |
| `@testing-library/dom` | 10.4.2 | Dependência obrigatória do anterior |
| `@testing-library/user-event` | 14.6.8 | Simular digitação e cliques reais |
| `@testing-library/jest-dom` | 7.0.1 | Asserções como `toBeInTheDocument()` |

**MSW** (mock de rede) fica para a fase Supabase, quando houver chamadas HTTP; hoje não existe nenhuma.

Requisito novo: **Node 22.12 ou superior** (exigência do Vitest 5). Será registrado em `"engines"` no `package.json`, para o outro dev ser avisado.

### 14.2 Arquivos

`vite.config.js` ganha o bloco `test`:
```js
test: {
  environment: 'jsdom',
  setupFiles: ['./test/setup.js'],
  coverage: { provider: 'v8', include: ['utils/**', 'hooks/**', 'components/**', 'pages/**'] },
},
```

`test/setup.js`:
```js
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
  localStorage.clear()
})
```

`test/renderWithRouter.jsx`: helper que renderiza um componente dentro de `MemoryRouter`, para testar navegação.

Scripts: `"test": "vitest"`, `"test:run": "vitest run"`, `"test:coverage": "vitest run --coverage"`. O `lint-staged` **não** roda testes (deixaria o commit lento); quem barra é o CI.

`.github/workflows/ci.yml`: em todo push e PR roda `npm ci` → `lint` → `test:run` → `build`, com Node 22.

### 14.3 Testes que serão escritos (P0 do `TESTES.mmd`)

| Arquivo | Casos |
|---|---|
| `utils/__tests__/projectUtils.test.js` | `getProjectStatus`: sem prazo, prazo inválido, atrasado, vence hoje, 7 e 8 dias (com `vi.setSystemTime`). `normalizeProject`: nome vazio, prioridade e status inválidos, progresso fora da faixa, repositórios. `formatProjectDate` |
| `utils/__tests__/storageUtils.test.js` | Vazio → mock; JSON corrompido; não-array; **regressão: grava em `govtech:projects`, nunca em `undefined`** |
| `pages/__tests__/ProjectsPage.test.jsx` | Lista e contadores; criar (com status); editar; excluir e cancelar exclusão |
| `__tests__/App.test.jsx` | Uma única sidebar na Visão geral (regressão do bug #1); a sidebar navega para a rota certa; projeto criado persiste após remontar |

Os testes são escritos **sobre o código atual, antes da nova estrutura**. São eles que garantem que mover arquivos não quebrou nada.

### 14.4 Commits
1. `chore: add vitest and testing library`: dependências, configuração e CI.
2. `test: add P0 tests for project rules and storage`.
3. `test: add P0 tests for projects page and navigation`.

### 14.5 Bug encontrado pelos testes: contagem de dias do prazo (✅ corrigido em 01/11/2026)

`getProjectStatus` conta o prazo até 23:59:59 do dia final e arredonda para cima, então **toda contagem sai com um dia a mais**:

| Prazo | Hoje mostra | Deveria mostrar |
|---|---|---|
| ontem | "Deadline vence hoje" (Atenção) | "Atrasado há 1 dia(s)" (Risco) |
| hoje | "1 dia(s) restante(s)" | "Deadline vence hoje" |
| daqui a 7 dias | 8 dias, "No prazo" | 7 dias, "Atenção" |

Os 4 casos estão em `utils/__tests__/projectUtils.test.js` marcados com `it.fails`. **Correção proposta:** comparar as duas datas à meia-noite (prazo com `T00:00:00` em vez de `T23:59:59`) e usar `Math.round`; depois tirar o `.fails` dos 4 testes. Mudança de 2 linhas.

---

## 15. Nova estrutura (✅ concluída em 01/11/2026)

**Aprovada integralmente em 01/11**, com as recomendações da 15.7. O andamento fica registrado na 15.9. Detalha os passos 3 a 6 da §5.4 para a janela de 04 a 10/11 (Dev A). Como a fase Testes terminou antes, dá para começar já em 02/11.

### 15.1 Princípios
- **Mover não muda lógica.** Commits de movimentação só trocam caminhos (`git mv` + ajuste de `import`). Assim o Git mantém o histórico de cada arquivo e a revisão fica trivial.
- **Os 32 testes são a rede de segurança.** Cada commit precisa de `lint`, `test:run` e `build` verdes (o CI barra o PR se não estiverem). Os testes mudam de pasta junto com o código, mas o conteúdo deles não muda nos commits de movimentação.
- **Um PR por etapa**, revisado pelo Dev B, para os dois saberem onde cada coisa ficou.

### 15.2 Etapa 1: separar `frontend/` (PR `refactor/frontend-folder`)

Tudo o que é do app vai para `frontend/`, inclusive o `package.json`. Na raiz ficam só `docs/`, `AGENTS.md`, `CLAUDE.md`, `.github/`, `.gitattributes`, `.editorconfig`, `.claude/` e um `README.md` novo. O `backend/` é criado na fase Supabase pelo `supabase init` (Dev B).

| Ajuste obrigatório no mesmo commit | Por quê |
|---|---|
| `prepare: "cd .. && husky frontend/.husky"` e hook com `cd frontend && npx lint-staged` | O Husky precisa achar a pasta `.git`, que fica na raiz |
| CI com `working-directory: frontend` e cache do `frontend/package-lock.json` | Os comandos `npm` passam a rodar dentro de `frontend/` |
| **Vercel: Root Directory = `frontend`** (painel do projeto ou MCP da Vercel) | Senão o próximo deploy não acha o `package.json` |

Commits: (1) `git mv` + os ajustes acima (sem eles nem o hook do commit roda); (2) `README.md` na raiz explicando a estrutura e os comandos.

### 15.3 Etapa 2: `src/` organizado por feature (PR `refactor/src-features`)

| Hoje | Vai para `frontend/src/` |
|---|---|
| `main.jsx` | `main.jsx` |
| `App.jsx` | `app/App.jsx` |
| `pages/LandingPage.jsx` | `landing/LandingPage.jsx` |
| `pages/LoginPage.jsx` | `features/auth/LoginPage.jsx` |
| `pages/OverviewPage.jsx`, `components/dashboard/*` | `features/dashboard/` (página + `components/`) |
| `pages/ProjectsPage.jsx`, `components/projects/*`, `utils/storageUtils.js` | `features/projects/` (página, `components/`, `utils/`) |
| `pages/RepositoriesPage.jsx`, `components/repositories/*` | `features/repositories/` |
| `pages/AuditPage.jsx` | `features/audit/` |
| `pages/RbacPage.jsx`, `components/rbac/*` | `features/rbac/` |
| `pages/SettingsPage.jsx` | `features/settings/` |
| `components/layout/*` (Sidebar, Topbar, GlobalSearch) + `components/common/ChatbotModal.jsx` | `shared/layout/` |
| `components/common/*` (Brand, Icon, ModalShell, StatCard, StatusBadge, Toast) | `shared/ui/` |
| `hooks/*` | `shared/hooks/` |
| `utils/projectUtils.js`, `constants/*` | `shared/lib/` e `shared/constants/` (ver 15.7 item 3) |
| `data/mockData.js` | `mocks/mockData.js` |
| `tokens.css`, `index.css`, `app.css` | `styles/` |
| `test/*` | `test/` |
| `__tests__` de cada pasta | `__tests__` ao lado do código que testam |

Commits: (1) `git mv` + correção dos caminhos relativos; (2) alias `@/` → `src/` no `vite.config.js` e troca dos `../../` por `@/`; (3) regra `no-restricted-imports` do ESLint para as regras de dependência da §5.1 (feature não importa outra feature; `shared/` não importa `features/`). Nenhuma dependência nova.

### 15.4 Etapa 3: navegação e providers (PR `refactor/app-shell`)
- **Rotas aninhadas:** um `AppLayout` com `<Outlet>` no lugar das 6 rotas que repetem o layout e do `if` por seção no `App.jsx`. A Landing com `lazy()`, para não pesar no carregamento do sistema.
- **`ToastProvider` + `useToast()`** no lugar da prop `onToast` e do toast com `style={{}}` dentro do `App.jsx` (reaproveita o `Toast.jsx`).
- **Bug pendente: a busca global nunca abre** (o App renderiza `GlobalSearch` sem props e o botão da Topbar chama uma função vazia). Começa por um teste que falha, como manda o AGENTS.md.

### 15.5 Etapa 4: `shared/ui`, CSS Modules e responsividade (1 PR por tela)
- Componentes de `shared/ui`: `Button`, `Modal` (foco preso, `Esc`, `aria-modal`, vira *sheet* no mobile), `Badge`, `Card`, `Field`, `ProgressBar`. O `Modal` e o `Button` resolvem a maior parte dos 17 avisos de acessibilidade.
- **Telas críticas até 18/11** (as da demo): layout (Sidebar/Topbar), Login, Visão geral e Projetos. Cada uma sai do `style={{}}` para CSS Module e fica sem rolagem horizontal em 390 px.
- **Depois de 18/11, se sobrar tempo:** Configurações, RBAC, Auditoria, Repositórios e Landing. Elas continuam funcionando com o CSS global atual.

### 15.6 Etapa 5: camada de dados de Projetos (PR `refactor/projects-api`)
- `features/projects/api/projectsApi.js`: hoje lê e grava no localStorage; na fase Supabase só o conteúdo deste arquivo muda.
- Hooks `useProjects`, `useCreateProject`, `useUpdateProject`, `useDeleteProject` com **TanStack Query** (dependência nova, ver 15.7 item 4). Acaba o `projectList` passado de mão em mão pelo `App.jsx`.
- Os testes de Projetos passam a mockar o `projectsApi`, não o localStorage.

### 15.7 Decisões para aprovar

| # | Decisão | Recomendação | Motivo |
|---|---|---|---|
| 1 | `package.json` dentro de `frontend/` | **Sim** | Front e back independentes, como você pediu; o Husky continua funcionando com o ajuste da 15.2 |
| 2 | Quem troca o Root Directory da Vercel | **Eu, pelo MCP da Vercel, no dia do merge** (ou você no painel) | Se trocar antes do merge, o deploy da `main` quebra; depois, o próximo deploy quebra |
| 3 | `projectUtils` (status e prazo) em `shared/lib/` | **Sim** | É usado por Visão geral, Projetos e busca global; em `features/projects` quebraria a regra "feature não importa feature" |
| 4 | **TanStack Query** entra agora (etapa 5) | **Sim** | A fase Supabase só troca o conteúdo do `projectsApi`; telas e testes ficam iguais |
| 5 | **react-hook-form + zod** | **Ficam para a fase Supabase** (formulário de cadastro) | O formulário de projeto funciona; trocar agora não muda nada na demo |
| 6 | CSS Modules só nas 4 telas críticas até 18/11 | **Sim** | Cabe em 7 dias; o resto continua funcionando |
| 7 | `public/favicon.svg` | **Sim** | Corrige o 404 do favicon que aparece em todo carregamento |

### 15.8 Cronograma (Dev A)

| Data | Etapa | Pronto quando |
|---|---|---|
| 02–03/11 | 1 e 2 (mover) | CI verde; deploy da Vercel ok depois do merge |
| 04/11 | 3 (rotas, toast, busca global) | Teste da busca global verde |
| 05–08/11 | 4 (shared/ui + 4 telas) | Sem rolagem horizontal em 390 px; 0 avisos de acessibilidade nessas telas |
| 09/11 | 5 (TanStack Query) | Testes de Projetos verdes com o `projectsApi` mockado |
| 10/11 | Folga da etapa | — |

### 15.9 Registro de execução

| Data | Etapa | O que foi feito | Verificação |
|---|---|---|---|
| 01/11 | 1 | `git mv` de todo o app para `frontend/` (61 arquivos, histórico preservado). Husky: `prepare` = `cd .. && husky frontend/.husky` e hook `cd frontend && npx lint-staged`. CI com `working-directory: frontend`. `README.md` na raiz. AGENTS.md: comandos rodam em `frontend/` | lint 0 erros, 32 testes, build ok, hook rodou no próprio commit |
| 01/11 | 2 | (1) `git mv` de 50 arquivos para `frontend/src/` conforme a tabela 15.3, com script que recalcula os imports (diff só de caminhos). (2) Alias `@/` → `src/` (`vite.config.js` + `jsconfig.json` para o editor); 65 imports trocados. (3) ESLint `no-restricted-imports`: proíbe `../`, feature importando outra feature, `shared/` importando `features/`/`app/`/`landing/` e `landing/` importando o sistema. DOCUMENTACAO.md §4, §5, §6, §11.2 e §13 atualizadas | lint 0 erros, 32 testes, build ok; a regra foi testada com arquivo de prova que viola as fronteiras (3 erros esperados) |
| 01/11 | 3 | `AppLayout` com `<Outlet>` no lugar das 6 rotas repetidas e do `if` por seção; adaptadores em `src/app/routes.jsx` passam o estado do layout às páginas (saem na etapa 5). Landing com `lazy()` (pacote próprio de 20,8 kB). `ToastProvider` + `useToast()` no lugar da prop `onToast` e do toast inline; área com `role="status"`. **Bug corrigido (teste primeiro): busca global nunca abria**; agora abre pela Topbar, fecha com `Esc`/X/clique fora e, ao escolher um projeto, abre o detalhe dele em `/projects`. Favicon em `public/favicon.svg` (fim do 404) | 37 testes (2 da busca falharam antes da correção), lint 0 erros, build ok. Navegador (Edge, build de produção): 1 sidebar em 390 e 1440 px, busca → projeto aberto, landing ok, **0 erros no console**. Rolagem horizontal em 390 px continua (já existia; é a etapa 4) |

**Etapa 4: medição antes de mexer (01/11, 390 px, build de produção).** Login, Projetos, Auditoria e Configurações já estavam sem rolagem lateral. Estouravam: **Visão geral** (429 px, causa: grid com `style={{}}` e coluna mínima de 260 px, que media query não alcança) e **Landing** (485 px, menu com 3 links + botão). Em Repositórios e RBAC a tabela rola dentro do próprio quadro (a página não estoura); fica para depois de 18/11.

| Data | Etapa | O que foi feito | Verificação |
|---|---|---|---|
| 01/11 | 4a | Escala `--space-1…8` e `--font-size-*` em `tokens.css`. Visão geral migrada para `OverviewPage.module.css`, mobile-first (1 coluna; 2 colunas a partir de 1024 px; linha de projeto em grade que se reorganiza a partir de 768 px). A linha de projeto deixou de herdar `.metric-card` (o `strong` global com 28 px deixava nomes gigantes sem o inline). Cor do status por classe (`success/warning/danger`) com tokens, sem `style={{}}`. Landing: abaixo de 640 px o menu mostra só "Acessar plataforma". Primeiro teste da Visão geral (ordem por urgência e rótulos de prazo) | 39 testes, lint 0 erros, build ok. Largura em 390 px: Login, Visão geral, Projetos e Landing = 390 (antes 429 e 485). Capturas em 390 e 1440 px conferidas |

| 01/11 | 4b | **`Modal` acessível** em `shared/ui` (foco preso, `Esc`, foco volta, folha no celular) usado pelos 3 modais de Projeto e pelo de RBAC; `ModalShell` removido. Modais de Projeto em `ProjectModals.module.css`, sem `style={{}}`; o detalhe fecha enquanto a confirmação de exclusão está aberta. **Cartão de projeto acessível por teclado** (título é um botão que cobre o cartão). Seletor de workspace da Sidebar em `Sidebar.module.css` (`:hover` no lugar de `onMouseOver`), com `aria-label`/`aria-expanded`/`aria-pressed`. Topbar: `stopPropagation` morto removido, avatar e notificações com nome acessível. Chatbot: `role="dialog"`, `Esc` fecha, hover no CSS. **17 → 0 avisos**; as 4 regras de interação do `jsx-a11y` voltaram a `error` e o lint usa `--max-warnings 0` | 49 testes (novos: Modal ×5, teclado no cartão, RBAC, menu da conta, workspace, Chatbot), lint 0 avisos, build ok. Navegador: foco dentro do modal e `Esc` fecham em 390 e 1440 px; Login, Visão geral, Projetos e Landing com 390 px; 0 erros no console |

| 01/11 | 5 | `@tanstack/react-query` **5.104.5** (versão exata; a 5.105.0 tinha 6 dias de publicada). `features/projects/api/projectsApi.js` é o **único** lugar que lê/grava projetos (localStorage hoje). Hooks `useProjects`/`useCreateProject`/`useUpdateProject`/`useDeleteProject`; o `projectList` deixou de passar pelo `AppLayout`. `ProjectsPage` com estados de carregamento e erro (`role="alert"`). Testes de tela trocam a API por uma versão em memória; `projectsApi.test.js` é o contrato para a versão Supabase. Divisor da "Distribuição atual" fica em cima no celular | 55 testes, lint 0 avisos, build ok. Navegador: criar e excluir persistem após recarregar (mesma chave `govtech:projects`, dados antigos preservados); busca, modais e 390 px ok; 0 erros no console |

| 01/11 | fix | **Tablet sem menu:** a sidebar sumia abaixo de 900 px (`index.css`), mas o botão ☰ só aparecia abaixo de 760 px (`app.css`). **De 768 a 900 px (iPads em pé) não havia como abrir o menu.** Os dois passaram a usar o mesmo breakpoint, 767 px: sidebar fixa a partir de 768 px, gaveta com ☰ abaixo disso | Medido em 10 larguras (390 a 1440 px): sempre há sidebar visível ou botão ☰; sem rolagem lateral; captura em 820 px conferida |

**Escopo da etapa 4, decisão de 01/11:** `Button`, `Badge` e `Card` **não** foram extraídos. As classes globais (`primary-button`, `status-badge`, `panel`) já padronizam o visual, e trocar dezenas de usos agora não muda nada na demo nem na nota; o `Modal` era o componente que resolvia acessibilidade e celular. Continuam com `style={{}}` (pendência pós-18/11): links da Sidebar, menu da conta da Topbar, Configurações, RBAC, Auditoria, Repositórios e o corpo do Chatbot. **Pendências visuais que já existiam:** o selo de status do detalhe mostra a bolinha duas vezes; os cartões de métrica de Projetos ficam com o texto lado a lado no desktop.

**Vercel (incidente de 01/11, resolvido):** o projeto `govtech` (time `guilherme-kenzo-zanardi-onos-projects`, id `prj_Pk1wHhjaTUqhuLiQA61q5zZv3WBJ`) foi criado com Root Directory na raiz do repositório. O preview do PR #2 falhou com `sh: vite: command not found` (`exit 127`): sem `package.json` na raiz, nada foi instalado. **Correção:** Root Directory = `frontend`, aplicado pelo MCP da Vercel depois que o dono autorizou o acesso do Claude ao time. O redeploy do mesmo commit (`4a0daf2`) ficou `READY`. Atenção: até o merge do PR #2, a `main` ainda não tem `frontend/`, então um push direto na `main` falharia na Vercel.

---

## 16. Fase Supabase, primeira entrega (✅ aprovada em 01/11/2026, em execução)

Andamento no registro da §16.9. Decisões de 01/11: **o Claude executa** a fase (não o Dev B) e **não haverá Docker** (o dono do projeto preferiu não instalar; decisão revista no mesmo dia).

**Como trabalhar sem Docker (substitui o fluxo local da §4.5):**
- As migrations continuam **versionadas como arquivos** em `backend/supabase/migrations/` (fonte da verdade, revisadas no PR).
- São aplicadas no projeto **`govtech-br`** pelo MCP do Supabase (`apply_migration`), **cada uma com aprovação explícita**, como manda o CLAUDE.md.
- Os testes pgTAP rodam no próprio `govtech-br`, no SQL Editor, convertidos por `backend/supabase/scripts/to_sql_editor.py` num bloco que se desfaz sozinho: nada do que o teste cria fica no banco (ver §16.9).
- O Security Advisor (`get_advisors`) roda depois de cada migration.
- O `govtech-br` ainda não tem usuários reais, então serve como ambiente de desenvolvimento até a defesa.

### 16.1 Objetivo da primeira entrega
Cadastro → login → criar ou entrar numa organização → **CRUD de projetos no banco, isolado por organização**. Repositórios, PRs, auditoria e GitHub ficam para as entregas seguintes (16.6).

### 16.2 Ajustes no esboço da §4.3 (encontrados ao revisar)

| # | Esboço da §4.3 | Proposta | Motivo |
|---|---|---|---|
| 1 | `projects` sem `status` | `status text not null default 'success' check (status in ('success','warning','danger'))` | Status **manual** é decisão do time (Q6); sem a coluna, a regra se perde |
| 2 | `owner_id uuid` (FK para usuário) | `owner text` (nome livre), como hoje na tela | Hoje o responsável é texto livre e pode não ter conta no sistema. Pode virar FK depois sem quebrar a tela |
| 3 | `organizations.slug` | **removido** | Nada usa; o `join_code` já identifica a organização no cadastro |
| 4 | `create_organization` / `join_organization` | Função `security definer` em `private` + "embrulho" `security invoker` em `public` (o que a API expõe) | Regra do projeto: `security definer` só em `private`; a API só enxerga `public` |
| 5 | `repositories text[]` do front | Mantido como `repositories text[]` **nesta entrega** | A tabela `repositories` nasce com a sincronização do GitHub (16.6). Evita criar uma tabela N:N que seria refeita |
| 6 | Sem `updated_at` automático | Trigger `private.set_updated_at()` | Data de alteração confiável, sem depender do front |

### 16.3 Migration `core_schema` (tabelas e regras)

| Tabela | Colunas principais | Quem lê | Quem escreve |
|---|---|---|---|
| `profiles` | `id` (= `auth.users.id`), `full_name` | O próprio usuário e colegas da mesma organização | O próprio usuário (nome). Criado por trigger no cadastro |
| `organizations` | `id`, `name`, `join_code` (8 caracteres aleatórios) | Membros | Admin (renomear e gerar novo código). Criada só pela função `create_organization` |
| `organization_members` | `organization_id`, `user_id`, `role` (`admin`/`developer`/`stakeholder`/`viewer`) | Membros da mesma organização | Admin (mudar papel, remover). Entrada só pelas funções |
| `projects` | `id`, `organization_id`, `name`, `description`, `deadline`, `owner`, `priority`, `status`, `progress`, `repositories`, `created_by`, `created_at`, `updated_at` | Membros | Inserir/editar: admin e developer. Excluir: só admin |

**Funções (RPC) chamadas pelo front:**
- `create_organization(name)`: cria a organização e coloca quem chamou como **admin**. Devolve o id.
- `join_organization(code)`: entra como **viewer**. Código inválido → erro genérico, sem dizer se a organização existe.
- `regenerate_join_code(org)`: só admin; invalida o código antigo.

**Regras de segurança aplicadas (AGENTS.md):** RLS em todas as 4 tabelas, com uma policy por operação; `(select auth.uid())` nas policies; índice em toda coluna usada em policy; funções `security definer` em `private` com `set search_path = ''`; Security Advisor rodado depois da migration.

### 16.4 Testes pgTAP (`backend/supabase/tests/`)

| Caso | Positivo | Negativo |
|---|---|---|
| Ler projetos | Membro vê os da própria organização | **Não vê** os de outra organização |
| Criar projeto | Admin e developer criam | Viewer e stakeholder **não** criam; ninguém cria em organização alheia |
| Editar projeto | Admin e developer editam | Viewer **não** edita; não dá para "mover" um projeto para outra organização |
| Excluir projeto | Admin exclui | Developer **não** exclui |
| Organização | `create_organization` torna admin | Não-membro **não** lê a organização nem o `join_code` |
| Entrar por código | Código certo → viewer | Código errado → erro; ninguém se autopromove a admin |
| Membros | Admin muda papel | Viewer **não** muda papel de ninguém (nem o próprio) |
| Perfil | Trigger cria perfil no cadastro | Usuário **não** edita perfil de outro |

### 16.5 Front-end

| Item | O que muda |
|---|---|
| Dependência | `@supabase/supabase-js` **2.118.0** (exata; 15/10/2026) |
| `shared/lib/supabase.js` | Único lugar que cria o client (`VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`); `.env.example` versionado |
| `features/auth/` | Login e cadastro reais (react-hook-form + zod, previstos no plano), `AuthProvider` e `ProtectedRoute`. Cadastro com as duas opções: **criar organização** ou **entrar com código** |
| `projectsApi.js` | As 4 funções passam a chamar o Supabase. Telas, hooks e testes de tela **não mudam** (contrato da etapa 5) |
| Testes | MSW para simular a API do Supabase nos testes de API (`onUnhandledRequest: 'error'`), como prevê o AGENTS.md |
| Vercel | As 2 variáveis públicas configuradas pelo MCP da Vercel |

**Dependências novas desta entrega (todas previstas no plano):** `@supabase/supabase-js` 2.118.0, `react-hook-form`, `zod` e `msw` (versões conferidas na hora de instalar, com pelo menos 2 semanas de publicação). O CLI do Supabase **não** é instalado: sem Docker, o MCP faz o papel dele.

### 16.6 Entregas seguintes (cada uma com proposta própria)
1. **Auditoria:** trigger `private.audit_row()` e tela de Auditoria lendo do banco (§4.4).
2. **GitHub:** chave por projeto no Vault, Edge Function `github-sync`, tabelas `repositories`/`pull_requests`/`branches` (§4.7).
3. **RBAC:** tela de membros com troca de papel e código de convite.

### 16.7 Ordem de execução (cada passo vira commit)
1. `backend/supabase/migrations/` com a migration `core_schema` e o `seed.sql` (organização demo com os 4 projetos do mock), revisados no PR.
2. **Pedir aprovação** → aplicar no `govtech-br` pelo MCP → Security Advisor.
3. Testes pgTAP no `govtech-br` (em transação com `rollback`) → todos verdes.
4. Front: client, auth, cadastro, `projectsApi` no Supabase, testes.
5. Variáveis públicas na Vercel (MCP) e teste ponta a ponta no preview do PR.

### 16.8 Riscos

| Risco | Mitigação |
|---|---|
| Sem banco local, um erro de migration atinge o `govtech-br` | Cada migration é revisada e aprovada antes; o banco ainda não tem usuários reais; testes rodam em transação com `rollback` |
| Plano gratuito pausa o projeto após 7 dias sem uso (Q11: aceito) | Acessar antes da defesa; reativar leva ~1 min |
| E-mail de confirmação do cadastro tem limite de envio no plano gratuito | Para a demo, desligar a confirmação por e-mail no projeto (decisão a aprovar no passo 5) |
| Dados do `localStorage` não migram para o banco | Esperado: o banco começa com o seed demo |

### 16.9 Registro de execução

| Passo | Resultado |
|---|---|
| 1. Migration e seed | `20261101120000_core_schema.sql`, `seed.sql` e `tests/core_rls.test.sql` (25 testes) commitados na branch `feat/supabase-core` |
| 2. Aplicar no `govtech-br` | Aplicada pelo MCP (`apply_migration`, nome `core_schema`) com aprovação. Security Advisor sem alertas |
| 3. Testes pgTAP | **25/25 ok** em 01/11/2026. Banco conferido vazio depois (0 usuários, organizações e projetos; `pgtap` não ficou instalado) |
| 4. Front | Branch `feat/supabase-frontend`: client, login, cadastro, escolha de organização, `ProtectedRoute`, `projectsApi` no Supabase, MSW. 64 testes, lint e build verdes. Conferido no navegador (build de produção contra o `govtech-br`): `/dashboard` sem login vai para `/login`, senha errada mostra a mensagem certa, sem rolagem horizontal em 390 e 1440 |
| 5. Vercel | `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` criadas pelo MCP (production, preview, development) |

| Ajuste pós-merge | Branch `feat/admin-join-code` (01/11/2026): o admin não tinha onde ver o código de convite. Achado no primeiro uso real, quando o código foi confundido com o nome da empresa. Agora o código aparece no menu da conta, só para admin, com botão de copiar |

**Decisões tomadas no passo 4:**
- **Versões:** `@supabase/supabase-js` 2.118.0, `react-hook-form` **7.90.0** (a 7.91.0 tinha só 9 dias), `zod` 4.6.7, `msw` 3.0.3 (dev). Os 9 alertas do `npm audit` já existiam antes e estão só nas ferramentas de lint.
- **Sem `@hookform/resolvers`:** não estava no plano, então o adaptador zod → react-hook-form virou uma função de 20 linhas em `shared/lib/zodResolver.js`.
- **Cadastro em dois passos:** primeiro a conta (nome, e-mail, senha), depois a tela `/organizacao` (criar ou entrar com código). Com a confirmação de e-mail ligada, não há sessão logo após o cadastro, e as funções do banco exigem login. Os dois passos funcionam com a confirmação ligada ou desligada, e quem fica sem organização volta sempre para essa tela.
- **Organização atual:** um projeto novo vai para a primeira organização do usuário. A troca de organização pela barra lateral (hoje com dados de exemplo) entra com a tela de membros (§16.6).
- **Erros do RLS:** editar ou excluir sem permissão não dá erro no banco, só afeta 0 linhas. A API transforma isso em “Projeto não encontrado ou sem permissão para alterá-lo.”, para a tela não mostrar sucesso falso.
- **Regra no ESLint:** só `features/*/api/` pode importar `shared/lib/supabase`.
- **Build:** `supabase-js` e os formulários vão para arquivos separados (`manualChunks`), o que tirou o aviso de pacote grande (o principal tinha passado de 326 kB para 680 kB).
- **Removidos:** `storageUtils.js` e o teste dele (gravação no localStorage, sem uso agora) e a chave `govtech:projects`.

**Pendências para o dono do projeto (painel do Supabase, Authentication):**
- **Confirmação de e-mail:** o servidor de e-mail gratuito do Supabase manda poucos e-mails por hora. Para a demo, recomendo desligar “Confirm email” (risco já previsto em §16.8).
- **URL Configuration:** “Site URL” = `https://govtech-three.vercel.app`, e em “Redirect URLs” adicionar `https://govtech-three.vercel.app/**` e `http://localhost:5173/**`. Sem isso, o link do e-mail de confirmação aponta para `localhost:3000`.

**Incidente no passo 3 (registro para o TCC):**
- O MCP do Supabase pede confirmação do usuário para `execute_sql` com UPDATE/DELETE, e essa confirmação é recusada automaticamente nesta ferramenta. Decidimos não contornar a trava. O dono do projeto passou a rodar os testes no SQL Editor.
- As duas primeiras tentativas no SQL Editor falharam com `42P01: relation does not exist`. Os resultados iam para uma tabela auxiliar (primeiro temporária, depois em `public`) criada no próprio script, e o editor analisa o script inteiro antes de executar.
- Solução: `backend/supabase/scripts/to_sql_editor.py` converte o teste num único bloco `DO`. Os resultados ficam numa variável e o bloco termina com um erro proposital que mostra o resultado e desfaz tudo. Isso é mais seguro que `rollback` manual, porque não depende do editor respeitar a transação.
- Nenhuma tentativa deixou dados no banco (conferido pelo MCP com consultas só de leitura).

---

## 17. Tela de membros (RBAC real) (✅ aprovada e aplicada em 02/11/2026)

Segunda entrega da fase Supabase (item 3 da §16.6). Registro de execução em §17.7.

### 17.1 Problema
- O visualizador vê os botões de criar, editar e excluir projeto, mas o banco recusa a ação. A tela promete o que não entrega.
- Não há como promover alguém: quem entra pelo código fica como visualizador para sempre.
- A página "Acessos e RBAC" mostra só dados de exemplo e tem botões sem função ("Nova função", "Filtrar", "Adicionar").

### 17.2 O que muda na tela

| Parte | Hoje | Proposta |
|---|---|---|
| Lista de usuários | Exemplo fixo (Marina, Ana…) | Membros reais da organização: nome, e-mail, papel |
| Trocar papel | Não existe | Admin escolhe o papel numa lista (admin, developer, stakeholder, viewer) |
| Remover membro | Não existe | Admin remove, com confirmação. Qualquer um pode **sair** da organização |
| Convidar | Botão sem função | "Convidar" abre o código com botão de copiar e, para o admin, **gerar novo código** (o antigo para de valer) |
| Papéis e permissões | Cartões com descrições inventadas | Mantidos, com o texto do que cada papel **realmente** pode fazer |
| "Nova função", "Filtrar", "Adicionar" | Sem função | **Removidos** (papéis são fixos; adicionar é pelo código) |
| Colunas "Time", "Status", "Último acesso" | Valores inventados | **Removidas** (sem dado real; regra de não inventar métricas) |
| Projetos | Todos veem os botões | Viewer e stakeholder **não** veem criar, editar nem excluir; developer não vê excluir |

**Quem é membro e não admin** vê a lista em modo leitura.

### 17.3 Banco (migration nova `members`)
1. **E-mail no perfil:** coluna `profiles.email`, preenchida pelo trigger de cadastro, com cópia dos usuários que já existem. Só colegas da mesma organização veem (policy atual), e ninguém edita pelo app. *Motivo:* o e-mail fica em `auth.users`, que o app não pode ler. O e-mail está entre os dados pessoais aprovados (Q13).
2. **A organização nunca fica sem admin:** um trigger impede rebaixar ou remover o **último** admin, com a mensagem "A organização precisa de pelo menos um administrador.". Apagar a organização inteira continua funcionando.
3. **pgTAP:** 6 testes novos (positivo e negativo): colega vê o e-mail, outra organização não vê; último admin não se rebaixa nem sai; com dois admins, um pode sair; usuário não altera o próprio e-mail; apagar a organização leva os membros junto.

### 17.4 Front
- `features/rbac/api/membersApi.js`: listar membros, trocar papel, remover, gerar novo código. Hooks com TanStack Query.
- O papel do usuário chega às páginas pelos adaptadores de `app/routes.jsx`, porque uma feature não importa outra.
- Testes com MSW: admin troca papel, viewer não vê os controles, último admin recebe o erro, botões de projeto por papel.

### 17.5 Fora desta entrega
- Convite por e-mail (precisa de serviço de e-mail; o código resolve).
- Trocar de organização pela barra lateral (quem está em mais de uma usa a primeira).
- "Último acesso" real (precisa ler `auth.users`; fica para depois, se houver tempo).

### 17.6 Estimativa
1 a 2 dias: migration + pgTAP (meio dia), tela de membros (1 dia), botões por papel nos projetos (meio dia).

### 17.7 Registro de execução

| Passo | Resultado |
|---|---|
| Migration `members` | `20261102120000_members.sql` aplicada no `govtech-br` pelo MCP, com aprovação. Os 2 perfis existentes ganharam o e-mail. Security Advisor: só o aviso de configuração "Leaked Password Protection" do Auth, que não tem relação com a migration |
| pgTAP | `members.test.sql` **8/8 ok** e `core_rls.test.sql` **25/25 ok** (regressão), rodados no SQL Editor. Banco conferido limpo depois |
| Front | Tela de membros, convite, botões de projeto por papel. **74 testes** (+10), lint e build verdes. Mocks `accessRoles` e `rbacUsers` removidos |

**Ajuste antes de aplicar:** o trigger `keep_one_admin` devolvia `coalesce(new, old)`; virou um retorno explícito por operação (`old` no DELETE, `new` no UPDATE), mais claro de ler.

**Ocorrência (registro para o TCC):** entre a criação da Porto e a aplicação da migration, a conta de visualizador saiu da organização. Os logs da API não mostram nenhuma exclusão feita pelo app. Os logs do Postgres mostram a tabela `organization_members` aberta no Table Editor do painel, então a hipótese mais provável é uma remoção manual por engano (as duas contas aparecem com o mesmo nome). Não houve perda de dados: a conta entra de novo com o código. Isso reforça duas coisas: a regra de **não editar o banco pelo painel** (AGENTS.md) e a próxima entrega, **auditoria**, que registraria quem removeu e quando.

---

## 18. Integração com o GitHub (✅ aprovada e aplicada em 02/11/2026)

Terceira entrega da fase Supabase. Detalha a §4.7 e passa na frente da auditoria por decisão de 02/11/2026. Decisões G1–G4 aprovadas como recomendado (G5 segue a regra de não inventar dados). Registro em §18.8.

### 18.1 Como funciona para o usuário
1. O **admin** abre um projeto e, na seção **GitHub**, cola uma chave do GitHub (*fine-grained token*, só leitura).
2. O sistema testa a chave no GitHub antes de guardar. Se for inválida, avisa na hora. Se funcionar, guarda no cofre (Vault) e mostra só os 4 últimos caracteres.
3. **Quais repositórios:** os que a própria chave libera. Quem cria a chave escolhe os repositórios no GitHub, e o sistema não pede nomes.
4. **Sincronizar:** um botão traz do GitHub os repositórios, os PRs (os 100 mais recentes por repositório) e as branches. Não há atualização automática (sem webhook, como na §4.7).
5. A página **Repositórios** passa a mostrar esses dados reais, com filtro por projeto. Todos os membros veem.

### 18.2 Decisões para aprovar

| # | Pergunta | Recomendação | Motivo |
|---|---|---|---|
| G1 | Quais repositórios entram | **Os que a chave libera** | Não precisa digitar nomes nem tratar nome errado; a permissão fica no GitHub |
| G2 | Quem pode sincronizar | **Admin e developer** | O developer mantém os projetos (já edita); o viewer só lê |
| G3 | Campo "Repositórios" (texto livre) do formulário de projeto | **Sai**, e a coluna `projects.repositories` é removida | Os repositórios passam a vir do GitHub; dois lugares para a mesma informação confundem |
| G4 | Repositório de demonstração | **O próprio `oguilhermekenzo/govtech`** | Tem PRs e branches reais deste TCC; a banca vê o sistema monitorando o próprio desenvolvimento |
| G5 | Colunas que o GitHub não fornece fácil ("Pipeline", "Revisores", "Proteção") | **Saem** desta entrega | Regra de não inventar dados; o status do CI pode voltar depois |

### 18.3 Banco (migration `github`)

| Tabela | Colunas principais | Quem lê | Quem escreve |
|---|---|---|---|
| `github_credentials` | `project_id` (PK), `organization_id`, `secret_id` (Vault), `token_last4`, `github_login`, `last_synced_at`, `created_by` | Membros (sem o segredo) | **Só a Edge Function** |
| `repositories` | `project_id`, `organization_id`, `github_id`, `full_name`, `description`, `language`, `default_branch`, `html_url`, `private`, `pushed_at` | Membros | **Só a Edge Function** |
| `pull_requests` | `repository_id`, `organization_id`, `number`, `title`, `state` (open/closed/merged), `draft`, `author_login`, `html_url`, `created_at_github`, `updated_at_github`, `merged_at` | Membros | **Só a Edge Function** |
| `branches` | `repository_id`, `organization_id`, `name`, `last_commit_sha`, `protected` | Membros | **Só a Edge Function** |

- **RLS:** select para membros da organização (com índice em `organization_id`). **Nenhuma** policy de escrita para o front. Quem escreve é a Edge Function, com a chave de serviço, que só existe no servidor.
- **Segredo:** fica no `vault.secrets`, criptografado. As funções que gravam e leem do Vault ficam em `private` e só a chave de serviço executa. **Nenhum caminho devolve a chave ao navegador.**
- **Remover a chave** apaga o segredo do Vault e os dados sincronizados do projeto.
- **pgTAP:** membro lê os dados da própria organização e não lê os de outra; ninguém logado escreve nas 4 tabelas; ninguém logado lê o segredo nem chama as funções do Vault.

### 18.4 Edge Function `github` (JavaScript, sem TypeScript)
Uma função com três ações. Todas conferem o login (JWT) e o papel do usuário **no banco** antes de agir:

| Ação | Quem | O que faz |
|---|---|---|
| `connect` | Admin | Testa a chave (`GET /user` e lista de repositórios). Se funcionar, grava no Vault e salva o `token_last4` |
| `sync` | Admin e developer | Lê a chave do Vault e busca repositórios, PRs e branches. Grava (upsert) e apaga o que não existe mais no GitHub. Atualiza `last_synced_at` |
| `disconnect` | Admin | Apaga o segredo e os dados sincronizados do projeto |

- **Limites:** 100 repositórios por chave, 100 PRs e 100 branches por repositório (uma página da API). Dá umas 200 chamadas por sincronização, longe do limite do GitHub (5.000 por hora).
- **Erros em pt-BR:** chave inválida ou expirada, sem permissão, GitHub fora do ar, limite atingido.
- **Testes:** a lógica de conversão (resposta do GitHub → linhas do banco) fica num módulo separado, testado com `node --test`, que já vem no Node 22 (sem dependência nova). O CI roda esses testes.
- **Deploy:** pelo MCP do Supabase (`deploy_edge_function`), **com aprovação**, como as migrations.

### 18.5 Front
- `features/repositories/api/githubApi.js`: conectar, sincronizar e desconectar (pela Edge Function), além de listar repositórios, PRs e branches (pelo banco).
- **Projeto (detalhe):** seção GitHub com a situação (conectada `••••abcd` por `login`, última sincronização) e os botões Conectar, Trocar, Remover e Sincronizar, conforme o papel.
- **Repositórios:** as três listas com dados reais, filtro por projeto e um aviso quando nada estiver conectado.
- **Testes com MSW:** a Edge Function e as tabelas simuladas, cobrindo a chave inválida, a sincronização e os botões por papel.
- Os gráficos de PR do painel (Visão geral) **continuam com dados de exemplo** nesta entrega; passam para dados reais na entrega seguinte, se der tempo.

### 18.6 Fora desta entrega
- Webhook ou GitHub App (atualização automática).
- Status do CI e revisores dos PRs.
- Gráficos do painel com dados reais (próxima entrega).

### 18.7 Estimativa e o que preciso de você
3 a 4 dias: migration e pgTAP (1 dia), Edge Function (1 dia), front (1 a 2 dias). Termina por volta de 06/11, deixando folga até 18/11.

**De você:** criar uma chave *fine-grained* no GitHub para o repositório de demonstração (passo a passo na hora) e colar **na tela do sistema**. A chave **nunca** deve ser colada no chat nem no código.

### 18.8 Registro de execução

| Passo | Resultado |
|---|---|
| Migration `github` | O MCP **recusou** aplicar (a confirmação de SQL com `delete` é recusada automaticamente). O dono do projeto rodou o arquivo versionado no SQL Editor ("Success"); a versão foi registrada no histórico pelo MCP. Security Advisor: sem alertas novos |
| Migration `drop_project_repositories` | **Separada de propósito** e ainda **não aplicada**: o site em produção lê `projects.repositories` até o merge do front. Aplicar logo depois do merge |
| pgTAP | `github.test.sql` **15/15 ok**. Banco conferido depois: Vault vazio, sem usuários de teste, sem `pgtap` |
| Edge Function | `github` publicada pelo MCP (versão 1, `verify_jwt` ligado). Lógica do GitHub com 9 testes `node --test`, que entraram no CI (job `edge-functions`) |
| Front | Seção GitHub no detalhe do projeto, página Repositórios com dados reais, filtro por projeto e métricas calculadas. **86 testes** (+12, −1 do campo removido), lint e build verdes |

**Decisões tomadas na execução:**
- **Ordem do deploy:** a remoção da coluna `projects.repositories` virou uma migration à parte, para não quebrar o site em produção entre a migration e o merge.
- **Casamento repositório ↔ id:** o upsert não garante a ordem das linhas devolvidas, então a sincronização casa cada repositório pelo `github_id`.
- **Erro de chave = HTTP 400**, não 401: o front poderia confundir com sessão expirada.
- **Sem `@supabase/server`:** a Edge Function usa o mesmo `supabase-js` 2.118.0 do front, para não trazer dependência nova.
- **`shared/lib/date.js`** criado (o AGENTS.md já pedia): `timeAgo`, `formatDuration`.
- **Ainda com dados de exemplo:** gráficos de PR da Visão geral e a busca global (repositórios e branches), por estarem fora do escopo desta entrega.
