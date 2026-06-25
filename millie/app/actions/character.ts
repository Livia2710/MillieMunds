'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import type { CharacterElement, CharacterRank, CharacterCategory } from '@/lib/types/character'


export async function getCharactersByActiveCampaign() {
  const session = await auth()
  if (!session?.user?.id) return []

  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true },
    include: {
      campaign: {
        include: {
          characters: {
            include: { race: true, skills: true }
          },
          items: true
        }
      }
    }
  })

  if (!membership) return []

  return membership.campaign.characters.map((char) => ({
    ...char,
    race: char.race.name,
    element: char.element as CharacterElement,
    rank: char.rank as CharacterRank,
    category: char.category as CharacterCategory,
    stats: {
      agilidade: char.agilidade,
      inteligencia: char.inteligencia,
      forca: char.forca,
      vigor: char.vigor,
      sorte: char.sorte,
    },
    inventory: membership.campaign.items.filter((i) => i.ownerId === char.id),
  }))
}
export async function getCharacterById(id: string) {
  const session = await auth()
  if (!session?.user?.id) return null

  const char = await prisma.character.findFirst({
    where: {
      id,
      campaign: { members: { some: { userId: session.user.id } } }
    },
    include: {
      race: true,
      skills: true,
      campaign: { include: { items: true } }
    }
  })

  if (!char) return null

  return {
    ...char,
    race: char.race.name,
    element: char.element as CharacterElement,
    rank: char.rank as CharacterRank,
    category: char.category as CharacterCategory,
    stats: {
      agilidade: char.agilidade,
      inteligencia: char.inteligencia,
      forca: char.forca,
      vigor: char.vigor,
      sorte: char.sorte,
    },
    inventory: char.campaign.items.filter((i) => i.ownerId === id),
  }
}

export async function getMyCharacter() {
  const session = await auth()
  if (!session?.user?.id) return null

  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true },
  })
  if (!membership) return null

  const char = await prisma.character.findFirst({
    where: {
      campaignId: membership.campaignId,
      playerId: session.user.id,
    },
    include: {
      race: true,
      skills: true,
      campaign: { include: { items: true } }
    }
  })

  if (!char) return null

  return {
    ...char,
    race: char.race.name,
    element: char.element as CharacterElement,
    rank: char.rank as CharacterRank,
    category: char.category as CharacterCategory,
    stats: {
      agilidade: char.agilidade,
      inteligencia: char.inteligencia,
      forca: char.forca,
      vigor: char.vigor,
      sorte: char.sorte,
    },
    inventory: char.campaign.items.filter((i) => i.ownerId === char.id),
  }
}

export async function unlockCharacter(characterId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  await prisma.character.update({
    where: { id: characterId },
    data: { isLocked: false }
  })

  revalidatePath('/personagens')
}

export async function createCharacter(data: {
  name: string
  category: string
  raceId: string
  element: string
  worldSlug: string
  image?: string
  year?: number
  subject?: string
  occupation?: string
  dangerLevel?: string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true, role: 'MASTER' },
  })
  if (!membership) throw new Error('Sem campanha ativa como Mestre')

  await prisma.character.create({
    data: {
      name: data.name,
      category: data.category,
      element: data.element,
      worldSlug: data.worldSlug,
      rank: 'E',
      raceId: data.raceId,
      campaignId: membership.campaignId,
      image: data.image,    
      year: data.year,
      subject: data.subject,
      occupation: data.occupation,
      dangerLevel: data.dangerLevel,
    },
  })

  revalidatePath('/personagens')
}

export async function createPlayerCharacter(data: {
  name: string
  category: string
  raceId: string
  element: string
  worldSlug: string
  image?: string
  year?: number
  subject?: string
  occupation?: string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true },
  })
  if (!membership) throw new Error('Sem campanha ativa')

  await prisma.character.create({
    data: {
      name: data.name,
      category: data.category,
      element: data.element,
      worldSlug: data.worldSlug,
      rank: 'E',
      isLocked: false,
      raceId: data.raceId,
      campaignId: membership.campaignId,
      playerId: session.user.id,
      image: data.image,    
      year: data.year,
      subject: data.subject,
      occupation: data.occupation,
    },
  })

  revalidatePath('/perfil')
}

export async function getUniverses() {
  return prisma.universe.findMany({
    include: {
      worlds: {
        include: { races: true }
      }
    }
  })
}