'use client'

import { useState } from 'react'
import type { Character, CharacterRank, CharacterElement } from '@/lib/types/character'
import NoCampaign from '@/componentes/NoCampaign'
import CharactersGrid from '@/componentes/personagens/CharactersGrid'
import CriarCampanhaModal from '@/componentes/modais/CriarCampanhaModal'
import EntrarCampanhaModal from '@/componentes/modais/EntrarCampanhaModal'

// Tipo que vem do Prisma — separado do tipo de UI
type DbCharacter = {
  id: string
  name: string
  category: string
  element: string
  rank: string
  image: string | null
  portraitImage: string | null
  worldSlug: string
  isLocked: boolean
  year: number | null
  subject: string | null
  occupation: string | null
  dangerLevel: string | null
  race: { name: string }
}

type Props = {
  characters: DbCharacter[]
  isMaster: boolean
  hasCampaign: boolean
}

export default function PersonagensClient({ characters, isMaster, hasCampaign }: Props) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isJoinOpen, setIsJoinOpen] = useState(false)

  const normalized: Character[] = characters.map((c) => {
    const base = {
      id: c.id,
      name: c.name,
      image: c.image ?? undefined,
      portraitImage: c.portraitImage ?? undefined,
      rank: c.rank as CharacterRank,
      element: c.element as CharacterElement,
      race: c.race.name,
      worldSlug: c.worldSlug,
      isLocked: c.isLocked,
    }

    if (c.category === 'aluno') {
      return { ...base, category: 'aluno' as const, year: (c.year ?? 1) as 1|2|3|4|5 }
    }
    if (c.category === 'professor') {
      return { ...base, category: 'professor' as const, subject: c.subject ?? '' }
    }
    if (c.category === 'npc') {
      return { ...base, category: 'npc' as const, occupation: c.occupation ?? '' }
    }
    return {
      ...base,
      category: 'monstro' as const,
      dangerLevel: (c.dangerLevel ?? 'Iniciante') as 'Iniciante' | 'Intermediário' | 'Avançado' | 'Calamidade',
    }
  })

  const visible = isMaster ? normalized : normalized.filter((c) => !c.isLocked)

  if (!hasCampaign) {
    return (
      <div className="relative block min-h-screen w-full bg-roxo-escuro p-8 shadow-header md:p-12">
        <NoCampaign
          message="Os personagens só aparecem depois que você entra em uma campanha ou cria a sua própria."
          onCreate={() => setIsCreateOpen(true)}
          onJoin={() => setIsJoinOpen(true)}
        />
        <CriarCampanhaModal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
        <EntrarCampanhaModal open={isJoinOpen} onClose={() => setIsJoinOpen(false)} />
      </div>
    )
  }

  return (
      <div className="relative block min-h-screen w-full">
      <CharactersGrid
        characters={visible}
        isMaster={isMaster}
      />
    </div>
  )
}
