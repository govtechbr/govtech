# Pesquisa de sustentação para a banca — GovTech

> **Para que serve:** reunir referências para sustentar cada ponto que a banca criticou (e alguns que ela não viu). Preparado em 19/11/2026 a partir de `docs/RELATORIO_TCC.md`, `docs/REGRAS_DE_NEGOCIO.md` e buscas na web.
>
> **Limites desta pesquisa (leia antes de citar):**
> - **A monografia do TCC não está no repositório.** Li o relatório técnico e as regras de negócio. Se o texto da monografia disser algo diferente, ajuste.
> - Cada referência abaixo teve a **existência confirmada** (autor, ano, veículo, DOI) em pelo menos uma fonte bibliográfica. Isso **não** significa que sustenta o parágrafo que você escreveu. A banca foi explícita: **leia o trecho e confirme que ele diz o que você vai atribuir a ele.**
> - Legenda de confiança: ✅ bibliografia confirmada · ⚠️ só achei fonte secundária (blog, resumo, escritório): confira no original antes de citar · ❌ não citar.
> - Resumos de busca erram números. **Nenhum número entre aspas aqui foi lido no artigo original**; confira.

---

## 0. Mapa: crítica da banca → o que sustenta → o que fazer

| # | Crítica da banca | Referências que sustentam (seção) | Ação no texto / no sistema |
|---|---|---|---|
| 1 | Índice de governança sem base científica | §1 (índices compostos, GQM, ISO 15939), §2 (revisão de código, DORA), §3 (governança de TI) | Cada critério e peso com justificativa citada; pesos validados com gestores (AHP/Delphi) |
| 2 | Pesos: "e se eu mudasse os pesos?" | §1.2 (análise de sensibilidade) | Script de sensibilidade sobre os dados reais (proposta §8) |
| 3 | Validação qualitativa, falta quantitativa | §4 (DSR, SUS, TAM, Delphi, GQM) | Rastreabilidade requisito → métrica → resultado; SUS/TAM com os gestores |
| 4 | IA em nuvem, sigilo, sem guardrails, qualidade da resposta | §5 (LGPD/ANPD, OWASP, NIST, avaliação de LLM) | Mapa de riscos + teste de segurança + conjunto de perguntas com gabarito; ou IA opcional/desligada |
| 5 | Fundamentação teórica fraca / referências empilhadas | Todo o documento; §9 (como escrever a citação) | Poucas referências por parágrafo, cada uma lida, com posicionamento próprio |
| 6 | Requisitos estruturados pelo pedido dos gestores, não por framework | §3 (COBIT, 38500, alinhamento), §1.3 (GQM) | Reorganizar RF por perspectiva de governança |
| 7 | Comparação com plataformas existentes | §6 | Tabela comparativa com fontes primárias |
| 8 | Overclaiming ("Tech monitora o progresso") | §2.4, §7 | Declarar limitações: o sistema mede evidência de processo no GitHub, não progresso do projeto |

---

## 1. Índice de Governança: construção, pesos e sensibilidade

### 1.1 Índices compostos (a base metodológica que faltou)

- ✅ **Nardo, M.; Saisana, M.; Saltelli, A.; Tarantola, S.; Hoffmann, A.; Giovannini, E. (2008).** *Handbook on Constructing Composite Indicators: Methodology and User Guide.* OECD / JRC. https://www.oecd.org/en/publications/handbook-on-constructing-composite-indicators-methodology-and-user-guide_9789264043466-en.html
  - **Sustenta:** construir um índice 0–100 a partir de critérios exige passos explícitos (estrutura teórica, normalização, ponderação, agregação) e uma etapa de **robustez e sensibilidade** depois da ponderação. É a referência que a banca está pedindo ("de onde vêm os pesos e o que muda se eu mudar").
  - **Uso:** descrever o índice como "indicador composto" e seguir o roteiro do *Handbook* na metodologia. Fiquei sem o texto integral; confira os capítulos de ponderação e robustez.
- ✅ **Saisana, M.; Saltelli, A.; Tarantola, S. (2005).** Uncertainty and sensitivity analysis techniques as tools for the quality assessment of composite indicators. *Journal of the Royal Statistical Society, Series A*, 168(2), 307–323. DOI 10.1111/j.1467-985X.2005.00350.x
  - **Sustenta:** análise de incerteza e sensibilidade para tornar as inferências de um índice mais defensáveis. Mostra como avaliar se o ranking muda com outros pesos (Monte Carlo).
  - **Uso:** é o artigo-base da sua análise de sensibilidade (§8).
- ✅ **Heitlager, I.; Kuipers, T.; Visser, J. (2007).** A practical model for measuring maintainability. *QUATIC 2007*, pp. 30–39. https://www.di.uminho.pt/~joost/publications/HeitlagerKuipersVisser-Quatic2007.pdf
  - **Sustenta:** precedente em engenharia de software de agregar medidas simples em **notas por faixas** (e crítica ao "número único" do Maintainability Index). Um bom exemplo de como discutir os limites de um índice. ⚠️ Não vi os valores de limiar do artigo.

### 1.2 Como derivar e validar pesos

- ✅ **Saaty, T. L. (1990).** How to make a decision: the Analytic Hierarchy Process. *European Journal of Operational Research*, 48(1), 9–26. (PDF: https://www.isahp-org.creativedecisions.net/uploads/1-how-to-make-a-decision-the-analytic-hierarchy-process-t-l-saaty.pdf) ⚠️ confirme ano e paginação no original.
  - **Sustenta:** pesos obtidos por comparação par a par com os gestores, com **razão de consistência (CR ≤ 0,10)** como critério de aceitação do julgamento. Fornece uma origem **não arbitrária** para os pesos.
- ✅ **Okoli, C.; Pawlowski, S. D. (2004).** The Delphi method as a research tool: an example, design considerations and applications. *Information & Management*, 42(1), 15–29. DOI 10.1016/j.im.2003.11.002
  - **Sustenta:** alternativa ao AHP: consenso estruturado de especialistas em rodadas, com regras de seleção de especialistas. Útil se os gestores forem poucos.

> **Decisão sua (não minha):** AHP exige que os gestores respondam a uma matriz 5×5 de comparações. Delphi exige 2–3 rodadas. Em qualquer um, os pesos atuais (30/20/20/15/15) viram **hipótese a ser testada**, não verdade. Se os pesos novos forem parecidos, ótimo: você prova. Se forem diferentes, você tem um achado.

### 1.3 Do requisito do gestor à métrica (rastreabilidade)

- ⚠️ **Basili, V. R.; Caldiera, G.; Rombach, H. D. (1994).** The Goal Question Metric approach. In: *Encyclopedia of Software Engineering.* Wiley. (Cópias: https://www.cs.umd.edu/users/basili/publications/journals/J78.pdf; a busca listou também uma entrada de 2006 no UMIACS.) Confira a data e a versão da fonte que for citar.
  - **Sustenta:** cada métrica deve responder a uma pergunta que atende a um objetivo. É a forma padrão de **traduzir o que o gestor pediu em medida**.
- ✅ **Basili et al.** *GQM+Strategies* (arXiv 1402.0292): estende o GQM para ligar metas à **estratégia da organização**, o que casa com sua tela de Estratégia (S1–S7). https://arxiv.org/pdf/1402.0292
- ⚠️ **ISO/IEC/IEEE 15939:2017.** *Systems and software engineering — Measurement process.* Define entidade, medida base, medida derivada e **indicador**, mais planejar/executar/avaliar a medição. Norma paga: cite o escopo, não o conteúdo que você não leu. Na prática, o índice é um **indicador (medida derivada)** composto de medidas base (PRs aprovados, lead time...).

---

## 2. Cada critério do índice: o que a literatura diz

| Critério (peso) | Referência | O que ela sustenta | Cuidado |
|---|---|---|---|
| **Revisão de código (30)** | McIntosh et al. (2014); Bacchelli & Bird (2013) | Ver abaixo | A literatura não diz que é "o mais importante": é um dos fatores. O peso 30 precisa vir do §1.2 |
| **Lead time (15)** | Forsgren, Humble & Kim (2018); relatórios DORA | Lead time for changes é uma das 4 métricas de desempenho de entrega | Seu lead time é abertura→merge do PR, **não** commit→produção. Declare a diferença |
| **Fluxo de PRs (20)**, **Prazo (20)** | PMBOK / gestão de projetos; Kaplan & Norton (1992) | Controle de desvio contra o plano | Não achei ainda uma referência específica para "PR parado" |
| **Proteção da branch (15)** | OpenSSF Scorecard (Branch-Protection) | Prática de gestão de configuração e controle de acesso | É prática, não resultado; ver ressalva abaixo |

### 2.1 Revisão de código
- ✅ **McIntosh, S.; Kamei, Y.; Adams, B.; Hassan, A. E. (2014).** The impact of code review coverage and code review participation on software quality: a case study of the Qt, VTK, and ITK projects. *MSR 2014*, pp. 192–201. DOI 10.1145/2597073.2597076
  - **Sustenta:** cobertura de revisão e participação dos revisores estão **associadas a defeitos pós-lançamento** (modelos de regressão). Resumos de busca citam "até 2 e 5 defeitos a mais" para cobertura e participação baixas: **confira o número no artigo**.
  - **Uso direto:** é a melhor base para justificar "% de PRs mergeados com aprovação" (seu critério) e, de quebra, aponta que **participação** (não só existir 1 aprovação) importa, o que é uma limitação do seu critério ("ao menos 1 aprovação").
  - Versão estendida: *Empirical Software Engineering* (2016), DOI 10.1007/s10664-015-9381-9.
- ✅ **Bacchelli, A.; Bird, C. (2013).** Expectations, outcomes, and challenges of modern code review. *ICSE 2013*, pp. 712–721. DOI 10.1109/ICSE.2013.6606617
  - **Sustenta (com nuance):** na prática, revisão de código na Microsoft traz **menos defeitos achados do que se espera** e mais **transferência de conhecimento e consciência do time**. Use para **moderar** o texto: aprovação é evidência de que houve revisão, não prova de qualidade.

### 2.2 Entrega e produtividade
- ✅ **Forsgren, N.; Humble, J.; Kim, G. (2018).** *Accelerate.* IT Revolution. + relatórios *Accelerate State of DevOps* (Google/DORA), p.ex. https://research.google/pubs/2019-accelerate-state-of-devops-report/
  - **Sustenta:** as 4 métricas (lead time, frequência de deploy, tempo de restauração, taxa de falha) e sua associação com desempenho organizacional.
  - ⚠️ **Fontes secundárias contestam as faixas Elite/High/Medium/Low**: as faixas variaram entre edições e o relatório de 2025 trocou as faixas por perfis de equipe. Para a sua faixa "24 h → 7 dias" (linear), **não diga que vem do DORA**; diga que é inspirada nele e é uma **escolha de projeto** a validar (§8). A afirmação "revisões rápidas → 50% mais desempenho" circula em blogs de fornecedores: ❌ **não citar** sem achar a página do DORA.
- ✅ **Forsgren, N.; Storey, M.-A.; Maddila, C.; Zimmermann, T.; Houck, B.; Butler, J. (2021).** The SPACE of developer productivity. *ACM Queue*, 19(1), 20–48. DOI 10.1145/3454124
  - **Sustenta:** **produtividade não se reduz a uma métrica**; recomenda várias dimensões. Use na seção de limitações: seu índice mede **atividade e processo**, não satisfação nem bem-estar.

### 2.3 Proteção de branch e gestão de configuração
- ⚠️ **OpenSSF Scorecard** (documentação oficial em `github.com/ossf/scorecard`, `docs/checks.md`): checks *Branch-Protection* e *Code-Review*. Só achei espelhos e resumos; abra a documentação oficial. **Sustenta:** a comunidade de segurança de software já pontua "branch protegida" e "revisão humana antes do merge" como práticas.
  - **Ressalva do próprio Scorecard (via resumos):** ele mede **práticas, não qualidade do código**. Faça a mesma ressalva.

### 2.4 Riscos de validade de medir com dados do GitHub
- ✅ **Kalliamvakou, E.; Gousios, G.; Blincoe, K.; Singer, L.; German, D. M.; Damian, D. (2014).** The promises and perils of mining GitHub. *MSR 2014*, pp. 92–101. DOI 10.1145/2597073.2597074
  - **Sustenta:** dados do GitHub têm armadilhas (p.ex., PRs mergeados que não aparecem como mergeados por causa de como o merge foi feito; muitos repositórios inativos ou pessoais). Use em **ameaças à validade**. Seu sistema lê o estado de merge pela API GraphQL, mas vale citar a armadilha e dizer como você a evita (ou não).
- **Lei de Goodhart / uso de métricas como meta:** ⚠️ **não encontrei estudo empírico revisado por pares**; só blogs e imprensa técnica. Para sustentar, use o SPACE (acima) e o próprio argumento do TCC de que o índice é **ferramenta de conversa, não de ranking de pessoas**. Posso procurar mais, mas não vou inventar uma fonte.

---

## 3. Governança de TI: o arcabouço que organiza os requisitos

- ✅ **ISO/IEC 38500** (Governança de TI para a organização). ⚠️ **A edição de 2024 mudou**: alinhou-se à ISO 37000 e passou de **6 para 11 princípios**. Descubra qual edição vocês citam. Modelo central: **avaliar, dirigir e monitorar** (EDM).
  - ⚠️ **Ponto fraco no texto de vocês:** o relatório afirma que a revisão de código é "o controle central de governança segundo ISO/IEC 38500 e COBIT" (`RELATORIO_TCC.md` §4.1 e §5, e `REGRAS_DE_NEGOCIO.md` §5.1). **Não achei nada que sustente isso.** A 38500 é de nível de conselho/direção (princípios), não de revisão de PR. Essa frase é o tipo de coisa que a banca chamou de "opinião com referência jogada". **Reescreva ou remova**: diga que o peso é uma escolha de projeto, sustentada por McIntosh (2014), e validada pelo §1.2.
- ✅ **COBIT** (ISACA) https://www.isaca.org/resources/cobit — use como **modelo de objetivos de governança e gestão**; mapeie seus 7 pilares/regras a objetivos COBIT *específicos* (não só citar o nome).
- ✅ **De Haes, S.; Van Grembergen, W.** (pesquisadores da Univ. de Antuérpia; vários trabalhos, p.ex. estudo Delphi na *Communications of the AIS*, v. 22, art. 24, 2008). IT governance = **estruturas, processos e mecanismos relacionais**. ⚠️ Só vi resumos; confira o texto. **Sustenta:** o sistema cobre o eixo de **processos e monitoramento**; os outros dois eixos ficam fora do escopo, e isso é uma limitação honesta.
- ✅ **Henderson, J. C.; Venkatraman, N. (1993).** Strategic alignment: leveraging information technology for transforming organizations. *IBM Systems Journal*, 32(1), 4–16. **Sustenta:** a tela de Estratégia (objetivos ↔ projetos) é uma operacionalização de **alinhamento estratégico** negócio–TI.
- ✅ **Kaplan, R. S.; Norton, D. P. (1992).** The balanced scorecard—measures that drive performance. *Harvard Business Review*, 70(1). **Sustenta:** limitar o número de medidas para evitar sobrecarga de informação, e combinar indicadores de resultado e de tendência. Útil para justificar **poucos critérios** no índice.
- ✅ **TCU — Levantamento de Governança de TI (iGovTI)**, ciclo 2012 (resultou no **Acórdão 2.585/2012-Plenário**; ⚠️ o **Acórdão 1.233/2012** é uma auditoria *diferente*, não os confunda). O iGovTI é um índice percentual com **faixas** (60–100% aprimorado, 40–59% intermediário, 0–39% inicial, segundo resumos). https://repositorio.enap.gov.br/bitstream/1/3719/1/Levantamento_de_Governan%c3%a7a_de_TI_2012.pdf
  - **Sustenta:** há **precedente brasileiro oficial** de índice 0–100% de governança de TI com faixas de maturidade. Reforça a escolha de forma e a cara das suas faixas (80/60), embora os limiares do TCU sejam outros. Fortalece o argumento de **contexto brasileiro**.

---

## 4. Validação quantitativa e método de pesquisa

- ✅ **Hevner, A. R.; March, S. T.; Park, J.; Ram, S. (2004).** Design science in information systems research. *MIS Quarterly*, 28(1), 75–105. DOI 10.2307/25148625 — 7 diretrizes; uma delas é a **avaliação rigorosa do artefato**. Enquadra o GovTech como **artefato** a ser construído e avaliado.
- ✅ **Peffers, K.; Tuunanen, T.; Rothenberger, M. A.; Chatterjee, S. (2007).** A design science research methodology for information systems research. *JMIS*, 24(3), 45–77. DOI 10.2753/MIS0742-1222240302 — 6 etapas: problema, objetivos da solução, projeto e desenvolvimento, **demonstração, avaliação**, comunicação. **Use como espinha dos capítulos** (hoje o texto tem muito "desenvolvimento" e pouca "avaliação").
- ✅ **Wazlawick, R. S.** *Metodologia de Pesquisa para Ciência da Computação.* Elsevier (2ª ed. 2014; 3ª ed. 2021). **Referência brasileira**, que distingue construir um artefato de fazer ciência. ⚠️ Os resumos não mostram o capítulo sobre design science; confira.
- ✅ **Davis, F. D. (1989).** Perceived usefulness, perceived ease of use, and user acceptance of information technology. *MIS Quarterly*, 13(3), 319–340. DOI 10.2307/249008 — **TAM**: escalas de utilidade e facilidade percebidas (confiabilidades relatadas .98 e .94 no resumo). **Uso:** medir a **aceitação** pelos gestores com questionário validado, em vez de "gostaram".
- ✅ **Brooke, J. (1996).** SUS: a "quick and dirty" usability scale. In: *Usability Evaluation in Industry.* Taylor & Francis. + **Bangor, A.; Kortum, P. T.; Miller, J. A. (2008).** An empirical evaluation of the System Usability Scale. *International Journal of Human-Computer Interaction*, 24(6), 574–594. ⚠️ **As faixas de interpretação variam entre fontes**; use a tabela do artigo original, não de blog.
- Os **requisitos viram resultado mensurável** com o roteiro da §8 e a rastreabilidade GQM da §1.3.
- ✅ **Buse, R. P. L.; Zimmermann, T. (2012).** Information needs for software development analytics. *ICSE 2012*, pp. 987–996. DOI 10.1109/ICSE.2012.6227122 — survey com **110 desenvolvedores e gestores** sobre necessidades de informação. **Sustenta:** o requisito do gestor "ver vários projetos de forma simples" tem base em pesquisa (ferramentas devem ser **simples**, concisas e permitir **detalhar** por tempo e organização). É também um bom modelo de como **estruturar um levantamento** com gestores.

---

## 5. IA em nuvem: privacidade, segurança e qualidade

### 5.1 Privacidade e LGPD (a pergunta "como funciona o sigilo?")
- ✅ **Lei nº 13.709/2018 (LGPD)**, art. 33 (transferência internacional) e demais. https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm
- ✅ **Resolução CD/ANPD nº 19/2024** — Regulamento de Transferência Internacional de Dados e **cláusulas-padrão contratuais** (publicada em 23/08/2024; prazo de adequação de 12 meses, encerrado em 23/08/2025, segundo fontes secundárias). ⚠️ Confirme no Diário Oficial/ANPD.
  - **Implicação para o GovTech:** a tela diz "processado nos EUA". Isso é **transferência internacional**. Mesmo enviando só métricas e títulos de PR (que "podem citar pessoas", regra IA2), é preciso o **instrumento** do art. 33 (p.ex. cláusulas-padrão no contrato com o provedor). Hoje o relatório descreve a *decisão*, não o *mecanismo legal*.
- ✅ **ANPD (2024).** *Radar Tecnológico nº 3 — Inteligência Artificial Generativa.* Coordenação-Geral de Tecnologia e Pesquisa. https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-releases-english-version — destaca riscos como **alucinações** e a dificuldade de eliminar dados pessoais de modelos treinados. ⚠️ **É um estudo preliminar, não orientação oficial de conformidade**: cite assim.
- ⚠️ **Termos do provedor (Groq):** a página oficial *Your Data* (https://console.groq.com/docs/your-data) diz que os pedidos de inferência **não são retidos por padrão** e que existe **Zero Data Retention** nas configurações; o próprio resumo da busca encontrou **inconsistência** (a descrição da página ainda menciona retenção de 30 dias). A cláusula "não usa para treino" veio de resumo de terceiros: **leia o *Services Agreement* e o DPA** antes de afirmar no texto, e **ative o ZDR** se for manter a IA.
- ✅ **Caso real (motivação):** em 2023, engenheiros da Samsung colaram código-fonte confidencial no ChatGPT, e a empresa restringiu o uso (Bloomberg, maio/2023; cobertura: https://www.techradar.com/news/samsung-bans-chatgpt-use-after-employee-leak). **Uso:** ilustra exatamente o risco que a banca levantou ("projeto super sigiloso"). É notícia, não artigo: use como **contexto**, não como evidência científica.
- ✅ **Carlini, N. et al. (2021).** Extracting training data from large language models. *USENIX Security 2021*, pp. 2633–2650. https://www.usenix.org/conference/usenixsecurity21/presentation/carlini-extracting — mostra extração de trechos **literais** do treinamento (no GPT-2). **Sustenta:** a preocupação de que dados enviados e usados em treino podem vazar. **Cuidado:** o estudo é sobre GPT-2; não generalize para o seu provedor.

### 5.2 Segurança do assistente
- ✅ **OWASP Top 10 for LLM Applications** (edição 2025; há edição 2026 mencionada). https://genai.owasp.org — **LLM01 Prompt Injection** e **LLM02 Sensitive Information Disclosure**. ⚠️ Só vi resumos; **abra o documento oficial** e cite os itens e a edição certos. Você já citou o OWASP; falta **mapear cada risco → o que o GovTech faz → teste**.
- ✅ **Greshake, K. et al. (2023).** Not what you've signed up for: compromising real-world LLM-integrated applications with indirect prompt injection. *AISec 2023* (arXiv 2302.12173). — **injeção indireta**: instruções escondidas em dados que a aplicação recupera. É **exatamente** o caso de um título de PR com ordens escondidas, que o seu prompt já trata como "dados, não instruções". Falta **testar**: escreva casos de injeção e mostre o resultado.
- ✅ **NIST AI 600-1 (2024).** *Generative AI Profile* (companion do AI RMF 1.0). DOI 10.6028/NIST.AI.600-1 — 12 riscos, inclusive **confabulação** e **privacidade de dados**. ⚠️ Só vi resumos. Voluntário e não é lei. **Use como checklist** de gestão de risco.
- **Guardrails** (a banca chamou de "receita de bolo"): Inan et al. (2023), *Llama Guard*, e Rebedea et al. (2023), *NeMo Guardrails*. ⚠️ **Essas duas citações vieram da minha memória**, não da busca (a busca só achou resumos e documentação). Confira título, autores e venue no arXiv/ACL Anthology antes de usar. Para o seu porte, o **guardrail mais defensável** é o que você já tem (recusa fora de escopo, remoção de campos pessoais, limite de uso) **mais testes**.

### 5.3 Qualidade das respostas (o ponto "é difícil avaliar")
- ✅ **Ji, Z. et al. (2023).** Survey of hallucination in natural language generation. *ACM Computing Surveys*, 55(12), 1–38. DOI 10.1145/3571730 — base conceitual para **por que** a resposta precisa ser avaliada.
- ✅ **Zheng, L. et al. (2023).** Judging LLM-as-a-judge with MT-Bench and Chatbot Arena. *NeurIPS 2023* (arXiv 2306.05685) — o juiz GPT-4 concordou com humanos em **mais de 80%** (resumo; confira a tabela). **Uso e limite:** permite avaliar em escala, mas **calibre com revisão humana** numa amostra.
- ✅ **Es, S. et al. (2023).** Ragas: automated evaluation of retrieval augmented generation (arXiv 2309.15217) — métricas de **fidelidade ao contexto** (a resposta é inferível dos dados recebidos?) e relevância da resposta. **Encaixa** no seu desenho (contexto montado no navegador).
- **Vantagem sua:** o assistente responde sobre **números calculáveis**. Então dá para criar um **conjunto de perguntas com gabarito** (a resposta certa vem do próprio painel) e medir acerto, recusa correta e resistência a injeção. É uma avaliação **objetiva**, ao contrário de "julgar a qualidade".

---

## 6. Mercado e diferenciação

- ✅ **Gartner — Magic Quadrant for Developer Productivity Insight Platforms** (publicado em 05/05/2026, segundo o resumo do Gartner). https://www.gartner.com/en/documents/7804517. Fornecedores listados: Allstacks, Atlassian (DX), BlueOptima, Faros, Jellyfish, LinearB, Oobeya, Opsera, Plandek, Sleuth, Swarmia, Uplevel, Waydev.
  - ⚠️ **Não consegui ver a posição de cada fornecedor** (exige login). A afirmação "50% das organizações usarão plataformas de inteligência de engenharia até 2027" é de um fórum secundário: ❌ não citar.
  - **Uso:** prova que o **problema é real e comercial** (categoria existe e tem MQ), e dá a lista de concorrentes para a tabela comparativa.
- **O que falta (trabalho seu):** fazer a **tabela comparativa com a documentação oficial** de 3–4 concorrentes (por exemplo LinearB, Jellyfish, Swarmia, DX) nos eixos: público (gestor × engenharia), **objetivos estratégicos**, **mapeamento a CMMI/ISO**, **auditoria imutável**, **preço**, **contexto LGPD/região**. Só afirme diferencial que você **verificou** nas páginas deles. Não incluí isso para não inventar atributos de concorrentes.
- ✅ **Buse & Zimmermann (2012)**, §4, sustentam a **necessidade** do tipo de produto.

---

## 7. Processos (CMMI / ISO 12207 / MPS.BR)

- ⚠️ **MPS.BR (Softex), *Guia Geral MPS de Software* (2016)** — modelo brasileiro, cuja base técnica inclui **ISO/IEC 12207, ISO/IEC 20000 e a família ISO/IEC 330xx** (segundo o próprio guia). https://leomurta.github.io/courses/es2/MPS.BR_Guia_Geral_Software_2016-com-ISBN.pdf
  - **Uso:** reforça a escolha de ISO 12207/33000 no **contexto brasileiro** e permite citar o MPS.BR como alternativa de avaliação que vocês **não** implementam.
  - ⚠️ A ISO/IEC/IEEE 12207 tem **edição nova (2026)** segundo a busca; confirme qual edição citar.
- **CMMI-DEV 1.3** (CMU/SEI-2010-TR-033): mapeamento VER, CM, PMC, MA. Já está no seu relatório; **cite o relatório técnico do SEI** e **a prática específica** (SP) de cada área, não só a sigla. Eu **não** abri esse documento nesta pesquisa.
- O aviso "evidência de apoio, não avaliação de maturidade" (C5) é a postura correta; mantenha.

---

## 8. Proposta de validação quantitativa (para você aprovar)

Responde de uma vez às críticas 1, 2 e 3:

1. **Tabela de rastreabilidade** (GQM / ISO 15939): *requisito do gestor → pergunta → métrica/critério → fonte de dado → peso → como foi validado*. Um requisito sem métrica aparece como lacuna explícita.
2. **Origem dos pesos:** coletar com os gestores (AHP ou Delphi, §1.2), **comparar** com 30/20/20/15/15 e reportar a diferença. Não se diga que os pesos atuais vêm da literatura.
3. **Análise de sensibilidade** (Saisana et al., 2005; Handbook OECD): sobre os **dados reais** do GitHub dos projetos de vocês, variar os pesos (±10, ±20 pontos; e Monte Carlo com pesos aleatórios) e medir:
   - % de projetos que **mudam de faixa** (Bom/Regular/Crítico);
   - **correlação de ranking** (Spearman) entre o índice base e as variações;
   - qual critério **mais move** a nota.
   Se o ranking é estável, os pesos "importam pouco"; se não, você sabe onde está o risco.
4. **Validade de critério (com humildade sobre N pequeno):** pedir aos gestores uma **avaliação cega** da saúde de cada projeto e comparar com a nota do índice. Reporte a concordância e as limitações da amostra.
5. **Aceitação:** SUS + TAM (§4) com os gestores, com **meta definida antes** (por exemplo, SUS acima de um limiar que você cite de fonte primária).
6. **IA:** conjunto de perguntas com gabarito, casos de injeção (OWASP LLM01) e vazamento (LLM02), com taxa de acerto, de recusa correta e de bloqueio.

**O que eu posso fazer no código (com sua aprovação, conforme o `AGENTS.md`):** extrair os pesos para uma configuração explícita e criar um **script de sensibilidade** com testes (sem tocar no banco), e registrar a regra nova em `docs/REGRAS_DE_NEGOCIO.md` antes. Também posso montar o **conjunto de testes do assistente** (acerto, recusa e injeção). Nada disso foi feito ainda.

---

## 9. Como escrever as citações (o que a banca pediu)

- **Poucas e lidas:** 1 a 2 referências por afirmação, e só as que você **leu** o trecho. Dezenove referências bem usadas valem mais que quarenta empilhadas.
- **Com posicionamento:** "McIntosh et al. (2014) encontraram associação entre cobertura de revisão e defeitos; por isso o critério *Revisão de código* recebe o maior peso, **a validar na §X**". A afirmação é sua; a citação sustenta.
- **Fonte sólida:** artigo revisado por pares, norma, lei, documentação oficial. Blog, página de fornecedor e fórum **não** são evidência (usei alguns só como pista e os marquei ⚠️/❌).
- **Passe do "olho de verificação":** para cada citação, abra o PDF, ache o trecho, anote a página. Se não achar, remova.
- **Não use IA para gerar a lista de referências.** Todas as acima foram *encontradas* e conferidas quanto à existência, mas as marcadas ⚠️ têm detalhes a confirmar.

---

## 10. Lacunas desta pesquisa (o que eu não fiz)

- Não li os textos integrais: li resumos, páginas bibliográficas e documentação.
- Não procurei referência específica para: PMBOK/gestão de prazo, "PR parado" e proteção de branch como causa de defeitos; relatório de impacto à proteção de dados (RIPD, LGPD art. 38); Weill & Ross (governança de TI); ITIL.
- A monografia em si não foi lida (só o relatório técnico).
- Pode haver periódicos brasileiros (SBSI, SBQS, RBIE) com estudos sobre governança de TI e métricas de PR em empresas brasileiras. **Vale uma busca dirigida** nesses anais.
