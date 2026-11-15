/**
 * Carrossel de categoria do catálogo: em vez de montar os 24 cards (e suas fotos) de cada uma das
 * ~13 categorias de uma vez (cerca de 325 imagens no DOM), começa com poucos e libera mais um lote
 * quando o usuário chega perto do fim da prateleira, até o teto que já existia (24).
 */
export const CARDS_INICIAIS = 8
export const CARDS_MAXIMOS = 24
export const LOTE = 8
/** Quanto falta de rolagem (px) para começar a montar o próximo lote, antes de o fim aparecer. */
export const MARGEM_PX = 600

/** Quantos cards o carrossel deve mostrar agora, dado onde a rolagem está. */
export function proximoLimite({ limite, total, scrollLeft, scrollWidth, clientWidth }) {
  const teto = Math.min(CARDS_MAXIMOS, total)
  if (limite >= teto) return limite
  // Sem layout (prateleira oculta, jsdom) não dá para saber onde está o fim: volta ao comportamento
  // anterior e mostra tudo até o teto, em vez de esconder cards que o usuário não teria como alcançar.
  if (!(clientWidth > 0)) return teto
  const pertoDoFim = scrollLeft + clientWidth >= scrollWidth - MARGEM_PX
  return pertoDoFim ? Math.min(teto, limite + LOTE) : limite
}
