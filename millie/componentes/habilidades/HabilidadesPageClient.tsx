'use client'

import { useState } from 'react'
import Image from 'next/image'
import NoCampaign from '@/componentes/NoCampaign'
import CriarCampanhaModal from '@/componentes/modais/CriarCampanhaModal'
import EntrarCampanhaModal from '@/componentes/modais/EntrarCampanhaModal'
import HabilidadesClient from './HabilidadesClient'
import MasterSkillDashboard from './MasterSkillDashboard'
import type { ProfileCharacter } from '@/lib/types/profile'

type SkillData = Awaited<ReturnType<typeof import('@/app/actions/skill').getSkillsByCharacter>>

type Props = {
  isMaster:    boolean
  hasCampaign: boolean
  // jogador: personagem + skills já resolvidos no server
  skillData?:  SkillData
  // mestre: lista de personagens da campanha
  characters?: ProfileCharacter[]
}

export default function HabilidadesPageClient({
  isMaster,
  hasCampaign,
  skillData,
  characters = [],
}: Props) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isJoinOpen,   setIsJoinOpen]   = useState(false)

  if (!hasCampaign) {
    return (
      <PageShell>
        <NoCampaign
          message="As habilidades só ficam disponíveis depois que você entra em uma campanha ativa."
          onCreate={() => setIsCreateOpen(true)}
          onJoin={()   => setIsJoinOpen(true)}
        />
        <CriarCampanhaModal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
        <EntrarCampanhaModal open={isJoinOpen}   onClose={() => setIsJoinOpen(false)} />
      </PageShell>
    )
  }

  if (isMaster) {
    return (
      <PageShell>
        <MasterSkillDashboard characters={characters} />
      </PageShell>
    )
  }

  if (!skillData) {
    return (
      <PageShell>
        <p className="py-16 text-center font-title text-sm uppercase tracking-wider text-bege-medio/50">
          Crie um personagem para ver sua árvore de habilidades.
        </p>
      </PageShell>
    )
  }

  // monta o shape que HabilidadesClient espera
  const tree = {
    race:   skillData.race,
    element: skillData.element as any,
    skills: skillData.skills,
  }

  const character = {
    id:      skillData.characterId,
    name:    skillData.characterName,
    race:    skillData.race,
    element: skillData.element as any,
    level:   skillData.level,
    xp:      skillData.xp,
    maxXp:   skillData.maxXp,
  }

  return (
    <PageShell>
      <HabilidadesClient character={character as any} tree={tree as any} />
    </PageShell>
  )
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full bg-roxo-escuro shadow-header">
      <Image src="/assets/svgs/corner-left-top.svg"     alt="" width={100} height={100} className="pointer-events-none absolute left-0  top-0    h-19 w-19 md:h-25 md:w-25 z-0" />
      <Image src="/assets/svgs/corner-right-top.svg"    alt="" width={100} height={100} className="pointer-events-none absolute right-0 top-0    h-19 w-19 md:h-25 md:w-25 z-0" />
      <Image src="/assets/svgs/corner-left-bottom.svg"  alt="" width={100} height={100} className="pointer-events-none absolute bottom-0 left-0  h-19 w-19 md:h-25 md:w-25 z-0" />
      <Image src="/assets/svgs/corner-right-bottom.svg" alt="" width={100} height={100} className="pointer-events-none absolute bottom-0 right-0 h-19 w-19 md:h-25 md:w-25 z-0" />
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-10 pt-16 md:px-12 md:py-14">
        {children}
      </div>
    </div>
  )
}