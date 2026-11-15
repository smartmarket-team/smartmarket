import { fireEvent, render, screen, within } from '@testing-library/react'
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

  describe('fechar', () => {
    it('Esc fecha o popover e devolve o foco ao botão', () => {
      renderizar()
      abrir()

      fireEvent.keyDown(document.activeElement, { key: 'Escape' })

      expect(screen.queryByRole('group')).not.toBeInTheDocument()
      expect(gatilho()).toHaveFocus()
      expect(gatilho()).toHaveAttribute('aria-expanded', 'false')
    })

    it('Esc também fecha com o foco fora do popover', () => {
      renderizar()
      abrir()
      gatilho().focus()

      fireEvent.keyDown(document.body, { key: 'Escape' })

      expect(screen.queryByRole('group')).not.toBeInTheDocument()
    })

    it('Esc com o popover fechado não faz nada', () => {
      renderizar()

      fireEvent.keyDown(document.body, { key: 'Escape' })

      expect(gatilho()).toHaveAttribute('aria-expanded', 'false')
    })

    it.each(['Google Maps', 'Waze'])('escolher "%s" fecha o popover e devolve o foco ao botão', (nome) => {
      renderizar()
      abrir()

      fireEvent.click(screen.getByRole('link', { name: new RegExp(nome) }))

      expect(screen.queryByRole('group')).not.toBeInTheDocument()
      expect(gatilho()).toHaveFocus()
    })

    it('tocar fora fecha e NÃO rouba o foco de onde o usuário tocou', () => {
      render(
        <>
          <BotaoNavegar latitude={LAT} longitude={LON} nomeLoja="Carrefour Centro" />
          <button>Outro controle</button>
        </>,
      )
      abrir()
      const outro = screen.getByRole('button', { name: 'Outro controle' })
      outro.focus()

      fireEvent.pointerDown(outro)

      expect(screen.queryByRole('group')).not.toBeInTheDocument()
      expect(outro).toHaveFocus()
    })

    it('tocar dentro do popover não fecha', () => {
      renderizar()
      abrir()

      fireEvent.pointerDown(screen.getByRole('group'))
      fireEvent.pointerDown(screen.getAllByRole('link')[1])

      expect(screen.getByRole('group')).toBeInTheDocument()
    })

    it('tocar no próprio botão não fecha antes do clique (quem alterna é o clique)', () => {
      renderizar()
      abrir()

      fireEvent.pointerDown(gatilho())

      expect(screen.getByRole('group')).toBeInTheDocument()
    })

    it('rolar a página fecha o popover', () => {
      renderizar()
      abrir()

      fireEvent.scroll(window)

      expect(screen.queryByRole('group')).not.toBeInTheDocument()
    })

    it('rolar o trilho horizontal da prateleira também fecha (o evento de scroll não sobe pela página)', () => {
      render(
        <div data-testid="trilho" style={{ overflowX: 'auto' }}>
          <BotaoNavegar latitude={LAT} longitude={LON} nomeLoja="Carrefour Centro" />
        </div>,
      )
      abrir()

      fireEvent.scroll(screen.getByTestId('trilho'))

      expect(screen.queryByRole('group')).not.toBeInTheDocument()
    })

    it('rolar qualquer outro contêiner da página fecha', () => {
      renderizar()
      abrir()
      const lista = document.createElement('div')
      document.body.appendChild(lista)

      fireEvent.scroll(lista)

      expect(screen.queryByRole('group')).not.toBeInTheDocument()
      lista.remove()
    })

    it('redimensionar a janela fecha o popover', () => {
      renderizar()
      abrir()

      fireEvent(window, new Event('resize'))

      expect(screen.queryByRole('group')).not.toBeInTheDocument()
    })

    it('depois de fechado, rolar e redimensionar não deixam ouvintes pendurados (reabrir funciona)', () => {
      renderizar()
      abrir()
      fireEvent.scroll(window)

      abrir()

      expect(screen.getByRole('group')).toBeInTheDocument()
    })

    it('o popover não fecha a si mesmo ao abrir: focar o primeiro link NÃO rola a página (preventScroll)', async () => {
      // O navegador rola até o elemento focado (e dispara "scroll" no quadro seguinte) a menos que o foco
      // peça preventScroll. Aqui o foco simulado rola quando não pede.
      const original = HTMLElement.prototype.focus
      const foco = jest.spyOn(HTMLElement.prototype, 'focus').mockImplementation(function (opcoes) {
        original.call(this, opcoes)
        if (!opcoes?.preventScroll) setTimeout(() => window.dispatchEvent(new Event('scroll')), 0)
      })
      renderizar()

      abrir()
      await new Promise((resolve) => setTimeout(resolve, 20))

      expect(screen.getByRole('group')).toBeInTheDocument()
      foco.mockRestore()
    })

    it('abrir um segundo botão fecha o primeiro (só um popover aberto por vez)', () => {
      render(
        <>
          <BotaoNavegar latitude={LAT} longitude={LON} nomeLoja="Carrefour Centro" />
          <BotaoNavegar latitude={-29.95} longitude={-51.09} nomeLoja="Fort Cachoeirinha" />
        </>,
      )

      fireEvent.click(screen.getByRole('button', { name: 'Navegar até Carrefour Centro' }))
      fireEvent.click(screen.getByRole('button', { name: 'Navegar até Fort Cachoeirinha' }))

      expect(screen.getAllByRole('group')).toHaveLength(1)
      expect(screen.getByRole('group', { name: 'Navegar até Fort Cachoeirinha' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Navegar até Carrefour Centro' })).toHaveAttribute('aria-expanded', 'false')
    })
  })

  describe('o clique não abre o detalhe do cartão', () => {
    const noCartao = () => {
      const aoClicarNoCartao = jest.fn()
      render(
        <div onClick={aoClicarNoCartao}>
          <BotaoNavegar latitude={LAT} longitude={LON} nomeLoja="Carrefour Centro" />
        </div>,
      )
      return aoClicarNoCartao
    }

    it('clicar no botão não dispara o clique do cartão', () => {
      const aoClicarNoCartao = noCartao()

      abrir()

      expect(aoClicarNoCartao).not.toHaveBeenCalled()
    })

    it('clicar no popover (portal) não sobe ao cartão pela árvore do React', () => {
      const aoClicarNoCartao = noCartao()
      abrir()

      fireEvent.click(screen.getByRole('group'))

      expect(aoClicarNoCartao).not.toHaveBeenCalled()
    })

    it.each(['Google Maps', 'Waze'])('clicar em "%s" não sobe ao cartão', (nome) => {
      const aoClicarNoCartao = noCartao()
      abrir()

      fireEvent.click(screen.getByRole('link', { name: new RegExp(nome) }))

      expect(aoClicarNoCartao).not.toHaveBeenCalled()
    })
  })

  describe('não lembra a escolha (nada em storage)', () => {
    it('escolher um destino não grava nada no navegador', () => {
      const gravar = jest.spyOn(Storage.prototype, 'setItem')
      localStorage.clear()
      sessionStorage.clear()
      renderizar()
      abrir()

      fireEvent.click(screen.getByRole('link', { name: /Waze/ }))

      expect(gravar).not.toHaveBeenCalled()
      expect(localStorage).toHaveLength(0)
      expect(sessionStorage).toHaveLength(0)
      gravar.mockRestore()
    })

    it('reabrir depois de escolher o Waze começa de novo: Google Maps primeiro e com o foco', () => {
      renderizar()
      abrir()
      fireEvent.click(screen.getByRole('link', { name: /Waze/ }))

      abrir()

      const links = screen.getAllByRole('link')
      expect(links.map((link) => link.textContent)).toEqual(['Google Maps', 'Waze'])
      expect(links[0]).toHaveFocus()
    })
  })

  describe('teclado: Tab e Shift+Tab (o popover fica no fim do body, fora da ordem natural)', () => {
    // Botão, dois controles que vêm DEPOIS dele no documento e um escondido entre eles.
    const comVizinhos = () =>
      render(
        <div>
          <button>Antes</button>
          <BotaoNavegar latitude={LAT} longitude={LON} nomeLoja="Carrefour Centro" />
          <button hidden>Escondido</button>
          <button disabled>Desabilitado</button>
          <button tabIndex={-1}>Fora da ordem do Tab</button>
          <button>Depois</button>
          <a href="#fim">Último</a>
        </div>,
      )

    // Só os links do popover (a página dos vizinhos também tem um link).
    const linksDoPopover = () => within(screen.getByRole('group')).getAllByRole('link')

    it('Shift+Tab a partir do PRIMEIRO link devolve o foco ao botão e fecha o popover', () => {
      comVizinhos()
      abrir()
      const [primeiro] = linksDoPopover()
      expect(primeiro).toHaveFocus()

      const seguiuONavegador = fireEvent.keyDown(primeiro, { key: 'Tab', shiftKey: true })

      expect(seguiuONavegador).toBe(false) // preventDefault: o foco é movido por nós
      expect(screen.queryByRole('group')).not.toBeInTheDocument()
      expect(gatilho()).toHaveFocus()
    })

    it('Tab a partir do ÚLTIMO link fecha e leva o foco ao próximo focável DEPOIS do botão', () => {
      comVizinhos()
      abrir()
      const links = linksDoPopover()
      links[1].focus()

      const seguiuONavegador = fireEvent.keyDown(links[1], { key: 'Tab' })

      expect(seguiuONavegador).toBe(false)
      expect(screen.queryByRole('group')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Depois' })).toHaveFocus()
    })

    it('o próximo focável ignora o escondido, o desabilitado e o tabindex -1, e nunca é "Antes"', () => {
      comVizinhos()
      abrir()
      const links = linksDoPopover()
      links[1].focus()

      fireEvent.keyDown(links[1], { key: 'Tab' })

      expect(document.activeElement).toHaveTextContent('Depois')
      expect(document.activeElement).not.toHaveTextContent('Antes')
    })

    it('sem nenhum focável depois do botão, o foco volta ao botão (não se perde no body)', () => {
      render(<BotaoNavegar latitude={LAT} longitude={LON} nomeLoja="Carrefour Centro" />)
      abrir()
      const links = linksDoPopover()
      links[1].focus()

      fireEvent.keyDown(links[1], { key: 'Tab' })

      expect(screen.queryByRole('group')).not.toBeInTheDocument()
      expect(gatilho()).toHaveFocus()
    })

    it('Tab do primeiro para o segundo link segue a ordem natural: não fecha nem interfere', () => {
      comVizinhos()
      abrir()
      const [primeiro] = linksDoPopover()

      const seguiuONavegador = fireEvent.keyDown(primeiro, { key: 'Tab' })

      expect(seguiuONavegador).toBe(true)
      expect(screen.getByRole('group')).toBeInTheDocument()
    })

    it('Shift+Tab do segundo para o primeiro link também segue a ordem natural', () => {
      comVizinhos()
      abrir()
      const links = linksDoPopover()
      links[1].focus()

      const seguiuONavegador = fireEvent.keyDown(links[1], { key: 'Tab', shiftKey: true })

      expect(seguiuONavegador).toBe(true)
      expect(screen.getByRole('group')).toBeInTheDocument()
    })

    it('outras teclas nos links não fecham nem são interceptadas', () => {
      comVizinhos()
      abrir()
      const [primeiro] = linksDoPopover()

      const seguiuONavegador = fireEvent.keyDown(primeiro, { key: 'ArrowDown' })

      expect(seguiuONavegador).toBe(true)
      expect(screen.getByRole('group')).toBeInTheDocument()
    })

    it('o foco movido por Tab e Shift+Tab usa preventScroll (não rola a página)', () => {
      comVizinhos()
      abrir()
      const links = linksDoPopover()
      links[1].focus()
      const foco = jest.spyOn(HTMLElement.prototype, 'focus')

      fireEvent.keyDown(links[1], { key: 'Tab' })

      expect(foco).toHaveBeenCalledWith({ preventScroll: true })
      foco.mockRestore()
    })
  })
})
