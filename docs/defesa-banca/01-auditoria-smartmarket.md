# Auditoria do SmartMarket para a defesa

Fonte de verdade da apresentação. Tudo o que o deck afirma tem evidência aqui. Data da auditoria: 15/11/2026, sobre a `main` (commit `243f0f8`) e o site publicado.

**Como ler a classificação**

- **IMPLEMENTADO**: comprovado no código e, quando possível, no site.
- **PARCIAL**: existe, mas com limite relevante.
- **PROPOSTO**: ideia, ainda não existe.
- **NÃO COMPROVADO**: sem evidência suficiente; o deck não afirma.

---

## 1. Funcionalidades e evidências

| # | Capacidade | Estado | Evidência | Limite que a banca pode perguntar |
|---|---|---|---|---|
| 1 | Catálogo com preço por rede | IMPLEMENTADO | `frontend/src/data.js` (9.277 anúncios, "sem preço simulado"); home publicada mostra 9.277 | Só 4 redes aparecem com anúncios no site |
| 2 | Comparar o mesmo produto entre redes | IMPLEMENTADO | `scraper/casamento_camadas.py`, `frontend/src/utils/equivalentes.js`, `ComparadorService.java` | A home informa **191 produtos em 2 ou mais redes**: é o universo realmente comparável |
| 3 | Lista de compras e total por rede | PARCIAL | `ShoppingListPage.jsx`; API `GET /api/listas/{id}/comparacao` | A lista da tela fica no navegador (`sessionStorage`) e some ao fechar a aba |
| 4 | Loja mais próxima por CEP | IMPLEMENTADO | `ResolvedorCep.java`, `GET /api/lojas/proximas`, flag `LOJAS_PROXIMAS_ATIVO = true`; 82 filiais, 74 com ponto no mapa | Distância em linha reta e aproximada; 8 filiais sem coordenada |
| 5 | Botão Navegar (Google Maps / Waze) | IMPLEMENTADO | `BotaoNavegar.jsx`, `linkComoChegar.js`; PR #176 | Só abre links; não calcula rota |
| 6 | Login, papéis e proteção | IMPLEMENTADO | `SecurityConfig.java`, `PapelDoBancoJwtConverter.java`, `RateLimitingFilter.java` (15 req/min no login) | Senha e token são padrão; não há autenticação em dois fatores |
| 7 | Painel do administrador | IMPLEMENTADO | `AdminController.java` (`/api/admin`, só ADMIN), `AdminPage.jsx` | Gerencia usuários e mercados |
| 8 | Favoritos | IMPLEMENTADO | `FavoritoController.java`; `favoritoService.js` | Também guardados no navegador |
| 9 | Alertas de preço | PARCIAL | `AlertaController.java` | **Não enviam aviso**; só guardam o valor desejado |
| 10 | Coleta automatizada de preços | PARCIAL | 8 coletores em `scraper/`; `rotina_carga.py` | Só **4 redes ativas** (Carrefour, Atacadão, Master, Stok); Zaffari, Rissul, Fort e Asun suspensas (`REDES_SUSPENSAS`) |
| 11 | Atualização de preços em produção | PARCIAL | `coleta_diaria.yml` só roda os testes; `validar_dsn` só aceita Postgres local | O GitHub nunca grava preço em produção; a carga é feita pelo responsável |
| 12 | Validação de dados na entrada | IMPLEMENTADO | `scraper/pipeline.py`: `preco_positivo`, quarentena (`quarentena.json`), lote falha acima de 20% de rejeitados | Validação **estrutural**, não estatística |
| 13 | Validação anti-outlier (estatística) | **PROPOSTO** | Busca por "outlier" no código: nenhum resultado | Preço absurdo, mas positivo, passaria. Apresentar como evolução |
| 14 | Histórico de preços no banco | IMPLEMENTADO | Tabelas `preco` e `preco_loja` (`vigente_desde/vigente_ate`); `GET /api/precos/produto/{id}/mercado/{id}` | Tela de histórico para o usuário: não comprovada |
| 15 | Cache | PARCIAL | ETag e cache de 10 min na lista de filiais; cache em memória de 5.000 CEPs | Sem camada de cache geral |
| 16 | Observabilidade | NÃO COMPROVADO | Só `GET /api/health` e o `keep-alive.yml` (a cada 10 min) | Sem métricas, alertas ou rastreamento de erros |
| 17 | Multi-tenant / SaaS B2B | **PROPOSTO** | Busca por "tenant": nenhum resultado | Não existe. Visão de negócio, não arquitetura |
| 18 | Monetização | **PROPOSTO** | Nenhum código de cobrança | — |
| 19 | Economia em reais para o usuário | NÃO COMPROVADO | O "cupom" da home é rotulado "Exemplo ilustrativo" | **Não afirmar percentual de economia** |
| 20 | Testes automáticos | IMPLEMENTADO | 92 arquivos no front, 56 classes no back, 37 arquivos no scraper; CI roda os três | Limiar de 70% de cobertura no front e no back (JaCoCo: linhas e branches) |
| 21 | Publicação | IMPLEMENTADO | Front no GitHub Pages, servidor no Render, banco no Neon; `deploy-pages.yml`, `render.yaml` | Render grátis dorme: 1 a 3 min na primeira chamada (há aviso na tela) |

## 2. Decisões arquiteturais comprovadas

1. **Três partes independentes** que conversam por banco e API REST: `frontend/` (React 19, Vite), `backend/` (Spring Boot, Java 17), `scraper/` (Python).
2. **Camadas no servidor**: controller → service → repository → model, com DTOs por domínio e um tratador central de erros (`GlobalExceptionHandler`).
3. **Preço por rede, loja só como referência.** O histórico de preço é por mercado; `preco_loja` liga um preço a uma loja sem duplicar o valor. Evita multiplicar a coleta por filial.
4. **Papel lido do banco a cada pedido**, não do token: um token antigo não mantém privilégio de administrador.
5. **Idempotência na carga**: mesmo valor só confirma o vínculo; valor novo fecha o antigo antes de abrir o novo, na mesma transação, e o índice único parcial do banco recusa dois vigentes.
6. **Quarentena em vez de parada**: registro inválido não derruba a carga da rede.
7. **Trava de segurança da coleta**: `validar_dsn` impede que um computador de nuvem grave preço de verdade.
8. **Respeito aos sites das redes**: o contrato é parar no primeiro 403 e obedecer ao `robots.txt`. Em 11/11 foi removido um sistema paralelo de coleta que violava isso.
9. **Privacidade da localização**: CEP não é gravado no navegador; a posição atual fica só em memória.
10. **Guardas de qualidade no CI**: limiar de cobertura, tamanho máximo do pacote do site, bloqueio de arquivos de desenvolvimento pessoal.

## 3. Problemas reais enfrentados (material para a fala)

| Problema | O que se fez | Evidência |
|---|---|---|
| Cloudflare responde 403 ao robô (Fort, Asun) | Suspender as redes; não contornar | `REDES_SUSPENSAS` |
| `robots.txt` do Zaffari e do Rissul proíbe `/api/` | Suspender as redes | `REDES_SUSPENSAS` |
| Servidor grátis dorme (1 a 3 min) | Timeout de 200 s, aviso "servidor acordando", `keep-alive` a cada 10 min | `api.js`, `keep-alive.yml` |
| CEP devolvia o centro da cidade (36 CEPs de Porto Alegre no mesmo ponto) | Refino pela rua, com travas; se não houver certeza, só cidade e UF | `ResolvedorCep.java` |
| Preço simulado no catálogo | Removido; só preço coletado | `data.js` ("sem preço simulado") |
| Pacote do site estourava o limite | Fotos e catálogo no armazenamento do Neon; guarda de tamanho no CI | `verificar-tamanho-dist.sh` |
| Contraste insuficiente do verde da marca em textos | Regra e testes de contraste | `contrasteTokens.test.js` |

## 4. Diferenças entre o site publicado e o código

Observadas em 15/11/2026, no navegador:

- A home mostra **4 redes** com "Coleta ativa": Asun (3.367 anúncios), Stok (118), Atacadão (5) e Master (120). A rotina diária, no código, **suspende a Asun** e inclui o Carrefour, que não aparece na faixa. A rotulagem "Coleta ativa" da Asun merece cuidado na fala: a rede foi coletada, mas hoje está suspensa.
- A home mostra dois totais diferentes: **9.277 anúncios** (catálogo) e **3.610 preços sincronizados** (faixa das redes). Medem coisas diferentes; na fala, usar um só e dizer o que ele mede.
- O Atacadão tem só 5 anúncios: a comparação entre redes depende, na prática, de Asun, Stok e Master.
- O catálogo e a busca exigem login. **Não criei conta em produção**; por isso o catálogo logado não foi inspecionado e só a página pública tem captura real.
- Console do navegador na home: sem erros nem avisos.

## 5. Histórico de desenvolvimento

- Primeiro commit em 24/08/2026; 795 commits na `main` e 173 PRs (abertos e fechados).
- Commits sem merge, por autor (todas as branches): Davi Cardozo 416; João Tomás Venâncio 50 (mais 6 com outros e-mails); Ronald Antonio Oliveira de Sousa 25; Luciano 8; Bruno Meireles 7; Pedro Meireles 5; e 14 do dependabot.
- **87 commits têm autoria "Claude"** (desenvolvimento assistido por IA). O deck e o roteiro não escondem isso; ver o aviso na seção 6.
- PRs por conta no GitHub: DaviSCardozo 89, codetradeai 47, lucianosdev 6, Bruno-Meireles 6, Hidan404 5.

## 6. Contribuição individual: o que é comprovável e o que falta

**Comprovável pelo Git:** a conta DaviSCardozo abriu 89 dos 173 PRs e tem 416 dos commits sem merge; as áreas descritas nas seções 1 a 3 aparecem nos PRs dessa conta (por exemplo, Navegar no PR #176, auditoria do frontend no #177).

**Falta confirmar com você (o deck usa marcadores até lá):**

1. Quais partes você assume como suas (frontend, coleta, CEP/lojas, testes, deploy?).
2. Como a equipe se dividiu (nomes e papéis de João Tomás, Ronald, Luciano, Bruno, Pedro).
3. Como você quer apresentar o uso de IA: o histórico mostra 87 commits de autoria "Claude". Recomendação: dizer abertamente que a IA foi uma ferramenta de apoio e que você revisa, decide e responde pelo código. Uma pergunta direta da banca sobre isso é provável.

Nada disso foi inventado: o slide 7 usa só fatos do histórico e frases com `[PREENCHER]` onde falta sua confirmação.

## 7. Evidências visuais

Em `assets/`, capturadas do site publicado em 15/11/2026: `home-desktop.png`, `home-mobile.png`, `redes-desktop.png`, `como-funciona-desktop.png`, `sobre-desktop.png`, `login-desktop.png`, `home-completa.jpeg`.

## 8. Limitações desta auditoria

- Catálogo, busca, lista e favoritos logados não foram vistos em produção.
- Nenhum número de economia, receita ou mercado foi criado; a banca não deve ouvir um.
- A execução dos testes não foi repetida nesta auditoria; os números de testes são de arquivos versionados e do CI.
