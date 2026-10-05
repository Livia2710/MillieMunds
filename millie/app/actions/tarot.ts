'use server'

import { randomInt } from 'crypto'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireActiveMembership, requireUserId } from '@/lib/authorization'
import { cardsRequired, MAJOR_ARCANA } from '@/lib/tarot'

async function getMasterDraw(drawId: string, userId: string) {
  const membership = await requireActiveMembership(userId, 'MASTER')
  const draw = await prisma.tarotDraw.findFirst({ where: { id: drawId, character: { campaignId: membership.campaignId } } })
  if (!draw) throw new Error('Leitura não encontrada na campanha ativa')
  return draw
}

export async function initiateTarotReading(data: { characterId: string; readingType: 'COMUM' | 'PROFUNDA'; question: string }) {
  const userId = await requireUserId()
  const membership = await requireActiveMembership(userId, 'MASTER')
  const question = data.question.trim()
  if (!question || question.length > 500) throw new Error('A pergunta deve ter entre 1 e 500 caracteres')
  if (!['COMUM', 'PROFUNDA'].includes(data.readingType)) throw new Error('Tipo de leitura inválido')
  const character = await prisma.character.findFirst({ where: { id: data.characterId, campaignId: membership.campaignId, playerId: { not: null } }, select: { id: true } })
  if (!character) throw new Error('Personagem de jogador não encontrado na campanha ativa')
  const draw = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Character" WHERE "id" = ${character.id} FOR UPDATE`
    const currentCharacter = await tx.character.findFirst({
      where: { id: character.id, campaignId: membership.campaignId, playerId: { not: null } },
      select: { id: true },
    })
    if (!currentCharacter) throw new Error('Personagem de jogador não encontrado na campanha ativa')
    await tx.tarotDraw.updateMany({ where: { characterId: character.id, status: { in: ['pendente', 'cartas_reveladas'] } }, data: { status: 'cancelada' } })
    return tx.tarotDraw.create({ data: { characterId: character.id, readingType: data.readingType, question, cards: [], sacrifice: '', status: 'pendente', initiatedByMasterId: userId } })
  })
  revalidatePath('/mestre')
  return draw
}

export async function drawTarotCard(drawId: string) {
  const userId = await requireUserId()
  const membership = await requireActiveMembership(userId, 'PLAYER')
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "TarotDraw" WHERE "id" = ${drawId} FOR UPDATE`
    const draw = await tx.tarotDraw.findFirst({
      where: { id: drawId, character: { playerId: userId, campaignId: membership.campaignId } },
    })
    if (!draw) throw new Error('Leitura não encontrada para este jogador')
    if (draw.status !== 'pendente') throw new Error('Esta leitura não está aguardando cartas')
    const required = cardsRequired(draw.readingType)
    if (draw.cards.length >= required) throw new Error('Todas as cartas desta leitura já foram tiradas')
    const available = MAJOR_ARCANA.filter((card) => !draw.cards.includes(card))
    if (!available.length) throw new Error('Não há mais cartas disponíveis nesta leitura')
    const card = available[randomInt(available.length)]
    const updated = await tx.tarotDraw.update({ where: { id: draw.id }, data: { cards: [...draw.cards, card], hadJoker: false } })
    return { card, position: updated.cards.length }
  })
}

export async function submitTarotCards(drawId: string) {
  const userId = await requireUserId()
  const membership = await requireActiveMembership(userId, 'PLAYER')
  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "TarotDraw" WHERE "id" = ${drawId} FOR UPDATE`
    const draw = await tx.tarotDraw.findFirst({ where: { id: drawId, character: { playerId: userId, campaignId: membership.campaignId } } })
    if (!draw) throw new Error('Leitura não encontrada para este jogador')
    if (draw.status !== 'pendente') throw new Error('Esta leitura não pode mais ser enviada')
    const required = cardsRequired(draw.readingType)
    if (draw.cards.length !== required || new Set(draw.cards).size !== required || draw.cards.some((card) => !MAJOR_ARCANA.includes(card as typeof MAJOR_ARCANA[number]))) {
      throw new Error('A leitura precisa conter a quantidade correta de arcanos maiores distintos')
    }
    await tx.tarotDraw.update({ where: { id: draw.id }, data: { status: 'cartas_reveladas', hadJoker: false } })
  })
  revalidatePath('/mestre')
  revalidatePath('/perfil')
}

export async function completeTarotReading(data: { drawId: string; sacrifice: string; sacrificeIsPermanent: boolean }) {
  const userId = await requireUserId()
  const draw = await getMasterDraw(data.drawId, userId)
  if (draw.status !== 'cartas_reveladas') throw new Error('A leitura ainda não está pronta para conclusão')
  const sacrifice = data.sacrifice.trim()
  if (sacrifice.length > 2_000) throw new Error('O sacrifício pode ter no máximo 2.000 caracteres')
  const updated = await prisma.tarotDraw.updateMany({
    where: { id: draw.id, status: 'cartas_reveladas' },
    data: { sacrifice, sacrificeIsPermanent: data.sacrificeIsPermanent === true, status: 'concluida' },
  })
  if (updated.count === 0) throw new Error('Esta leitura já foi concluída')
  revalidatePath('/mestre')
  revalidatePath('/perfil')
}

export async function getPendingTarotReading(characterId: string) {
  const userId = await requireUserId()
  const membership = await requireActiveMembership(userId, 'PLAYER')
  const character = await prisma.character.findFirst({ where: { id: characterId, campaignId: membership.campaignId, playerId: userId }, select: { id: true } })
  if (!character) return null
  return prisma.tarotDraw.findFirst({ where: { characterId: character.id, status: 'pendente' }, orderBy: { drawnAt: 'desc' } })
}

export async function getMasterPendingReading(characterId: string) {
  const userId = await requireUserId()
  const membership = await requireActiveMembership(userId, 'MASTER')
  return prisma.tarotDraw.findFirst({ where: { characterId, status: 'cartas_reveladas', character: { campaignId: membership.campaignId } }, orderBy: { drawnAt: 'desc' } })
}
