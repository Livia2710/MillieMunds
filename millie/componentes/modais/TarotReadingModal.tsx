'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import MillieModal from '@/componentes/ui/MillieModal'
import { PrimaryButton } from '@/componentes/PrimaryButton'
import { submitTarotCards } from '@/app/actions/tarot'

type Props = {
  isOpen: boolean
  onClose: () => void
  drawId: string
  readingType: 'COMUM' | 'PROFUNDA'
  question: string
}

const NAIPES  = ['paus', 'copas', 'espadas', 'ouro'] as const
const VALORES = ['as', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'valete', 'cavaleiro', 'rainha', 'rei'] as const

type Carta = {
  id: string
  name: string
  src: string
  slug: string
  isJoker: boolean
  peso: number
}

// baralho + coringa
const BARALHO: Carta[] = [
  ...NAIPES.flatMap((naipe) =>
    VALORES.map((valor) => ({
      id:      `${valor}-${naipe}`,
      name:    `${valor.charAt(0).toUpperCase() + valor.slice(1)} de ${naipe.charAt(0).toUpperCase() + naipe.slice(1)}`,
      src:     `/assets/images/cartas/arcano_menor/${valor}-${naipe}.png`,
      slug:    `${valor}-${naipe}`,
      isJoker: false,
      peso:    ['rei', 'rainha', 'cavaleiro', 'valete'].includes(valor) ? 3 : 10,
    }))
  ),
  { id: 'coringa', name: 'Coringa', src: '/assets/images/cartas/arcano_menor/coringa.png', slug: 'coringa', isJoker: true, peso: 2 },
]

function sortearCarta(): Carta {
  const pesoTotal = BARALHO.reduce((t, c) => t + c.peso, 0)
  let sorteio = Math.random() * pesoTotal
  return BARALHO.find((c) => { sorteio -= c.peso; return sorteio <= 0 }) ?? BARALHO[0]
}

type CartaRevelada = Carta & { flipped: boolean }

export default function TarotReadingModal({ isOpen, onClose, drawId, readingType, question }: Props) {
  const total = readingType === 'COMUM' ? 3 : 5
  const [cartas, setCartas]          = useState<CartaRevelada[]>([])
  const [isAnimating, setIsAnimating]= useState(false)
  const [submitted, setSubmitted]    = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleTirar() {
    if (isAnimating || cartas.length >= total) return
    setIsAnimating(true)

    const nova = { ...sortearCarta(), flipped: false }
    setCartas((prev) => [...prev, nova])

    setTimeout(() => {
      setCartas((prev) =>
        prev.map((c, i) => i === prev.length - 1 ? { ...c, flipped: true } : c)
      )
      setTimeout(() => setIsAnimating(false), 700)
    }, 100)
  }

  function handleConfirmar() {
    const slugs   = cartas.map((c) => c.slug)
    const hadJoker = cartas.some((c) => c.isJoker)
    startTransition(async () => {
      await submitTarotCards({ drawId, cards: slugs, hadJoker })
      setSubmitted(true)
    })
  }

  function handleClose() {
    setCartas([])
    setSubmitted(false)
    onClose()
  }

  const cartasRestantes = total - cartas.length

  return (
    <MillieModal
      isOpen={isOpen}
      onClose={handleClose}
      title={readingType === 'COMUM' ? 'Leitura Comum' : 'Leitura Profunda'}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">

        {!submitted ? (
          <>
            <p className="text-xs text-bege-escuro/60 italic text-center">"{question}"</p>

            <p className="text-center font-title text-xs uppercase tracking-widest text-bege-escuro/50">
              {cartasRestantes > 0
                ? `Tire ${cartasRestantes} carta${cartasRestantes > 1 ? 's' : ''}`
                : 'Todas as cartas reveladas'}
            </p>

            {/* cartas reveladas */}
            <div className="flex flex-wrap justify-center gap-3 min-h-[160px]">
              {cartas.map((carta, i) => (
                <div key={i} style={{ perspective: '1000px' }}>
                  <div
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: carta.flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    }}
                    className="relative w-24 h-40 transition-transform duration-700"
                  >
                    {/* verso */}
                    <div style={{ backfaceVisibility: 'hidden' }} className="absolute inset-0 rounded-lg overflow-hidden">
                      <Image src="/assets/svgs/Carta.svg" alt="" fill />
                    </div>
                    {/* frente */}
                    <div
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                      className="absolute inset-0 rounded-lg overflow-hidden bg-[#120e1a]"
                    >
                      <Image src={carta.src} alt={carta.name} fill className="object-cover" unoptimized />
                    </div>
                  </div>
                  <p className="text-center text-[9px] text-bege-escuro/50 mt-1 font-title uppercase tracking-wide w-24 truncate">
                    {carta.flipped ? carta.name : '?'}
                  </p>
                </div>
              ))}

              {/* slots vazios */}
              {Array.from({ length: cartasRestantes }).map((_, i) => (
                <div key={`vazio-${i}`} className="w-24 h-40 border border-bege-escuro/20 rounded-lg flex items-center justify-center">
                  <span className="text-bege-escuro/20 font-title text-2xl">?</span>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-3">
              {cartasRestantes > 0 ? (
                <PrimaryButton onClick={handleTirar} disabled={isAnimating}>
                  {isAnimating ? 'Revelando...' : 'Tirar Carta'}
                </PrimaryButton>
              ) : (
                <PrimaryButton onClick={handleConfirmar} disabled={isPending}>
                  {isPending ? 'Enviando...' : 'Confirmar Cartas'}
                </PrimaryButton>
              )}
            </div>
          </>
        ) : (
          <div className="py-8 text-center space-y-3">
            <p className="font-title text-sm text-bege-medio tracking-wide">
              Cartas enviadas ao Mestre.
            </p>
            <p className="text-xs text-bege-escuro/50 italic">
              Aguarde o Mestre interpretar a leitura.
            </p>
          </div>
        )}

      </div>
    </MillieModal>
  )
}