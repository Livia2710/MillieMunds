'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import type { BaseRank, RacePath } from '@/lib/generated/prisma'
import { revalidatePath } from 'next/cache'
import type { CharacterElement, CharacterCategory } from '@/lib/types/character'
import type { ProfileCharacter } from '@/lib/types/profile'
import { calcCurrentRank, calcXpToNextLevel, calcFirstSkillUnlock, getRankMax } from '@/lib/utils/rank'
import { oneOf, validatedInteger, validatedText, validateImageUrl } from '@/lib/validation'
import { createUserNotification } from '@/lib/notifications'
import { getFavorCategory } from '@/lib/utils/favor'
import { applyRaceAttributeModifiers } from '@/lib/utils/raceTraits'

// ─── helper: shape de retorno compartilhado ───────────────
function formatCharacter<T extends {
  id: string; name: string; race: { name: string; isCorrupted: boolean }; element: string; level: number; birthRank: BaseRank; rankLosses: number;
  category: string; agilidade: number; inteligencia: number; forca: number; vigor: number; sorte: number;
  pv: number; pvMax: number; pm: number; pmMax: number;
}, I extends { ownerId: string | null }>(char: T, campaignItems: I[], currency = 100): ProfileCharacter {
  return {
    ...char,
    race: char.race.name,
    element: char.element as CharacterElement,
    rank: calcCurrentRank(char.level, char.birthRank, char.race.isCorrupted, char.rankLosses),
    category: char.category as CharacterCategory,
    stats: {
      agilidade:    char.agilidade,
      inteligencia: char.inteligencia,
      forca:        char.forca,
      vigor:        char.vigor,
      sorte:        char.sorte,
    },
    pv:    char.pv,
    pvMax: char.pvMax,
    pm:    char.pm,
    pmMax: char.pmMax,
    currency,
    inventory: campaignItems.filter((i) => i.ownerId === char.id),
  } as unknown as ProfileCharacter
}

// ─── queries ──────────────────────────────────────────────

export async function getCharactersByActiveCampaign() {
  const session = await auth()
  if (!session?.user?.id) return []

  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true },
    include: {
      campaign: {
        include: {
          characters: { include: { race: true, skills: true } },
          items: true,
        },
      },
    },
  })

  if (!membership) return []

  const characters = membership.role === 'MASTER'
    ? membership.campaign.characters
    : membership.campaign.characters.filter((char) => !char.isLocked || char.playerId === session.user.id)
  const items = membership.role === 'MASTER'
    ? membership.campaign.items
    : membership.campaign.items.filter((item) => !item.isLocked)

  const currencies = await prisma.$queryRaw<Array<{id:string;currency:number}>>`SELECT "id", "currency" FROM "Character" WHERE "campaignId" = ${membership.campaignId}`
  const currencyById = new Map(currencies.map(row => [row.id, row.currency]))
  const ownCharacters = membership.role === 'PLAYER'
    ? membership.campaign.characters.filter(char => char.playerId === session.user.id)
    : []
  const favors = ownCharacters.length
    ? await prisma.characterAffinity.findMany({
        where: { campaignId: membership.campaignId, targetCharacterId: { in: ownCharacters.map(char => char.id) } },
        select: { sourceCharacterId: true, targetCharacterId: true, value: true },
      })
    : []
  const favorByPair = new Map(favors.map(row => [`${row.sourceCharacterId}:${row.targetCharacterId}`, row.value]))
  return characters.map((char) => ({
    ...formatCharacter(char, items, currencyById.get(char.id) ?? 100),
    favorByCharacter: ownCharacters.map(own => ({
      characterName: own.name,
      category: getFavorCategory(char.category as CharacterCategory, favorByPair.get(`${char.id}:${own.id}`) ?? 0),
    })),
  }))
}

export async function getCharacterById(id: string) {
  const session = await auth()
  if (!session?.user?.id) return null

  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true },
    select: { campaignId: true, role: true },
  })
  if (!membership) return null

  const char = await prisma.character.findFirst({
    where: { id, campaignId: membership.campaignId },
    include: {
      race: true,
      skills: true,
      campaign: { include: { items: true } },
    },
  })

  if (!char || membership.role !== 'MASTER') return null
  const items = char.campaign.items
  const currencies = await prisma.$queryRaw<Array<{currency:number}>>`SELECT "currency" FROM "Character" WHERE "id" = ${char.id}`
  return formatCharacter(char, items, currencies[0]?.currency ?? 100)
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
      campaign: { include: { items: true } },
    },
  })

  if (!char) return null
  const currencies = await prisma.$queryRaw<Array<{currency:number}>>`SELECT "currency" FROM "Character" WHERE "id" = ${char.id}`
  return formatCharacter(char, char.campaign.items.filter((item) => !item.isLocked), currencies[0]?.currency ?? 100)
}

export async function unlockCharacter(characterId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')
  const membership = await prisma.campaignMember.findFirst({ where: { userId: session.user.id, active: true, role: 'MASTER' }, select: { campaignId: true } })
  if (!membership) throw new Error('Apenas o Mestre pode liberar personagens')
  const character = await prisma.character.findFirst({ where: { id: characterId, campaignId: membership.campaignId }, select: { id: true } })
  if (!character) throw new Error('Personagem não encontrado nesta campanha')

  await prisma.character.update({
    where: { id: character.id },
    data: { isLocked: false },
  })

  revalidatePath('/perfil')
  revalidatePath('/personagens')
}

// ─── createCharacter (Mestre cria NPC / monstro) ─────────
export async function createCharacter(data: {
  name: string
  category: string
  raceId: string
  element: string
  worldSlug: string
  image?: string
  portraitImage?: string
  level: number
  year?: number
  subject?: string
  occupation?: string
  dangerLevel?: string
  // atributos opcionais — Mestre pode definir ou deixar no mínimo da raça
  agilidade?: number
  inteligencia?: number
  forca?: number
  vigor?: number
  sorte?: number
  birthRank?: BaseRank
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true, role: 'MASTER' },
  })
  if (!membership) throw new Error('Sem campanha ativa como Mestre')

  const name = validatedText(data.name, 'Nome do personagem', { min: 2, max: 80 })
  const category = oneOf(data.category, 'Categoria', ['aluno', 'professor', 'npc', 'monstro'] as const)
  const element = oneOf(data.element, 'Elemento', ['trevas', 'luz', 'terra', 'agua', 'vento', 'fogo'] as const)
  const worldSlug = validatedText(data.worldSlug, 'Mundo', { min: 1, max: 120 })
  const level = validatedInteger(data.level, 'Nível', 1, 10_000)
  const birthRank = oneOf(data.birthRank ?? 'D', 'Rank de nascença', ['E', 'D', 'C', 'B', 'A', 'S'] as const)
  const raceId = validatedText(data.raceId, 'Raça', { min: 1, max: 100 })
  const image = validateImageUrl(data.image, 'Imagem')
  const portraitImage = validateImageUrl(data.portraitImage, 'Recorte do retrato')
  const year = data.year === undefined ? undefined : validatedInteger(data.year, 'Ano', 1, 5)
  const subject = data.subject === undefined ? undefined : validatedText(data.subject, 'Matéria', { max: 100 })
  const occupation = data.occupation === undefined ? undefined : validatedText(data.occupation, 'Ocupação', { max: 100 })
  const dangerLevel = data.dangerLevel === undefined ? undefined : validatedText(data.dangerLevel, 'Nível de perigo', { max: 40 })

  const race = await prisma.race.findUnique({ where: { id: raceId }, select: { name: true, isCorrupted: true } })
  if (!race) throw new Error('Raça não encontrada nesta campanha')
  const characterRank = calcCurrentRank(level, birthRank, race.isCorrupted)
  const attributeMax = getRankMax(characterRank)
  const agilidade    = validatedInteger(data.agilidade ?? 1, 'Agilidade', 1, attributeMax)
  const inteligencia = validatedInteger(data.inteligencia ?? 1, 'Inteligência', 1, attributeMax)
  const forca        = validatedInteger(data.forca ?? 1, 'Força', 1, attributeMax)
  const vigor        = validatedInteger(data.vigor ?? 1, 'Vigor', 1, attributeMax)
  const sorte        = validatedInteger(data.sorte ?? 1, 'Sorte', 1, attributeMax)
  const finalAttributes = applyRaceAttributeModifiers({ agilidade, inteligencia, forca, vigor, sorte }, race.name, characterRank)
  const pv           = 10 + finalAttributes.vigor        * 2
  const pm           = 10 + finalAttributes.inteligencia * 2

  await prisma.character.create({
    data: {
      name,
      category,
      element,
      worldSlug,
      birthRank: birthRank as BaseRank,
      raceId,
      campaignId:  membership.campaignId,
      image,
      portraitImage,
      isLocked: true,
      level,
      unspentAttributePoints: Math.floor((level - 1) / 5),
      year,
      subject,
      occupation,
      dangerLevel,
      ...finalAttributes,
      pv,
      pvMax: pv,
      pm,
      pmMax: pm,
    },
  })

  revalidatePath('/personagens')
}

// ─── createPlayerCharacter (Jogador cria o próprio) ───────
export async function createPlayerCharacter(data: {
  name: string
  category: string
  raceId: string
  element: string
  worldSlug: string
  image?: string
  portraitImage?: string
  year?: number
  subject?: string
  occupation?: string
  // atributos — obrigatórios aqui, vêm do form
  agilidade: number
  inteligencia: number
  forca: number
  vigor: number
  sorte: number
  pv: number
  pvMax: number
  pm: number
  pmMax: number
  birthRank: BaseRank
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true, role: 'PLAYER' },
  })
  if (!membership) throw new Error('Sem campanha ativa')

  const name = validatedText(data.name, 'Nome do personagem', { min: 2, max: 80 })
  const worldSlug = validatedText(data.worldSlug, 'Mundo', { min: 1, max: 120 })
  const year = data.year === undefined ? undefined : validatedInteger(data.year, 'Ano', 1, 5)
  const subject = data.subject === undefined ? undefined : validatedText(data.subject, 'Matéria', { max: 100 })
  const occupation = data.occupation === undefined ? undefined : validatedText(data.occupation, 'Ocupação', { max: 100 })
  const image = validateImageUrl(data.image, 'Imagem')
  const portraitImage = validateImageUrl(data.portraitImage, 'Recorte do retrato')

  if (!['aluno', 'professor', 'npc'].includes(data.category)) throw new Error('Categoria inválida')
  const attributes = [data.agilidade, data.inteligencia, data.forca, data.vigor, data.sorte]
  if (attributes.some((value) => !Number.isInteger(value) || value < 1 || value > 10) || attributes.reduce((sum, value) => sum + value, 0) !== 25) {
    throw new Error('Os atributos devem ser inteiros entre 1 e 10, totalizando 25 pontos')
  }
  const race = await prisma.race.findUnique({ where: { id: data.raceId }, select: { name: true, baseRank: true, element: true } })
  if (!race) throw new Error('Raça inválida')
  const allowedElements = ['trevas', 'luz', 'terra', 'agua', 'vento', 'fogo']
  const isRitualista = race.name.trim().toLocaleLowerCase('pt-BR') === 'ritualista'
  if (!allowedElements.includes(race.element)) {
    throw new Error('A raça está com um elemento inválido. Peça ao Mestre para corrigir o cadastro da raça.')
  }
  if (isRitualista ? !allowedElements.includes(data.element) : data.element !== race.element) {
    throw new Error(isRitualista ? 'Escolha um dos seis elementos para o Ritualista' : 'O elemento não corresponde à raça escolhida')
  }
  const finalAttributes = applyRaceAttributeModifiers({
    agilidade: data.agilidade,
    inteligencia: data.inteligencia,
    forca: data.forca,
    vigor: data.vigor,
    sorte: data.sorte,
  }, race.name, race.baseRank)
  // Recalcula campos derivados e usa a raça cadastrada como fonte de verdade.
  const pvCalc  = 10 + finalAttributes.vigor * 2
  const pmCalc  = 10 + finalAttributes.inteligencia * 2

  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "CampaignMember" WHERE "id" = ${membership.id} FOR UPDATE`
    const currentMembership = await tx.campaignMember.findFirst({
      where: { id: membership.id, userId: session.user.id, active: true, role: 'PLAYER' },
      select: { id: true },
    })
    if (!currentMembership) throw new Error('Sem campanha ativa')
    const existingCharacter = await tx.character.findFirst({
      where: { campaignId: membership.campaignId, playerId: session.user.id },
      select: { id: true },
    })
    if (existingCharacter) throw new Error('Você já possui um personagem nesta campanha')

    await tx.character.create({
      data: {
        name,
        category: data.category,
        element: isRitualista ? data.element : race.element,
        worldSlug,
        birthRank: race.baseRank,
        isLocked: false,
        raceId: data.raceId,
        campaignId: membership.campaignId,
        playerId: session.user.id,
        image,
        portraitImage,
        year,
        subject,
        occupation,
        ...finalAttributes,
        pv: pvCalc,
        pvMax: pvCalc,
        pm: pmCalc,
        pmMax: pmCalc,
      },
    })
  })

  revalidatePath('/perfil')
}

// ─── getUniverses — inclui baseRank nas raças ─────────────
export async function getUniverses() {
  return prisma.universe.findMany({
    include: {
      worlds: {
        include: {
          races: {
            select: {
              id:      true,
              name:    true,
              element: true,
              baseRank: true, 
              isCorrupted: true,
              description: true,
            },
          },
        },
      },
    },
  })
}

export async function getMasterPageData() {
  const session = await auth()
  if (!session?.user?.id) return null

  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true, role: 'MASTER' },
    include: {
      campaign: {
        include: {
          members: {
            include: {
              user: {
                select: { id: true, username: true, avatar: true, avatarCrop: true, email: true },
              },
            },
          },
          characters: {
            include: {
              race: {
                include: {
                  evolutions: true,
                },
              },
              tarotDraws: { orderBy: { drawnAt: 'desc' } },
              conditions: {
                where: { removedAt: null},
                select: { id: true, type: true},
              }
            },
          },
          conditionDefinitions: { orderBy: { name: 'asc' } },
        },
      },
    },
  })

  if (!membership) return null

  const { campaign } = membership
  const currencyRows = await prisma.$queryRaw<Array<{id:string;currency:number}>>`SELECT "id", "currency" FROM "Character" WHERE "campaignId" = ${campaign.id}`
  const currencyById = new Map(currencyRows.map(row => [row.id, row.currency]))

  const characters = campaign.characters.map((char) => ({
    id:            char.id,
    name:          char.name,
    category:      char.category,
    image:         char.image,
    level:         char.level,
    rank:          calcCurrentRank(char.level, char.birthRank, char.race.isCorrupted, char.rankLosses),
    racePath:      char.racePath,
    evolvedRaceId: char.evolvedRaceId,
    playerId:      char.playerId,
    race: {
      id:         char.race.id,
      name:       char.race.name,
      canAscend:  char.race.canAscend,
      canCorrupt: char.race.canCorrupt,
      evolutions: char.race.evolutions.map((e) => ({
        id:            e.id,
        path:          e.path as RacePath,
        levelRequired: e.levelRequired,
        toRaceName:    e.toRaceName,
      })),
    },
    tarotDraws:       char.tarotDraws,
    pv:               char.pv,
    pvMax:            char.pvMax,
    currency:         currencyById.get(char.id) ?? 100,
    xp:               char.xp,
    maxXp:            char.maxXp,
    unspentAttributePoints: char.unspentAttributePoints,
    activeConditions: char.conditions,
  }))

  const players = campaign.members
    .filter((m) => m.role === 'PLAYER')
    .map((m) => ({
      userId: m.user.id,
      username: m.user.username,
      avatar: m.user.avatar,
      avatarCrop: m.user.avatarCrop,
      email: m.user.email,
      character: characters.find((c) => c.playerId === m.user.id) ?? null,
    }))

  // personagens elegíveis para ascensão/corrupção:
  // level atingiu o levelRequired de alguma evolução e ainda não escolheu caminho
  const eligibleForEvolution = characters.filter(
    (c) =>
      c.racePath === null &&
      c.race.evolutions.some((e) => c.level >= e.levelRequired)
  )

  return {
    inviteCode: campaign.inviteCode,
    campaignName: campaign.name,
    campaignActive: campaign.isActive,
    players,
    characters,
    eligibleForEvolution,
    allTarotDraws: characters.flatMap((c) =>
      c.tarotDraws.map((draw) => ({ ...draw, characterName: c.name }))
    ),
    conditionDefinitions: campaign.conditionDefinitions,
  }
}

/** Ajuste de saldo em Estilhaços feito pelo Mestre da campanha. */
export async function adjustCharacterCurrency(characterId: string, delta: number) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')
  const membership = await prisma.campaignMember.findFirst({ where: { userId: session.user.id, active: true, role: 'MASTER' }, select: { campaignId: true } })
  if (!membership) throw new Error('Apenas o Mestre pode ajustar moedas')
  validatedInteger(delta, 'Variação em Estilhaços', -1_000_000, 1_000_000)
  if (!delta) throw new Error('Informe uma variação diferente de zero')
  const rows = await prisma.$queryRaw<Array<{currency:number}>>`UPDATE "Character" SET "currency" = GREATEST(0, "currency" + ${delta}) WHERE "id" = ${characterId} AND "campaignId" = ${membership.campaignId} RETURNING "currency"`
  if (!rows[0]) throw new Error('Personagem não encontrado nesta campanha')
  revalidatePath('/perfil')
  revalidatePath('/mestre')
  return rows[0].currency
}

export async function getSpecialCards(characterId: string) {
  const session = await auth()
  if (!session?.user?.id) return []
  const character = await prisma.character.findFirst({ where: { id: characterId, campaign: { members: { some: { userId: session.user.id, active: true } } } }, select: { playerId: true, campaignId: true } })
  if (!character) return []
  const membership = await prisma.campaignMember.findFirst({ where: { userId: session.user.id, campaignId: character.campaignId, active: true }, select: { role: true } })
  if (!membership || (membership.role !== 'MASTER' && character.playerId !== session.user.id)) return []

  return prisma.specialCard.findMany({
    where: { characterId },
    orderBy: { obtainedAt: 'asc' },
  })
}

export async function saveSpecialCard(characterId: string, cardType: 'VALETE' | 'CAVALEIRO') {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')
  if (!['VALETE', 'CAVALEIRO'].includes(cardType)) throw new Error('Carta especial inválida')
  const character = await prisma.character.findFirst({ where: { id: characterId, playerId: session.user.id, campaign: { members: { some: { userId: session.user.id, active: true, role: 'PLAYER' } } } }, select: { id: true } })
  if (!character) throw new Error('Personagem não encontrado para este jogador')

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Character" WHERE "id" = ${character.id} FOR UPDATE`
    const existing = await tx.specialCard.findFirst({
      where: { characterId: character.id, cardType, isAvailable: true },
    })
    if (existing) throw new Error(`Você já tem um ${cardType} guardado.`)
    return tx.specialCard.create({ data: { characterId: character.id, cardType } })
  })
}

export async function consumeSpecialCard(cardId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')
  const card = await prisma.specialCard.findFirst({ where: { id: cardId, isAvailable: true, character: { playerId: session.user.id, campaign: { members: { some: { userId: session.user.id, active: true, role: 'PLAYER' } } } } }, select: { id: true, characterId: true } })
  if (!card) throw new Error('Carta especial indisponível')

  await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "Character" WHERE "id" = ${card.characterId} FOR UPDATE`
    const character = await tx.character.findFirst({ where: { id: card.characterId, playerId: session.user.id }, select: { specialCardUsedThisScene: true } })
    if (!character) throw new Error('Personagem não encontrado')
    if (character.specialCardUsedThisScene) throw new Error('Você já usou uma carta especial nesta cena. O Mestre precisa iniciar uma nova cena.')
    const result = await tx.specialCard.updateMany({ where: { id: card.id, isAvailable: true }, data: { isAvailable: false, usedAt: new Date() } })
    if (result.count === 0) throw new Error('Carta especial indisponível')
    await tx.character.update({ where: { id: card.characterId }, data: { specialCardUsedThisScene: true } })
  })
  return prisma.specialCard.findUnique({ where: { id: card.id } })
}

/** O Mestre encerra a cena atual e libera uma carta especial para cada personagem. */
export async function resetSpecialCardsForNewScene() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')
  const membership = await prisma.campaignMember.findFirst({ where: { userId: session.user.id, active: true, role: 'MASTER' }, select: { campaignId: true } })
  if (!membership) throw new Error('Apenas o Mestre pode iniciar uma nova cena')
  await prisma.character.updateMany({ where: { campaignId: membership.campaignId }, data: { specialCardUsedThisScene: false } })
  revalidatePath('/mestre')
  revalidatePath('/perfil')
}

export async function spendAttributePoint(characterId: string, attribute: 'agilidade' | 'inteligencia' | 'forca' | 'vigor' | 'sorte') {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')
  const membership = await prisma.campaignMember.findFirst({ where: { userId: session.user.id, active: true, role: 'PLAYER' }, select: { campaignId: true } })
  if (!membership) throw new Error('Sem campanha ativa como jogador')
  const result = await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "Character" WHERE "id" = ${characterId} FOR UPDATE`
    const character = await tx.character.findFirst({ where: { id: characterId, campaignId: membership.campaignId, playerId: session.user.id }, include: { race: { select: { isCorrupted: true } } } })
    if (!character) throw new Error('Personagem não encontrado')
    if (character.unspentAttributePoints < 1) throw new Error('Você não tem pontos de atributo disponíveis')
    const rank = calcCurrentRank(character.level, character.birthRank, character.race.isCorrupted, character.rankLosses)
    const current = character[attribute]
    const maximum = getRankMax(rank)
    if (current >= maximum) throw new Error(`Esse atributo já atingiu o limite do Rank ${rank} (${maximum})`)
    const updated = await tx.character.update({ where: { id: characterId }, data: { [attribute]: current + 1, unspentAttributePoints: { decrement: 1 } }, select: { agilidade: true, inteligencia: true, forca: true, vigor: true, sorte: true, unspentAttributePoints: true } })
    return { value: updated[attribute], remaining: updated.unspentAttributePoints }
  })
  revalidatePath('/perfil')
  revalidatePath('/mestre')
  return result
}

// ─── addXp ────────────────────────────────────────────────
// Adiciona XP ao personagem e processa level up(s) automaticamente.
// O custo por nível usa o birthRank da raça ATUAL (evolvedRaceId ?? raceId).
// Pode subir vários níveis de uma vez se o XP for suficiente.
// Apenas o Mestre pode chamar esta action.

export async function addXp(characterId: string, amount: number) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true, role: 'MASTER' },
  })
  if (!membership) throw new Error('Apenas o Mestre pode conceder XP')
  if (!Number.isInteger(amount) || amount < 1 || amount > 100_000) throw new Error('Quantidade de XP inválida')

  const result = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Character" WHERE "id" = ${characterId} FOR UPDATE`
    const char = await tx.character.findFirst({
      where: { id: characterId, campaignId: membership.campaignId },
      include: { race: { include: { skills: true } }, skills: true },
    })
    if (!char) throw new Error('Personagem não encontrado')

    let currentBirthRank: string = char.race.baseRank
    if (char.evolvedRaceId) {
      const evolvedRace = await tx.race.findUnique({
        where: { id: char.evolvedRaceId },
        select: { baseRank: true },
      })
      if (evolvedRace) currentBirthRank = evolvedRace.baseRank
    }

    let currentLevel = char.level
    let currentXp = char.xp + amount
    while (true) {
      const xpNeeded = calcXpToNextLevel(currentBirthRank)
      if (currentXp < xpNeeded) break
      currentXp -= xpNeeded
      currentLevel += 1
    }
    const newMaxXp = calcXpToNextLevel(currentBirthRank)
    const attributePointsAwarded = Math.floor((currentLevel - 1) / 5) - Math.floor((char.level - 1) / 5)

    await tx.character.update({
      where: { id: characterId },
      data: { xp: currentXp, level: currentLevel, maxXp: newMaxXp, unspentAttributePoints: { increment: attributePointsAwarded } },
    })
    return {
      newLevel: currentLevel,
      newXp: currentXp,
      maxXp: newMaxXp,
      leveledUp: currentLevel > char.level,
      levelsGained: currentLevel - char.level,
      attributePointsAwarded,
      unspentAttributePoints: char.unspentAttributePoints + attributePointsAwarded,
      playerId: char.playerId,
      characterName: char.name,
      newlyUnlockedSkills: [
        ...char.race.skills
          .filter((skill) => {
            const requiredLevel = Math.max(skill.levelRequired, calcFirstSkillUnlock(char.birthRank))
            return char.level < requiredLevel && currentLevel >= requiredLevel
          })
          .map((skill) => skill.name),
        ...char.skills
          .filter((skill) => skill.isUnlocked && char.level < skill.requiredCharacterLevel && currentLevel >= skill.requiredCharacterLevel)
          .map((skill) => skill.name),
      ],
    }
  })

  if (result.playerId && result.newlyUnlockedSkills.length > 0) {
    await Promise.all(result.newlyUnlockedSkills.map((skillName) => createUserNotification({
      userId: result.playerId!,
      preference: 'habilidadesDesbloqueadas',
      type: 'skill_unlocked',
      title: 'Habilidade desbloqueada',
      message: `${skillName} foi desbloqueada para ${result.characterName} ao subir de nível.`,
      href: '/habilidades',
    })))
  }

  revalidatePath('/personagens')
  revalidatePath('/perfil')
  revalidatePath('/mestre')

  return {
    newLevel: result.newLevel,
    newXp: result.newXp,
    maxXp: result.maxXp,
    leveledUp: result.leveledUp,
    levelsGained: result.levelsGained,
    attributePointsAwarded: result.attributePointsAwarded,
    unspentAttributePoints: result.unspentAttributePoints,
  }
}

// ─── applyRaceEvolution ───────────────────────────────────
// Aplica a escolha de evolução de raça de um personagem.
// A escolha (ASCENSAO | CORRUPCAO | PERMANENCIA) é do JOGADOR,
// mas o Mestre confirma/executa pelo painel.
//
// Ao evoluir:
// - evolvedRaceId recebe o id da nova raça
// - racePath recebe o caminho escolhido
// - birthRank do personagem NÃO é alterado diretamente —
//   o custo de XP passa a usar o baseRank da nova raça (via evolvedRaceId)
// - birthRank de nascença (original) é preservado para cálculo de
//   primeiro despertar de habilidade

export async function applyRaceEvolution(
  characterId: string,
  path: 'ASCENSAO' | 'CORRUPCAO' | 'PERMANENCIA'
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true, role: 'MASTER' },
  })
  if (!membership) throw new Error('Apenas o Mestre pode aplicar evolução de raça')

  const char = await prisma.character.findFirst({
    where: { id: characterId, campaignId: membership.campaignId },
    include: {
      race: {
        include: { evolutions: true },
      },
    },
  })
  if (!char) throw new Error('Personagem não encontrado')
  if (char.racePath !== null) throw new Error('Este personagem já escolheu um caminho')

  // PERMANENCIA: apenas registra o caminho, sem trocar de raça
  if (path === 'PERMANENCIA') {
    const updated = await prisma.character.updateMany({
      where: { id: characterId, campaignId: membership.campaignId, racePath: null },
      data: { racePath: 'PERMANENCIA' },
    })
    if (updated.count === 0) throw new Error('Este personagem já escolheu um caminho')

    revalidatePath('/mestre')
    revalidatePath('/personagens')
    return { path: 'PERMANENCIA', newRaceName: null }
  }

  // ASCENSAO ou CORRUPCAO: encontra a evolução correspondente
  const evolution = char.race.evolutions.find(
    (e) => e.path === path && char.level >= e.levelRequired
  )
  if (!evolution) {
    throw new Error(
      `Evolução ${path} não disponível para ${char.race.name} no nível ${char.level}`
    )
  }

  // busca a raça de destino pelo nome (toRaceName definido no seed)
  const targetRace = await prisma.race.findFirst({
    where: { name: evolution.toRaceName, universeWorldId: char.race.universeWorldId },
    select: { id: true, name: true, baseRank: true },
  })
  if (!targetRace) {
    throw new Error(
      `Raça de destino "${evolution.toRaceName}" não encontrada no banco`
    )
  }

  // recalcula maxXp com o birthRank da nova raça
  const newMaxXp = calcXpToNextLevel(targetRace.baseRank)

  const updated = await prisma.character.updateMany({
    where: { id: characterId, campaignId: membership.campaignId, racePath: null },
    data: {
      racePath:      path,
      evolvedRaceId: targetRace.id,
      raceId:        targetRace.id,  // raça ativa agora é a nova
      maxXp:         newMaxXp,
    },
  })
  if (updated.count === 0) throw new Error('Este personagem já escolheu um caminho')

  revalidatePath('/mestre')
  revalidatePath('/personagens')
  revalidatePath('/perfil')

  return {
    path,
    newRaceName:  targetRace.name,
    newBirthRank: targetRace.baseRank,
  }
}

// ─── updateCharacterPoints ────────────────────────────────
// Jogador ajusta PV/PM do próprio personagem durante a narrativa.
// Respeita os limites (0 ↔ pvMax / pmMax).

export async function updateCharacterPoints(
  characterId: string,
  data: { pv?: number; pm?: number }
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true, role: 'PLAYER' },
    select: { campaignId: true },
  })
  if (!membership) throw new Error('Sem campanha ativa como jogador')

  const char = await prisma.character.findFirst({
    where: {
      id: characterId,
      campaignId: membership.campaignId,
      playerId: session.user.id, // só o próprio jogador
    },
    select: { pvMax: true, pmMax: true, pv: true, pm: true },
  })
  if (!char) throw new Error('Personagem não encontrado')

  if (!data || typeof data !== 'object' || Array.isArray(data) || (data.pv === undefined && data.pm === undefined)) {
    throw new Error('Informe PV ou PM para atualizar')
  }
  if (data.pv !== undefined) validatedInteger(data.pv, 'PV', 0, char.pvMax)
  if (data.pm !== undefined) validatedInteger(data.pm, 'PM', 0, char.pmMax)

  const newPv = data.pv
  const newPm = data.pm

  await prisma.character.update({
    where: { id: characterId },
    data: {
      ...(newPv !== undefined && { pv: newPv }),
      ...(newPm !== undefined && { pm: newPm }),
    },
  })

  revalidatePath('/perfil')

  return {
    pv: newPv ?? char.pv,
    pm: newPm ?? char.pm,
  }
}

// ─── deleteCharacter ───────────────────────────────────────
// Apenas o Mestre pode excluir. Skill não tem onDelete: Cascade
// no schema, então precisa ser removida manualmente antes.
export async function deleteCharacter(characterId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true, role: 'MASTER' },
  })
  if (!membership) throw new Error('Apenas o Mestre pode excluir personagens')

  const char = await prisma.character.findFirst({
    where: { id: characterId, campaignId: membership.campaignId },
    select: { id: true },
  })
  if (!char) throw new Error('Personagem não encontrado nesta campanha')

  await prisma.skill.deleteMany({ where: { characterId } })
  await prisma.character.delete({ where: { id: characterId } })

  revalidatePath('/personagens')
  revalidatePath('/mestre')
}

// ─── updateCharacterHistory ────────────────────────────────
// Pode editar: o próprio jogador dono do personagem, ou o Mestre.
export async function updateCharacterHistory(characterId: string, story: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true },
    select: { campaignId: true, role: true },
  })
  if (!membership) throw new Error('Sem campanha ativa')
  const validatedStory = validatedText(story, 'História', { max: 20_000, trim: false })

  const char = await prisma.character.findFirst({
    where: {
      id: characterId,
      campaignId: membership.campaignId,
      ...(membership.role === 'MASTER' ? {} : { playerId: session.user.id }),
    },
    select: { id: true },
  })
  if (!char) throw new Error('Você não tem permissão para editar este personagem')

  await prisma.character.update({
    where: { id: characterId },
    data: { story: validatedStory },
  })

  revalidatePath(`/personagens/${characterId}`)
}

// ─── updateCharacter ────────────────────────────────────────
// Edição de superfície: nome, imagem e o campo específico da
// categoria. Raça/elemento/atributos ficam fixos após a criação.
export async function updateCharacter(
  characterId: string,
  data: {
    name: string
    image?: string
    portraitImage?: string
    year?: number
    subject?: string
    occupation?: string
  }
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  const name = validatedText(data.name, 'Nome do personagem', { min: 2, max: 80 })
  const year = data.year === undefined ? undefined : validatedInteger(data.year, 'Ano', 1, 5)
  const subject = data.subject === undefined ? undefined : validatedText(data.subject, 'Matéria', { max: 100 })
  const occupation = data.occupation === undefined ? undefined : validatedText(data.occupation, 'Ocupação', { max: 100 })
  const image = data.image === undefined ? undefined : validateImageUrl(data.image, 'Imagem') ?? null
  const portraitImage = data.portraitImage === undefined ? undefined : validateImageUrl(data.portraitImage, 'Recorte do retrato') ?? null

  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true, role: 'MASTER' },
  })
  if (!membership) throw new Error('Apenas o Mestre pode editar personagens')

  const char = await prisma.character.findFirst({
    where: { id: characterId, campaignId: membership.campaignId },
    select: { id: true },
  })
  if (!char) throw new Error('Personagem não encontrado nesta campanha')

  await prisma.character.update({
    where: { id: characterId },
    data: {
      name,
      image,
      portraitImage,
      year,
      subject,
      occupation,
    },
  })

  revalidatePath('/personagens')
  revalidatePath(`/personagens/${characterId}`)
  revalidatePath('/mestre')
}
