// ─── RANK POR NÍVEL ───────────────────────────────────────
// Segue o livro base: D=1-49 | C=50-99 | B=100-149 | A=150-199 | S=200+

export function calcRankByLevel(level: number): string {
  if (level >= 200) return 'S'
  if (level >= 150) return 'A'
  if (level >= 100) return 'B'
  if (level >= 50)  return 'C'
  return 'D'
}

// ─── MULTIPLICADORES DE ATRIBUTO POR RANK ────────────────

export function getRankMultiplier(rank: string): number {
  const map: Record<string, number> = {
    E: 1,
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

// ─── PV / PM ─────────────────────────────────────────────

export function calcPV(vigor: number): number {
  return 10 + vigor * 2
}

export function calcPM(inteligencia: number): number {
  return 10 + inteligencia * 2
}

// ─── SISTEMA DE XP ───────────────────────────────────────
// O custo de XP por nível segue o birthRank da raça ATUAL do personagem.
// Quando o personagem evolui de raça, o custo muda imediatamente para o
// birthRank da nova raça.
//
// Tabela de custo por nível:
//   E → 1.500 XP/nível
//   D → 1.000 XP/nível
//   C →   700 XP/nível
//   B →   450 XP/nível
//   A →   250 XP/nível
//   S →   100 XP/nível

const XP_PER_LEVEL: Record<string, number> = {
  E: 1500,
  D: 1000,
  C: 700,
  B: 450,
  A: 250,
  S: 100,
}

/**
 * Retorna o XP necessário para subir UM nível, dado o birthRank atual.
 */
export function calcXpToNextLevel(birthRank: string): number {
  return XP_PER_LEVEL[birthRank] ?? 1000
}

/**
 * Retorna o XP total acumulado necessário para atingir determinado nível,
 * dado o birthRank atual. Útil para exibir progresso no perfil.
 * Exemplo: calcXpForLevel(3, 'D') = 2000 (2 níveis × 1000 XP)
 */
export function calcXpForLevel(level: number, birthRank: string): number {
  if (level <= 1) return 0
  return (level - 1) * calcXpToNextLevel(birthRank)
}

// ─── PRIMEIRO DESPERTAR DE HABILIDADE ────────────────────
// Define a partir de qual nível o personagem desperta sua primeira habilidade
// com base no birthRank de nascença (nunca muda, mesmo com evolução de raça).

const FIRST_SKILL_UNLOCK: Record<string, number> = {
  E: 15,
  D: 10,
  C: 5,
  B: 3,
  A: 2,
  S: 1,
}

/**
 * Retorna o nível mínimo para o primeiro despertar de habilidade.
 * Usa o birthRank ORIGINAL (de nascença), não o da raça evoluída.
 */
export function calcFirstSkillUnlock(birthRank: string): number {
  return FIRST_SKILL_UNLOCK[birthRank] ?? 10
}

/**
 * Verifica se o personagem já pode desbloquear sua primeira habilidade.
 */

export function canUnlockFirstSkill(level: number, birthRank: string): boolean {
  return level >= calcFirstSkillUnlock(birthRank)
}
// ─── USOS PARA EVOLUIR HABILIDADE ────────────────────────
// Escala por birthRank: raças com linhagem mais pura aprendem mais rápido.
// currentLevel = nível ATUAL da habilidade (0, 1, 2...)

const SKILL_USES_TABLE: Record<string, number[]> = {
  E: [60, 100, 150],
  D: [45,  75, 120],
  C: [30,  50,  80],
  B: [20,  35,  55],
  A: [12,  20,  35],
  S: [ 6,  10,  18],
}

/**
 * Retorna quantos usos são necessários para sair do currentLevel para o próximo.
 * Ex: calcSkillUsesRequired('D', 0) = 45 (para ir de nível 0 → 1)
 */
export function calcSkillUsesRequired(birthRank: string, currentLevel: number): number {
  const table = SKILL_USES_TABLE[birthRank] ?? SKILL_USES_TABLE['D']
  return table[currentLevel] ?? table[table.length - 1]
}