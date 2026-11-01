export const GRIMOIRE_ELEMENTS = ["luz", "vento", "fogo", "trevas", "terra", "agua"] as const
export type GrimoireElement = (typeof GRIMOIRE_ELEMENTS)[number]

export const AFFINITY_STAGES = [
  "Despertar",
  "Sintonia",
  "Domínio",
  "Maestria",
  "Transcendência",
] as const

export type GrimoireRitual = {
  id: string
  catalogOrder: number
  degree: number
  sourceIdOrPair: string | null
  elementText: string
  elements: string[]
  categoryOrVariant: string | null
  anchor: string | null
  anchorVariant: string | null
  secondary: string | null
  secondaryVariant: string | null
  name: string
  effect: string | null
  pmBase: string | null
  difficulty: string | null
  difficultyModifier: string | null
  affinityXpModifier: string | null
  domainXpMax: number | null
  grade4ResultElement: string | null
  sigilForm: string | null
  masteryXp: number
  learnedAt: string
  overrides?: Record<string, string | number | null> | null
}

export type GrimoireAffinity = {
  id: string
  element: string
  stage: number
  stageXp: number
  source: string
  racialRank: string | null
}

export type GrimoireCharacter = {
  id: string
  name: string
  race: string
  rank: string
  element: string
  affinities: GrimoireAffinity[]
  rituals: GrimoireRitual[]
}

export type GrimoireCatalogItem = Omit<GrimoireRitual, "masteryXp" | "learnedAt"> & {
  sourceRow: number
}

export type GrimoireData = {
  hasCampaign: boolean
  isMaster: boolean
  campaignId: string | null
  characters: { id: string; name: string; race: string; rank: string; category: string; element: string }[]
  character: GrimoireCharacter | null
  catalogCount: number
  elementOptions: string[]
  catalog: GrimoireCatalogItem[]
  config: {
    stageTransitionRule: string | null
    affinitySuccessXpByDegree: Record<string, number>
    affinityPracticeXpByDegree: Record<string, number>
    affinityStudyXpByDegree: Record<string, number> | null
    domainSuccessXpByRitual: Record<string, number>
    domainPracticeXpByRitual: Record<string, number>
    difficultyModifiers: Record<string, number> | null
    repetitionDiminishingRule: Record<string, number> | null
  }
}
