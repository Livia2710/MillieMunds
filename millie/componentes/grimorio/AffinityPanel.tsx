import Image from 'next/image'
import type { GrimoireAffinity } from '@/lib/types/grimoire'
import { AFFINITY_STAGES } from '@/lib/types/grimoire'

const ELEMENT_NAMES: Record<string, string> = { luz: 'Luz', vento: 'Vento', fogo: 'Fogo', trevas: 'Trevas', terra: 'Terra', agua: 'Água' }
const ELEMENT_COLORS: Record<string, string> = { luz: 'text-amber-200', vento: 'text-emerald-200', fogo: 'text-orange-200', trevas: 'text-fuchsia-200', terra: 'text-yellow-100', agua: 'text-cyan-200' }
const ELEMENT_BAR_COLORS: Record<string, string> = { luz: 'bg-amber-300', vento: 'bg-emerald-300', fogo: 'bg-orange-400', trevas: 'bg-fuchsia-400', terra: 'bg-yellow-300', agua: 'bg-cyan-300' }
const ELEMENT_ICONS: Record<string, string> = {
  luz: '/assets/svgs/elemento/luz.svg',
  vento: '/assets/svgs/elemento/vento.svg',
  fogo: '/assets/svgs/elemento/fogo.svg',
  trevas: '/assets/svgs/elemento/trevas.svg',
  terra: '/assets/svgs/elemento/terra.svg',
  agua: '/assets/svgs/elemento/agua.svg',
}
const normalizeElement = (element: string) => element.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()

export function AffinityPanel({ affinities }: { affinities: GrimoireAffinity[] }) {
  return <details open className="relative self-start overflow-hidden rounded-xl border border-bege-medio/30 bg-roxo-escuro/75 p-7 2xl:sticky 2xl:top-24">
    <summary className="relative z-10 mb-4 cursor-pointer list-none border-b border-bege-medio/25 pb-3 font-title text-xl">Afinidades</summary>
    <Image src="/assets/svgs/corner-left-top.svg" alt="" aria-hidden width={100} height={100} className="pointer-events-none absolute left-0 top-0 z-0 h-14 w-14 opacity-80 md:h-19 md:w-19" />
    <Image src="/assets/svgs/corner-right-top.svg" alt="" aria-hidden width={100} height={100} className="pointer-events-none absolute right-0 top-0 z-0 h-14 w-14 opacity-80 md:h-19 md:w-19" />
    <Image src="/assets/svgs/corner-left-bottom.svg" alt="" aria-hidden width={100} height={100} className="pointer-events-none absolute bottom-0 left-0 z-0 h-14 w-14 opacity-80 md:h-19 md:w-19" />
    <Image src="/assets/svgs/corner-right-bottom.svg" alt="" aria-hidden width={100} height={100} className="pointer-events-none absolute bottom-0 right-0 z-0 h-14 w-14 opacity-80 md:h-19 md:w-19" />
    {affinities.length === 0 ? <p className="relative z-10 text-sm text-bege-medio/75">Nenhuma afinidade registrada ainda.</p> : <ul className="relative z-10 space-y-3">
      {affinities.map(affinity => {
        const elementKey = normalizeElement(affinity.element)
        const icon = ELEMENT_ICONS[elementKey]
        const progress = Math.min(100, Math.max(0, affinity.stageXp / 10))
        const level = Math.min(10, Math.floor(Math.max(0, affinity.stageXp) / 100) || 1)
        return <li key={affinity.id} className="rounded-lg bg-[#24162d]/75 px-3 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-1">
<div className="flex items-center gap-2">
 
  {icon && <Image src={icon} alt="" width={28} height={28} className="object-contain" />}

  <span className={`font-title text-lg ${ELEMENT_COLORS[elementKey] ?? 'text-bege-claro'}`}>
    {ELEMENT_NAMES[elementKey] ?? affinity.element}
  </span>
</div>
            <span className="text-[10px] uppercase tracking-widest text-bege-medio">{AFFINITY_STAGES[affinity.stage - 1] ?? 'Estágio não definido'}</span></div>
          <p className="mt-1 text-xs text-bege-claro/65">Nível {level} · Rank racial {affinity.racialRank ?? '—'}</p>
          <div className="mt-2 flex justify-between gap-2 text-[11px] text-bege-medio"><span>{Math.max(0, affinity.stageXp)} / 1.000 XP</span><span>{Math.max(0, 1_000 - affinity.stageXp)} para avançar</span></div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/40"><div className={`h-full rounded-full ${ELEMENT_BAR_COLORS[elementKey] ?? 'bg-bege-medio'}`} style={{ width: `${progress}%` }}/></div>
        </li>
      })}
    </ul>}
  </details>
}
