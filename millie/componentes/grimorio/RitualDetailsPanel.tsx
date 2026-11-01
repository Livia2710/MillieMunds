'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { Crown, Droplets, Gauge, Scale, Sparkles, X, type LucideIcon } from 'lucide-react'
import type { GrimoireAffinity, GrimoireRitual } from '@/lib/types/grimoire'
import { SigilArt } from './SigilArt'

const ELEMENT_NAMES: Record<string, string> = { luz: 'Luz', vento: 'Vento', fogo: 'Fogo', trevas: 'Trevas', terra: 'Terra', agua: 'Água' }
const ELEMENT_ICONS: Record<string, string> = {
  luz: '/assets/svgs/elemento/luz.svg',
  vento: '/assets/svgs/elemento/vento.svg',
  fogo: '/assets/svgs/elemento/fogo.svg',
  trevas: '/assets/svgs/elemento/trevas.svg',
  terra: '/assets/svgs/elemento/terra.svg',
  agua: '/assets/svgs/elemento/agua.svg',
}
const normalize = (value: string) => value.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
const fmt = (value: string | number | null | undefined) => value === null || value === undefined || value === '' ? 'Não definido' : String(value)
const ritualState = (ritual: GrimoireRitual) => ritual.domainXpMax !== null && ritual.masteryXp >= ritual.domainXpMax ? 'Dominado' : ritual.masteryXp > 0 ? 'Em progresso' : 'Aprendido'
export type ActivityKind = 'success' | 'practice' | 'study' | 'failure'

export function RitualDetailsPanel({ ritual, isMaster, affinities, activityElement, onActivityElementChange, onActivity, onClose, overlay = false, busy = false }: {
  ritual: GrimoireRitual | null
  isMaster: boolean
  affinities: GrimoireAffinity[]
  activityElement: string
  onActivityElementChange: (element: string) => void
  onActivity: (kind: ActivityKind, element?: string) => void
  onClose?: () => void
  overlay?: boolean
  busy?: boolean
}) {
  useEffect(() => {
    if (!overlay) return
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [overlay, onClose])

  const elements = ritual?.elements.map(element => ({ key: normalize(element), name: ELEMENT_NAMES[normalize(element)] ?? element, icon: ELEMENT_ICONS[normalize(element)] })).filter(element => element.icon) ?? []
  const progress = ritual?.domainXpMax ? Math.min(100, Math.max(0, ritual.masteryXp / ritual.domainXpMax * 100)) : 0
  const content = <aside data-frame="ornate" className={`relative isolate overflow-hidden rounded-xl border-[3px] border-double border-bege-medio/45 bg-[radial-gradient(ellipse_at_50%_36%,rgba(113,74,128,.23),transparent_45%),radial-gradient(circle_at_50%_52%,rgba(209,186,142,.07),transparent_64%),linear-gradient(155deg,#2b1c34,#1a0f22_55%,#130b19)] p-4 shadow-[0_0_24px_rgba(209,186,142,.08)] ${overlay ? 'max-h-[90vh] w-full max-w-lg overflow-y-auto shadow-2xl' : '2xl:sticky 2xl:top-24'}`}>
    <div aria-hidden="true" className="pointer-events-none absolute inset-2 z-0 border border-bege-medio/20" />
    <Image src="/assets/svgs/corner-left-top.svg" alt="" aria-hidden width={100} height={100} className="pointer-events-none absolute left-0 top-0 z-0 h-14 w-14 opacity-70 md:h-17 md:w-17" />
    <Image src="/assets/svgs/corner-right-top.svg" alt="" aria-hidden width={100} height={100} className="pointer-events-none absolute right-0 top-0 z-0 h-14 w-14 opacity-70 md:h-17 md:w-17" />
    <Image src="/assets/svgs/corner-left-bottom.svg" alt="" aria-hidden width={100} height={100} className="pointer-events-none absolute bottom-0 left-0 z-0 h-14 w-14 opacity-70 md:h-17 md:w-17" />
    <Image src="/assets/svgs/corner-right-bottom.svg" alt="" aria-hidden width={100} height={100} className="pointer-events-none absolute bottom-0 right-0 z-0 h-14 w-14 opacity-70 md:h-17 md:w-17" />

    {ritual ? <div className="relative z-10 space-y-4 px-2 py-2">
      <header className="relative pt-1 text-center">
        <div className="relative mx-5 border-y border-bege-medio/55 bg-[linear-gradient(90deg,transparent,rgba(209,186,142,.13)_18%,rgba(209,186,142,.13)_82%,transparent)] px-7 py-2.5 shadow-[0_0_14px_rgba(209,186,142,.08)]">
          <span aria-hidden="true" className="absolute -left-2 top-1/2 -translate-y-1/2 text-xs text-bege-medio">✦</span>
          <h2 className="font-title text-2xl leading-tight text-bege-claro">{ritual.name}</h2>
          <span aria-hidden="true" className="absolute -right-2 top-1/2 -translate-y-1/2 text-xs text-bege-medio">✦</span>
        </div>
        {onClose && <button type="button" className="absolute right-0 top-0 rounded-full border border-bege-medio/25 bg-roxo-escuro/70 p-1.5 text-bege-medio transition hover:border-bege-medio/60 hover:text-bege-claro 2xl:hidden" aria-label="Fechar detalhes" onClick={onClose}><X size={15}/></button>}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[10px] uppercase tracking-[.19em] text-bege-medio">
          <span>Grau {ritual.degree}</span><span aria-hidden="true" className="text-bege-medio/60">·</span>
          {elements.map((element, index) => <span key={`${element.key}-${index}`} className="inline-flex items-center gap-1">
            {index > 0 && <span aria-hidden="true" className="mr-1 text-bege-medio/60">+</span>}
            <Image src={element.icon!} alt="" aria-hidden width={17} height={17} className="object-contain"/>{element.name}
          </span>)}
          {elements.length === 0 && <span>{ritual.elementText}</span>}
        </div>
      </header>

      <div className="relative mx-auto my-1 flex aspect-square w-full max-w-[260px] items-center justify-center">
        <div aria-hidden="true" className="pointer-events-none absolute inset-[8%] rounded-full border border-bege-medio/20" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-[15%] rounded-full border border-bege-medio/15" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-[3%] rounded-full bg-[radial-gradient(circle,rgba(209,186,142,.1),transparent_68%)]" />
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[4%] h-[92%] w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-bege-medio/15 to-transparent" />
        <div aria-hidden="true" className="pointer-events-none absolute left-[4%] top-1/2 h-px w-[92%] -translate-y-1/2 bg-gradient-to-r from-transparent via-bege-medio/15 to-transparent" />
        <span aria-hidden="true" className="absolute left-1/2 top-[5%] -translate-x-1/2 text-[10px] text-bege-medio/70">✦</span>
        <span aria-hidden="true" className="absolute bottom-[5%] left-1/2 -translate-x-1/2 text-[10px] text-bege-medio/70">✧</span>
        <span aria-hidden="true" className="absolute left-[5%] top-1/2 -translate-y-1/2 text-[9px] text-bege-medio/60">✧</span>
        <span aria-hidden="true" className="absolute right-[5%] top-1/2 -translate-y-1/2 text-[9px] text-bege-medio/60">✧</span>
        <SigilArt ritual={ritual} large ornamental/>
      </div>

      <section>
        <OrnateHeading>Descrição</OrnateHeading>
        <p className="mx-auto mt-2 max-w-sm text-center text-sm leading-relaxed text-bege-claro/85">{fmt(ritual.effect)}</p>
      </section>

      <section className="rounded-lg border border-bege-medio/25 bg-black/15 p-3">
        <div className="grid grid-cols-2 gap-x-3 gap-y-3">
          <InfoItem icon={Droplets} label="Custo de PM" value={ritual.pmBase}/>
          <InfoItem icon={Gauge} label="Dificuldade" value={ritual.difficulty}/>
          <InfoItem icon={Scale} label="Mod. dificuldade" value={ritual.difficultyModifier}/>
          <InfoItem icon={Sparkles} label="Mod. XP afinidade" value={ritual.affinityXpModifier}/>
          <div className="col-span-2 border-t border-bege-medio/15 pt-3">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 text-bege-medio"><Crown size={14}/>Domínio · {ritualState(ritual)}</span>
              <span className="text-bege-claro">{ritual.domainXpMax === null ? `${ritual.masteryXp} XP` : `${ritual.masteryXp} / ${ritual.domainXpMax} XP`}</span>
            </div>
            {ritual.domainXpMax !== null && <>
              <div className="relative mt-2 h-2 overflow-hidden rounded-full border border-bege-medio/25 bg-black/50">
                <div className="h-full rounded-full bg-gradient-to-r from-bege-escuro via-bege-medio to-amber-100 shadow-[0_0_10px_rgba(209,186,142,.55)] transition-[width]" style={{ width: `${progress}%` }}/>
                <span aria-hidden="true" className="absolute right-0 top-1/2 -translate-y-1/2 text-[8px] text-bege-claro/80">✦</span>
              </div>
              <p className="mt-1 text-right text-[10px] text-bege-medio">{Math.max(0, ritual.domainXpMax - ritual.masteryXp)} XP restantes</p>
            </>}
          </div>
        </div>
      </section>

      {isMaster && <div className="space-y-2 border-t border-bege-medio/20 pt-3">
        <select aria-label="Afinidade que recebe XP" value={activityElement} onChange={event => onActivityElementChange(event.target.value)} className="w-full rounded border border-bege-medio/25 bg-roxo-escuro p-2 text-xs"><option value="">Afinidade que recebe XP</option>{affinities.map(affinity => <option key={affinity.id} value={affinity.element}>{ELEMENT_NAMES[normalize(affinity.element)] ?? affinity.element}</option>)}</select>
        <div className="flex flex-wrap justify-center gap-2">
          <ActivityButton busy={busy} disabled={!activityElement} onClick={() => onActivity('success', activityElement)}>Registrar sucesso</ActivityButton>
          <ActivityButton busy={busy} disabled={!activityElement} onClick={() => onActivity('practice', activityElement)}>Prática</ActivityButton>
          <ActivityButton busy={busy} disabled={!activityElement} onClick={() => onActivity('study', activityElement)}>Estudo</ActivityButton>
          <ActivityButton busy={busy} onClick={() => onActivity('failure')}>Falha</ActivityButton>
        </div>
      </div>}
    </div> : <p className="relative z-10 py-14 text-center text-sm text-bege-medio">Selecione uma carta para consultar seus detalhes.</p>}
  </aside>

  if (!overlay) return content
  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm 2xl:hidden" role="dialog" aria-modal="true" aria-label={ritual ? `Detalhes de ${ritual.name}` : 'Detalhes do ritual'} onMouseDown={event => { if (event.target === event.currentTarget) onClose?.() }}>{content}</div>
}

function OrnateHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="flex items-center justify-center gap-2 font-title text-xs uppercase tracking-[.2em] text-bege-medio">
    <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-transparent to-bege-medio/45"/><span aria-hidden="true" className="text-[9px]">✦</span>{children}<span aria-hidden="true" className="text-[9px]">✦</span><span aria-hidden="true" className="h-px flex-1 bg-gradient-to-l from-transparent to-bege-medio/45"/>
  </h3>
}

function InfoItem({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string | number | null | undefined }) {
  return <div className="flex min-w-0 items-start gap-2">
    <Icon size={14} className="mt-0.5 shrink-0 text-bege-medio"/>
    <div className="min-w-0"><dt className="text-[9px] uppercase tracking-wide text-bege-claro/50">{label}</dt><dd className="break-words text-xs text-bege-claro/90">{fmt(value)}</dd></div>
  </div>
}

function ActivityButton({ children, busy, disabled = false, onClick }: { children: React.ReactNode; busy: boolean; disabled?: boolean; onClick: () => void }) {
  return <button type="button" disabled={busy || disabled} onClick={onClick} className="rounded border border-bege-medio/30 px-2 py-1 text-[10px] text-bege-claro/80 transition hover:border-bege-medio/65 hover:text-bege-claro disabled:opacity-50">{children}</button>
}
