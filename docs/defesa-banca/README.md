# Defesa do SmartMarket: como usar

Apresentação interativa de 8 slides (cerca de 4 min 25 s) para a banca. É **um único arquivo HTML** com imagens locais: funciona sem internet e sem instalar nada.

| Arquivo | Para quê |
|---|---|
| [`index.html`](index.html) | A apresentação |
| [`01-auditoria-smartmarket.md`](01-auditoria-smartmarket.md) | Fonte de verdade: o que existe, o que é parcial, o que é proposto |
| [`02-roteiro-de-fala.md`](02-roteiro-de-fala.md) | O que dizer em cada slide, com tempos |
| [`03-perguntas-banca.md`](03-perguntas-banca.md) | Perguntas difíceis e respostas fundamentadas |
| [`SmartMarket-defesa.pdf`](SmartMarket-defesa.pdf) | Versão em PDF, 8 páginas, mesmo visual (sem demo ao vivo) |
| [`SmartMarket-defesa.pptx`](SmartMarket-defesa.pptx) | Versão para PowerPoint, com o roteiro nas notas do apresentador |
| [`assets/`](assets/) | Capturas reais do site publicado (plano B offline) |

## Como iniciar

1. Abra a pasta `docs/defesa-banca/`.
2. Dê dois cliques em **`index.html`** (abre no navegador padrão; use Chrome ou Edge).
3. Aperte **F** para tela cheia.

Não há servidor, `npm` nem dependência. Se preferir um endereço local, na raiz do projeto: `python -m http.server 8000 --directory docs/defesa-banca` e abra `http://localhost:8000`.

## Atalhos

| Tecla | Ação |
|---|---|
| `→`, `Espaço`, `PageDown` | Próximo slide |
| `←`, `PageUp` | Slide anterior |
| `Home` / `End` | Primeiro / último slide |
| `1` a `8` | Ir direto ao slide |
| `Esc` | Visão geral (e fecha a demo ou a visão geral) |
| `D` | Abrir a demo ao vivo |
| `C` | Abrir as capturas (sem internet) |
| `F` | Tela cheia |

No celular: deslize para os lados (use o aparelho na horizontal). Os controles aparecem ao mover o mouse.

## Demonstração (slide 4)

- **`D`**: abre o site publicado dentro da apresentação (iframe). Foi testado: o site carrega e é interativo. Para voltar, `Esc`: o slide continua onde estava.
- **Abrir em nova aba**: o botão do slide e do cabeçalho da demo.
- **`C`**: capturas reais do site. Use se a internet cair. Sem conexão, a demo já abre direto nas capturas.
- O catálogo e a busca pedem conta. **Faça o login antes da defesa** e deixe a aba pronta; a auditoria não entrou logada em produção.
- O servidor do projeto roda em plano gratuito e pode demorar de 1 a 3 minutos na primeira chamada. Abra o site 5 minutos antes.

## Plano B (sem internet)

Tudo da apresentação é local, **exceto o iframe da demo ao vivo**. Sem internet: a apresentação abre normalmente, a tecla `D` cai nas capturas, e o roteiro do slide 4 continua valendo ("estou usando capturas do site no ar").

## Antes de apresentar

- [ ] Abrir `index.html` e percorrer os 8 slides.
- [ ] Testar `D` e `C`, e o login na conta de demonstração.
- [ ] Preencher os `[PREENCHER]` do roteiro e do banco de perguntas.
- [ ] Decidir como falar do uso de IA (ver seção 6 da auditoria).
- [ ] Ensaiar com cronômetro: a meta é 4 min 25 s.

## Como a apresentação foi validada

Validada em Chrome, em 1920×1080: navegação por teclado, visão geral, demo ao vivo em iframe, ausência de erros no console, de imagens quebradas e de recursos externos. Em celular na vertical, aparece um aviso para girar o aparelho. **Não foi testada em Firefox nem Safari, nem sem internet de fato** (a conexão não foi cortada; o caminho offline foi conferido no código).

## Se a identidade visual ou os números mudarem

Os números do site (4 redes, 9.277 anúncios, 191 produtos em 2 ou mais redes) são de 15/11/2026. Se o catálogo mudar, atualize o slide 6 e o roteiro, e refaça as capturas de `assets/`.

## Versões em PDF e PowerPoint

- **PDF:** abra `SmartMarket-defesa.pdf`. É a apresentação impressa, um slide por página, e serve de reserva se o navegador falhar.
- **PowerPoint:** abra `SmartMarket-defesa.pptx`. Cada slide é uma **imagem** de alta resolução, então o visual é idêntico, mas **o texto não é editável**. As **notas do apresentador** já trazem a fala de cada slide (modo apresentador: `Alt+F5`). Não há demo ao vivo nem visão geral: para a demo, use o `index.html` ou o botão da aba do site.
- **Se editar o texto do `index.html`**, gere os dois de novo: o PDF vem da impressão do próprio `index.html` pelo Chrome (`--print-to-pdf`), e o PowerPoint é montado a partir das páginas do PDF.
- Quer um PowerPoint **com texto editável**? É possível, mas exige refazer cada slide no PowerPoint e perde parte do acabamento visual (animações e o diagrama em SVG).
