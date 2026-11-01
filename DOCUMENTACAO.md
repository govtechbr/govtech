# GovTech MS — Documentação do Projeto

Plataforma web de **governança e monitoramento de projetos de TI**: painel com indicadores, lista de projetos com prazo e progresso, visão de repositórios/Pull Requests/branches, auditoria, controle de acesso (RBAC) e configurações.

> **Resumo para quem não é da área de front-end:** o app roda no navegador e usa o **Supabase** como back-end (banco Postgres, login e regras de acesso). Desde 01/11/2026, **login, cadastro, organizações, membros, projetos e os dados do GitHub (repositórios, PRs e branches) são reais** e ficam no banco. As outras telas (auditoria, gráficos da Visão geral) ainda mostram dados de exemplo (“mock”) até ganharem tabelas próprias. Detalhes na seção [Back-end](#14-tem-resquícios-de-back-end).

---

## Índice

1. [Visão geral em uma frase](#1-visão-geral-em-uma-frase)
2. [Tecnologias usadas (e o que cada uma faz)](#2-tecnologias-usadas-e-o-que-cada-uma-faz)
3. [Glossário rápido](#3-glossário-rápido)
4. [Como rodar o projeto, passo a passo](#4-como-rodar-o-projeto-passo-a-passo)
5. [Estrutura de pastas](#5-estrutura-de-pastas)
6. [Como a aplicação inicia (passo a passo)](#6-como-a-aplicação-inicia-passo-a-passo)
7. [Rotas (endereços da aplicação)](#7-rotas-endereços-da-aplicação)
8. [Páginas](#8-páginas)
9. [Componentes](#9-componentes)
10. [Dados, estado e armazenamento](#10-dados-estado-e-armazenamento)
11. [Regras de negócio](#11-regras-de-negócio)
12. [Aparência e tema](#12-aparência-e-tema)
13. [Deploy (Vercel)](#13-deploy-vercel)
14. [Tem resquícios de back-end?](#14-tem-resquícios-de-back-end)
15. [Problemas e inconsistências encontrados](#15-problemas-e-inconsistências-encontrados)
16. [Código morto (arquivos que não são usados)](#16-código-morto-arquivos-que-não-são-usados)
17. [Limitações desta documentação](#17-limitações-desta-documentação)

---

## 1. Visão geral em uma frase

Um site de página única (SPA — *Single Page Application*) feito em **React**, empacotado com **Vite**, que simula uma ferramenta de governança de TI. Ao trocar de menu, o navegador não recarrega a página: o React troca o conteúdo na tela.

Estado atual do projeto (verificado no código, base `193c764` + limpeza da branch `chore/limpeza`, 31/10/2026):

| Item | Situação |
|---|---|
| Build de produção (`npm run build`) | Passa sem erros |
| Histórico git | Reiniciado: 1 commit (`193c764`). O histórico anterior (6 commits) não existe mais |
| Chamadas de rede | Só para o Supabase, pelo `@supabase/supabase-js` (arquivos `features/*/api/`) |
| Login | Real (Supabase Auth): e-mail e senha, com cadastro |
| Proteção de rotas | `ProtectedRoute`: sem login vai para `/login`; sem organização vai para `/organizacao` |
| Dados | Projetos e organizações no banco (com RLS); demais telas com arquivos de exemplo |

---

## 2. Tecnologias usadas (e o que cada uma faz)

Lidas em `package.json`:

| Tecnologia | Versão | Para que serve aqui |
|---|---|---|
| **React** | 18.3.1 | Biblioteca para montar a interface com “componentes” (pedaços reutilizáveis de tela). |
| **React DOM** | 18.3.1 | Parte do React que desenha os componentes dentro da página HTML. |
| **React Router DOM** | 7.18.4 | Cuida das “rotas”: faz `/projects` mostrar a tela de Projetos sem recarregar. |
| **Lucide React** | 0.468.0 | Biblioteca de ícones (`<Bell />`, `<Shield />`, etc.). |
| **Vite** | 6.x | Servidor de desenvolvimento (`npm run dev`) e empacotador para produção (`npm run build`). |
| **@vitejs/plugin-react** | 4.x | Permite o Vite entender o JSX (a sintaxe HTML dentro do JavaScript). |

CSS é escrito à mão em arquivos `.css` (sem Tailwind, sem Bootstrap, sem biblioteca de UI).

---

## 3. Glossário rápido

- **Componente**: uma função JavaScript que devolve um pedaço de tela. Ex.: `<StatCard />`. Um componente pode usar outros componentes, como peças de Lego.
- **JSX**: a sintaxe que mistura HTML com JavaScript dentro do `.jsx`. Ex.: `<h1>{titulo}</h1>`. Não é HTML puro: `class` vira `className`.
- **Props**: “parâmetros” que um componente recebe de quem o usa. Ex.: `<StatCard title="PRs" value={10} />` recebe `title` e `value`.
- **State (estado)**: dados que, quando mudam, fazem a tela ser redesenhada. Criado com `useState`.
- **Hook**: função que começa com `use` (ex.: `useState`, `useEffect`). Dá “superpoderes” ao componente, como guardar estado ou reagir a algo.
- **useEffect**: executa código depois que a tela é desenhada (ex.: salvar no `localStorage` quando algo muda).
- **Rota**: a relação entre um endereço (`/projects`) e uma tela.
- **SPA**: aplicação de página única. Só existe um `index.html`; o JavaScript troca o conteúdo.
- **localStorage**: uma “gaveta” de dados que o navegador guarda no computador do usuário, em formato texto (chave → valor). Não é banco de dados. Só existe naquele navegador.
- **Mock**: dado falso, usado para simular a realidade enquanto não há backend.
- **Back-end**: o programa que roda em um servidor, guarda dados num banco e responde a requisições. **Este projeto não tem.**
- **Build**: transformar o código-fonte em arquivos otimizados (pasta `dist/`) prontos para publicar.
- **Deploy**: publicar esses arquivos num endereço da internet (aqui, na Vercel).

---

## 4. Como rodar o projeto, passo a passo

Pré-requisito: **Node.js 22.12 ou superior** (exigência do Vitest). Para conferir: abra um terminal e rode `node -v`.

### Passo 1 — Entrar na pasta do front-end

Desde 01/11/2026 o app fica em `frontend/`; todos os comandos `npm` rodam lá dentro.

```bash
cd C:\Users\oguil\Documents\tcc\govtech\frontend
```

### Passo 2 — Instalar as dependências

```bash
npm install
```

Isso lê o `package.json` e baixa as bibliotecas para a pasta `node_modules/` (que não vai para o git, conforme o `.gitignore`). Também instala o hook de pre-commit (Husky), que roda ESLint e Prettier nos arquivos alterados a cada commit.

**Variáveis do Supabase:** copie `frontend/.env.example` para `frontend/.env.local` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` (Dashboard do Supabase > Project Settings > API). São valores públicos; o acesso aos dados é controlado pelo RLS. A secret key nunca entra no front. Sem elas, o app mostra um erro ao abrir. Na Vercel as duas já estão configuradas.

### Passo 3 — Subir o servidor de desenvolvimento

```bash
npm run dev
```

O Vite mostra um endereço, normalmente `http://localhost:5173`. Abra no navegador. Qualquer alteração salva no código atualiza a tela automaticamente.

### Passo 4 — Gerar a versão de produção (opcional)

```bash
npm run build
```

Cria a pasta `dist/` com o site compilado. Para testar essa versão localmente:

```bash
npm run preview
```

### Passo 5 — Rodar lint e testes

```bash
npm run lint       # ESLint (inclui as regras de dependência entre pastas)
npm run test:run   # testes automatizados (Vitest), uma vez
npm test           # testes em modo watch, enquanto você programa
```

### Verificação feita para esta documentação

`npm ci` e `npm run build` foram executados com sucesso: 1631 módulos transformados, sem erros. O bundle JavaScript final tem cerca de 307 kB (88 kB comprimido).

---

## 5. Estrutura de pastas

Desde 01/11/2026 o repositório separa front-end e back-end (decisão registrada em `docs/PLANO_TECNICO.md` §15).

```
govtech/
├── README.md             ← Como começar e comandos.
├── AGENTS.md / CLAUDE.md ← Regras do projeto para pessoas e agentes de IA.
├── DOCUMENTACAO.md       ← Este arquivo.
├── docs/                 ← Plano técnico (PLANO_TECNICO.md) e mapa de testes (TESTES.mmd).
├── .github/workflows/    ← CI: lint, testes e build em todo PR.
├── backend/              ← (fase Supabase) migrations, seed, testes pgTAP e Edge Functions.
│
└── frontend/             ← App React + Vite. Todos os comandos npm rodam aqui.
    ├── index.html        ← Única página HTML. Contém só <div id="root"> e carrega src/main.jsx.
    ├── package.json      ← Scripts e dependências.
    ├── vite.config.js    ← Vite, alias @/ → src/ e configuração dos testes (Vitest).
    ├── eslint.config.js  ← Regras de lint, inclusive quem pode importar de quem.
    ├── jsconfig.json     ← Ensina o editor a entender o alias @/.
    ├── vercel.json       ← Publicação na Vercel (Root Directory = frontend).
    ├── .husky/           ← Hook de pre-commit (ESLint + Prettier).
    │
    └── src/
        ├── main.jsx      ← Ponto de entrada do React (liga tudo ao HTML).
        ├── app/          ← App.jsx: rotas e layout autenticado.
        ├── landing/      ← LandingPage.jsx: página de apresentação, separada do sistema.
        │
        ├── features/     ← Uma pasta por área do sistema. Uma feature não importa outra.
        │   ├── auth/          Login, cadastro e escolha de organização; AuthProvider, ProtectedRoute, api/authApi.js.
        │   ├── dashboard/     OverviewPage.jsx + components/ (gráficos e painéis da Visão geral).
        │   ├── projects/      ProjectsPage.jsx + components/ (modais) + api/projectsApi.js (Supabase).
        │   ├── repositories/  RepositoriesPage.jsx (dados sincronizados do GitHub) + api/ + components/ + utils/metrics.js.
        │   ├── audit/         AuditPage.jsx (eventos de auditoria).
        │   ├── rbac/          RbacPage.jsx (membros reais) + api/membersApi.js + components/ (papel, convite, remover).
        │   └── settings/      SettingsPage.jsx.
        │
        ├── shared/       ← O que mais de uma área usa. Não importa de features/.
        │   ├── layout/        Sidebar, Topbar, GlobalSearch e ChatbotModal.
        │   ├── ui/            Brand, Icon, Modal, StatCard, StatusBadge, Toast/ToastProvider.
        │   ├── hooks/         useLocalStorage (estado salvo no navegador), useTheme (tema claro/escuro).
        │   ├── lib/           projectUtils.js (normaliza projetos, datas, semáforo de prazo), supabase.js (único client), zodResolver.js.
        │   └── constants/     colors, defaultSettings, projectStatus (Saudável/Atenção/Risco), storageKeys.
        │
        ├── mocks/        ← mockData.js: TODOS os dados de exemplo (ficam até existir dado real no Supabase).
        ├── styles/       ← tokens.css (cores, espaços, sombras), index.css (global + tema escuro), app.css (telas).
        └── test/         ← setup.js e renderWithRouter.jsx, usados pelos testes.
```

Os testes ficam em pastas `__tests__/` ao lado do código que testam (ex.: `src/features/projects/__tests__/`).

Os imports usam o alias `@/` (ex.: `import Sidebar from '@/shared/layout/Sidebar'`). O ESLint barra `../` e imports proibidos entre pastas.

---

## 6. Como a aplicação inicia (passo a passo)

Esta é a sequência real, seguindo o código:

**Passo 1 — O navegador abre `index.html`.**
Ele tem apenas `<div id="root"></div>` e carrega `src/main.jsx` como módulo.

**Passo 2 — `main.jsx` monta o React.**
```jsx
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
```
- `createRoot(...)` pega a `<div id="root">` e diz ao React “aqui você desenha”.
- `BrowserRouter` habilita as rotas com endereços reais (`/dashboard`, `/projects`…).
- `StrictMode` é um modo de verificação do React que, em desenvolvimento, executa alguns efeitos duas vezes para achar erros. Não afeta a produção.
- Os três CSS são importados aqui: `tokens.css`, `index.css`, `app.css`.

**Passo 3 — `App.jsx` decide qual tela mostrar.**
Ele usa `<Routes>` para comparar o endereço atual com a lista de rotas (ver §7).

**Passo 4 — Telas públicas ou autenticadas.**
- `AuthProvider` (em volta de tudo) acompanha a sessão do Supabase: carregando, sem login ou logado. Ao sair, limpa o cache de dados para o próximo usuário não ver nada do anterior.
- `/` → redireciona para `/login`. `/login` → `LoginPage`, `/cadastro` → `SignupPage`, `/organizacao` → `OrganizationPage`.
- `/landing` → `LandingPage`.
- `/landing` é carregada sob demanda (`lazy()`): o código dela só baixa quando alguém abre a página.
- `/dashboard`, `/audit`, `/repositories`, `/projects`, `/access`, `/settings` → rotas filhas de `ProtectedRoute` e `AppLayout` (rotas aninhadas). `ProtectedRoute` manda quem não tem login para `/login` e quem não tem organização para `/organizacao`.

**Passo 5 — `AppLayout` monta a casca do sistema.**
O `App.jsx` envolve tudo em `ToastProvider` (avisos) e declara as rotas. O `src/app/AppLayout.jsx`:
1. Guarda estados de tela: menu lateral aberto, menu da conta e busca global aberta.
2. Carrega as configurações com `useLocalStorage('govtech:settings', defaultSettings)` e aplica o tema com `useTheme`.
3. Busca a lista de projetos com o hook `useProjects()` (TanStack Query) só para a busca global; cada página busca o que precisa pelo mesmo hook, e o cache evita ler duas vezes.
4. Descobre a seção atual pelo endereço, usando `routeSections` (ex.: `/projects` → “Projetos”).
5. Desenha `Sidebar`, `Topbar`, `GlobalSearch` e um `<Outlet>`: o React Router coloca ali a página da rota atual.
6. Repassa as configurações às páginas pelo `context` do `<Outlet>`. Os adaptadores em `src/app/routes.jsx` ligam rota e página: a Visão geral recebe os projetos por prop porque uma feature (dashboard) não importa de outra (projects).

**Passo 6 — Ações do usuário mudam o estado.**
Exemplo: ao criar um projeto, `ProjectsPage` chama `useCreateProject().mutateAsync(dados)`. Isso executa `createProject` em `features/projects/api/projectsApi.js` (que grava no Supabase, na organização do usuário) e invalida a query `['projects']`; o TanStack Query busca a lista de novo e todas as telas que usam `useProjects()` são redesenhadas.

**Passo 7 — Redirecionamentos.**
Qualquer endereço desconhecido cai em `<Navigate to="/login" />`.

---

## 7. Rotas (endereços da aplicação)

Definidas em `src/app/App.jsx`:

| Endereço | Componente | Layout | Observação |
|---|---|---|---|
| `/` | redireciona para `/login` | Público | — |
| `/login` | `LoginPage` | Público | Login com e-mail e senha. Quem já está logado vai para `/dashboard`. |
| `/cadastro` | `SignupPage` | Público | Cria a conta (nome, e-mail, senha). |
| `/organizacao` | `OrganizationPage` | Logado | Criar organização (vira admin) ou entrar com código (vira stakeholder). |
| `/landing` | `LandingPage` | Público | Página institucional. |
| `/dashboard` | `AppLayout` → `OverviewPage` | Autenticado | Visão geral. |
| `/audit` | `AppLayout` → `AuditPage` | Autenticado | Auditoria. |
| `/repositories` | `AppLayout` → `RepositoriesPage` | Autenticado | Repositórios. |
| `/projects` | `AppLayout` → `ProjectsPage` | Autenticado | Projetos. |
| `/access` | `AppLayout` → `RbacPage` | Autenticado | Acessos e RBAC. |
| `/settings` | `AppLayout` → `SettingsPage` | Autenticado | Configurações. |
| qualquer outro | redireciona para `/login` | — | — |

> “Autenticado” = passa pelo `ProtectedRoute`. A proteção na tela é só conveniência: quem garante o acesso aos dados é o RLS do banco (`backend/supabase/`).

---

## 8. Páginas

### 8.1 Login, cadastro e organização (`features/auth/`)
- As três telas usam a mesma moldura (`AuthLayout`) e formulários com **react-hook-form + zod** (`utils/schemas.js`). Erros aparecem embaixo de cada campo, ligados por `aria-describedby`.
- **Login** (`LoginPage`): `signInWithPassword`. Mensagens em pt-BR para senha errada, e-mail não confirmado e excesso de tentativas.
- **Cadastro** (`SignupPage`): cria a conta com o nome em `user_metadata.full_name`; um trigger do banco cria o perfil. Se o Supabase exigir confirmação de e-mail, a tela avisa para abrir o link.
- **Organização** (`OrganizationPage`): duas opções, **criar** (`create_organization`, vira admin) ou **entrar com código** (`join_organization`, vira stakeholder; o código não diferencia maiúsculas). Código errado mostra “Código de organização inválido.” sem dizer se a organização existe.
- **Sair**: no menu da conta (Topbar). A barra lateral e o menu mostram o nome, o papel e a organização de quem está logado.
- **Código de convite**: o admin vê o código da organização no menu da conta, com botão de copiar (`shared/layout/InviteCode.jsx`). Os outros papéis não veem o código na tela. O RLS deixa qualquer membro ler a organização, então o código não é segredo dentro dela: se um dia precisar ser, a coluna sai do `select` dos não-admins por migration.

### 8.2 `LandingPage.jsx` — Apresentação (marketing)
Página de vendas com seções com âncora (`#capabilities`, `#how-it-works`, `#standards`, `#demo`):
- **Capacidades**: monitoramento de PRs, integração com GitHub, GitHub Actions, indicadores de governança, alertas e rastreabilidade.
- **Como funciona**: Coleta → Automação → Análise → Acompanhamento.
- **Padrões citados**: SPICE/MMI, COBIT, ITIL e ISO/IEC 38500.
- **Chamada final** para demonstração.

É conteúdo estático. As menções a “API do GitHub” são texto de marketing; a integração **não existe no código**.

### 8.3 `DashboardPage.jsx` — removido
Era uma segunda forma de navegar (estado `active` + `switch`) que duplicava a barra lateral, a lista de projetos e o tema. Foi apagado na limpeza de 31/10/2026; a Visão geral agora é renderizada direto pelo `App.jsx`.

### 8.4 `OverviewPage.jsx` — Visão geral
Recebe `projectList` e mostra:
- **`ProjectStatusSummary`**: resumo dos projetos (contagem por semáforo).
- **4 cartões (`StatCard`)**:
  - *PRs integradas*: conta PRs com status `merged` em `mockData`.
  - *Lead time médio*: **valor fixo** “4.2 dias”.
  - *Taxa de aprovação*: calculada `(approved + merged) / total × 100`.
  - *Alertas ativos*: **valor fixo** “3”.
- **Gráfico de fluxo** (`PullRequestFlowChart`) e **distribuição** de PRs (`PullRequestDistribution`): abertas, em revisão, aprovadas, integradas.
- **Lista de projetos** ordenada pelo pior status primeiro (atrasado → atenção → no prazo), com borda colorida e ícone 🔴/🟡/🟢.
- Também importa `AutomatedAlerts` e `RecentActivityPanel`.

### 8.5 `ProjectsPage.jsx` — Projetos
É o módulo mais completo para o usuário final:
- **Cards** de projeto com nome, responsável, prazo, barra de progresso e alerta se o status for `danger`.
- **Status manual**: cada projeto tem um campo `status` escolhido no formulário (`success` = Saudável, `warning` = Atenção, `danger` = Risco). É diferente do semáforo de prazo (§11.2), que é calculado pela deadline.
- **3 indicadores**: total, “em atenção” (`status === 'warning'`), “riscos críticos” (`status === 'danger'`).
- **Novo projeto**: abre `ProjectFormModal` vazio.
- **Clique em um card**: abre `ProjectDetailModal` (descrição, prazo formatado, status calculado, botões Editar e Excluir conforme o papel, e a seção **GitHub**).
- **Seção GitHub** (`GitHubPanel`, desde 02/11/2026): o admin cola a chave *fine-grained* do GitHub (só leitura). A chave é testada no GitHub, guardada criptografada no Vault e nunca volta para o navegador; a tela mostra só `••••` + os 4 últimos caracteres e o login. Logo depois de conectar, o admin **escolhe os repositórios do projeto** numa lista com tudo o que a chave enxerga (a chave sempre lê também os repositórios públicos); dá para mudar depois em **Escolher repositórios**. Salvar já sincroniza. Admin e developer clicam em **Sincronizar** (só aparece com repositórios escolhidos); o admin também troca e remove a chave. Stakeholder só vê a situação.
- **Editar**: mesmo formulário, preenchido. Ao salvar, o projeto é substituído pelo mesmo `id`.
- **Excluir**: abre `DeleteProjectModal` pedindo confirmação; depois filtra o projeto da lista.
- Os avisos (toast) aparecem ao criar, editar e excluir.

### 8.6 `RepositoriesPage.jsx` — Repositórios (dados reais do GitHub desde 02/11/2026)
- **Filtro por projeto** (“Todos os projetos” ou um projeto) e três abas: **Repositórios**, **Pull Requests** e **Branches**.
- Os dados vêm das tabelas `repositories`, `pull_requests` e `branches`, preenchidas pela Edge Function `github` quando alguém clica em **Sincronizar** no projeto. Cada repositório é guardado uma vez por empresa e ligado aos projetos pela tabela `project_repositories`: um repositório usado por dois projetos aparece uma vez, com a coluna **Projetos** listando os dois. Não há atualização automática.
- **Números calculados**, nada fixo (`utils/metrics.js`): PRs abertos, PRs mergeados nos últimos 30 dias e tempo médio até o merge.
- Limites por sincronização: 100 repositórios por chave; 100 PRs (os mais recentes) e 100 branches por repositório.
- Sem nada sincronizado, a página explica como conectar.

### 8.7 `AuditPage.jsx` — Auditoria
- Lista `auditEvents` (ação, serviço, autor, hash, horário, status).
- Cartões com **valores fixos**: “34” aprovações e “92%” de conformidade.
- Botões **“Exportar CSV”** e **“Filtrar”** existem, mas **não têm ação** (não fazem nada ao clicar).

### 8.8 `RbacPage.jsx` — Acessos e RBAC (dados reais desde 02/11/2026)
- **Papéis e permissões:** três cartões (Admin, Developer, Stakeholder; o viewer saiu em 03/11/2026) com o que cada papel **realmente** pode fazer (`utils/roles.js`, espelho das regras do banco). Clicar abre `RoleDetailModal`.
- **Membros:** nome, e-mail e papel de cada pessoa da organização (`membersApi.listMembers`).
- **Admin:** troca o papel numa lista, remove membros (com confirmação) e abre **Convidar**, que mostra o código com botão de copiar e permite **gerar novo código** (o anterior para de valer).
- **Outros papéis:** veem a lista sem controles e podem **sair** da organização.
- O banco não deixa a organização sem admin: rebaixar ou remover o último mostra “A organização precisa de pelo menos um administrador.”.
- O papel também decide os botões da página de Projetos: stakeholder não vê criar, editar nem excluir; developer não vê excluir (`projectPermissions` em `app/routes.jsx`). Quem bloqueia de verdade é o RLS.

### 8.9 `SettingsPage.jsx` — Configurações
Quatro abas:
1. **Geral** — nome da organização, fuso horário (Brasília, Nova York, Londres) e tema (Claro, Escuro, Sistema). Salvar chama `onSaveSettings`.
2. **Integrações** — cartões de GitHub, SonarQube, Slack e Jira. Os botões mostram só um aviso “ação demonstrativa”; **nenhuma integração é de fato feita**.
3. **Notificações** — quatro interruptores (deploy, erros críticos, segurança, resumo semanal) guardados em `settings.notifications`.
4. **Segurança** — 2FA, sessões e troca de senha. Botões também são demonstrativos.

### 8.10 `ChatbotModal.jsx` — Assistente virtual
Modal aberto pelo menu lateral com **perguntas frequentes fixas** (`faqs`). Não há IA: a resposta é um texto pré-escrito encontrado na lista. Ver §15 sobre respostas que descrevem funções inexistentes.

---

## 9. Componentes

### 9.1 Layout (estrutura da tela)

| Componente | Responsabilidade | Props principais |
|---|---|---|
| `Sidebar` | Menu lateral com logo, seletor de “workspace”, itens de menu e botão do chatbot. Usa `useNavigate` para trocar de rota. | `open`, `setOpen`, `settings` |
| `Topbar` | Barra superior: botão de menu (mobile), breadcrumb “GOVTECH PLATFORM › SEÇÃO”, sino e menu da conta. | `active`, `setOpen`, `onNavigate` |
| `GlobalSearch` | Busca em projetos, serviços, PRs e branches. Abre pelo botão de lupa da Topbar e fecha com `Esc`, com o X ou clicando fora. Escolher um projeto leva a `/projects` com o detalhe dele aberto. | `open`, `onClose`, `projects`, `onNavigate`, `onSelectProject` |

### 9.2 Comuns

| Componente | O que faz |
|---|---|
| `Brand` | Logo “GovTech MS”. |
| `Icon` | Recebe um **nome** de ícone em texto (`name="Shield"`) e busca no mapa `iconMap`. Se o nome não existir, mostra o ícone de interrogação (`CircleHelp`) como fallback. |
| `StatCard` | Cartão com título, valor grande, subtexto, ícone e variação (`trend`) com seta. |
| `StatusBadge` | Etiqueta colorida. `status` = `success`, `warning`, `danger`… |
| `Toast` | Aviso que some sozinho após alguns segundos. Exibido pelo `ToastProvider`; as páginas chamam `const { showToast } = useToast()` (`src/shared/hooks/useToast.js`). A área do aviso tem `role="status"`, então leitores de tela anunciam a mensagem. |
| `Modal` | Diálogo acessível usado por todos os modais (projetos, RBAC): `role="dialog"`, título ligado por `aria-labelledby`, foco entra no diálogo e fica preso nele (Tab), `Esc` fecha e o foco volta para quem abriu. No celular (< 640 px) abre como folha a partir da parte de baixo. Substituiu o `ModalShell` em 01/11/2026. Props: `title`, `kicker`, `size` (`sm`/`md`/`lg`), `onClose`. |
| `ChatbotModal` | Assistente com FAQ fixa. |

### 9.3 Dashboard

| Componente | O que mostra |
|---|---|
| `ProjectStatusSummary` | Resumo “Status dos Projetos” (contagem por semáforo, pelo `getProjectStatus`). |
| `PullRequestFlowChart` | Gráfico de fluxo de PRs criadas × integradas. |
| `PullRequestDistribution` | Distribuição das PRs por status (abertas, em revisão, aprovadas, integradas). |
| `AutomatedAlerts` | Painel “Alertas Automatizados”, com a origem indicada como GitHub Actions. |
| `RecentActivityPanel` | Painel “Atividade Recente” com eventos de PR e branch. |

### 9.4 Projetos

| Componente | Função |
|---|---|
| `ProjectFormModal` | Formulário de criar/editar: nome, objetivo, deadline, prioridade, responsável, progresso (0–100) e repositórios vinculados (checkboxes vindos de `services`). |
| `ProjectDetailModal` | Detalhes com status calculado e botões Editar/Excluir. |
| `DeleteProjectModal` | Confirmação de exclusão. |

### 9.5 Repositórios

| Componente | Usado? | Função |
|---|---|---|
| `RepositoriesList` | Sim | Indicadores (repositórios ativos, branches, PRs abertas) e lista de repositórios. |
| `PullRequestsList` | Sim | Indicadores (PRs abertas, tempo médio de revisão, aprovações pendentes) e lista de PRs com autor. |
| `BranchesList` | Sim | Lista de branches. |

### 9.6 RBAC

| Componente | Função |
|---|---|
| `RoleDetailModal` | O que um papel pode fazer. |
| `InviteModal` | Código de convite, copiar e gerar novo (só admin). |
| `RemoveMemberModal` | Confirmação para remover alguém ou sair da organização. |

---

## 10. Dados, estado e armazenamento

### 10.1 De onde vêm os dados

| Arquivo | Conteúdo | Quem usa |
|---|---|---|
| `data/mockData.js` | `profile`, `services`, `repoStats`, `projects`, `pullRequests`, `branches`, `auditEvents`, `repositoryList`, `pullRequestList`, `branchList` | Telas que ainda não têm dado real. (`accessRoles` e `rbacUsers` saíram em 02/11/2026.) |
| Dentro dos próprios componentes | Só os números fixos dos cartões (ex.: “34” e “92%” na Auditoria) e a FAQ do chatbot | Cada tela. |

Os mocks são intencionais: o app continua usando dados de exemplo até o Supabase entrar.

Os projetos de exemplo em `mockData.js` (IDs 1–4) têm status manual (Risco, Atenção, Saudável, Risco) e prazos em 2026. Como hoje é **31/10/2026**, três deles (“Plataforma de Pagamentos”, “Sistema de Notificações”, “Refatoração User Service”) aparecem como **atrasados**, e “Dashboard Analítico” (prazo 15/11) como **no prazo**. Por isso o semáforo da Visão geral mostra cores variadas.

### 10.2 Estado (memória da tela)

O estado vive em componentes React com `useState`. Os principais:

- **Dados de projeto** (estado de servidor): TanStack Query, chave `['projects']`, hooks em `features/projects/hooks/useProjects.js`. Nenhum componente guarda a lista em `useState`.
- `AppLayout.jsx` → `settings` (via `useLocalStorage`), `sidebarOpen`, `accountMenuOpen`, `searchOpen`.
- `ToastProvider` → o aviso visível no momento.
- `ProjectsPage.jsx` → `showForm`, `selectedProjectId` (o id, para o detalhe sempre mostrar o dado atual), `editingProject`, `showDeleteConfirm`.
- `SettingsPage.jsx` → `tab` e `draft` (rascunho que só vira configuração ao clicar em “Salvar”).

### 10.3 Persistência no navegador (`localStorage`)

Chaves declaradas em `constants/storageKeys.js`:

| Constante | Valor real da chave | Onde é usada |
|---|---|---|
| `storageKeys.SETTINGS` | `govtech:settings` | `AppLayout.jsx`, via `useLocalStorage`. |
| (Supabase) | `govtech-auth` | Sessão do login, gravada pelo `supabase-js` (`shared/lib/supabase.js`). |

> Desde 01/11/2026 os projetos ficam no banco. A antiga chave `govtech:projects` não é mais lida e pode ser apagada pelo DevTools.

### 10.4 Como o `useLocalStorage` funciona

`hooks/useLocalStorage.js` é um “useState que lembra”:
1. Na primeira renderização, tenta ler a chave no `localStorage`; se não houver, usa o valor inicial.
2. Sempre que o valor muda, o `useEffect` grava de novo como texto JSON.
3. Qualquer erro (ex.: navegador em modo privado com armazenamento bloqueado) é capturado, e o app continua.

---

## 11. Regras de negócio

Todas em `utils/projectUtils.js`.

### 11.1 `normalizeProject(project)`
Garante que um projeto sempre tenha campos válidos, mesmo que os dados salvos estejam incompletos ou corrompidos:
- `name` vazio → `"Projeto sem nome"`.
- `priority` fora de `high | medium | low` → `"medium"`.
- `progress` → número entre 0 e 100 (valores inválidos viram 0).
- `repositories` → só strings.

### 11.2 `getProjectStatus(project)` — o semáforo
Calcula a diferença em dias entre hoje e o prazo (`deadline`), com as duas datas à meia-noite. Fica em `src/shared/lib/projectUtils.js`. Até 01/11/2026 a contagem saía com um dia a mais (o prazo ia até 23:59:59 e era arredondado para cima); os testes acharam e o bug foi corrigido.

| Condição | Resultado | Cor | Ícone |
|---|---|---|---|
| Sem prazo | Atenção — “Deadline não configurada” | amarelo | 🟡 |
| Prazo inválido | Atenção — “Deadline inválida” | amarelo | 🟡 |
| Dias restantes < 0 | Atrasado — “Atrasado há N dia(s)” | vermelho | 🔴 |
| 0 a 7 dias | Atenção — “N dia(s) restante(s)” ou “vence hoje” | amarelo | 🟡 |
| Mais de 7 dias | No prazo | verde | 🟢 |

### 11.3 `formatProjectDate(data)`
Converte `2026-10-25` para `25/10/2026` (formato pt-BR). Usa meio-dia para evitar erro de fuso que “voltaria” o dia.

### 11.4 Taxa de aprovação (Visão geral)
`(aprovadas + integradas) / total de PRs × 100`, arredondado. Com `mockData`: (1 + 1) / 4 = **50%**.

---

## 12. Aparência e tema

- **Design tokens** em `tokens.css`: variáveis CSS como `--color-primary-500: #9370db` (roxo principal), `--color-success`, `--color-danger`, `--color-surface` etc. Se quiser mudar a cor da marca, comece por aqui.
- **Tema claro** em `:root` e **tema escuro** em `:root[data-theme='dark']`.
- **`useTheme`** (chamado no `App.jsx`) coloca `data-theme="dark"` ou `"light"` no `<html>` conforme `settings.theme` (`Claro`, `Escuro` ou `Sistema`). Com “Sistema”, consulta `prefers-color-scheme` do computador. É o único lugar que aplica o tema.
- `app.css` e `index.css` aplicam esses tokens nas telas. Classes como `.dashboard-content`, `.panel`, `.metric-card`, `.status-badge` são reutilizadas em várias páginas.
- Os gráficos são desenhados com **SVG** manualmente, sem biblioteca de gráficos.

---

## 13. Deploy (Vercel)

`frontend/vercel.json` (o projeto da Vercel precisa usar **Root Directory = `frontend`**):
```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```
- A Vercel roda `npm run build` e publica a pasta `dist/`.
- O bloco `rewrites` é essencial para SPAs: sem ele, abrir diretamente `/projects` daria erro 404, porque não existe arquivo `projects` no servidor. Com ele, todo endereço devolve `index.html`, e o React Router cuida do resto.
- O arquivo `.gitignore` ignora `.vercel/` (pasta local criada pela CLI da Vercel).

---

## 14. Tem resquícios de back-end?

> **Atualização de 01/11/2026:** agora há back-end real. O banco, as regras de acesso e os testes ficam em `backend/supabase/` (ver `backend/README.md`); o front fala com ele só pelos arquivos `features/*/api/` (regra do ESLint). Variáveis: `frontend/.env.example` (copiar para `.env.local`). O texto abaixo descreve o estado de 31/10/2026 e fica como registro.

**Resposta curta (31/10/2026): não havia back-end em funcionamento. Havia alguns vestígios que pareciam de back-end, mas eram só texto, configuração ou código não usado.**

### Evidências de que NÃO havia back-end (31/10/2026)
- `package.json`: nenhuma dependência de servidor (sem Express, Fastify, Prisma, Mongoose, Supabase, Firebase, etc.). Só React, Router, Lucide e Vite.
- Nenhuma chamada de rede: não há `fetch`, `axios`, `XMLHttpRequest` nem URLs de API no código.
- Não há pasta `server/`, `api/`, `backend/`, nem arquivos `.env` versionados, nem migrations, nem modelos de banco.
- O histórico git (6 commits) não tem nenhum arquivo de servidor, nem remoto, nem arquivo removido.
- O login não verifica nada: `LoginPage` só faz `window.location.href = '/dashboard'`.

### Vestígios que parecem back-end (e o que realmente são)

| Vestígio | Onde | O que é de verdade |
|---|---|---|
| `.env`, `.env.local`, `.env.*.local` no `.gitignore` | `.gitignore` | Padrão para guardar segredos de servidor. Não há nenhum `.env` no projeto. |
| `.vercel/` no `.gitignore` | `.gitignore` | Pasta da CLI da Vercel. Não é back-end. |
| `vercel.json` | raiz | Configuração de **hospedagem estática** (só reescreve rotas). Não roda código no servidor. |
| `"framework": "vite"` | `vercel.json` | Diz à Vercel que é um projeto Vite. |
| `services` (“identity-gateway”, “billing-orchestrator”, etc.) | `data/mockData.js` | Serviços **fictícios** com nomes de microsserviços, só para exibir. |
| Textos “API do GitHub”, “Integração com GitHub Actions” | `LandingPage.jsx` | Marketing. A integração não existe. |
| Integrações GitHub, SonarQube, Slack, Jira “Conectado” | `SettingsPage.jsx` | Cartões fixos. O botão só mostra um aviso. |
| Usuários com e-mail `@govtech.ms` | `RbacPage.jsx` | Dados fixos no código. |
| Hashes `a82f91c0…7d2e` | `mockData.js` (auditoria) | Strings inventadas, sem cálculo real. |

### Transição para o back-end
1. ✅ `features/projects/api/projectsApi.js` chama o Supabase (01/11/2026). Telas e hooks não mudaram; o contrato `__tests__/projectsApi.test.js` roda contra o Supabase simulado pelo MSW.
2. ✅ Login, cadastro e organizações reais (`features/auth/`), com `ProtectedRoute`.
3. ⏳ `mocks/mockData.js` → cada array vira tabela quando a feature correspondente ganhar dados reais (auditoria, GitHub, RBAC; ver PLANO_TECNICO §16.6).

---

## 15. Problemas e inconsistências encontrados

Organizados por gravidade. ✅ = resolvido na limpeza de 31/10/2026 (branch `chore/limpeza`). ⏳ = pendente.

### 15.1 Alta (afetam o funcionamento)

1. ✅ **Layout duplicado na Visão geral.** O `DashboardPage` (com uma segunda `Sidebar`) foi removido; `/dashboard` renderiza o `OverviewPage` direto. Verificado no navegador: uma única barra lateral.
2. ✅ **Duas formas de navegar.** Sobrou só a navegação por rotas do `App.jsx`, com uma lista de projetos, uma de configurações e um único lugar que aplica o tema.
3. ✅ **Chaves de storage erradas.** Agora os projetos vão para `govtech:projects` e as configurações para `govtech:settings`. Os aliases duplicados (`STORAGE_KEYS`, `DEFAULT_SETTINGS`) foram removidos.
4. ✅ **Projetos sem status.** Criado o status manual (`constants/projectStatus.js`), com campo no formulário; os contadores “Em atenção” e “Riscos críticos” passaram a funcionar.
5. ✅ **Projetos não eram salvos.** O `App.jsx` não gravava a lista de projetos (só o `DashboardPage` gravava). Agora grava a cada mudança; verificado com reload.
6. ✅ **Nenhuma proteção de rota.** Resolvido em 01/11/2026 com o Supabase Auth (`ProtectedRoute`) e RLS no banco.

### 15.2 Média (comportamento enganoso)

7. ⏳ **Botões sem função:** “Exportar CSV” e “Filtrar” (Auditoria). Os do RBAC foram resolvidos em 02/11/2026: “Convidar” funciona; “Nova função”, “Filtrar” e “Adicionar” saíram.
8. ⏳ **Respostas do chatbot descrevem funções que não existem** (`ChatbotModal.jsx`: “Exportar Dados”, “seção Riscos”, campo “branch”).
9. ⏳ **Valores fixos** (“4.2 dias”, “3” alertas, “34”, “92%”). Mantidos por decisão do time até haver dados reais.
10. ✅ **Login aceita qualquer coisa.** Resolvido em 01/11/2026: login real com o Supabase Auth.
11. ⏳ **Integrações e 2FA são demonstrativas.**
12. ✅ **Busca global nunca abre:** corrigido em 01/11/2026 (o `AppLayout` controla `open` e a Topbar abre a busca); coberto por testes.

### 15.3 Baixa (qualidade de código)

13. ✅ `console.log` de depuração em `ProjectsPage.jsx` removidos.
14. ✅ Código morto removido (ver §16).
15. ✅ Lógica de tema unificada no `useTheme`; o padrão passou de `light` para `Claro`, que é um valor que a tela de Configurações reconhece.
16. ✅ Mocks que estavam dentro dos componentes (RBAC, repositórios, PRs, branches) movidos para `data/mockData.js`.
17. ✅ Imports não usados removidos (`LandingPage`, `OverviewPage`).
18. ⏳ **Nomes de ícone em texto** (`icon: 'GitPullRequest'`) com fallback silencioso em `Icon.jsx`.
19. ⏳ **~330 estilos inline** e **10 breakpoints diferentes**: tratados na fase de nova estrutura/responsividade.
20. ✅ **Sem favicon**: corrigido em 01/11/2026 com `frontend/public/favicon.svg`.

---

## 16. Código morto

Removido na limpeza de 31/10/2026 (recuperável pelo histórico do git):

| Arquivo / trecho | Motivo |
|---|---|
| `pages/DashboardPage.jsx`, `components/layout/DashboardLayout.jsx` | Navegação duplicada (§15.1) |
| `data/projects.js` | Não importado |
| `components/projects/ProjectCard.jsx`, `components/projects/ProjectStatusSummary.jsx` | Não importados (o `ProjectStatusSummary` usado é o de `components/dashboard/`) |
| `components/repositories/BranchStat.jsx`, `BranchesTable.jsx`, `PullRequestsTable.jsx`, `RepositoriesTable.jsx`, `PullRequestDetailModal.jsx` | Não importados (3 deles estavam vazios) |
| `projectsMock` em `ProjectsPage.jsx` | Declarado e não usado |
| `THEME`, `TOKEN` em `storageKeys.js`; `getStoredSettings`, `saveSettings` | Sem uso após a unificação |

O `Toast.jsx`, que estava sem uso, voltou a ser usado em 01/11/2026 pelo `ToastProvider`.

---

## 17. Limitações desta documentação

- Li por completo: `App.jsx`, `main.jsx`, `ProjectsPage.jsx`, `AuditPage.jsx`, `RepositoriesPage.jsx`, `RbacPage.jsx`, `SettingsPage.jsx`, `ProjectFormModal.jsx`, `DeleteProjectModal.jsx`, `utils/`, `hooks/`, `constants/`, `data/mockData.js` e a configuração (`package.json`, `vite.config.js`, `vercel.json`, `index.html`).
- Li parcialmente: `LoginPage.jsx`, `OverviewPage.jsx`, `Sidebar.jsx`, `Topbar.jsx`, `GlobalSearch.jsx`, `ChatbotModal.jsx`, `ProjectDetailModal.jsx`, `Icon.jsx`. Os trechos não lidos não foram descritos em detalhe.
- Não li linha a linha: `LandingPage.jsx`, `Toast`, `StatCard`, `StatusBadge`, `Brand`, `RoleDetailModal`, os componentes de gráfico (`PullRequestFlowChart`, `PullRequestDistribution`), `AutomatedAlerts`, `RecentActivityPanel`, `RepositoriesList`, `PullRequestsList`, `BranchesList`, e os arquivos CSS. Para eles, a descrição vem do nome, de títulos visíveis no código e de quem os importa.
- Os itens da §15.1 marcados como “verificado pelo código” não foram observados no navegador. Vale abrir `npm run dev` e conferir, especialmente as duas barras laterais e os selos da página de Projetos.
- Esta documentação descreve o estado do commit `193c764` mais a limpeza da branch `chore/limpeza` (31/10/2026). Se o código mudar, ela precisa ser atualizada.
