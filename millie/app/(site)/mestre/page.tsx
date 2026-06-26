'use client'

import { useEffect, useState } from 'react'
import { useCampaign } from '@/lib/contexts/CampaignContext'
import { getMasterPageData } from '@/app/actions/character'
import MestreInvite from '@/componentes/mestre/MestreInvite'
import MestreJogadores from '@/componentes/mestre/MestreJogadores'
import MestreEvolucao from '@/componentes/mestre/MestreEvolucao'
import MestreTaro from '@/componentes/mestre/MestreTaro'
import type { MasterPlayer, MasterCharacter } from '@/lib/types/character'

type RawTarotDraw = {
  id: string
  readingType: string
  question: string
  cards: string[]
  sacrifice: string
  sacrificeIsPermanent: boolean
  hadJoker: boolean
  drawnAt: Date
  characterId: string
}

type TarotDraw = RawTarotDraw & { characterName: string }

type MasterData = {
  inviteCode:           string
  campaignName:         string
  players:              MasterPlayer[]
  characters:           MasterCharacter[]
  eligibleForEvolution: MasterCharacter[]
  allTarotDraws:        TarotDraw[]
}

export default function MestrePage() {
  const { isMaster, hasCampaign, loading: ctxLoading } = useCampaign()
  const [data, setData]       = useState<MasterData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMasterPageData()
      .then((d) => setData(d as unknown as MasterData))
      .finally(() => setLoading(false))
  }, [])

  if (ctxLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="font-title text-sm tracking-widest uppercase text-bege-escuro/50 animate-pulse">
          Carregando painel do mestre...
        </p>
      </div>
    )
  }

  if (!hasCampaign || !isMaster || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="font-title text-sm text-bege-escuro/40 tracking-wide">
          Acesso restrito ao Mestre da campanha ativa.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-10 pb-20">
      <div className="border-b border-roxo pb-4">
        <h1 className="font-title text-2xl text-bege-medio tracking-[0.2em] uppercase">
          Painel do Mestre
        </h1>
        <p className="text-xs text-bege-escuro/60 italic tracking-wide mt-1">
          {data.campaignName}
        </p>
      </div>

      <MestreInvite inviteCode={data.inviteCode} />
      <MestreJogadores players={data.players} />
      <MestreEvolucao eligible={data.eligibleForEvolution} />
      <MestreTaro draws={data.allTarotDraws} />
    </div>
  )
}