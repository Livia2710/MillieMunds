import { Character } from './character';
import { InventoryItem } from './inventory';

// Atributos numéricos para o card de estatísticas
export interface ProfileStats {
  agilidade: number;
  inteligencia: number;
  forca: number;
  vigor: number;
  sorte: number;
}

// O ProfileCharacter combina a sua lógica de categorias com os dados numéricos da ficha
export type ProfileCharacter = Character & {
  level: number;
  xp: number;
  maxXp: number;
  stats: ProfileStats;
  inventory: InventoryItem[];
};

export interface ProfileSession {
  id: string;
  username: string;
  role: 'mestre' | 'jogador';
  hasCampaign: boolean;
  activeCharacterId: string | null;
}
