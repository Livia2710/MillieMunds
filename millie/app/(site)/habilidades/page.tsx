import { getActiveCampaign } from '@/app/actions/campaign'
import { getMyCharacter }    from '@/app/actions/character'
import { getSkillsByCharacter } from '@/app/actions/skill'
import { getCharactersByActiveCampaign } from '@/app/actions/character'
import HabilidadesPageClient from '@/componentes/habilidades/HabilidadesPageClient'

export default async function HabilidadesPage() {
  const activeCampaign = await getActiveCampaign()
  const isMaster       = activeCampaign?.role === 'MASTER'
  const hasCampaign    = !!activeCampaign

  if (!hasCampaign) {
    return <HabilidadesPageClient isMaster={false} hasCampaign={false} />
  }

  if (isMaster) {
    const characters = await getCharactersByActiveCampaign()
    return (
      <HabilidadesPageClient
        isMaster={true}
        hasCampaign={true}
        characters={characters as any}
      />
    )
  }

  // jogador — busca o personagem e as skills
  const myChar  = await getMyCharacter()
  const skillData = myChar ? await getSkillsByCharacter(myChar.id) : null

  return (
    <HabilidadesPageClient
      isMaster={false}
      hasCampaign={true}
      skillData={skillData}
    />
  )
}