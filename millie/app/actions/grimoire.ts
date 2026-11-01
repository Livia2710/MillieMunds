'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { calcCurrentRank } from '@/lib/utils/rank'
import { GRIMOIRE_ELEMENTS, type GrimoireData } from '@/lib/types/grimoire'
import { revalidatePath } from 'next/cache'
import { Prisma } from '@/lib/generated/prisma'

const RANK_STAGE: Record<string, number> = { D: 1, C: 2, B: 3, A: 4, S: 5 }
const ELEMENT_LABELS: Record<string, string> = {
  luz: 'Luz', vento: 'Vento', fogo: 'Fogo', trevas: 'Trevas', terra: 'Terra', agua: 'Água',
}
const VALID_DEGREES = [1, 2, 3, 4]
const normalizeElement = (value: string) => value.trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '')

type Membership = { campaignId: string; role: 'MASTER' | 'PLAYER'; userId: string }

async function getMembership(): Promise<Membership | null> {
  const session = await auth()
  if (!session?.user?.id) return null
  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true, campaign: { archived: false } },
    select: { campaignId: true, role: true, userId: true },
  })
  return membership as Membership | null
}

async function requireMasterCharacter(characterId: string) {
  const membership = await getMembership()
  if (!membership || membership.role !== 'MASTER') throw new Error('Apenas o Mestre pode administrar o Grimório.')
  const character = await prisma.character.findFirst({
    where: { id: characterId, campaignId: membership.campaignId },
    include: { race: true },
  })
  if (!character) throw new Error('Personagem não encontrado nesta campanha.')
  return { membership, character }
}

async function requireReadableCharacter(characterId?: string) {
  const membership = await getMembership()
  if (!membership) return null
  if (membership.role === 'MASTER') {
    if (!characterId) return null
    const character = await prisma.character.findFirst({
      where: { id: characterId, campaignId: membership.campaignId },
      include: { race: true },
    })
    if (!character) throw new Error('Personagem não encontrado nesta campanha.')
    return { membership, character }
  }
  const where = characterId
    ? { id: characterId, campaignId: membership.campaignId, playerId: membership.userId }
    : { campaignId: membership.campaignId, playerId: membership.userId }
  const character = await prisma.character.findFirst({ where, include: { race: true } })
  if (!character) return null
  return { membership, character }
}

async function resolveCurrentRace(character: { race: { name: string; element: string; isCorrupted: boolean }; evolvedRaceId: string | null }) {
  if (!character.evolvedRaceId) return character.race
  return await prisma.race.findUnique({
    where: { id: character.evolvedRaceId },
    select: { name: true, element: true, isCorrupted: true },
  }) ?? character.race
}

async function syncNaturalAffinity(character: {
  id: string; level: number; birthRank: string; rankLosses: number; race: { name: string; element: string; isCorrupted: boolean }; evolvedRaceId: string | null
}) {
  const race = await resolveCurrentRace(character)
  const isRitualista = race.name.trim().toLocaleLowerCase('pt-BR') === 'ritualista' || race.element === 'escolha'
  const raceElement = normalizeElement(race.element)
  // "escolha" (Ritualista) e "vazio" são condições especiais, não afinidades.
  if (isRitualista || !raceElement || raceElement === 'vazio') return

  const rank = calcCurrentRank(character.level, character.birthRank as never, race.isCorrupted, character.rankLosses)
  const targetStage = RANK_STAGE[rank]
  if (!targetStage) return
  const unique = { characterId_element: { characterId: character.id, element: raceElement } }
  const affinity = await prisma.characterElementAffinity.findUnique({ where: unique })
  if (!affinity) {
    const removed = await prisma.grimoireAuditEntry.findFirst({
      where: { characterId: character.id, targetId: raceElement, operation: 'AFFINITY_REMOVE' },
      orderBy: { createdAt: 'desc' },
      select: { details: true },
    })
    const details = removed?.details
    const previous = details && typeof details === 'object' && !Array.isArray(details)
      ? (details as Record<string, unknown>).previous as Record<string, unknown> | undefined
      : undefined
    // A remoção manual da afinidade racial vale até a mudança de rank.
    if (previous?.source === 'RACIAL' && previous.racialRank === rank) return
    await prisma.characterElementAffinity.create({
      data: { characterId: character.id, element: raceElement, stage: targetStage, stageXp: 0, source: 'RACIAL', racialRank: rank },
    })
    return
  }
  if (affinity.racialRank !== rank) {
    await prisma.characterElementAffinity.update({
      where: { id: affinity.id },
      data: { stage: affinity.stage < targetStage ? affinity.stage + 1 : affinity.stage, racialRank: rank },
    })
  }
}

function jsonRecord<T extends Record<string, number> | null>(value: Prisma.JsonValue | null | undefined): T {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {} as T
  return value as T
}

function effectiveRitual<T extends { overrides: Prisma.JsonValue | null }>(ritual: T) {
  const overrides = ritual.overrides && typeof ritual.overrides === 'object' && !Array.isArray(ritual.overrides)
    ? ritual.overrides as Record<string, unknown>
    : {}
  const base = { ...ritual } as Record<string, unknown>
  delete base.overrides
  return { ...base, ...overrides } as Omit<T, 'overrides'> & Record<string, unknown>
}

async function buildGrimoireData(characterId?: string): Promise<GrimoireData> {
  const membership = await getMembership()
  const catalogCount = await prisma.ritualCatalogEntry.count()
  if (!membership) {
    return { hasCampaign: false, isMaster: false, campaignId: null, characters: [], character: null, catalogCount, elementOptions: Object.values(ELEMENT_LABELS), catalog: [], config: emptyConfig() }
  }

  const isMaster = membership.role === 'MASTER'
  const characterRows = isMaster
    ? await prisma.character.findMany({ where: { campaignId: membership.campaignId }, select: { id: true, name: true, category: true, element: true, race: { select: { name: true } }, level: true, birthRank: true, rankLosses: true, evolvedRaceId: true, raceId: true } })
    : await prisma.character.findMany({ where: { campaignId: membership.campaignId, playerId: membership.userId }, select: { id: true, name: true, category: true, element: true, race: { select: { name: true } }, level: true, birthRank: true, rankLosses: true, evolvedRaceId: true, raceId: true } })
  const characterOptions = await Promise.all(characterRows.map(async row => {
    let race = await prisma.race.findUnique({ where: { id: row.raceId }, select: { name: true, element: true, isCorrupted: true } })
    if (row.evolvedRaceId) race = await prisma.race.findUnique({ where: { id: row.evolvedRaceId }, select: { name: true, element: true, isCorrupted: true } }) ?? race
    const rank = race ? calcCurrentRank(row.level, row.birthRank, race.isCorrupted, row.rankLosses) : row.birthRank
    const raceElement = race ? normalizeElement(race.element) : ''
    const characterElement = race && raceElement && !['escolha', 'vazio'].includes(raceElement) ? race.element : row.element
    return { id: row.id, name: row.name, race: race?.name ?? row.race.name, rank, category: row.category, element: characterElement }
  }))
  const targetId = characterId ?? (isMaster ? undefined : characterRows[0]?.id)
  const readable = await requireReadableCharacter(targetId)
  const configRow = await prisma.grimoireConfig.findUnique({ where: { id: 'default' } })
  const config = configRow ? {
    stageTransitionRule: configRow.stageTransitionRule,
    affinitySuccessXpByDegree: jsonRecord<Record<string, number>>(configRow.affinitySuccessXpByDegree),
    affinityPracticeXpByDegree: jsonRecord<Record<string, number>>(configRow.affinityPracticeXpByDegree),
    affinityStudyXpByDegree: configRow.affinityStudyXpByDegree ? jsonRecord<Record<string, number>>(configRow.affinityStudyXpByDegree) : null,
    domainSuccessXpByRitual: jsonRecord<Record<string, number>>(configRow.domainSuccessXpByRitual),
    domainPracticeXpByRitual: jsonRecord<Record<string, number>>(configRow.domainPracticeXpByRitual),
    difficultyModifiers: configRow.difficultyModifiers ? jsonRecord<Record<string, number>>(configRow.difficultyModifiers) : null,
    repetitionDiminishingRule: configRow.repetitionDiminishingRule ? jsonRecord<Record<string, number>>(configRow.repetitionDiminishingRule) : null,
  } : emptyConfig()
  const catalogLite = await prisma.ritualCatalogEntry.findMany({
    orderBy: { catalogOrder: 'asc' },
    select: { id: true, catalogOrder: true, degree: true, sourceRow: true, sourceIdOrPair: true, elementText: true, elements: true, categoryOrVariant: true, anchor: true, anchorVariant: true, secondary: true, secondaryVariant: true, name: true, effect: true, pmBase: true, difficulty: true, difficultyModifier: true, affinityXpModifier: true, domainXpMax: true, grade4ResultElement: true, sigilForm: true, overrides: true },
  })
  const elementOptions = [...new Set([
    ...Object.values(ELEMENT_LABELS),
    ...catalogLite.filter(item => item.degree === 4 && item.grade4ResultElement).map(item => item.grade4ResultElement!),
  ])]
  const catalog = isMaster ? catalogLite.map(item => effectiveRitual(item) as unknown as GrimoireData['catalog'][number]) : []

  if (!readable) {
    return { hasCampaign: true, isMaster, campaignId: membership.campaignId, characters: characterOptions, character: null, catalogCount, elementOptions, catalog, config }
  }
  await syncNaturalAffinity(readable.character)

  const [character, learned] = await Promise.all([
    prisma.character.findUnique({ where: { id: readable.character.id }, include: { race: true, elementalAffinities: { orderBy: [{ stage: 'desc' }, { element: 'asc' }] } } }),
    prisma.characterRitual.findMany({ where: { characterId: readable.character.id }, include: { ritual: true }, orderBy: [{ learnedAt: 'asc' }, { ritual: { catalogOrder: 'asc' } }] }),
  ])
  if (!character) throw new Error('Personagem não encontrado.')
  const currentRace = await resolveCurrentRace({ race: character.race, evolvedRaceId: character.evolvedRaceId })
  const currentRaceElement = normalizeElement(currentRace.element)
  if (currentRaceElement && !['escolha', 'vazio'].includes(currentRaceElement) && !elementOptions.some(item => normalizeElement(item) === currentRaceElement)) {
    elementOptions.push(currentRaceElement[0].toLocaleUpperCase('pt-BR') + currentRaceElement.slice(1))
  }
  const rank = calcCurrentRank(character.level, character.birthRank, currentRace.isCorrupted, character.rankLosses)
  return {
    hasCampaign: true,
    isMaster,
    campaignId: membership.campaignId,
    characters: characterOptions,
    catalogCount,
    elementOptions,
    catalog,
    config,
    character: {
      id: character.id,
      name: character.name,
      race: currentRace.name,
      rank,
      element: character.element,
      affinities: character.elementalAffinities,
      rituals: learned.map(item => ({
        ...effectiveRitual(item.ritual),
        masteryXp: item.masteryXp,
        learnedAt: item.learnedAt.toISOString(),
      })) as unknown as GrimoireData['character'] extends infer C ? C extends { rituals: infer R } ? R : never : never,
    },
  } as GrimoireData
}

function emptyConfig(): GrimoireData['config'] {
  return {
    stageTransitionRule: null,
    affinitySuccessXpByDegree: { '1': 100, '2': 300, '3': 700, '4': 1500 },
    affinityPracticeXpByDegree: { '1': 50, '2': 150, '3': 350, '4': 750 },
    affinityStudyXpByDegree: null,
    domainSuccessXpByRitual: { 'ritual-1-5': 100 },
    domainPracticeXpByRitual: { 'ritual-1-5': 50 },
    difficultyModifiers: null,
    repetitionDiminishingRule: null,
  }
}

export async function getGrimoireData() {
  return buildGrimoireData()
}

export async function getGrimoireCharacterData(characterId: string) {
  characterId = characterId.trim()
  if (!characterId) throw new Error('Personagem inválido.')
  return buildGrimoireData(characterId)
}

export async function grantCharacterRitual(characterId: string, ritualId: string) {
  const { membership } = await requireMasterCharacter(characterId)
  const ritual = await prisma.ritualCatalogEntry.findUnique({ where: { id: ritualId }, select: { id: true } })
  if (!ritual) throw new Error('Ritual não encontrado no catálogo.')
  const existing = await prisma.characterRitual.findUnique({ where: { characterId_ritualId: { characterId, ritualId } } })
  if (existing) throw new Error('Este personagem já aprendeu esse ritual.')
  await prisma.$transaction(async tx => {
    await tx.characterRitual.create({ data: { characterId, ritualId } })
    await tx.grimoireAuditEntry.create({ data: { campaignId: membership.campaignId, characterId, actorUserId: membership.userId, operation: 'RITUAL_GRANT', targetId: ritualId, details: { learned: true } } })
  })
  revalidatePath('/grimorio')
}

export async function removeCharacterRitual(characterId: string, ritualId: string) {
  const { membership } = await requireMasterCharacter(characterId)
  const progress = await prisma.characterRitual.findUnique({ where: { characterId_ritualId: { characterId, ritualId } } })
  if (!progress) throw new Error('Ritual não encontrado na coleção do personagem.')
  await prisma.$transaction(async tx => {
    await tx.characterRitual.delete({ where: { id: progress.id } })
    await tx.grimoireAuditEntry.create({ data: { campaignId: membership.campaignId, characterId, actorUserId: membership.userId, operation: 'RITUAL_REMOVE', targetId: ritualId, details: { previousMasteryXp: progress.masteryXp } } })
  })
  revalidatePath('/grimorio')
}

export async function recordRitualLearningOutcome(characterId: string, ritualId: string, succeeded: boolean) {
  const { membership } = await requireMasterCharacter(characterId)
  if (typeof succeeded !== 'boolean') throw new Error('Resultado de aprendizado inválido.')
  const ritual = await prisma.ritualCatalogEntry.findUnique({ where: { id: ritualId }, select: { id: true } })
  if (!ritual) throw new Error('Ritual não encontrado no catálogo.')
  const existing = await prisma.characterRitual.findUnique({ where: { characterId_ritualId: { characterId, ritualId } } })
  if (existing) throw new Error('Este personagem já aprendeu esse ritual.')
  await prisma.$transaction(async tx => {
    if (succeeded) await tx.characterRitual.create({ data: { characterId, ritualId } })
    await tx.grimoireAuditEntry.create({
      data: { campaignId: membership.campaignId, characterId, actorUserId: membership.userId, operation: succeeded ? 'LEARNING_SUCCESS' : 'LEARNING_FAILURE', targetId: ritualId, details: { learned: succeeded, xpGranted: 0 } },
    })
  })
  revalidatePath('/grimorio')
}

export async function adjustRitualMastery(characterId: string, ritualId: string, masteryXp: number) {
  const { membership } = await requireMasterCharacter(characterId)
  if (!Number.isSafeInteger(masteryXp) || masteryXp < 0) throw new Error('XP de domínio inválido.')
  const progress = await prisma.characterRitual.findUnique({ where: { characterId_ritualId: { characterId, ritualId } }, include: { ritual: true } })
  if (!progress) throw new Error('Ritual não encontrado na coleção do personagem.')
  if (progress.ritual.domainXpMax !== null && masteryXp > progress.ritual.domainXpMax) throw new Error('O XP não pode ultrapassar o limite de domínio definido para este ritual.')
  await prisma.$transaction(async tx => {
    await tx.characterRitual.update({ where: { id: progress.id }, data: { masteryXp } })
    await tx.grimoireAuditEntry.create({ data: { campaignId: membership.campaignId, characterId, actorUserId: membership.userId, operation: 'RITUAL_MASTERY_ADJUST', targetId: ritualId, details: { previousXp: progress.masteryXp, masteryXp } } })
  })
  revalidatePath('/grimorio')
}

export async function setCharacterElementAffinity(characterId: string, element: string, stage: number, stageXp: number) {
  const { membership, character } = await requireMasterCharacter(characterId)
  element = normalizeElement(element)
  const race = await resolveCurrentRace(character)
  const derived = await prisma.ritualCatalogEntry.findMany({ where: { degree: 4, grade4ResultElement: { not: null } }, select: { grade4ResultElement: true } })
  const allowedElements = new Set([...GRIMOIRE_ELEMENTS, ...derived.map(item => normalizeElement(item.grade4ResultElement!))])
  if (race.element && !['escolha', 'vazio'].includes(normalizeElement(race.element))) allowedElements.add(normalizeElement(race.element))
  if (!allowedElements.has(element) || element === 'vazio') throw new Error('Afinidade inválida. Vazio é uma condição, não uma afinidade.')
  if (!Number.isInteger(stage) || stage < 1 || stage > 5) throw new Error('Estágio de afinidade inválido.')
  if (!Number.isSafeInteger(stageXp) || stageXp < 0 || stageXp > 1_000) throw new Error('XP deve ficar entre 0 e 1.000 no estágio atual.')
  const unique = { characterId_element: { characterId, element } }
  const previous = await prisma.characterElementAffinity.findUnique({ where: unique })
  const affinity = await prisma.$transaction(async tx => {
    const saved = await tx.characterElementAffinity.upsert({
      where: unique,
      create: { characterId, element, stage, stageXp, source: 'ADMIN', racialRank: null },
      update: { stage, stageXp, source: 'ADMIN', racialRank: previous?.racialRank ?? null },
    })
    await tx.grimoireAuditEntry.create({ data: { campaignId: membership.campaignId, characterId, actorUserId: membership.userId, operation: previous ? 'AFFINITY_ADJUST' : 'AFFINITY_GRANT', targetId: element, details: { previous: previous ? { stage: previous.stage, stageXp: previous.stageXp } : null, next: { stage, stageXp } } } })
    return saved
  })
  revalidatePath('/grimorio')
  return affinity.id
}

export async function removeCharacterElementAffinity(characterId: string, element: string) {
  const { membership } = await requireMasterCharacter(characterId)
  element = normalizeElement(element)
  if (!element || element === 'vazio' || element === 'escolha') throw new Error('Afinidade inválida.')
  const previous = await prisma.characterElementAffinity.findUnique({ where: { characterId_element: { characterId, element } } })
  if (!previous) throw new Error('Afinidade não encontrada.')
  await prisma.$transaction(async tx => {
    await tx.characterElementAffinity.delete({ where: { id: previous.id } })
    await tx.grimoireAuditEntry.create({ data: { campaignId: membership.campaignId, characterId, actorUserId: membership.userId, operation: 'AFFINITY_REMOVE', targetId: element, details: { previous: { stage: previous.stage, stageXp: previous.stageXp, source: previous.source, racialRank: previous.racialRank } } } })
  })
  revalidatePath('/grimorio')
}

export async function updateRitualCatalogEntry(ritualId: string, input: {
  name: string; effect: string; pmBase: string; difficulty: string; difficultyModifier: string; affinityXpModifier: string; domainXpMax: number | null
}) {
  const membership = await getMembership()
  if (!membership || membership.role !== 'MASTER') throw new Error('Apenas o Mestre pode administrar o catálogo.')
  const ritual = await prisma.ritualCatalogEntry.findUnique({ where: { id: ritualId } })
  if (!ritual) throw new Error('Ritual não encontrado no catálogo.')
  if (!Number.isSafeInteger(input.domainXpMax) && input.domainXpMax !== null) throw new Error('Limite de Domínio inválido.')
  if (input.domainXpMax !== null && input.domainXpMax < 0) throw new Error('Limite de Domínio não pode ser negativo.')
  const ritualName = input.name.trim()
  if (!ritualName) throw new Error('O nome não pode ficar em branco.')
  if (ritualName.length > 120) throw new Error('O nome deve ter no máximo 120 caracteres.')
  const patch: Record<string, string | number | null> = {
    name: ritualName,
    effect: input.effect.trim() || null,
    pmBase: input.pmBase.trim() || null,
    difficulty: input.difficulty.trim() || null,
    difficultyModifier: input.difficultyModifier.trim() || null,
    affinityXpModifier: input.affinityXpModifier.trim() || null,
    domainXpMax: input.domainXpMax,
  }
  const existing = ritual.overrides && typeof ritual.overrides === 'object' && !Array.isArray(ritual.overrides) ? ritual.overrides as Record<string, unknown> : {}
  const overrides = { ...existing, ...patch }
  await prisma.$transaction(async tx => {
    await tx.ritualCatalogEntry.update({ where: { id: ritualId }, data: { overrides: overrides as Prisma.InputJsonValue } })
    await tx.grimoireAuditEntry.create({ data: { campaignId: membership.campaignId, characterId: null, actorUserId: membership.userId, operation: 'CATALOG_EDIT', targetId: ritualId, details: patch as Prisma.InputJsonValue } })
  })
  revalidatePath('/grimorio')
}

export async function updateGrimoireConfig(input: {
  stageTransitionRule: string
  affinitySuccessXpByDegree: Record<string, number>
  affinityPracticeXpByDegree: Record<string, number>
  affinityStudyXpByDegree: Record<string, number> | null
  domainSuccessXpByRitual: Record<string, number>
  domainPracticeXpByRitual: Record<string, number>
  difficultyModifiers: Record<string, number> | null
  repetitionDiminishingRule: Record<string, number> | null
}) {
  const membership = await getMembership()
  if (!membership || membership.role !== 'MASTER') throw new Error('Apenas o Mestre pode editar a configuração do Grimório.')
  const validateXpMap = (label: string, values: Record<string, number> | null) => {
    if (values === null) return
    if (!values || typeof values !== 'object' || Array.isArray(values) || Object.values(values).some(value => !Number.isSafeInteger(value) || value < 0)) {
      throw new Error(`${label}: informe um objeto com valores numéricos não negativos.`)
    }
  }
  validateXpMap('XP de Afinidade por sucesso', input.affinitySuccessXpByDegree)
  validateXpMap('XP de Afinidade por prática', input.affinityPracticeXpByDegree)
  validateXpMap('XP de Afinidade por estudo', input.affinityStudyXpByDegree)
  validateXpMap('XP de Domínio por sucesso', input.domainSuccessXpByRitual)
  validateXpMap('XP de Domínio por prática', input.domainPracticeXpByRitual)
  if (input.difficultyModifiers && (typeof input.difficultyModifiers !== 'object' || Array.isArray(input.difficultyModifiers) || Object.values(input.difficultyModifiers).some(value => !Number.isFinite(value) || value < 0))) {
    throw new Error('Modificadores de dificuldade devem ser numéricos e não negativos.')
  }
  for (const degree of VALID_DEGREES) {
    for (const [label, values] of [['XP de Afinidade por sucesso', input.affinitySuccessXpByDegree], ['XP de Afinidade por prática', input.affinityPracticeXpByDegree]] as const) {
      if (!Number.isSafeInteger(values[String(degree)])) throw new Error(`${label}: falta um valor inteiro para o Grau ${degree}.`)
    }
  }
  if (input.repetitionDiminishingRule) {
    const { windowHours, decrementMultiplier, minMultiplier } = input.repetitionDiminishingRule
    if (![windowHours, decrementMultiplier, minMultiplier].every(Number.isFinite) || windowHours <= 0 || decrementMultiplier < 0 || minMultiplier < 0 || minMultiplier > 1) {
      throw new Error('Regra de repetição inválida. Use windowHours, decrementMultiplier e minMultiplier dentro de suas faixas válidas.')
    }
  }
  const json = (value: unknown) => value as Prisma.InputJsonValue
  await prisma.$transaction(async tx => {
    await tx.grimoireConfig.upsert({
    where: { id: 'default' },
    create: {
      id: 'default', stageTransitionRule: input.stageTransitionRule.trim() || null,
      affinitySuccessXpByDegree: json(input.affinitySuccessXpByDegree), affinityPracticeXpByDegree: json(input.affinityPracticeXpByDegree),
      affinityStudyXpByDegree: input.affinityStudyXpByDegree ? json(input.affinityStudyXpByDegree) : undefined,
      domainSuccessXpByRitual: json(input.domainSuccessXpByRitual), domainPracticeXpByRitual: json(input.domainPracticeXpByRitual),
      difficultyModifiers: input.difficultyModifiers ? json(input.difficultyModifiers) : undefined,
      repetitionDiminishingRule: input.repetitionDiminishingRule ? json(input.repetitionDiminishingRule) : undefined,
    },
    update: {
      stageTransitionRule: input.stageTransitionRule.trim() || null,
      affinitySuccessXpByDegree: json(input.affinitySuccessXpByDegree), affinityPracticeXpByDegree: json(input.affinityPracticeXpByDegree),
      affinityStudyXpByDegree: input.affinityStudyXpByDegree ? json(input.affinityStudyXpByDegree) : Prisma.JsonNull,
      domainSuccessXpByRitual: json(input.domainSuccessXpByRitual), domainPracticeXpByRitual: json(input.domainPracticeXpByRitual),
      difficultyModifiers: input.difficultyModifiers ? json(input.difficultyModifiers) : Prisma.JsonNull,
      repetitionDiminishingRule: input.repetitionDiminishingRule ? json(input.repetitionDiminishingRule) : Prisma.JsonNull,
    },
    })
    await tx.grimoireAuditEntry.create({
      data: { campaignId: membership.campaignId, characterId: null, actorUserId: membership.userId, operation: 'CONFIG_EDIT', targetId: 'default', details: json(input) },
    })
  })
  revalidatePath('/grimorio')
}

export async function recordGrimoireActivity(input: {
  characterId: string
  ritualId: string
  kind: 'success' | 'practice' | 'study' | 'failure'
  affinityElement?: string
}) {
  const { membership } = await requireMasterCharacter(input.characterId)
  if (!['success', 'practice', 'study', 'failure'].includes(input.kind)) throw new Error('Tipo de atividade inválido.')
  const [ritual, progress, config] = await Promise.all([
    prisma.ritualCatalogEntry.findUnique({ where: { id: input.ritualId } }),
    prisma.characterRitual.findUnique({ where: { characterId_ritualId: { characterId: input.characterId, ritualId: input.ritualId } } }),
    prisma.grimoireConfig.findUnique({ where: { id: 'default' } }),
  ])
  if (!ritual) throw new Error('Ritual não encontrado no catálogo.')
  if (input.kind !== 'study' && input.kind !== 'failure' && !progress) throw new Error('O personagem precisa ter aprendido o ritual antes de praticá-lo.')
  if (input.affinityElement && ['vazio', 'escolha'].includes(normalizeElement(input.affinityElement))) throw new Error('Vazio é uma condição, não uma afinidade.')
  if (input.kind === 'study' && !input.affinityElement) throw new Error('Selecione uma afinidade que receberá o XP de estudo.')
  const affinity = input.affinityElement
    ? await prisma.characterElementAffinity.findUnique({ where: { characterId_element: { characterId: input.characterId, element: input.affinityElement } } })
    : null
  if (input.affinityElement && !affinity) throw new Error('O personagem não possui essa afinidade. O Mestre pode concedê-la no painel de Afinidades.')

  let affinityXp = 0
  let masteryXp = 0
  if (input.kind === 'success' || input.kind === 'practice') {
    const affinityByDegree = input.kind === 'success'
      ? jsonRecord<Record<string, number>>(config?.affinitySuccessXpByDegree)
      : jsonRecord<Record<string, number>>(config?.affinityPracticeXpByDegree)
    affinityXp = affinityByDegree[String(ritual.degree)] ?? 0
    const domainByRitual = input.kind === 'success'
      ? jsonRecord<Record<string, number>>(config?.domainSuccessXpByRitual)
      : jsonRecord<Record<string, number>>(config?.domainPracticeXpByRitual)
    masteryXp = domainByRitual[ritual.id] ?? 0
  } else if (input.kind === 'study') {
    const studyByDegree = jsonRecord<Record<string, number> | null>(config?.affinityStudyXpByDegree)
    affinityXp = studyByDegree?.[String(ritual.degree)] ?? 0
    if (!affinityXp) throw new Error('XP de estudo ainda não foi configurado para este Grau.')
  }

  // Dificuldade e repetição só modificam XP de Afinidade quando o Mestre os configura.
  // O XP de Domínio continua calculado separadamente, sem esses modificadores.
  if (config && affinityXp > 0) {
    const difficultyRules = jsonRecord<Record<string, number>>(config.difficultyModifiers)
    const difficultyKey = ritual.difficulty?.trim() ?? ''
    const difficultyMultiplier = difficultyKey ? difficultyRules[difficultyKey] : undefined
    if (typeof difficultyMultiplier === 'number' && Number.isFinite(difficultyMultiplier) && difficultyMultiplier >= 0) {
      affinityXp = Math.round(affinityXp * difficultyMultiplier)
    }
    const repetition = jsonRecord<Record<string, number>>(config.repetitionDiminishingRule)
    const { windowHours, decrementMultiplier, minMultiplier } = repetition
    if (windowHours > 0 && decrementMultiplier >= 0 && minMultiplier >= 0 && minMultiplier <= 1) {
      const since = new Date(Date.now() - windowHours * 60 * 60 * 1000)
      const repeated = await prisma.grimoireAuditEntry.count({
        where: { characterId: input.characterId, targetId: ritual.id, operation: { in: ['ACTIVITY_SUCCESS', 'ACTIVITY_PRACTICE'] }, createdAt: { gte: since } },
      })
      affinityXp = Math.round(affinityXp * Math.max(minMultiplier, 1 - repeated * decrementMultiplier))
    }
  }

  if (input.kind !== 'failure' && !input.affinityElement) throw new Error('Selecione qual afinidade recebe o XP desta atividade.')
  const nextAffinityXp = affinity ? Math.min(1_000, affinity.stageXp + affinityXp) : 0
  const nextMasteryXp = progress && input.kind !== 'study' && input.kind !== 'failure'
    ? Math.min(ritual.domainXpMax ?? Number.MAX_SAFE_INTEGER, progress.masteryXp + masteryXp)
    : progress?.masteryXp ?? 0
  await prisma.$transaction(async tx => {
    if (affinity && input.kind !== 'failure') await tx.characterElementAffinity.update({ where: { id: affinity.id }, data: { stageXp: nextAffinityXp } })
    if (progress && input.kind !== 'study' && input.kind !== 'failure') await tx.characterRitual.update({ where: { id: progress.id }, data: { masteryXp: nextMasteryXp, lastPracticedAt: new Date() } })
    await tx.grimoireAuditEntry.create({
      data: {
        campaignId: membership.campaignId, characterId: input.characterId, actorUserId: membership.userId,
        operation: `ACTIVITY_${input.kind.toUpperCase()}`, targetId: ritual.id,
        details: { affinityElement: input.affinityElement ?? null, affinityXp: input.kind === 'failure' ? 0 : affinityXp, masteryXp: input.kind === 'failure' || input.kind === 'study' ? 0 : masteryXp },
      },
    })
  })
  revalidatePath('/grimorio')
}
