'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Condições que o Mestre pode aplicar manualmente
export const MANUAL_CONDITIONS = [
  'exausto',
  'faminto',
  'inanido',
  'sedento',
  'desidratado',
  'queimando',
  'congelado',
  'aterrorizado',
  'insano',
  'fogo_infernal',
  'envenenado',
] as const

export type ManualCondition = typeof MANUAL_CONDITIONS[number]

// Condições automáticas derivadas do PV — nunca salvas no banco
export type AutoCondition = 'ferido' | 'gravemente_ferido' | 'critico' | 'morrendo'

export type AnyCondition = ManualCondition | AutoCondition

// Labels para exibição
export const CONDITION_LABELS: Record<AnyCondition, string> = {
  ferido:            'Ferido',
  gravemente_ferido: 'Gravemente Ferido',
  critico:           'Crítico',
  morrendo:          'Morrendo',
  exausto:           'Exausto',
  faminto:           'Faminto',
  inanido:           'Inanido',
  sedento:           'Sedento',
  desidratado:       'Desidratado',
  queimando:         'Queimando',
  congelado:         'Congelado',
  aterrorizado:      'Aterrorizado',
  insano:            'Insano',
  fogo_infernal:     'Fogo Infernal',
  envenenado:        'Envenenado',
}

// Cores dos badges por gravidade
export const CONDITION_COLORS: Record<AnyCondition, string> = {
  ferido:            '#D96A2B',   // laranja — fogo
  gravemente_ferido: '#C45A1A',   // laranja escuro
  critico:           '#E24B4A',   // vermelho
  morrendo:          '#8C1A1A',   // vermelho escuro
  exausto:           '#8FA96B',   // terra
  faminto:           '#D8B35E',   // luz/dourado
  inanido:           '#BA7517',   // dourado escuro
  sedento:           '#5BA8D6',   // água
  desidratado:       '#3A7A9E',   // água escuro
  queimando:         '#FF6B2B',   // fogo vivo
  congelado:         '#6CCFCF',   // vento/gelo
  aterrorizado:      '#8C5ACF',   // trevas
  insano:            '#6B3A9E',   // trevas escuro
  fogo_infernal:     '#FF2B2B',   // vermelho intenso
  envenenado:        '#5A9E3A',   // verde veneno
}

// ─── calcAutoConditions ───────────────────────────────────
// Deriva condições automáticas a partir do PV atual — sem banco

export function calcAutoConditions(pv: number, pvMax: number): AutoCondition[] {
  if (pvMax <= 0) return []
  const pct = pv / pvMax

  if (pv <= 0)    return ['morrendo']
  if (pct <= 0.25) return ['critico']
  if (pct <= 0.50) return ['gravemente_ferido']
  if (pct <= 0.75) return ['ferido']
  return []
}

// ─── addCondition ─────────────────────────────────────────
// Mestre aplica uma condição manual a um personagem

export async function addCondition(characterId: string, type: ManualCondition) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true, role: 'MASTER' },
  })
  if (!membership) throw new Error('Apenas o Mestre pode aplicar condições')

  // evita duplicata ativa da mesma condição
  const existing = await prisma.characterCondition.findFirst({
    where: { characterId, type, removedAt: null },
  })
  if (existing) throw new Error(`Personagem já está com a condição ${CONDITION_LABELS[type]}`)

  await prisma.characterCondition.create({
    data: { characterId, type },
  })

  revalidatePath('/mestre')
  revalidatePath('/perfil')
}

// ─── removeCondition ──────────────────────────────────────
// Mestre remove uma condição manual (soft delete com removedAt)

export async function removeCondition(conditionId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true, role: 'MASTER' },
  })
  if (!membership) throw new Error('Apenas o Mestre pode remover condições')

  await prisma.characterCondition.update({
    where: { id: conditionId },
    data:  { removedAt: new Date() },
  })

  revalidatePath('/mestre')
  revalidatePath('/perfil')
}

// ─── getActiveConditions ──────────────────────────────────
// Retorna condições manuais ativas de um personagem

export async function getActiveConditions(characterId: string) {
  const session = await auth()
  if (!session?.user?.id) return []

  return prisma.characterCondition.findMany({
    where: { characterId, removedAt: null },
    orderBy: { appliedAt: 'asc' },
  })
}