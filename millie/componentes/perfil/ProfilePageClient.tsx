'use client'

import { useState } from 'react'
import Image from 'next/image'
import NoCampaign from '@/componentes/NoCampaign'
import MasterDashboard from '@/componentes/perfil/MasterDashboard'
import CreateCharForm from '@/componentes/perfil/CreateCharForm'
import ProfileGrid from '@/componentes/perfil/ProfileGrid'
import CriarCampanhaModal from '@/componentes/modais/CriarCampanhaModal'
import EntrarCampanhaModal from '@/componentes/modais/EntrarCampanhaModal'
import { useCampaign } from '@/lib/contexts/CampaignContext'
import type { ProfileCharacter } from '@/lib/types/profile'

interface Props {
  username: string
  myCharacter: ProfileCharacter | null
  activeConditions?: { id: string; type: string }[]
}

export default function ProfilePageClient({ username, myCharacter,activeConditions = [] }: Props) {
  const { hasCampaign, isMaster, activeCampaign } = useCampaign()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isJoinOpen, setIsJoinOpen] = useState(false)

  // 1. Sem campanha ativa
  if (!hasCampaign) {
    return (
      <div className="relative min-h-screen w-full p-8 md:p-12 block bg-roxo-escuro shadow-header">
        <PageCorners />
        <div className="max-w-5xl mx-auto pt-16 relative z-10">
          <NoCampaign
            message="As informações do seu perfil só aparecem depois que você entra em uma campanha ativa."
            onCreate={() => setIsCreateOpen(true)}
            onJoin={() => setIsJoinOpen(true)}
          />
        </div>
        <CriarCampanhaModal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
        <EntrarCampanhaModal open={isJoinOpen} onClose={() => setIsJoinOpen(false)} />
      </div>
    )
  }

  // 2. Mestre
  if (isMaster) {
    return (
      <div className="relative min-h-screen w-full p-8 block bg-roxo-escuro shadow-header">
        <PageCorners />
        <div className="max-w-5xl mx-auto pt-16 px-4 md:px-12 relative z-10">
          <MasterDashboard />
        </div>
      </div>
    )
  }

  // 3. Jogador sem ficha
  if (!myCharacter) {
    return (
      <div className="relative min-h-screen w-full p-8 block bg-roxo-escuro shadow-header">
        <PageCorners />
        <div className="max-w-5xl mx-auto pt-16 px-4 md:px-12 relative z-10">
          <CreateCharForm />
        </div>
      </div>
    )
  }

  // 4. Jogador com ficha
  return (
     <div className="relative min-h-screen w-full p-8 block bg-roxo-escuro shadow-header">
      <PageCorners />
      <div className="max-w-5xl mx-auto pt-16 px-4 md:px-12 relative z-10">
        <ProfileGrid
          character={myCharacter as ProfileCharacter}
          username={username}
          activeConditions={activeConditions}
        />
      </div>
    </div>
  )
}

function PageCorners() {
  return (
    <>
      <Image src="/assets/svgs/corner-left-top.svg" alt="" width={100} height={100} className="pointer-events-none absolute left-0 top-0 m-0 block h-19 w-19 md:h-25 md:w-25 z-0" />
      <Image src="/assets/svgs/corner-right-top.svg" alt="" width={100} height={100} className="pointer-events-none absolute right-0 top-0 m-0 block h-19 w-19 md:h-25 md:w-25 z-0" />
      <Image src="/assets/svgs/corner-left-bottom.svg" alt="" width={100} height={100} className="pointer-events-none absolute bottom-0 left-0 m-0 block h-19 w-19 md:h-25 md:w-25 z-0" />
      <Image src="/assets/svgs/corner-right-bottom.svg" alt="" width={100} height={100} className="pointer-events-none absolute bottom-0 right-0 m-0 block h-19 w-19 md:h-25 md:w-25 z-0" />
    </>
  )
}