import { render } from '@testing-library/react'
import { useTituloDaPagina } from './useTituloDaPagina'

function Pagina({ titulo }) {
  useTituloDaPagina(titulo)
  return null
}

describe('useTituloDaPagina', () => {
  beforeEach(() => {
    document.title = 'SmartMarket · Comparador Inteligente de Supermercados'
  })

  it('define o título com o nome do site', () => {
    render(<Pagina titulo="Catálogo" />)
    expect(document.title).toBe('Catálogo · SmartMarket')
  })

  it('devolve o título anterior ao sair da página', () => {
    const { unmount } = render(<Pagina titulo="Catálogo" />)
    unmount()
    expect(document.title).toBe('SmartMarket · Comparador Inteligente de Supermercados')
  })

  it('acompanha a troca de título', () => {
    const { rerender } = render(<Pagina titulo="Favoritos" />)
    rerender(<Pagina titulo="Minha Lista" />)
    expect(document.title).toBe('Minha Lista · SmartMarket')
  })

  it('sem título, não mexe no que já está', () => {
    render(<Pagina titulo="" />)
    expect(document.title).toBe('SmartMarket · Comparador Inteligente de Supermercados')
  })
})
