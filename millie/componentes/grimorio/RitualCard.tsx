import type { GrimoireRitual } from '@/lib/types/grimoire'
import { SigilArt } from './SigilArt'

const DEGREE_FRAME: Record<number, string> = { 1: 'border-bege-medio/55', 2: 'border-cyan-200/50', 3: 'border-amber-300/70', 4: 'border-fuchsia-300/70 shadow-[0_0_22px_rgba(232,170,255,.15)]' }
const ritualState = (ritual: GrimoireRitual) => ritual.domainXpMax !== null && ritual.masteryXp >= ritual.domainXpMax ? 'Dominado' : ritual.masteryXp > 0 ? 'Em progresso' : 'Aprendido'

export function RitualCard({ ritual, selected, onClick }: { ritual: GrimoireRitual; selected: boolean; onClick: () => void }) {
  const state = ritualState(ritual)
  return <button type="button" onClick={onClick} className={`relative flex min-h-[242px] flex-col rounded-lg border-2 bg-[linear-gradient(145deg,#34223e,#1a1022)] p-2 text-left transition hover:-translate-y-0.5 hover:shadow-[0_0_18px_rgba(209,186,142,.2)] ${DEGREE_FRAME[ritual.degree] ?? 'border-bege-medio/35'} ${selected ? 'ring-2 ring-bege-medio shadow-[0_0_16px_rgba(209,186,142,.24)]' : ''}`}>
    <span className="text-center font-title text-[10px] uppercase tracking-[.18em] text-bege-medio">Grau {ritual.degree}</span>
    <div className="my-2 flex-1"><SigilArt ritual={ritual}/></div>
    <span className="line-clamp-2 text-center font-title text-sm">{ritual.name}</span>
    <span className="mt-1 text-center text-[10px] text-bege-claro/65">{ritual.elementText}</span>
    <span className={`mt-2 text-center text-[9px] uppercase tracking-widest ${state === 'Dominado' ? 'text-amber-200' : state === 'Em progresso' ? 'text-cyan-200' : 'text-bege-medio/70'}`}>{state === 'Dominado' ? '✦ Dominado' : state}</span>
  </button>
}
