import type { InventoryRarity } from '@/lib/types/inventory'

const WEAPON_POWER: Record<InventoryRarity, 'fraca' | 'normal' | 'forte' | 'devastadora'> = {
  comum: 'normal', incomum: 'normal', raro: 'forte', epico: 'forte', lendario: 'devastadora', mitico: 'devastadora',
}
const ARMOR_RARITY_BONUS: Record<InventoryRarity, number> = { comum: 0, incomum: 1, raro: 2, epico: 3, lendario: 4, mitico: 5 }
const SHIELD_BLOCK_BONUS: Record<InventoryRarity, number> = { comum: 1, incomum: 1, raro: 2, epico: 2, lendario: 3, mitico: 3 }

export function getWeaponPotency(rarity: string, broken = false) {
  if (broken) return 'fraca'
  return WEAPON_POWER[rarity as InventoryRarity] ?? 'normal'
}

export function getArmorProtection(subtype: string | null | undefined, rarity: string, broken = false) {
  const base = subtype === 'media_armadura' ? 10 : subtype === 'pesada_armadura' ? 15 : subtype === 'leve_armadura' ? 5 : 0
  if (broken) return base
  return Math.min(20, base + (ARMOR_RARITY_BONUS[rarity as InventoryRarity] ?? 0))
}

export function getShieldBlockBonus(rarity: string, broken = false) {
  if (broken) return 0
  return SHIELD_BLOCK_BONUS[rarity as InventoryRarity] ?? 1
}

export function getEquipmentMaxDurability(rarity: string) {
  const values: Record<InventoryRarity, number | null> = { comum: 5, incomum: 6, raro: 8, epico: 10, lendario: 12, mitico: null }
  return values[rarity as InventoryRarity] ?? 5
}

export function getEquipmentPropertyLimit(rarity: string) {
  const values: Record<InventoryRarity, number> = { comum: 0, incomum: 1, raro: 1, epico: 2, lendario: 2, mitico: 3 }
  return values[rarity as InventoryRarity] ?? 0
}

export function getRarityBasePrice(rarity: string) {
  const prices: Record<InventoryRarity, number> = { comum: 20, incomum: 60, raro: 200, epico: 800, lendario: 4_000, mitico: 20_000 }
  return prices[rarity as InventoryRarity] ?? prices.comum
}

export function getEquipmentPrice(rarity: string, subtype: string | null | undefined) {
  const base = getRarityBasePrice(rarity)
  const multiplier = subtype === 'media_armadura' ? 1.5 : subtype === 'pesada_armadura' ? 2 : 1
  return Math.ceil(base * multiplier)
}

export function getPotionPrice(rarity: string) {
  return Math.ceil(getRarityBasePrice(rarity) / 4)
}

export function formatCurrency(total: number) {
  let remaining = Math.max(0, Math.floor(total))
  const units = [{ value: 10_000, name: 'Mundo' }, { value: 1_000, name: 'Ponte' }, { value: 100, name: 'Elo' }, { value: 10, name: 'Fragmento' }, { value: 1, name: 'Estilhaço' }]
  const parts: string[] = []
  for (const unit of units) {
    const count = Math.floor(remaining / unit.value)
    remaining %= unit.value
    if (count) parts.push(`${count} ${unit.name}${count === 1 ? '' : unit.name === 'Estilhaço' ? 's' : unit.name === 'Ponte' ? 's' : unit.name === 'Elo' ? 's' : 's'}`)
  }
  return parts.join(', ') || '0 Estilhaços'
}
