import { getCharactersByActiveCampaign } from '@/app/actions/character'
import { getActiveCampaign } from '@/app/actions/campaign'
import PersonagensClient from '@/componentes/personagens/PersonagensClient'

export default async function PersonagensPage() {
  const [characters, activeCampaign] = await Promise.all([
    getCharactersByActiveCampaign(),
    getActiveCampaign(),
  ])

  const isMaster = activeCampaign?.role === 'MASTER'

  return (
    <PersonagensClient
      characters={characters}
      isMaster={isMaster}
      hasCampaign={!!activeCampaign}
    />
  )
}