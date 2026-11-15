import fs from 'fs'
import path from 'path'
import { HOSTS_DE_IMAGEM, montarCsp, origemDe, pluginCsp } from './csp'

const diretiva = (csp, nome) => {
  const achada = csp.split(';').map((d) => d.trim()).find((d) => d.startsWith(`${nome} `))
  return achada ? achada.slice(nome.length).trim().split(/\s+/) : null
}

describe('origemDe', () => {
  it('extrai só a origem (esquema + host + porta) de uma URL absoluta', () => {
    expect(origemDe('https://api.exemplo.com.br/api')).toBe('https://api.exemplo.com.br')
    expect(origemDe('https://b.storage.neon.tech/smartmarket-assets/catalogo/produtos.json')).toBe(
      'https://b.storage.neon.tech',
    )
    expect(origemDe('http://localhost:8080/api')).toBe('http://localhost:8080')
  })

  it('devolve null para vazio, caminho relativo ou texto inválido', () => {
    expect(origemDe(undefined)).toBeNull()
    expect(origemDe('')).toBeNull()
    expect(origemDe('/api')).toBeNull()
    expect(origemDe('isso não é url')).toBeNull()
  })

  it('recusa esquemas que não sejam http(s), para não abrir a política com javascript: ou data:', () => {
    expect(origemDe('javascript:alert(1)')).toBeNull()
    expect(origemDe('data:text/html,<b>x</b>')).toBeNull()
  })
})

describe('montarCsp', () => {
  it('sem variáveis de ambiente, só libera a própria origem para conexões', () => {
    const csp = montarCsp({})
    expect(diretiva(csp, 'default-src')).toEqual(["'self'"])
    expect(diretiva(csp, 'connect-src')).toEqual(["'self'"])
    expect(diretiva(csp, 'media-src')).toEqual(["'self'"])
  })

  it('bloqueia script de terceiros, plugins, base tag e formulários externos', () => {
    const csp = montarCsp({})
    expect(diretiva(csp, 'script-src')).toEqual(["'self'"])
    expect(diretiva(csp, 'object-src')).toEqual(["'none'"])
    expect(diretiva(csp, 'base-uri')).toEqual(["'self'"])
    expect(diretiva(csp, 'form-action')).toEqual(["'self'"])
    expect(csp).not.toContain("'unsafe-eval'")
    expect(diretiva(csp, 'script-src')).not.toContain("'unsafe-inline'")
  })

  it('permite estilos inline (React usa style=) mas não scripts inline', () => {
    const csp = montarCsp({})
    expect(diretiva(csp, 'style-src')).toEqual(["'self'", "'unsafe-inline'"])
  })

  it('libera fontes locais e data:, e imagens locais, data: e só os CDNs de foto dos mercados', () => {
    const csp = montarCsp({})
    expect(diretiva(csp, 'font-src')).toEqual(["'self'", 'data:'])
    expect(diretiva(csp, 'img-src')).toEqual(["'self'", 'data:', ...HOSTS_DE_IMAGEM])
    expect(diretiva(csp, 'img-src')).not.toContain('https:')
  })

  it('não usa frame-ancestors, que o navegador ignora (e avisa) quando vem em <meta>', () => {
    expect(montarCsp({})).not.toContain('frame-ancestors')
  })

  it('connect-src inclui a origem da API e a do catálogo, sem o caminho', () => {
    const csp = montarCsp({
      apiUrl: 'https://smartmarket-api.onrender.com/api',
      catalogoUrl: 'https://br-x.storage.c-16.us-east-1.aws.neon.tech/smartmarket-assets/catalogo/produtos.json',
    })
    expect(diretiva(csp, 'connect-src')).toEqual([
      "'self'",
      'https://smartmarket-api.onrender.com',
      'https://br-x.storage.c-16.us-east-1.aws.neon.tech',
    ])
  })

  it('o bucket de fotos entra em img-src e media-src, não em connect-src', () => {
    const csp = montarCsp({ assetsUrl: 'https://br-x.storage.neon.tech/smartmarket-assets' })
    expect(diretiva(csp, 'img-src')).toContain('https://br-x.storage.neon.tech')
    expect(diretiva(csp, 'media-src')).toEqual(["'self'", 'https://br-x.storage.neon.tech'])
    expect(diretiva(csp, 'connect-src')).toEqual(["'self'"])
  })

  it('API relativa ("/api", proxy do nginx/Vercel) não acrescenta nada além do self', () => {
    expect(diretiva(montarCsp({ apiUrl: '/api' }), 'connect-src')).toEqual(["'self'"])
  })

  it('não repete a mesma origem quando API e catálogo estão no mesmo host', () => {
    const csp = montarCsp({ apiUrl: 'https://h.exemplo/api', catalogoUrl: 'https://h.exemplo/c.json' })
    expect(diretiva(csp, 'connect-src')).toEqual(["'self'", 'https://h.exemplo'])
  })

  it('uma URL de ambiente maliciosa não injeta diretivas na política', () => {
    const csp = montarCsp({ apiUrl: "https://ok.exemplo; script-src 'unsafe-inline' https://evil.exemplo" })
    expect(diretiva(csp, 'script-src')).toEqual(["'self'"])
    expect(csp).not.toContain('evil.exemplo')
  })
})

describe('pluginCsp', () => {
  const env = { VITE_API_URL: 'https://api.exemplo/api' }
  const html = '<!doctype html><html><head>\n    <meta charset="UTF-8" />\n    <title>x</title>\n  </head><body></body></html>'
  const metaCsp = (saida) => saida.match(/<meta http-equiv="Content-Security-Policy" content="([^"]*)"\s*\/?>/)

  it('só atua no build, para não quebrar o HMR do dev server', () => {
    expect(pluginCsp(env).apply).toBe('build')
  })

  it('injeta a <meta http-equiv="Content-Security-Policy"> com a política montada do ambiente', () => {
    const saida = pluginCsp(env).transformIndexHtml(html)
    const meta = metaCsp(saida)
    expect(meta).not.toBeNull()
    expect(meta[1]).toBe(montarCsp({ apiUrl: 'https://api.exemplo/api' }))
    expect(meta[1]).toContain('https://api.exemplo')
  })

  it('mantém <meta charset> primeiro (precisa estar nos primeiros 1024 bytes) e a CSP logo depois', () => {
    const saida = pluginCsp(env).transformIndexHtml(html)
    expect(saida.indexOf('<meta charset')).toBeLessThan(saida.indexOf('Content-Security-Policy'))
    expect(saida.indexOf('Content-Security-Policy')).toBeLessThan(saida.indexOf('<title>'))
  })

  it('sem <meta charset>, entra no começo do <head>', () => {
    const saida = pluginCsp(env).transformIndexHtml('<html><head><title>x</title></head></html>')
    expect(saida.indexOf('<head>')).toBeLessThan(saida.indexOf('Content-Security-Policy'))
    expect(saida.indexOf('Content-Security-Policy')).toBeLessThan(saida.indexOf('<title>'))
  })

  it('lê as três variáveis do ambiente', () => {
    const saida = pluginCsp({
      VITE_API_URL: 'https://a.exemplo/api',
      VITE_CATALOGO_URL: 'https://c.exemplo/p.json',
      VITE_ASSETS_BASE_URL: 'https://f.exemplo/assets',
    }).transformIndexHtml(html)
    const csp = metaCsp(saida)[1]
    expect(diretiva(csp, 'connect-src')).toEqual(["'self'", 'https://a.exemplo', 'https://c.exemplo'])
    expect(diretiva(csp, 'media-src')).toEqual(["'self'", 'https://f.exemplo'])
  })
})

describe('img-src cobre as fotos que o catálogo realmente usa', () => {
  // Lê o data.js como TEXTO (32 MB): só procura os hosts dos campos imageUrl/imageLocal, sem importá-lo.
  const caminho = path.join(__dirname, '..', 'src', 'data.js')
  const temData = fs.existsSync(caminho)

  ;(temData ? it : it.skip)('todo host de imageUrl e imageLocal do data.js está liberado, e a lista não tem host sobrando', () => {
    const texto = fs.readFileSync(caminho, 'utf8')
    const usados = new Set()
    for (const m of texto.matchAll(/"(?:imageUrl|imageLocal)":\s*"(https?:\/\/[^/"]+)/g)) usados.add(m[1])

    const liberados = diretiva(montarCsp({}), 'img-src')
    expect([...usados].filter((origem) => !liberados.includes(origem))).toEqual([])
    expect(HOSTS_DE_IMAGEM.filter((origem) => !usados.has(origem))).toEqual([])
  })

  it('o host de foto das duas redes do Pages (bucket e CDN da Asun) continua liberado com as variáveis do deploy', () => {
    const csp = montarCsp({ assetsUrl: 'https://bucket.exemplo/smartmarket-assets' })
    expect(diretiva(csp, 'img-src')).toEqual(expect.arrayContaining(['https://bucket.exemplo', 'https://edge.osuper.com.br']))
  })
})
