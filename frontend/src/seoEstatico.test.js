const fs = require('fs')
const path = require('path')

const RAIZ = path.join(__dirname, '..')
const ler = (...partes) => fs.readFileSync(path.join(RAIZ, ...partes), 'utf8')

describe('SEO estático (robots.txt, sitemap.xml e canonical)', () => {
  const canonical = ler('index.html').match(/<link rel="canonical" href="([^"]+)"/)[1]

  it('o robots.txt libera o site, aponta para o sitemap e não cita o caminho do Admin', () => {
    const robots = ler('public', 'robots.txt')
    expect(robots).toMatch(/^User-agent: \*$/m)
    expect(robots).not.toMatch(/admin/i)
    expect(robots).toContain(`Sitemap: ${canonical}sitemap.xml`)
  })

  it('o sitemap lista a página pública com a mesma URL do canonical e nenhuma rota que exige login', () => {
    const sitemap = ler('public', 'sitemap.xml')
    const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
    expect(urls).toContain(canonical)
    for (const rota of ['catalog', 'favorites', 'list', 'admin', 'compare']) {
      expect(urls.some((u) => u.includes(`/${rota}`))).toBe(false)
    }
  })

  it('o index.html traz description, theme-color e og:title', () => {
    const html = ler('index.html')
    expect(html).toMatch(/<meta name="description" content="[^"]{50,}"/)
    expect(html).toMatch(/<meta name="theme-color" content="#[0-9A-Fa-f]{6}"/)
    expect(html).toMatch(/<meta property="og:title"/)
  })
})
