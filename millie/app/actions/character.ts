'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import type { BaseRank } from '@/lib/generated/prisma'
import { revalidatePath } from 'next/cache'
import type { CharacterElement, CharacterCategory } from '@/lib/types/character'
import { calcRankByLevel, calcPV, calcPM, calcXpToNextLevel } from '@/lib/utils/rank'


// ─── helper: shape de retorno compartilhado ───────────────
function formatCharacter(char: any, campaignItems: any[]) {
  return {
    ...char,
    race: char.race.name,
    element: char.element as CharacterElement,
    rank: calcRankByLevel(char.level),   // rank derivado do nível, não do campo
    category: char.category as CharacterCategory,
    stats: {
      agilidade:    char.agilidade,
      inteligencia: char.inteligencia,
      forca:        char.forca,
      vigor:        char.vigor,
      sorte:        char.sorte,
    },
    pv:    char.pv,
    pvMax: char.pvMax,
    pm:    char.pm,
    pmMax: char.pmMax,
    inventory: campaignItems.filter((i) => i.ownerId === char.id),
  }
}

// ─── queries ──────────────────────────────────────────────

export async function getCharactersByActiveCampaign() {
  const session = await auth()
  if (!session?.user?.id) return []

  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true },
    include: {
      campaign: {
        include: {
          characters: { include: { race: true, skills: true } },
          items: true,
        },
      },
    },
  })

  if (!membership) return []

  return membership.campaign.characters.map((char) =>
    formatCharacter(char, membership.campaign.items)
  )
}

export async function getCharacterById(id: string) {
  const session = await auth()
  if (!session?.user?.id) return null

  const char = await prisma.character.findFirst({
    where: {
      id,
      campaign: { members: { some: { userId: session.user.id } } },
    },
    include: {
      race: true,
      skills: true,
      campaign: { include: { items: true } },
    },
  })

  if (!char) return null
  return formatCharacter(char, char.campaign.items)
}

export async function getMyCharacter() {
  const session = await auth()
  if (!session?.user?.id) return null

  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true },
  })
  if (!membership) return null

  const char = await prisma.character.findFirst({
    where: {
      campaignId: membership.campaignId,
      playerId: session.user.id,
    },
    include: {
      race: true,
      skills: true,
      campaign: { include: { items: true } },
    },
  })

  if (!char) return null
  return formatCharacter(char, char.campaign.items)
}

export async function unlockCharacter(characterId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  await prisma.character.update({
    where: { id: characterId },
    data: { isLocked: false },
  })

  revalidatePath('/personagens')
}

// ─── createCharacter (Mestre cria NPC / monstro) ─────────
export async function createCharacter(data: {
  name: string
  category: string
  raceId: string
  element: string
  worldSlug: string
  image?: string
  year?: number
  subject?: string
  occupation?: string
  dangerLevel?: string
  // atributos opcionais — Mestre pode definir ou deixar no mínimo da raça
  agilidade?: number
  inteligencia?: number
  forca?: number
  vigor?: number
  sorte?: number
  birthRank?: BaseRank
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true, role: 'MASTER' },
  })
  if (!membership) throw new Error('Sem campanha ativa como Mestre')

  const agilidade    = data.agilidade    ?? 1
  const inteligencia = data.inteligencia ?? 1
  const forca        = data.forca        ?? 1
  const vigor        = data.vigor        ?? 1
  const sorte        = data.sorte        ?? 1
  const pv           = 10 + vigor        * 2
  const pm           = 10 + inteligencia * 2

  await prisma.character.create({
    data: {
      name:        data.name,
      category:    data.category,
      element:     data.element,
      worldSlug:   data.worldSlug,
      birthRank: data.birthRank ?? 'D' as BaseRank,
      raceId:      data.raceId,
      campaignId:  membership.campaignId,
      image:       data.image,
      year:        data.year,
      subject:     data.subject,
      occupation:  data.occupation,
      dangerLevel: data.dangerLevel,
      agilidade,
      inteligencia,
      forca,
      vigor,
      sorte,
      pv,
      pvMax: pv,
      pm,
      pmMax: pm,
    },
  })

  revalidatePath('/personagens')
}

// ─── createPlayerCharacter (Jogador cria o próprio) ───────
export async function createPlayerCharacter(data: {
  name: string
  category: string
  raceId: string
  element: string
  worldSlug: string
  image?: string
  year?: number
  subject?: string
  occupation?: string
  // atributos — obrigatórios aqui, vêm do form
  agilidade: number
  inteligencia: number
  forca: number
  vigor: number
  sorte: number
  pv: number
  pvMax: number
  pm: number
  pmMax: number
  birthRank: BaseRank
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true },
  })
  if (!membership) throw new Error('Sem campanha ativa')

  // sanidade: recalcula PV e PM no servidor — não confia nos valores do cliente
  const pvCalc  = 10 + data.vigor        * 2
  const pmCalc  = 10 + data.inteligencia * 2

  await prisma.character.create({
    data: {
      name:        data.name,
      category:    data.category,
      element:     data.element,
      worldSlug:   data.worldSlug,
      birthRank:    data.birthRank,
      isLocked:    false,
      raceId:      data.raceId,
      campaignId:  membership.campaignId,
      playerId:    session.user.id,
      image:       data.image,
      year:        data.year,
      subject:     data.subject,
      occupation:  data.occupation,
      agilidade:    data.agilidade,
      inteligencia: data.inteligencia,
      forca:        data.forca,
      vigor:        data.vigor,
      sorte:        data.sorte,
      pv:    pvCalc,
      pvMax: pvCalc,
      pm:    pmCalc,
      pmMax: pmCalc,
    },
  })

  revalidatePath('/perfil')
}

// ─── getUniverses — inclui baseRank nas raças ─────────────
export async function getUniverses() {
  return prisma.universe.findMany({
    include: {
      worlds: {
        include: {
          races: {
            select: {
              id:      true,
              name:    true,
              element: true,
              baseRank: true,   // necessário para o form calcular o multiplicador
            },
          },
        },
      },
    },
  })
}

export async function getMasterPageData() {
  const session = await auth()
  if (!session?.user?.id) return null

  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true, role: 'MASTER' },
    include: {
      campaign: {
        include: {
          members: {
            include: {
              user: {
                select: { id: true, username: true, avatar: true, email: true },
              },
            },
          },
          characters: {
            include: {
              race: {
                include: {
                  evolutions: true,
                },
              },
              tarotDraws: { orderBy: { drawnAt: 'desc' } },
              conditions: {
                where: { removedAt: null},
                select: { id: true, type: true},
              }
            },
          },
        },
      },
    },
  })

  if (!membership) return null

  const { campaign } = membership

  const characters = campaign.characters.map((char) => ({
    id: char.id,
    name: char.name,
    category: char.category,
    image: char.image,
    level: char.level,
    rank: calcRankByLevel(char.level),
    racePath: char.racePath,
    evolvedRaceId: char.evolvedRaceId,
    playerId: char.playerId,
    race: {
      id: char.race.id,
      name: char.race.name,
      canAscend: char.race.canAscend,
      canCorrupt: char.race.canCorrupt,
      evolutions: char.race.evolutions,
    },
    tarotDraws: char.tarotDraws,
    pv:               char.pv,
    pvMax:            char.pvMax,
    xp:               char.xp,
    maxXp:            char.maxXp,
    activeConditions: char.conditions,
  }))

  const players = campaign.members
    .filter((m) => m.role === 'PLAYER')
    .map((m) => ({
      userId: m.user.id,
      username: m.user.username,
      avatar: m.user.avatar,
      email: m.user.email,
      character: characters.find((c) => c.playerId === m.user.id) ?? null,
    }))

  // personagens elegíveis para ascensão/corrupção:
  // level atingiu o levelRequired de alguma evolução e ainda não escolheu caminho
  const eligibleForEvolution = characters.filter(
    (c) =>
      c.racePath === null &&
      c.race.evolutions.some((e) => c.level >= e.levelRequired)
  )

  return {
    inviteCode: campaign.inviteCode,
    campaignName: campaign.name,
    players,
    characters,
    eligibleForEvolution,
    allTarotDraws: characters.flatMap((c) =>
      c.tarotDraws.map((draw) => ({ ...draw, characterName: c.name }))
    ),
  }
}

export async function getSpecialCards(characterId: string) {
  const session = await auth()
  if (!session?.user?.id) return []

  return prisma.specialCard.findMany({
    where: { characterId },
    orderBy: { obtainedAt: 'asc' },
  })
}

export async function saveSpecialCard(characterId: string, cardType: 'VALETE' | 'CAVALEIRO') {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  // garante unicidade: só 1 de cada tipo disponível por vez
  const existing = await prisma.specialCard.findFirst({
    where: { characterId, cardType, isAvailable: true },
  })
  if (existing) throw new Error(`Você já tem um ${cardType} guardado.`)

  return prisma.specialCard.create({
    data: { characterId, cardType },
  })
}

export async function useSpecialCard(cardId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  return prisma.specialCard.update({
    where: { id: cardId },
    data: { isAvailable: false, usedAt: new Date() },
  })
}

// ─── addXp ────────────────────────────────────────────────
// Adiciona XP ao personagem e processa level up(s) automaticamente.
// O custo por nível usa o birthRank da raça ATUAL (evolvedRaceId ?? raceId).
// Pode subir vários níveis de uma vez se o XP for suficiente.
// Apenas o Mestre pode chamar esta action.

export async function addXp(characterId: string, amount: number) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true, role: 'MASTER' },
  })
  if (!membership) throw new Error('Apenas o Mestre pode conceder XP')

  // busca o personagem com a raça atual (evoluída ou original)
  const char = await prisma.character.findFirst({
    where: { id: characterId, campaignId: membership.campaignId },
    include: {
      race: true,
    },
  })
  if (!char) throw new Error('Personagem não encontrado')

  // se tem raça evoluída, busca o birthRank dela; senão usa a original
  let currentBirthRank: string = char.race.baseRank

  if (char.evolvedRaceId) {
    const evolvedRace = await prisma.race.findUnique({
      where: { id: char.evolvedRaceId },
      select: { baseRank: true },
    })
    if (evolvedRace) currentBirthRank = evolvedRace.baseRank
  }

  // processa level up em loop — o personagem pode subir vários níveis de uma vez
  let currentLevel = char.level
  let currentXp    = char.xp + amount

  while (true) {
    const xpNeeded = calcXpToNextLevel(currentBirthRank)
    if (currentXp < xpNeeded) break
    currentXp    -= xpNeeded
    currentLevel += 1
  }

  const newMaxXp = calcXpToNextLevel(currentBirthRank)

  await prisma.character.update({
    where: { id: characterId },
    data: {
      xp:    currentXp,
      level: currentLevel,
      maxXp: newMaxXp,
    },
  })

  revalidatePath('/personagens')
  revalidatePath('/perfil')
  revalidatePath('/mestre')

  return {
    newLevel: currentLevel,
    newXp:    currentXp,
    maxXp:    newMaxXp,
    leveledUp: currentLevel > char.level,
    levelsGained: currentLevel - char.level,
  }
}

// ─── applyRaceEvolution ───────────────────────────────────
// Aplica a escolha de evolução de raça de um personagem.
// A escolha (ASCENSAO | CORRUPCAO | PERMANENCIA) é do JOGADOR,
// mas o Mestre confirma/executa pelo painel.
//
// Ao evoluir:
// - evolvedRaceId recebe o id da nova raça
// - racePath recebe o caminho escolhido
// - birthRank do personagem NÃO é alterado diretamente —
//   o custo de XP passa a usar o baseRank da nova raça (via evolvedRaceId)
// - birthRank de nascença (original) é preservado para cálculo de
//   primeiro despertar de habilidade

export async function applyRaceEvolution(
  characterId: string,
  path: 'ASCENSAO' | 'CORRUPCAO' | 'PERMANENCIA'
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true, role: 'MASTER' },
  })
  if (!membership) throw new Error('Apenas o Mestre pode aplicar evolução de raça')

  const char = await prisma.character.findFirst({
    where: { id: characterId, campaignId: membership.campaignId },
    include: {
      race: {
        include: { evolutions: true },
      },
    },
  })
  if (!char) throw new Error('Personagem não encontrado')
  if (char.racePath !== null) throw new Error('Este personagem já escolheu um caminho')

  // PERMANENCIA: apenas registra o caminho, sem trocar de raça
  if (path === 'PERMANENCIA') {
    await prisma.character.update({
      where: { id: characterId },
      data: { racePath: 'PERMANENCIA' },
    })

    revalidatePath('/mestre')
    revalidatePath('/personagens')
    return { path: 'PERMANENCIA', newRaceName: null }
  }

  // ASCENSAO ou CORRUPCAO: encontra a evolução correspondente
  const evolution = char.race.evolutions.find(
    (e) => e.path === path && char.level >= e.levelRequired
  )
  if (!evolution) {
    throw new Error(
      `Evolução ${path} não disponível para ${char.race.name} no nível ${char.level}`
    )
  }

  // busca a raça de destino pelo nome (toRaceName definido no seed)
  const targetRace = await prisma.race.findFirst({
    where: { name: evolution.toRaceName },
    select: { id: true, name: true, baseRank: true },
  })
  if (!targetRace) {
    throw new Error(
      `Raça de destino "${evolution.toRaceName}" não encontrada no banco`
    )
  }

  // recalcula maxXp com o birthRank da nova raça
  const newMaxXp = calcXpToNextLevel(targetRace.baseRank)

  await prisma.character.update({
    where: { id: characterId },
    data: {
      racePath:      path,
      evolvedRaceId: targetRace.id,
      raceId:        targetRace.id,  // raça ativa agora é a nova
      maxXp:         newMaxXp,
    },
  })

  revalidatePath('/mestre')
  revalidatePath('/personagens')
  revalidatePath('/perfil')

  return {
    path,
    newRaceName:  targetRace.name,
    newBirthRank: targetRace.baseRank,
  }
}

// ─── updateCharacterPoints ────────────────────────────────
// Jogador ajusta PV/PM do próprio personagem durante a narrativa.
// Respeita os limites (0 ↔ pvMax / pmMax).

export async function updateCharacterPoints(
  characterId: string,
  data: { pv?: number; pm?: number }
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  const char = await prisma.character.findFirst({
    where: {
      id: characterId,
      playerId: session.user.id, // só o próprio jogador
    },
    select: { pvMax: true, pmMax: true, pv: true, pm: true },
  })
  if (!char) throw new Error('Personagem não encontrado')

  const newPv = data.pv !== undefined
    ? Math.max(0, Math.min(data.pv, char.pvMax))
    : undefined

  const newPm = data.pm !== undefined
    ? Math.max(0, Math.min(data.pm, char.pmMax))
    : undefined

  await prisma.character.update({
    where: { id: characterId },
    data: {
      ...(newPv !== undefined && { pv: newPv }),
      ...(newPm !== undefined && { pm: newPm }),
    },
  })

  revalidatePath('/perfil')

  return {
    pv: newPv ?? char.pv,
    pm: newPm ?? char.pm,
  }
}