// lib/utils/conditions.ts — sem 'use server', pode ser importado em qualquer lugar

export const MANUAL_CONDITIONS = [
  'exausto', 'faminto', 'inanido', 'sedento', 'desidratado',
  'queimando', 'congelado', 'aterrorizado', 'insano',
  'fogo_infernal', 'envenenado',
] as const

export type ManualCondition = typeof MANUAL_CONDITIONS[number]
export type AutoCondition   = 'ferido' | 'gravemente_ferido' | 'critico' | 'morrendo'
export type AnyCondition    = ManualCondition | AutoCondition

export const CONDITION_LABELS: Record<AnyCondition, string> = {
  ferido: 'Ferido', gravemente_ferido: 'Gravemente Ferido', critico: 'Crítico', morrendo: 'Morrendo',
  exausto: 'Exausto', faminto: 'Faminto', inanido: 'Inanido', sedento: 'Sedento',
  desidratado: 'Desidratado', queimando: 'Queimando', congelado: 'Congelado',
  aterrorizado: 'Aterrorizado', insano: 'Insano', fogo_infernal: 'Fogo Infernal', envenenado: 'Envenenado',
}

export const CONDITION_COLORS: Record<AnyCondition, string> = {
  ferido: '#D96A2B', gravemente_ferido: '#C45A1A', critico: '#E24B4A', morrendo: '#8C1A1A',
  exausto: '#8FA96B', faminto: '#D8B35E', inanido: '#BA7517', sedento: '#5BA8D6',
  desidratado: '#3A7A9E', queimando: '#FF6B2B', congelado: '#6CCFCF',
  aterrorizado: '#8C5ACF', insano: '#6B3A9E', fogo_infernal: '#FF2B2B', envenenado: '#5A9E3A',
}

export function calcAutoConditions(pv: number, pvMax: number): AutoCondition[] {
  if (pvMax <= 0) return []
  const pct = pv / pvMax
  if (pv <= 0)    return ['morrendo']
  if (pct < 0.25) return ['critico']
  if (pct < 0.50) return ['gravemente_ferido']
  if (pct < 0.75) return ['ferido']
  return []
}