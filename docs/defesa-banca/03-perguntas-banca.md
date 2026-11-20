# Perguntas difíceis da banca

Cada resposta cita evidência do projeto (ver [auditoria](01-auditoria-smartmarket.md)). Quando algo não existe, a resposta diz isso. Onde há `[PREENCHER]`, só você sabe.

**Formato:** pergunta · o que a banca avalia · resposta sugerida · evidência · possível aprofundamento · se não estiver implementado.

---

## A. Professor responsável

### A1. "Como os dados entram, são validados e chegam ao usuário?"
- **Avalia:** compreensão do fluxo de ponta a ponta.
- **Resposta:** "Robôs em Python leem os sites das redes e devolvem produto e preço. Uma etapa valida cada registro: o preço precisa ser um número finito e positivo. Registro inválido vai para uma quarentena com o motivo, e o lote só falha se mais de 20% for rejeitado. O que passa é gravado no PostgreSQL com histórico. O servidor Spring entrega pela API e o site React mostra."
- **Evidência:** `scraper/pipeline.py` (`preparar_com_quarentena`, `LIMITE_REJEICAO_PADRAO = 0.2`); `preco_positivo` nos coletores.
- **Aprofundamento:** "E se o preço for positivo, mas absurdo?"
- **Se faltar:** ver A2.

### A2. "Vocês tratam outliers? Um preço de R$ 0,01 ou de R$ 9.999 distorce a comparação."
- **Avalia:** honestidade técnica e noção de qualidade de dados.
- **Resposta:** "Não. Hoje a validação é estrutural: bloqueia preço ausente, não numérico, negativo ou zero. Um valor positivo, mas absurdo, passaria. É a principal evolução de qualidade de dados. A abordagem que eu seguiria é comparar cada preço com a mediana do mesmo produto nas outras redes e do histórico dele, mandando para a quarentena o que fugir muito."
- **Evidência:** busca por "outlier" no código não retorna nada; o diagrama do slide 5 marca "Ainda não: outliers".
- **Aprofundamento:** "Qual limite usariam?" → "Eu calibraria com os dados reais; não vou chutar um número agora."
- **Se faltar:** é exatamente este caso. Não diga que existe.

### A3. "Como o banco garante a integridade dos preços?"
- **Resposta:** "O preço é histórico por rede, e `preco_loja` liga um preço a uma loja com `vigente_desde` e `vigente_ate`. Um índice único parcial recusa dois vínculos vigentes para a mesma loja e produto, e uma chave composta amarra o produto. Na carga, valor novo fecha o vínculo antigo antes de abrir o novo, na mesma transação."
- **Evidência:** `backend/deploy/07_indice_unico_vinculo_vigente.sql`; `pipeline.gravar_preco_na_loja`; teste em PostgreSQL real (`test_lojas_postgres.sh`).
- **Aprofundamento:** "Por que PostgreSQL real nos testes?" → "O banco em memória dos testes Java não cobre índice parcial."

### A4. "Como vocês testam? Qual a cobertura?"
- **Resposta:** "Há 92 arquivos de teste no site, 56 classes no servidor e 37 arquivos na coleta. O CI roda os três em todo pull request. O mínimo é 70% de cobertura: no site nos quatro contadores (Jest), no servidor em linhas e branches (JaCoCo). Não baixamos o limiar sem acordo do grupo."
- **Evidência:** `.github/workflows/ci.yml`; `jest.config.cjs`; `backend/pom.xml`.
- **Se faltar:** não há testes ponta a ponta no navegador em produção, e eu não rodei a suíte de novo para esta defesa.

### A5. "Que cuidados de segurança vocês tomaram?"
- **Resposta:** "JWT com segredo de pelo menos 32 bytes (o servidor não sobe com o valor de exemplo), papel lido do banco a cada pedido, limite de 15 tentativas por minuto no login e cadastro, CORS por variável, Content-Security-Policy no site e a lista pública de filiais com limite de 30 pedidos por minuto. A localização do usuário nunca é gravada no navegador."
- **Evidência:** `SecurityConfig.java`, `PapelDoBancoJwtConverter.java`, `RateLimitingFilter.java`, `vite-plugins/csp.js`.
- **Se faltar:** não há autenticação em dois fatores, nem monitoramento de segurança, nem auditoria externa.

### A6. "Isso escala?"
- **Resposta:** "O desenho em camadas permite crescer, mas hoje roda em planos gratuitos: o servidor dorme e há pouco cache. Escalar pediria infraestrutura paga, cache, medição de desempenho e uma coleta que grave com segurança em produção."
- **Evidência:** `render.yaml`, `keep-alive.yml`, aviso "servidor acordando".
- **Se faltar:** não há teste de carga nem observabilidade além do `/api/health`.

### A7. "Por que a loja é só referência, e o preço é por rede?"
- **Resposta:** "Coletar por filial multiplicaria o custo e os bloqueios. As redes praticam preço por rede nos canais que lemos. A loja ajuda a pessoa a saber aonde ir, e a tela diz isso."
- **Evidência:** `CLAUDE.md` (Lojas e preço por loja); texto "O preço vale para toda a rede" no cartão.
- **Se faltar:** preço por filial real exigiria coleta por loja, que não existe.

---

## B. Empresas mantenedoras

### B1. "Qual é o diferencial? Já existem comparadores."
- **Resposta:** "Comparamos a **lista inteira**, não só um item, e mostramos a loja mais perto. Respeitamos o `robots.txt` e os bloqueios, o que limita a cobertura, mas dá um caminho sustentável. Não vou dizer que temos mais dados que um concorrente estabelecido: não pesquisei isso."
- **Evidência:** `ShoppingListPage.jsx`, `GET /api/listas/{id}/comparacao`, `GET /api/lojas/proximas`.
- **Se faltar:** não há análise formal de concorrentes no projeto.

### B2. "Quanto o usuário economiza?"
- **Resposta:** "Ainda não medimos. O cupom da home é um exemplo ilustrativo, e o site avisa. Para afirmar economia seria preciso comparar cestas reais ao longo do tempo."
- **Evidência:** rótulo "Exemplo ilustrativo" na home.
- **Se faltar:** não existe métrica de economia. Não cite percentual.

### B3. "Como ganhariam dinheiro?"
- **Resposta:** "Hoje o produto não cobra. Hipóteses a validar: inteligência de preços para varejistas (B2B), planos para empresas e parcerias com as redes. Nada disso foi testado com clientes."
- **Evidência:** slide 6, coluna "Visão".
- **Se faltar:** não há código de cobrança nem pesquisa de mercado.

### B4. "E as redes? Elas aceitam ser lidas?"
- **Resposta:** "Algumas não. O `robots.txt` do Zaffari e do Rissul proíbe a coleta, e o Cloudflare do Fort e da Asun bloqueia o robô. Suspendemos as quatro e não contornamos. Hoje a coleta diária cobre Carrefour, Atacadão, Master e Stok. O caminho para as outras é autorização ou parceria. A Asun já recebeu um pedido do responsável do projeto."
- **Evidência:** `REDES_SUSPENSAS` em `scraper/rotina_carga.py`.
- **Aprofundamento:** "Por que a Asun aparece como 'Coleta ativa' no site?" → "Os preços dela foram coletados antes da suspensão e continuam no catálogo como histórico. O rótulo do site merece ajuste."

### B5. "Quantos usuários vocês têm?"
- **Resposta:** "Não tenho esse número e não vou inventar. `[PREENCHER: se houver dado de uso]`."
- **Se faltar:** o projeto não tem métricas de uso.

### B6. "Quanto custa manter?"
- **Resposta:** "Hoje usa planos gratuitos do GitHub Pages, Render e Neon, com limites (servidor que dorme). Um custo real exigiria planos pagos."
- **Evidência:** `render.yaml`; `docs/PRODUCAO-NEON.md`.

---

## C. RH

### C1. "Qual foi a sua contribuição?"
- **Avalia:** protagonismo com verdade.
- **Resposta:** "Pelo histórico do Git, abri 89 dos 173 pull requests e tenho 416 commits sem merge. Nas últimas semanas entreguei o botão Navegar (PR #176), a auditoria do frontend (PR #177) e o guia com o mapa do projeto (PR #179). `[PREENCHER: as frentes que você assume, por exemplo frontend, coleta, CEP e lojas, testes]`."
- **Evidência:** `git shortlog`, PRs citados.
- **Atenção:** não diga "fiz tudo". São seis pessoas com commits.

### C2. "Vocês usaram IA?"
- **Avalia:** transparência e responsabilidade.
- **Resposta:** "Sim, como ferramenta de apoio. O histórico mostra commits com autoria do assistente. O que entra passa por pull request, por revisão e por testes, e eu respondo pelo que foi mesclado. Ela acelera, mas decisões como respeitar o robots.txt, suspender redes e não simular preço foram da equipe."
- **Evidência:** `git shortlog` (87 commits com autoria "Claude"); `docs/COMENTARIOS-DE-BOTS.md`; regras de PR.
- **Atenção:** esta pergunta é provável. Não minimize e não esconda.

### C3. "Qual foi a maior dificuldade?"
- **Resposta:** "O bloqueio das redes. Quando um site diz não, a saída fácil é disfarçar o robô. Decidimos parar e respeitar, e isso reduziu a cobertura de oito para quatro redes na coleta diária. Aceitamos esse custo."
- **Evidência:** `REDES_SUSPENSAS`; remoção, em 11/11, do sistema paralelo que mascarava automação.

### C4. "Houve conflito na equipe? Como resolveram?"
- **Resposta:** `[PREENCHER: um exemplo real e honesto]`. Se não houve, diga "Divergências tivemos, e resolvemos em revisão de PR". Não invente um conflito.
- **Evidência possível:** discussões de PR no GitHub.

### C5. "Como vocês se organizaram?"
- **Resposta:** "Branches por tarefa a partir da `main`, pull request com revisão antes de mesclar, template de PR com checklist e CI obrigatório. Issues no GitHub."
- **Evidência:** `CLAUDE.md` (Convenções), `.github/pull_request_template.md`, `ci.yml`.

### C6. "O que aprendeu e o que faria diferente?"
- **Resposta:** "Aprendi que dado de fora é incerto: bloqueia, muda, mente. Eu validaria a qualidade do dado mais cedo, incluindo outliers, e mediria a economia real. `[PREENCHER: o seu aprendizado pessoal]`."

### C7. "Quais são seus próximos passos profissionais?"
- **Resposta:** `[PREENCHER]`. Conecte com o que o projeto exigiu: backend, dados, qualidade e produto.

---

## D. Perguntas curinga

- **"Isso funciona hoje?"** Sim, no ar. Mostre a demo e cite os limites: 4 redes, 191 produtos comparáveis, catálogo logado.
- **"O que não está pronto?"** Alertas que avisam, validação de outlier, histórico visível ao usuário, observabilidade, cobrança, multi-tenant.
- **"O número da home é 9.277 ou 3.610?"** São medidas diferentes: 9.277 anúncios no catálogo e 3.610 preços sincronizados na faixa das redes. Use um só na fala e diga o que mede.
- **"Posso ver o código?"** O repositório é `smartmarket-team/smartmarket`; o `docs/mapa-smartmarket.html` mostra a estrutura sem abrir código.
