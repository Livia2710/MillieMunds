'use client'

import { useState, useEffect, useTransition, useRef, useCallback } from 'react'
import Image from 'next/image'
import { ProfileCharacter } from '@/lib/types/profile'
import { PrimaryButton } from '../PrimaryButton'
import { getSpecialCards, saveSpecialCard, useSpecialCard, updateCharacterPoints } from '@/app/actions/character'
import { calcAutoConditions } from '@/lib/utils/conditions'

interface ProfileCardsProps {
  character: ProfileCharacter
}

// ── baralho ───────────────────────────────────────────────
const NAIPES = ['paus', 'copas', 'espadas', 'ouro'] as const
const VALORES = ['as', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'valete', 'cavaleiro', 'rainha', 'rei'] as const

type Naipe = typeof NAIPES[number]
type Valor = typeof VALORES[number]

type Carta = {
  id: string
  name: string
  src: string
  isEspecial: boolean
  tipo: 'VALETE' | 'CAVALEIRO' | null
  peso: number
}

const BARALHO: Carta[] = NAIPES.flatMap((naipe) =>
  VALORES.map((valor) => ({
    id: `${valor}-${naipe}`,
    name: `${valor.charAt(0).toUpperCase() + valor.slice(1)} de ${naipe.charAt(0).toUpperCase() + naipe.slice(1)}`,
    src: `/assets/images/cartas/arcano_menor/${valor}-${naipe}.png`,
    isEspecial: valor === 'valete' || valor === 'cavaleiro',
    tipo: valor === 'valete' ? 'VALETE' : valor === 'cavaleiro' ? 'CAVALEIRO' : null,
    peso: ['rei', 'rainha', 'cavaleiro', 'valete'].includes(valor) ? 3 : 10,
  }))
)

type SpecialCard = {
  id: string
  cardType: 'VALETE' | 'CAVALEIRO'
  isAvailable: boolean
  obtainedAt: Date
  usedAt: Date | null
}

const TIPO_LABEL: Record<'VALETE' | 'CAVALEIRO', string> = {
  VALETE: 'Valete',
  CAVALEIRO: 'Cavaleiro',
}

// ── condições automáticas derivadas do PV ─────────────────
type AutoCondition = {
  label: string
  color: string
}

export default function ProfileCards({ character }: ProfileCardsProps) {
  const [isFlipped, setIsFlipped]       = useState(false)
  const [isAnimating, setIsAnimating]   = useState(false)
  const [activeCard, setActiveCard]     = useState<Carta>(BARALHO[0])
  const [specialCards, setSpecialCards] = useState<SpecialCard[]>([])
  const [savedMsg, setSavedMsg]         = useState('')
  const [isPending, startTransition]    = useTransition()

  // ── estado local de PV/PM (otimista) ──────────────────
  const [pv, setPv] = useState(character.pv)
  const [pm, setPm] = useState(character.pm)
  const pvMax = character.pvMax
  const pmMax = character.pmMax

  // debounce ref: salva no banco 800ms após última alteração
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleSave = useCallback((nextPv: number, nextPm: number) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      startTransition(async () => {
        await updateCharacterPoints(character.id, { pv: nextPv, pm: nextPm })
      })
    }, 800)
  }, [character.id])

  function changePv(delta: number) {
    setPv((prev) => {
      const next = Math.max(0, Math.min(prev + delta, pvMax))
      scheduleSave(next, pm)
      return next
    })
  }

  function changePm(delta: number) {
    setPm((prev) => {
      const next = Math.max(0, Math.min(prev + delta, pmMax))
      scheduleSave(pv, next)
      return next
    })
  }

  // limpa timer ao desmontar
  useEffect(() => () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }, [])

  const autoConditions = calcAutoConditions(pv, pvMax)

  useEffect(() => {
    getSpecialCards(character.id).then((cards) => setSpecialCards(cards as SpecialCard[]))
  }, [character.id])

  // ── sorteio ───────────────────────────────────────────
  function sortear() {
    const pesoTotal = BARALHO.reduce((t, c) => t + c.peso, 0)
    let sorteio = Math.random() * pesoTotal
    const carta = BARALHO.find((c) => { sorteio -= c.peso; return sorteio <= 0 }) ?? BARALHO[0]
    setActiveCard(carta)
    setIsFlipped(true)
    setTimeout(() => setIsAnimating(false), 700)
  }

  function handleGerar() {
    if (isAnimating) return
    setIsAnimating(true)
    setSavedMsg('')
    if (isFlipped) {
      setIsFlipped(false)
      setTimeout(sortear, 400)
    } else {
      sortear()
    }
  }

  function handleGuardar() {
    if (!activeCard.tipo) return
    startTransition(async () => {
      try {
        const saved = await saveSpecialCard(character.id, activeCard.tipo!)
        setSpecialCards((prev) => [...prev, saved as SpecialCard])
        setSavedMsg(`${TIPO_LABEL[activeCard.tipo!]} guardado no deck!`)
      } catch (err: unknown) {
        setSavedMsg(err instanceof Error ? err.message : 'Erro ao guardar.')
      }
    })
  }

  function handleUsar(cardId: string) {
    startTransition(async () => {
      try {
        await useSpecialCard(cardId)
        setSpecialCards((prev) =>
          prev.map((c) => c.id === cardId ? { ...c, isAvailable: false, usedAt: new Date() } : c)
        )
      } catch { /* silencioso */ }
    })
  }

  const cartasDisponiveis = specialCards.filter((c) => c.isAvailable)
  const podeGuardar =
    isFlipped &&
    activeCard.isEspecial &&
    !specialCards.some((c) => c.isAvailable && c.cardType === activeCard.tipo)

  // ── helpers visuais de PV/PM ──────────────────────────
  const pvPct = pvMax > 0 ? (pv / pvMax) * 100 : 0
  const pmPct = pmMax > 0 ? (pm / pmMax) * 100 : 0

  const pvBarColor =
    pvPct <= 0   ? 'bg-red-600' :
    pvPct < 25   ? 'bg-red-500' :
    pvPct < 50   ? 'bg-orange-400' :
    pvPct < 75   ? 'bg-yellow-400' :
                   'bg-bege-medio'

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">

      {/* ── CARTAS ── */}
      <div className="relative border border-bege-escuro/40 p-6 flex flex-col items-center justify-between min-h-[380px] backdrop-blur-sm shadow-card">
        <div className="text-center w-full">
          <h2 className="text-md text-bege-medio tracking-[0.2em] font-title uppercase">Cartas</h2>
          <Image src="/assets/svgs/divider.svg" alt="" width={120} height={8} className="mx-auto my-2 opacity-80" />
        </div>

        <div style={{ perspective: '1000px' }} className="my-4">
          <div
            style={{
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
            className="relative w-40 h-65 transition-transform duration-700"
          >
            <div style={{ backfaceVisibility: 'hidden' }} className="absolute inset-0 flex items-center justify-center rounded-lg overflow-hidden">
              <Image src="/assets/svgs/Carta.svg" alt="Carta Oculta" fill priority />
              <span className="relative z-10 text-3xl text-bege-medio font-title opacity-40">?</span>
            </div>
            <div
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              className="absolute inset-0 flex items-center justify-center rounded-lg overflow-hidden shadow-2xl bg-[#120e1a]"
            >
              <Image src={activeCard.src} alt={activeCard.name} fill className="object-cover" sizes="160px" unoptimized priority />
            </div>
          </div>
        </div>

        <div className="w-full text-center space-y-3">
          <p className="text-[11px] text-bege-escuro/60 italic tracking-wide h-4">
            {isFlipped ? `Você tirou: ${activeCard.name}` : 'Gere uma carta e descubra o destino'}
          </p>

          {podeGuardar && (
            <button
              onClick={handleGuardar}
              disabled={isPending}
              className="w-full max-w-80 border border-bege-escuro/40 text-bege-medio font-title text-xs uppercase tracking-widest py-2 hover:border-bege-medio transition"
            >
              {isPending ? 'Guardando...' : `Guardar ${TIPO_LABEL[activeCard.tipo!]}`}
            </button>
          )}

          {savedMsg && (
            <p className="text-[11px] text-bege-medio/70 italic">{savedMsg}</p>
          )}

          <PrimaryButton onClick={handleGerar} className="w-full max-w-80" disabled={isAnimating}>
            {isAnimating ? 'Sorteando...' : 'Gerar Carta'}
          </PrimaryButton>

          {specialCards.length > 0 && (
            <div>
              <div className="flex flex-wrap gap-2 mt-2">
                {specialCards.map((card) => (
                  <div
                    key={card.id}
                    className={`flex items-center gap-2 px-3 py-2 border text-xs font-title uppercase tracking-widest transition ${
                      card.isAvailable
                        ? 'border-bege-escuro/50 text-bege-medio'
                        : 'border-bege-escuro/20 text-bege-escuro/30 line-through'
                    }`}
                  >
                    <span>{TIPO_LABEL[card.cardType]}</span>
                    {card.isAvailable && (
                      <button
                        onClick={() => handleUsar(card.id)}
                        disabled={isPending}
                        className="text-[9px] border border-bege-escuro/30 px-1.5 py-0.5 hover:border-bege-medio hover:text-bege-claro transition"
                      >
                        Usar
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {cartasDisponiveis.length === 0 && (
                <p className="text-[11px] text-bege-escuro/30 italic mt-2">Nenhuma carta guardada disponível.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── ESTATÍSTICAS + PV/PM ── */}
      <div className="relative border border-bege-escuro/40 p-6 flex flex-col gap-6 backdrop-blur-sm shadow-card">

        {/* ── PV e PM ── */}
        <div>
          <div className="text-center w-full">
            <h2 className="text-md text-bege-medio tracking-[0.2em] font-title uppercase">Vitalidade</h2>
            <Image src="/assets/svgs/divider.svg" alt="" width={120} height={8} className="mx-auto my-2 opacity-80" />
          </div>

          <div className="space-y-5 mt-2">

            {/* PV */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-title text-sm text-bege-medio uppercase tracking-widest">Pontos de Vida</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => changePv(-1)}
                    disabled={pv <= 0}
                    className="w-6 h-6 border border-bege-escuro/40 text-bege-medio font-title text-sm flex items-center justify-center hover:border-bege-medio disabled:opacity-20 disabled:cursor-not-allowed transition"
                  >−</button>
                  <span className="font-mono text-sm text-bege-claro w-14 text-center">
                    {pv} / {pvMax}
                  </span>
                  <button
                    onClick={() => changePv(+1)}
                    disabled={pv >= pvMax}
                    className="w-6 h-6 border border-bege-escuro/40 text-bege-medio font-title text-sm flex items-center justify-center hover:border-bege-medio disabled:opacity-20 disabled:cursor-not-allowed transition"
                  >+</button>
                </div>
              </div>
              <div className="w-full h-1.5 rounded-sm overflow-hidden border border-roxo">
                <div
                  className={`h-full rounded-sm transition-all duration-300 ${pvBarColor}`}
                  style={{ width: `${pvPct}%` }}
                />
              </div>

              {/* badges de condição automática */}
              {autoConditions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {autoConditions.map((c) => (
                    <span
                      key={c.label}
                      className={`text-[10px] font-title uppercase tracking-widest border px-2 py-0.5 ${c.color}`}
                    >
                      {c.label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* PM */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-title text-sm text-bege-medio uppercase tracking-widest">Pontos de Mana</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => changePm(-1)}
                    disabled={pm <= 0}
                    className="w-6 h-6 border border-bege-escuro/40 text-bege-medio font-title text-sm flex items-center justify-center hover:border-bege-medio disabled:opacity-20 disabled:cursor-not-allowed transition"
                  >−</button>
                  <span className="font-mono text-sm text-bege-claro w-14 text-center">
                    {pm} / {pmMax}
                  </span>
                  <button
                    onClick={() => changePm(+1)}
                    disabled={pm >= pmMax}
                    className="w-6 h-6 border border-bege-escuro/40 text-bege-medio font-title text-sm flex items-center justify-center hover:border-bege-medio disabled:opacity-20 disabled:cursor-not-allowed transition"
                  >+</button>
                </div>
              </div>
              <div className="w-full h-1.5 rounded-sm overflow-hidden border border-roxo">
                <div
                  className="h-full bg-purple-400 rounded-sm transition-all duration-300"
                  style={{ width: `${pmPct}%` }}
                />
              </div>
            </div>

          </div>
        </div>

        {/* ── atributos ── */}
        <div>
          <div className="text-center w-full">
            <h2 className="text-md text-bege-medio tracking-[0.2em] font-title uppercase">Atributos</h2>
            <Image src="/assets/svgs/divider.svg" alt="" width={120} height={8} className="mx-auto my-2 opacity-80" />
          </div>
          <div className="space-y-4 mt-2">
            {Object.entries(character.stats).map(([key, value]) => (
              <div key={key} className="space-y-1.5">
                <div className="flex justify-between text-[11px] uppercase tracking-widest text-bege-escuro">
                  <span className="font-title text-sm capitalize">{key}</span>
                  <span className="font-mono text-sm">{value}</span>
                </div>
                <div className="w-full h-1.5 rounded-sm overflow-hidden border border-roxo">
                  <div className="h-full bg-bege-medio rounded-sm transition-all duration-500" style={{ width: `${(value / 20) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}