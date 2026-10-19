import { getAtlasData } from '@/app/actions/atlas'
import AtlasClient from '@/componentes/atlas/AtlasClient'

export default async function AtlasPage() {
  const data = await getAtlasData()
  return <AtlasClient data={data} />
}
