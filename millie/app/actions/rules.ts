'use server'

import { randomInt } from 'node:crypto'
import { prisma } from '@/lib/prisma'
import { requireActiveMembership, requireCharacterInActiveCampaign, requireUserId } from '@/lib/authorization'

type Attribute = 'agilidade' | 'inteligencia' | 'forca' | 'vigor' | 'sorte'
type CardRank = 'as' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'rainha' | 'rei'
type Result = 'Falha Absoluta' | 'Fracasso' | 'Parcial' | 'Sucesso' | 'Sucesso Garantido' | 'Excepcional'
const ATTRIBUTES: Attribute[] = ['agilidade', 'inteligencia', 'forca', 'vigor', 'sorte']
const ATTRIBUTE_NAMES: Record<Attribute, string> = { agilidade: 'Agilidade', inteligencia: 'Inteligência', forca: 'Força', vigor: 'Vigor', sorte: 'Sorte' }
const RANKS = ['as', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'valete', 'cavaleiro', 'rainha', 'rei'] as const
const SUITS = ['paus', 'copas', 'espadas', 'ouro'] as const
const LABELS: Record<CardRank, Result> = { as: 'Falha Absoluta', '2': 'Fracasso', '3': 'Fracasso', '4': 'Parcial', '5': 'Parcial', '6': 'Parcial', '7': 'Parcial', '8': 'Sucesso', '9': 'Sucesso', '10': 'Sucesso', rainha: 'Excepcional', rei: 'Sucesso Garantido' }

function shuffledDeck() {
  const deck = SUITS.flatMap(suit => RANKS.map(rank => ({ suit, rank })))
  for (let i = deck.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

function resolveResult(rank: CardRank, score: number): Result {
  const base = LABELS[rank]
  if (rank === 'as' || rank === 'rei' || rank === 'rainha') return base
  const band = Math.min(10, Math.max(1, score))
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
    select: { id: true, name: true, agilidade: true, inteligencia: true, forca: true, vigor: true, sorte: true },
    orderBy: { name: 'asc' },
  })
  return { role: membership.role, characters }
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

export async function performSystemTest(data: { characterId: string; attribute: Attribute }) {
  const userId = await requireUserId()
  const membership = await requireActiveMembership(userId)
  if (!ATTRIBUTES.includes(data.attribute)) throw new Error('Atributo de teste inválido')
  const { character } = await requireCharacterInActiveCampaign(data.characterId, userId)
  if (membership.role === 'PLAYER' && character.playerId !== userId) throw new Error('Você só pode testar com um personagem seu')

  return prisma.$transaction(async tx => {
    await tx.$queryRawUnsafe('SELECT "id" FROM "Character" WHERE "id" = $1 FOR UPDATE', character.id)
    const current = await tx.character.findFirst({
      where: { id: character.id, campaignId: membership.campaignId },
      select: { id: true, name: true, agilidade: true, inteligencia: true, forca: true, vigor: true, sorte: true },
    })
    if (!current) throw new Error('Personagem não encontrado')
    const score = current[data.attribute]
    const deck = shuffledDeck()
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
    return {
      characterName: current.name,
      attribute: data.attribute,
      attributeName: ATTRIBUTE_NAMES[data.attribute],
      attributeValue: score,
      adjustmentBand: Math.min(10, score),
      card: cardName,
      baseResult: LABELS[rank],
      result: resolveResult(rank, score),
      specialCardsCollected: collected,
      attributeAboveTenNote: score > 10 ? 'Para alterar a carta, foi usada a faixa 10, pois o livro não define ajuste acima desse valor.' : null,
    }
  })
}
