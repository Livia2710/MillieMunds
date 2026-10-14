'use client'

import { CONDITION_LABELS, CONDITION_COLORS, calcAutoConditions } from '@/lib/utils/conditions'
import type { AnyCondition } from '@/lib/utils/conditions'

type ActiveCondition = {
  id: string
  type: string
  definition?: { name: string; cause: string; color: string; removalInstructions: string } | null
}

type ConditionBadgesProps = {
  pv: number
  pvMax: number
  activeConditions: ActiveCondition[] // condições manuais vindas do banco
}

export default function ConditionBadges({ pv, pvMax, activeConditions }: ConditionBadgesProps) {
  const autoConditions = calcAutoConditions(pv, pvMax)

  const allConditions = [
    ...autoConditions.map(type => ({ key: type, label: CONDITION_LABELS[type], color: CONDITION_COLORS[type], title: '' })),
    ...activeConditions.map((condition) => condition.definition
      ? { key: condition.id, label: condition.definition.name, color: condition.definition.color, title: `Causa: ${condition.definition.cause} · Remoção: ${condition.definition.removalInstructions}` }
      : { key: condition.id, label: CONDITION_LABELS[condition.type as AnyCondition] ?? condition.type, color: CONDITION_COLORS[condition.type as AnyCondition] ?? '#D8B35E', title: '' }),
  ]

  if (allConditions.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {allConditions.map((condition) => (
        <span
          key={condition.key}
          title={condition.title || undefined}
          className="inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 font-title text-[9px] uppercase tracking-[0.18em]"
          style={{
            borderColor: `${condition.color}60`,
            backgroundColor: `${condition.color}12`,
            color: condition.color,
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: condition.color }}
          />
          {condition.label}
        </span>
      ))}
    </div>
  )
}
