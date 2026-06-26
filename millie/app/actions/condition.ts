'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { CONDITION_LABELS, type ManualCondition } from '@/lib/utils/conditions'

export async function addCondition(characterId: string, type: ManualCondition) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true, role: 'MASTER' },
  })
  if (!membership) throw new Error('Apenas o Mestre pode aplicar condições')

  const existing = await prisma.characterCondition.findFirst({
    where: { characterId, type, removedAt: null },
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

  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true, role: 'MASTER' },
  })
  if (!membership) throw new Error('Apenas o Mestre pode remover condições')

  await prisma.characterCondition.update({
    where: { id: conditionId },
    data: { removedAt: new Date() },
  })

  revalidatePath('/mestre')
  revalidatePath('/perfil')
}

export async function getActiveConditions(characterId: string) {
  const session = await auth()
  if (!session?.user?.id) return []

  return prisma.characterCondition.findMany({
    where: { characterId, removedAt: null },
    orderBy: { appliedAt: 'asc' },
  })
}