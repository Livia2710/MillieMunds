'use client'

import { calcAutoConditions, CONDITION_LABELS, CONDITION_COLORS } from '@/app/actions/condition'
import type { AnyCondition } from '@/app/actions/condition'

type ActiveCondition = {
  id: string
  type: string
}

type ConditionBadgesProps = {
  pv: number
  pvMax: number
  activeConditions: ActiveCondition[] // condições manuais vindas do banco
}

export default function ConditionBadges({ pv, pvMax, activeConditions }: ConditionBadgesProps) {
  const autoConditions = calcAutoConditions(pv, pvMax)

  const allConditions: AnyCondition[] = [
    ...autoConditions,
    ...activeConditions.map((c) => c.type as AnyCondition),
  ]

  if (allConditions.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {allConditions.map((type, i) => (
        <span
          key={`${type}-${i}`}
          className="inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 font-title text-[9px] uppercase tracking-[0.18em]"
          style={{
            borderColor: `${CONDITION_COLORS[type]}60`,
            backgroundColor: `${CONDITION_COLORS[type]}12`,
            color: CONDITION_COLORS[type],
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: CONDITION_COLORS[type] }}
          />
          {CONDITION_LABELS[type]}
        </span>
      ))}
    </div>
  )
}