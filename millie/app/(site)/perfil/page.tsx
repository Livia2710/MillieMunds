import { auth } from '@/auth'
import { getMyCharacter } from '@/app/actions/character'
import { getActiveCampaign } from '@/app/actions/campaign'
import ProfilePageClient from '@/componentes/perfil/ProfilePageClient'
import type { ProfileCharacter } from '@/lib/types/profile'
import type { CharacterRank, CharacterElement } from '@/lib/types/character'

export default async function ProfilePage() {
  const session = await auth()
  const username = session?.user?.name ?? session?.user?.email ?? ''

  const [rawCharacter, activeCampaign] = await Promise.all([
    getMyCharacter(),
    getActiveCampaign(),
  ])

  let myCharacter: ProfileCharacter | null = null

  if (rawCharacter) {
    const base = {
      id: rawCharacter.id,
      name: rawCharacter.name,
      image: rawCharacter.image ?? undefined,
      rank: rawCharacter.rank as CharacterRank,
      element: rawCharacter.element as CharacterElement,
      race: rawCharacter.race as string,
      worldSlug: rawCharacter.worldSlug,
      isLocked: rawCharacter.isLocked,
      level: rawCharacter.level,
      xp: rawCharacter.xp,
      maxXp: rawCharacter.maxXp,
      stats: rawCharacter.stats,
      inventory: [],
    }

    const cat = rawCharacter.category
    if (cat === 'aluno') {
      myCharacter = { ...base, category: 'aluno' as const, year: (rawCharacter.year ?? 1) as 1|2|3|4|5 }
    } else if (cat === 'professor') {
      myCharacter = { ...base, category: 'professor' as const, subject: rawCharacter.subject ?? '' }
    } else if (cat === 'npc') {
      myCharacter = { ...base, category: 'npc' as const, occupation: rawCharacter.occupation ?? '' }
    } else {
      myCharacter = { ...base, category: 'monstro' as const, dangerLevel: (rawCharacter.dangerLevel ?? 'Iniciante') as 'Iniciante'|'Intermediário'|'Avançado'|'Calamidade' }
    }
  }

  return (
    <ProfilePageClient
      username={username}
      myCharacter={myCharacter}
    />
  )
}