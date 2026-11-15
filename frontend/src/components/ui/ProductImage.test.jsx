import { fireEvent, render, screen } from '@testing-library/react'
import { ProductImage } from './ProductImage'

jest.mock('../../utils/urlAssets', () => ({ urlAsset: jest.fn((c) => c) }))
jest.mock('../../utils/urlPublica', () => ({ urlPublica: jest.fn((c) => c) }))

const { urlAsset } = require('../../utils/urlAssets')
const { urlPublica } = require('../../utils/urlPublica')

const comBucket = (c) => (typeof c === 'string' && c.startsWith('/images/produtos/') ? `https://bucket.exemplo/assets${c}` : c)
const comBase = (c) => (typeof c === 'string' && c.startsWith('/') ? `/smartmarket${c}` : c)

describe('ProductImage', () => {
  it('mostra o fallback quando a imagem falha ao carregar', () => {
    render(<ProductImage src="/images/quebrada.webp" alt="Cafe" fallbackIcon="📦" />)

    fireEvent.error(screen.getByRole('img', { name: 'Cafe' }))

    expect(screen.queryByRole('img', { name: 'Cafe' })).not.toBeInTheDocument()
    expect(screen.getByText('📦')).toBeInTheDocument()
  })

  it('volta a tentar a imagem quando o src muda depois de uma falha', () => {
    const { rerender } = render(
      <ProductImage src="/images/quebrada.webp" alt="Cafe" fallbackIcon="📦" />
    )
    fireEvent.error(screen.getByRole('img', { name: 'Cafe' }))
    expect(screen.queryByRole('img', { name: 'Cafe' })).not.toBeInTheDocument()

    rerender(<ProductImage src="/images/boa.webp" alt="Cafe" fallbackIcon="📦" />)

    const imagem = screen.getByRole('img', { name: 'Cafe' })
    expect(imagem).toHaveAttribute('src', '/images/boa.webp')
    expect(screen.queryByText('📦')).not.toBeInTheDocument()
  })

  it('mostra o indicador de carregamento de novo quando o src muda depois de carregada', () => {
    const { container, rerender } = render(<ProductImage src="/images/a.webp" alt="A" />)
    fireEvent.load(screen.getByRole('img', { name: 'A' }))
    expect(container.querySelector('.animate-pulse')).toBeNull()

    rerender(<ProductImage src="/images/b.webp" alt="A" />)

    expect(container.querySelector('.animate-pulse')).not.toBeNull()
    expect(screen.getByRole('img', { name: 'A' })).toHaveClass('opacity-0')
  })

  it('usa o fallback quando nao ha src valido', () => {
    render(<ProductImage src="produto.png" alt="Sem foto" fallbackIcon="🛒" />)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('🛒')).toBeInTheDocument()
  })

  describe('resolução do src', () => {
    beforeEach(() => {
      urlAsset.mockImplementation(comBucket)
      urlPublica.mockImplementation(comBase)
    })

    afterEach(() => {
      urlAsset.mockImplementation((c) => c)
      urlPublica.mockImplementation((c) => c)
    })

    it('foto local de produto vai para o bucket', () => {
      render(<ProductImage src="/images/produtos/1_a.jpg" alt="Foto" />)

      expect(screen.getByRole('img', { name: 'Foto' })).toHaveAttribute(
        'src',
        'https://bucket.exemplo/assets/images/produtos/1_a.jpg'
      )
    })

    it('caminho local fora de produtos respeita a base do app', () => {
      render(<ProductImage src="/images/logo.png" alt="Foto" />)
      expect(screen.getByRole('img', { name: 'Foto' })).toHaveAttribute('src', '/smartmarket/images/logo.png')
    })

    it('URL de CDN externo não é alterada', () => {
      render(<ProductImage src="https://edge.osuper.com.br/x/y.webp" alt="Foto" />)
      expect(screen.getByRole('img', { name: 'Foto' })).toHaveAttribute('src', 'https://edge.osuper.com.br/x/y.webp')
    })
  })
})
