'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { CONDITION_LABELS, MANUAL_CONDITIONS, type ManualCondition } from '@/lib/utils/conditions'
import { requireActiveMembership, requireCharacterInActiveCampaign, requireUserId } from '@/lib/authorization'
import { validatedText } from '@/lib/validation'

export async function addCondition(characterId: string, type: ManualCondition) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  const { membership } = await requireCharacterInActiveCampaign(characterId, session.user.id, 'MASTER')
  if (!MANUAL_CONDITIONS.some((condition) => condition === type) || !Object.hasOwn(CONDITION_LABELS, type)) {
    throw new Error('Condição inválida')
  }

  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Character" WHERE "id" = ${characterId} FOR UPDATE`
    const existing = await tx.characterCondition.findFirst({
      where: { characterId, type, removedAt: null, character: { campaignId: membership.campaignId } },
    })
    if (existing) throw new Error(`Personagem já está com a condição ${CONDITION_LABELS[type]}`)
    await tx.characterCondition.create({ data: { characterId, type } })
  })

  revalidatePath('/mestre')
  revalidatePath('/perfil')
}

export async function removeCondition(conditionId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  const membership = await prisma.campaignMember.findFirst({ where: { userId: session.user.id, active: true, role: 'MASTER' }, select: { campaignId: true } })
  if (!membership) throw new Error('Apenas o Mestre pode remover condições')
  const condition = await prisma.characterCondition.findFirst({ where: { id: conditionId, character: { campaignId: membership.campaignId } }, select: { id: true } })
  if (!condition) throw new Error('Condição não encontrada nesta campanha')

  await prisma.characterCondition.update({
    where: { id: condition.id },
    data: { removedAt: new Date() },
  })

  revalidatePath('/mestre')
  revalidatePath('/perfil')
}

export async function getActiveConditions(characterId: string) {
  const session = await auth()
  if (!session?.user?.id) return []

  const character = await prisma.character.findFirst({
    where: { id: characterId, campaign: { members: { some: { userId: session.user.id, active: true } } } },
    select: { playerId: true, campaignId: true },
  })
  if (!character) return []
  const membership = await prisma.campaignMember.findFirst({ where: { userId: session.user.id, campaignId: character.campaignId, active: true }, select: { role: true } })
  if (!membership || (membership.role !== 'MASTER' && character.playerId !== session.user.id)) return []
  const conditions = await prisma.characterCondition.findMany({
    where: { characterId, removedAt: null, character: { campaignId: character.campaignId } },
    orderBy: { appliedAt: 'asc' },
  })
  const customIds = conditions.map(c => c.type.startsWith('custom:') ? c.type.slice(7) : '').filter(Boolean)
  const definitions = customIds.length ? await prisma.campaignConditionDefinition.findMany({ where: { id: { in: customIds }, campaignId: character.campaignId } }) : []
  const byId = new Map(definitions.map(d => [d.id, d]))
  return conditions.map(condition => ({ ...condition, definition: byId.get(condition.type.startsWith('custom:') ? condition.type.slice(7) : '') ?? null }))
}

export async function getCampaignConditionDefinitions() {
  const userId = await requireUserId()
  const membership = await requireActiveMembership(userId, 'MASTER')
  return prisma.campaignConditionDefinition.findMany({ where: { campaignId: membership.campaignId }, orderBy: { name: 'asc' } })
}

function validateDefinition(input: { name: string; cause: string; color: string; removalInstructions: string }) {
  const name = validatedText(input.name, 'Nome da condição', { min: 2, max: 60 })
  const cause = validatedText(input.cause, 'Causa da condição', { min: 2, max: 1000 })
  const removalInstructions = validatedText(input.removalInstructions, 'Como remover', { min: 2, max: 1000 })
  if (!/^#[0-9a-f]{6}$/i.test(input.color)) throw new Error('Escolha uma cor hexadecimal válida')
  return { name, cause, removalInstructions, color: input.color.toUpperCase() }
}

export async function saveCampaignConditionDefinition(input: { id?: string; name: string; cause: string; color: string; removalInstructions: string }) {
  const userId = await requireUserId()
  const membership = await requireActiveMembership(userId, 'MASTER')
  const data = validateDefinition(input)
  if (input.id) {
    const result = await prisma.campaignConditionDefinition.updateMany({ where: { id: input.id, campaignId: membership.campaignId }, data })
    if (!result.count) throw new Error('Condição não encontrada nesta campanha')
  } else {
    await prisma.campaignConditionDefinition.create({ data: { ...data, campaignId: membership.campaignId } })
  }
  revalidatePath('/mestre')
  revalidatePath('/perfil')
}

export async function deleteCampaignConditionDefinition(definitionId: string) {
  const userId = await requireUserId()
  const membership = await requireActiveMembership(userId, 'MASTER')
  await prisma.$transaction(async tx => {
    const definition = await tx.campaignConditionDefinition.findFirst({ where: { id: definitionId, campaignId: membership.campaignId } })
    if (!definition) throw new Error('Condição não encontrada nesta campanha')
    await tx.characterCondition.updateMany({ where: { type: `custom:${definition.id}`, removedAt: null, character: { campaignId: membership.campaignId } }, data: { removedAt: new Date() } })
    await tx.campaignConditionDefinition.delete({ where: { id: definition.id } })
  })
  revalidatePath('/mestre')
  revalidatePath('/perfil')
}

export async function addCampaignCondition(characterId: string, definitionId: string) {
  const userId = await requireUserId()
  const { membership } = await requireCharacterInActiveCampaign(characterId, userId, 'MASTER')
  const definition = await prisma.campaignConditionDefinition.findFirst({ where: { id: definitionId, campaignId: membership.campaignId } })
  if (!definition) throw new Error('Condição não encontrada nesta campanha')
  const type = `custom:${definition.id}`
  await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "Character" WHERE "id" = ${characterId} FOR UPDATE`
    const existing = await tx.characterCondition.findFirst({ where: { characterId, type, removedAt: null } })
    if (existing) throw new Error(`Personagem já está com a condição ${definition.name}`)
    await tx.characterCondition.create({ data: { characterId, type } })
  })
  revalidatePath('/mestre')
  revalidatePath('/perfil')
}
