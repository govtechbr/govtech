# Regras de negócio — GovTech

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
| P2 | Campos: nome, objetivo, prazo, responsável e prioridade. **Sem progresso** (decisão de 02/11/2026): era um número digitado à mão, sem regra de cálculo, e aparecia ao lado de números calculados. A coluna `progress` fica sem uso no banco, como a de `status` | ✅ |
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
| G9 | **Paginação:** repositórios visíveis até 500; PRs **abertos** (até 1.000) mais os atualizados nos **últimos 90 dias** (até 1.000 por repositório); branches até 500; commits da branch principal de 90 dias, até 1.000. Se algum teto for atingido, a sincronização marca **dados parciais** e o painel do projeto e a auditoria avisam | 🔜 E7 |
| G10 | **Status do CI** (decisão de 02/11/2026): a cada sincronização, o resultado combinado dos checks (GitHub Actions ou outro CI) do **último commit** de cada PR e da **branch principal**: **verde**, **falhou** ou **rodando**. Repositório sem CI fica "sem CI" e não gera alerta nem entra na taxa. É uma **foto da hora da sincronização, não um histórico**: uma falha corrigida antes da sincronização seguinte não fica registrada. Se a chave não tiver permissão de leitura de *Commit statuses* e *Actions*, o CI vem como "sem CI" e a sincronização segue | ✅ E8 |
| G11 | **Histórico de execuções do CI** (decisão de 02/11/2026): a cada sincronização, as execuções do **GitHub Actions** dos **últimos 90 dias** de cada repositório (até 1.000), com número, workflow, evento, branch, commit, resultado e horários. **Sem quem disparou** (LGPD). Mais antigas que 90 dias saem. Cobre só o GitHub Actions; outro CI continua só pelo estado atual (G10). Exige a permissão *Actions* (Read) na chave; sem ela, o histórico fica vazio e a sincronização segue. Não gera alerta: falha já corrigida não é risco atual | ✅ E9 |

## 5. Métricas de governança (Visão geral)

Calculadas dos dados sincronizados, nunca valores fixos. **Período:** seletor 7 / 30 / 90 dias, começando em 30.

| Métrica | Definição |
|---|---|
| Quantidade de PRs | PRs **abertos agora** + PRs **criados no período** |
| Lead time médio | Média do tempo da **abertura do PR até o merge**, nos PRs mergeados no período |
| Taxa de aprovação | % dos PRs **mergeados** no período que tiveram **ao menos 1 aprovação** de revisor |
| CI verde no merge | % dos PRs **mergeados** no período, **com CI**, cujo último commit estava **verde** (G10). Sem PR mergeado com CI = "sem dados" |
| Evolução dos PRs | Gráfico **por semana** (períodos de 7 dias, ex.: "28/10 a 04/11"): PRs criados × PRs mergeados |
| Eventos de desenvolvimento | Repositórios, commits (branch principal), branches e contribuidores no período |
| Execuções com sucesso | % das execuções do CI **concluídas** no período (G11) que passaram; canceladas e puladas não contam. Sem execução = "sem dados" |
| Tempo médio de correção | Média, nas falhas **corrigidas** que começaram no período, do fim da **primeira execução que falhou** ao fim da **próxima que passou**, no mesmo workflow e na mesma branch (falhas seguidas contam como uma só). É o "tempo de recuperação" das métricas DORA |
| Falhas recentes do CI | As falhas do período (uma por sequência de execuções falhando), com o tempo até a correção ou "ainda falhando" e o link para a execução |
| Alertas | Lista dos alertas ativos (§6) |

**Números em destaque na primeira tela** (decisão de 04/11/2026): Quantidade de PRs, Lead time médio, Taxa de aprovação e **PRs em risco** (abertos há mais de 3 dias, sem rascunhos); desde 02/11/2026 também **CI verde no merge**. O gráfico semanal mostra pelo menos 4 semanas, mesmo no período de 7 dias.

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

Os limites são os mesmos dos alertas (§6). **O CI (G10) ainda não entra no índice** (decisão de 02/11/2026): mudar os pesos agora quebraria a comparação com o histórico diário já apurado; se entrar, a regra registra a data de corte.

### 5.2 Assistente de Governança com IA (E6, decisão de 02/11/2026)

Substitui o assistente simulado da barra lateral. Provedor: **Groq** (plano gratuito, modelo `openai/gpt-oss-120b`). Pelos termos do Groq, os dados não são usados para treinar modelos e os pedidos não ficam guardados por padrão; o processamento é nos EUA.

| # | Regra | Situação |
|---|---|---|
| IA1 | Responde **só sobre a empresa atual**, com os dados que a pessoa já vê na tela. Só lê e explica, não altera nada. **Todos os papéis** usam | ✅ E6 |
| IA2 | **O que vai para a IA:** índice e critérios (empresa e projetos), alertas, métricas de 30 dias (inclusive CI verde no merge), nome, prazo e prioridade dos projetos, e número, título, estado, idade e aprovações dos PRs. **Nunca** login, avatar, e-mail ou chave. Títulos de PR podem citar pessoas: risco aceito | ✅ E6 |
| IA3 | **Limite:** 20 perguntas por pessoa por dia e 200 por dia no sistema todo (dia no fuso de MS). Ao estourar, a tela avisa | ✅ E6 |
| IA4 | A **conversa não é guardada**: some ao fechar o painel. O banco guarda só a contagem de uso (quem e quantas, sem o texto) | ✅ E6 |
| IA5 | A tela avisa que a resposta é gerada por IA (Groq, EUA, sem treino com os dados) e que os números oficiais estão nos painéis | ✅ E6 |
| IA6 | Responde em pt-BR. Pergunta fora de governança, ou sem dado suficiente, recebe essa resposta em vez de um palpite | ✅ E6 |

## 6. Alertas automáticos

| Alerta | Atenção | Risco | Por que importa (aparece junto do alerta) |
|---|---|---|---|
| **CI falhando na branch principal** (G10) | — | sempre | A versão atual da branch principal não passa nos testes automáticos |
| Branch principal **sem proteção** | sempre | — | Qualquer pessoa com acesso pode fazer push direto ou reescrever o histórico, sem PR nem revisão |
| PR mergeado com **CI falhando** (últimos 30 dias) | — | sempre | Entrou na branch principal código que não passou nos testes automáticos |
| PR mergeado **sem nenhuma aprovação** | sempre | — | O código entrou na branch principal sem passar pela revisão |
| Prazo do projeto | vence em até **7 dias** | **vencido** | Replanejar ou confirmar que o que falta cabe no prazo |
| PR aberto com **CI falhando** (rascunhos não contam) | sempre | — | Precisa de correção antes de ser revisado e mergeado |
| PR aberto há muito tempo (rascunhos não contam) | mais de **1 dia** | mais de **3 dias** | PR parado acumula conflitos e atrasa a entrega |

**Ordem (decisão de 02/11/2026):** Risco antes de Atenção; dentro do mesmo nível, na ordem da tabela, dos riscos estruturais (CI da branch principal, proteção, revisão) aos operacionais (prazo, PR parado). O cartão da Visão geral mostra os 8 primeiros e um botão **"Ver todos os N alertas"**. Os alertas ficam só na Visão geral: o cartão e o detalhe do projeto mostram só o status (PR #25).

**Status do projeto (P3):** Risco se houver algum alerta de Risco; senão Atenção se houver algum alerta de Atenção; senão Saudável.

**Detalhes decididos na implementação (E4):** o alerta "mergeado sem aprovação" olha os PRs mergeados nos **últimos 30 dias**, fixo, para o status do projeto não mudar quando se troca o período da tela. Os alertas de PR e de branch valem para todos os projetos ligados ao repositório. Projeto sem prazo não gera alerta de prazo.

## 7. Auditoria (E7, decisão de 02/11/2026)

Trilha simples, para revisão (sem cadeia de hash, decisão Q7 do plano técnico).

| # | Regra | Situação |
|---|---|---|
| AU1 | **O que se registra.** Projetos: criado, alterado (quais campos, antes e depois) e excluído. Membros: entrou, papel alterado, removido ou saiu. Empresa: nome alterado e código de convite gerado de novo (**sem o código**). GitHub: chave conectada ou removida (**nunca a chave**, só os 4 últimos caracteres), repositórios escolhidos e cada sincronização (manual ou automática) com o resultado | 🔜 E7 |
| AU2 | **Quem fez:** a pessoa logada; nas ações do agendador, "Sistema". O nome e o papel de quem agiu ficam gravados no evento, para continuar legível se a pessoa sair da empresa | 🔜 E7 |
| AU3 | **Imutável:** ninguém altera nem apaga um evento, nem pelo app nem com a chave de serviço. Os eventos só somem junto com a empresa | 🔜 E7 |
| AU4 | **Quem vê:** admin e stakeholder da empresa. O developer não vê (o menu some e o banco bloqueia) | 🔜 E7 |
| AU5 | **Tela:** do mais novo ao mais antigo, 50 por vez com "Carregar mais"; filtros de período (7, 30 ou 90 dias) e de tipo (Projetos, Membros, Empresa, GitHub). Os cartões mostram números reais do período: eventos, mudanças de acesso e sincronizações com falha | 🔜 E7 |
| AU6 | **CSV** dos eventos filtrados, gerado no navegador e protegido contra fórmulas (célula que começa com `=`, `+`, `-` ou `@`) | 🔜 E7 |
| AU7 | **LGPD:** o evento guarda nome e papel de quem agiu; nada de e-mail ou chave. Do GitHub, só contagens | 🔜 E7 |

## 8. Fora do escopo até 18/11/2026

Convite por e-mail, webhook ou GitHub App (atualização instantânea), CI no Índice de Governança, separar PRs por projeto dentro de um repositório compartilhado, cadeia de hash e retenção automática na auditoria, histórico salvo de conversas com o assistente.

## 9. Entregas

| # | Entrega | Regras | Previsão |
|---|---|---|---|
| E1 | Seleção de repositórios (N:N, sem duplicidade) + viewer vira stakeholder | A2, G2–G5, papéis | 04/11 |
| E2 | Troca de empresa (workspace) | A5, A6 | 05/11 |
| E3 | Mais dados do GitHub + sincronização a cada hora | G6–G8 | 08/11 |
| E4 | Visão geral com métricas reais, alertas e status automático com cartão | P3, P4, §5, §6 | 12/11 |
| E5 | Índice de Governança (0–100) com histórico | I1–I6 | 06/11 |
| E6 | Assistente de Governança com IA (Groq) | IA1–IA6 | 08/11 |
| E7 | Auditoria real + paginação do GitHub | AU1–AU7, G9 | 10/11 |
| E8 | Status do CI: coleta, alertas e taxa de CI verde | G10, §5, §6 | 03/11 |
| E9 | Histórico de execuções do CI e tempo de correção | G11, §5 | 04/11 |
| E10 | Direcionadores estratégicos: missão, visão, objetivos e vínculo com projetos | S1–S7 | 04/11 |
| E11 | Página Processos: evidências por área do CMMI/ISO 12207 | C1–C6 | 05/11 |
| — | Folga: testes, documentação do TCC, ensaio | — | 13–18/11 |

## 10. Direcionadores estratégicos (E10, decisão de 02/11/2026)

Liga o trabalho técnico às metas da empresa (RF03 e RF07 do TCC): um projeto em risco passa a mostrar **qual objetivo de negócio ele ameaça**.

| # | Regra | Situação |
|---|---|---|
| S1 | A empresa tem **missão** e **visão**: texto livre, até 1.000 caracteres cada. Só o admin edita; todos os papéis veem | 🔜 E10 |
| S2 | A empresa tem uma lista de **objetivos estratégicos**: título (até 120 caracteres) e descrição (até 500). Só o admin cria, edita e exclui; todos veem | 🔜 E10 |
| S3 | Um projeto se vincula a **no máximo um objetivo** (opcional), escolhido no formulário por admin ou developer. Um objetivo pode ter vários projetos. O vínculo só vale dentro da mesma empresa. Excluir um objetivo **desfaz os vínculos**; os projetos continuam | 🔜 E10 |
| S4 | **Status do objetivo** = o pior status entre os projetos vinculados (Risco antes de Atenção antes de Saudável, mesma regra P3). Sem projeto vinculado: "Sem projetos vinculados" (falta de dado não vira Saudável) | 🔜 E10 |
| S5 | **Impacto (RF07):** o objetivo em Risco ou Atenção lista os projetos responsáveis e os **alertas** de cada um (§6, com o "por que importa"); cada projeto mostra os 3 primeiros alertas (mais críticos antes) e um botão "Ver todos os N alertas". O sistema aponta a relação entre a falha técnica e a meta; **não estima** prazo nem custo do impacto | 🔜 E10 |
| S6 | Tela **Estratégia** na barra lateral: missão, visão e objetivos com status e projetos. O cartão e o detalhe do projeto mostram o objetivo a que ele serve | 🔜 E10 |
| S7 | **Auditoria (§7):** objetivo criado, alterado ou excluído; missão e visão alteradas (antes e depois); vínculo do projeto com o objetivo (mudança do projeto) | 🔜 E10 |

## 11. Processos: evidências por área do CMMI (E11, decisão de 02/11/2026)

Objetivo específico 5 do TCC: relacionar os registros dos PRs às práticas de avaliação de processos (CMMI-DEV 1.3 e SPICE, ISO/IEC 33000 sobre os processos da ISO/IEC/IEEE 12207). **O sistema fornece evidências; não avalia nem atribui nível de capacidade ou de maturidade** (isso exige um avaliador qualificado).

| # | Regra | Situação |
|---|---|---|
| C1 | A tela **Processos** (todos os papéis veem) mostra cada área de processo, os critérios do Índice de Governança que servem de evidência, a nota atual da empresa e a faixa (I3) | 🔜 E11 |
| C2 | **Mapeamento fixo** (tabela abaixo). Cada critério do índice (I1) alimenta uma única área, então nenhuma evidência é contada duas vezes | 🔜 E11 |
| C3 | A **nota da área** é a média ponderada dos critérios dela, com os pesos e a regra de "só critérios com dado" do índice (I2); a empresa usa a média dos projetos (I4). Sem dado em nenhum critério da área: "sem dados" | 🔜 E11 |
| C4 | Cada área mostra **de onde vem a evidência** (qual dado do GitHub) e a **prática do modelo** correspondente, em texto simples para quem não é técnico | 🔜 E11 |
| C5 | Um aviso fixo na tela diz que a nota é **evidência de apoio**, não avaliação formal de maturidade | 🔜 E11 |
| C6 | Mapeamento só de apoio à leitura: mudar a tabela não muda o índice nem os alertas | 🔜 E11 |

| Área (CMMI-DEV 1.3) | Processo ISO/IEC/IEEE 12207 | Critérios do índice | Prática que a evidência apoia |
|---|---|---|---|
| Verificação (VER) | Verificação | Revisão de código | Revisão por pares dos produtos de trabalho: PR mergeado com aprovação |
| Gestão de Configuração (CM) | Gestão de configuração | Proteção da branch | Controle das linhas-base: a branch principal só muda por PR revisado |
| Monitoramento e Controle do Projeto (PMC) | Avaliação e controle do projeto | Fluxo de PRs e Prazo | Acompanhar o andamento contra o plano e agir sobre os desvios |
| Medição e Análise (MA) | Medição | Lead time | Medir o tempo de entrega e usá-lo para decidir |

A auditoria (§7) e o histórico do CI (G11) complementam CM e MA como registro e medida, mas **não entram na nota** (C6).
