import { useEffect, useId, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { linkComoChegar, linkWaze } from "../utils/linkComoChegar"
import { posicaoDoPopover } from "../utils/posicaoDoPopover"

// Tamanho do popover: duas linhas de 44 px (alvo de toque) mais o respiro. Fixo, para a posição ser calculada
// sem medir o DOM.
const TAMANHO_DO_POPOVER = { largura: 200, altura: 104 }

const CLASSE_BOTAO = {
  completo: "text-[11px]",
  compacto: "text-[10px]",
}

const CLASSE_LINK =
  "flex items-center min-h-11 px-3 rounded-lg text-sm font-bold text-emerald-900 hover:bg-emerald-50 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/50"

const Chevron = () => (
  <svg aria-hidden="true" viewBox="0 0 12 12" width="10" height="10" className="shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M2.5 4.5 6 8l3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// Quem está com o popover aberto (no máximo um): abrir outro fecha este.
let fecharOAberto = null

// O que o Tab alcança.
const SELETOR_FOCAVEIS = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",")

// O popover fica no fim do body, então o Tab natural a partir dele sairia do lugar. O próximo elemento
// focável "de verdade" é o primeiro, na ordem do documento, que vem depois do botão, fora do próprio popover
// e visível. `null` quando não há nenhum.
function proximoFocavelDepois(gatilho, popover) {
  const candidatos = Array.from(document.querySelectorAll(SELETOR_FOCAVEIS))
  return (
    candidatos.find(
      (el) =>
        !gatilho.contains(el) &&
        !popover.contains(el) &&
        !el.closest("[hidden],[aria-hidden='true']") &&
        el.getAttribute("tabindex") !== "-1" &&
        Boolean(gatilho.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING),
    ) ?? null
  )
}

/**
 * Botão "Navegar": ao clicar, abre uma escolha entre Google Maps e Waze, que são só links (outra aba, sem
 * referrer, sem API paga, sem mapa embutido). O destino é sempre a coordenada da LOJA, nunca a posição do
 * usuário. Sem um par de coordenadas válido, não renderiza nada. Não lembra a última escolha.
 *
 * É um popover de "disclosure" (botão com aria-expanded e um grupo com dois links), não um role="menu".
 * Fica num portal no document.body com posição fixa, porque os cartões do catálogo têm overflow-hidden e
 * ficam em trilhos com rolagem: dentro do cartão o popover seria cortado. Toda a implementação do popover
 * está neste arquivo, para poder trocá-la por dentro (por exemplo pelo popover nativo) sem mexer nos usos.
 */
export default function BotaoNavegar({ latitude, longitude, nomeLoja = "", compacto = false, className = "" }) {
  const google = linkComoChegar(latitude, longitude)
  const waze = linkWaze(latitude, longitude)
  const idDoPopover = useId()
  const refGatilho = useRef(null)
  const refPopover = useRef(null)
  // null = fechado; objeto = aberto e onde fica.
  const [posicao, setPosicao] = useState(null)
  const aberto = posicao !== null

  // Ao abrir, o foco vai para o primeiro link. preventScroll: focar não pode rolar a página (rolar fecharia
  // o popover que acabou de abrir).
  useLayoutEffect(() => {
    if (aberto) refPopover.current?.querySelector("a")?.focus({ preventScroll: true })
  }, [aberto])

  // Enquanto aberto: Esc, toque fora, rolagem e redimensionamento fecham. O scroll não sobe pela página
  // (cada trilho horizontal rola sozinho), então o ouvinte fica em `window` na fase de CAPTURA, que enxerga a
  // rolagem de qualquer contêiner. Fechar por Esc devolve o foco ao botão; fechar por toque fora, rolagem ou
  // redimensionamento não mexe no foco (quem tocou em outro controle continua nele).
  useEffect(() => {
    if (!aberto) return undefined
    const fechar = () => setPosicao(null)
    if (fecharOAberto && fecharOAberto !== fechar) fecharOAberto()
    fecharOAberto = fechar

    const aoTeclar = (evento) => {
      if (evento.key !== "Escape") return
      fechar()
      refGatilho.current?.focus({ preventScroll: true })
    }
    const aoTocar = (evento) => {
      const alvo = evento.target
      // O botão alterna pelo próprio clique; fechar aqui o reabriria logo depois.
      if (refPopover.current?.contains(alvo) || refGatilho.current?.contains(alvo)) return
      fechar()
    }
    document.addEventListener("keydown", aoTeclar)
    document.addEventListener("pointerdown", aoTocar)
    window.addEventListener("scroll", fechar, true)
    window.addEventListener("resize", fechar)
    return () => {
      document.removeEventListener("keydown", aoTeclar)
      document.removeEventListener("pointerdown", aoTocar)
      window.removeEventListener("scroll", fechar, true)
      window.removeEventListener("resize", fechar)
      if (fecharOAberto === fechar) fecharOAberto = null
    }
  }, [aberto])

  if (!google || !waze) return null

  const rotuloDaLoja = nomeLoja ? `Navegar até ${nomeLoja}` : undefined
  const nomeNoRotulo = nomeLoja || "a loja"

  function abrir() {
    const gatilho = refGatilho.current.getBoundingClientRect()
    setPosicao(
      posicaoDoPopover({
        gatilho,
        tela: { largura: window.innerWidth, altura: window.innerHeight },
        popover: TAMANHO_DO_POPOVER,
      }),
    )
  }

  // Escolher um destino fecha o popover e devolve o foco ao botão (a aba do mapa abre sozinha).
  function aoEscolher() {
    setPosicao(null)
    refGatilho.current?.focus({ preventScroll: true })
  }

  // Teclado dentro do popover. Entre os dois links o Tab natural já serve. Nas pontas ele sairia do lugar
  // (o popover está no fim do body): Shift+Tab no primeiro link volta ao botão; Tab no último segue para o
  // próximo focável depois do botão (ou, se não houver, fica no botão). Nos dois casos o popover fecha.
  function aoPressionarTecla(evento) {
    if (evento.key !== "Tab") return
    const links = refPopover.current.querySelectorAll("a")
    const primeiro = links[0]
    const ultimo = links[links.length - 1]
    if (evento.shiftKey && evento.target === primeiro) {
      evento.preventDefault()
      setPosicao(null)
      refGatilho.current.focus({ preventScroll: true })
    } else if (!evento.shiftKey && evento.target === ultimo) {
      evento.preventDefault()
      const proximo = proximoFocavelDepois(refGatilho.current, refPopover.current)
      setPosicao(null)
      ;(proximo ?? refGatilho.current).focus({ preventScroll: true })
    }
  }

  function alternar(evento) {
    // O clique no botão não pode subir ao cartão (que abriria o detalhe do produto).
    evento.stopPropagation()
    if (aberto) setPosicao(null)
    else abrir()
  }

  return (
    <>
      <button
        ref={refGatilho}
        type="button"
        aria-expanded={aberto}
        aria-controls={aberto ? idDoPopover : undefined}
        aria-label={rotuloDaLoja}
        onClick={alternar}
        className={`shrink-0 inline-flex items-center gap-1 font-bold text-emerald-900 underline underline-offset-2 hover:text-emerald-700 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/50 ${CLASSE_BOTAO[compacto ? "compacto" : "completo"]} ${className}`}
      >
        Navegar
        <Chevron />
      </button>
      {aberto &&
        createPortal(
          <div
            ref={refPopover}
            id={idDoPopover}
            role="group"
            aria-label={rotuloDaLoja ?? "Navegar"}
            // O portal faz o clique subir pela árvore do React até o cartão: aqui ele para.
            onClick={(evento) => evento.stopPropagation()}
            onKeyDown={aoPressionarTecla}
            style={{ position: "fixed", top: posicao.top, left: posicao.left, width: posicao.largura, zIndex: 60 }}
            className="rounded-xl border border-emerald-200 bg-white p-1 shadow-lg"
          >
            <a
              href={google}
              target="_blank"
              rel="noopener noreferrer"
              referrerPolicy="no-referrer"
              aria-label={`Abrir ${nomeNoRotulo} no Google Maps (abre em outra aba)`}
              onClick={aoEscolher}
              className={CLASSE_LINK}
            >
              Google Maps
            </a>
            <a
              href={waze}
              target="_blank"
              rel="noopener noreferrer"
              referrerPolicy="no-referrer"
              aria-label={`Abrir ${nomeNoRotulo} no Waze (abre em outra aba)`}
              onClick={aoEscolher}
              className={CLASSE_LINK}
            >
              Waze
            </a>
          </div>,
          document.body,
        )}
    </>
  )
}
