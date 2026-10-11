import { calcCurrentRank } from '@/lib/utils/rank'

type CapacityInput = {
  level: number
  forca: number
  birthRank: Parameters<typeof calcCurrentRank>[1]
  race: { isCorrupted: boolean }
}
const ABOVE_D: string[] = ['C', 'B', 'A', 'S']

/** 10 + Força + 5 por faixa acima de D. Cada item distinto (pilha) ocupa 1 espaço. */
export function calcInventoryCapacity(c: CapacityInput) {
  const rank = calcCurrentRank(c.level, c.birthRank, c.race.isCorrupted)
  return 10 + c.forca + (ABOVE_D.indexOf(rank) + 1) * 5
}