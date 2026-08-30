'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { CONDITION_LABELS, type ManualCondition } from '@/lib/utils/conditions'
import { requireCharacterInActiveCampaign } from '@/lib/authorization'

export async function addCondition(characterId: string, type: ManualCondition) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  const { membership } = await requireCharacterInActiveCampaign(characterId, session.user.id, 'MASTER')
  if (!(type in CONDITION_LABELS)) throw new Error('Condição inválida')

  const existing = await prisma.characterCondition.findFirst({
    where: { characterId, type, removedAt: null, character: { campaignId: membership.campaignId } },
  })
  if (existing) throw new Error(`Personagem já está com a condição ${CONDITION_LABELS[type]}`)

  await prisma.characterCondition.create({
    data: { characterId, type },
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
  return prisma.characterCondition.findMany({
    where: { characterId, removedAt: null, character: { campaignId: character.campaignId } },
    orderBy: { appliedAt: 'asc' },
  })
}
