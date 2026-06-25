import { getActiveCampaign } from '@/app/actions/campaign'
import HabilidadesPageClient from '@/componentes/habilidades/HabilidadesPageClient'

export default async function HabilidadesPage() {
  const activeCampaign = await getActiveCampaign()

  return (
    <HabilidadesPageClient
      isMaster={activeCampaign?.role === 'MASTER'}
      hasCampaign={!!activeCampaign}
    />
  )
}