import type { Character } from './character'
import type { InventoryItem } from './inventory'

export interface ProfileStats {
  agilidade:    number
  inteligencia: number
  forca:        number
  vigor:        number
  sorte:        number
}

export type ProfileCharacter = Character & {
  level:    number
  xp:       number
  maxXp:    number
  pv:       number
  pvMax:    number
  pm:       number
  birthRank: string
  pmMax:    number
  stats:    ProfileStats
  inventory: InventoryItem[]
}

export interface ProfileSession {
  id:                string
  username:          string
  role:              'mestre' | 'jogador'
  hasCampaign:       boolean
  activeCharacterId: string | null
}