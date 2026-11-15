# Roteiro de fala

Duração total: **4 min 25 s** (dentro dos 3 a 5 minutos). Fale devagar: é melhor sobrar 20 segundos do que cortar a conclusão.

Onde aparecer `[PREENCHER]`, a informação depende de você. O roteiro não inventa a sua contribuição. Ver a seção 6 da [auditoria](01-auditoria-smartmarket.md).

| Slide | Tempo | Acumulado |
|---|---:|---:|
| 1. Abertura | 15 s | 0:15 |
| 2. O problema | 30 s | 0:45 |
| 3. A solução | 35 s | 1:20 |
| 4. Demonstração | 60 s | 2:20 |
| 5. Engenharia | 50 s | 3:10 |
| 6. Negócio | 35 s | 3:45 |
| 7. Aprendizados | 25 s | 4:10 |
| 8. Encerramento | 15 s | 4:25 |

---

## Slide 1 · Abertura (15 s)

**Objetivo:** abrir com calma, dizer o que é e quem apresenta.

> "Boa tarde. Eu sou o Davi, do Grupo 40. Vou mostrar o SmartMarket: um site que ajuda a descobrir em qual mercado do Rio Grande do Sul a sua compra custa menos."

- **Apontar:** o nome e a frase na tela.
- **Transição:** "E por que isso é um problema?"
- **A banca deve lembrar:** é um comparador de preços de supermercados do RS.

## Slide 2 · O problema (30 s)

**Objetivo:** fazer a banca reconhecer a dor, sem número inventado.

> "Quem já tentou comparar uma lista inteira sabe como é: cada supermercado tem o seu site, o seu catálogo, o seu jeito de mostrar preço. Para saber onde a compra toda sai mais barata, a pessoa abre um por um e soma na mão. E isso é só para um produto. A lista de compras tem vários."

- **Apontar:** as quatro abas com "R$ ?".
- **Transição:** "A ideia do SmartMarket é tirar esse trabalho da pessoa."
- **A banca deve lembrar:** o problema é o custo da compra inteira, não de um item.

## Slide 3 · A solução (35 s)

**Objetivo:** mostrar o fluxo e o que existe de verdade.

> "A pessoa monta a lista, o sistema cruza os preços do catálogo e mostra em qual rede a cesta fecha menor. Além do preço, mostra a loja de referência mais perto, a partir do CEP, e o botão Navegar abre o Google Maps ou o Waze com o destino pronto. Esta captura é do site no ar. O cupom é um exemplo ilustrativo, e o próprio site avisa isso."

- **Apontar:** os três passos na captura e o rótulo "Exemplo ilustrativo".
- **Transição:** "Melhor do que contar é mostrar."
- **A banca deve lembrar:** compara a cesta inteira e diz qual loja fica mais perto.

## Slide 4 · Demonstração (60 s)

**Objetivo:** provar que funciona.

> "Este é o site publicado, rodando agora." *(tecla D)* "Na página inicial já aparecem os números reais do catálogo: quatro redes e 9.277 anúncios com preço coletado. Desses, 191 produtos aparecem em duas ou mais redes, e é nesses que a comparação é possível. A busca e o catálogo pedem conta, então eu entro com a minha." *(faça login, busque um produto, mostre o preço em cada rede, a loja mais perto e o botão Navegar)*

- **Plano B:** se a internet cair, tecla **C** e conte a mesma história com as capturas. Diga: "Estou usando capturas do site no ar".
- **Antes de apresentar:** teste o login e deixe a conta pronta. A auditoria não entrou logada no site.
- **Transição:** "Por trás disso tem uma cadeia de dados que eu quero mostrar."
- **A banca deve lembrar:** funciona em produção e tem dados reais, com limites assumidos.

## Slide 5 · Bastidores de engenharia (50 s)

**Objetivo:** mostrar rigor sem virar aula de código.

> "O preço sai do site da rede, passa por robôs de coleta, por uma etapa de arrumação e vai para um banco com histórico. O servidor entrega esses dados e o site mostra. Quatro decisões me orgulham. Primeira: registro inválido vai para uma quarentena em vez de derrubar a carga, e o lote só falha se mais de 20% for rejeitado. Segunda: o próprio banco recusa dois preços valendo ao mesmo tempo para a mesma loja. Terceira: o papel de administrador é conferido no banco a cada pedido, não no token. E quarta: o código tem testes no site, no servidor e na coleta, com mínimo de 70% de cobertura. Uma ressalva: a validação de preço é estrutural. Um preço absurdo, mas positivo, ainda passaria. Detecção de outlier é o próximo passo, e está marcada no diagrama como 'ainda não'."

- **Apontar:** as caixas na ordem, o tracejado laranja "Ainda não: outliers".
- **Transição:** "Isso mostra onde estamos. Falta mostrar para onde o projeto pode ir."
- **A banca deve lembrar:** decisões com motivo, e honestidade sobre o que falta.

## Slide 6 · Negócio e escala (35 s)

**Objetivo:** visão comercial separando o que existe do que seria futuro.

> "Hoje existe um catálogo com 9.277 anúncios, comparação entre redes e loja mais perto pelo CEP. O próximo passo é de engenharia: validação de preço fora da curva, alertas que realmente avisem e mais redes, com autorização. A visão é maior: inteligência de preços para varejistas e um plano para empresas. Isso exigiria cobrança, contas por cliente, validação comercial e acordos com as redes. Não existe hoje, e eu prefiro dizer isso do que prometer."

- **Apontar:** as três colunas e as etiquetas IMPLEMENTADO, PRÓXIMO PASSO e VISÃO.
- **Transição:** "Para chegar até aqui, a equipe aprendeu algumas coisas."
- **A banca deve lembrar:** há caminho comercial, e a fronteira entre real e futuro é clara.

## Slide 7 · Aprendizados (25 s)

**Objetivo:** maturidade e protagonismo, só com fatos.

> "A principal lição foi respeitar os limites. Quando o Cloudflare barrou o robô e dois sites proibiram a coleta, suspendemos as quatro redes em vez de contornar. Também tratamos servidor dormindo, CEP impreciso e preços simulados no catálogo. Foram 795 commits e 173 pull requests, com seis pessoas. Nas últimas semanas eu entreguei o botão Navegar, a auditoria do frontend e o guia com o mapa do projeto. `[PREENCHER: a sua parte principal no projeto, em uma frase]`. Usamos IA como apoio, mas cada mudança passa por pull request e eu respondo pelo que entrou."

- **Apontar:** a linha do tempo e os três números.
- **Transição:** "Para fechar."
- **A banca deve lembrar:** a equipe decide com critério e assume limites.

## Slide 8 · Encerramento (15 s)

> "O SmartMarket não promete economia: mostra onde ela está. É um problema real, um MVP no ar e um caminho honesto para crescer. Fico à disposição para as perguntas."

- **A banca deve lembrar:** a frase "mostra onde ela está".

---

## Dicas de entrega

- Não leia o slide. A tela tem pouco texto de propósito.
- Se perder tempo, corte do slide 5 as terceira e quarta decisões, mas **mantenha a ressalva dos outliers**: ela dá credibilidade.
- Se a banca interromper, volte pelo número do slide (teclas 1 a 8).
