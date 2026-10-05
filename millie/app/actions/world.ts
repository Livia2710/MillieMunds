'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireUserId } from '@/lib/authorization'
import { validatedText } from '@/lib/validation'

function validateChapters(value: unknown) {
  if (!Array.isArray(value) || value.length > 100) throw new Error('Lista de capítulos inválida')
  const chapters = value.map((chapter) => {
    if (!chapter || typeof chapter !== 'object') throw new Error('Capítulo inválido')
    const data = chapter as { title?: unknown; content?: unknown }
    return {
      title: validatedText(data.title, 'Título do capítulo', { min: 1, max: 160 }),
      content: validatedText(data.content, 'Conteúdo do capítulo', { max: 20_000, trim: false }),
    }
  })
  if (chapters.reduce((sum, chapter) => sum + chapter.content.length, 0) > 200_000) {
    throw new Error('O conteúdo total dos capítulos excede o limite permitido')
  }
  return chapters
}

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

  return membership.role === 'MASTER'
    ? membership.campaign.worlds
    : membership.campaign.worlds.map((world) => world.isLocked
      ? { ...world, description: '', chapters: [] }
      : world)
}

export async function unlockWorld(worldId: string) {
  const userId = await requireUserId()
  const membership = await prisma.campaignMember.findFirst({
    where: { userId, active: true, role: 'MASTER' },
    select: { campaignId: true },
  })
  if (!membership) throw new Error('Apenas o Mestre pode liberar mundos')
  const world = await prisma.world.findFirst({
    where: { id: worldId, campaignId: membership.campaignId },
    select: { id: true },
  })
  if (!world) throw new Error('Mundo não encontrado nesta campanha')

  await prisma.world.update({
    where: { id: world.id },
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

  const name = validatedText(data.name, 'Nome do mundo', { min: 2, max: 120 })
  const description = validatedText(data.description, 'Descrição', { max: 10_000, trim: false })
  const coverColor = validatedText(data.coverColor, 'Cor da capa', { min: 1, max: 40 })
  const chapters = validateChapters(data.chapters)

  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  if (!slug) throw new Error('O nome precisa conter letras ou números')
  const duplicate = await prisma.world.findFirst({ where: { campaignId: membership.campaignId, slug }, select: { id: true } })
  if (duplicate) throw new Error('Já existe um mundo com esse nome nesta campanha')

  await prisma.world.create({
    data: {
      name,
      slug,
      description,
      coverColor,
      campaignId: membership.campaignId,
      chapters: {
        create: chapters.map((chapter, i) => ({ ...chapter, order: i })),
      },
    },
  })

  revalidatePath('/')
}

export async function updateWorld(worldId: string, data: {
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

  const world = await prisma.world.findFirst({
    where: { id: worldId, campaignId: membership.campaignId },
  })
  if (!world) throw new Error('Mundo não encontrado nesta campanha')

  const name = validatedText(data.name, 'Nome do mundo', { min: 2, max: 120 })
  const description = validatedText(data.description, 'Descrição', { max: 10_000, trim: false })
  const coverColor = validatedText(data.coverColor, 'Cor da capa', { min: 1, max: 40 })
  const chapters = validateChapters(data.chapters)
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  if (!slug) throw new Error('O nome precisa conter letras ou números')
  const duplicate = await prisma.world.findFirst({ where: { campaignId: membership.campaignId, slug, id: { not: worldId } }, select: { id: true } })
  if (duplicate) throw new Error('Já existe um mundo com esse nome nesta campanha')

  await prisma.$transaction([
    prisma.chapter.deleteMany({ where: { worldId } }),
    prisma.world.update({
      where: { id: worldId },
      data: {
        name,
        slug,
        description,
        coverColor,
        chapters: {
          create: chapters.map((chapter, i) => ({ ...chapter, order: i })),
        },
      },
    }),
  ])

  revalidatePath('/')
  revalidatePath(`/mundos/${world.slug}`)
  revalidatePath(`/mundos/${slug}`)
}

export async function deleteWorld(worldId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true, role: 'MASTER' },
  })
  if (!membership) throw new Error('Sem campanha ativa como Mestre')

  const world = await prisma.world.findFirst({
    where: { id: worldId, campaignId: membership.campaignId },
  })
  if (!world) throw new Error('Mundo não encontrado nesta campanha')

  await prisma.$transaction([
    prisma.chapter.deleteMany({ where: { worldId } }),
    prisma.world.delete({ where: { id: worldId } }),
  ])

  revalidatePath('/')
}
