// lib/utils/conditions.ts — sem 'use server', pode ser importado em qualquer lugar
import { getRankMax } from '@/lib/utils/rank'

export const MANUAL_CONDITIONS = [
  'exausto', 'faminto', 'inanido', 'sedento', 'desidratado',
  'queimando', 'congelado', 'aterrorizado', 'insano',
  'fogo_infernal', 'envenenado', 'empurrado', 'caido', 'hesitacao', 'recuo', 'fuga',
] as const

export type ManualCondition = typeof MANUAL_CONDITIONS[number]
export type AutoCondition   = 'ferido' | 'gravemente_ferido' | 'critico' | 'morrendo' | 'penalidade_leve' | 'penalidade_grave' | 'risco_regressao'
export type AnyCondition    = ManualCondition | AutoCondition

export const CONDITION_LABELS: Record<AnyCondition, string> = {
  ferido: 'Ferido', gravemente_ferido: 'Gravemente Ferido', critico: 'Crítico', morrendo: 'Morrendo',
  penalidade_leve: 'Penalidade Leve', penalidade_grave: 'Penalidade Grave', risco_regressao: 'Risco de Regressão',
  exausto: 'Exausto', faminto: 'Faminto', inanido: 'Inanido', sedento: 'Sedento',
  desidratado: 'Desidratado', queimando: 'Queimando', congelado: 'Congelado',
  aterrorizado: 'Aterrorizado', insano: 'Insano', fogo_infernal: 'Fogo Infernal', envenenado: 'Envenenado',
  empurrado: 'Empurrado', caido: 'Caído', hesitacao: 'Hesitação', recuo: 'Recuo', fuga: 'Fuga',
}

export const CONDITION_COLORS: Record<AnyCondition, string> = {
  ferido: '#D96A2B', gravemente_ferido: '#C45A1A', critico: '#E24B4A', morrendo: '#8C1A1A',
  penalidade_leve: '#D8B35E', penalidade_grave: '#C45A1A', risco_regressao: '#8C1A1A',
  exausto: '#8FA96B', faminto: '#D8B35E', inanido: '#BA7517', sedento: '#5BA8D6',
  desidratado: '#3A7A9E', queimando: '#FF6B2B', congelado: '#6CCFCF',
  aterrorizado: '#8C5ACF', insano: '#6B3A9E', fogo_infernal: '#FF2B2B', envenenado: '#5A9E3A',
  empurrado: '#B8784A', caido: '#916C4B', hesitacao: '#A28BC4', recuo: '#8C5ACF', fuga: '#C45A1A',
}

export function calcAutoConditions(pv: number, pvMax: number): AutoCondition[] {
  if (pvMax <= 0) return []
  const pct = pv / pvMax
  if (pv <= 0)    return ['morrendo']
  if (pct <= 0.25) return ['critico']
  if (pct <= 0.50) return ['gravemente_ferido']
  if (pct <= 0.75) return ['ferido']
  return []
}

export type TestConditionModifier = { condition: AnyCondition | string; label: string; penalty: number }

const CONDITION_TEST_RULES: Record<string, { label: string; penalty: number; applies: (attribute: string, offensive: boolean) => boolean }> = {
  ferido: { label: 'Ferido', penalty: 1, applies: (attribute) => ['agilidade', 'forca', 'vigor'].includes(attribute) },
  gravemente_ferido: { label: 'Gravemente Ferido', penalty: 2, applies: (attribute) => ['agilidade', 'forca', 'vigor'].includes(attribute) },
  critico: { label: 'Crítico', penalty: 3, applies: () => true },
  exausto: { label: 'Exausto', penalty: 1, applies: () => true },
  faminto: { label: 'Faminto', penalty: 1, applies: (attribute) => ['forca', 'vigor'].includes(attribute) },
  inanido: { label: 'Inanido', penalty: 2, applies: (attribute) => ['forca', 'vigor'].includes(attribute) },
  sedento: { label: 'Sedento', penalty: 1, applies: (attribute) => ['agilidade', 'forca', 'vigor'].includes(attribute) },
  desidratado: { label: 'Desidratado', penalty: 2, applies: (attribute) => ['agilidade', 'forca', 'vigor'].includes(attribute) },
  congelado: { label: 'Congelado', penalty: 2, applies: (attribute) => attribute === 'agilidade' },
  aterrorizado: { label: 'Aterrorizado', penalty: 2, applies: (_attribute, offensive) => offensive },
  envenenado: { label: 'Envenenado', penalty: 2, applies: (_attribute, offensive) => offensive },
  insano: { label: 'Insano', penalty: 3, applies: (attribute) => attribute === 'inteligencia' },
}

/** Lists active conditions and their numeric effects for a specific test. */
export function getTestConditionModifiers(
  conditions: string[],
  attribute: string,
  offensive = false,
): TestConditionModifier[] {
  const present = new Set(conditions)
  const injury = present.has('critico') ? 'critico' : present.has('gravemente_ferido') ? 'gravemente_ferido' : present.has('ferido') ? 'ferido' : null
  const hunger = present.has('inanido') ? 'inanido' : present.has('faminto') ? 'faminto' : null
  const thirst = present.has('desidratado') ? 'desidratado' : present.has('sedento') ? 'sedento' : null
  const suppressed = new Set(['ferido', 'gravemente_ferido', 'critico', 'faminto', 'inanido', 'sedento', 'desidratado'])

  return [...present].map((condition) => {
    const rule = CONDITION_TEST_RULES[condition]
    if (!rule) return { condition, label: CONDITION_LABELS[condition as AnyCondition] ?? condition, penalty: 0 }
    const replacedByStronger = suppressed.has(condition) && condition !== injury && condition !== hunger && condition !== thirst
    const amount = condition === 'sedento' && attribute === 'agilidade' ? 2 : rule.penalty
    const penalty = !replacedByStronger && rule.applies(attribute, offensive) ? -amount : 0
    return { condition, label: rule.label, penalty }
  })
}

/** Penalidades de linhagem do livro, calculadas pela soma dos cinco atributos. */
export function calcRankPenalty(rank: string, total: number): { penalty: 0 | 1 | 2; regressionRisk: boolean } {
  const bands: Record<string, { expected: number; light: number; severe: number }> = {
    C: { expected: 36, light: 33, severe: 30 },
    B: { expected: 46, light: 43, severe: 40 },
    A: { expected: 56, light: 53, severe: 50 },
    S: { expected: 66, light: 63, severe: 60 },
  }
  const band = bands[rank]
  if (!band || total >= band.expected) return { penalty: 0, regressionRisk: false }
  if (total >= band.light) return { penalty: 1, regressionRisk: false }
  if (total >= band.severe) return { penalty: 2, regressionRisk: false }
  return { penalty: 0, regressionRisk: true }
}

export function calcRankCondition(rank: string, stats: { agilidade: number; inteligencia: number; forca: number; vigor: number; sorte: number }): AutoCondition[] {
  const max = getRankMax(rank)
  const total = Object.values(stats).reduce((sum, value) => sum + Math.min(value, max), 0)
  const { penalty, regressionRisk } = calcRankPenalty(rank, total)
  if (regressionRisk) return ['risco_regressao']
  if (penalty === 2) return ['penalidade_grave']
  if (penalty === 1) return ['penalidade_leve']
  return []
}
