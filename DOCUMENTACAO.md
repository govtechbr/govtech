# GovTech MS — Documentação do Projeto

Plataforma web de **governança e monitoramento de projetos de TI**: painel com indicadores, lista de projetos com prazo e progresso, visão de repositórios/Pull Requests/branches, auditoria, controle de acesso (RBAC) e configurações.

> **Resumo para quem não é da área de front-end:** este projeto é uma **aplicação 100% front-end**. Ele roda inteiramente no navegador. **Não existe servidor, banco de dados ou API neste repositório.** Os dados exibidos vêm de arquivos JavaScript de exemplo (“mock”) e são salvos no `localStorage` do navegador. Detalhes na seção [Tem resquícios de back-end?](#14-tem-resquícios-de-back-end).

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

Estado atual do projeto (verificado no código, commit `8ed3a40`):

| Item | Situação |
|---|---|
| Build de produção (`npm run build`) | Passa sem erros |
| Histórico git | 6 commits, todos em 2026-10-01 |
| Chamadas de rede (`fetch`, `axios`, etc.) | Nenhuma |
| Login | Simulado: qualquer senha redireciona para o painel |
| Autenticação real / proteção de rotas | Não existe |
| Dados | Arquivos de exemplo + `localStorage` |

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

Pré-requisito: **Node.js** instalado (versão 18 ou superior recomendada). Para conferir: abra um terminal e rode `node -v`.

### Passo 1 — Entrar na pasta do projeto

```bash
cd C:\Users\oguil\Documents\tcc\govtech-ms
```

### Passo 2 — Instalar as dependências

```bash
npm install
```

Isso lê o `package.json` e baixa as bibliotecas para a pasta `node_modules/` (que não vai para o git, conforme o `.gitignore`).

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

### Verificação feita para esta documentação

`npm ci` e `npm run build` foram executados com sucesso: 1631 módulos transformados, sem erros. O bundle JavaScript final tem cerca de 307 kB (88 kB comprimido).

---

## 5. Estrutura de pastas

```
govtech-ms/
├── index.html            ← Única página HTML. Contém só <div id="root">.
├── main.jsx              ← Ponto de entrada do React (liga tudo ao HTML).
├── App.jsx               ← Define as rotas e o layout autenticado.
├── index.css             ← Estilos globais (inclui tema escuro).
├── app.css               ← Estilos das telas e componentes.
├── tokens.css            ← “Variáveis” de cor, espaçamento e sombra (design tokens).
├── vite.config.js        ← Configuração do Vite (só ativa o plugin do React).
├── vercel.json           ← Configuração de publicação na Vercel.
├── package.json          ← Nome do projeto, scripts e lista de dependências.
├── package-lock.json     ← Versões exatas das dependências instaladas.
├── .gitignore            ← Arquivos que o git ignora (node_modules, dist, .env…).
│
├── pages/                ← Telas completas, uma por rota/menu.
│   ├── LoginPage.jsx         Tela de login (simulada).
│   ├── LandingPage.jsx       Página de apresentação do produto (marketing).
│   ├── DashboardPage.jsx     Casca antiga do painel com troca de telas por estado (ver §15).
│   ├── OverviewPage.jsx      “Visão geral”: KPIs, gráficos e status dos projetos.
│   ├── ProjectsPage.jsx      Cadastro, edição, exclusão e cards de projetos.
│   ├── RepositoriesPage.jsx  Abas: Repositórios, Pull Requests, Branches.
│   ├── AuditPage.jsx         Lista de eventos de auditoria.
│   ├── RbacPage.jsx          Papéis e lista de usuários.
│   └── SettingsPage.jsx      Configurações gerais, integrações, notificações, segurança.
│
├── components/           ← Peças reutilizáveis, agrupadas por assunto.
│   ├── layout/           Estrutura da tela: Sidebar (menu lateral), Topbar (barra superior),
│   │                     GlobalSearch (busca), DashboardLayout (casca do painel).
│   ├── common/           Genéricos: Brand (logo), Icon (ícone por nome), StatCard (cartão de número),
│   │                     StatusBadge (etiqueta colorida), Toast (aviso), ModalShell, ChatbotModal.
│   ├── dashboard/        Gráficos e painéis da Visão geral.
│   ├── projects/         Modais de projeto (formulário, detalhes, exclusão).
│   ├── repositories/     Listas e modal de repositórios, PRs e branches.
│   └── rbac/             Modal de detalhes de um papel.
│
├── data/                 ← Dados de exemplo (mock).
│   ├── mockData.js       Dados principais usados pelo app.
│   └── projects.js       Dados antigos, não utilizados (ver §16).
│
├── constants/            ← Valores fixos.
│   ├── colors.js         Cores usadas em gráficos e status.
│   ├── defaultSettings.js Configurações padrão.
│   └── storageKeys.js    Nomes das chaves do localStorage.
│
├── hooks/                ← Funções reutilizáveis com lógica de estado.
│   ├── useLocalStorage.js Guarda um estado React no localStorage automaticamente.
│   └── useTheme.js        Aplica o tema claro/escuro no <html>.
│
└── utils/                ← Funções auxiliares puras (sem tela).
    ├── projectUtils.js   Normaliza projetos, formata datas e calcula o semáforo de prazo.
    └── storageUtils.js   Lê e grava projetos e configurações no localStorage.
```

---

## 6. Como a aplicação inicia (passo a passo)

Esta é a sequência real, seguindo o código:

**Passo 1 — O navegador abre `index.html`.**
Ele tem apenas `<div id="root"></div>` e carrega `main.jsx` como módulo.

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
- `/`, `/login` → `LoginPage`.
- `/landing` → `LandingPage`.
- `/dashboard`, `/audit`, `/repositories`, `/projects`, `/access`, `/settings` → `AuthenticatedLayout`.

**Passo 5 — `AuthenticatedLayout` monta a casca do sistema.**
Dentro de `App.jsx` ele:
1. Guarda estados de tela: aviso (toast), menu lateral aberto, menu da conta, e `isAuthenticated` (sempre `true`).
2. Carrega as configurações com `useLocalStorage('govtech:settings', defaultSettings)`.
3. Carrega a lista de projetos com `getStoredProjects(projetosDoMock)`.
4. Descobre a seção atual pelo endereço, usando `routeSections` (ex.: `/projects` → “Projetos”).
5. Desenha `Sidebar`, `Topbar`, `GlobalSearch` e, conforme a seção, a página correspondente.

**Passo 6 — Ações do usuário mudam o estado.**
Exemplo: ao criar um projeto, `ProjectsPage` chama `setProjectList(...)`. Como `projectList` é estado do React, a tela é redesenhada. O `useLocalStorage`/`saveProjects` grava a nova lista no navegador.

**Passo 7 — Redirecionamentos.**
Qualquer endereço desconhecido cai em `<Navigate to="/" />`, ou seja, volta para o login.

---

## 7. Rotas (endereços da aplicação)

Definidas em `App.jsx`:

| Endereço | Componente | Layout | Observação |
|---|---|---|---|
| `/` | `LoginPage` | Público | Tela inicial. |
| `/login` | `LoginPage` | Público | Mesma tela. |
| `/landing` | `LandingPage` | Público | Página institucional. |
| `/dashboard` | `AuthenticatedLayout` → `DashboardPage` → `OverviewPage` | Autenticado | Visão geral. |
| `/audit` | `AuthenticatedLayout` → `AuditPage` | Autenticado | Auditoria. |
| `/repositories` | `AuthenticatedLayout` → `RepositoriesPage` | Autenticado | Repositórios. |
| `/projects` | `AuthenticatedLayout` → `ProjectsPage` | Autenticado | Projetos. |
| `/access` | `AuthenticatedLayout` → `RbacPage` | Autenticado | Acessos e RBAC. |
| `/settings` | `AuthenticatedLayout` → `SettingsPage` | Autenticado | Configurações. |
| qualquer outro | redireciona para `/` | — | — |

> “Autenticado” aqui é só nome: não há verificação de login. Qualquer pessoa digitando `/dashboard` entra.

---

## 8. Páginas

### 8.1 `LoginPage.jsx` — Login (simulado)
- Mostra cabeçalho com logo, link “Capacidades” (vai para a landing) e “Ver demonstração” (vai para `/dashboard`).
- Formulário com campo de senha que pode ser mostrado/ocultado.
- Ao enviar: `submit` mostra um aviso e, após **700 ms**, faz `window.location.href = '/dashboard'`.
- **Não valida** usuário nem senha. Nada é enviado a lugar nenhum.

### 8.2 `LandingPage.jsx` — Apresentação (marketing)
Página de vendas com seções com âncora (`#capabilities`, `#how-it-works`, `#standards`, `#demo`):
- **Capacidades**: monitoramento de PRs, integração com GitHub, GitHub Actions, indicadores de governança, alertas e rastreabilidade.
- **Como funciona**: Coleta → Automação → Análise → Acompanhamento.
- **Padrões citados**: SPICE/MMI, COBIT, ITIL e ISO/IEC 38500.
- **Chamada final** para demonstração.

É conteúdo estático. As menções a “API do GitHub” são texto de marketing; a integração **não existe no código**.

### 8.3 `DashboardPage.jsx` — Casca antiga do painel
Este arquivo guarda uma **segunda forma de navegar**: em vez de rotas, usa um estado `active` (texto como “Visão geral”, “Projetos”) e um `switch` para escolher a página. Ele também guarda projetos e configurações, aplica o tema e mostra o `Toast`.

Hoje ele é usado **só** para renderizar a Visão geral dentro de `App.jsx` (ver §15, item 1).

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
- **3 indicadores**: total, “em atenção” (`status === 'warning'`), “riscos críticos” (`status === 'danger'`).
- **Novo projeto**: abre `ProjectFormModal` vazio.
- **Clique em um card**: abre `ProjectDetailModal` (descrição, prazo formatado, status calculado, botões Editar e Excluir).
- **Editar**: mesmo formulário, preenchido. Ao salvar, o projeto é substituído pelo mesmo `id`.
- **Excluir**: abre `DeleteProjectModal` pedindo confirmação; depois filtra o projeto da lista.
- Os avisos (toast) aparecem ao criar, editar e excluir.

> Atenção: há `console.log` de depuração no início do componente (linhas 53–58) e em `saveProject` (linha 88), além de uma constante `projectsMock` (linhas 9–37) que **nunca é usada**. Ver §15 e §16.

### 8.6 `RepositoriesPage.jsx` — Repositórios
Três abas (estado `tab`):
- **Repositórios** → `RepositoriesList`
- **Pull Requests** → `PullRequestsList`
- **Branches** → `BranchesList`

Cada lista tem dados de exemplo fixos dentro do próprio componente (ex.: repositório `govtech-api`).

### 8.7 `AuditPage.jsx` — Auditoria
- Lista `auditEvents` (ação, serviço, autor, hash, horário, status).
- Cartões com **valores fixos**: “34” aprovações e “92%” de conformidade.
- Botões **“Exportar CSV”** e **“Filtrar”** existem, mas **não têm ação** (não fazem nada ao clicar).

### 8.8 `RbacPage.jsx` — Acessos e RBAC
- Quatro papéis (`accessRoles`): Admin, Developer, Stakeholder, Viewer. Clicar em um abre `RoleDetailModal`.
- Tabela de usuários **fixa** no próprio arquivo (4 pessoas, com e-mail `@govtech.ms`).
- Botões “Convidar usuário”, “Nova função”, “Filtrar” e “Adicionar” **não têm ação**.

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
| `GlobalSearch` | Busca em projetos, serviços, PRs e branches. Retorna `null` quando fechada (`open` falso). | `open`, `onClose`, `projects`, `onNavigate`, `setSelectedProject` |
| `DashboardLayout` | Casca usada pelo `DashboardPage`: `Sidebar` + área de conteúdo + `GlobalSearch`. | `active`, `setActive`, `children`… |

### 9.2 Comuns

| Componente | O que faz |
|---|---|
| `Brand` | Logo “GovTech MS”. |
| `Icon` | Recebe um **nome** de ícone em texto (`name="Shield"`) e busca no mapa `iconMap`. Se o nome não existir, mostra o ícone de interrogação (`CircleHelp`) como fallback. |
| `StatCard` | Cartão com título, valor grande, subtexto, ícone e variação (`trend`) com seta. |
| `StatusBadge` | Etiqueta colorida. `status` = `success`, `warning`, `danger`… |
| `Toast` | Aviso que some sozinho após alguns segundos. |
| `ModalShell` | Moldura genérica de modal (fundo + caixa). |
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
| `BranchStat`, `BranchesTable`, `PullRequestsTable`, `RepositoriesTable`, `PullRequestDetailModal` | **Não** | Ver §16. |

### 9.6 RBAC

| Componente | Função |
|---|---|
| `RoleDetailModal` | Mostra detalhes de um papel selecionado. |

---

## 10. Dados, estado e armazenamento

### 10.1 De onde vêm os dados

| Arquivo | Conteúdo | Quem usa |
|---|---|---|
| `data/mockData.js` | `profile`, `services`, `repoStats`, `projects`, `pullRequests`, `branches`, `auditEvents`, `accessRoles` | Quase todas as telas. |
| `data/projects.js` | Dois projetos antigos (“Plataforma de Gestão”, “Sistema de Auditoria”) | **Ninguém.** |
| Dentro dos próprios componentes | Usuários do RBAC, listas de repositórios/PRs/branches, cartões de Auditoria | Cada tela. |

Os projetos de exemplo em `mockData.js` (IDs 1–4) têm prazos em 2026. Como hoje é **30/10/2026**, três deles (“Plataforma de Pagamentos”, “Sistema de Notificações”, “Refatoração User Service”) aparecem como **atrasados**, e “Dashboard Analítico” (prazo 15/11) como **no prazo**. Por isso o semáforo da Visão geral mostra cores variadas.

### 10.2 Estado (memória da tela)

O estado vive em componentes React com `useState`. Os principais:

- `App.jsx` → `settings` (via `useLocalStorage`), `projectList`, `toastMessage`, `sidebarOpen`, `accountMenuOpen`, `isAuthenticated`.
- `DashboardPage.jsx` → `active`, `projectList`, `settings`, `toast`, `selectedProjectFromSearch`.
- `ProjectsPage.jsx` → `showForm`, `selectedProject`, `editingProject`, `showDeleteConfirm`.
- `SettingsPage.jsx` → `tab` e `draft` (rascunho que só vira configuração ao clicar em “Salvar”).

### 10.3 Persistência no navegador (`localStorage`)

Chaves declaradas em `constants/storageKeys.js`:

| Constante | Valor real da chave | Usada de fato? |
|---|---|---|
| `storageKeys.SETTINGS` | `govtech:settings` | Sim, em `App.jsx`. |
| `storageKeys.THEME` | `govtech:theme` | **Não.** |
| `storageKeys.PROJECTS` | `govtech:projects` | **Não** (ver abaixo). |
| `storageKeys.TOKEN` | `govtech:token` | **Não.** |

**Atenção:** `utils/storageUtils.js` usa `STORAGE_KEYS.projects` e `STORAGE_KEYS.settings` (minúsculas). Esses campos **não existem** no objeto, então valem `undefined`. Na prática, os projetos e as configurações são salvos na chave literal **`"undefined"`**. Funciona (leitura e gravação usam o mesmo nome), mas está errado e é confuso. Ver §15.

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
Calcula a diferença em dias entre hoje e o prazo (`deadline`):

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
- **`useTheme`** (chamado no `DashboardPage`) coloca `data-theme="dark"` ou `"light"` no `<html>`. Com a opção “Sistema”, consulta `prefers-color-scheme` do computador.
- **`App.jsx`** também altera o `data-theme` quando as configurações são salvas. Há duas lógicas para a mesma coisa (ver §15).
- `app.css` e `index.css` aplicam esses tokens nas telas. Classes como `.dashboard-content`, `.panel`, `.metric-card`, `.status-badge` são reutilizadas em várias páginas.
- Os gráficos são desenhados com **SVG** manualmente, sem biblioteca de gráficos.

---

## 13. Deploy (Vercel)

`vercel.json`:
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

**Resposta curta: não há back-end em funcionamento. Há alguns vestígios que parecem de back-end, mas são só texto, configuração ou código não usado.**

### Evidências de que NÃO há back-end
- `package.json`: nenhuma dependência de servidor (sem Express, Fastify, Prisma, Mongoose, Supabase, Firebase, etc.). Só React, Router, Lucide e Vite.
- Nenhuma chamada de rede: não há `fetch`, `axios`, `XMLHttpRequest` nem URLs de API no código.
- Não há pasta `server/`, `api/`, `backend/`, nem arquivos `.env` versionados, nem migrations, nem modelos de banco.
- O histórico git (6 commits) não tem nenhum arquivo de servidor, nem remoto, nem arquivo removido.
- O login não verifica nada: `LoginPage` só faz `window.location.href = '/dashboard'`.

### Vestígios que parecem back-end (e o que realmente são)

| Vestígio | Onde | O que é de verdade |
|---|---|---|
| `TOKEN: 'govtech:token'` | `constants/storageKeys.js` | Uma chave de token de autenticação **nunca usada**. Sobra de um plano de login real. |
| `.env`, `.env.local`, `.env.*.local` no `.gitignore` | `.gitignore` | Padrão para guardar segredos de servidor. Não há nenhum `.env` no projeto. |
| `.vercel/` no `.gitignore` | `.gitignore` | Pasta da CLI da Vercel. Não é back-end. |
| `vercel.json` | raiz | Configuração de **hospedagem estática** (só reescreve rotas). Não roda código no servidor. |
| `"framework": "vite"` | `vercel.json` | Diz à Vercel que é um projeto Vite. |
| `services` (“identity-gateway”, “billing-orchestrator”, etc.) | `data/mockData.js` | Serviços **fictícios** com nomes de microsserviços, só para exibir. |
| Textos “API do GitHub”, “Integração com GitHub Actions” | `LandingPage.jsx` | Marketing. A integração não existe. |
| Integrações GitHub, SonarQube, Slack, Jira “Conectado” | `SettingsPage.jsx` | Cartões fixos. O botão só mostra um aviso. |
| Usuários com e-mail `@govtech.ms` | `RbacPage.jsx` | Dados fixos no código. |
| Hashes `a82f91c0…7d2e` | `mockData.js` (auditoria) | Strings inventadas, sem cálculo real. |
| `ProjectsPage` com `projectsMock` | `pages/ProjectsPage.jsx` | Dados de exemplo não usados. |
| `data/projects.js` | `data/` | Dados antigos, não importados. |
| `console.log` de depuração | `pages/ProjectsPage.jsx` (linhas 53–58 e 88) | Logs de depuração esquecidos no código. Não são dados. |
| `ProjectsPage`, `setProjectList` recebidos por *prop* | `App.jsx`, `DashboardPage.jsx` | Padrão de “estado elevado”, comum em apps com backend, mas aqui só mexe em memória e localStorage. |

### Como seria a transição para back-end (se você quiser no futuro)
Os pontos onde os dados seriam trocados por chamadas HTTP já estão bem claros:
1. `utils/storageUtils.js` → `getStoredProjects` / `saveProjects` viram `GET /projects` / `POST /projects`.
2. `pages/LoginPage.jsx` → `submit` viraria `POST /auth/login`, guardando o token na chave `TOKEN` que já existe.
3. `data/mockData.js` → cada array viraria uma resposta de API.
4. `App.jsx` → `isAuthenticated` deixaria de ser `true` fixo e viraria uma verificação real de token.

---

## 15. Problemas e inconsistências encontrados

Organizados por gravidade. Linhas conferidas no código atual.

### 15.1 Alta (afetam o funcionamento)

1. **Layout duplicado na Visão geral.** `App.jsx` renderiza `Sidebar` e `Topbar` no `AuthenticatedLayout` e, para `/dashboard`, também renderiza `DashboardPage`, que chama `DashboardLayout` com outra `Sidebar`. O `DashboardLayout` nem usa a `Topbar` (a linha de `<Topbar>` foi removida; ver `components/layout/DashboardLayout.jsx` linhas 35–38). Resultado esperado: **duas barras laterais** na Visão geral. *Verificado pelo código; não confirmado visualmente no navegador.*

2. **Duas formas de navegar convivem.** `App.jsx` usa rotas (`/projects`). `DashboardPage.jsx` usa estado (`active = 'Projetos'`). Há duas listas de projetos, duas de configurações e dois lugares que aplicam o tema.

3. **Chaves de storage erradas.** `utils/storageUtils.js` linhas 13, 36, 44 e 68 usam `STORAGE_KEYS.projects` / `.settings` (minúsculo). O objeto exporta `STORAGE_KEYS` com nomes em maiúsculo, então valem `undefined` e tudo vai para a chave `"undefined"`.

4. **Projetos sem status na página de Projetos.** `App.jsx` passa `projectList` vindo de `mockData.js`, que **não tem** os campos `status` nem `health`. `ProjectsPage` filtra e exibe por `status` (“em atenção” e “riscos críticos” ficam 0) e o selo fica sem texto. Os exemplos corretos com `status`/`health` estão em `projectsMock`, que não é usado.

5. **Nenhuma proteção de rota.** `isAuthenticated` é `useState(true)` e nunca muda. Qualquer endereço protegido abre direto.

### 15.2 Média (comportamento enganoso)

6. **Botões sem função:** “Exportar CSV” (Auditoria), “Filtrar” (Auditoria e RBAC), “Convidar usuário”, “Nova função”, “Adicionar” (RBAC). Não há ação ao clicar.

7. **Respostas do chatbot descrevem funções que não existem.** `components/common/ChatbotModal.jsx`:
   - Linhas 35 e 107: “Exportar Dados” na Auditoria (não existe).
   - Linha 27: “seção Riscos” e “Adicionar Risco” em projetos (não existem).
   - Linha 11: diz que o cadastro pede “repositório, branch, prazo”. O formulário real tem repositórios por checkbox e não tem campo de branch.

8. **Valores fixos disfarçados de dados.** “4.2 dias” de lead time (`OverviewPage.jsx` linha 65), “3” alertas (linha 83), “34” aprovações e “92%” de conformidade (`AuditPage.jsx` linhas 31 e 37).

9. **Login aceita qualquer coisa.** `LoginPage.jsx` linha 21: `setTimeout` com redirecionamento, sem validar campos.

10. **Integrações e 2FA são demonstrativas.** Mostram “Conectado” ou “Ativar” mas só exibem um aviso.

### 15.3 Baixa (qualidade de código)

11. **`console.log` de depuração** em `ProjectsPage.jsx` (linhas 53–58 e 88). Imprime a lista inteira a cada renderização da página.

12. **Código morto** (ver §16).

13. **`useTheme` e `App.jsx` duplicam a lógica de tema**, e a opção “Sistema” só existe no `useTheme`. Em `App.jsx`, a opção “Sistema” cai no `else` e vira tema claro.

14. **Constantes duplicadas com nomes diferentes:** `defaultSettings` e `DEFAULT_SETTINGS`, `storageKeys` e `STORAGE_KEYS` apontam para o mesmo objeto. Isso é a origem do erro do item 3.

15. **Dados de exemplo misturados no código de tela:** RBAC, auditoria, repositórios e PRs têm listas inteiras dentro dos componentes, em vez de em `data/`.

16. **Nomes de ícone em texto** (`icon: 'GitPullRequest'`) dependem de um mapa em `Icon.jsx`. Um nome errado não gera erro: aparece silenciosamente o ícone de fallback.

17. **Imports não usados** em vários arquivos (ex.: `Check`, `Eye`, `UserRound` em `LoginPage.jsx`; `formatProjectDate` em `OverviewPage.jsx`). Não quebram o build, mas poluem.

---

## 16. Código morto (arquivos que não são usados)

Verificado pelo grafo de `import` (nenhum outro arquivo os importa):

| Arquivo | Situação |
|---|---|
| `data/projects.js` | Não importado. Dados antigos. |
| `components/projects/ProjectCard.jsx` | Não importado. A página de Projetos desenha os cards inline. |
| `components/projects/ProjectStatusSummary.jsx` | Não importado. Existe outro `ProjectStatusSummary` em `components/dashboard/`, que é o usado. |
| `components/repositories/BranchStat.jsx` | Não importado. |
| `components/repositories/BranchesTable.jsx` | Não importado. |
| `components/repositories/PullRequestsTable.jsx` | Não importado. |
| `components/repositories/RepositoriesTable.jsx` | Não importado. |
| `components/repositories/PullRequestDetailModal.jsx` | Não importado. |
| `pages/OverviewPage.jsx` | **Usado**, mas só via `DashboardPage`. Não é morto. |
| `projectsMock` em `ProjectsPage.jsx` | Constante declarada e não usada. |
| `TOKEN`, `THEME`, `PROJECTS` em `storageKeys.js` | Declarados, não usados (ver §10.3). |
| `DEFAULT_SETTINGS` e `getStoredSettings` | Usados só pelo `DashboardPage`, que é parte da duplicação (§15.1). |

Remover esses arquivos não altera o comportamento atual. Recomendo fazer isso junto com a decisão sobre a duplicação de navegação.

---

## 17. Limitações desta documentação

- Li por completo: `App.jsx`, `main.jsx`, `DashboardPage.jsx`, `ProjectsPage.jsx`, `AuditPage.jsx`, `RepositoriesPage.jsx`, `RbacPage.jsx`, `SettingsPage.jsx`, `DashboardLayout.jsx`, `ProjectFormModal.jsx`, `DeleteProjectModal.jsx`, `utils/`, `hooks/`, `constants/`, `data/mockData.js` e a configuração (`package.json`, `vite.config.js`, `vercel.json`, `index.html`).
- Li parcialmente: `LoginPage.jsx`, `OverviewPage.jsx`, `Sidebar.jsx`, `Topbar.jsx`, `GlobalSearch.jsx`, `ChatbotModal.jsx`, `ProjectDetailModal.jsx`, `Icon.jsx`. Os trechos não lidos não foram descritos em detalhe.
- Não li linha a linha: `LandingPage.jsx`, `Toast`, `ModalShell`, `StatCard`, `StatusBadge`, `Brand`, `RoleDetailModal`, os componentes de gráfico (`PullRequestFlowChart`, `PullRequestDistribution`), `AutomatedAlerts`, `RecentActivityPanel`, `RepositoriesList`, `PullRequestsList`, `BranchesList`, e os arquivos CSS. Para eles, a descrição vem do nome, de títulos visíveis no código e de quem os importa.
- Os itens da §15.1 marcados como “verificado pelo código” não foram observados no navegador. Vale abrir `npm run dev` e conferir, especialmente as duas barras laterais e os selos da página de Projetos.
- Esta documentação descreve o estado do commit `8ed3a40` (branch `main`). Se o código mudar, ela precisa ser atualizada.
