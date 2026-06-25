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