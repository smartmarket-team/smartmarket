const fs = require('fs')
const path = require('path')

function jsxDeProducao(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const caminho = path.join(dir, e.name)
    if (e.isDirectory()) return e.name === 'test' ? [] : jsxDeProducao(caminho)
    return /\.jsx$/.test(e.name) && !/\.test\./.test(e.name) ? [caminho] : []
  })
}

/** Texto de cada tag <img ...>: avança até o '>' que fecha a tag, ignorando os de dentro de {...} (setas =>). */
function tagsImg(texto) {
  const tags = []
  for (let i = texto.indexOf('<img'); i !== -1; i = texto.indexOf('<img', i + 4)) {
    let profundidade = 0
    let j = i + 4
    for (; j < texto.length; j++) {
      const c = texto[j]
      if (c === '{') profundidade++
      else if (c === '}') profundidade--
      else if (c === '>' && profundidade === 0) break
    }
    tags.push(texto.slice(i, j + 1))
  }
  return tags
}

describe('imagens com alt', () => {
  it('toda <img> declara o atributo alt (vazio só quando a imagem é decorativa)', () => {
    const semAlt = []
    let total = 0
    for (const arquivo of jsxDeProducao(__dirname)) {
      for (const tag of tagsImg(fs.readFileSync(arquivo, 'utf8'))) {
        total++
        if (!/\balt=/.test(tag)) semAlt.push(`${path.relative(__dirname, arquivo)}: ${tag.slice(0, 60).replace(/\s+/g, ' ')}`)
      }
    }
    expect(total).toBeGreaterThan(10)
    expect(semAlt).toEqual([])
  })

  it('o leitor de tags enxerga alt mesmo quando a tag tem arrow function com ">"', () => {
    const tags = tagsImg('<img src={x} onError={(e) => { y() }} alt="a" /> <img src={z} onError={(e) => {}} />')
    expect(tags).toHaveLength(2)
    expect(/\balt=/.test(tags[0])).toBe(true)
    expect(/\balt=/.test(tags[1])).toBe(false)
  })
})
