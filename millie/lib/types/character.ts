export type CharacterCategory = "aluno" | "professor" | "npc" | "monstro";
export type CharacterRank = "S" | "A" | "B" | "C" | "D" | "E" | "V";
export type CharacterElement = "trevas" | "luz" | "terra" | "agua" | "vento" | "fogo";

import type { RacePath } from '@/lib/generated/prisma'

// Propriedades obrigatórias para ABSOLUTAMENTE TODOS os personagens
interface BaseCharacter {
  id: string;
  name: string;
  image?: string;
  rank: CharacterRank;
  element: CharacterElement;
  race: string;
  worldSlug: string; // Mundo Natal
  isLocked?: boolean;
}

// Extensões específicas para cada categoria
interface AlunoCharacter extends BaseCharacter {
  category: "aluno";
  year: 1 | 2 | 3 | 4 | 5; // Ano Escolar
}

interface ProfessorCharacter extends BaseCharacter {
  category: "professor";
  subject: string; // Disciplina/Matéria que leciona
}

interface NpcCharacter extends BaseCharacter {
  category: "npc";
  occupation: string; // Profissão/Origem (ex: Comerciante, Rei, Guardião)
}

interface MonstroCharacter extends BaseCharacter {
  category: "monstro";
  dangerLevel: "Iniciante" | "Intermediário" | "Avançado" | "Calamidade"; 
}

// O tipo Character final é a união de todas as possibilidades
export type Character = AlunoCharacter | ProfessorCharacter | NpcCharacter | MonstroCharacter;


export type MasterCharacter = {
  id:            string
  name:          string
  image?:        string
  category:      CharacterCategory
  level:         number
  rank:          CharacterRank
  pv:            number
  pvMax:         number
  xp:            number
  maxXp:         number
  racePath:      string | null
  evolvedRaceId: string | null
  playerId:      string | null
  race: {
    id:         string
    name:       string
    canAscend:  boolean
    canCorrupt: boolean
    evolutions: { id: string; path: RacePath; levelRequired: number; toRaceName: string }[]  // ← path: RacePath
  }
  activeConditions: { id: string; type: string }[]
}

export type MasterPlayer = {
  userId:    string
  username:  string | null
  avatar:    string | null
  email:     string | null
  character: MasterCharacter | null
}