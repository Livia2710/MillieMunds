'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { validatedText } from '@/lib/validation'
import { randomBytes } from 'node:crypto'

export async function createCampaign(name: string, description: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')
  name = validatedText(name, 'Nome da campanha', { min: 2, max: 100 })
  description = validatedText(description, 'Descrição da campanha', { max: 2_000 })

  const campaign = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${session.user.id} FOR UPDATE`
    const created = await tx.campaign.create({
      data: {
        name,
        description,
        inviteCode: randomBytes(5).toString('hex').toUpperCase(),
        masterId: session.user.id,
      },
    })
    await tx.campaignMember.updateMany({ where: { userId: session.user.id }, data: { active: false } })
    await tx.campaignMember.create({
      data: { userId: session.user.id, campaignId: created.id, role: 'MASTER', active: true },
    })
    return created
  })

  revalidatePath('/')
  return campaign
}

export async function joinCampaign(code: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')
  code = validatedText(code, 'Código de convite', { min: 1, max: 64 }).toUpperCase()

  const campaign = await prisma.campaign.findUnique({
    where: { inviteCode: code },
  })

  if (!campaign) throw new Error('Código inválido')
  if (campaign.archived) throw new Error('Esta campanha está arquivada')

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

  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${session.user.id} FOR UPDATE`
    const currentCampaign = await tx.campaign.findUnique({ where: { id: campaign.id }, select: { archived: true } })
    if (!currentCampaign || currentCampaign.archived) throw new Error('Esta campanha está arquivada')
    const currentMembership = await tx.campaignMember.findUnique({
      where: { userId_campaignId: { userId: session.user.id, campaignId: campaign.id } },
      select: { id: true },
    })
    if (currentMembership) throw new Error('Você já participa desta crônica')
    await tx.campaignMember.updateMany({ where: { userId: session.user.id }, data: { active: false } })
    await tx.campaignMember.create({
      data: { userId: session.user.id, campaignId: campaign.id, role: 'PLAYER', active: true },
    })
  })

  revalidatePath('/')
  return campaign
}

export async function switchCampaign(campaignId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')
  campaignId = validatedText(campaignId, 'Campanha', { min: 1, max: 100 })

  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${session.user.id} FOR UPDATE`
    await tx.$queryRaw`SELECT "id" FROM "Campaign" WHERE "id" = ${campaignId} FOR UPDATE`
    const target = await tx.campaignMember.findFirst({
      where: { userId: session.user.id, campaignId, campaign: { archived: false } },
      select: { id: true },
    })
    if (!target) throw new Error('Campanha não encontrada ou arquivada')
    await tx.campaignMember.updateMany({ where: { userId: session.user.id }, data: { active: false } })
    await tx.campaignMember.update({ where: { id: target.id }, data: { active: true } })
  })

  revalidatePath('/')
}

export async function getUserCampaigns() {
  const session = await auth()
  if (!session?.user?.id) return null

  const memberships = await prisma.campaignMember.findMany({
    where: { userId: session.user.id, campaign: { archived: false } },
    include: { campaign: true },
    orderBy: { joinedAt: 'asc' },
  })

  return memberships.map((m) => ({
    id: m.campaign.id,
    name: m.campaign.name,
    description: m.campaign.description,
    inviteCode: m.role === 'MASTER' && !m.campaign.archived ? m.campaign.inviteCode : '',
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
    inviteCode: membership.role === 'MASTER' ? membership.campaign.inviteCode : '',
    role: membership.role,
    active: true,
  }
}


// ─── transferMastership ───────────────────────────────────
// Mestre passa a liderança para outro membro da campanha.

export async function transferMastership(newMasterUserId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')
  newMasterUserId = validatedText(newMasterUserId, 'Jogador', { min: 1, max: 100 })

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
  if (!target || !target.active || target.role !== 'PLAYER') {
    throw new Error('Escolha um jogador ativo da campanha para transferir a liderança')
  }

  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Campaign" WHERE "id" = ${membership.campaignId} FOR UPDATE`
    const currentMaster = await tx.campaignMember.findFirst({
      where: { id: membership.id, active: true, role: 'MASTER', campaign: { archived: false } },
      select: { id: true },
    })
    const currentTarget = await tx.campaignMember.findFirst({
      where: { id: target.id, active: true, role: 'PLAYER', campaignId: membership.campaignId },
      select: { id: true },
    })
    if (!currentMaster || !currentTarget) throw new Error('A liderança ou o jogador mudou; atualize a página e tente novamente')
    await tx.campaignMember.update({ where: { id: currentMaster.id }, data: { role: 'PLAYER' } })
    await tx.campaignMember.update({ where: { id: currentTarget.id }, data: { role: 'MASTER' } })
    await tx.campaign.update({ where: { id: membership.campaignId }, data: { masterId: newMasterUserId } })
  })

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

// Lista somente campanhas arquivadas que ainda pertencem ao Mestre autenticado.
export async function getArchivedCampaigns() {
  const session = await auth()
  if (!session?.user?.id) return []

  return prisma.campaign.findMany({
    where: {
      masterId: session.user.id,
      archived: true,
      members: { some: { userId: session.user.id, role: 'MASTER' } },
    },
    select: { id: true, name: true, archivedAt: true },
    orderBy: { archivedAt: 'desc' },
  })
}

export async function restoreArchivedCampaign(campaignId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')
  campaignId = validatedText(campaignId, 'Campanha', { min: 1, max: 100 })

  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${session.user.id} FOR UPDATE`
    await tx.$queryRaw`SELECT "id" FROM "Campaign" WHERE "id" = ${campaignId} FOR UPDATE`
    const campaign = await tx.campaign.findFirst({
      where: {
        id: campaignId,
        masterId: session.user.id,
        archived: true,
        members: { some: { userId: session.user.id, role: 'MASTER' } },
      },
      select: { id: true },
    })
    if (!campaign) throw new Error('Campanha arquivada não encontrada ou sem permissão')

    await tx.campaignMember.updateMany({
      where: { userId: session.user.id, active: true },
      data: { active: false },
    })
    await tx.campaign.update({ where: { id: campaign.id }, data: { archived: false, archivedAt: null } })
    const masterMembership = await tx.campaignMember.updateMany({
      where: { campaignId: campaign.id, userId: session.user.id, role: 'MASTER' },
      data: { active: true },
    })
    if (masterMembership.count !== 1) throw new Error('Não foi possível reativar a associação do Mestre')
  })

  revalidatePath('/')
  revalidatePath('/mestre')
  revalidatePath('/configuracoes')
}

// ─── deleteArchivedCampaign ───────────────────────────────
// Apenas o Mestre. Exclusão permanente — como o schema não tem
// onDelete: Cascade nessas relações, apagamos manualmente na ordem
// certa (folhas primeiro) dentro de uma transação.
export async function deleteArchivedCampaign(campaignId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  campaignId = validatedText(campaignId, 'Campanha', { min: 1, max: 100 })
  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Campaign" WHERE "id" = ${campaignId} FOR UPDATE`
    const campaign = await tx.campaign.findFirst({
      where: {
        id: campaignId,
        masterId: session.user.id,
        archived: true,
        members: { some: { userId: session.user.id, role: 'MASTER' } },
      },
      select: { id: true },
    })
    if (!campaign) throw new Error('Apenas o Mestre pode excluir uma campanha arquivada')

    await tx.characterCondition.deleteMany({ where: { character: { campaignId } } })
    await tx.characterRaceSkill.deleteMany({ where: { character: { campaignId } } })
    await tx.specialCard.deleteMany({ where: { character: { campaignId } } })
    await tx.tarotDraw.deleteMany({ where: { character: { campaignId } } })
    await tx.skill.deleteMany({ where: { character: { campaignId } } })
    await tx.itemChapter.deleteMany({ where: { item: { campaignId } } })
    await tx.chapter.deleteMany({ where: { world: { campaignId } } })
    await tx.character.deleteMany({ where: { campaignId } })
    await tx.inventoryItem.deleteMany({ where: { campaignId } })
    await tx.world.deleteMany({ where: { campaignId } })
    await tx.campaignMember.deleteMany({ where: { campaignId } })
    await tx.campaign.delete({ where: { id: campaignId } })
  })

  revalidatePath('/')
}
