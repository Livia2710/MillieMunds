export function calcRankByLevel(level: number): string {
  if (level >= 200) return 'S'
  if (level >= 150) return 'A'
  if (level >= 100) return 'B'
  if (level >= 50)  return 'C'
  return 'D'
}

export function getRankMultiplier(rank: string): number {
  const map: Record<string, number> = {
    D: 1,
    C: 4.5,
    B: 6.36,
    A: 8.18,
    S: 10,
  }
  return map[rank] ?? 1
}

export function getRankMin(rank: string): number {
  return Math.ceil(getRankMultiplier(rank))
}

export function getRankMax(rank: string): number {
  return Math.floor(10 * getRankMultiplier(rank))
}

export function getTotalPoints(rank: string): number {
  return Math.round(25 * getRankMultiplier(rank))
}

export function calcPV(vigor: number): number {
  return 10 + vigor * 2
}

export function calcPM(inteligencia: number): number {
  return 10 + inteligencia * 2
}