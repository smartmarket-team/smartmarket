import fs from 'fs'
import path from 'path'
import { render, screen } from '@testing-library/react'
import { SmartMarketLogo } from './SmartMarketLogo'

describe('logo com dimensões (evita mudança de layout ao carregar)', () => {
  it('SmartMarketLogo declara width e height da proporção real do logo (863x196)', () => {
    render(<SmartMarketLogo />)
    const img = screen.getByRole('img', { name: 'SmartMarket' })
    expect(img).toHaveAttribute('width', '863')
    expect(img).toHaveAttribute('height', '196')
  })

  it.each([
    ['Layout', path.join(__dirname, '..', 'Layout.jsx')],
    ['AuthPage', path.join(__dirname, '..', '..', 'pages', 'AuthPage.jsx')],
  ])('%s declara width e height na <img src={logoImg}>', (_nome, arquivo) => {
    const tag = fs.readFileSync(arquivo, 'utf8').match(/<img src=\{logoImg\}[^>]*>/)[0]
    expect(tag).toMatch(/width=\{863\}/)
    expect(tag).toMatch(/height=\{196\}/)
  })
})
