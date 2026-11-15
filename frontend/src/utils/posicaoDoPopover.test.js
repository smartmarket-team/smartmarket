import { posicaoDoPopover } from './posicaoDoPopover'

// O popover tem 200 x 104 px; a tela, 1000 x 800; margem de 8 px das bordas e folga de 4 px do botão.
const POPOVER = { largura: 200, altura: 104 }
const TELA = { largura: 1000, altura: 800 }
const botao = (esquerda, topo, largura = 60, altura = 20) => ({
  left: esquerda,
  top: topo,
  right: esquerda + largura,
  bottom: topo + altura,
})

describe('posicaoDoPopover', () => {
  describe('vertical', () => {
    it('cabendo embaixo, abre embaixo do botão, com 4 px de folga', () => {
      const posicao = posicaoDoPopover({ gatilho: botao(100, 200), tela: TELA, popover: POPOVER })

      expect(posicao.lado).toBe('abaixo')
      expect(posicao.top).toBe(224) // bottom do botão (220) + 4
    })

    it('sem espaço embaixo mas com espaço em cima, abre em cima do botão', () => {
      const posicao = posicaoDoPopover({ gatilho: botao(100, 700), tela: TELA, popover: POPOVER })

      expect(posicao.lado).toBe('acima')
      expect(posicao.top).toBe(592) // topo do botão (700) - 4 - altura do popover (104)
    })

    it('o último pixel que cabe embaixo ainda abre embaixo', () => {
      // O popover termina exatamente na margem de baixo: 800 - 8 = 792.
      const gatilho = botao(100, 792 - 104 - 4 - 20)
      const posicao = posicaoDoPopover({ gatilho, tela: TELA, popover: POPOVER })

      expect(posicao.lado).toBe('abaixo')
      expect(posicao.top + POPOVER.altura).toBe(792)
    })

    it('um pixel além, deixa de caber embaixo e vai para cima', () => {
      const gatilho = botao(100, 792 - 104 - 4 - 20 + 1)
      const posicao = posicaoDoPopover({ gatilho, tela: TELA, popover: POPOVER })

      expect(posicao.lado).toBe('acima')
    })

    it('sem espaço nem embaixo nem em cima, fica no lado com mais espaço e dentro das margens da tela', () => {
      const tela = { largura: 1000, altura: 200 }
      const posicao = posicaoDoPopover({ gatilho: botao(100, 90), tela, popover: POPOVER })

      expect(posicao.top).toBeGreaterThanOrEqual(8)
      expect(posicao.top + POPOVER.altura).toBeLessThanOrEqual(200 - 8)
    })

    it('com a tela mais baixa que o popover, fica colado na margem de cima (nunca com top negativo)', () => {
      const posicao = posicaoDoPopover({ gatilho: botao(100, 30), tela: { largura: 1000, altura: 90 }, popover: POPOVER })

      expect(posicao.top).toBe(8)
    })
  })

  describe('horizontal', () => {
    it('alinha a borda esquerda do popover com a do botão', () => {
      expect(posicaoDoPopover({ gatilho: botao(300, 200), tela: TELA, popover: POPOVER }).left).toBe(300)
    })

    it('perto da borda direita, é puxado para dentro (margem de 8 px)', () => {
      const posicao = posicaoDoPopover({ gatilho: botao(950, 200), tela: TELA, popover: POPOVER })

      expect(posicao.left).toBe(792) // 1000 - 8 - 200
      expect(posicao.left + posicao.largura).toBe(992)
    })

    it('perto da borda esquerda, é puxado para dentro', () => {
      expect(posicaoDoPopover({ gatilho: botao(-30, 200), tela: TELA, popover: POPOVER }).left).toBe(8)
    })

    it('em tela estreita (360 px), cabe inteiro entre as margens, qualquer que seja a posição do botão', () => {
      const tela = { largura: 360, altura: 800 }
      for (const esquerda of [0, 20, 150, 280, 340]) {
        const posicao = posicaoDoPopover({ gatilho: botao(esquerda, 200), tela, popover: POPOVER })

        expect(posicao.left).toBeGreaterThanOrEqual(8)
        expect(posicao.left + posicao.largura).toBeLessThanOrEqual(360 - 8)
      }
    })

    it('em tela mais estreita que o popover, encolhe a largura para caber (nunca passa da tela)', () => {
      const posicao = posicaoDoPopover({ gatilho: botao(10, 200), tela: { largura: 180, altura: 800 }, popover: POPOVER })

      expect(posicao.largura).toBe(164) // 180 - 2 * 8
      expect(posicao.left).toBe(8)
    })

    it('a largura é a do popover quando a tela comporta', () => {
      expect(posicaoDoPopover({ gatilho: botao(100, 200), tela: TELA, popover: POPOVER }).largura).toBe(200)
    })
  })

  it('não altera os objetos que recebeu', () => {
    const gatilho = botao(100, 200)
    const copia = { ...gatilho }

    posicaoDoPopover({ gatilho, tela: TELA, popover: POPOVER })

    expect(gatilho).toEqual(copia)
  })
})
