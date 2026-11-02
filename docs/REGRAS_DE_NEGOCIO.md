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
| A5 | Uma pessoa pode estar em **várias empresas** e troca pela barra lateral (workspace). Ao entrar, abre a **última empresa usada** (guardada no navegador) | ✅ E2 (03/11/2026) |
| A6 | A barra lateral tem **"Adicionar empresa"**, que leva a criar uma empresa ou entrar com código | ✅ E2 |

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
| P3 | O **status** (Saudável / Atenção / Risco) é **calculado pelos alertas** (§6). O campo manual deixa de existir | ✅ E4 (o formulário não tem mais o campo; a coluna antiga fica sem uso no banco) |
| P4 | Um **cartão na tela explica** como o status é calculado | ✅ E4 (Visão geral e detalhe do projeto) |
| P5 | Só o admin exclui projeto | ✅ |

## 4. GitHub

| # | Regra | Situação |
|---|---|---|
| G1 | **Uma chave por projeto**, cadastrada só pelo admin, guardada criptografada (Vault). A tela mostra só os 4 últimos caracteres | ✅ |
| G2 | A chave do GitHub sempre lê **todos os repositórios públicos**, além dos escolhidos ao criá-la. Por isso, depois de conectar, o **admin marca na lista quais repositórios são do projeto** | ✅ E1 |
| G3 | Um projeto pode ter **vários repositórios**, e um repositório pode estar em **vários projetos** (API compartilhada, monorepo) | ✅ E1 |
| G4 | **Sem duplicidade:** na visão da empresa, cada repositório, PR, commit e contribuidor conta **uma vez só**. Na visão de um projeto aparecem todos os PRs dos repositórios dele. Num repositório compartilhado, o PR aparece nos dois projetos (o sistema não sabe de qual projeto ele é) | ✅ E1 (repositórios e PRs; commits e contribuidores chegam na E3) |
| G5 | Desconectar a chave de um projeto desfaz as ligações; os dados de um repositório só somem quando nenhum projeto o usa mais | ✅ E1 |
| G6 | **Sincronização automática a cada hora**, e o botão "Sincronizar" continua para quem não quer esperar | ✅ E3 (minuto 7 de cada hora) |
| G7 | Dados buscados: repositórios, PRs (com **revisões/aprovações**), branches (com proteção), **commits da branch principal** e **contribuidores** | ✅ E3 (aprovações dos PRs, commits dos últimos 90 dias; contribuidores = logins distintos de commits e PRs) |
| G8 | **LGPD:** de pessoas de fora (autores, contribuidores), guardar só o **login** e o **avatar público** do GitHub. Nada de e-mail | ✅ (commits sem nome, e-mail nem mensagem) |

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

**Números em destaque na primeira tela** (decisão de 04/11/2026): Quantidade de PRs, Lead time médio, Taxa de aprovação e **PRs em risco** (abertos há mais de 3 dias, sem rascunhos). O gráfico semanal mostra pelo menos 4 semanas, mesmo no período de 7 dias.

### 5.1 Índice de Governança (E5, decisão de 02/11/2026)

Uma nota de **0 a 100** por projeto e por empresa, com histórico diário. Os pesos dão mais importância à revisão de código, o controle central de governança (ISO/IEC 38500, COBIT). A faixa de lead time segue as métricas DORA.

| # | Regra | Situação |
|---|---|---|
| I1 | **Critérios**, por projeto (repositórios ligados a ele), olhando os **últimos 30 dias**: ver a tabela abaixo | ✅ E5 |
| I2 | **Cálculo:** média ponderada só dos critérios **com dado** (os pesos são reescalados). Sem nenhum critério com dado, fica "sem dados" | ✅ E5 |
| I3 | **Faixas:** 80 ou mais = **Bom**; 60 a 79 = **Regular**; abaixo de 60 = **Crítico** | ✅ E5 |
| I4 | **Empresa:** média simples dos projetos que têm índice | ✅ E5 |
| I5 | **Apuração** de hora em hora, junto da sincronização; vale a última do dia. O dia é contado no fuso de MS (`America/Campo_Grande`). O seletor de período da tela **não** muda o índice | ✅ E5 |
| I6 | **Reconstrução:** na primeira apuração de um projeto, os 30 dias anteriores são recalculados pelas datas dos PRs, **a partir do dia do primeiro PR** (antes dele não há atividade para medir), supondo proteção da branch, prazo e rascunho iguais aos de hoje. Esses dias ficam marcados como **recalculados** e a tela avisa | ✅ E5 |

| Critério | Peso | Nota (0–100) | Sem dado quando |
|---|---|---|---|
| Revisão de código | 30 | % dos PRs mergeados com ao menos 1 aprovação | nenhum PR mergeado |
| Fluxo de PRs | 20 | Média dos PRs abertos (sem rascunhos): até 1 dia = 100; de 1 a 3 dias = 50; mais de 3 dias = 0. Nenhum aberto = 100 | projeto sem repositório |
| Prazo | 20 | Mais de 7 dias = 100; até 7 dias = 50; vencido = 0 | projeto sem prazo |
| Proteção da branch | 15 | % dos repositórios com a branch principal protegida | projeto sem repositório |
| Lead time | 15 | Mediana da abertura ao merge: até 24 h = 100; 7 dias ou mais = 0; linear entre os dois | nenhum PR mergeado |

Os limites são os mesmos dos alertas (§6).

## 6. Alertas automáticos

| Alerta | Atenção | Risco |
|---|---|---|
| PR aberto há muito tempo (rascunhos não contam) | mais de **1 dia** | mais de **3 dias** |
| PR mergeado **sem nenhuma aprovação** | sempre | — |
| Branch principal **sem proteção** | sempre | — |
| Prazo do projeto | vence em até **7 dias** | **vencido** |

**Status do projeto (P3):** Risco se houver algum alerta de Risco; senão Atenção se houver algum alerta de Atenção; senão Saudável.

**Detalhes decididos na implementação (E4):** o alerta "mergeado sem aprovação" olha os PRs mergeados nos **últimos 30 dias**, fixo, para o status do projeto não mudar quando se troca o período da tela. Os alertas de PR e de branch valem para todos os projetos ligados ao repositório. Projeto sem prazo não gera alerta de prazo.

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
| E5 | Índice de Governança (0–100) com histórico | I1–I6 | 06/11 |
| — | Folga: testes, documentação do TCC, ensaio | — | 13–18/11 |
