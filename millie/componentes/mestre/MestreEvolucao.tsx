'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { Swords } from 'lucide-react'
import { SectionTitle, Empty } from './MestreUI'
import { applyRaceEvolution } from '@/app/actions/character'
import type { RacePath } from '@/lib/generated/prisma'
import type { MasterCharacter } from '@/lib/types/character'

interface MestreEvolucaoProps {
  eligible: MasterCharacter[]
}

type Evolution = {
  id: string
  toRaceName: string
  path: RacePath
  levelRequired: number
}

type Character = {
  id: string
  name: string
  image: string | null
  level: number
  race: {
    name: string
    canAscend: boolean
    canCorrupt: boolean
    evolutions: Evolution[]
  }
}

const PATH_LABELS: Record<RacePath, string> = {
  ASCENSAO:    'Ascensão',
  CORRUPCAO:   'Corrupção',
  PERMANENCIA: 'Permanência',
}

const PATH_COLORS: Record<RacePath, string> = {
  ASCENSAO:    'text-yellow-400 border-yellow-400/40 bg-yellow-400/10',
  CORRUPCAO:   'text-red-400   border-red-400/40   bg-red-400/10',
  PERMANENCIA: 'text-blue-400  border-blue-400/40  bg-blue-400/10',
}

const PATH_BUTTON: Record<RacePath, string> = {
  ASCENSAO:    'border-yellow-400/50 text-yellow-400 hover:border-yellow-300 hover:text-yellow-300',
  CORRUPCAO:   'border-red-400/50   text-red-400   hover:border-red-300   hover:text-red-300',
  PERMANENCIA: 'border-blue-400/50  text-blue-400  hover:border-blue-300  hover:text-blue-300',
}

export default function MestreEvolucao({ eligible }: { eligible: Character[] }) {
  const [isPending,  startTransition] = useTransition()
  const [feedback,   setFeedback]     = useState<Record<string, string>>({})
  const [confirmed,  setConfirmed]    = useState<Record<string, RacePath | null>>({})

  function showFeedback(charId: string, msg: string) {
    setFeedback((prev) => ({ ...prev, [charId]: msg }))
    setTimeout(() => setFeedback((prev) => ({ ...prev, [charId]: '' })), 4000)
  }

  function handleConfirm(char: Character, path: RacePath) {
    // primeiro clique = pede confirmação
    if (confirmed[char.id] !== path) {
      setConfirmed((prev) => ({ ...prev, [char.id]: path }))
      return
    }

    // segundo clique = executa
    startTransition(async () => {
      try {
        const result = await applyRaceEvolution(char.id, path)
        if (result.newRaceName) {
          showFeedback(char.id, `${char.name} evoluiu para ${result.newRaceName}!`)
        } else {
          showFeedback(char.id, `${char.name} escolheu Permanência.`)
        }
        setConfirmed((prev) => ({ ...prev, [char.id]: null }))
      } catch (e: any) {
        showFeedback(char.id, e.message)
        setConfirmed((prev) => ({ ...prev, [char.id]: null }))
      }
    })
  }

  return (
    <section className="space-y-3">
      <SectionTitle icon={<Swords size={14} />} label="Ascensão & Corrupção" />

      {eligible.length === 0 ? (
        <Empty label="Nenhum personagem elegível para evolução no momento." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {eligible.map((char) => {
            const available  = char.race.evolutions.filter((e) => char.level >= e.levelRequired)
            const canStay    = !char.race.canAscend && !char.race.canCorrupt
            const pendingPath = confirmed[char.id]

            return (
              <div key={char.id} className="p-4 bg-roxo-escuro/40 border border-yellow-400/30 space-y-3">

                {/* Cabeçalho */}
                <div className="flex items-center gap-3">
                  <div className="relative w-9 h-9 rounded-full overflow-hidden border border-bege-escuro/30 bg-roxo-escuro shrink-0">
                    {char.image ? (
                      <Image src={char.image} alt={char.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-bege-escuro/40 font-title text-xs">?</div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-title text-bege-claro">{char.name}</p>
                    <p className="text-[11px] text-bege-escuro/50">{char.race.name} · Nível {char.level}</p>
                  </div>
                </div>

                {/* Feedback */}
                {feedback[char.id] && (
                  <p className="font-title text-[10px] uppercase tracking-wider text-terra">
                    {feedback[char.id]}
                  </p>
                )}

                {/* Caminhos disponíveis */}
                <div className="flex flex-wrap gap-2">
                  {available.map((evo) => {
                    const isPendingThis = pendingPath === evo.path
                    return (
                      <button
                        key={evo.id}
                        onClick={() => handleConfirm(char, evo.path)}
                        disabled={isPending}
                        className={`text-[10px] px-2 py-1 border font-title uppercase tracking-widest transition disabled:opacity-40 ${
                          isPendingThis
                            ? 'border-white/60 text-white bg-white/10'
                            : PATH_BUTTON[evo.path]
                        }`}
                      >
                        {isPendingThis
                          ? `Confirmar ${PATH_LABELS[evo.path]}?`
                          : `${PATH_LABELS[evo.path]} → ${evo.toRaceName}`
                        }
                      </button>
                    )
                  })}

                  {/* Permanência — sempre disponível */}
                  <button
                    onClick={() => handleConfirm(char, 'PERMANENCIA')}
                    disabled={isPending}
                    className={`text-[10px] px-2 py-1 border font-title uppercase tracking-widest transition disabled:opacity-40 ${
                      pendingPath === 'PERMANENCIA'
                        ? 'border-white/60 text-white bg-white/10'
                        : PATH_BUTTON['PERMANENCIA']
                    }`}
                  >
                    {pendingPath === 'PERMANENCIA' ? 'Confirmar Permanência?' : 'Permanência'}
                  </button>
                </div>

                {/* Aviso de duplo clique */}
                {pendingPath && (
                  <p className="font-title text-[9px] uppercase tracking-widest text-bege-escuro/40">
                    Clique novamente para confirmar · clique em outro para cancelar
                  </p>
                )}

                {/* Aviso original — aguardando jogador */}
                {!pendingPath && (
                  <p className="text-[10px] text-bege-escuro/40 italic">
                    A escolha pertence ao jogador — confirme apenas com a decisão dele.
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}