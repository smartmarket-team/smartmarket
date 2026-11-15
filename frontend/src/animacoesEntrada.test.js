const fs = require('fs')
const path = require('path')

const RAIZ = __dirname
const CLASSES_DE_ENTRADA = /\b(animate-in|fade-in|zoom-in-\d+|slide-in-from-[a-z]+(?:-\d+)?)\b/g

function arquivosDeProducao(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const caminho = path.join(dir, e.name)
    if (e.isDirectory()) return e.name === 'test' ? [] : arquivosDeProducao(caminho)
    return /\.jsx$/.test(e.name) && !/\.test\./.test(e.name) ? [caminho] : []
  })
}

describe('animações de entrada (animate-in, fade-in, zoom-in, slide-in)', () => {
  it('toda classe usada nos componentes está definida no index.css', () => {
    const css = fs.readFileSync(path.join(RAIZ, 'index.css'), 'utf8')
    const usadas = new Set()
    for (const arquivo of arquivosDeProducao(RAIZ)) {
      const texto = fs.readFileSync(arquivo, 'utf8')
      for (const m of texto.matchAll(CLASSES_DE_ENTRADA)) usadas.add(m[1])
    }
    expect(usadas.size).toBeGreaterThan(0)
    const faltando = [...usadas].filter((c) => !new RegExp(String.raw`@utility\s+${c}\s*\{`).test(css))
    expect(faltando).toEqual([])
  })
})

describe('selo de oferta do detalhe do produto', () => {
  it('pulsa só duas vezes (não usa animate-pulse infinito) e respeita movimento reduzido', () => {
    const css = fs.readFileSync(path.join(RAIZ, 'index.css'), 'utf8')
    const modal = fs.readFileSync(path.join(RAIZ, 'components', 'ui', 'ProductDetailModal.jsx'), 'utf8')

    expect(modal).toContain('animate-pulso-curto')
    expect(modal).not.toMatch(/\banimate-pulse\b/)
    expect(css).toMatch(/\.animate-pulso-curto\s*\{\s*animation:[^;]*\s2;/)
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{[^{}]*\.animate-pulso-curto[^{}]*\{[^}]*animation:\s*none/)
  })
})
