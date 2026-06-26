'use client'

import { useState, useTransition } from 'react'
import MillieModal from '@/componentes/ui/MillieModal'
import MillieSelect from '@/componentes/ui/MillieSelect'
import MillieTextarea from '@/componentes/ui/MillieTextarea'
import MillieInput from '@/componentes/ui/MillieInput'
import { PrimaryButton } from '@/componentes/PrimaryButton'
import { initiateTarotReading, completeTarotReading, getMasterPendingReading } from '@/app/actions/tarot'
import { useEffect } from 'react'

type Props = {
  isOpen: boolean
  onClose: () => void
  characterId: string
  characterName: string
}

const CARD_LABELS: Record<string, string> = {
  as: 'Ás', '2': '2', '3': '3', '4': '4', '5': '5',
  '6': '6', '7': '7', '8': '8', '9': '9', '10': '10',
  valete: 'Valete', cavaleiro: 'Cavaleiro', rainha: 'Rainha',
  rei: 'Rei', coringa: 'Coringa',
}

type Step = 'configurar' | 'aguardando_jogador' | 'definir_sacrificio' | 'concluida'

export default function IniciarLeituraModal({ isOpen, onClose, characterId, characterName }: Props) {
  const [step, setStep]                   = useState<Step>('configurar')
  const [readingType, setReadingType]     = useState<'COMUM' | 'PROFUNDA'>('COMUM')
  const [question, setQuestion]           = useState('')
  const [drawId, setDrawId]               = useState('')
  const [revealedCards, setRevealedCards] = useState<string[]>([])
  const [hadJoker, setHadJoker]           = useState(false)
  const [sacrifice, setSacrifice]         = useState('')
  const [isPermanent, setIsPermanent]     = useState(false)
  const [error, setError]                 = useState('')
  const [isPending, startTransition]      = useTransition()

  // polling — aguarda jogador revelar cartas
  useEffect(() => {
    if (step !== 'aguardando_jogador' || !drawId) return

    const interval = setInterval(async () => {
      const draw = await getMasterPendingReading(characterId)
      if (draw && draw.id === drawId && draw.status === 'cartas_reveladas') {
        setRevealedCards(draw.cards)
        setHadJoker(draw.hadJoker)
        setStep('definir_sacrificio')
        clearInterval(interval)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [step, drawId, characterId])

  function handleClose() {
    setStep('configurar')
    setReadingType('COMUM')
    setQuestion('')
    setDrawId('')
    setRevealedCards([])
    setHadJoker(false)
    setSacrifice('')
    setIsPermanent(false)
    setError('')
    onClose()
  }

  function handleIniciar() {
    if (!question.trim()) { setError('Digite a pergunta.'); return }
    setError('')
    startTransition(async () => {
      try {
        const draw = await initiateTarotReading({ characterId, readingType, question: question.trim() })
        setDrawId(draw.id)
        setStep('aguardando_jogador')
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erro ao iniciar leitura.')
      }
    })
  }

  function handleConcluir() {
    if (!sacrifice.trim()) { setError('Defina o sacrifício.'); return }
    setError('')
    startTransition(async () => {
      try {
        await completeTarotReading({ drawId, sacrifice: sacrifice.trim(), sacrificeIsPermanent: isPermanent })
        setStep('concluida')
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erro ao concluir leitura.')
      }
    })
  }

  const title =
    step === 'configurar'         ? `Leitura de Tarô — ${characterName}` :
    step === 'aguardando_jogador' ? 'Aguardando o Jogador...' :
    step === 'definir_sacrificio' ? 'Cartas Reveladas' :
                                    'Leitura Concluída'

  return (
    <MillieModal isOpen={isOpen} onClose={handleClose} title={title}>
      <div className="space-y-4">

        {/* ── STEP 1: configurar ── */}
        {step === 'configurar' && (
          <>
            <MillieSelect
              label="Tipo de Leitura"
              value={readingType}
              onChange={(e) => setReadingType(e.target.value as 'COMUM' | 'PROFUNDA')}
              options={[
                { value: 'COMUM',    label: 'Leitura Comum (3 cartas — sacrifício temporário)' },
                { value: 'PROFUNDA', label: 'Leitura Profunda (5 cartas — sacrifício permanente)' },
              ]}
            />
            <MillieTextarea
              label="Pergunta"
              placeholder="O que o jogador deseja saber?"
              rows={3}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex justify-end gap-3 border-t border-bege-escuro/20 pt-4">
              <button onClick={handleClose} className="font-title text-xs uppercase tracking-widest text-bege-medio/50 hover:text-bege-claro">
                Cancelar
              </button>
              <PrimaryButton onClick={handleIniciar} disabled={isPending}>
                {isPending ? 'Iniciando...' : 'Iniciar Leitura'}
              </PrimaryButton>
            </div>
          </>
        )}

        {/* ── STEP 2: aguardando jogador ── */}
        {step === 'aguardando_jogador' && (
          <div className="py-8 text-center space-y-4">
            <div className="flex justify-center gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-bege-medio/60 animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
            <p className="font-title text-sm text-bege-escuro/60 tracking-wide">
              Aguardando {characterName} revelar as cartas...
            </p>
            <p className="text-xs text-bege-escuro/40 italic">
              "{question}"
            </p>
          </div>
        )}

        {/* ── STEP 3: cartas reveladas, definir sacrifício ── */}
        {step === 'definir_sacrificio' && (
          <>
            <div>
              <p className="font-title text-xs uppercase tracking-widest text-bege-escuro/60 mb-2">
                Cartas Tiradas
              </p>
              <div className="flex flex-wrap gap-2">
                {revealedCards.map((card, i) => (
                  <span key={i} className="text-[11px] px-2 py-1 border border-bege-escuro/30 bg-roxo-escuro/60 text-bege-escuro font-mono uppercase">
                    {CARD_LABELS[card] ?? card}
                  </span>
                ))}
                {hadJoker && (
                  <span className="text-[11px] px-2 py-1 border border-purple-400/40 bg-purple-400/10 text-purple-400 font-mono uppercase">
                    Coringa
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-bege-escuro/50 italic">"{question}"</p>

            <MillieTextarea
              label="Sacrifício"
              placeholder="Descreva o preço que o jogador pagará..."
              rows={3}
              value={sacrifice}
              onChange={(e) => setSacrifice(e.target.value)}
            />

            <label className="flex items-center gap-3 cursor-pointer group">
              <div
                onClick={() => setIsPermanent((p) => !p)}
                className={`w-4 h-4 border transition flex items-center justify-center shrink-0 ${
                  isPermanent ? 'border-bege-medio bg-bege-medio' : 'border-bege-escuro/40'
                }`}
              >
                {isPermanent && <span className="text-roxo-escuro text-[10px] font-bold">✓</span>}
              </div>
              <span className="font-title text-xs uppercase tracking-widest text-bege-escuro/70 group-hover:text-bege-medio transition">
                Sacrifício permanente
                {hadJoker && <span className="ml-2 text-purple-400">(Coringa — pode tornar permanente)</span>}
              </span>
            </label>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <div className="flex justify-end gap-3 border-t border-bege-escuro/20 pt-4">
              <PrimaryButton onClick={handleConcluir} disabled={isPending}>
                {isPending ? 'Concluindo...' : 'Concluir Leitura'}
              </PrimaryButton>
            </div>
          </>
        )}

        {/* ── STEP 4: concluída ── */}
        {step === 'concluida' && (
          <div className="py-8 text-center space-y-4">
            <p className="font-title text-sm text-bege-medio tracking-wide">
              Leitura registrada.
            </p>
            <p className="text-xs text-bege-escuro/50 italic">
              O sacrifício foi aplicado ao personagem.
            </p>
            <div className="flex justify-center pt-2">
              <PrimaryButton onClick={handleClose}>Fechar</PrimaryButton>
            </div>
          </div>
        )}

      </div>
    </MillieModal>
  )
}