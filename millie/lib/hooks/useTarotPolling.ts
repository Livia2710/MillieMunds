'use client'

import { useEffect, useState } from 'react'
import { getPendingTarotReading } from '@/app/actions/tarot'

type PendingDraw = {
  id: string
  readingType: 'COMUM' | 'PROFUNDA'
  question: string
  status: string
}

export function useTarotPolling(characterId: string | null) {
  const [pendingDraw, setPendingDraw] = useState<PendingDraw | null>(null)

  useEffect(() => {
    if (!characterId) return

    const interval = setInterval(async () => {
      const draw = await getPendingTarotReading(characterId)
      if (draw && draw.status === 'pendente') {
        setPendingDraw(draw as PendingDraw)
      } else {
        setPendingDraw(null)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [characterId])

  return { pendingDraw, clearPending: () => setPendingDraw(null) }
}