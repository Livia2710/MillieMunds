import { getGrimoireCharacterData, getGrimoireData } from '@/app/actions/grimoire'
import GrimoireClient from '@/componentes/grimorio/GrimoireClient'

export const dynamic = 'force-dynamic'

export default async function GrimorioPage({ searchParams }: { searchParams: Promise<{ characterId?: string }> }) {
  const params = await searchParams
  const data = params.characterId ? await getGrimoireCharacterData(params.characterId) : await getGrimoireData()
  return <GrimoireClient data={data} />
}
