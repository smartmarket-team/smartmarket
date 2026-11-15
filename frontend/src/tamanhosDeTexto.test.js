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
const EXCECOES = new Set(['AnatomiaSmartMarket.jsx'])

describe('tamanho mínimo de texto', () => {
  it('nenhum componente usa text-[Npx] com N menor que 11', () => {
    const achados = []
    for (const arquivo of jsxDeProducao(__dirname)) {
      if (EXCECOES.has(path.basename(arquivo))) continue
      const texto = fs.readFileSync(arquivo, 'utf8')
      for (const m of texto.matchAll(PEQUENO_DEMAIS)) achados.push(`${path.relative(__dirname, arquivo)}: ${m[0]}`)
    }
    expect(achados).toEqual([])
  })
})
