'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { requireActiveMembership, requireUserId } from '@/lib/authorization'
import { revalidatePath } from 'next/cache'
import { calcCurrentRank, calcFirstSkillUnlock, calcSkillUsesRequired } from '@/lib/utils/rank'
import { oneOf, validatedInteger, validatedText } from '@/lib/validation'
import { createUserNotification } from '@/lib/notifications'
import type { SkillEvolutionStage } from '@/lib/types/skill'

const SKILL_BRANCHES = ['ativa', 'passiva', 'reacao', 'aprimoramento'] as const
const SKILL_COSTS = ['none', 'pm', 'pv'] as const
const SKILL_RANKS = ['E', 'D', 'C', 'B', 'A', 'S'] as const
const SKILL_RANGES = ['Pessoal', 'Toque (2 m)', 'Curto (10 m)', 'Médio (30 m)', 'Longo (100 m)', 'Visual', 'Fórmula personalizada'] as const
const SKILL_POTENCIES = ['', 'Ínfima', 'Fraca', 'Normal', 'Forte', 'Devastadora'] as const

function validateSkillFields(data: unknown) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Dados da habilidade inválidos')
  const fields = data as Record<string, unknown>
  const maxLevel = validatedInteger(fields.maxLevel, 'Nível máximo', 1, 5)
  const levelEffects = fields.levelEffects === undefined ? [] : fields.levelEffects
  if (!Array.isArray(levelEffects) || levelEffects.length > maxLevel) throw new Error('Efeitos por nível inválidos')
  const rawStages = fields.evolutionStages === undefined ? [] : fields.evolutionStages
  if (!Array.isArray(rawStages) || rawStages.length > maxLevel) throw new Error('Etapas de evolução inválidas')
  const evolutionStages = rawStages.map((raw, index) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error(`Etapa ${index + 1} inválida`)
    const stage = raw as Record<string, unknown>
    const results = stage.results === undefined ? [] : stage.results
    if (!Array.isArray(results) || results.length > 100) throw new Error(`Resultados da etapa ${index + 1} inválidos`)
    return {
      number: index + 1,
      name: validatedText(stage.name, `Nome da etapa ${index + 1}`, { min: 1, max: 100 }),
      requiredRank: oneOf(stage.requiredRank ?? 'D', `Rank da etapa ${index + 1}`, SKILL_RANKS),
      requiredCharacterLevel: validatedInteger(stage.requiredCharacterLevel ?? 1, `Nível da etapa ${index + 1}`, 1, 10_000),
      requirements: validatedText(stage.requirements ?? '', `Requisitos da etapa ${index + 1}`, { max: 1_000, trim: false }),
      costResource: oneOf(stage.costResource ?? 'none', `Recurso da etapa ${index + 1}`, SKILL_COSTS),
      costAmount: validatedInteger(stage.costAmount ?? 0, `Custo da etapa ${index + 1}`, 0, 1_000_000),
      range: oneOf(stage.range ?? 'Pessoal', `Alcance da etapa ${index + 1}`, SKILL_RANGES),
      customRange: validatedText(stage.customRange ?? '', `Fórmula do alcance da etapa ${index + 1}`, { max: 120 }),
      duration: validatedText(stage.duration ?? '', `Duração da etapa ${index + 1}`, { max: 120 }),
      potency: oneOf(stage.potency ?? '', `Potência da etapa ${index + 1}`, SKILL_POTENCIES),
      testAttribute: validatedText(stage.testAttribute ?? '', `Atributo do teste da etapa ${index + 1}`, { max: 80 }),
      execution: validatedText(stage.execution ?? '', `Efeito da etapa ${index + 1}`, { max: 5_000, trim: false }),
      trigger: validatedText(stage.trigger ?? '', `Gatilho da etapa ${index + 1}`, { max: 500 }),
      enhances: validatedText(stage.enhances ?? '', `Aprimoramento da etapa ${index + 1}`, { max: 200 }),
      results: results.map((rawResult, resultIndex) => {
        if (!rawResult || typeof rawResult !== 'object' || Array.isArray(rawResult)) throw new Error(`Resultado ${resultIndex + 1} da etapa ${index + 1} inválido`)
        const result = rawResult as Record<string, unknown>
        return {
          card: validatedText(result.card, `Carta do resultado ${resultIndex + 1}`, { min: 1, max: 100 }),
          outcome: validatedText(result.outcome, `Resultado da carta ${resultIndex + 1}`, { min: 1, max: 80 }),
          interpretation: validatedText(result.interpretation, `Interpretação da carta ${resultIndex + 1}`, { min: 1, max: 2_000, trim: false }),
        }
      }),
    } satisfies SkillEvolutionStage
  })
  if (evolutionStages.some((stage) => stage.range === 'Fórmula personalizada' && !stage.customRange.trim())) {
    throw new Error('Informe a fórmula para cada alcance personalizado')
  }
  if (evolutionStages.length && evolutionStages.length !== maxLevel) throw new Error('Preencha todas as etapas da habilidade')
  if (evolutionStages.some((stage, index) => index >= 3 && SKILL_RANKS.indexOf(stage.requiredRank as typeof SKILL_RANKS[number]) < SKILL_RANKS.indexOf('B'))) {
    throw new Error('Despertares 4 e 5 exigem Rank mínimo B')
  }
  if (evolutionStages.some((stage) => stage.costResource !== 'none' && stage.costAmount < 1)) throw new Error('Informe o custo de cada etapa que consome recurso')
  return {
    name: validatedText(fields.name, 'Nome da habilidade', { min: 1, max: 100 }),
    description: validatedText(fields.description, 'Descrição da habilidade', { max: 5_000, trim: false }),
    branch: oneOf(fields.branch, 'Ramo da habilidade', SKILL_BRANCHES),
    element: validatedText(fields.element, 'Elemento', { min: 1, max: 40 }),
    maxLevel,
    requiredCharacterLevel: validatedInteger(fields.requiredCharacterLevel, 'Nível necessário', 1, 10_000),
    levelEffects: levelEffects.map((effect) => validatedText(effect, 'Efeito por nível', { min: 1, max: 2_000 })),
    evolutionStages,
    costResource: oneOf(fields.costResource ?? 'none', 'Recurso do custo', SKILL_COSTS),
    costAmount: validatedInteger(fields.costAmount ?? 0, 'Quantidade do custo', 0, 1_000_000),
    range: validatedText(fields.range ?? 'Pessoal', 'Alcance', { min: 1, max: 120 }),
    duration: validatedText(fields.duration ?? '', 'Duração', { max: 120 }),
    trigger: validatedText(fields.trigger ?? '', 'Gatilho', { max: 500 }),
    enhances: validatedText(fields.enhances ?? '', 'Habilidade aprimorada', { max: 200 }),
    execution: validatedText(fields.execution ?? '', 'Execução', { max: 5_000, trim: false }),
    testAttribute: validatedText(fields.testAttribute ?? '', 'Atributo do teste', { max: 80 }),
    results: validatedText(fields.results ?? '', 'Resultados', { max: 5_000, trim: false }),
    potency: validatedText(fields.potency ?? '', 'Potência', { max: 80 }),
    lineName: validatedText(fields.lineName ?? '', 'Linha de evolução', { max: 100 }),
    formNumber: validatedInteger(fields.formNumber ?? 1, 'Forma atual', 1, maxLevel),
    requiredRank: oneOf(fields.requiredRank ?? 'D', 'Rank mínimo', SKILL_RANKS),
    evolvesTo: validatedText(fields.evolvesTo ?? '', 'Próxima forma', { max: 100 }),
    requirements: validatedText(fields.requirements ?? '', 'Requisitos', { max: 1_000, trim: false }),
    interactions: validatedText(fields.interactions ?? '', 'Interações', { max: 2_000, trim: false }),
  }
}

function parseEvolutionStages(value: string): SkillEvolutionStage[] {
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed) ? parsed as SkillEvolutionStage[] : []
  } catch {
    return []
  }
}

export async function getSkillCreationTargets() {
  const userId = await requireUserId()
  const membership = await requireActiveMembership(userId, 'MASTER')
  const characters = await prisma.character.findMany({
    where: { campaignId: membership.campaignId },
    select: { id: true, name: true, race: { select: { id: true, name: true } } },
    orderBy: { name: 'asc' },
  })
  const races = [...new Map(characters.map((character) => [character.race.id, character.race])).values()]
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  return { characters: characters.map(({ id, name }) => ({ id, name })), races }
}

// ─── getSkillsByCharacter ─────────────────────────────────
// Retorna as habilidades do personagem mesclando:
// 1. RaceSkill (inatas da raça) — desbloqueio por nível
// 2. Skill (criadas pelo Mestre para o personagem)

export async function getSkillsByCharacter(characterId: string) {
  const session = await auth()

  if (!session?.user?.id) return null

  const char = await prisma.character.findFirst({
    where: { id: characterId },
    include: {
      race: { include: { skills: true } },
      skills: true,
      innateSkills: true,
    },
  })

  if (!char) return null

  // verifica acesso via membership ativa — mesma lógica de getMyCharacter
  const membership = await prisma.campaignMember.findFirst({
    where: {
      userId:     session.user.id,
      campaignId: char.campaignId,
      active:     true,           // ← adiciona active: true, igual ao getMyCharacter
    },
  })
  if (!membership) return null
  if (membership.role !== 'MASTER' && char.isLocked && char.playerId !== session.user.id) return null

  const firstUnlock = calcFirstSkillUnlock(char.birthRank)
  const characterRank = calcCurrentRank(char.level, char.birthRank, char.race.isCorrupted, char.rankLosses)
  const rankOrder = ['E', 'D', 'C', 'B', 'A', 'S']
  const meetsRank = (required: string) => rankOrder.indexOf(characterRank) >= rankOrder.indexOf(required)

  const innate = char.race.skills.map((rs) => {
    const progress = char.innateSkills.find((entry) => entry.raceSkillId === rs.id)
    return {
    id:                     rs.id,
    name:                   rs.name,
    description:            rs.description,
    branch:                 rs.branch,
    currentLevel:           progress?.currentLevel ?? 0,
    maxLevel:               rs.maxLevel,
    isUnlocked:             char.level >= Math.max(rs.levelRequired, firstUnlock) && meetsRank(rs.requiredRank),
    requiredCharacterLevel: Math.max(rs.levelRequired, firstUnlock),
    uses:                   progress?.uses ?? 0,
    isInnate:               true,
    levelEffects:           rs.levelEffects,
    evolutionStages:        parseEvolutionStages(rs.evolutionStages),
    element: rs.element,
    costResource: rs.costResource,
    costAmount: rs.costAmount,
    range: rs.range,
    duration: rs.duration,
    trigger: rs.trigger,
    enhances: rs.enhances,
    execution: rs.execution,
    testAttribute: rs.testAttribute,
    results: rs.results,
    potency: rs.potency,
    lineName: rs.lineName,
    formNumber: rs.formNumber,
    requiredRank: rs.requiredRank,
    evolvesTo: rs.evolvesTo,
    requirements: rs.requirements,
    interactions: rs.interactions,
    }
  })

  const custom = char.skills.map((s) => ({
    id:                     s.id,
    name:                   s.name,
    description:            s.description,
    branch:                 s.branch,
    currentLevel:           s.currentLevel,
    maxLevel:               s.maxLevel,
    isUnlocked:             s.isUnlocked && char.level >= s.requiredCharacterLevel && meetsRank(s.requiredRank),
    requiredCharacterLevel: s.requiredCharacterLevel,
    uses:                   s.uses,
    isInnate:               false,
    levelEffects:           s.levelEffects,
    evolutionStages:        parseEvolutionStages(s.evolutionStages),
    element: s.element,
    costResource: s.costResource,
    costAmount: s.costAmount,
    range: s.range,
    duration: s.duration,
    trigger: s.trigger,
    enhances: s.enhances,
    execution: s.execution,
    testAttribute: s.testAttribute,
    results: s.results,
    potency: s.potency,
    lineName: s.lineName,
    formNumber: s.formNumber,
    requiredRank: s.requiredRank,
    evolvesTo: s.evolvesTo,
    requirements: s.requirements,
    interactions: s.interactions,
  }))

  return {
    characterId:   char.id,
    characterName: char.name,
    race:          char.race.name,
    element:       char.element,
    birthRank:     char.birthRank,
    level:         char.level,
    xp:            char.xp,
    maxXp:         char.maxXp,
    skills:        [...innate, ...custom],
  }
}

// ─── createSkill ──────────────────────────────────────────
// Mestre cria habilidade para um personagem específico

export async function createSkill(data: {
  characterId: string
  name: string
  description: string
  branch: string
  element: string
  maxLevel: number
  requiredCharacterLevel: number
  levelEffects?: string[]
  evolutionStages?: SkillEvolutionStage[]
  costResource: string; costAmount: number; range: string; duration: string; trigger: string; enhances: string
  execution: string; testAttribute: string; results: string; potency: string; lineName: string; formNumber: number
  requiredRank: string; evolvesTo: string; requirements: string; interactions: string
}) {
  const fields = validateSkillFields(data)
  if (fields.maxLevel >= 4 && SKILL_RANKS.indexOf(fields.requiredRank as typeof SKILL_RANKS[number]) < SKILL_RANKS.indexOf('B')) {
    throw new Error('Habilidades com Forma 4 ou 5 exigem Rank mínimo B')
  }
  const characterId = validatedText(data.characterId, 'Personagem', { min: 1, max: 100 })
  const userId = await requireUserId()
  const membership = await requireActiveMembership(userId, 'MASTER')
  const char = await prisma.character.findFirst({
    where: { id: characterId, campaignId: membership.campaignId },
    select: { name: true, level: true, playerId: true, birthRank: true, rankLosses: true, race: { select: { isCorrupted: true } } },
  })
  if (!char) throw new Error('Personagem não encontrado na campanha ativa')
  const charRank = calcCurrentRank(char.level, char.birthRank, char.race.isCorrupted, char.rankLosses)
  const rankOrder = ['E', 'D', 'C', 'B', 'A', 'S']
  const rankUnlocked = rankOrder.indexOf(charRank) >= rankOrder.indexOf(fields.requiredRank)

  const { evolutionStages, ...persistedFields } = fields
  await prisma.skill.create({
    data: {
      ...persistedFields,
      evolutionStages: JSON.stringify(evolutionStages),
      characterId,
      isUnlocked: char.level >= fields.requiredCharacterLevel && rankUnlocked,
      currentLevel:           0,
      uses:                   0,
    },
  })


  revalidatePath('/habilidades')
}

// Habilidades inatas pertencem à raça e são compartilhadas por todos os personagens dela.
export async function createRaceSkill(data: {
  raceId: string; name: string; description: string; branch: string; element: string; maxLevel: number
  requiredCharacterLevel: number; levelEffects?: string[]; evolutionStages?: SkillEvolutionStage[]; costResource: string; costAmount: number; range: string
  duration: string; trigger: string; enhances: string; execution: string; testAttribute: string; results: string
  potency: string; lineName: string; formNumber: number; requiredRank: string; evolvesTo: string
  requirements: string; interactions: string
}) {
  const fields = validateSkillFields(data)
  const raceId = validatedText(data.raceId, 'Raça', { min: 1, max: 100 })
  const userId = await requireUserId()
  const membership = await requireActiveMembership(userId, 'MASTER')
  const race = await prisma.race.findFirst({
    where: { id: raceId, characters: { some: { campaignId: membership.campaignId } } },
    select: { id: true },
  })
  if (!race) throw new Error('Raça não encontrada entre os personagens da campanha ativa')
  if (fields.maxLevel >= 4 && SKILL_RANKS.indexOf(fields.requiredRank as typeof SKILL_RANKS[number]) < SKILL_RANKS.indexOf('B')) {
    throw new Error('Habilidades com Forma 4 ou 5 exigem Rank mínimo B')
  }
  const { requiredCharacterLevel, evolutionStages, ...raceSkillFields } = fields

  await prisma.raceSkill.create({
    data: {
      ...raceSkillFields,
      evolutionStages: JSON.stringify(evolutionStages),
      raceId,
      levelRequired: requiredCharacterLevel,
      isInnate: true,
    },
  })
  revalidatePath('/habilidades')
}

// ─── unlockSkill ──────────────────────────────────────────
// Mestre desbloqueia manualmente uma habilidade criada por ele

export async function unlockSkill(skillId: string) {
  const userId = await requireUserId()
  const membership = await requireActiveMembership(userId, 'MASTER')
  const skill = await prisma.skill.findFirst({
    where: { id: skillId, character: { campaignId: membership.campaignId } },
    select: {
      id: true,
      name: true,
      isUnlocked: true,
      requiredCharacterLevel: true,
      character: { select: { name: true, level: true, playerId: true } },
    },
  })
  if (!skill) throw new Error('Habilidade não encontrada na campanha ativa')

  await prisma.skill.update({
    where: { id: skillId },
    data:  { isUnlocked: true },
  })

  if (!skill.isUnlocked && skill.character.playerId && skill.character.level >= skill.requiredCharacterLevel) {
    await createUserNotification({
      userId: skill.character.playerId,
      preference: 'habilidadesDesbloqueadas',
      type: 'skill_unlocked',
      title: 'Habilidade desbloqueada',
      message: `${skill.name} foi liberada para ${skill.character.name}.`,
      href: '/habilidades',
    })
  }

  revalidatePath('/habilidades')
}

// ─── useSkill ─────────────────────────────────────────────
// Jogador registra uso de uma habilidade.
// Se acumular usos suficientes, sobe de nível automaticamente.
// Registra o uso de habilidades criadas pelo Mestre (Skill).
// Habilidades inatas são tratadas separadamente por useInnateSkill().

async function recordSkillUse(skillId: string) {
  const userId = await requireUserId()
  const membership = await requireActiveMembership(userId, 'PLAYER')

  const result = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Skill" WHERE "id" = ${skillId} FOR UPDATE`
    const skill = await tx.skill.findFirst({
      where: {
        id: skillId,
        character: { campaignId: membership.campaignId, playerId: userId },
      },
      include: { character: { select: { birthRank: true } } },
    })
    if (!skill) throw new Error('Habilidade não encontrada para seu personagem na campanha ativa')
    if (!skill.isUnlocked) throw new Error('Habilidade ainda não desbloqueada')
    if (skill.currentLevel >= skill.maxLevel) throw new Error('Habilidade já está no nível máximo')

    const usesRequired = calcSkillUsesRequired(skill.character.birthRank, skill.currentLevel)
    const newUses = skill.uses + 1
    const leveledUp = newUses >= usesRequired
    const updated = await tx.skill.update({
      where: { id: skillId },
      data: {
        uses: leveledUp ? 0 : newUses,
        currentLevel: leveledUp ? skill.currentLevel + 1 : skill.currentLevel,
      },
    })
    return { leveledUp, newLevel: updated.currentLevel, uses: updated.uses, usesRequired }
  })

  revalidatePath('/habilidades')
  return result
}

// Mantém os nomes públicos usados pelas telas e clientes existentes.
export async function registerSkillUse(skillId: string) {
  return recordSkillUse(skillId)
}

export async function upgradeSkill(skillId: string) {
  return recordSkillUse(skillId)
}

export async function registerInnateSkillUse(raceSkillId: string, characterId: string) {
  const userId = await requireUserId()
  const membership = await requireActiveMembership(userId, 'PLAYER')
  const character = await prisma.character.findFirst({
    where: { id: characterId, campaignId: membership.campaignId, playerId: userId },
    include: { race: { include: { skills: { where: { id: raceSkillId } } } } },
  })
  if (!character || !character.race.skills[0]) throw new Error('Habilidade inata nÃ£o encontrada')

  const raceSkill = character.race.skills[0]
  const requiredLevel = Math.max(raceSkill.levelRequired, calcFirstSkillUnlock(character.birthRank))
  const characterRank = calcCurrentRank(character.level, character.birthRank, character.race.isCorrupted, character.rankLosses)
  const rankOrder = ['E', 'D', 'C', 'B', 'A', 'S']
  if (character.level < requiredLevel || rankOrder.indexOf(characterRank) < rankOrder.indexOf(raceSkill.requiredRank)) throw new Error('Habilidade ainda não desbloqueada')

  const result = await prisma.$transaction(async (tx) => {
    await tx.characterRaceSkill.upsert({
      where: { characterId_raceSkillId: { characterId, raceSkillId } },
      create: { characterId, raceSkillId },
      update: {},
    })
    await tx.$queryRaw`SELECT "id" FROM "CharacterRaceSkill" WHERE "characterId" = ${characterId} AND "raceSkillId" = ${raceSkillId} FOR UPDATE`
    const progress = await tx.characterRaceSkill.findUniqueOrThrow({
      where: { characterId_raceSkillId: { characterId, raceSkillId } },
    })
    if (progress.currentLevel >= raceSkill.maxLevel) throw new Error('Habilidade já está no nível máximo')

    const usesRequired = calcSkillUsesRequired(character.birthRank, progress.currentLevel)
    const newUses = progress.uses + 1
    const leveledUp = newUses >= usesRequired
    const updated = await tx.characterRaceSkill.update({
      where: { id: progress.id },
      data: {
        uses: leveledUp ? 0 : newUses,
        currentLevel: leveledUp ? progress.currentLevel + 1 : progress.currentLevel,
      },
    })
    return { leveledUp, newLevel: updated.currentLevel, uses: updated.uses, usesRequired }
  })

  revalidatePath('/habilidades')
  return result
}
// ─── updateSkill ────────────────────────────────────────────
// Mestre edita uma habilidade criada por ele (não se aplica a RaceSkill, que é inata)
export async function updateSkill(skillId: string, data: {
  name: string
  description: string
  branch: string
  element: string
  maxLevel: number
  requiredCharacterLevel: number
  levelEffects?: string[]
  evolutionStages?: SkillEvolutionStage[]
  costResource: string; costAmount: number; range: string; duration: string; trigger: string; enhances: string
  execution: string; testAttribute: string; results: string; potency: string; lineName: string; formNumber: number
  requiredRank: string; evolvesTo: string; requirements: string; interactions: string
}) {
  const fields = validateSkillFields(data)
  if (fields.maxLevel >= 4 && SKILL_RANKS.indexOf(fields.requiredRank as typeof SKILL_RANKS[number]) < SKILL_RANKS.indexOf('B')) {
    throw new Error('Habilidades com Forma 4 ou 5 exigem Rank mínimo B')
  }
  const userId = await requireUserId()
  const membership = await requireActiveMembership(userId, 'MASTER')

  const skill = await prisma.skill.findFirst({
    where: { id: skillId, character: { campaignId: membership.campaignId } },
    select: { id: true },
  })
  if (!skill) throw new Error('Habilidade não encontrada nesta campanha')

  const { evolutionStages, ...persistedFields } = fields
  await prisma.skill.update({
    where: { id: skillId },
    data: {
      ...persistedFields,
      evolutionStages: JSON.stringify(evolutionStages),
    },
  })

  revalidatePath('/habilidades')
}

export async function updateRaceSkill(raceSkillId: string, data: {
  name: string; description: string; branch: string; element: string; maxLevel: number; requiredCharacterLevel: number
  levelEffects?: string[]; evolutionStages?: SkillEvolutionStage[]; costResource: string; costAmount: number; range: string; duration: string; trigger: string
  enhances: string; execution: string; testAttribute: string; results: string; potency: string; lineName: string
  formNumber: number; requiredRank: string; evolvesTo: string; requirements: string; interactions: string
}) {
  const fields = validateSkillFields(data)
  if (fields.maxLevel >= 4 && SKILL_RANKS.indexOf(fields.requiredRank as typeof SKILL_RANKS[number]) < SKILL_RANKS.indexOf('B')) {
    throw new Error('Habilidades com Forma 4 ou 5 exigem Rank mínimo B')
  }
  const userId = await requireUserId()
  const membership = await requireActiveMembership(userId, 'MASTER')
  const existing = await prisma.raceSkill.findFirst({
    where: { id: raceSkillId, race: { characters: { some: { campaignId: membership.campaignId } } } },
    select: { id: true },
  })
  if (!existing) throw new Error('Habilidade inata não encontrada nesta campanha')
  const { requiredCharacterLevel, evolutionStages, ...raceSkillFields } = fields
  await prisma.raceSkill.update({ where: { id: raceSkillId }, data: { ...raceSkillFields, evolutionStages: JSON.stringify(evolutionStages), levelRequired: requiredCharacterLevel } })
  revalidatePath('/habilidades')
}

// ─── deleteSkill ────────────────────────────────────────────
export async function deleteSkill(skillId: string) {
  const userId = await requireUserId()
  const membership = await requireActiveMembership(userId, 'MASTER')

  const result = await prisma.skill.deleteMany({
    where: { id: skillId, character: { campaignId: membership.campaignId } },
  })
  if (result.count === 0) throw new Error('Habilidade não encontrada nesta campanha')

  revalidatePath('/habilidades')
}

export async function deleteRaceSkill(raceSkillId: string) {
  const userId = await requireUserId()
  const membership = await requireActiveMembership(userId, 'MASTER')
  const result = await prisma.raceSkill.deleteMany({
    where: { id: raceSkillId, race: { characters: { some: { campaignId: membership.campaignId } } } },
  })
  if (!result.count) throw new Error('Habilidade inata não encontrada nesta campanha')
  revalidatePath('/habilidades')
}
