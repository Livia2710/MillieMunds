'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createCampaign(name: string, description: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  const code = Math.random().toString(36).substring(2, 8).toUpperCase()

  const campaign = await prisma.campaign.create({
    data: {
      name,
      description,
      inviteCode: code,
      masterId: session.user.id,
    },
  })

  // Desativa campanha atual
  await prisma.campaignMember.updateMany({
    where: { userId: session.user.id },
    data: { active: false },
  })

  // Cria vínculo como MASTER já ativo
  await prisma.campaignMember.create({
    data: {
      userId: session.user.id,
      campaignId: campaign.id,
      role: 'MASTER',
      active: true,
    },
  })

  revalidatePath('/')
  return campaign
}

export async function joinCampaign(code: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  const campaign = await prisma.campaign.findUnique({
    where: { inviteCode: code.toUpperCase() },
  })

  if (!campaign) throw new Error('Código inválido')

  // Verifica se já é membro
  const existing = await prisma.campaignMember.findUnique({
    where: {
      userId_campaignId: {
        userId: session.user.id,
        campaignId: campaign.id,
      },
    },
  })

  if (existing) throw new Error('Você já participa desta crônica')

  // Desativa campanha atual
  await prisma.campaignMember.updateMany({
    where: { userId: session.user.id },
    data: { active: false },
  })

  // Entra como PLAYER já ativo
  await prisma.campaignMember.create({
    data: {
      userId: session.user.id,
      campaignId: campaign.id,
      role: 'PLAYER',
      active: true,
    },
  })

  revalidatePath('/')
  return campaign
}

export async function switchCampaign(campaignId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  await prisma.$transaction([
    prisma.campaignMember.updateMany({
      where: { userId: session.user.id },
      data: { active: false },
    }),
    prisma.campaignMember.updateMany({
      where: { userId: session.user.id, campaignId },
      data: { active: true },
    }),
  ])

  revalidatePath('/')
}

export async function getUserCampaigns() {
  const session = await auth()
  if (!session?.user?.id) return null

  const memberships = await prisma.campaignMember.findMany({
    where: { userId: session.user.id },
    include: { campaign: true },
    orderBy: { joinedAt: 'asc' },
  })

  return memberships.map((m) => ({
    id: m.campaign.id,
    name: m.campaign.name,
    description: m.campaign.description,
    inviteCode: m.campaign.inviteCode,
    role: m.role,
    active: m.active,
  }))
}

export async function getActiveCampaign() {
  const session = await auth()
  if (!session?.user?.id) return null

  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true },
    include: { campaign: true },
  })

  if (!membership) return null

  return {
    id: membership.campaign.id,
    name: membership.campaign.name,
    description: membership.campaign.description,
    inviteCode: membership.campaign.inviteCode,
    role: membership.role,
    active: true,
  }
}


// ─── transferMastership ───────────────────────────────────
// Mestre passa a liderança para outro membro da campanha.

export async function transferMastership(newMasterUserId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true, role: 'MASTER' },
    include: { campaign: true },
  })
  if (!membership) throw new Error('Apenas o Mestre pode transferir a liderança')

  const target = await prisma.campaignMember.findUnique({
    where: {
      userId_campaignId: {
        userId:     newMasterUserId,
        campaignId: membership.campaignId,
      },
    },
  })
  if (!target) throw new Error('Jogador não encontrado na campanha')

  await prisma.$transaction([
    // rebaixa o mestre atual para PLAYER
    prisma.campaignMember.update({
      where: { id: membership.id },
      data:  { role: 'PLAYER' },
    }),
    // promove o novo mestre
    prisma.campaignMember.update({
      where: { id: target.id },
      data:  { role: 'MASTER' },
    }),
    // atualiza masterId na campanha
    prisma.campaign.update({
      where: { id: membership.campaignId },
      data:  { masterId: newMasterUserId },
    }),
  ])

  revalidatePath('/')
  revalidatePath('/mestre')
}


// ─── leaveCampaign ─────────────────────────────────────────
// Jogador sai da campanha ativa. O Mestre não pode sair por aqui —
// precisa transferir liderança antes (fluxo do painel /mestre).
export async function leaveCampaign() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true },
  })
  if (!membership) throw new Error('Você não está em nenhuma campanha ativa')
  if (membership.role === 'MASTER') {
    throw new Error('Transfira a liderança antes de sair da campanha')
  }

  await prisma.$transaction([
    // personagem e progresso continuam salvos — só desvincula do jogador
    prisma.character.updateMany({
      where: { campaignId: membership.campaignId, playerId: session.user.id },
      data: { playerId: null },
    }),
    prisma.campaignMember.delete({ where: { id: membership.id } }),
  ])

  revalidatePath('/')
}

// ─── archiveCampaign ───────────────────────────────────────
// Apenas o Mestre. Oculta a campanha e desativa a associação de
// todo mundo — os dados continuam intactos no banco para restauração futura.
export async function archiveCampaign() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true, role: 'MASTER' },
  })
  if (!membership) throw new Error('Apenas o Mestre pode arquivar a campanha')

  await prisma.$transaction([
    prisma.campaign.update({
      where: { id: membership.campaignId },
      data: { archived: true, archivedAt: new Date() },
    }),
    prisma.campaignMember.updateMany({
      where: { campaignId: membership.campaignId, active: true },
      data: { active: false },
    }),
  ])

  revalidatePath('/')
}

// ─── deleteCampaign ────────────────────────────────────────
// Apenas o Mestre. Exclusão permanente — como o schema não tem
// onDelete: Cascade nessas relações, apagamos manualmente na ordem
// certa (folhas primeiro) dentro de uma transação.
export async function deleteCampaign() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true, role: 'MASTER' },
  })
  if (!membership) throw new Error('Apenas o Mestre pode excluir a campanha')

  const campaignId = membership.campaignId

  await prisma.$transaction([
    prisma.characterCondition.deleteMany({ where: { character: { campaignId } } }),
    prisma.characterRaceSkill.deleteMany({ where: { character: { campaignId } } }),
    prisma.specialCard.deleteMany({ where: { character: { campaignId } } }),
    prisma.tarotDraw.deleteMany({ where: { character: { campaignId } } }),
    prisma.skill.deleteMany({ where: { character: { campaignId } } }),
    prisma.itemChapter.deleteMany({ where: { item: { campaignId } } }),
    prisma.chapter.deleteMany({ where: { world: { campaignId } } }),
    prisma.character.deleteMany({ where: { campaignId } }),
    prisma.inventoryItem.deleteMany({ where: { campaignId } }),
    prisma.world.deleteMany({ where: { campaignId } }),
    prisma.campaignMember.deleteMany({ where: { campaignId } }),
    prisma.campaign.delete({ where: { id: campaignId } }),
  ])

  revalidatePath('/')
}