import { fireEvent, render, screen } from '@testing-library/react'
import BotaoNavegar from './BotaoNavegar'

const LAT = -30.03
const LON = -51.22
const GOOGLE = 'https://www.google.com/maps/dir/?api=1&destination=-30.03,-51.22'
const WAZE = 'https://waze.com/ul?ll=-30.03,-51.22&navigate=yes'

const renderizar = (props = {}) =>
  render(<BotaoNavegar latitude={LAT} longitude={LON} nomeLoja="Carrefour Centro" {...props} />)

const gatilho = () => screen.getByRole('button', { name: 'Navegar até Carrefour Centro' })
const abrir = () => fireEvent.click(gatilho())

describe('BotaoNavegar', () => {
  describe('sem coordenada, sem botão', () => {
    it.each([
      ['sem coordenadas', { latitude: undefined, longitude: undefined }],
      ['nulas', { latitude: null, longitude: null }],
      ['só a latitude', { latitude: LAT, longitude: null }],
      ['só a longitude', { latitude: null, longitude: LON }],
      ['NaN', { latitude: NaN, longitude: LON }],
      ['infinitas', { latitude: Infinity, longitude: LON }],
      ['em texto', { latitude: '-30.03', longitude: '-51.22' }],
    ])('%s: não renderiza nada', (_caso, props) => {
      const { container } = renderizar(props)

      expect(container).toBeEmptyDOMElement()
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })

  describe('fechado', () => {
    it('mostra um botão "Navegar" com nome acessível "Navegar até {loja}" (contém o texto visível)', () => {
      renderizar()

      const botao = gatilho()
      expect(botao).toHaveTextContent('Navegar')
      expect(botao).toHaveAttribute('type', 'button')
      expect(botao).toHaveAttribute('aria-expanded', 'false')
      expect(botao).not.toHaveAttribute('aria-controls')
    })

    it('o chevron é decorativo (aria-hidden)', () => {
      renderizar()

      expect(gatilho().querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    })

    it('sem nome da loja o nome acessível é só "Navegar"', () => {
      renderizar({ nomeLoja: undefined })

      expect(screen.getByRole('button', { name: 'Navegar' })).toBeInTheDocument()
    })

    it('não há grupo nem links no DOM enquanto está fechado', () => {
      renderizar()

      expect(screen.queryByRole('group')).not.toBeInTheDocument()
      expect(screen.queryByRole('link')).not.toBeInTheDocument()
    })

    it('a versão compacta usa texto menor que a completa', () => {
      const { rerender } = renderizar({ compacto: true })
      const compacto = gatilho().className
      rerender(<BotaoNavegar latitude={LAT} longitude={LON} nomeLoja="Carrefour Centro" />)

      expect(compacto).toMatch(/text-\[10px\]/)
      expect(gatilho().className).toMatch(/text-\[11px\]/)
    })
  })

  describe('aberto', () => {
    it('o clique abre: aria-expanded e aria-controls apontam para o grupo, que tem nome', () => {
      renderizar()

      abrir()

      const grupo = screen.getByRole('group', { name: 'Navegar até Carrefour Centro' })
      expect(gatilho()).toHaveAttribute('aria-expanded', 'true')
      expect(gatilho()).toHaveAttribute('aria-controls', grupo.id)
      expect(grupo.id).not.toBe('')
    })

    it('oferece "Google Maps" e depois "Waze", nessa ordem', () => {
      renderizar()

      abrir()

      const links = screen.getAllByRole('link')
      expect(links.map((link) => link.textContent)).toEqual(['Google Maps', 'Waze'])
    })

    it('os links levam só a coordenada da loja (valores literais)', () => {
      renderizar()

      abrir()

      expect(screen.getByRole('link', { name: /Google Maps/ })).toHaveAttribute('href', GOOGLE)
      expect(screen.getByRole('link', { name: /Waze/ })).toHaveAttribute('href', WAZE)
    })

    it.each(['Google Maps', 'Waze'])('o link "%s" abre em outra aba, sem referrer e com noopener', (nome) => {
      renderizar()

      abrir()

      const link = screen.getByRole('link', { name: new RegExp(nome) })
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      expect(link).toHaveAttribute('referrerpolicy', 'no-referrer')
    })

    it('os nomes acessíveis dizem a loja e que abre em outra aba, e contêm o texto visível', () => {
      renderizar()

      abrir()

      const google = screen.getByRole('link', { name: 'Abrir Carrefour Centro no Google Maps (abre em outra aba)' })
      const waze = screen.getByRole('link', { name: 'Abrir Carrefour Centro no Waze (abre em outra aba)' })
      expect(google).toHaveTextContent('Google Maps')
      expect(waze).toHaveTextContent('Waze')
    })

    it('cada link tem altura mínima de 44 px (alvo de toque)', () => {
      renderizar()

      abrir()

      for (const link of screen.getAllByRole('link')) expect(link.className).toMatch(/min-h-11/)
    })

    it('o popover fica no document.body (portal), fora do cartão, para o overflow do cartão não cortá-lo', () => {
      const { container } = renderizar()

      abrir()

      const grupo = screen.getByRole('group')
      expect(container.contains(grupo)).toBe(false)
      expect(grupo.parentElement).toBe(document.body)
      expect(grupo.style.position).toBe('fixed')
    })

    it('ao abrir, o foco vai para o primeiro link, com preventScroll (não rola a página)', () => {
      const foco = jest.spyOn(HTMLElement.prototype, 'focus')
      renderizar()

      abrir()

      const primeiro = screen.getAllByRole('link')[0]
      expect(primeiro).toHaveFocus()
      expect(foco).toHaveBeenCalledWith({ preventScroll: true })
      foco.mockRestore()
    })

    it('um segundo clique no botão fecha o popover', () => {
      renderizar()
      abrir()

      fireEvent.click(gatilho())

      expect(screen.queryByRole('group')).not.toBeInTheDocument()
      expect(gatilho()).toHaveAttribute('aria-expanded', 'false')
    })

    it('desmontar o botão com o popover aberto remove o popover do body', () => {
      const { unmount } = renderizar()
      abrir()

      unmount()

      expect(screen.queryByRole('group')).not.toBeInTheDocument()
      expect(document.body.querySelector('[role="group"]')).toBeNull()
    })
  })
})
