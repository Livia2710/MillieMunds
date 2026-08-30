'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import MillieModal from '@/componentes/ui/MillieModal'
import { PrimaryButton } from '@/componentes/PrimaryButton'
import { drawTarotCard, submitTarotCards } from '@/app/actions/tarot'
import { MAJOR_ARCANA_LABELS, type MajorArcanaSlug } from '@/lib/tarot'

type Props = {
  isOpen: boolean
  onClose: () => void
  drawId: string
  readingType: 'COMUM' | 'PROFUNDA'
  question: string
}

type Carta = {
  id: string
  name: string
  src: string
  slug: string
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
    startTransition(async () => {
      try {
        const { card } = await drawTarotCard(drawId)
        const slug = card as MajorArcanaSlug
        const nova: CartaRevelada = {
          id: slug,
          name: MAJOR_ARCANA_LABELS[slug],
          src: `/assets/images/cartas/arcano_maior/${slug}.png`,
          slug,
          flipped: false,
        }
        setCartas((prev) => [...prev, nova])
        setTimeout(() => {
          setCartas((prev) => prev.map((c, i) => i === prev.length - 1 ? { ...c, flipped: true } : c))
          setTimeout(() => setIsAnimating(false), 700)
        }, 100)
      } catch {
        setIsAnimating(false)
      }
    })
  }

  function handleConfirmar() {
    startTransition(async () => {
      await submitTarotCards(drawId)
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
              {isAnimating || isPending ? 'Revelando...' : 'Tirar Arcano'}
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
