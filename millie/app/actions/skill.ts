'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { requireActiveMembership, requireUserId } from '@/lib/authorization'
import { revalidatePath } from 'next/cache'
import { calcFirstSkillUnlock, calcSkillUsesRequired } from '@/lib/utils/rank'
import { oneOf, validatedInteger, validatedText } from '@/lib/validation'

const SKILL_BRANCHES = ['ativa', 'passiva', 'reacao', 'aprimoramento'] as const

function validateSkillFields(data: unknown) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Dados da habilidade inválidos')
  const fields = data as Record<string, unknown>
  const maxLevel = validatedInteger(fields.maxLevel, 'Nível máximo', 1, 10)
  const levelEffects = fields.levelEffects === undefined ? [] : fields.levelEffects
  if (!Array.isArray(levelEffects) || levelEffects.length > maxLevel) throw new Error('Efeitos por nível inválidos')
  return {
    name: validatedText(fields.name, 'Nome da habilidade', { min: 1, max: 100 }),
    description: validatedText(fields.description, 'Descrição da habilidade', { max: 5_000, trim: false }),
    branch: oneOf(fields.branch, 'Ramo da habilidade', SKILL_BRANCHES),
    element: validatedText(fields.element, 'Elemento', { min: 1, max: 40 }),
    maxLevel,
    requiredCharacterLevel: validatedInteger(fields.requiredCharacterLevel, 'Nível necessário', 1, 10_000),
    levelEffects: levelEffects.map((effect) => validatedText(effect, 'Efeito por nível', { min: 1, max: 2_000 })),
  }
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

  const innate = char.race.skills.map((rs) => {
    const progress = char.innateSkills.find((entry) => entry.raceSkillId === rs.id)
    return {
    id:                     rs.id,
    name:                   rs.name,
    description:            rs.description,
    branch:                 rs.branch,
    currentLevel:           progress?.currentLevel ?? 0,
    maxLevel:               3,
    isUnlocked:             char.level >= Math.max(rs.levelRequired, firstUnlock),
    requiredCharacterLevel: Math.max(rs.levelRequired, firstUnlock),
    uses:                   progress?.uses ?? 0,
    isInnate:               true,
    }
  })

  const custom = char.skills.map((s) => ({
    id:                     s.id,
    name:                   s.name,
    description:            s.description,
    branch:                 s.branch,
    currentLevel:           s.currentLevel,
    maxLevel:               s.maxLevel,
    isUnlocked:             s.isUnlocked && char.level >= s.requiredCharacterLevel,
    requiredCharacterLevel: s.requiredCharacterLevel,
    uses:                   s.uses,
    isInnate:               false,
    levelEffects:           s.levelEffects,
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
}) {
  const fields = validateSkillFields(data)
  const characterId = validatedText(data.characterId, 'Personagem', { min: 1, max: 100 })
  const userId = await requireUserId()
  const membership = await requireActiveMembership(userId, 'MASTER')
  const char = await prisma.character.findFirst({
    where: { id: characterId, campaignId: membership.campaignId },
    select: { level: true },
  })
  if (!char) throw new Error('Personagem não encontrado na campanha ativa')

  await prisma.skill.create({
    data: {
      ...fields,
      characterId,
      isUnlocked: char.level >= fields.requiredCharacterLevel,
      currentLevel:           0,
      uses:                   0,
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
    select: { id: true },
  })
  if (!skill) throw new Error('Habilidade não encontrada na campanha ativa')

  await prisma.skill.update({
    where: { id: skillId },
    data:  { isUnlocked: true },
  })

  revalidatePath('/habilidades')
}

// ─── useSkill ─────────────────────────────────────────────
// Jogador registra uso de uma habilidade.
// Se acumular usos suficientes, sobe de nível automaticamente.
// Registra o uso de habilidades criadas pelo Mestre (Skill).
// Habilidades inatas são tratadas separadamente por useInnateSkill().

export async function useSkill(skillId: string) {
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

// ─── upgradeSkill ─────────────────────────────────────────
// Alias mantido para compatibilidade — redireciona para useSkill

export async function upgradeSkill(skillId: string) {
  return useSkill(skillId)
}

export async function useInnateSkill(raceSkillId: string, characterId: string) {
  const userId = await requireUserId()
  const membership = await requireActiveMembership(userId, 'PLAYER')
  const character = await prisma.character.findFirst({
    where: { id: characterId, campaignId: membership.campaignId, playerId: userId },
    include: { race: { include: { skills: { where: { id: raceSkillId } } } } },
  })
  if (!character || !character.race.skills[0]) throw new Error('Habilidade inata nÃ£o encontrada')

  const raceSkill = character.race.skills[0]
  const requiredLevel = Math.max(raceSkill.levelRequired, calcFirstSkillUnlock(character.birthRank))
  if (character.level < requiredLevel) throw new Error('Habilidade ainda nÃ£o desbloqueada')

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
    if (progress.currentLevel >= 3) throw new Error('Habilidade já está no nível máximo')

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
}) {
  const fields = validateSkillFields(data)
  const userId = await requireUserId()
  const membership = await requireActiveMembership(userId, 'MASTER')

  const skill = await prisma.skill.findFirst({
    where: { id: skillId, character: { campaignId: membership.campaignId } },
    select: { id: true },
  })
  if (!skill) throw new Error('Habilidade não encontrada nesta campanha')

  await prisma.skill.update({
    where: { id: skillId },
    data: {
      ...fields,
    },
  })

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
