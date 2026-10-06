'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { oneOf, validatedInteger, validatedText } from '@/lib/validation'
import { createUserNotification } from '@/lib/notifications'

const ITEM_CATEGORIES = ['equipamento', 'consumivel', 'material', 'reliquia', 'livro', 'outro'] as const
const ITEM_RARITIES = ['comum', 'incomum', 'raro', 'epico', 'lendario', 'mitico'] as const

function validateChapters(value: unknown) {
  if (value === undefined) return undefined
  if (!Array.isArray(value) || value.length > 100) throw new Error('Lista de capítulos inválida')
  const chapters = value.map((chapter) => {
    if (!chapter || typeof chapter !== 'object') throw new Error('Capítulo inválido')
    const data = chapter as { title?: unknown; content?: unknown }
    return {
      title: validatedText(data.title, 'Título do capítulo', { min: 1, max: 160 }),
      content: validatedText(data.content, 'Conteúdo do capítulo', { max: 20_000, trim: false }),
    }
  })
  if (chapters.reduce((sum, chapter) => sum + chapter.content.length, 0) > 200_000) {
    throw new Error('O conteúdo total dos capítulos excede o limite permitido')
  }
  return chapters
}

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
  return membership.role === 'MASTER'
    ? membership.campaign.items
    : membership.campaign.items.filter((item) => !item.isLocked)
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
    select: { id: true, name: true, ownerId: true },
  })
  if (!item) throw new Error('Item nÃ£o encontrado nesta campanha')

  let recipientId: string | null = null
  let recipientCharacterName = ''
  if (characterId) {
    const character = await prisma.character.findFirst({
      where: { id: characterId, campaignId: membership.campaignId, playerId: { not: null } },
      select: { playerId: true, name: true },
    })
    if (!character?.playerId) throw new Error('Personagem de jogador nÃ£o encontrado nesta campanha')

    const playerMembership = await prisma.campaignMember.findFirst({
      where: { campaignId: membership.campaignId, userId: character.playerId, role: 'PLAYER', active: true },
      select: { id: true },
    })
    if (!playerMembership) throw new Error('O personagem nÃ£o pertence a um jogador da campanha')
    recipientId = character.playerId
    recipientCharacterName = character.name
  }

  await prisma.inventoryItem.update({
    where: { id: item.id },
    data: { ownerId: characterId, ...(characterId ? { isLocked: false } : {}) },
  })

  if (recipientId && item.ownerId !== characterId) {
    await createUserNotification({
      userId: recipientId,
      preference: 'itensAdicionados',
      type: 'item_added',
      title: 'Novo item no inventário',
      message: `${item.name} foi entregue a ${recipientCharacterName}.`,
      href: '/inventario',
    })
  }

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

  let recipientId: string | null = null
  let recipientCharacterName = ''
  if (characterId) {
    const character = await prisma.character.findFirst({
      where: { id: characterId, campaignId: membership.campaignId, playerId: { not: null } },
      select: { playerId: true, name: true },
    })
    if (!character?.playerId) throw new Error('Personagem de jogador nÃ£o encontrado nesta campanha')
    const playerMembership = await prisma.campaignMember.findFirst({
      where: { campaignId: membership.campaignId, userId: character.playerId, role: 'PLAYER', active: true },
      select: { id: true },
    })
    if (!playerMembership) throw new Error('O personagem nÃ£o pertence a um jogador da campanha')
    recipientId = character.playerId
    recipientCharacterName = character.name
  }

  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "InventoryItem" WHERE "id" = ${item.id} FOR UPDATE`
    const lockedItem = await tx.inventoryItem.findFirst({ where: { id: item.id, campaignId: membership.campaignId } })
    if (!lockedItem) throw new Error('Item não encontrado nesta campanha')
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > lockedItem.quantity) {
      throw new Error('Quantidade inválida para transferência')
    }
    if (lockedItem.category === 'livro' && quantity !== lockedItem.quantity) {
      throw new Error('Livros só podem ser transferidos por inteiro')
    }

    if (quantity === lockedItem.quantity) {
      await tx.inventoryItem.update({
        where: { id: lockedItem.id },
        data: { ownerId: characterId, ...(characterId ? { isLocked: false } : {}) },
      })
      return
    }

    await tx.inventoryItem.update({ where: { id: lockedItem.id }, data: { quantity: lockedItem.quantity - quantity } })
    await tx.inventoryItem.create({
      data: {
        name: lockedItem.name,
        slug: `${lockedItem.slug}-${crypto.randomUUID().slice(0, 8)}`,
        category: lockedItem.category,
        rarity: lockedItem.rarity,
        quantity,
        image: lockedItem.image,
        worldSlug: lockedItem.worldSlug,
        isLocked: characterId ? false : lockedItem.isLocked,
        campaignId: lockedItem.campaignId,
        ownerId: characterId,
        forgedBy: lockedItem.forgedBy,
        effect: lockedItem.effect,
        origin: lockedItem.origin,
        author: lockedItem.author,
        coverType: lockedItem.coverType,
        coverColor: lockedItem.coverColor,
        coverImage: lockedItem.coverImage,
      },
    })
  })

  if (recipientId && item.ownerId !== characterId) {
    await createUserNotification({
      userId: recipientId,
      preference: 'itensAdicionados',
      type: 'item_added',
      title: 'Novo item no inventário',
      message: `${quantity} ${quantity === 1 ? 'unidade' : 'unidades'} de ${item.name} ${quantity === 1 ? 'foi entregue' : 'foram entregues'} a ${recipientCharacterName}.`,
      href: '/inventario',
    })
  }

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
    where: { campaignId: membership.campaignId, role: 'PLAYER', active: true },
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

  const name = validatedText(data.name, 'Nome do item', { min: 1, max: 120 })
  const category = oneOf(data.category, 'Categoria do item', ITEM_CATEGORIES)
  const rarity = oneOf(data.rarity, 'Raridade do item', ITEM_RARITIES)
  const quantity = validatedInteger(data.quantity, 'Quantidade', 1, 1_000_000)
  const worldSlug = data.worldSlug === undefined ? undefined : validatedText(data.worldSlug, 'Mundo', { max: 120 })
  const chapters = validateChapters(data.chapters)
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  if (!slug) throw new Error('O nome precisa conter letras ou números')

  await prisma.inventoryItem.create({
    data: {
      name,
      slug,
      category,
      rarity,
      quantity,
      worldSlug,
      origin: data.origin === undefined ? undefined : validatedText(data.origin, 'Origem', { max: 500 }),
      effect: data.effect === undefined ? undefined : validatedText(data.effect, 'Efeito', { max: 2_000 }),
      forgedBy: data.forgedBy === undefined ? undefined : validatedText(data.forgedBy, 'Fabricante', { max: 120 }),
      author: data.author === undefined ? undefined : validatedText(data.author, 'Autor', { max: 120 }),
      coverType: data.coverType === undefined ? undefined : oneOf(data.coverType, 'Tipo de capa', ['color', 'image'] as const),
      coverColor: data.coverColor === undefined ? undefined : validatedText(data.coverColor, 'Cor da capa', { max: 40 }),
      image: data.image === undefined ? undefined : validatedText(data.image, 'Imagem', { max: 2_048 }),
      coverImage: data.coverImage === undefined ? undefined : validatedText(data.coverImage, 'Imagem da capa', { max: 2_048 }),
      campaignId: membership.campaignId,
      chapters: chapters
        ? {
            create: chapters.map((chapter, i) => ({ ...chapter, order: i })),
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
    select: { campaignId: true, role: true },
  })
  if (!membership) return null

  const item = await prisma.inventoryItem.findFirst({
    where: { slug, campaignId: membership.campaignId },
    include: { chapters: { orderBy: { order: 'asc' } } },
  })
  if (!item || (membership.role !== 'MASTER' && item.isLocked)) return null
  return item
}

// ─── deleteInventoryItem ────────────────────────────────────
export async function deleteInventoryItem(itemId: string) {
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
  if (!item) throw new Error('Item não encontrado nesta campanha')

  // ItemChapter não tem onDelete: Cascade no schema — remove manualmente antes
  await prisma.itemChapter.deleteMany({ where: { itemId } })
  await prisma.inventoryItem.delete({ where: { id: item.id } })

  revalidatePath('/inventario')
}

// ─── updateInventoryItem ────────────────────────────────────
// Edição de superfície: nome, quantidade e imagem.
export async function updateInventoryItem(
  itemId: string,
  data: { name: string; quantity: number; image?: string }
) {
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
  if (!item) throw new Error('Item não encontrado nesta campanha')
  const name = validatedText(data.name, 'Nome do item', { min: 1, max: 120 })
  const quantity = validatedInteger(data.quantity, 'Quantidade', 1, 1_000_000)
  const image = data.image === undefined ? undefined : validatedText(data.image, 'Imagem', { max: 2_048 })

  await prisma.inventoryItem.update({
    where: { id: item.id },
    data: { name, quantity, image },
  })

  revalidatePath('/inventario')
  revalidatePath(`/inventario/${itemId}`)
}
