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
