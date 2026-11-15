const fs = require('fs')
const path = require('path')

function jsxDeProducao(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const caminho = path.join(dir, e.name)
    if (e.isDirectory()) return e.name === 'test' ? [] : jsxDeProducao(caminho)
    return /\.jsx$/.test(e.name) && !/\.test\./.test(e.name) ? [caminho] : []
  })
}

describe('transições', () => {
  it('nenhum componente usa transition-all (anima também largura, margem e posição, e pesa em listas)', () => {
    const achados = jsxDeProducao(__dirname).filter((f) => /(?<![\w-])transition-all(?![\w-])/.test(fs.readFileSync(f, 'utf8')))
    expect(achados.map((f) => path.relative(__dirname, f))).toEqual([])
  })

  it.each([
    ['Card', 'ui/Card.jsx', 'transition-[box-shadow,border-color,translate]'],
    ['Button', 'ui/Button.jsx', 'transition-[color,background-color,border-color,box-shadow,scale,opacity]'],
    ['Input', 'ui/Input.jsx', 'transition-[border-color,box-shadow,background-color]'],
  ])('%s lista só as propriedades que mudam', (_nome, arquivo, esperado) => {
    expect(fs.readFileSync(path.join(__dirname, 'components', arquivo), 'utf8')).toContain(esperado)
  })
})
