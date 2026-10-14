import type { CharacterCategory } from '@/lib/types/character'

const CATEGORY_NAMES: Record<CharacterCategory, Record<number, string>> = {
  aluno: { 9: 'Confidente', 6: 'Amigo', 3: 'Colega', 0: 'Neutro', [-3]: 'Antipático', [-6]: 'Rival', [-9]: 'Arquirrival' },
  professor: { 9: 'Protegido', 6: 'Favorito', 3: 'Estimado', 0: 'Neutro', [-3]: 'Mal Visto', [-6]: 'Desafeto', [-9]: 'Inimigo' },
  npc: { 9: 'Aliado Fiel', 6: 'Amigo', 3: 'Simpático', 0: 'Neutro', [-3]: 'Desconfiado', [-6]: 'Hostil', [-9]: 'Inimigo Jurado' },
  monstro: { 9: 'Vínculo', 6: 'Aliado', 3: 'Tolerado', 0: 'Indiferente', [-3]: 'Observado', [-6]: 'Alvo', [-9]: 'Presa Marcada' },
}

export function getFavorCategory(category: CharacterCategory, value: number) {
  const tier = value >= 9 ? 9 : value >= 6 ? 6 : value >= 3 ? 3 : value <= -9 ? -9 : value <= -6 ? -6 : value <= -3 ? -3 : 0
  return CATEGORY_NAMES[category][tier]
}
