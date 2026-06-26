'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { calcFirstSkillUnlock, calcSkillUsesRequired } from '@/lib/utils/rank'

// ─── getSkillsByCharacter ─────────────────────────────────
// Retorna as habilidades do personagem mesclando:
// 1. RaceSkill (inatas da raça) — desbloqueio por nível
// 2. Skill (criadas pelo Mestre para o personagem)

export async function getSkillsByCharacter(characterId: string) {
  const session = await auth()
  if (!session?.user?.id) return null

  const char = await prisma.character.findFirst({
    where: { id: characterId },   // ← remove a verificação de membership que pode estar quebrando
    include: {
      race: {
        include: { skills: true },
      },
      skills: true,
    },
  })

  if (!char) return null

  // verifica separadamente se o usuario tem acesso
  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, campaignId: char.campaignId },
  })
  if (!membership) return null

  const firstUnlock = calcFirstSkillUnlock(char.birthRank)

  const innate = char.race.skills.map((rs) => ({
    id:                     rs.id,
    name:                   rs.name,
    description:            rs.description,
    branch:                 rs.branch,
    currentLevel:           0,
    maxLevel:               3,
    isUnlocked:             char.level >= Math.max(rs.levelRequired, firstUnlock),
    requiredCharacterLevel: Math.max(rs.levelRequired, firstUnlock),
    uses:                   0,
    isInnate:               true,
  }))

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
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true, role: 'MASTER' },
  })
  if (!membership) throw new Error('Apenas o Mestre pode criar habilidades')

  await prisma.skill.create({
    data: {
      name:                   data.name,
      description:            data.description,
      branch:                 data.branch,
      element:                data.element,
      maxLevel:               data.maxLevel,
      requiredCharacterLevel: data.requiredCharacterLevel,
      characterId:            data.characterId,
      isUnlocked:             false,
      currentLevel:           0,
      uses:                   0,
    },
  })

  revalidatePath('/habilidades')
}

// ─── unlockSkill ──────────────────────────────────────────
// Mestre desbloqueia manualmente uma habilidade criada por ele

export async function unlockSkill(skillId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true, role: 'MASTER' },
  })
  if (!membership) throw new Error('Apenas o Mestre pode desbloquear habilidades')

  await prisma.skill.update({
    where: { id: skillId },
    data:  { isUnlocked: true },
  })

  revalidatePath('/habilidades')
}

// ─── useSkill ─────────────────────────────────────────────
// Jogador registra uso de uma habilidade.
// Se acumular usos suficientes, sobe de nível automaticamente.
// Funciona para habilidades inatas (RaceSkill não tem uses — lógica futura)
// e para habilidades criadas pelo Mestre (Skill com uses no banco).

export async function useSkill(skillId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  const skill = await prisma.skill.findFirst({
    where: { id: skillId },
    include: {
      character: {
        select: { birthRank: true },
      },
    },
  })

  if (!skill) throw new Error('Habilidade não encontrada')
  if (!skill.isUnlocked) throw new Error('Habilidade ainda não desbloqueada')
  if (skill.currentLevel >= skill.maxLevel) throw new Error('Habilidade já está no nível máximo')

  const birthRank     = skill.character.birthRank
  const usesRequired  = calcSkillUsesRequired(birthRank, skill.currentLevel)
  const newUses       = skill.uses + 1
  const shouldLevelUp = newUses >= usesRequired

  await prisma.skill.update({
    where: { id: skillId },
    data: {
      uses:         shouldLevelUp ? 0 : newUses,
      currentLevel: shouldLevelUp ? skill.currentLevel + 1 : skill.currentLevel,
    },
  })

  revalidatePath('/habilidades')

  return {
    leveledUp:    shouldLevelUp,
    newLevel:     shouldLevelUp ? skill.currentLevel + 1 : skill.currentLevel,
    uses:         shouldLevelUp ? 0 : newUses,
    usesRequired,
  }
}

// ─── upgradeSkill ─────────────────────────────────────────
// Alias mantido para compatibilidade — redireciona para useSkill

export async function upgradeSkill(skillId: string) {
  return useSkill(skillId)
}