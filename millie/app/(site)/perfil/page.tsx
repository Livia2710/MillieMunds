import { auth } from '@/auth'
import { getMyCharacter } from '@/app/actions/character'
import { getCharactersByActiveCampaign } from '@/app/actions/character'
import ProfilePageClient from '@/componentes/perfil/ProfilePageClient'

export default async function ProfilePage() {
  const session = await auth()
  const username = session?.user?.name ?? session?.user?.email ?? ''
  const myCharacter = await getMyCharacter()

  return (
    <ProfilePageClient
      username={username}
      myCharacter={myCharacter}
    />
  )
}