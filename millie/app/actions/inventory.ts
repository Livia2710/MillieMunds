'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getItemsByActiveCampaign() {
  const session = await auth()
  if (!session?.user?.id) return []

  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true },
    include: {
      campaign: {
        include: {
          items: { include: { chapters: true } }
        }
      }
    }
  })

  if (!membership) return []
  return membership.campaign.items
}

export async function unlockItem(itemId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true, role: 'MASTER' },
    select: { campaignId: true },
  })
  if (!membership) throw new Error('Sem campanha ativa como Mestre')

  const item = await prisma.inventoryItem.findFirst({
    where: { id: itemId, campaignId: membership.campaignId },
    select: { id: true },
  })
  if (!item) throw new Error('Item nÃ£o encontrado nesta campanha')

  await prisma.inventoryItem.update({
    where: { id: item.id },
    data: { isLocked: false }
  })

  revalidatePath('/inventario')
}

/** Entrega a pilha inteira de um item a um personagem de jogador da campanha ativa. */
export async function assignInventoryItem(itemId: string, characterId: string | null) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('NÃ£o autenticado')

  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true, role: 'MASTER' },
    select: { campaignId: true },
  })
  if (!membership) throw new Error('Sem campanha ativa como Mestre')

  const item = await prisma.inventoryItem.findFirst({
    where: { id: itemId, campaignId: membership.campaignId },
    select: { id: true },
  })
  if (!item) throw new Error('Item nÃ£o encontrado nesta campanha')

  if (characterId) {
    const character = await prisma.character.findFirst({
      where: { id: characterId, campaignId: membership.campaignId, playerId: { not: null } },
      select: { playerId: true },
    })
    if (!character?.playerId) throw new Error('Personagem de jogador nÃ£o encontrado nesta campanha')

    const playerMembership = await prisma.campaignMember.findFirst({
      where: { campaignId: membership.campaignId, userId: character.playerId, role: 'PLAYER' },
      select: { id: true },
    })
    if (!playerMembership) throw new Error('O personagem nÃ£o pertence a um jogador da campanha')
  }

  await prisma.inventoryItem.update({
    where: { id: item.id },
    data: { ownerId: characterId, ...(characterId ? { isLocked: false } : {}) },
  })

  revalidatePath('/inventario')
  revalidatePath('/perfil')
  revalidatePath('/personagens')
  revalidatePath('/mestre')
}

export async function transferInventoryItem(itemId: string, characterId: string | null, quantity: number) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('NÃ£o autenticado')

  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true, role: 'MASTER' },
    select: { campaignId: true },
  })
  if (!membership) throw new Error('Sem campanha ativa como Mestre')

  const item = await prisma.inventoryItem.findFirst({
    where: { id: itemId, campaignId: membership.campaignId },
    include: { chapters: true },
  })
  if (!item) throw new Error('Item nÃ£o encontrado nesta campanha')
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > item.quantity) {
    throw new Error('Quantidade invÃ¡lida para transferÃªncia')
  }
  if (item.category === 'livro' && quantity !== item.quantity) {
    throw new Error('Livros sÃ³ podem ser transferidos por inteiro')
  }

  if (characterId) {
    const character = await prisma.character.findFirst({
      where: { id: characterId, campaignId: membership.campaignId, playerId: { not: null } },
      select: { playerId: true },
    })
    if (!character?.playerId) throw new Error('Personagem de jogador nÃ£o encontrado nesta campanha')
    const playerMembership = await prisma.campaignMember.findFirst({
      where: { campaignId: membership.campaignId, userId: character.playerId, role: 'PLAYER' },
      select: { id: true },
    })
    if (!playerMembership) throw new Error('O personagem nÃ£o pertence a um jogador da campanha')
  }

  await prisma.$transaction(async (tx) => {
    if (quantity === item.quantity) {
      await tx.inventoryItem.update({
        where: { id: item.id },
        data: { ownerId: characterId, ...(characterId ? { isLocked: false } : {}) },
      })
      return
    }

    await tx.inventoryItem.update({ where: { id: item.id }, data: { quantity: item.quantity - quantity } })
    await tx.inventoryItem.create({
      data: {
        name: item.name,
        slug: `${item.slug}-${crypto.randomUUID().slice(0, 8)}`,
        category: item.category,
        rarity: item.rarity,
        quantity,
        image: item.image,
        worldSlug: item.worldSlug,
        isLocked: characterId ? false : item.isLocked,
        campaignId: item.campaignId,
        ownerId: characterId,
        forgedBy: item.forgedBy,
        effect: item.effect,
        origin: item.origin,
        author: item.author,
        coverType: item.coverType,
        coverColor: item.coverColor,
        coverImage: item.coverImage,
      },
    })
  })

  revalidatePath('/inventario')
  revalidatePath('/perfil')
  revalidatePath('/personagens')
}

export async function getPlayerCharactersForActiveCampaign() {
  const session = await auth()
  if (!session?.user?.id) return []

  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true, role: 'MASTER' },
    select: { campaignId: true },
  })
  if (!membership) return []

  const playerMembers = await prisma.campaignMember.findMany({
    where: { campaignId: membership.campaignId, role: 'PLAYER' },
    select: { userId: true },
  })
  const playerIds = playerMembers.map((member) => member.userId)
  if (!playerIds.length) return []

  return prisma.character.findMany({
    where: { campaignId: membership.campaignId, playerId: { in: playerIds } },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })
}

export async function createInventoryItem(data: {
  name: string
  category: string
  rarity: string
  quantity: number
  worldSlug?: string
  origin?: string
  effect?: string
  forgedBy?: string
  author?: string
  coverType?: string
  coverColor?: string
  image?: string
  coverImage?: string
  chapters?: { title: string; content: string }[]
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true, role: 'MASTER' },
  })
  if (!membership) throw new Error('Sem campanha ativa como Mestre')

  const slug = data.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  await prisma.inventoryItem.create({
    data: {
      name: data.name,
      slug,
      category: data.category,
      rarity: data.rarity,
      quantity: data.quantity,
      worldSlug: data.worldSlug,
      origin: data.origin,
      effect: data.effect,
      forgedBy: data.forgedBy,
      author: data.author,
      coverType: data.coverType,
      coverColor: data.coverColor,
      image: data.image,
      coverImage: data.coverImage,
      campaignId: membership.campaignId,
      chapters: data.chapters
        ? {
            create: data.chapters
              .filter((ch) => ch.title.trim())
              .map((ch, i) => ({ title: ch.title, content: ch.content, order: i })),
          }
        : undefined,
    },
  })

  revalidatePath('/inventario')
}

export async function getItemBySlug(slug: string) {
  const session = await auth()
  if (!session?.user?.id) return null

  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true },
  })
  if (!membership) return null

  return prisma.inventoryItem.findFirst({
    where: { slug, campaignId: membership.campaignId },
    include: { chapters: { orderBy: { order: 'asc' } } },
  })
}
