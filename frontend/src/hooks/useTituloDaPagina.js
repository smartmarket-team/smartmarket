import { useEffect } from "react"

const NOME_DO_SITE = "SmartMarket"

/**
 * Define o título da aba (e do histórico) para a rota atual: "Catálogo · SmartMarket".
 * Ao sair da página, devolve o título anterior, então a Home continua com o título padrão do index.html.
 */
export function useTituloDaPagina(titulo) {
  useEffect(() => {
    const anterior = document.title
    document.title = titulo ? `${titulo} · ${NOME_DO_SITE}` : anterior
    return () => {
      document.title = anterior
    }
  }, [titulo])
}
