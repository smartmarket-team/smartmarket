import { CARDS_INICIAIS, CARDS_MAXIMOS, LOTE, MARGEM_PX, proximoLimite } from './carrosselProgressivo'

const base = { limite: CARDS_INICIAIS, total: 100, scrollLeft: 0, scrollWidth: 4000, clientWidth: 1000 }

describe('proximoLimite', () => {
  it('no começo da prateleira, com muito conteúdo à frente, mantém o limite', () => {
    expect(proximoLimite(base)).toBe(CARDS_INICIAIS)
  })

  it('perto do fim libera mais um lote', () => {
    const r = proximoLimite({ ...base, scrollLeft: 4000 - 1000 - MARGEM_PX + 1 })
    expect(r).toBe(CARDS_INICIAIS + LOTE)
  })

  it('a prateleira curta (cabe na tela) libera o próximo lote logo de cara', () => {
    expect(proximoLimite({ ...base, scrollWidth: 900, clientWidth: 1000 })).toBe(CARDS_INICIAIS + LOTE)
  })

  it('nunca passa do teto de 24 nem do total de produtos', () => {
    const perto = { ...base, scrollLeft: 4000 }
    expect(proximoLimite({ ...perto, limite: 20 })).toBe(CARDS_MAXIMOS)
    expect(proximoLimite({ ...perto, limite: CARDS_MAXIMOS })).toBe(CARDS_MAXIMOS)
    expect(proximoLimite({ ...perto, limite: 8, total: 11 })).toBe(11)
    expect(proximoLimite({ ...perto, limite: 11, total: 11 })).toBe(11)
  })

  it('sem layout medido (clientWidth 0) mostra tudo até o teto, como antes da mudança', () => {
    expect(proximoLimite({ ...base, scrollWidth: 0, clientWidth: 0 })).toBe(CARDS_MAXIMOS)
    expect(proximoLimite({ ...base, total: 11, scrollWidth: 0, clientWidth: 0 })).toBe(11)
  })
})
