import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function requireUserId() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')
  return session.user.id
}

export async function requireActiveMembership(userId: string, role?: 'MASTER' | 'PLAYER') {
  const membership = await prisma.campaignMember.findFirst({
    where: { userId, active: true, ...(role ? { role } : {}) },
    select: { id: true, campaignId: true, role: true },
  })
  if (!membership) throw new Error(role === 'MASTER' ? 'Apenas o Mestre pode executar esta ação' : 'Sem campanha ativa')
  return membership
}

export async function requireCharacterInActiveCampaign(characterId: string, userId: string, role?: 'MASTER' | 'PLAYER') {
  const membership = await requireActiveMembership(userId, role)
  const character = await prisma.character.findFirst({
    where: { id: characterId, campaignId: membership.campaignId },
    select: { id: true, campaignId: true, playerId: true },
  })
  if (!character) throw new Error('Personagem não encontrado na campanha ativa')
  return { membership, character }
}
