import { getCharactersByActiveCampaign } from '@/app/actions/character'
import { getActiveCampaign } from '@/app/actions/campaign'
import PersonagensClient from '@/componentes/personagens/PersonagensClient'

export default async function PersonagensPage() {
  const [rawCharacters, activeCampaign] = await Promise.all([
    getCharactersByActiveCampaign(),
    getActiveCampaign(),
  ])

  const isMaster = activeCampaign?.role === 'MASTER'

  // A action já retorna race como string — adapta para o formato que PersonagensClient espera
  const characters = rawCharacters.map((c) => ({
    ...c,
    race: { name: c.race as string },
  }))

  return (
    <PersonagensClient
      characters={characters}
      isMaster={isMaster}
      hasCampaign={!!activeCampaign}
    />
  )
}