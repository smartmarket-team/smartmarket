const limitar = (valor, minimo, maximo) => Math.max(minimo, Math.min(valor, maximo))

/**
 * Onde um popover de posição fixa fica em relação ao botão que o abriu, sempre dentro da tela.
 *
 * - `gatilho`: o retângulo do botão ({ left, top, right, bottom }, como getBoundingClientRect).
 * - `tela`: { largura, altura } da janela. `popover`: { largura, altura } desejadas.
 * - Vertical: abre embaixo (folga de 4 px); se não couber, em cima; se não couber em nenhum, no lado com
 *   mais espaço, puxado para dentro das margens (nunca com `top` negativo).
 * - Horizontal: alinha a borda esquerda com a do botão e puxa para dentro das margens de 8 px; em tela
 *   mais estreita que o popover, a largura encolhe para caber.
 * Devolve { top, left, largura, lado: "abaixo" | "acima" }.
 */
export function posicaoDoPopover({ gatilho, tela, popover, margem = 8, folga = 4 }) {
  const largura = Math.max(0, Math.min(popover.largura, tela.largura - 2 * margem))
  const left = limitar(gatilho.left, margem, Math.max(margem, tela.largura - margem - largura))

  const cabeAbaixo = gatilho.bottom + folga + popover.altura <= tela.altura - margem
  const cabeAcima = gatilho.top - folga - popover.altura >= margem

  let lado
  let top
  if (cabeAbaixo) {
    lado = "abaixo"
    top = gatilho.bottom + folga
  } else if (cabeAcima) {
    lado = "acima"
    top = gatilho.top - folga - popover.altura
  } else {
    // Nenhum lado comporta o popover inteiro: fica onde há mais espaço e é puxado para dentro da tela.
    lado = tela.altura - gatilho.bottom >= gatilho.top ? "abaixo" : "acima"
    top = lado === "abaixo" ? gatilho.bottom + folga : gatilho.top - folga - popover.altura
    top = limitar(top, margem, Math.max(margem, tela.altura - margem - popover.altura))
  }

  return { top, left, largura, lado }
}
