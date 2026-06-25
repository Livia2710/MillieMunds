'use client'

import { useState, useTransition } from 'react'
import type { Character, CharacterRank, CharacterElement } from '@/lib/types/character'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import NoCampaign from '@/componentes/NoCampaign'
import CharactersGrid from '@/componentes/personagens/CharactersGrid'
import CriarCampanhaModal from '@/componentes/modais/CriarCampanhaModal'
import EntrarCampanhaModal from '@/componentes/modais/EntrarCampanhaModal'
import { unlockCharacter } from '@/app/actions/character'

// Tipo que vem do Prisma — separado do tipo de UI
type DbCharacter = {
  id: string
  name: string
  category: string
  element: string
  rank: string
  image: string | null
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
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isJoinOpen, setIsJoinOpen] = useState(false)

  function handleUnlock(characterId: string) {
    startTransition(async () => {
      await unlockCharacter(characterId)
      router.refresh()
    })
  }

  const normalized: Character[] = characters.map((c) => {
    const base = {
      id: c.id,
      name: c.name,
      image: c.image ?? undefined,
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
        <PageCorners />
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
    <div className="relative block min-h-screen w-full bg-roxo-escuro shadow-header">
      <PageCorners />
      <CharactersGrid
        characters={visible}
        isMaster={isMaster}
        onUnlock={handleUnlock}
      />
    </div>
  )
}

function PageCorners() {
  return (
    <>
      <Image src="/assets/svgs/corner-left-top.svg" alt="" width={100} height={100} className="pointer-events-none absolute left-0 top-0 h-19 w-19 md:h-25 md:w-25" />
      <Image src="/assets/svgs/corner-right-top.svg" alt="" width={100} height={100} className="pointer-events-none absolute right-0 top-0 h-19 w-19 md:h-25 md:w-25" />
      <Image src="/assets/svgs/corner-left-bottom.svg" alt="" width={100} height={100} className="pointer-events-none absolute bottom-0 left-0 h-19 w-19 md:h-25 md:w-25" />
      <Image src="/assets/svgs/corner-right-bottom.svg" alt="" width={100} height={100} className="pointer-events-none absolute bottom-0 right-0 h-19 w-19 md:h-25 md:w-25" />
    </>
  )
}