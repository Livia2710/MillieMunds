import { getItemsByActiveCampaign, getPlayerCharactersForActiveCampaign } from '@/app/actions/inventory'
import { getActiveCampaign } from '@/app/actions/campaign'
import InventarioClient from '@/componentes/inventario/InventarioClient'

export default async function InventarioPage() {
  const [items, activeCampaign, playerCharacters] = await Promise.all([
    getItemsByActiveCampaign(),
    getActiveCampaign(),
    getPlayerCharactersForActiveCampaign(),
  ])

  const isMaster = activeCampaign?.role === 'MASTER'

  return (
    <InventarioClient
      items={items}
      isMaster={isMaster}
      hasCampaign={!!activeCampaign}
      playerCharacters={playerCharacters}
    />
  )
}
