'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { validatedText } from '@/lib/validation'
import { sanitizeRichContent } from '@/lib/rich-content'

const MAX_CHAPTERS = 200
const MAX_CHAPTER_LENGTH = 1_000_000
const MAX_BOOK_BYTES = 4_000_000

function makeSlug(name: string) {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function validateChapters(value: unknown) {
  if (!Array.isArray(value) || value.length > MAX_CHAPTERS) throw new Error('A lista pode ter no máximo 200 capítulos')
  const chapters = value.map((chapter) => {
    if (!chapter || typeof chapter !== 'object') throw new Error('Capítulo inválido')
    const data = chapter as { title?: unknown; content?: unknown }
    const title = validatedText(data.title, 'Título do capítulo', { max: 160 })
    const rawContent = validatedText(data.content, 'Conteúdo do capítulo', { max: MAX_CHAPTER_LENGTH, trim: false })
    return { title, content: sanitizeRichContent(rawContent) }
  })
  if (chapters.reduce((sum, chapter) => sum + Buffer.byteLength(chapter.content, 'utf8'), 0) > MAX_BOOK_BYTES) {
    throw new Error('O conteúdo total excede o limite de 4 MB')
  }
  return chapters
}

async function activeMaster() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')
  const membership = await prisma.campaignMember.findFirst({ where: { userId: session.user.id, active: true, role: 'MASTER' } })
  if (!membership) throw new Error('Sem campanha ativa como Mestre')
  return membership
}

function safeWorld<T extends { chapters: { content: string }[] }>(world: T): T {
  return { ...world, chapters: world.chapters.map((chapter) => ({ ...chapter, content: sanitizeRichContent(chapter.content) })) } as T
}

async function draftWorldIds(campaignId: string) {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`SELECT \"id\" FROM \"World\" WHERE \"campaignId\" = ${campaignId} AND \"isDraft\" = true`
  return new Set(rows.map((row) => row.id))
}

export async function getWorldsByActiveCampaign() {
  const session = await auth()
  if (!session?.user?.id) return []
  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true },
    select: { campaignId: true, role: true },
  })
  if (!membership) return []
  const [campaignWorlds, drafts, layouts] = await Promise.all([
    prisma.world.findMany({ where: { campaignId: membership.campaignId }, include: { chapters: { orderBy: { order: 'asc' } } } }),
    draftWorldIds(membership.campaignId),
    prisma.$queryRaw<Array<{id:string;pageColor:string;pageTexture:boolean;pageHeader:string;pageFooter:string}>>`SELECT "id", "pageColor", "pageTexture", "pageHeader", "pageFooter" FROM "World" WHERE "campaignId" = ${membership.campaignId}`,
  ])
  const layoutById = new Map(layouts.map((layout) => [layout.id, layout]))
  const worlds = campaignWorlds.filter((world) => !drafts.has(world.id)).map((world) => safeWorld({ ...world, ...layoutById.get(world.id), isDraft: false }))
  return membership.role === 'MASTER' ? worlds : worlds.map((world) => world.isLocked ? { ...world, description: '', chapters: [] } : world)
}

export async function getWorldsForMasterPanel() {
  const membership = await activeMaster()
  const worlds = await prisma.world.findMany({ where: { campaignId: membership.campaignId }, include: { chapters: { orderBy: { order: 'asc' } } }, orderBy: { name: 'asc' } })
  const [drafts, layouts] = await Promise.all([draftWorldIds(membership.campaignId), prisma.$queryRaw<Array<{id:string;pageColor:string;pageTexture:boolean;pageHeader:string;pageFooter:string}>>`SELECT "id", "pageColor", "pageTexture", "pageHeader", "pageFooter" FROM "World" WHERE "campaignId" = ${membership.campaignId}`])
  const layoutById = new Map(layouts.map((layout) => [layout.id, layout]))
  return worlds.map((world) => safeWorld({ ...world, ...layoutById.get(world.id), isDraft: drafts.has(world.id) }))
}

export async function getWorldForEditor(worldId: string) {
  const membership = await activeMaster()
  const world = await prisma.world.findFirst({ where: { id: worldId, campaignId: membership.campaignId }, include: { chapters: { orderBy: { order: 'asc' } } } })
  if (!world) return null
  const [drafts, layouts] = await Promise.all([draftWorldIds(membership.campaignId), prisma.$queryRaw<Array<{id:string;pageColor:string;pageTexture:boolean;pageHeader:string;pageFooter:string}>>`SELECT "id", "pageColor", "pageTexture", "pageHeader", "pageFooter" FROM "World" WHERE "id" = ${world.id}`])
  return safeWorld({ ...world, ...layouts[0], isDraft: drafts.has(world.id) })
}

export async function unlockWorld(worldId: string) {
  const membership = await activeMaster()
  const world = await prisma.world.findFirst({ where: { id: worldId, campaignId: membership.campaignId }, select: { id: true } })
  if (!world) throw new Error('Mundo não encontrado nesta campanha')
  await prisma.world.update({ where: { id: world.id }, data: { isLocked: false } })
  revalidatePath('/')
}

export async function createWorld(data: {
  name: string; description: string; coverColor: string; coverImage?: string; pageColor?: string; pageTexture?: boolean; pageHeader?: string; pageFooter?: string; chapters: { title: string; content: string }[]; isDraft?: boolean
}) {
  const membership = await activeMaster()
  const name = validatedText(data.name, 'Nome do mundo', { min: 2, max: 120 })
  const description = validatedText(data.description, 'Descrição', { max: 10_000, trim: false })
  const coverColor = validatedText(data.coverColor, 'Cor da capa', { min: 1, max: 40 })
  const coverImage = data.coverImage ? validatedText(data.coverImage, 'Imagem da capa', { max: 2_048 }) : undefined
  const chapters = validateChapters(data.chapters)
  const slug = makeSlug(name)
  if (!slug) throw new Error('O nome precisa conter letras ou números')
  const duplicate = await prisma.world.findFirst({ where: { campaignId: membership.campaignId, slug }, select: { id: true } })
  if (duplicate) throw new Error('Já existe um mundo com esse nome nesta campanha')
  const worldId = await prisma.$transaction(async (tx) => {
    const world = await tx.world.create({
      data: { name, slug, description, coverColor, coverImage, campaignId: membership.campaignId,
        chapters: { create: chapters.map((chapter, order) => ({ ...chapter, order })) } },
      select: { id: true },
    })
    if (data.isDraft) await tx.$executeRaw`UPDATE \"World\" SET \"isDraft\" = true WHERE \"id\" = ${world.id}`
    return world.id
  })
  revalidatePath('/')
  revalidatePath('/mestre')
  return worldId
}

export async function updateWorld(worldId: string, data: {
  name: string; description: string; coverColor: string; coverImage?: string; pageColor?: string; pageTexture?: boolean; pageHeader?: string; pageFooter?: string; chapters: { title: string; content: string }[]; isDraft?: boolean
}) {
  const membership = await activeMaster()
  const world = await prisma.world.findFirst({ where: { id: worldId, campaignId: membership.campaignId } })
  if (!world) throw new Error('Mundo não encontrado nesta campanha')
  const name = validatedText(data.name, 'Nome do mundo', { min: 2, max: 120 })
  const description = validatedText(data.description, 'Descrição', { max: 10_000, trim: false })
  const coverColor = validatedText(data.coverColor, 'Cor da capa', { min: 1, max: 40 })
  const coverImage = data.coverImage ? validatedText(data.coverImage, 'Imagem da capa', { max: 2_048 }) : null
  const chapters = validateChapters(data.chapters)
  const slug = makeSlug(name)
  if (!slug) throw new Error('O nome precisa conter letras ou números')
  const duplicate = await prisma.world.findFirst({ where: { campaignId: membership.campaignId, slug, id: { not: worldId } }, select: { id: true } })
  if (duplicate) throw new Error('Já existe um mundo com esse nome nesta campanha')
  await prisma.$transaction([
    prisma.chapter.deleteMany({ where: { worldId } }),
    prisma.world.update({ where: { id: worldId }, data: {
      name, slug, description, coverColor, coverImage,
      chapters: { create: chapters.map((chapter, order) => ({ ...chapter, order })) },
    } }),
  ])
  if (data.pageColor !== undefined || data.pageTexture !== undefined || data.pageHeader !== undefined || data.pageFooter !== undefined) {
    const pageColor = data.pageColor === undefined ? null : validatedText(data.pageColor, 'Cor das páginas', { min: 7, max: 7 })
    if (pageColor !== null && !/^#[0-9a-f]{6}$/i.test(pageColor)) throw new Error('A cor das páginas precisa estar no formato hexadecimal')
    const pageTexture = data.pageTexture ?? null
    const pageHeader = data.pageHeader === undefined ? null : validatedText(data.pageHeader, 'Cabeçalho', { max: 160, trim: false })
    const pageFooter = data.pageFooter === undefined ? null : validatedText(data.pageFooter, 'Rodapé', { max: 160, trim: false })
    await prisma.$executeRaw`UPDATE "World" SET "pageColor" = COALESCE(${pageColor}, "pageColor"), "pageTexture" = COALESCE(${pageTexture}, "pageTexture"), "pageHeader" = COALESCE(${pageHeader}, "pageHeader"), "pageFooter" = COALESCE(${pageFooter}, "pageFooter") WHERE "id" = ${worldId}`
  }
  if (data.isDraft !== undefined) await prisma.$executeRaw`UPDATE \"World\" SET \"isDraft\" = ${data.isDraft} WHERE \"id\" = ${worldId}`
  revalidatePath('/')
  revalidatePath('/mestre')
  revalidatePath(`/mundos/${world.slug}`)
  revalidatePath(`/mundos/${slug}`)
}

export async function publishWorld(worldId: string) {
  const membership = await activeMaster()
  const world = await prisma.world.findFirst({ where: { id: worldId, campaignId: membership.campaignId }, include: { chapters: true } })
  if (!world) throw new Error('Mundo não encontrado nesta campanha')
  if (world.chapters.some((chapter) => !chapter.title.trim())) throw new Error('Dê um título para todos os capítulos antes de publicar')
  await prisma.$executeRaw`UPDATE \"World\" SET \"isDraft\" = false WHERE \"id\" = ${worldId}`
  revalidatePath('/')
  revalidatePath('/mestre')
}

export async function renameWorld(worldId: string, value: string) {
  const membership = await activeMaster()
  const world = await prisma.world.findFirst({ where: { id: worldId, campaignId: membership.campaignId } })
  if (!world) throw new Error('Mundo não encontrado nesta campanha')
  const name = validatedText(value, 'Nome do mundo', { min: 2, max: 120 })
  const slug = makeSlug(name)
  if (!slug) throw new Error('O nome precisa conter letras ou números')
  const duplicate = await prisma.world.findFirst({ where: { campaignId: membership.campaignId, slug, id: { not: worldId } }, select: { id: true } })
  if (duplicate) throw new Error('Já existe um mundo com esse nome nesta campanha')
  await prisma.world.update({ where: { id: worldId }, data: { name, slug } })
  revalidatePath('/')
  revalidatePath('/mestre')
  revalidatePath(`/mundos/${world.slug}`)
  revalidatePath(`/mundos/${slug}`)
}

export async function deleteWorld(worldId: string) {
  const membership = await activeMaster()
  const world = await prisma.world.findFirst({ where: { id: worldId, campaignId: membership.campaignId }, select: { id: true } })
  if (!world) throw new Error('Mundo não encontrado nesta campanha')
  await prisma.$transaction([prisma.chapter.deleteMany({ where: { worldId } }), prisma.world.delete({ where: { id: worldId } })])
  revalidatePath('/')
  revalidatePath('/mestre')
}
