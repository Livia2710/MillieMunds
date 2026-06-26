'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Users, Plus, Minus } from 'lucide-react'
import { SectionTitle, Empty } from './MestreUI'
import IniciarLeituraModal from '@/componentes/modais/IniciarLeituraModal'
import { addXp } from '@/app/actions/character'
import { addCondition, removeCondition } from '@/app/actions/condition'
import { MANUAL_CONDITIONS, CONDITION_LABELS } from '@/lib/utils/conditions'
import type { ManualCondition } from '@/lib/utils/conditions'
import type { MasterPlayer, MasterCharacter } from '@/lib/types/character'

const XP_PRESETS = [50, 100, 250, 500]

export default function MestreJogadores({ players }: { players: MasterPlayer[] }) {
  const [leituraChar, setLeituraChar]  = useState<{ id: string; name: string } | null>(null)
  const [expandedId,  setExpandedId]   = useState<string | null>(null)
  const [xpInput,     setXpInput]      = useState<Record<string, string>>({})
  const [feedback,    setFeedback]     = useState<Record<string, string>>({})
  const [isPending,   startTransition] = useTransition()

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  function showFeedback(charId: string, msg: string) {
    setFeedback((prev) => ({ ...prev, [charId]: msg }))
    setTimeout(() => setFeedback((prev) => ({ ...prev, [charId]: '' })), 3000)
  }

  function handleAddXp(char: MasterCharacter, amount: number) {
    startTransition(async () => {
      try {
        const result = await addXp(char.id, amount)
        showFeedback(
          char.id,
          result.leveledUp
            ? `+${amount} XP · Subiu para nível ${result.newLevel}!`
            : `+${amount} XP`
        )
      } catch (e: any) {
        showFeedback(char.id, e.message)
      }
    })
  }

  function handleCustomXp(char: MasterCharacter) {
    const val = parseInt(xpInput[char.id] ?? '0')
    if (!val || val <= 0) return
    handleAddXp(char, val)
    setXpInput((prev) => ({ ...prev, [char.id]: '' }))
  }

  function handleAddCondition(charId: string, type: ManualCondition) {
    startTransition(async () => {
      try {
        await addCondition(charId, type)
        showFeedback(charId, `Condição "${CONDITION_LABELS[type]}" aplicada.`)
      } catch (e: any) {
        showFeedback(charId, e.message)
      }
    })
  }

  function handleRemoveCondition(charId: string, conditionId: string, label: string) {
    startTransition(async () => {
      try {
        await removeCondition(conditionId)
        showFeedback(charId, `Condição "${label}" removida.`)
      } catch (e: any) {
        showFeedback(charId, e.message)
      }
    })
  }

  // resto do JSX sem nenhuma mudança — só substitui os tipos inline por MasterCharacter
  return (
    <section className="space-y-3">
      <SectionTitle icon={<Users size={14} />} label="Jogadores" />

      {players.length === 0 ? (
        <Empty label="Nenhum jogador na campanha ainda." />
      ) : (
        <div className="flex flex-col gap-3">
          {players.map((player) => {
            const char       = player.character
            const isExpanded = expandedId === char?.id

            return (
              <div key={player.userId} className="border border-bege-escuro/30 bg-roxo-escuro/40">

                <div className="flex items-center gap-4 p-4">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border border-bege-escuro/30 bg-roxo-escuro shrink-0">
                    {player.avatar ? (
                      <Image src={player.avatar} alt={player.username ?? ''} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-bege-escuro/40 font-title text-sm">?</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-title text-bege-claro truncate">
                      {player.username ?? player.email}
                    </p>
                    {char ? (
                      <Link
                        href={`/perfil/${char.id}`}
                        className="text-[11px] text-bege-escuro/60 hover:text-bege-medio transition truncate block mt-0.5"
                      >
                        {char.name} · Nível {char.level} · {char.rank}
                      </Link>
                    ) : (
                      <p className="text-[11px] text-bege-escuro/40 italic mt-0.5">Sem personagem</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {char && (
                      <>
                        <div className="relative w-6 h-6 opacity-60">
                          <Image src={`/assets/svgs/${char.rank}.svg`} alt={char.rank} fill className="object-contain" />
                        </div>
                        <button
                          onClick={() => setLeituraChar({ id: char.id, name: char.name })}
                          className="text-[10px] font-title uppercase tracking-widest border border-bege-escuro/30 px-2 py-1 text-bege-escuro/60 hover:border-bege-medio hover:text-bege-medio transition"
                        >
                          Tarô
                        </button>
                        <button
                          onClick={() => toggleExpand(char.id)}
                          className={`text-[10px] font-title uppercase tracking-widest border px-2 py-1 transition ${
                            isExpanded
                              ? 'border-bege-medio text-bege-medio'
                              : 'border-bege-escuro/30 text-bege-escuro/60 hover:border-bege-medio hover:text-bege-medio'
                          }`}
                        >
                          {isExpanded ? 'Fechar' : 'Gerir'}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {char && isExpanded && (
                  <div className="border-t border-bege-escuro/20 p-4 space-y-5">

                    {feedback[char.id] && (
                      <p className="font-title text-xs uppercase tracking-wider text-terra">
                        {feedback[char.id]}
                      </p>
                    )}

                    <div className="space-y-2">
                      <p className="font-title text-[10px] uppercase tracking-[0.18em] text-bege-escuro/50">
                        Conceder XP · atual {char.xp}/{char.maxXp}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {XP_PRESETS.map((amount) => (
                          <button
                            key={amount}
                            onClick={() => handleAddXp(char, amount)}
                            disabled={isPending}
                            className="border border-bege-escuro/30 px-3 py-1.5 font-title text-[10px] uppercase tracking-widest text-bege-escuro/60 hover:border-bege-medio hover:text-bege-medio transition disabled:opacity-40"
                          >
                            +{amount}
                          </button>
                        ))}
                        <div className="flex gap-1">
                          <input
                            type="number"
                            min={1}
                            placeholder="Outro"
                            value={xpInput[char.id] ?? ''}
                            onChange={(e) => setXpInput((prev) => ({ ...prev, [char.id]: e.target.value }))}
                            className="w-20 border border-bege-escuro/30 bg-transparent px-2 py-1.5 font-title text-[10px] text-bege-claro outline-none placeholder:text-bege-escuro/30"
                          />
                          <button
                            onClick={() => handleCustomXp(char)}
                            disabled={isPending}
                            className="border border-bege-escuro/30 px-3 py-1.5 font-title text-[10px] uppercase tracking-widest text-bege-escuro/60 hover:border-bege-medio hover:text-bege-medio transition disabled:opacity-40"
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {char.activeConditions.length > 0 && (
                      <div className="space-y-2">
                        <p className="font-title text-[10px] uppercase tracking-[0.18em] text-bege-escuro/50">
                          Condições ativas
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {char.activeConditions.map((cond) => (
                            <button
                              key={cond.id}
                              onClick={() => handleRemoveCondition(char.id, cond.id, CONDITION_LABELS[cond.type as ManualCondition] ?? cond.type)}
                              disabled={isPending}
                              className="flex items-center gap-1.5 border border-red-500/30 bg-red-500/10 px-2.5 py-1 font-title text-[9px] uppercase tracking-widest text-red-400 hover:border-red-400 transition disabled:opacity-40"
                            >
                              <Minus size={8} />
                              {CONDITION_LABELS[cond.type as ManualCondition] ?? cond.type}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <p className="font-title text-[10px] uppercase tracking-[0.18em] text-bege-escuro/50">
                        Aplicar condição
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {MANUAL_CONDITIONS.map((type) => {
                          const alreadyActive = char.activeConditions.some((c) => c.type === type)
                          return (
                            <button
                              key={type}
                              onClick={() => handleAddCondition(char.id, type)}
                              disabled={isPending || alreadyActive}
                              className="border border-bege-escuro/30 px-2.5 py-1 font-title text-[9px] uppercase tracking-widest text-bege-escuro/60 hover:border-bege-medio hover:text-bege-medio transition disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              {CONDITION_LABELS[type]}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {leituraChar && (
        <IniciarLeituraModal
          isOpen={true}
          onClose={() => setLeituraChar(null)}
          characterId={leituraChar.id}
          characterName={leituraChar.name}
        />
      )}
    </section>
  )
}