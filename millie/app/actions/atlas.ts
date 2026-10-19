'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { requireActiveMembership, requireUserId } from '@/lib/authorization'
import { oneOf, validatedText, validateImageUrl } from '@/lib/validation'
import { revalidatePath } from 'next/cache'

const VISIBILITY = ['PUBLIC', 'DISCOVERED', 'MASTER_ONLY'] as const
const UNIVERSE_KINDS = ['origin', 'universe', 'multiversal'] as const
const ELEMENTS = ['fogo', 'agua', 'terra', 'vento', 'luz', 'trevas'] as const
const RANKS = ['E', 'D', 'C', 'B', 'A', 'S'] as const

export async function getAtlasData() {
  const session = await auth()
  if (!session?.user?.id) return { isMaster: false, universes: [] }
  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true },
    select: { campaignId: true, role: true },
  })
  const isMaster = membership?.role === 'MASTER'
  const [universes, discoveries] = await Promise.all([
    prisma.universe.findMany({
      include: { worlds: { orderBy: { name: 'asc' }, include: { races: { orderBy: { name: 'asc' }, include: { skills: { orderBy: { name: 'asc' } } } } } } },
      orderBy: { name: 'asc' },
    }),
    membership ? prisma.atlasDiscovery.findMany({ where: { campaignId: membership.campaignId }, select: { entityType: true, entityId: true } }) : Promise.resolve([]),
  ])
  const discovered = new Set(discoveries.map((entry) => `${entry.entityType}:${entry.entityId}`))
  const visible = (type: string, entry: { id: string; visibility: string }) =>
    isMaster || entry.visibility === 'PUBLIC' || (entry.visibility === 'DISCOVERED' && discovered.has(`${type}:${entry.id}`))

  const safeUniverses = universes.filter((universe) => visible('universe', universe)).map((universe) => ({
    ...universe,
    masterNotes: undefined,
    worlds: universe.worlds.filter((world) => visible('world', world)).map((world) => ({
      ...world,
      races: world.races.filter((race) => visible('race', race)).map((race) => ({
        ...race,
        masterNotes: isMaster ? race.masterNotes : '',
        skills: race.skills.filter((skill) => visible('skill', skill)),
      })),
    })),
  }))
  return { isMaster, universes: safeUniverses }
}

async function activeMaster() {
  const userId = await requireUserId()
  const membership = await requireActiveMembership(userId, 'MASTER')
  return membership
}

function optionalImage(value: unknown, label: string) {
  return validateImageUrl(value, label) ?? null
}

export async function createAtlasUniverse(data: {
  name: string; description: string; artStyle: string; artworkUrl?: string; kind: string; visibility: string
}) {
  await activeMaster()
  const name = validatedText(data.name, 'Nome do universo', { min: 2, max: 120 })
  const description = validatedText(data.description ?? '', 'Descrição', { max: 5_000, trim: false })
  const artStyle = validatedText(data.artStyle ?? '', 'Estilo artístico', { max: 240 })
  const artworkUrl = optionalImage(data.artworkUrl, 'Arte do universo')
  const kind = oneOf(data.kind, 'Tipo do núcleo', UNIVERSE_KINDS)
  const visibility = oneOf(data.visibility, 'Visibilidade', VISIBILITY)
  const universe = await prisma.universe.create({ data: { name, description, artStyle, artworkUrl, kind, visibility } })
  revalidatePath('/atlas')
  return universe.id
}

export async function updateAtlasUniverse(universeId: string, data: {
  name: string; description: string; artStyle: string; artworkUrl?: string; kind: string; visibility: string
}) {
  await activeMaster()
  const id = validatedText(universeId, 'Universo', { min: 1, max: 100 })
  const exists = await prisma.universe.findUnique({ where: { id }, select: { id: true } })
  if (!exists) throw new Error('Universo não encontrado')
  await prisma.universe.update({ where: { id }, data: {
    name: validatedText(data.name, 'Nome do universo', { min: 2, max: 120 }),
    description: validatedText(data.description ?? '', 'Descrição', { max: 5_000, trim: false }),
    artStyle: validatedText(data.artStyle ?? '', 'Estilo artístico', { max: 240 }),
    artworkUrl: optionalImage(data.artworkUrl, 'Arte do universo'),
    kind: oneOf(data.kind, 'Tipo do núcleo', UNIVERSE_KINDS),
    visibility: oneOf(data.visibility, 'Visibilidade', VISIBILITY),
  } })
  revalidatePath('/atlas')
}

export async function createAtlasWorld(data: { universeId: string; name: string; description: string; imageUrl?: string; visibility: string }) {
  await activeMaster()
  const universeId = validatedText(data.universeId, 'Universo', { min: 1, max: 100 })
  if (!await prisma.universe.findUnique({ where: { id: universeId }, select: { id: true } })) throw new Error('Universo não encontrado')
  const world = await prisma.universeWorld.create({ data: {
    universeId,
    name: validatedText(data.name, 'Nome do mundo', { min: 2, max: 120 }),
    description: validatedText(data.description ?? '', 'Descrição', { max: 5_000, trim: false }),
    imageUrl: optionalImage(data.imageUrl, 'Imagem do mundo'),
    visibility: oneOf(data.visibility, 'Visibilidade', VISIBILITY),
  } })
  revalidatePath('/atlas')
  return world.id
}

export async function updateAtlasWorld(worldId: string, data: { name: string; description: string; imageUrl?: string; visibility: string }) {
  await activeMaster()
  const id = validatedText(worldId, 'Mundo', { min: 1, max: 100 })
  await prisma.universeWorld.update({ where: { id }, data: {
    name: validatedText(data.name, 'Nome do mundo', { min: 2, max: 120 }),
    description: validatedText(data.description ?? '', 'Descrição', { max: 5_000, trim: false }),
    imageUrl: optionalImage(data.imageUrl, 'Imagem do mundo'),
    visibility: oneOf(data.visibility, 'Visibilidade', VISIBILITY),
  } })
  revalidatePath('/atlas')
}

export async function createAtlasRace(data: {
  universeWorldId: string; name: string; element: string; baseRank: string; description: string; image?: string;
  appearance: string; biology: string; culture: string; masterNotes: string; visibility: string; canAscend: boolean; canCorrupt: boolean
}) {
  await activeMaster()
  const universeWorldId = validatedText(data.universeWorldId, 'Mundo', { min: 1, max: 100 })
  if (!await prisma.universeWorld.findUnique({ where: { id: universeWorldId }, select: { id: true } })) throw new Error('Mundo não encontrado')
  const race = await prisma.race.create({ data: {
    universeWorldId,
    name: validatedText(data.name, 'Nome da raça', { min: 2, max: 120 }),
    element: oneOf(data.element, 'Elemento', ELEMENTS),
    baseRank: oneOf(data.baseRank, 'Rank natural', RANKS),
    description: validatedText(data.description ?? '', 'Descrição', { max: 5_000, trim: false }),
    image: optionalImage(data.image, 'Imagem da raça'),
    appearance: validatedText(data.appearance ?? '', 'Aparência', { max: 5_000, trim: false }),
    biology: validatedText(data.biology ?? '', 'Biologia', { max: 5_000, trim: false }),
    culture: validatedText(data.culture ?? '', 'Cultura', { max: 5_000, trim: false }),
    masterNotes: validatedText(data.masterNotes ?? '', 'Notas do Mestre', { max: 5_000, trim: false }),
    visibility: oneOf(data.visibility, 'Visibilidade', VISIBILITY),
    canAscend: Boolean(data.canAscend), canCorrupt: Boolean(data.canCorrupt),
  } })
  revalidatePath('/atlas')
  return race.id
}

export async function updateAtlasRace(raceId: string, data: {
  name: string; element: string; baseRank: string; description: string; image?: string;
  appearance: string; biology: string; culture: string; masterNotes: string; visibility: string; canAscend: boolean; canCorrupt: boolean
}) {
  await activeMaster()
  const id = validatedText(raceId, 'Raça', { min: 1, max: 100 })
  await prisma.race.update({ where: { id }, data: {
    name: validatedText(data.name, 'Nome da raça', { min: 2, max: 120 }),
    element: oneOf(data.element, 'Elemento', ELEMENTS),
    baseRank: oneOf(data.baseRank, 'Rank natural', RANKS),
    description: validatedText(data.description ?? '', 'Descrição', { max: 5_000, trim: false }),
    image: optionalImage(data.image, 'Imagem da raça'),
    appearance: validatedText(data.appearance ?? '', 'Aparência', { max: 5_000, trim: false }),
    biology: validatedText(data.biology ?? '', 'Biologia', { max: 5_000, trim: false }),
    culture: validatedText(data.culture ?? '', 'Cultura', { max: 5_000, trim: false }),
    masterNotes: validatedText(data.masterNotes ?? '', 'Notas do Mestre', { max: 5_000, trim: false }),
    visibility: oneOf(data.visibility, 'Visibilidade', VISIBILITY),
    canAscend: Boolean(data.canAscend), canCorrupt: Boolean(data.canCorrupt),
  } })
  revalidatePath('/atlas')
}

export async function revealAtlasEntry(entityType: string, entityId: string) {
  const membership = await activeMaster()
  const type = oneOf(entityType, 'Tipo de registro', ['universe', 'world', 'race', 'skill', 'connection'] as const)
  const id = validatedText(entityId, 'Registro', { min: 1, max: 100 })
  await prisma.atlasDiscovery.upsert({
    where: { campaignId_entityType_entityId: { campaignId: membership.campaignId, entityType: type, entityId: id } },
    create: { campaignId: membership.campaignId, entityType: type, entityId: id },
    update: {},
  })
  revalidatePath('/atlas')
}
