'use client'

import Image from 'next/image'
import type { ProfileCharacter } from '@/lib/types/profile'
import ConditionBadges from './ConditionBadges'
import type { AnyCondition } from '@/app/actions/condition'

type ActiveCondition = {
  id: string
  type: string
}

interface ProfileHeaderProps {
  character?: ProfileCharacter
  username: string
  isMaster?: boolean
  activeConditions?: ActiveCondition[]
}

export default function ProfileHeader({
  character,
  username,
  isMaster,
  activeConditions = [],
}: ProfileHeaderProps) {
  const displayName  = isMaster ? username : (character?.name || username)
  const xpPercentage = character ? (character.xp / character.maxXp) * 100 : 0

  const renderCategoryAttribute = (char: ProfileCharacter) => {
    switch (char.category) {
      case 'aluno':     return { label: 'Ano Escolar', value: `${char.year}º Ano` }
      case 'professor': return { label: 'Matéria',     value: char.subject }
      case 'npc':       return { label: 'Ocupação',    value: char.occupation }
      case 'monstro':   return { label: 'Perigo',      value: char.dangerLevel }
      default:          return { label: 'Tipo',        value: 'Desconhecido' }
    }
  }

  const dynamicAttr = character ? renderCategoryAttribute(character) : null

  return (
    <div className="relative w-full p-8 rounded-lg mb-6 backdrop-blur-sm">
      <div className="flex flex-col md:flex-row items-center gap-8">

        {/* Avatar */}
        <div className="relative w-40 h-40 rounded-full border-2 border-bege-medio overflow-hidden">
          {character?.image ? (
            <Image src={character.image} alt={displayName} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-bege-claro text-4xl font-serif">
              ?
            </div>
          )}
        </div>

        {/* Informações */}
        <div className="flex-1 w-full space-y-4">
          <div>
            <h1 className="text-3xl text-bege-medio tracking-wide font-title uppercase">
              {displayName}
            </h1>
            <p className="font-title text-sm text-bege-escuro uppercase tracking-wider">
              {isMaster
                ? 'Mestre da Campanha'
                : `${character?.category} — Nível ${character?.level || 1}`}
            </p>
          </div>

          {/* Barra de XP */}
          {!isMaster && character && (
            <div className="space-y-1 w-full max-w-xl">
              <div className="flex justify-between text-xs font-mono">
                <span>PROGRESSO</span>
                <span>{character.xp}/{character.maxXp} EXP</span>
              </div>
              <div className="w-full h-2 bg-roxo-escuro rounded-full overflow-hidden border border-bege-medio/20">
                <div
                  className="h-full bg-gradient-to-r from-bege-escuro to-bege-claro transition-all duration-500"
                  style={{ width: `${xpPercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Grid de atributos */}
          {!isMaster && character && dynamicAttr && (
            <div className="grid grid-cols-4 gap-4 pt-2 max-w-xl text-center md:text-left">
              <div>
                <span className="block text-[10px] text-bege-escuro/40 uppercase tracking-widest">Mundo</span>
                <span className="text-base text-bege-claro font-title capitalize">{character.worldSlug}</span>
              </div>
              <div>
                <span className="block text-[10px] text-bege-escuro/40 uppercase tracking-widest">{dynamicAttr.label}</span>
                <span className="text-base text-bege-claro font-title truncate block">{dynamicAttr.value}</span>
              </div>
              <div>
                <span className="block text-[10px] text-bege-escuro/40 uppercase tracking-widest">Elemento</span>
                <span className="text-base text-bege-claro font-title capitalize">{character.element}</span>
              </div>
              <div className="flex flex-col items-center md:items-start">
                <span className="block text-[10px] text-bege-escuro/40 uppercase tracking-widest mb-1">Rank</span>
                <div className="relative w-6 h-6">
                  <Image src={`/assets/svgs/${character.rank}.svg`} alt={`Rank ${character.rank}`} fill />
                </div>
              </div>
            </div>
          )}

          {/* Badges de condição */}
          {!isMaster && character && (
            <ConditionBadges
              pv={character.pv}
              pvMax={character.pvMax}
              activeConditions={activeConditions}
            />
          )}
        </div>
      </div>
    </div>
  )
}