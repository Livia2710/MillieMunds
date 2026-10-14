'use server'

import { randomInt } from 'node:crypto'
import { prisma } from '@/lib/prisma'
import { requireActiveMembership, requireCharacterInActiveCampaign, requireUserId } from '@/lib/authorization'
import { calcCurrentRank, getRankMax } from '@/lib/utils/rank'
import { calcAutoConditions, calcRankPenalty, getTestConditionModifiers } from '@/lib/utils/conditions'
import { getShieldBlockBonus } from '@/lib/utils/equipment'
import type { EquipmentEffectRecord, EquipmentType } from '@/lib/types/inventory'
import { revalidatePath } from 'next/cache'

type Attribute = 'agilidade' | 'inteligencia' | 'forca' | 'vigor' | 'sorte' | 'vontade'
type CardRank = 'as' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'rainha' | 'rei'
type Result = 'Falha Absoluta' | 'Fracasso' | 'Parcial' | 'Sucesso' | 'Sucesso Garantido' | 'Excepcional' | 'Sem teste'
type CardResult = Exclude<Result, 'Sem teste'>
const ATTRIBUTES: Attribute[] = ['agilidade', 'inteligencia', 'forca', 'vigor', 'sorte', 'vontade']
const ATTRIBUTE_NAMES: Record<Attribute, string> = { agilidade: 'Agilidade', inteligencia: 'Inteligência', forca: 'Força', vigor: 'Vigor', sorte: 'Sorte', vontade: 'Vontade' }
const RANKS = ['as', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'valete', 'cavaleiro', 'rainha', 'rei'] as const
const SUITS = ['paus', 'copas', 'espadas', 'ouro'] as const
const LABELS: Record<CardRank, CardResult> = { as: 'Falha Absoluta', '2': 'Fracasso', '3': 'Fracasso', '4': 'Parcial', '5': 'Parcial', '6': 'Parcial', '7': 'Parcial', '8': 'Sucesso', '9': 'Sucesso', '10': 'Sucesso', rainha: 'Excepcional', rei: 'Sucesso Garantido' }

function applyLevelDifference(result: CardResult, actorLevel: number, opponentLevel: number) {
  const difference = Math.abs(actorLevel - opponentLevel)
  if (difference > 50) return { result: 'Sem teste' as const, difference, note: 'Diferença superior a 50 níveis: o Mestre resolve a situação narrativamente, sem tiragem.' }
  if (difference >= 21 && actorLevel < opponentLevel && ['Sucesso', 'Sucesso Garantido', 'Excepcional'].includes(result)) {
    return { result: 'Parcial' as const, difference, note: 'A diferença de 21 a 50 níveis reduz o sucesso do personagem mais fraco a parcial.' }
  }
  if (difference >= 21 && actorLevel > opponentLevel) return { result, difference, note: 'O personagem testado é o mais forte; o resultado não é reduzido.' }
  return { result, difference, note: difference ? 'Diferença de até 20 níveis: teste normal.' : null }
}

function luckPower(score: number, rank: string) {
  const tiers = ['D', 'C', 'B', 'A', 'S']
  const tier = Math.max(1, tiers.indexOf(rank) + 1)
  const cap = Math.max(1, getRankMax(rank))
  return Math.max(0, Math.min(1, score / cap)) * tier
}

function cardWeight(rank: (typeof RANKS)[number], power: number) {
  if (['8', '9', '10', 'rainha', 'rei'].includes(rank)) return 100 + Math.round(power * 8)
  if (['as', '2', '3'].includes(rank)) return Math.max(60, 100 - Math.round(power * 5))
  return 100
}

function weightedDeck(power: number) {
  const pool = SUITS.flatMap(suit => RANKS.map(rank => ({ suit, rank, weight: cardWeight(rank, power) })))
  const deck: typeof pool = []
  while (pool.length) {
    const total = pool.reduce((sum, card) => sum + card.weight, 0)
    let pick = randomInt(total)
    const index = pool.findIndex(card => (pick -= card.weight) < 0)
    deck.push(pool.splice(index, 1)[0])
  }
  return deck
}

function resolveResult(rank: CardRank, score: number): CardResult {
  const base = LABELS[rank]
  if (rank === 'as' || rank === 'rei' || rank === 'rainha') return base
  const band = Math.min(10, Math.max(1, score))
  if (band <= 3 && ['4', '5', '6', '7'].includes(rank)) return 'Fracasso'
  if (band <= 3 && (rank === '8' || rank === '9')) return 'Parcial'
  if (band >= 7 && band <= 9 && ['4', '5', '6', '7'].includes(rank)) return 'Sucesso'
  if (band === 10 && ['2', '3'].includes(rank)) return 'Parcial'
  return base
}

export async function getSystemTestContext() {
  const userId = await requireUserId()
  const membership = await requireActiveMembership(userId)
  const characters = await prisma.character.findMany({
    where: { campaignId: membership.campaignId, ...(membership.role === 'PLAYER' ? { playerId: userId } : {}) },
      select: { id: true, name: true, agilidade: true, inteligencia: true, forca: true, vigor: true, sorte: true, level: true, pv: true, pvMax: true, birthRank: true, rankLosses: true, conditions: { where: { removedAt: null }, select: { type: true } }, race: { select: { isCorrupted: true } } },
    orderBy: { name: 'asc' },
  })
  const equipment = characters.length ? (await Promise.all(characters.map(character => membership.role === 'PLAYER'
    ? prisma.$queryRaw<Array<{id:string;name:string;ownerId:string|null;equipmentType:string|null;equipmentSubtype:string|null;rarity:string;equipmentDurability:number|null;equipmentMaxDurability:number|null;equipmentEffects:unknown}>>`SELECT "id", "name", "ownerId", "equipmentType", "equipmentSubtype", "rarity", "equipmentDurability", "equipmentMaxDurability", "equipmentEffects" FROM "InventoryItem" WHERE "campaignId" = ${membership.campaignId} AND "category" = 'equipamento' AND "ownerId" = ${character.id} AND "isLocked" = false ORDER BY "name" ASC`
    : prisma.$queryRaw<Array<{id:string;name:string;ownerId:string|null;equipmentType:string|null;equipmentSubtype:string|null;rarity:string;equipmentDurability:number|null;equipmentMaxDurability:number|null;equipmentEffects:unknown}>>`SELECT "id", "name", "ownerId", "equipmentType", "equipmentSubtype", "rarity", "equipmentDurability", "equipmentMaxDurability", "equipmentEffects" FROM "InventoryItem" WHERE "campaignId" = ${membership.campaignId} AND "category" = 'equipamento' AND "ownerId" = ${character.id} ORDER BY "name" ASC`
  ))).flat() : []
  return { role: membership.role, characters: characters.map(character => {
    const rank = calcCurrentRank(character.level, character.birthRank, character.race.isCorrupted, character.rankLosses)
    const attributeMax = getRankMax(rank)
    const effectiveStats = {
      agilidade: Math.min(character.agilidade, attributeMax),
      inteligencia: Math.min(character.inteligencia, attributeMax),
      forca: Math.min(character.forca, attributeMax),
      vigor: Math.min(character.vigor, attributeMax),
      sorte: Math.min(character.sorte, attributeMax),
    }
    const regressionRisk = calcRankPenalty(rank, Object.values(effectiveStats).reduce((sum, value) => sum + value, 0)).regressionRisk
    const characterEquipment = equipment.filter(item => item.ownerId === character.id).map(item => ({
      id: item.id,
      name: item.name,
      type: item.equipmentType as EquipmentType | null,
      subtype: item.equipmentSubtype,
      rarity: item.rarity,
      durability: item.equipmentDurability,
      maxDurability: item.equipmentMaxDurability,
      effects: Array.isArray(item.equipmentEffects) ? item.equipmentEffects as EquipmentEffectRecord[] : [],
    }))
    return { id: character.id, name: character.name, ...effectiveStats, level: character.level, pv: character.pv, pvMax: character.pvMax, conditions: character.conditions.map(condition => condition.type), rank, regressionRisk, canLoseRank: !character.race.isCorrupted && rank !== 'D', equipment: characterEquipment }
  }) }
}

export async function getSystemTestCharacters() {
  const userId = await requireUserId()
  const membership = await requireActiveMembership(userId, 'MASTER')
  return prisma.character.findMany({
    where: { campaignId: membership.campaignId },
    select: { id: true, name: true, agilidade: true, inteligencia: true, forca: true, vigor: true, sorte: true },
    orderBy: { name: 'asc' },
  })
}

export async function performSystemTest(data: { characterId: string; attribute: Attribute; opponentCharacterId?: string; shieldItemId?: string; offensive?: boolean }) {
  const userId = await requireUserId()
  const membership = await requireActiveMembership(userId)
  if (!ATTRIBUTES.includes(data.attribute)) throw new Error('Atributo de teste inválido')
  const { character } = await requireCharacterInActiveCampaign(data.characterId, userId)
  if (membership.role === 'PLAYER' && character.playerId !== userId) throw new Error('Você só pode testar com um personagem seu')

  return prisma.$transaction(async tx => {
    await tx.$queryRawUnsafe('SELECT "id" FROM "Character" WHERE "id" = $1 FOR UPDATE', character.id)
    const current = await tx.character.findFirst({
      where: { id: character.id, campaignId: membership.campaignId },
      select: { id: true, name: true, agilidade: true, inteligencia: true, forca: true, vigor: true, sorte: true, level: true, pv: true, pvMax: true, birthRank: true, rankLosses: true, conditions: { where: { removedAt: null }, select: { type: true } }, race: { select: { isCorrupted: true } } },
    })
    if (!current) throw new Error('Personagem não encontrado')
    if (data.offensive !== undefined && typeof data.offensive !== 'boolean') throw new Error('Tipo de ação inválido')
    const rankName = calcCurrentRank(current.level, current.birthRank, current.race.isCorrupted, current.rankLosses)
    const attributeMax = getRankMax(rankName)
    const stats = {
      agilidade: Math.min(current.agilidade, attributeMax),
      inteligencia: Math.min(current.inteligencia, attributeMax),
      forca: Math.min(current.forca, attributeMax),
      vigor: Math.min(current.vigor, attributeMax),
      sorte: Math.min(current.sorte, attributeMax),
    }
    const power = luckPower(stats.sorte, rankName)
    const penalty = calcRankPenalty(rankName, Object.values(stats).reduce((sum, value) => sum + value, 0)).penalty
    const conditions = [...new Set([
      ...current.conditions.map(condition => condition.type),
      ...calcAutoConditions(current.pv, current.pvMax),
    ])]
    const sourceAttributes = data.attribute === 'vontade' ? ['inteligencia', 'vigor'] as const : [data.attribute] as const
    const candidates = sourceAttributes.map(sourceAttribute => {
      const modifiers = getTestConditionModifiers(conditions, sourceAttribute, data.offensive ?? false)
      const conditionPenalty = modifiers.reduce((total, modifier) => total + modifier.penalty, 0)
      const totalPenalty = Math.min(4, penalty - conditionPenalty)
      const baseScore = stats[sourceAttribute]
      return { modifiers, totalPenalty, baseScore, adjustedScore: Math.max(1, baseScore - totalPenalty) }
    })
    const chosen = candidates.reduce((best, candidate) => candidate.adjustedScore > best.adjustedScore ? candidate : best)
    const conditionModifiers = chosen.modifiers
    const totalPenalty = chosen.totalPenalty
    const baseScore = chosen.baseScore
    let shieldBonus = 0
    if (data.shieldItemId) {
      if (data.attribute !== 'vigor') throw new Error('O bônus de escudo só vale no teste de bloqueio com Vigor')
      const shields = await tx.$queryRaw<Array<{rarity:string;equipmentDurability:number|null}>>`SELECT "rarity", "equipmentDurability" FROM "InventoryItem" WHERE "id" = ${data.shieldItemId} AND "campaignId" = ${membership.campaignId} AND "ownerId" = ${current.id} AND "category" = 'equipamento' AND "equipmentType" = 'escudo' LIMIT 1`
      if (!shields[0]) throw new Error('O escudo selecionado não pertence a este personagem')
      shieldBonus = getShieldBlockBonus(shields[0].rarity, shields[0].equipmentDurability === 0)
    }
    const effectiveScore = Math.max(1, chosen.adjustedScore + shieldBonus)
    let opponent: { id: string; name: string; level: number } | null = null
    if (data.opponentCharacterId) {
      if (membership.role !== 'MASTER') throw new Error('Somente o Mestre pode definir um oponente para o teste')
      if (data.opponentCharacterId === current.id) throw new Error('Escolha outro personagem como oponente')
      opponent = await tx.character.findFirst({ where: { id: data.opponentCharacterId, campaignId: membership.campaignId }, select: { id: true, name: true, level: true } })
      if (!opponent) throw new Error('O personagem oponente não pertence à campanha ativa')
      if (Math.abs(current.level - opponent.level) > 50) {
        const comparison = applyLevelDifference('Fracasso', current.level, opponent.level)
        return {
          characterName: current.name, opponentName: opponent.name, attribute: data.attribute,
          attributeName: ATTRIBUTE_NAMES[data.attribute], attributeValue: baseScore, adjustedAttribute: effectiveScore, adjustmentBand: Math.min(10, effectiveScore),
          card: 'Sem tiragem', baseResult: 'Sem teste' as const, result: comparison.result,
          rankPenalty: penalty, conditionModifiers, totalPenalty, luckPower: Math.round(power * 100), specialCardsCollected: [],
          shieldBonus,
          attributeAboveTenNote: null, levelDifference: comparison.difference, levelRuleNote: comparison.note,
          regressionRisk: calcRankPenalty(rankName, Object.values(stats).reduce((sum, value) => sum + value, 0)).regressionRisk,
        }
      }
    }
    const deck = weightedDeck(power)
    const collected: string[] = []
    let resultCard: (typeof deck)[number] | undefined

    for (const card of deck) {
      if (card.rank === 'valete' || card.rank === 'cavaleiro') {
        const cardType = card.rank === 'valete' ? 'VALETE' : 'CAVALEIRO'
        const saved = await tx.specialCard.findFirst({ where: { characterId: current.id, cardType, isAvailable: true }, select: { id: true } })
        if (!saved) {
          await tx.specialCard.create({ data: { characterId: current.id, cardType } })
          collected.push(cardType === 'VALETE' ? 'Valete' : 'Cavaleiro')
        }
        continue
      }
      resultCard = card
      break
    }
    if (!resultCard || !(resultCard.rank in LABELS)) throw new Error('Não foi possível retirar uma carta de resultado')
    const rank = resultCard.rank as CardRank
    const cardName = (rank === 'as' ? 'Ás' : rank.charAt(0).toUpperCase() + rank.slice(1)) + ' de ' + resultCard.suit.charAt(0).toUpperCase() + resultCard.suit.slice(1)
    const rawResult = resolveResult(rank, effectiveScore)
    const comparison = opponent ? applyLevelDifference(rawResult, current.level, opponent.level) : null
    return {
      characterName: current.name,
      opponentName: opponent?.name ?? null,
      attribute: data.attribute,
      attributeName: ATTRIBUTE_NAMES[data.attribute],
      attributeValue: baseScore,
      adjustedAttribute: effectiveScore,
      adjustmentBand: Math.min(10, effectiveScore),
      card: cardName,
      cardRank: rank,
      baseResult: LABELS[rank],
      result: comparison?.result ?? rawResult,
      rankPenalty: penalty,
      conditionModifiers,
      totalPenalty,
      shieldBonus,
      luckPower: Math.round(power * 100),
      specialCardsCollected: collected,
      attributeAboveTenNote: effectiveScore > 10 ? 'Para alterar a carta, foi usada a faixa 10.' : null,
      levelDifference: comparison?.difference ?? null,
      levelRuleNote: comparison?.note ?? null,
      regressionRisk: calcRankPenalty(rankName, Object.values(stats).reduce((sum, value) => sum + value, 0)).regressionRisk,
    }
  })
}

/** Applies an already previewed combat result. Only the Master can commit automatic damage. */
export async function applyCombatDamage(data: {
  attackerCharacterId: string
  targetCharacterId: string
  damage: number
  weaponItemId?: string
  armorItemId?: string
  wearWeapon?: boolean
  wearArmor?: boolean
}) {
  const userId = await requireUserId()
  const membership = await requireActiveMembership(userId, 'MASTER')
  if (!Number.isInteger(data.damage) || data.damage < 0) throw new Error('Dano inválido')
  if ((data.wearWeapon !== undefined && typeof data.wearWeapon !== 'boolean') || (data.wearArmor !== undefined && typeof data.wearArmor !== 'boolean')) throw new Error('Configuração de desgaste inválida')
  if (data.wearWeapon && !data.weaponItemId) throw new Error('Selecione a arma que perdeu durabilidade')
  if (data.wearArmor && !data.armorItemId) throw new Error('Selecione a armadura que perdeu durabilidade')

  const result = await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "Character" WHERE "id" = ${data.targetCharacterId} AND "campaignId" = ${membership.campaignId} FOR UPDATE`
    const target = await tx.character.findFirst({ where: { id: data.targetCharacterId, campaignId: membership.campaignId }, select: { id: true, name: true, pv: true, pvMax: true } })
    if (!target) throw new Error('Alvo não encontrado nesta campanha')
    if (data.damage > Math.ceil(target.pvMax * 0.6)) throw new Error('O dano excede o limite do sistema')
    const pv = Math.max(0, target.pv - data.damage)
    await tx.character.update({ where: { id: target.id }, data: { pv } })

    const wearItem = async (itemId: string, ownerId: string, type: 'arma' | 'armadura') => {
      const items = await tx.$queryRaw<Array<{ id: string; equipmentDurability: number | null; equipmentMaxDurability: number | null }>>`SELECT "id", "equipmentDurability", "equipmentMaxDurability" FROM "InventoryItem" WHERE "id" = ${itemId} AND "campaignId" = ${membership.campaignId} AND "ownerId" = ${ownerId} AND "category" = 'equipamento' AND "equipmentType" = ${type} FOR UPDATE`
      const item = items[0]
      if (!item) throw new Error(`O item selecionado não é uma ${type} equipada pelo personagem esperado`)
      if (item.equipmentDurability === null) return null
      const durability = Math.max(0, item.equipmentDurability - 1)
      await tx.$executeRaw`UPDATE "InventoryItem" SET "equipmentDurability" = ${durability} WHERE "id" = ${item.id}`
      return { itemId: item.id, durability, maxDurability: item.equipmentMaxDurability }
    }

    const weapon = data.wearWeapon && data.weaponItemId ? await wearItem(data.weaponItemId, data.attackerCharacterId, 'arma') : null
    const armor = data.wearArmor && data.armorItemId ? await wearItem(data.armorItemId, target.id, 'armadura') : null
    return { characterName: target.name, pv, pvMax: target.pvMax, damage: target.pv - pv, weapon, armor }
  })
  revalidatePath('/mestre')
  revalidatePath('/perfil')
  revalidatePath('/personagens')
  revalidatePath('/inventario')
  return result
}

/** Resolve um descanso curto ou longo e recupera PV e PM pelo mesmo resultado. */
export async function performCharacterRest(characterId: string, restType: 'curto' | 'longo') {
  const userId = await requireUserId()
  const membership = await requireActiveMembership(userId)
  if (restType !== 'curto' && restType !== 'longo') throw new Error('Tipo de descanso inválido')
  const { character } = await requireCharacterInActiveCampaign(characterId, userId)
  if (membership.role === 'PLAYER' && character.playerId !== userId) throw new Error('Você só pode descansar com um personagem seu')

  const result = await prisma.$transaction(async tx => {
    await tx.$queryRawUnsafe('SELECT "id" FROM "Character" WHERE "id" = $1 FOR UPDATE', character.id)
    const current = await tx.character.findFirst({ where: { id: character.id, campaignId: membership.campaignId }, select: { id: true, name: true, vigor: true, inteligencia: true, pv: true, pvMax: true, pm: true, pmMax: true, sorte: true, level: true, birthRank: true, rankLosses: true, race: { select: { isCorrupted: true } } } })
    if (!current) throw new Error('Personagem não encontrado')
    const activeConditions = await tx.characterCondition.findMany({ where: { characterId: current.id, removedAt: null }, select: { type: true } })
    const preventsNaturalPvRecovery = activeConditions.some(condition => ['inanido', 'desidratado', 'fogo_infernal'].includes(condition.type))
    const rankName = calcCurrentRank(current.level, current.birthRank, current.race.isCorrupted, current.rankLosses)
    const attributeMax = getRankMax(rankName)
    const vigor = Math.min(current.vigor, attributeMax)
    const intelligence = Math.min(current.inteligencia, attributeMax)
    const deck = weightedDeck(luckPower(current.sorte, rankName))
    const specialCardsCollected: string[] = []
    let drawn: (typeof deck)[number] | undefined
    for (const card of deck) {
      if (card.rank === 'valete' || card.rank === 'cavaleiro') {
        const cardType = card.rank === 'valete' ? 'VALETE' : 'CAVALEIRO'
        const saved = await tx.specialCard.findFirst({ where: { characterId: current.id, cardType, isAvailable: true }, select: { id: true } })
        if (!saved) {
          await tx.specialCard.create({ data: { characterId: current.id, cardType } })
          specialCardsCollected.push(cardType === 'VALETE' ? 'Valete' : 'Cavaleiro')
        }
        continue
      }
      drawn = card
      break
    }
    if (!drawn) throw new Error('Não foi possível retirar uma carta de descanso')
    const result = drawn.rank === 'as' ? 'Fracasso' : drawn.rank === 'rei' || drawn.rank === 'rainha' ? 'Excepcional' : resolveResult(drawn.rank as CardRank, vigor)
    const divisor = restType === 'curto'
      ? ({ 'Falha Absoluta': 8, Fracasso: 8, Parcial: 6, Sucesso: 4, 'Sucesso Garantido': 4, Excepcional: 2 } as const)[result]
      : ({ 'Falha Absoluta': 4, Fracasso: 4, Parcial: 3, Sucesso: 2, 'Sucesso Garantido': 2, Excepcional: 1 } as const)[result]
    const pvRecovered = Math.max(1, Math.ceil(vigor / divisor))
    const pmRecovered = Math.max(1, Math.ceil(intelligence / divisor))
    const pv = preventsNaturalPvRecovery ? current.pv : Math.min(current.pvMax, current.pv + pvRecovered)
    const pm = Math.min(current.pmMax, current.pm + pmRecovered)
    await tx.character.update({ where: { id: current.id }, data: { pv, pm } })
    const rank = drawn.rank as CardRank
    const cardName = (rank === 'as' ? 'Ás' : rank.charAt(0).toUpperCase() + rank.slice(1)) + ' de ' + drawn.suit.charAt(0).toUpperCase() + drawn.suit.slice(1)
    return { characterName: current.name, restType, card: cardName, result, pvRecovered: pv - current.pv, pmRecovered: pm - current.pm, pv, pvMax: current.pvMax, pm, pmMax: current.pmMax, specialCardsCollected }
  })
  revalidatePath('/perfil')
  revalidatePath('/personagens')
  revalidatePath('/mestre')
  return result
}

/** Teste de Vigor opcional do Mestre diante de risco de regressão de Rank. */
export async function performRankRegressionCheck(characterId: string) {
  const userId = await requireUserId()
  const membership = await requireActiveMembership(userId, 'MASTER')
  const { character } = await requireCharacterInActiveCampaign(characterId, userId, 'MASTER')
  const outcome = await prisma.$transaction(async tx => {
    await tx.$queryRawUnsafe('SELECT "id" FROM "Character" WHERE "id" = $1 FOR UPDATE', character.id)
    const current = await tx.character.findFirst({
      where: { id: character.id, campaignId: membership.campaignId },
      select: { id: true, name: true, level: true, birthRank: true, rankLosses: true, vigor: true, agilidade: true, inteligencia: true, forca: true, sorte: true, race: { select: { isCorrupted: true } } },
    })
    if (!current) throw new Error('Personagem não encontrado')
    const rankBefore = calcCurrentRank(current.level, current.birthRank, current.race.isCorrupted, current.rankLosses)
    const attributeMax = getRankMax(rankBefore)
    const stats = [current.agilidade, current.inteligencia, current.forca, current.vigor, current.sorte].map(value => Math.min(value, attributeMax))
    const risk = calcRankPenalty(rankBefore, stats.reduce((sum, value) => sum + value, 0))
    if (!risk.regressionRisk) throw new Error('Este personagem não está na faixa de risco de regressão')
    if (current.race.isCorrupted || rankBefore === 'D') throw new Error('O personagem não pode regredir abaixo do Rank D')

    const deck = weightedDeck(luckPower(current.sorte, rankBefore))
    const specialCardsCollected: string[] = []
    let drawn: (typeof deck)[number] | undefined
    for (const card of deck) {
      if (card.rank === 'valete' || card.rank === 'cavaleiro') {
        const cardType = card.rank === 'valete' ? 'VALETE' : 'CAVALEIRO'
        const saved = await tx.specialCard.findFirst({ where: { characterId: current.id, cardType, isAvailable: true }, select: { id: true } })
        if (!saved) {
          await tx.specialCard.create({ data: { characterId: current.id, cardType } })
          specialCardsCollected.push(cardType === 'VALETE' ? 'Valete' : 'Cavaleiro')
        }
        continue
      }
      drawn = card
      break
    }
    if (!drawn || !(drawn.rank in LABELS)) throw new Error('Não foi possível retirar uma carta de resultado')
    const result = resolveResult(drawn.rank as CardRank, Math.min(current.vigor, attributeMax))
    const rankLost = result === 'Falha Absoluta' || result === 'Fracasso'
    const rankLossesAfter = current.rankLosses + (rankLost ? 1 : 0)
    if (rankLost) await tx.character.update({ where: { id: current.id }, data: { rankLosses: { increment: 1 } } })
    const rankAfter = calcCurrentRank(current.level, current.birthRank, current.race.isCorrupted, rankLossesAfter)
    const cardName = (drawn.rank === 'as' ? 'Ás' : drawn.rank.charAt(0).toUpperCase() + drawn.rank.slice(1)) + ' de ' + drawn.suit.charAt(0).toUpperCase() + drawn.suit.slice(1)
    return { characterName: current.name, card: cardName, result, vigor: Math.min(current.vigor, attributeMax), rankBefore, rankAfter, rankLost, specialCardsCollected }
  })
  revalidatePath('/mestre')
  revalidatePath('/perfil')
  return outcome
}

/** Tira uma carta comum para a exibição do perfil, aplicando o modificador de Sorte. */
export async function drawNormalCard(characterId: string) {
  const userId = await requireUserId()
  const membership = await requireActiveMembership(userId, 'PLAYER')
  const character = await prisma.character.findFirst({
    where: { id: characterId, campaignId: membership.campaignId, playerId: userId },
    select: { sorte: true, level: true, birthRank: true, rankLosses: true, race: { select: { isCorrupted: true } } },
  })
  if (!character) throw new Error('Personagem não encontrado')
  const rankName = calcCurrentRank(character.level, character.birthRank, character.race.isCorrupted, character.rankLosses)
  const card = weightedDeck(luckPower(character.sorte, rankName))[0]
  return { cardId: `${card.rank}-${card.suit}`, rank: rankName, luckPower: Math.round(luckPower(character.sorte, rankName) * 100) }
}
