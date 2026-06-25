'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getItemsByActiveCampaign() {
  const session = await auth()
  if (!session?.user?.id) return []

  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true },
    include: {
      campaign: {
        include: {
          items: { include: { chapters: true } }
        }
      }
    }
  })

  if (!membership) return []
  return membership.campaign.items
}

export async function unlockItem(itemId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  await prisma.inventoryItem.update({
    where: { id: itemId },
    data: { isLocked: false }
  })

  revalidatePath('/inventario')
}

export async function createInventoryItem(data: {
  name: string
  category: string
  rarity: string
  quantity: number
  worldSlug?: string
  origin?: string
  effect?: string
  forgedBy?: string
  author?: string
  coverType?: string
  coverColor?: string
  coverImage?: string
  chapters?: { title: string; content: string }[]
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

  await prisma.inventoryItem.create({
    data: {
      name: data.name,
      slug,
      category: data.category,
      rarity: data.rarity,
      quantity: data.quantity,
      worldSlug: data.worldSlug,
      origin: data.origin,
      effect: data.effect,
      forgedBy: data.forgedBy,
      author: data.author,
      coverType: data.coverType,
      coverColor: data.coverColor,
      coverImage: data.coverImage,
      campaignId: membership.campaignId,
      chapters: data.chapters
        ? {
            create: data.chapters
              .filter((ch) => ch.title.trim())
              .map((ch, i) => ({ title: ch.title, content: ch.content, order: i })),
          }
        : undefined,
    },
  })

  revalidatePath('/inventario')
}

export async function getItemBySlug(slug: string) {
  const session = await auth()
  if (!session?.user?.id) return null

  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true },
  })
  if (!membership) return null

  return prisma.inventoryItem.findFirst({
    where: { slug, campaignId: membership.campaignId },
    include: { chapters: { orderBy: { order: 'asc' } } },
  })
}