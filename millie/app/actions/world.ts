'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getWorldsByActiveCampaign() {
  const session = await auth()
  if (!session?.user?.id) return []

  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true },
    include: {
      campaign: {
        include: { worlds: { include: { chapters: true } } }
      }
    }
  })

  if (!membership) return []

  return membership.campaign.worlds
}

export async function unlockWorld(worldId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  await prisma.world.update({
    where: { id: worldId },
    data: { isLocked: false }
  })

  revalidatePath('/')
}

export async function createWorld(data: {
  name: string
  description: string
  coverColor: string
  chapters: { title: string; content: string }[]
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true, role: 'MASTER' },
  })
  if (!membership) throw new Error('Sem campanha ativa como Mestre')

  const slug = data.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  await prisma.world.create({
    data: {
      name: data.name,
      slug,
      description: data.description,
      coverColor: data.coverColor,
      campaignId: membership.campaignId,
      chapters: {
        create: data.chapters
          .filter((ch) => ch.title.trim())
          .map((ch, i) => ({ title: ch.title, content: ch.content, order: i })),
      },
    },
  })

  revalidatePath('/')
}