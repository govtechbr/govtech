# Regras de negócio — GovTech MS

Fonte única das regras do produto. Definidas com o dono do projeto em 02/11/2026; mudanças passam por aqui antes do código. O "como" técnico fica em `PLANO_TECNICO.md`.

**Legenda:** ✅ já funciona · 🔜 planejado (entrega indicada em §9)

---

## 1. Empresas (organizações) e acesso

| # | Regra | Situação |
|---|---|---|
| A1 | O cadastro é aberto. Depois de criar a conta, a pessoa **cria uma empresa** (vira admin) ou **entra com o código** de uma empresa existente | ✅ |
| A2 | Quem entra pelo código começa como **stakeholder** | ✅ E1 (03/11/2026) |
| A3 | O código de convite é aleatório (10 caracteres, não é o nome da empresa). Só o admin o vê na tela e pode gerar outro; o anterior para de valer | ✅ |
| A4 | Uma empresa **nunca fica sem admin**: o último admin não pode ser rebaixado nem sair | ✅ |
| A5 | Uma pessoa pode estar em **várias empresas** e troca pela barra lateral (workspace). Ao entrar, abre a **última empresa usada** | 🔜 E2 |
| A6 | A barra lateral tem **"Adicionar empresa"**, que leva a criar uma empresa ou entrar com código | 🔜 E2 |

## 2. Papéis

| Papel | O que pode | Situação |
|---|---|---|
| **Admin** | Tudo: projetos (criar, editar, excluir), membros (papel, remover), código de convite, chave do GitHub e seleção de repositórios | ✅ |
| **Developer** | Criar e editar projetos; sincronizar o GitHub | ✅ |
| **Stakeholder** | Ver tudo, sem alterar | ✅ |
| ~~Viewer~~ | **Removido.** Quem é viewer vira stakeholder; o papel some da tela de papéis e de membros | ✅ E1 |

Esconder um botão na tela é só conveniência: quem bloqueia de verdade é o banco (RLS).

## 3. Projetos

| # | Regra | Situação |
|---|---|---|
| P1 | O **admin cria o projeto**: é o ponto de partida de tudo | ✅ (developer também cria) |
| P2 | Campos: nome, objetivo, prazo, responsável, prioridade, progresso | ✅ |
| P3 | O **status** (Saudável / Atenção / Risco) é **calculado pelos alertas** (§6). O campo manual deixa de existir | 🔜 E4 (hoje é manual) |
| P4 | Um **cartão na tela explica** como o status é calculado | 🔜 E4 |
| P5 | Só o admin exclui projeto | ✅ |

## 4. GitHub

| # | Regra | Situação |
|---|---|---|
| G1 | **Uma chave por projeto**, cadastrada só pelo admin, guardada criptografada (Vault). A tela mostra só os 4 últimos caracteres | ✅ |
| G2 | A chave do GitHub sempre lê **todos os repositórios públicos**, além dos escolhidos ao criá-la. Por isso, depois de conectar, o **admin marca na lista quais repositórios são do projeto** | ✅ E1 |
| G3 | Um projeto pode ter **vários repositórios**, e um repositório pode estar em **vários projetos** (API compartilhada, monorepo) | ✅ E1 |
| G4 | **Sem duplicidade:** na visão da empresa, cada repositório, PR, commit e contribuidor conta **uma vez só**. Na visão de um projeto aparecem todos os PRs dos repositórios dele. Num repositório compartilhado, o PR aparece nos dois projetos (o sistema não sabe de qual projeto ele é) | ✅ E1 (repositórios e PRs; commits e contribuidores chegam na E3) |
| G5 | Desconectar a chave de um projeto desfaz as ligações; os dados de um repositório só somem quando nenhum projeto o usa mais | ✅ E1 |
| G6 | **Sincronização automática a cada hora**, e o botão "Sincronizar" continua para quem não quer esperar | 🔜 E3 (hoje só o botão) |
| G7 | Dados buscados: repositórios, PRs (com **revisões/aprovações**), branches (com proteção), **commits da branch principal** e **contribuidores** | 🔜 E3 (hoje sem revisões, commits e contribuidores) |
| G8 | **LGPD:** de pessoas de fora (autores, contribuidores), guardar só o **login** e o **avatar público** do GitHub. Nada de e-mail | ✅ / 🔜 E3 |

## 5. Métricas de governança (Visão geral)

Calculadas dos dados sincronizados, nunca valores fixos. **Período:** seletor 7 / 30 / 90 dias, começando em 30.

| Métrica | Definição |
|---|---|
| Quantidade de PRs | PRs **abertos agora** + PRs **criados no período** |
| Lead time médio | Média do tempo da **abertura do PR até o merge**, nos PRs mergeados no período |
| Taxa de aprovação | % dos PRs **mergeados** no período que tiveram **ao menos 1 aprovação** de revisor |
| Evolução dos PRs | Gráfico **por semana**: PRs abertos × PRs mergeados |
| Eventos de desenvolvimento | Repositórios, commits (branch principal), branches e contribuidores no período |
| Alertas | Lista dos alertas ativos (§6) |

Quais 3 ou 4 números aparecem em destaque na primeira tela: **a definir** pelo dono do projeto.

## 6. Alertas automáticos

| Alerta | Atenção | Risco |
|---|---|---|
| PR aberto há muito tempo (rascunhos não contam) | mais de **1 dia** | mais de **3 dias** |
| PR mergeado **sem nenhuma aprovação** | sempre | — |
| Branch principal **sem proteção** | sempre | — |
| Prazo do projeto | vence em até **7 dias** | **vencido** |

**Status do projeto (P3):** Risco se houver algum alerta de Risco; senão Atenção se houver algum alerta de Atenção; senão Saudável.

## 7. Auditoria

Parada por decisão de 02/11/2026. A tela continua com dados de exemplo.

## 8. Fora do escopo até 18/11/2026

Convite por e-mail, webhook ou GitHub App (atualização instantânea), status do CI, separar PRs por projeto dentro de um repositório compartilhado, auditoria.

## 9. Entregas

| # | Entrega | Regras | Previsão |
|---|---|---|---|
| E1 | Seleção de repositórios (N:N, sem duplicidade) + viewer vira stakeholder | A2, G2–G5, papéis | 04/11 |
| E2 | Troca de empresa (workspace) | A5, A6 | 05/11 |
| E3 | Mais dados do GitHub + sincronização a cada hora | G6–G8 | 08/11 |
| E4 | Visão geral com métricas reais, alertas e status automático com cartão | P3, P4, §5, §6 | 12/11 |
| — | Folga: testes, documentação do TCC, ensaio | — | 13–18/11 |
