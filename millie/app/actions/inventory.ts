'use server'

import { randomUUID } from 'node:crypto'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { oneOf, validatedInteger, validatedText } from '@/lib/validation'
import { createUserNotification } from '@/lib/notifications'
import { sanitizeRichContent } from '@/lib/rich-content'
import { calcInventoryCapacity } from '@/lib/utils/inventory'
import { getEquipmentMaxDurability, getEquipmentPrice, getEquipmentPropertyLimit } from '@/lib/utils/equipment'
import { NATIVE_EQUIPMENT_EFFECTS, type EquipmentEffectRecord, type EquipmentEffectRule, type EquipmentSubtype } from '@/lib/types/inventory'
import type { Prisma } from '@/lib/generated/prisma'

type Tx = Prisma.TransactionClient

async function assertRoom(tx: Tx, campaignId: string, characterId: string) {
  const c = await tx.character.findFirst({ where: { id: characterId, campaignId }, select: { level: true, forca: true, birthRank: true, rankLosses: true, race: { select: { isCorrupted: true } } } })
  if (!c) throw new Error('Personagem não encontrado nesta campanha')
  const used = await tx.inventoryItem.count({ where: { campaignId, ownerId: characterId } })
  const capacity = calcInventoryCapacity(c)
  if (used >= capacity) throw new Error(`Inventário cheio (${used}/${capacity}). Marque "forçar entrega" para ignorar o limite.`)
}
const ITEM_CATEGORIES = ['equipamento', 'consumivel', 'material', 'reliquia', 'livro', 'outro'] as const
const ITEM_RARITIES = ['comum', 'incomum', 'raro', 'epico', 'lendario', 'mitico'] as const

function validateEquipmentConfiguration(typeValue: unknown, subtypeValue: unknown, rarity: (typeof ITEM_RARITIES)[number], effectsValue: unknown) {
  const equipmentType = oneOf(typeValue, 'Tipo de equipamento', ['arma', 'armadura', 'escudo', 'outro'] as const)
  const subtypeOptions = equipmentType === 'arma' ? ['corpo_a_corpo', 'leve', 'distancia', 'foco_magico'] as const
    : equipmentType === 'armadura' ? ['leve_armadura', 'media_armadura', 'pesada_armadura'] as const : [] as const
  const equipmentSubtype = subtypeOptions.length ? oneOf(subtypeValue, 'Subtipo de equipamento', subtypeOptions) : null
  const propertyLimit = equipmentType === 'outro' ? 8 : getEquipmentPropertyLimit(rarity)
  if (!Array.isArray(effectsValue) || effectsValue.length > propertyLimit) throw new Error(`Este equipamento permite até ${propertyLimit} propriedade(s)`)

  const seen = new Set<string>()
  const equipmentEffects = effectsValue.map((rawEffect): EquipmentEffectRecord => {
    if (!rawEffect || typeof rawEffect !== 'object') throw new Error('Efeito de equipamento inválido')
    const input = rawEffect as { rule?: unknown; name?: unknown; description?: unknown }
    const rule = oneOf(input.rule, 'Tipo do efeito', ['perfurante', 'contundente', 'longa', 'elemental', 'espiritual', 'rapida', 'resistencia', 'leveza', 'firmeza', 'reflexo', 'custom'] as const) as EquipmentEffectRule
    if (seen.has(rule) && rule !== 'custom') throw new Error('Este efeito nativo já foi adicionado')
    seen.add(rule)

    let name: string
    let description: string
    if (rule === 'custom') {
      name = validatedText(input.name, 'Nome do efeito', { min: 1, max: 80 })
      description = validatedText(input.description, 'Descrição do efeito', { min: 1, max: 1_000 })
    } else {
      const preset = equipmentType === 'outro' ? undefined : NATIVE_EQUIPMENT_EFFECTS[equipmentType].find(effect => effect.rule === rule)
      if (!preset) throw new Error('O efeito nativo não corresponde ao tipo do equipamento')
      name = preset.name
      description = preset.description
    }

    return {
      id: randomUUID(),
      rule,
      name,
      description,
    }
  })

  return { equipmentType, equipmentSubtype: equipmentSubtype as EquipmentSubtype | null, equipmentEffects }
}

function validateChapters(value: unknown) {
  if (value === undefined) return undefined
  if (!Array.isArray(value) || value.length > 200) throw new Error('A lista pode ter no máximo 200 capítulos')
  const chapters = value.map((chapter) => {
    if (!chapter || typeof chapter !== 'object') throw new Error('Capítulo inválido')
    const data = chapter as { title?: unknown; content?: unknown }
    return {
      title: validatedText(data.title, 'Título do capítulo', { max: 160 }),
      content: sanitizeRichContent(validatedText(data.content, 'Conteúdo do capítulo', { max: 1_000_000, trim: false })),
    }
  })
  if (chapters.reduce((sum, chapter) => sum + Buffer.byteLength(chapter.content, 'utf8'), 0) > 4_000_000) {
    throw new Error('O conteúdo total excede o limite de 4 MB')
  }
  return chapters
}

async function activeMaster() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')
  const membership = await prisma.campaignMember.findFirst({ where: { userId: session.user.id, active: true, role: 'MASTER' } })
  if (!membership) throw new Error('Sem campanha ativa como Mestre')
  return membership
}

function safeBook<T extends { chapters: { content: string }[] }>(book: T): T {
  return { ...book, chapters: book.chapters.map((chapter) => ({ ...chapter, content: sanitizeRichContent(chapter.content) })) } as T
}

async function draftBookIds(campaignId: string) {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`SELECT \"id\" FROM \"InventoryItem\" WHERE \"campaignId\" = ${campaignId} AND \"isDraft\" = true`
  return new Set(rows.map((row) => row.id))
}

export async function getItemsByActiveCampaign() {
  const session = await auth()
  if (!session?.user?.id) return []

  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true },
    select: { campaignId: true, role: true },
  })
  if (!membership) return []
  const [campaignItems, drafts, layouts] = await Promise.all([
    prisma.inventoryItem.findMany({ where: { campaignId: membership.campaignId }, include: { chapters: { orderBy: { order: 'asc' } } } }),
    draftBookIds(membership.campaignId),
    prisma.$queryRaw<Array<{id:string;pageColor:string;pageTexture:boolean;pageHeader:string;pageFooter:string}>>`SELECT "id", "pageColor", "pageTexture", "pageHeader", "pageFooter" FROM "InventoryItem" WHERE "campaignId" = ${membership.campaignId} AND "category" = 'livro'`,
  ])
  const equipmentRows = await prisma.$queryRaw<Array<{id:string;equipmentType:string|null;equipmentSubtype:string|null;equipmentEffects:unknown;equipmentDurability:number|null;equipmentMaxDurability:number|null}>>`SELECT "id", "equipmentType", "equipmentSubtype", "equipmentEffects", "equipmentDurability", "equipmentMaxDurability" FROM "InventoryItem" WHERE "campaignId" = ${membership.campaignId} AND "category" = 'equipamento'`
  const equipmentById = new Map(equipmentRows.map(row => [row.id, row]))
  const consumables = await prisma.$queryRaw<Array<{id:string;consumableType:string|null}>>`SELECT "id", "consumableType" FROM "InventoryItem" WHERE "campaignId" = ${membership.campaignId} AND "category" = 'consumivel'`
  const consumableById = new Map(consumables.map(row => [row.id, row]))
  const layoutById = new Map(layouts.map((layout) => [layout.id, layout]))
  const items = campaignItems.filter((item) => !drafts.has(item.id)).map((item) => {
    const equipment = equipmentById.get(item.id)
    const enriched = equipment ? { ...item, ...equipment } : consumableById.has(item.id) ? { ...item, ...consumableById.get(item.id) } : item
    return item.category === 'livro' ? safeBook({ ...enriched, ...layoutById.get(item.id), isDraft: false }) : enriched
  })
  return membership.role === 'MASTER' ? items : items.filter((item) => !item.isLocked)
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

export async function transferInventoryItem(itemId: string, characterId: string | null, quantity: number, force = false) {
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

    if (characterId && lockedItem.ownerId !== characterId && !force) await assertRoom(tx, membership.campaignId, characterId)

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

/** Personagem de outro jogador que pode receber uma troca nesta campanha. */
export async function getPlayerInventoryTransferTargets() {
  const session = await auth()
  if (!session?.user?.id) return []
  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true, role: 'PLAYER', campaign: { archived: false } },
    select: { campaignId: true },
  })
  if (!membership) return []
  const peers = await prisma.campaignMember.findMany({
    where: { campaignId: membership.campaignId, role: 'PLAYER', active: true, userId: { not: session.user.id } },
    select: { userId: true, user: { select: { username: true } } },
  })
  if (!peers.length) return []
  const ownerNames = new Map(peers.map(peer => [peer.userId, peer.user.username || 'Jogador']))
  const characters = await prisma.character.findMany({
    where: { campaignId: membership.campaignId, playerId: { in: peers.map(peer => peer.userId) }, isLocked: false },
    select: { id: true, name: true, playerId: true },
    orderBy: { name: 'asc' },
  })
  return characters.map(character => ({
    id: character.id,
    name: character.name,
    playerName: ownerNames.get(character.playerId!) ?? 'Jogador',
  }))
}

/** Transfere uma pilha do personagem do jogador atual para outro jogador da mesma campanha. */
export async function transferPlayerInventoryItem(itemId: string, targetCharacterId: string, quantity: number) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')
  const userId = session.user.id
  const membership = await prisma.campaignMember.findFirst({
    where: { userId, active: true, role: 'PLAYER', campaign: { archived: false } },
    select: { campaignId: true },
  })
  if (!membership) throw new Error('Entre em uma campanha ativa como jogador')
  if (!targetCharacterId) throw new Error('Escolha quem receberá o item')

  const result = await prisma.$transaction(async tx => {
    const items = await tx.$queryRaw<Array<{
      id: string; name: string; slug: string; category: string; rarity: string; quantity: number; image: string | null; worldSlug: string | null;
      isLocked: boolean; isDraft: boolean; campaignId: string; ownerId: string | null; equipmentType: string | null; equipmentSubtype: string | null;
      equipmentEffects: unknown; equipmentDurability: number | null; equipmentMaxDurability: number | null;
    }>>`SELECT * FROM "InventoryItem" WHERE "id" = ${itemId} AND "campaignId" = ${membership.campaignId} FOR UPDATE`
    const item = items[0]
    if (!item || item.isDraft || item.isLocked) throw new Error('Este item não pode ser transferido')
    if (!item.ownerId) throw new Error('Este item ainda pertence ao estoque do Mestre')
    const sender = await tx.character.findFirst({ where: { id: item.ownerId, campaignId: membership.campaignId }, select: { id: true, playerId: true } })
    if (!sender || sender.playerId !== userId) throw new Error('Você só pode transferir itens dos seus personagens')
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > item.quantity) throw new Error('Quantidade inválida para transferência')
    if (item.category === 'livro' && quantity !== item.quantity) throw new Error('Livros só podem ser transferidos por inteiro')

    const target = await tx.character.findFirst({
      where: { id: targetCharacterId, campaignId: membership.campaignId, playerId: { not: userId }, isLocked: false },
      select: { id: true, name: true, playerId: true, level: true, forca: true, birthRank: true, rankLosses: true, race: { select: { isCorrupted: true } } },
    })
    if (!target?.playerId) throw new Error('O personagem escolhido não pertence a outro jogador ativo desta campanha')
    const targetMembership = await tx.campaignMember.findFirst({
      where: { campaignId: membership.campaignId, userId: target.playerId, role: 'PLAYER', active: true },
      select: { id: true },
    })
    if (!targetMembership) throw new Error('O jogador escolhido não está ativo nesta campanha')

    // A exploração usa uma posição compartilhada; se houver sala ativa, todos os personagens
    // selecionáveis são considerados no mesmo local. Sem mapa ativo, a troca continua disponível.
    const [state] = await tx.$queryRaw<Array<{ currentMapId: string | null; currentRoomId: string | null }>>`SELECT "currentMapId","currentRoomId" FROM "CampaignExplorationState" WHERE "campaignId" = ${membership.campaignId} FOR UPDATE`
    if (state?.currentMapId && state.currentRoomId) {
      const activeMap = await tx.explorationMap.findFirst({ where: { id: state.currentMapId, campaignId: membership.campaignId, isPublished: true, isEditing: false }, select: { id: true } })
      if (!activeMap) throw new Error('A localização compartilhada da campanha está indisponível')
    }

    await tx.$queryRaw`SELECT "id" FROM "Character" WHERE "id" = ${target.id} FOR UPDATE`
    const used = await tx.inventoryItem.count({ where: { campaignId: membership.campaignId, ownerId: target.id } })
    const capacity = calcInventoryCapacity(target)
    if (used >= capacity) throw new Error(`O inventário de ${target.name} está cheio (${used}/${capacity}); a transferência foi cancelada`)

    if (quantity === item.quantity) {
      await tx.$executeRaw`UPDATE "InventoryItem" SET "ownerId" = ${target.id} WHERE "id" = ${item.id} AND "campaignId" = ${membership.campaignId}`
    } else {
      const splitId = randomUUID()
      const splitSlug = `${item.slug}-${splitId.slice(0, 8)}`
      await tx.$executeRaw`UPDATE "InventoryItem" SET "quantity" = ${item.quantity - quantity} WHERE "id" = ${item.id}`
      await tx.$executeRaw`INSERT INTO "InventoryItem" (
        "id","name","slug","category","rarity","quantity","image","worldSlug","isLocked","isDraft","campaignId","ownerId",
        "forgedBy","effect","equipmentType","equipmentSubtype","equipmentEffects","equipmentDurability","equipmentMaxDurability",
        "origin","consumableType","author","coverType","coverColor","coverImage","pageColor","pageTexture","pageHeader","pageFooter"
      ) SELECT ${splitId},"name",${splitSlug},"category","rarity",${quantity},"image","worldSlug","isLocked","isDraft","campaignId",${target.id},
        "forgedBy","effect","equipmentType","equipmentSubtype","equipmentEffects","equipmentDurability","equipmentMaxDurability",
        "origin","consumableType","author","coverType","coverColor","coverImage","pageColor","pageTexture","pageHeader","pageFooter"
        FROM "InventoryItem" WHERE "id" = ${item.id} AND "campaignId" = ${membership.campaignId}`
    }
    return { itemName: item.name, targetName: target.name, targetUserId: target.playerId }
  })

  await createUserNotification({
    userId: result.targetUserId,
    preference: 'itensAdicionados',
    type: 'item_added',
    title: 'Item recebido de outro jogador',
    message: `${quantity} ${quantity === 1 ? 'unidade' : 'unidades'} de ${result.itemName} foi transferida para ${result.targetName}.`,
    href: '/perfil',
  })
  revalidatePath('/inventario')
  revalidatePath('/perfil')
  revalidatePath('/personagens')
  revalidatePath('/mapas')
  return { itemName: result.itemName, targetName: result.targetName, quantity }
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
  isDraft?: boolean
  equipmentType?: unknown
  equipmentSubtype?: unknown
  equipmentEffects?: unknown
  consumableType?: unknown
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
  const equipment = category === 'equipamento'
    ? validateEquipmentConfiguration(data.equipmentType, data.equipmentSubtype, rarity, data.equipmentEffects)
    : null
  const consumableType = category === 'consumivel' && data.consumableType !== undefined
    ? oneOf(data.consumableType, 'Tipo de consumível', ['cura_pv', 'cura_pm', 'outro'] as const)
    : null
  const effectText = equipment
    ? equipment.equipmentEffects.map(item => `${item.name}: ${item.description}`).join('\n').slice(0, 2_000)
    : data.effect === undefined ? undefined : validatedText(data.effect, 'Efeito', { max: 2_000 })
  const worldSlug = data.worldSlug === undefined ? undefined : validatedText(data.worldSlug, 'Mundo', { max: 120 })
  const chapters = validateChapters(data.chapters)
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  if (!slug) throw new Error('O nome precisa conter letras ou números')

  const itemId = await prisma.$transaction(async (tx) => {
    const item = await tx.inventoryItem.create({
    data: {
      name,
      slug,
      category,
      rarity,
      quantity,
      worldSlug,
      origin: data.origin === undefined ? undefined : validatedText(data.origin, 'Origem', { max: 500 }),
      effect: effectText,
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
    select: { id: true },
    })
    if (equipment) {
      const maxDurability = getEquipmentMaxDurability(rarity)
      await tx.$executeRaw`UPDATE "InventoryItem" SET "equipmentType" = ${equipment.equipmentType}, "equipmentSubtype" = ${equipment.equipmentSubtype}, "equipmentEffects" = ${JSON.stringify(equipment.equipmentEffects)}::jsonb, "equipmentDurability" = ${maxDurability}, "equipmentMaxDurability" = ${maxDurability} WHERE "id" = ${item.id}`
    }
    if (consumableType) await tx.$executeRaw`UPDATE "InventoryItem" SET "consumableType" = ${consumableType} WHERE "id" = ${item.id}`
    if (data.isDraft) await tx.$executeRaw`UPDATE \"InventoryItem\" SET \"isDraft\" = true WHERE \"id\" = ${item.id}`
    return item.id
  })
  revalidatePath('/inventario')
  revalidatePath('/mestre')
  return itemId
}

export async function getBooksForMasterPanel() {
  const membership = await activeMaster()
  const books = await prisma.inventoryItem.findMany({
    where: { campaignId: membership.campaignId, category: 'livro' },
    include: { chapters: { orderBy: { order: 'asc' } } },
    orderBy: { name: 'asc' },
  })
  const [drafts, layouts] = await Promise.all([draftBookIds(membership.campaignId), prisma.$queryRaw<Array<{id:string;pageColor:string;pageTexture:boolean;pageHeader:string;pageFooter:string}>>`SELECT "id", "pageColor", "pageTexture", "pageHeader", "pageFooter" FROM "InventoryItem" WHERE "campaignId" = ${membership.campaignId} AND "category" = 'livro'`])
  const layoutById = new Map(layouts.map((layout) => [layout.id, layout]))
  return books.map((book) => safeBook({ ...book, ...layoutById.get(book.id), isDraft: drafts.has(book.id) }))
}

export async function getBookForEditor(itemId: string) {
  const membership = await activeMaster()
  const book = await prisma.inventoryItem.findFirst({
    where: { id: itemId, campaignId: membership.campaignId, category: 'livro' },
    include: { chapters: { orderBy: { order: 'asc' } } },
  })
  if (!book) return null
  const [drafts, layouts] = await Promise.all([draftBookIds(membership.campaignId), prisma.$queryRaw<Array<{id:string;pageColor:string;pageTexture:boolean;pageHeader:string;pageFooter:string}>>`SELECT "id", "pageColor", "pageTexture", "pageHeader", "pageFooter" FROM "InventoryItem" WHERE "id" = ${book.id}`])
  return safeBook({ ...book, ...layouts[0], isDraft: drafts.has(book.id) })
}

export async function updateInventoryBook(itemId: string, data: {
  name: string; author?: string; rarity: string; worldSlug?: string; coverType: string;
  coverColor?: string; coverImage?: string; pageColor?: string; pageTexture?: boolean; pageHeader?: string; pageFooter?: string; chapters: { title: string; content: string }[]
}) {
  const membership = await activeMaster()
  const item = await prisma.inventoryItem.findFirst({ where: { id: itemId, campaignId: membership.campaignId, category: 'livro' } })
  if (!item) throw new Error('Livro não encontrado nesta campanha')
  const name = validatedText(data.name, 'Título do livro', { min: 1, max: 120 })
  const author = data.author === undefined ? undefined : validatedText(data.author, 'Autor', { max: 120 })
  const rarity = oneOf(data.rarity, 'Raridade', ITEM_RARITIES)
  const worldSlug = data.worldSlug === undefined ? undefined : validatedText(data.worldSlug, 'Mundo', { max: 120 })
  const coverType = oneOf(data.coverType, 'Tipo de capa', ['color', 'image'] as const)
  const coverColor = data.coverColor ? validatedText(data.coverColor, 'Cor da capa', { max: 40 }) : null
  const coverImage = data.coverImage ? validatedText(data.coverImage, 'Imagem da capa', { max: 2_048 }) : null
  const chapters = validateChapters(data.chapters) ?? []
  const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  if (!slug) throw new Error('O título precisa conter letras ou números')
  const duplicate = await prisma.inventoryItem.findFirst({ where: { campaignId: membership.campaignId, slug, id: { not: itemId } }, select: { id: true } })
  if (duplicate) throw new Error('Já existe um item com esse nome nesta campanha')
  await prisma.$transaction([
    prisma.itemChapter.deleteMany({ where: { itemId } }),
    prisma.inventoryItem.update({ where: { id: itemId }, data: {
      name, slug, author, rarity, worldSlug, coverType, coverColor, coverImage,
      chapters: { create: chapters.map((chapter, order) => ({ ...chapter, order })) },
    } }),
  ])
  const pageColor = /^#[0-9a-f]{6}$/i.test(data.pageColor ?? "") ? data.pageColor! : "#f7f3e9"
  const pageHeader = validatedText(data.pageHeader ?? "", "Cabeçalho", { max: 160, trim: false })
  const pageFooter = validatedText(data.pageFooter ?? "", "Rodapé", { max: 160, trim: false })
  await prisma.$executeRaw`UPDATE "InventoryItem" SET "pageColor" = ${pageColor}, "pageTexture" = ${data.pageTexture ?? true}, "pageHeader" = ${pageHeader}, "pageFooter" = ${pageFooter} WHERE "id" = ${itemId}`
  revalidatePath('/inventario')
  revalidatePath('/mestre')
  revalidatePath(`/inventario/${item.slug}`)
  revalidatePath(`/inventario/${slug}`)
}

export async function publishBook(itemId: string) {
  const membership = await activeMaster()
  const book = await prisma.inventoryItem.findFirst({ where: { id: itemId, campaignId: membership.campaignId, category: 'livro' }, include: { chapters: true } })
  if (!book) throw new Error('Livro não encontrado nesta campanha')
  if (book.chapters.some((chapter) => !chapter.title.trim())) throw new Error('Dê um título para todos os capítulos antes de publicar')
  await prisma.$executeRaw`UPDATE \"InventoryItem\" SET \"isDraft\" = false WHERE \"id\" = ${itemId}`
  revalidatePath('/inventario')
  revalidatePath('/mestre')
}

export async function renameBook(itemId: string, value: string) {
  const membership = await activeMaster()
  const item = await prisma.inventoryItem.findFirst({ where: { id: itemId, campaignId: membership.campaignId, category: 'livro' } })
  if (!item) throw new Error('Livro não encontrado nesta campanha')
  const name = validatedText(value, 'Título do livro', { min: 1, max: 120 })
  const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  if (!slug) throw new Error('O título precisa conter letras ou números')
  const duplicate = await prisma.inventoryItem.findFirst({ where: { campaignId: membership.campaignId, slug, id: { not: itemId } }, select: { id: true } })
  if (duplicate) throw new Error('Já existe um item com esse nome nesta campanha')
  await prisma.inventoryItem.update({ where: { id: itemId }, data: { name, slug } })
  revalidatePath('/inventario')
  revalidatePath('/mestre')
  revalidatePath(`/inventario/${item.slug}`)
  revalidatePath(`/inventario/${slug}`)
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
  const draftRows = await prisma.$queryRaw<Array<{ isDraft: boolean }>>`SELECT \"isDraft\" FROM \"InventoryItem\" WHERE \"id\" = ${item.id}`
  if (draftRows[0]?.isDraft) return null
  if (item.category === 'equipamento') {
    const equipment = await prisma.$queryRaw<Array<{equipmentType:string|null;equipmentSubtype:string|null;equipmentEffects:unknown;equipmentDurability:number|null;equipmentMaxDurability:number|null}>>`SELECT "equipmentType", "equipmentSubtype", "equipmentEffects", "equipmentDurability", "equipmentMaxDurability" FROM "InventoryItem" WHERE "id" = ${item.id}`
    return { ...item, ...equipment[0], viewerRole: membership.role }
  }
  if (item.category === 'consumivel') {
    const consumable = await prisma.$queryRaw<Array<{consumableType:string|null}>>`SELECT "consumableType" FROM "InventoryItem" WHERE "id" = ${item.id}`
    const canUseConsumable = membership.role === 'MASTER' || (!!item.ownerId && !!(await prisma.character.findFirst({ where: { id: item.ownerId, campaignId: membership.campaignId, playerId: session.user.id }, select: { id: true } })))
    return { ...item, ...consumable[0], viewerRole: membership.role, canUseConsumable }
  }
  if (item.category !== 'livro') return item
  const layouts = await prisma.$queryRaw<Array<{pageColor:string;pageTexture:boolean;pageHeader:string;pageFooter:string}>>`SELECT "pageColor", "pageTexture", "pageHeader", "pageFooter" FROM "InventoryItem" WHERE "id" = ${item.id}`
  return safeBook({ ...item, ...layouts[0], isDraft: false })
}

export async function changeEquipmentDurability(itemId: string, action: 'wear' | 'repair' | 'replace') {
  const membership = await activeMaster()
  if (action !== 'wear' && action !== 'repair' && action !== 'replace') throw new Error('Ação de durabilidade inválida')
  const result = await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "InventoryItem" WHERE "id" = ${itemId} AND "campaignId" = ${membership.campaignId} FOR UPDATE`
    const rows = await tx.$queryRaw<Array<{id:string;rarity:string;equipmentSubtype:string|null;equipmentDurability:number|null;equipmentMaxDurability:number|null;ownerId:string|null;name:string}>>`SELECT "id", "rarity", "equipmentSubtype", "equipmentDurability", "equipmentMaxDurability", "ownerId", "name" FROM "InventoryItem" WHERE "id" = ${itemId} AND "campaignId" = ${membership.campaignId} AND "category" = 'equipamento'`
    const item = rows[0]
    if (!item) throw new Error('Equipamento não encontrado nesta campanha')
    if (item.equipmentDurability === null || item.equipmentMaxDurability === null) throw new Error('Equipamentos Míticos não perdem durabilidade')
    if (action === 'wear') {
      if (item.equipmentDurability <= 0) throw new Error('Este equipamento já está Quebrado')
      const durability = item.equipmentDurability - 1
      await tx.$executeRaw`UPDATE "InventoryItem" SET "equipmentDurability" = ${durability} WHERE "id" = ${item.id}`
      return { name: item.name, durability, maxDurability: item.equipmentMaxDurability, repaired: false }
    }
    if (item.equipmentDurability > 0) throw new Error('Conserto e troca só estão disponíveis quando o equipamento está Quebrado')
    if (!item.ownerId) throw new Error('Entregue o item a um personagem antes de cobrar o conserto')
    const repairCost = Math.ceil(getEquipmentPrice(item.rarity, item.equipmentSubtype) * (action === 'repair' ? 0.3 : 0.5))
    const charged = await tx.$executeRaw`UPDATE "Character" SET "currency" = "currency" - ${repairCost} WHERE "id" = ${item.ownerId} AND "campaignId" = ${membership.campaignId} AND "currency" >= ${repairCost}`
    if (!charged) throw new Error(`O personagem precisa de ${repairCost} Estilhaços para consertar o item`)
    await tx.$executeRaw`UPDATE "InventoryItem" SET "equipmentDurability" = ${item.equipmentMaxDurability} WHERE "id" = ${item.id}`
    return { name: item.name, durability: item.equipmentMaxDurability, maxDurability: item.equipmentMaxDurability, repaired: action === 'repair', repairCost, replaced: action === 'replace' }
  })
  revalidatePath('/inventario')
  revalidatePath('/mestre')
  revalidatePath('/perfil')
  return result
}

/** Consome uma poção de cura e aplica a recuperação definida pela raridade. */
export async function useHealingPotion(itemId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')
  const membership = await prisma.campaignMember.findFirst({ where: { userId: session.user.id, active: true }, select: { campaignId: true, role: true } })
  if (!membership) throw new Error('Sem campanha ativa')

  const result = await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "InventoryItem" WHERE "id" = ${itemId} AND "campaignId" = ${membership.campaignId} FOR UPDATE`
    const rows = await tx.$queryRaw<Array<{id:string;name:string;ownerId:string|null;rarity:string;quantity:number;consumableType:string|null}>>`SELECT "id", "name", "ownerId", "rarity", "quantity", "consumableType" FROM "InventoryItem" WHERE "id" = ${itemId} AND "campaignId" = ${membership.campaignId} AND "category" = 'consumivel'`
    const item = rows[0]
    if (!item || !item.ownerId) throw new Error('A poção precisa estar no inventário de um personagem')
    if (!['cura_pv', 'cura_pm'].includes(item.consumableType ?? '')) throw new Error('Este item não está configurado como poção de cura')

    const character = await tx.character.findFirst({ where: { id: item.ownerId, campaignId: membership.campaignId }, select: { id: true, name: true, playerId: true, pv: true, pvMax: true, pm: true, pmMax: true } })
    if (!character) throw new Error('Personagem dono da poção não encontrado')
    if (membership.role === 'PLAYER' && character.playerId !== session.user.id) throw new Error('Você não pode usar a poção de outro personagem')

    const percentage: Record<string, number> = { comum: 0.15, incomum: 0.25, raro: 0.4, epico: 0.4, lendario: 0.6, mitico: 0.6 }
    const amount = percentage[item.rarity]
    if (!amount) throw new Error('Raridade de poção inválida')
    const healsPv = item.consumableType === 'cura_pv'
    const current = healsPv ? character.pv : character.pm
    const maximum = healsPv ? character.pvMax : character.pmMax
    if (current >= maximum) throw new Error(healsPv ? 'Os PV já estão cheios' : 'Os PM já estão cheios')
    const recovered = Math.min(maximum - current, Math.max(1, Math.ceil(maximum * amount)))
    const conditions = item.rarity === 'epico'
      ? await tx.characterCondition.findMany({ where: { characterId: character.id, removedAt: null }, orderBy: { appliedAt: 'asc' }, take: 1, select: { id: true } })
      : item.rarity === 'mitico'
        ? await tx.characterCondition.findMany({ where: { characterId: character.id, removedAt: null }, select: { id: true } })
        : []

    await tx.character.update({ where: { id: character.id }, data: healsPv ? { pv: current + recovered } : { pm: current + recovered } })
    if (conditions.length) await tx.characterCondition.updateMany({ where: { id: { in: conditions.map(condition => condition.id) }, removedAt: null }, data: { removedAt: new Date() } })
    if (item.quantity > 1) await tx.$executeRaw`UPDATE "InventoryItem" SET "quantity" = "quantity" - 1 WHERE "id" = ${item.id}`
    else await tx.$executeRaw`DELETE FROM "InventoryItem" WHERE "id" = ${item.id}`

    return { characterName: character.name, resource: healsPv ? 'PV' : 'PM', recovered, current: current + recovered, maximum, conditionsRemoved: conditions.length, potionName: item.name }
  })
  revalidatePath('/inventario')
  revalidatePath('/perfil')
  revalidatePath('/mestre')
  return result
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
  revalidatePath('/mestre')
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
