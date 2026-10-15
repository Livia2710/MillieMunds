import type { BaseRank } from '@/lib/generated/prisma'
import { getRankMax } from '@/lib/utils/rank'

export type AttributeKey = 'agilidade' | 'inteligencia' | 'forca' | 'vigor' | 'sorte'
export type AttributeModifiers = Partial<Record<AttributeKey, number>>

// Novos bônus e penalidades raciais devem ser cadastrados aqui.
const RACE_TRAITS: Record<string, AttributeModifiers> = {
  ritualista: { inteligencia: 5 },
  fadas: { sorte: 2 },
  'gárgulas incompletas': { vigor: -2 },
  gárgula: { vigor: -2 },
  'gárgula paranoica': { vigor: -2 },
}

export function getRaceAttributeModifiers(raceName: string): AttributeModifiers {
  return RACE_TRAITS[raceName.trim().toLocaleLowerCase('pt-BR')] ?? {}
}

export function applyRaceAttributeModifiers<T extends Record<AttributeKey, number>>(
  attributes: T,
  raceName: string,
  rank: BaseRank | string,
): T {
  const modifiers = getRaceAttributeModifiers(raceName)
  const max = getRankMax(rank)
  return Object.fromEntries(
    (Object.keys(attributes) as AttributeKey[]).map(key => [
      key,
      Math.max(1, Math.min(max, attributes[key] + (modifiers[key] ?? 0))),
    ]),
  ) as T
}
