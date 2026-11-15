const fs = require('fs')
const path = require('path')

function jsxDeProducao(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const caminho = path.join(dir, e.name)
    if (e.isDirectory()) return e.name === 'test' ? [] : jsxDeProducao(caminho)
    return /\.jsx$/.test(e.name) && !/\.test\./.test(e.name) ? [caminho] : []
  })
}

// Texto de até 10 px some em celular e reprova contraste/legibilidade. Selos curtos podem ter 11 px;
// todo o resto fica em text-xs (12 px) ou mais. Tamanho arbitrário abaixo de 11 px não entra.
const PEQUENO_DEMAIS = /text-\[(?:[0-9]|10)(?:\.\d+)?px\]/g

describe('tamanho mínimo de texto', () => {
  it('nenhum componente usa text-[Npx] com N menor que 11', () => {
    const achados = []
    for (const arquivo of jsxDeProducao(__dirname)) {
      const texto = fs.readFileSync(arquivo, 'utf8')
      for (const m of texto.matchAll(PEQUENO_DEMAIS)) achados.push(`${path.relative(__dirname, arquivo)}: ${m[0]}`)
    }
    expect(achados).toEqual([])
  })
})

describe('AnatomiaSmartMarket (texto branco sobre fundo escuro)', () => {
  const texto = fs.readFileSync(path.join(__dirname, 'components', 'AnatomiaSmartMarket.jsx'), 'utf8')

  it('texto não usa text-white/70 ou mais fraco (contraste; o mínimo pedido é /80)', () => {
    expect(texto.match(/text-white\/(?:[1-6]\d?|70)(?!\d)/g) || []).toEqual([])
    expect(texto).not.toMatch(/color:[^}]*rgba\(255,\s*255,\s*255,\s*0\.[0-7]\d*\)/)
  })
})
