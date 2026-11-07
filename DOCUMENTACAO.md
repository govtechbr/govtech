# GovTech — Documentação do Projeto

Plataforma web de **governança de projetos de TI**. Ela lê os dados do GitHub de cada projeto (Pull Requests, branches, commits e execuções do CI), calcula **alertas, status e um Índice de Governança**, liga os projetos aos **objetivos estratégicos** da empresa e mostra **evidências por área de processo** (CMMI/ISO 12207). Tem ainda auditoria, controle de acesso por papel e um assistente com IA.

> **Resumo para quem não é da área de front-end:** o app roda no navegador e usa o **Supabase** como back-end (banco Postgres, login, regras de acesso, cofre de segredos e funções no servidor). **Quase tudo é dado real**: login, empresas, membros, projetos, dados do GitHub, métricas, alertas, índice, auditoria, estratégia e processos. As exceções estão na seção [Limitações conhecidas](#15-limitações-conhecidas): as abas Notificações e Segurança de Configurações e o sino do topo estão **em desenvolvimento**, e as configurações da aba Geral ficam só no navegador.

Documentos complementares (a regra do produto nunca fica só aqui):

| Arquivo | O que tem |
|---|---|
| `docs/REGRAS_DE_NEGOCIO.md` | **Fonte única** das regras do produto (papéis, GitHub, métricas, índice, alertas, auditoria, estratégia, processos). |
| `docs/PLANO_TECNICO.md` | Plano geral, arquitetura e decisões. |
| `docs/API.md` | Tabelas, funções RPC, Edge Functions, permissões e erros. |
| `docs/TESTES.mmd` | Mapa dos testes. |
| `docs/RELATORIO_TCC.md` | Relatório do TCC. |
| `backend/README.md` | Como o banco, as Edge Functions e os testes pgTAP funcionam e são publicados. |

---

## Índice

1. [Visão geral](#1-visão-geral)
2. [Tecnologias](#2-tecnologias)
3. [Glossário rápido](#3-glossário-rápido)
4. [Como rodar o projeto](#4-como-rodar-o-projeto)
5. [Estrutura de pastas](#5-estrutura-de-pastas)
6. [Como a aplicação inicia](#6-como-a-aplicação-inicia)
7. [Rotas e permissões](#7-rotas-e-permissões)
8. [Páginas](#8-páginas)
9. [Componentes compartilhados](#9-componentes-compartilhados)
10. [Dados, estado e armazenamento](#10-dados-estado-e-armazenamento)
11. [Regras de negócio no código](#11-regras-de-negócio-no-código)
12. [Back-end (Supabase)](#12-back-end-supabase)
13. [Testes e CI](#13-testes-e-ci)
14. [Aparência e deploy](#14-aparência-e-deploy)
15. [Limitações conhecidas](#15-limitações-conhecidas)

---

## 1. Visão geral

Uma SPA (*Single Page Application*) em **React + Vite** que conversa com o **Supabase**. Ao trocar de menu, o navegador não recarrega a página: o React troca o conteúdo.

O que o sistema faz, em ordem do fluxo de uso:

1. A pessoa **cria a conta** e **cria ou entra numa empresa** (organização) com um código de convite. Quem cria vira admin.
2. O admin **cadastra projetos** e, em cada um, **conecta uma chave do GitHub** (só leitura) e **escolhe os repositórios** do projeto.
3. O sistema **sincroniza** os dados do GitHub (manualmente ou sozinho, a cada hora).
4. Com esses dados ele **calcula** métricas, alertas, o status de cada projeto (Saudável, Atenção ou Risco) e o **Índice de Governança** (0 a 100), e **grava** a nota do dia.
5. A **Visão geral**, a **Estratégia** (objetivos da empresa) e os **Processos** (evidências CMMI) mostram esses números; a **Auditoria** registra quem fez o quê; o **Assistente com IA** responde perguntas sobre os dados.

Estado atual (verificado em novembro/2026, `main` até o PR #52):

| Item | Situação |
|---|---|
| Build, lint e testes | Passam. 27 arquivos e 222 testes no front (Vitest); 11 arquivos de teste pgTAP no banco; testes `node --test` das Edge Functions |
| Chamadas de rede | Só para o Supabase (`@supabase/supabase-js`), apenas em `features/*/api/` |
| Login | Real (Supabase Auth): e-mail e senha, com cadastro |
| Papéis | `admin`, `developer`, `stakeholder` (o `viewer` saiu em 03/11/2026) |
| Dados | No banco, protegidos por RLS. Restam só os "mocks" usados pelos testes |
| Segredos | A chave do GitHub fica criptografada no **Vault** do Supabase e nunca chega ao navegador |

---

## 2. Tecnologias

Lidas em `frontend/package.json`:

| Tecnologia | Versão | Para que serve aqui |
|---|---|---|
| **React** / **React DOM** | 18.3.x | Interface em componentes. |
| **React Router DOM** | 7.x | Rotas (`/projects` mostra Projetos sem recarregar). |
| **@tanstack/react-query** | 5.104.5 | Estado de servidor: busca, cache e atualização dos dados do Supabase. |
| **@supabase/supabase-js** | 2.118.0 | Único cliente do back-end (login, tabelas, RPC, Edge Functions). |
| **react-hook-form** + **zod** | 7.90.0 + 4.6.7 | Formulários e validação. |
| **lucide-react** | 0.468.x | Ícones, importados direto (`import { Bell } from 'lucide-react'`). |
| **Vite** | 6.x | Servidor de desenvolvimento e build. |
| **Vitest**, **Testing Library**, **MSW**, **jsdom** | 5.0.5, 16.x, 3.0.3, 30.x | Testes, com o Supabase simulado pelo MSW. |
| **ESLint**, **Prettier**, **Husky**, **lint-staged** | 9.x, 3.x, 9.x, 17.x | Qualidade: lint sem warnings, formatação e hook de pre-commit. |

CSS à mão: **CSS Modules** por componente (`*.module.css`) mais `styles/` globais com variáveis (tokens). Sem Tailwind e sem biblioteca de UI. Os gráficos são SVG desenhado à mão.

No servidor: **Supabase** (Postgres, Auth, RLS, Vault, pg_cron, pg_net e Edge Functions em Deno) e **Groq** (modelo de linguagem do assistente).

---

## 3. Glossário rápido

- **Componente**: função que devolve um pedaço de tela (`<StatCard />`).
- **JSX**: HTML dentro do JavaScript. `class` vira `className`.
- **Props**: parâmetros que um componente recebe.
- **State (estado)**: dado que, ao mudar, redesenha a tela (`useState`).
- **Hook**: função que começa com `use` e dá "superpoderes" ao componente.
- **SPA**: aplicação de página única; só existe um `index.html`.
- **Query (TanStack Query)**: uma busca de dados com **chave** (ex.: `['projects']`). O resultado fica em cache; ao **invalidar** a chave, ele busca de novo.
- **RLS (Row Level Security)**: regra do banco que decide quais linhas cada pessoa pode ver ou mudar. É ela, e não a tela, que garante a segurança.
- **RPC**: função do banco chamada pelo front (`create_organization`, `join_organization`…).
- **Edge Function**: programa que roda no servidor do Supabase (`github`, `assistant`).
- **Vault**: cofre do Supabase onde ficam os segredos criptografados.
- **pg_cron**: agendador do Postgres; dispara a sincronização do GitHub a cada hora.
- **Organização / empresa**: o "espaço" da equipe. Uma pessoa pode estar em várias.
- **Mock**: dado de exemplo. Hoje só os testes os usam.
- **Build / Deploy**: gerar os arquivos finais (`dist/`) e publicá-los (Vercel).

---

## 4. Como rodar o projeto

Pré-requisito: **Node.js 22.12 ou superior** (`node -v`). Todos os comandos `npm` rodam **dentro de `frontend/`**.

```bash
cd frontend
npm install                    # dependências + hook de pre-commit (Husky)
cp .env.example .env.local     # preencha as duas variáveis do Supabase
npm run dev                    # http://localhost:5173
```

**Variáveis** (`frontend/.env.local`): `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` (Supabase > Project Settings > API). São públicas; o acesso aos dados é controlado pelo RLS. A **secret key nunca entra no front nem no git**. Sem as variáveis, o app mostra um erro ao abrir. Na Vercel as duas já estão configuradas.

| Comando | Para quê |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` / `npm run preview` | Build de produção em `dist/` e servidor para testá-lo |
| `npm run lint` | ESLint (falha com qualquer warning) |
| `npm run format` | Prettier |
| `npm run test:run` | Testes uma vez (use este) |
| `npm test` | Testes em modo watch |
| `npm run test:coverage` | Testes com cobertura |

Os testes **não** precisam do `.env.local`. Os testes do back-end (`node --test "backend/supabase/functions/*/*.test.js"` e os pgTAP) estão descritos em `backend/README.md`. Ainda não existem comandos de e2e (Playwright) nem Docker/`supabase start` no fluxo: o banco é o projeto remoto `govtech-br` (ver §12).

---

## 5. Estrutura de pastas

Front-end e back-end são separados.

```
govtech/
├── README.md                ← Como começar.
├── AGENTS.md / CLAUDE.md    ← Regras do projeto para pessoas e agentes de IA.
├── DOCUMENTACAO.md          ← Este arquivo.
├── docs/                    ← REGRAS_DE_NEGOCIO, PLANO_TECNICO, API, TESTES.mmd, RELATORIO_TCC.
├── .github/workflows/ci.yml ← CI: lint, testes e build do front; testes das Edge Functions.
│
├── backend/
│   ├── README.md
│   └── supabase/
│       ├── migrations/      ← SQL versionado: a fonte da verdade do banco (12 migrations).
│       ├── seed.sql         ← Empresa de demonstração.
│       ├── tests/           ← Testes pgTAP das regras de acesso (11 arquivos).
│       ├── functions/       ← Edge Functions: github/ e assistant/ (com testes node).
│       └── scripts/         ← to_sql_editor.py: prepara os testes pgTAP para o SQL Editor.
│
└── frontend/                ← App React + Vite.
    ├── index.html, package.json, vite.config.js, eslint.config.js, jsconfig.json, vercel.json
    ├── public/favicon.svg
    ├── .husky/              ← Pre-commit: ESLint + Prettier nos arquivos alterados.
    └── src/
        ├── main.jsx         ← Ponto de entrada.
        ├── app/             ← App.jsx (rotas), AppLayout, routes.jsx (adaptadores), AssistantDialog, queryClient.
        ├── landing/         ← LandingPage.jsx (institucional, carregada sob demanda).
        ├── features/        ← Uma pasta por área. Uma feature NÃO importa outra.
        │   ├── auth/          Login, cadastro, organização, AuthProvider, ProtectedRoute.
        │   ├── dashboard/     Visão geral: OverviewPage, componentes, governanceApi, useGovernanceData.
        │   ├── projects/      Projetos: página, modais, GitHubPanel, RepositoryPicker, projectsApi, githubApi.
        │   ├── repositories/  Repositórios, PRs e branches (dados do GitHub).
        │   ├── strategy/      Missão, visão e objetivos estratégicos.
        │   ├── processes/     Evidências por área de processo (CMMI).
        │   ├── audit/         Trilha de auditoria.
        │   ├── rbac/          Acessos e papéis.
        │   ├── assistant/     Assistente de Governança com IA.
        │   └── settings/      Configurações.
        ├── shared/          ← O que mais de uma área usa. Não importa de features/.
        │   ├── layout/        Sidebar, Topbar, GlobalSearch, InviteCode.
        │   ├── ui/            Modal, Select, DatePicker, Tooltip, StatCard, StatusBadge, Toast, ScoreBreakdown, Brand, Icon.
        │   ├── hooks/         useCurrentOrganization, useLocalStorage, useTheme, useToast, usePopover.
        │   ├── lib/           governance, governanceScore, strategy, processes, assistantContext, projectUtils, date, supabase, zodResolver.
        │   └── constants/     colors, defaultSettings, projectStatus, storageKeys.
        ├── mocks/           ← mockData.js: dados de exemplo (hoje só os testes usam).
        ├── styles/          ← tokens.css (variáveis), index.css (global + tema escuro), app.css (telas).
        └── test/            ← setup, renderWithRouter e o Supabase simulado (msw/).
```

Cada feature segue o mesmo formato: `api/` (único lugar que chama o Supabase), `hooks/` (TanStack Query), `components/`, `utils/` e `__tests__/`.

**Regras do ESLint** (`eslint.config.js`): imports usam o alias `@/` (barra `../`); uma feature não importa outra; só `features/*/api/` importa o client do Supabase.

---

## 6. Como a aplicação inicia

1. O navegador abre `index.html` (só `<div id="root">`) e carrega `src/main.jsx`.
2. `main.jsx` monta `StrictMode` > `BrowserRouter` > `App` e importa os três CSS (`tokens`, `index`, `app`).
3. `App.jsx` cria o `QueryClient` e envolve tudo em `QueryClientProvider` > `AuthProvider` > `ToastProvider`, e declara as rotas.
4. O `AuthProvider` acompanha a sessão do Supabase (carregando, sem login, logado). Ao sair, **limpa o cache** para a próxima pessoa não ver dados da anterior.
5. As rotas privadas ficam dentro do `ProtectedRoute`: sem login vai para `/login`; logado sem empresa vai para `/organizacao`.
6. O `AppLayout` monta a casca: `Sidebar`, `Topbar`, `GlobalSearch`, `AssistantDialog` e um `<Outlet>` onde entra a página da rota. Ele guarda só estados de tela (menus abertos), lê as **configurações do `localStorage`** e aplica o tema com `useTheme`. Fecha os menus ao trocar de rota.
7. `app/routes.jsx` tem os **adaptadores** de rota (`OverviewRoute`, `ProjectsRoute`…). Como uma feature não importa outra, é ali que os dados de uma feature chegam à outra **por prop**: por exemplo, a Visão geral recebe os projetos, e a Estratégia recebe o status calculado pelos alertas.
8. Ação do usuário: por exemplo, ao criar um projeto, a página chama `useCreateProject().mutateAsync(dados)`, que roda `createProject` em `projectsApi.js` (grava no Supabase) e invalida a chave `['projects']`; todas as telas que usam `useProjects()` são atualizadas.

---

## 7. Rotas e permissões

Definidas em `src/app/App.jsx`:

| Endereço | Página | Quem acessa | Observação |
|---|---|---|---|
| `/` | redireciona para `/login` | Público | |
| `/login` | `LoginPage` | Público | Quem já está logado vai para `/dashboard`. |
| `/cadastro` | `SignupPage` | Público | |
| `/organizacao` | `OrganizationPage` | Logado | Criar empresa (vira admin) ou entrar com código (vira stakeholder). |
| `/landing` | `LandingPage` | Público | Página institucional. |
| `/dashboard` | `OverviewPage` | Logado com empresa | Visão geral. |
| `/audit` | `AuditPage` | admin e stakeholder | O developer vê um aviso e o item some do menu. |
| `/repositories` | `RepositoriesPage` | Logado com empresa | |
| `/projects` | `ProjectsPage` | Logado com empresa | |
| `/strategy` | `StrategyPage` | Logado com empresa | Só o admin edita. |
| `/processes` | `ProcessesPage` | Logado com empresa | Todos os papéis veem. |
| `/access` | `RbacPage` | Logado com empresa | |
| `/settings` | `SettingsPage` | Logado com empresa | |
| outros | redireciona para `/login` | | |

**Menu lateral** (`Sidebar`): seção **Observabilidade** (Visão geral, Auditoria, Repositórios, Projetos, Estratégia, Processos) e **Administração** (Acessos e RBAC, Configurações), mais o botão do assistente e a troca de empresa.

**Papéis** (resumo; a tabela completa está em `RbacPage` e em `docs/REGRAS_DE_NEGOCIO.md` §2):

| Ação | admin | developer | stakeholder |
|---|---|---|---|
| Ver projetos, repositórios, estratégia e processos | sim | sim | sim |
| Criar e editar projeto | sim | sim | não |
| Excluir projeto | sim | não | não |
| Conectar, trocar e remover a chave do GitHub; escolher repositórios | sim | não | não |
| Sincronizar o GitHub | sim | sim | não |
| Editar missão, visão e objetivos | sim | não | não |
| Ver a auditoria | sim | não | sim |
| Mudar papéis, remover membros, gerar novo código | sim | não | não |

> A proteção na tela é só conveniência (esconde botões). **Quem garante o acesso é o RLS do banco** (`backend/supabase/`); `projectPermissions` em `app/routes.jsx` espelha essas regras.

---

## 8. Páginas

### 8.1 Login, cadastro e organização (`features/auth/`)
- As três telas usam a mesma moldura (`AuthLayout`) e formulários com **react-hook-form + zod** (`utils/schemas.js`); os erros aparecem sob cada campo, ligados por `aria-describedby`.
- **Login**: `signInWithPassword`, com mensagens em pt-BR para senha errada, e-mail não confirmado e excesso de tentativas.
- **Cadastro**: nome, e-mail e senha; o nome vai em `user_metadata.full_name` e um trigger do banco cria o perfil. Se o Supabase exigir confirmação de e-mail, a tela avisa.
- **Organização**: **criar** (`create_organization`, vira admin) ou **entrar com código** (`join_organization`, vira stakeholder; o código não diferencia maiúsculas). Código errado mostra "Código de organização inválido." sem revelar se a empresa existe.
- **Sair** e **código de convite**: no menu da conta (Topbar). Só o admin vê o código, com botão de copiar. O RLS deixa qualquer membro ler a empresa; se o código precisar virar segredo, a coluna sai do `select` dos não-admins por migration.
- **Troca de empresa**: na `Sidebar`, lista as empresas da pessoa e "Adicionar empresa". A última empresa escolhida é lembrada no `localStorage` (`govtech:last-organization`).

### 8.2 `LandingPage` — Apresentação
Página institucional estática, com seções com âncora (capacidades, como funciona, padrões, demonstração). Cita CMMI/SPICE, COBIT, ITIL e ISO/IEC 38500. É texto de marketing; não lê dados.

### 8.3 `OverviewPage` — Visão geral
Tudo calculado em `shared/lib/governance.js` a partir dos dados sincronizados do GitHub (`dashboard/api/governanceApi.js`, chave `['governance', empresa]`) e do prazo dos projetos. Recebe os projetos e os dados por prop (adaptador em `app/routes.jsx`). Mostra:

- **Seletor de período** 7 / 30 / 90 dias (começa em 30).
- **`GovernanceIndex`**: nota 0–100 da empresa (média dos projetos), faixa Bom/Regular/Crítico, variação em 7 dias, linha dos últimos 30 dias (trecho recalculado tracejado) e a nota de cada critério com o peso. A nota é calculada e gravada pela Edge Function (`governance_scores`); a tela só lê (`governanceScore.js`).
- **`ProjectStatusSummary`**: quantos projetos estão Saudáveis, em Atenção e em Risco, e a regra do status num tooltip.
- **Cinco cartões**: Quantidade de PRs, Lead time médio, Taxa de aprovação, PRs em risco e **CI verde no merge**.
- **Gráficos** (`PullRequestFlowChart`, `PullRequestDistribution`): PRs criados × mergeados por semana (mínimo de 4 semanas, com a faixa de datas de cada semana) e distribuição por situação (abertos, rascunhos, mergeados, fechados).
- **`CiHistoryPanel`**: histórico das execuções do CI (taxa de sucesso, tempo médio de correção e últimas falhas, com link).
- **Lista de projetos** com o status calculado (pior primeiro) e o primeiro alerta de cada um.
- **`AutomatedAlerts`**: alertas dos mais críticos para os menos (Risco antes de Atenção), com o motivo e o link do PR; 8 visíveis e o botão "Ver todos os N alertas".
- **`RecentActivityPanel`**: repositórios, commits da branch principal, branches e contribuidores no período.
- **Tooltips** (`shared/ui/Tooltip`): as regras de cada cálculo ficam num botão ⓘ no canto do cartão; abre com mouse, foco ou toque e fecha com Esc (texto ligado por `aria-describedby`).

### 8.4 `ProjectsPage` — Projetos
- **Cards** com nome e status no topo, responsável e prazo, objetivo estratégico a que o projeto serve e o Índice de Governança no rodapé (ou "ainda não apurado"). Grade de 1, 2 ou 3 colunas (640 e 1024 px). Os cards de resumo do topo: total, em atenção e em risco.
- **Status calculado** (regra P3): Saudável, Atenção ou Risco, a partir dos alertas do projeto (PR parado, PR sem aprovação, branch sem proteção, prazo, CI). **Não existe status manual.** Os alertas ficam na Visão geral e na Estratégia, não no card.
- **Novo projeto / Editar** (`ProjectFormModal`): nome, objetivo (descrição), **deadline** (`DatePicker`, obrigatório), **prioridade** (`Select`), responsável e **objetivo estratégico** (opcional, regra S3).
- **Detalhe** (`ProjectDetailModal`): descrição, prazo, status, nota de cada critério do índice, botões Editar e Excluir conforme o papel, e a seção **GitHub**.
- **Excluir** (`DeleteProjectModal`): pede confirmação.
- **Seção GitHub** (`GitHubPanel`): o admin cola a chave *fine-grained* do GitHub (só leitura). A chave é testada no GitHub, guardada no **Vault** e **nunca volta ao navegador**: a tela mostra `••••` e os 4 últimos caracteres, mais o login. Depois de conectar, o admin **escolhe os repositórios** (`RepositoryPicker`); dá para mudar em "Escolher repositórios". Salvar já sincroniza. Admin e developer usam **Sincronizar**; o admin também troca e remove a chave. O stakeholder só vê a situação. A sincronização roda **sozinha a cada hora**; se falhar (ex.: chave expirada), o painel mostra o motivo até a próxima dar certo.
- **Busca global**: escolher um projeto na busca leva a `/projects` com o detalhe aberto.

### 8.5 `RepositoriesPage` — Repositórios
- Filtro por projeto e três abas: **Repositórios**, **Pull Requests** e **Branches**.
- Dados das tabelas `repositories`, `pull_requests`, `branches` (e `commits`), preenchidas pela Edge Function `github`. Um repositório é guardado **uma vez por empresa** e ligado aos projetos por `project_repositories`: se dois projetos o usam, ele aparece uma vez, com a coluna **Projetos** listando os dois.
- Números calculados (`utils/metrics.js`): PRs abertos, PRs mergeados nos últimos 30 dias e tempo médio até o merge. A lista de PRs mostra as **aprovações**.
- Limites por sincronização: 100 repositórios por chave; os 100 PRs mais recentes e 100 branches por repositório; commits da branch padrão dos últimos 90 dias; execuções do CI dos últimos 90 dias.
- Sem nada sincronizado, a página explica como conectar.

### 8.6 `StrategyPage` — Estratégia (regras S1–S7)
- **Missão e visão** da empresa (até 1.000 caracteres cada) e **objetivos estratégicos** (título até 120, descrição até 500). Só o admin edita.
- Cada objetivo mostra o **status** (o pior entre os projetos vinculados; sem projeto: "Sem projetos vinculados") e os projetos ligados. Objetivo em Risco ou Atenção lista os **alertas** de cada projeto (`ProjectAlerts`: 3 primeiros, com "Ver todos os N alertas"), apontando qual meta de negócio a falha técnica ameaça. O sistema **não estima** prazo nem custo.
- Excluir um objetivo desfaz os vínculos; os projetos continuam.

### 8.7 `ProcessesPage` — Processos (regras C1–C6)
- Relaciona os registros dos PRs a quatro áreas do **CMMI-DEV 1.3** (e processos da ISO/IEC/IEEE 12207): Verificação (VER), Gestão de Configuração (CM), Monitoramento e Controle do Projeto (PMC) e Medição e Análise (MA). Cada área mostra os critérios do índice que servem de evidência, a nota atual da empresa, de onde vem o dado e a prática do modelo (`shared/lib/processes.js`).
- Cada critério do índice alimenta **uma única área** (nenhuma evidência é contada duas vezes). Um aviso fixo diz que a nota é **evidência de apoio, não avaliação formal de maturidade**.

### 8.8 `AuditPage` — Auditoria (regras AU1–AU7)
- Lê `audit_events`: quem fez o quê, onde e quando, do mais novo ao mais antigo, **50 por vez** com "Carregar mais".
- Filtros de período (7/30/90 dias) e de tipo (Projetos, Membros, Empresa, GitHub). Cartões com números reais do período: eventos, mudanças de acesso e sincronizações com falha.
- **Exportar CSV** gera o arquivo no navegador, com `;`, BOM para o Excel e proteção contra fórmulas (`utils/toCsv.js`). Os textos dos eventos vêm de `utils/describeEvent.js`.
- Eventos gravados **pelo banco** (triggers em projetos, membros, empresa e objetivos) e pela Edge Function (`audit_record`, para o GitHub). Guarda nome e papel de quem agiu; nada de e-mail nem chave. A tabela é imutável.
- Só admin e stakeholder veem.

### 8.9 `RbacPage` — Acessos e RBAC
- Três cartões de papéis (Admin, Developer, Stakeholder) com o que cada um **realmente** pode fazer (`utils/roles.js`, espelho das regras do banco); clicar abre `RoleDetailModal`.
- **Membros** com nome, e-mail e papel (`membersApi.listMembers`). O admin troca o papel, remove membros (com confirmação) e abre **Convidar** (`InviteModal`: código com botão de copiar e **gerar novo código**, que invalida o anterior). Os outros papéis veem a lista sem controles e podem **sair** da empresa.
- O banco não deixa a empresa sem admin: "A organização precisa de pelo menos um administrador."

### 8.10 `SettingsPage` — Configurações
Três abas:
1. **Geral** — nome da organização, fuso horário (Brasília, Nova York, Londres) e tema (Claro, Escuro, Sistema). **Fica só no navegador** (`localStorage`, chave `govtech:settings`).
2. **Notificações** — **em desenvolvimento**: selo, aviso de prévia e controles desabilitados.
3. **Segurança** — **em desenvolvimento** (2FA, sessões e troca de senha): mesmo tratamento.

O **sino do topo** também está desabilitado, com o tooltip "Notificações — em desenvolvimento" e sem a bolinha vermelha.

### 8.11 Assistente de Governança com IA (`features/assistant/`)
Aberto pelo botão "Assistente com IA" do menu lateral (`app/AssistantDialog.jsx` junta os dados de Projetos e da Visão geral). A pessoa escolhe uma das 4 perguntas sugeridas ou digita a sua. A pergunta vai, com os dados da empresa calculados na tela (`shared/lib/assistantContext.js`, **sem login nem responsável**, até 11 KB), para a Edge Function `assistant`, que consulta o Groq. Limite de **20 perguntas por pessoa por dia** (200 no total); a conversa some ao fechar o painel. Regras IA1–IA6 em `docs/REGRAS_DE_NEGOCIO.md` §5.2.

---

## 9. Componentes compartilhados

### 9.1 Layout (`shared/layout/`)

| Componente | Responsabilidade |
|---|---|
| `Sidebar` | Logo, troca de empresa, itens de menu (o Auditoria some para o developer) e botão do assistente. |
| `Topbar` | Menu (mobile), breadcrumb "GOVTECH PLATFORM › SEÇÃO", busca, sino (em desenvolvimento) e menu da conta (perfil, configurações, sair, código de convite para o admin). |
| `GlobalSearch` | Busca em **projetos, repositórios, PRs e branches** com os dados reais (os do GitHub só são buscados quando a busca abre). Fecha com `Esc`, no X ou clicando fora. |
| `InviteCode` | Mostra o código da empresa com botão de copiar. |

### 9.2 Interface (`shared/ui/`)

| Componente | O que faz |
|---|---|
| `Modal` | Diálogo acessível usado por todos os modais: `role="dialog"`, foco preso no diálogo, `Esc` fecha, foco volta a quem abriu; no celular (< 640 px) abre como folha embaixo. Props: `title`, `kicker`, `size`, `onClose`. |
| `Select` e `DatePicker` | Substituem `<select>` e `<input type="date">` nativos (que mudam de navegador para navegador). Veja abaixo. |
| `Tooltip` | Dica ligada a um botão ⓘ; abre com mouse, foco ou toque, fecha com Esc. |
| `StatCard`, `StatusBadge`, `ScoreBreakdown`, `Brand`, `Icon` | Cartão de indicador, etiqueta de status (`success`, `warning`, `danger`), quebra da nota por critério, logo e mapa de ícones por nome (com fallback). |
| `Toast` / `ToastProvider` | Avisos que somem sozinhos; as páginas usam `const { showToast } = useToast()`. A área tem `role="status"`. |

**`Select` e `DatePicker`**: desenham um botão no estilo dos inputs e abrem um popover em **portal** (`position: fixed`, posicionado por `usePopover`: abre para cima se faltar espaço e nunca sai da tela). Fecham com clique fora ou `Esc` e devolvem o foco. Chamam `onChange(valor)` com o **valor**, não o evento; com react-hook-form use `<Controller>`. Aceitam `label`, `error`, `disabled`, `id` e `name`.

| Componente | Props próprias | Teclado |
|---|---|---|
| `Select` | `options` (`[{ value, label }]`), `value`, `placeholder`, `size` (`md`/`sm`), `icon`. Padrão ARIA `listbox`. | Setas, Home/End, Enter/Espaço, Esc, Tab; letras pulam para a opção. |
| `DatePicker` | `value` em ISO `YYYY-MM-DD`, `min`, `max`, `placeholder`. Mostra `20/12/2026`; calendário em `role="grid"`; dias fora do intervalo desabilitados. | Setas mudam dia/semana, PageUp/PageDown mudam o mês, Enter/Espaço escolhem, Esc fecha. |

As contas de data ficam em `shared/lib/date.js` (strings ISO, em UTC, para não sofrer com horário de verão).

### 9.3 Por feature
- **Visão geral**: `GovernanceIndex`, `ProjectStatusSummary`, `PullRequestFlowChart`, `PullRequestDistribution`, `CiHistoryPanel`, `AutomatedAlerts`, `RecentActivityPanel`.
- **Projetos**: `ProjectFormModal`, `ProjectDetailModal`, `DeleteProjectModal`, `GitHubPanel`, `RepositoryPicker`.
- **Repositórios**: `RepositoriesList`, `PullRequestsList`, `BranchesList`, `MetricCard`.
- **Estratégia**: `ObjectiveFormModal`, `DeleteObjectiveModal`, `ProjectAlerts`.
- **RBAC**: `RoleDetailModal`, `InviteModal`, `RemoveMemberModal`.
- **Autenticação**: `AuthLayout`, `AuthField`, `PasswordField`, `ProtectedRoute`.

---

## 10. Dados, estado e armazenamento

### 10.1 De onde vêm os dados
Tudo vem do Supabase, só por `features/*/api/`. Cada feature tem hooks com TanStack Query:

| Feature | Chave(s) | Fonte |
|---|---|---|
| Projetos | `['projects']` | tabela `projects` |
| GitHub (por projeto) | por projeto | Edge Function `github` |
| Visão geral / Processos | `['governance', empresa]` | `repositories`, `pull_requests`, `branches`, `commits`, `ci_runs`, `governance_scores` |
| Repositórios | `useRepositoryData` | mesmas tabelas do GitHub |
| Estratégia | objetivos, missão e visão | `strategic_objectives`, `organizations` |
| Auditoria | eventos paginados | `audit_events` |
| Acessos | membros | `organization_members`, `profiles` |
| Assistente | — | Edge Function `assistant` |

Nenhum componente guarda a lista em `useState` nem usa `useEffect` para buscar dados. A empresa atual vem de `useCurrentOrganization`.

### 10.2 Estado de tela
`useState` para o que é só da tela: menus e busca abertos (`AppLayout`), modais e item selecionado (`ProjectsPage`), aba e rascunho (`SettingsPage`), filtros da Auditoria e da Visão geral.

### 10.3 `localStorage`

| Chave | Quem grava | O que guarda |
|---|---|---|
| `govtech:settings` | `AppLayout`, via `useLocalStorage` | Nome da organização, fuso, tema (aba Geral). Só neste navegador. |
| `govtech:last-organization` | `utils/lastOrganization.js` | Última empresa escolhida. |
| `govtech-auth` | `supabase-js` | Sessão do login. |

O hook `useLocalStorage` lê a chave na primeira renderização, grava como JSON a cada mudança e ignora erros (modo privado com armazenamento bloqueado). A antiga chave `govtech:projects` não é mais lida.

### 10.4 Mocks
`mocks/mockData.js` ainda existe, mas **só é importado pelos testes** (`test/msw/db.js` e o contrato `projectsApi.test.js`). Nenhuma tela mostra dado de exemplo.

---

## 11. Regras de negócio no código

As regras estão em `docs/REGRAS_DE_NEGOCIO.md`; aqui, onde cada uma vive no código.

### 11.1 `shared/lib/governance.js`
- **`governanceAlerts(dados, projetos, now)`** gera os alertas (§6 das regras), cada um com título, origem, motivo, link e nível (Atenção ou Risco). **`projectHealth`** dá a cada projeto o pior nível dos seus alertas (regra P3).

| Alerta | Atenção | Risco |
|---|---|---|
| PR aberto (sem rascunhos) | mais de 1 dia | mais de 3 dias |
| PR mergeado sem aprovação (últimos 30 dias) | sempre | — |
| Branch principal sem proteção | sempre | — |
| Prazo do projeto | vence em até 7 dias | vencido |
| CI falhando na branch principal | — | sempre |
| PR mergeado com CI falhando (só enquanto a branch principal não estiver verde) | — | sempre |
| PR aberto com CI falhando (sem rascunhos) | sempre | — |

  A contagem de dias até o prazo usa as duas datas à meia-noite. Projeto sem prazo não gera alerta de prazo. **Se o CI da branch principal já está verde, o alerta de "mergeado com CI falhando" some** (PR #52).
- **`governanceMetrics`**: Quantidade de PRs (abertos agora + criados no período), Lead time médio (abertura → merge), Taxa de aprovação (mergeados com ao menos 1 aprovação), PRs em risco (abertos há mais de 3 dias), CI verde no merge (% dos mergeados com CI que estavam verdes) e contribuidores (logins distintos de commits e PRs).
- **`ciIncidents`**: histórico do CI (% de execuções que passaram; canceladas não contam), tempo médio de correção e últimas falhas.
- **`weeklyFlow`**: PRs criados × mergeados por semana.
- **`emptyGovernance`**: formato vazio usado enquanto os dados carregam.

### 11.2 `shared/lib/governanceScore.js` — Índice de Governança (I1–I7)
Cinco critérios com pesos (`SCORE_CRITERIA`): revisão de código, proteção da branch, fluxo de PRs, prazo e lead time. Só entram os critérios **com dado**. A empresa usa a média dos projetos que têm nota; projeto sem repositório ligado não terá nota (I7, decidida em 07/11/2026; a mudança é no `score.js` da função de servidor e ainda não foi implementada). Faixas (`SCORE_BANDS`): Bom, Regular, Crítico. Funções: `latestScores`, `scoreHistory`, `scoreChange`, `scoreBand`. **O cálculo e a gravação** ficam na Edge Function (`functions/github/score.js`, testado com `node --test`); o front só lê.

### 11.3 Demais módulos de `shared/lib/`
- `strategy.js` (`objectiveStatus`, regras S4 e S5) e `processes.js` (áreas e critérios, regras C2–C6).
- `projectUtils.js`: `formatProjectDate` (`2026-10-25` → `25/10/2026`, meio-dia para evitar erro de fuso) e `normalizeProject`.
- `assistantContext.js`: monta o contexto enviado à IA, sem dados pessoais.
- `date.js`, `supabase.js` (único client) e `zodResolver.js`.
### 11.4 Métricas da Visão geral (`governanceMetrics`)
- **Quantidade de PRs:** abertos agora + criados no período (sem contar duas vezes).
- **Lead time médio:** média de horas da abertura ao merge dos PRs mergeados no período.
- **Taxa de aprovação:** % dos mergeados no período com `approval_count` ≥ 1; "—" se nenhum foi mergeado.
- **PRs em risco:** abertos (sem rascunhos) há mais de 3 dias.
- **CI verde no merge** (desde 02/11/2026, regra G10): % dos mergeados no período **com CI** (`ci_state` não nulo) que estavam com `ci_state = 'success'`; "—" se nenhum tinha CI. Os alertas de CI (branch principal, PR mergeado e PR aberto com CI falhando) também saem de `governanceAlerts`. O alerta de PR mergeado com CI falhando (G12, desde 04/11/2026) considera os mergeados nos últimos 30 dias, mas some quando o `ci_state` do repositório do PR é `success` (a branch principal voltou a passar); com estado `pending` ou nulo ele continua. Por isso `loadGovernanceData` traz o `repository_id` de cada PR.
- **Histórico do CI** (desde 02/11/2026, regra G11, `ciIncidents` e painel `CiHistoryPanel` na Visão geral): % das execuções concluídas no período que passaram (canceladas não contam), tempo médio de correção (do fim da primeira falha ao fim da próxima execução que passou, no mesmo workflow e branch; falhas seguidas contam como uma) e as últimas falhas, com link. Durações abaixo de 1 hora aparecem em minutos.
- **Contribuidores:** logins distintos de commits e de PRs criados no período.

---

## 12. Back-end (Supabase)

Projeto **`govtech-br`** (região São Paulo). Detalhes em `backend/README.md` e `docs/API.md`.

### 12.1 Banco
- **12 migrations** em `backend/supabase/migrations/`: schema base (perfis, empresas, membros, projetos), membros, GitHub, remoção de `project_repositories` antiga, seleção de repositórios, sincronização horária, índice de governança, uso do assistente, auditoria, status do CI, execuções do CI e objetivos estratégicos.
- **Tabelas** (todas com RLS ligada e uma policy por operação): `profiles`, `organizations` (com `mission` e `vision`), `organization_members`, `projects` (com `objective_id`), `github_credentials`, `repositories`, `project_repositories`, `pull_requests`, `branches`, `commits`, `ci_runs`, `governance_scores`, `assistant_usage`, `audit_events`, `strategic_objectives`.
- As tabelas do GitHub são **somente leitura** para o usuário; só a Edge Function grava, com a chave de serviço, **depois** de conferir o papel de quem chamou.
- Funções `security definer` ficam no schema `private` (`set search_path = ''`); o front chama só as "cascas" em `public`. RPCs principais: `create_organization`, `join_organization`, `regenerate_join_code`.
- **Regra de ouro:** mudança de schema só por migration versionada, aplicada com aprovação, nunca pelo painel. Migration aplicada não é editada.

### 12.2 Vault e a chave do GitHub
`github_credentials` guarda só os **metadados** (`secret_id`, `token_last4`, `github_login`, estado da sincronização). A chave de verdade fica em `vault.secrets`, lida só pela Edge Function por funções `service_role`. Um trigger apaga o segredo do Vault quando a conexão é removida. O agendador usa outra senha, gerada dentro do Vault.

### 12.3 Edge Functions
- **`github`**: `connect`, `list`, `select`, `sync`, `disconnect` e `sync-all`. Conversa com o GitHub (REST e GraphQL), grava os dados, apura o Índice de Governança e registra eventos de auditoria. Confere login e papel **no banco** antes de agir.
- **`sync-all` e o agendador**: o job `github-sync-hourly` do `pg_cron` roda no minuto 7 de cada hora e chama a função com o cabeçalho `x-cron-secret`; a função compara a senha em tempo constante e sincroniza um projeto por vez. Falha de um projeto não para os outros.
- **`assistant`**: confere login e se a pessoa é membro, conta a pergunta (`assistant_consume`) e pergunta ao Groq. Secret `GROQ_API_KEY` configurado no Supabase, nunca no git.
- Publicação pelo MCP do Supabase, com aprovação.

### 12.4 Segurança e LGPD (resumo)
- No front só a chave pública; a secret key, a chave do GitHub e a do Groq ficam no servidor.
- O assistente recebe contexto **sem nomes de pessoas** (só dados da empresa).
- A auditoria não guarda e-mail nem chave, e é imutável.
- Pessoa sem login (`anon`) não acessa nenhuma tabela.

---

## 13. Testes e CI

| Camada | Onde | Como rodar |
|---|---|---|
| Front (Vitest + Testing Library + MSW) | `frontend/src/**/__tests__/` e `src/app/__tests__/` | `npm run test:run` (27 arquivos, 222 testes) |
| Edge Functions (lógica pura) | `backend/supabase/functions/*/*.test.js` | `node --test "backend/supabase/functions/*/*.test.js"` |
| Regras de acesso (pgTAP) | `backend/supabase/tests/*.test.sql` (11 arquivos) | `backend/README.md` (SQL Editor, com `scripts/to_sql_editor.py`) |

Convenções: busque elementos por `getByRole`/`getByLabelText`, nunca por classe CSS; rede mockada com MSW (`onUnhandledRequest: 'error'`); testes de data com `vi.setSystemTime`; toda policy nova tem teste pgTAP positivo **e** negativo. Mapa geral: `docs/TESTES.mmd`.

**CI** (`.github/workflows/ci.yml`, em todo PR e no push da `main`): no front, `npm ci`, `lint`, `test:run` e `build`; nas Edge Functions, `node --test`. Os pgTAP rodam à mão no banco remoto. Antes de abrir PR: `lint`, `test:run` e `build` verdes.

---

## 14. Aparência e deploy

### Aparência
- **Tokens** em `styles/tokens.css`: cores (`--color-primary-500: #9370db` é o roxo da marca), espaços (`--space-*`), raios e sombras. Tema claro em `:root` e escuro em `:root[data-theme='dark']`.
- `useTheme` põe `data-theme` no `<html>` conforme `settings.theme` (Claro, Escuro ou Sistema, esta consulta `prefers-color-scheme`).
- Componentes novos usam **CSS Modules** e variáveis de `tokens.css`; evite `style={{}}` e cor ou espaço literais. Mobile-first, com breakpoints só em 640, 768, 1024 e 1280 px.

### Deploy (Vercel)
`frontend/vercel.json` (o projeto da Vercel usa **Root Directory = `frontend`**):
```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```
A Vercel roda `npm run build` e publica `dist/`. O `rewrites` é essencial numa SPA: sem ele, abrir `/projects` direto daria 404. O banco e as Edge Functions ficam no Supabase, publicados separadamente (§12).

---

## 15. Limitações conhecidas

- **Em desenvolvimento (de propósito):** as abas Notificações e Segurança de Configurações e o sino do topo. Nada disso funciona ainda.
- **Configurações da aba Geral** (nome, fuso, tema) ficam só no navegador, não no banco.
- **Atualização do GitHub não é instantânea:** é a cada hora ou pelo botão Sincronizar. Webhook e GitHub App ficaram fora do escopo.
- **Chave do GitHub pessoal:** uma por projeto, colada pelo admin. A evolução natural é um GitHub App (ver `docs/RELATORIO_TCC.md`).
- **Fora do escopo até 18/11/2026** (`docs/REGRAS_DE_NEGOCIO.md` §8): convite por e-mail, CI no Índice de Governança, separar PRs por projeto dentro de um repositório compartilhado, cadeia de hash e retenção automática na auditoria, histórico salvo das conversas com o assistente.
- **Processos:** o sistema dá **evidências**, não avalia nível de maturidade (isso exige um avaliador qualificado).
- **Limites de sincronização:** 100 repositórios, 100 PRs e 100 branches por repositório, 90 dias de commits e execuções do CI.
- **Sem e2e nem ambiente local do Supabase:** os testes pgTAP rodam no projeto remoto.
- **Pendências de código:** nomes de ícone por texto em `shared/ui/Icon.jsx` (com fallback silencioso) e alguns estilos inline antigos em `app.css` e nas páginas (novos não devem ser criados).
