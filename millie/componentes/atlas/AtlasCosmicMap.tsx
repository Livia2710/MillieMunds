"use client"

/* eslint-disable @next/next/no-img-element */
import { useState } from 'react'
import { Compass, Sparkles } from 'lucide-react'

type Universe = { id: string; name: string; artworkUrl: string | null; kind: string }
const accents = ['#c9a4ff', '#91d9ff', '#edb1d3', '#8fe0c3', '#f0c27b', '#b8a8ff']
const accentFor = (id: string) => accents[[...id].reduce((total, character) => total + character.charCodeAt(0), 0) % accents.length]

export default function AtlasCosmicMap({ universes, isMaster, originUniverseId, onSelectUniverse, onCreateUniverse }: {
  universes: Universe[]
  isMaster: boolean
  originUniverseId?: string
  onSelectUniverse: (id: string) => void
  onCreateUniverse: () => void
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const focusedId = hoveredId ?? selectedId
  const selectedUniverse = universes.find((item) => item.id === selectedId)
  const primordialSelected = selectedId === 'primordial'

  return <div className="relative flex min-h-[560px] flex-1 items-center justify-center overflow-hidden border border-bege-escuro/15 bg-[radial-gradient(ellipse_at_center,rgba(92,61,112,.22),rgba(26,15,34,.12)_44%,transparent_72%)] py-12 md:min-h-[700px]">
    <div aria-hidden className="atlas-cosmic-dust pointer-events-none absolute inset-0" />
    <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[min(92%,760px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-bege-medio/15 shadow-[0_0_80px_rgba(158,110,73,.08)]" />
    <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[min(66%,540px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-bege-medio/20" />
    <div aria-hidden className="atlas-orbit-spin pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[min(82%,660px)] -translate-x-1/2 -translate-y-1/2 rounded-full border-r border-t border-bege-medio/35" />
    <div aria-hidden className={`pointer-events-none absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full bg-bege-medio/10 blur-3xl transition duration-700 ${primordialSelected ? 'scale-[2.2] opacity-100' : 'scale-100 opacity-70'}`} />

    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1] h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
      {universes.map((item, index) => {
        const angle = (index / Math.max(universes.length, 1)) * Math.PI * 2 - Math.PI / 2
        const x = 50 + Math.cos(angle) * 37
        const y = 50 + Math.sin(angle) * 37
        const active = primordialSelected || focusedId === item.id
        return <line key={item.id} x1="50" y1="50" x2={x} y2={y} stroke={active ? accentFor(item.id) : '#c8a773'} strokeWidth={active ? '0.32' : '0.12'} strokeOpacity={active ? '0.95' : '0.18'} className="transition-all duration-500" />
      })}
    </svg>

    <button type="button" aria-pressed={primordialSelected} aria-label="Selecionar núcleo Primordial" onMouseEnter={() => setHoveredId('primordial')} onMouseLeave={() => setHoveredId(null)} onFocus={() => setHoveredId('primordial')} onBlur={() => setHoveredId(null)} onClick={() => setSelectedId((current) => current === 'primordial' ? null : 'primordial')} className={`atlas-primordial-glow group relative z-10 flex h-32 w-32 flex-col items-center justify-center rounded-full border border-[#f2d58d] bg-[radial-gradient(circle_at_35%_30%,#fff3c8,#d9a943_46%,#74491d_78%,#f0d18b)] shadow-[0_0_58px_rgba(226,184,121,.5)] transition duration-500 hover:scale-110 ${primordialSelected ? 'scale-110 ring-8 ring-[#e8c477]/25 shadow-[0_0_90px_rgba(255,204,110,.9)]' : ''}`}>
      <span aria-hidden className={`atlas-primordial-ring pointer-events-none absolute -inset-3 rounded-full border border-[#efd28d]/60 transition duration-700 ${primordialSelected ? 'scale-125 border-[#ffe8aa] opacity-100' : 'opacity-70 group-hover:scale-110 group-hover:opacity-100'}`} />
      <span aria-hidden className={`pointer-events-none absolute -inset-6 rounded-full border border-[#efd28d]/20 transition duration-700 ${primordialSelected ? 'scale-125 opacity-100' : 'opacity-30 group-hover:scale-110 group-hover:opacity-70'}`} />
      <span className="relative font-title text-xs uppercase tracking-[0.16em] text-[#28180c]">Primordial</span><span className="relative mt-1 text-[9px] text-[#392514]/80">O início de tudo</span>
    </button>

    {universes.map((item, index) => {
      const angle = (index / Math.max(universes.length, 1)) * Math.PI * 2 - Math.PI / 2
      const x = 50 + Math.cos(angle) * 37
      const y = 50 + Math.sin(angle) * 37
      const selected = selectedId === item.id
      const accent = accentFor(item.id)
      const hasArtwork = Boolean(item.artworkUrl)
      return <button type="button" key={item.id} aria-pressed={selected} aria-label={`Selecionar universo ${item.name}`} onMouseEnter={() => setHoveredId(item.id)} onMouseLeave={() => setHoveredId(null)} onFocus={() => setHoveredId(item.id)} onBlur={() => setHoveredId(null)} onClick={() => setSelectedId((current) => current === item.id ? null : item.id)} style={{ left: `${x}%`, top: `${y}%`, '--nucleus-accent': accent } as React.CSSProperties} className={`atlas-nucleus group absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2 text-center transition duration-500 ${selected ? 'scale-110' : 'hover:scale-110'}`}>
        <span className={`atlas-nucleus-body relative flex items-center justify-center overflow-visible transition duration-500 ${hasArtwork ? 'h-[112px] w-[142px] bg-transparent md:h-[145px] md:w-[184px]' : `h-[76px] w-[76px] rounded-full border bg-roxo-escuro ring-4 ring-roxo-escuro/80 md:h-24 md:w-24 md:ring-[6px] ${selected ? 'border-bege-claro shadow-[0_0_48px_var(--nucleus-accent)] ring-bege-medio/30' : 'border-bege-medio/70 shadow-[0_0_24px_rgba(196,153,91,.20)] group-hover:border-bege-claro group-hover:shadow-[0_0_44px_var(--nucleus-accent)]'}`} ${selected && !hasArtwork ? 'scale-105' : ''}`}>
          {hasArtwork ? <><span aria-hidden className={`absolute inset-[20%] rounded-full bg-[var(--nucleus-accent)] blur-2xl transition duration-700 ${selected ? 'opacity-35 scale-125' : 'opacity-15 group-hover:opacity-30 group-hover:scale-110'}`} /><img src={item.artworkUrl!} alt="" className={`atlas-floating-art relative z-[1] h-full w-full object-contain transition duration-500 ${selected ? 'scale-110 brightness-110' : 'group-hover:scale-105 group-hover:brightness-110'}`} /></> : <>
            <span aria-hidden className={`atlas-nucleus-orbit pointer-events-none absolute -inset-2 rounded-full border border-dashed transition duration-500 ${selected ? 'scale-125 border-bege-claro/90 opacity-100' : 'border-bege-medio/35 opacity-40 group-hover:scale-110 group-hover:border-bege-claro/80 group-hover:opacity-100'}`} />
            <span aria-hidden className={`pointer-events-none absolute -inset-4 rounded-full border transition duration-700 ${selected ? 'scale-125 border-bege-medio/45 opacity-100' : 'border-bege-medio/15 opacity-30 group-hover:scale-110 group-hover:opacity-70'}`} />
            <span className="atlas-nucleus-image absolute inset-0 flex items-center justify-center overflow-hidden rounded-full">
              <span className="flex h-full w-full items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#4d345d,#160d20_72%)] text-bege-medio">{item.kind === 'multiversal' ? <Sparkles size={24} /> : <Compass size={24} />}</span>
            </span>
          </>}
        </span>
        <span className={`max-w-36 border bg-[#160e20]/90 px-3 py-1.5 font-title text-[10px] uppercase tracking-[0.13em] shadow-lg transition duration-300 md:text-xs ${selected ? 'border-bege-claro text-bege-claro' : 'border-bege-escuro/35 text-bege-claro group-hover:border-bege-medio/80 group-hover:text-white'}`}>{item.name}</span>
      </button>
    })}

    {selectedId && (selectedUniverse || primordialSelected) && <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 animate-[character-card-zoom_.2s_ease-out]">
      <button type="button" onClick={() => { if (selectedUniverse) onSelectUniverse(selectedUniverse.id); else if (originUniverseId) onSelectUniverse(originUniverseId) }} className="border border-bege-medio/70 bg-[#1b1025]/95 px-5 py-2.5 font-title text-[10px] uppercase tracking-[.15em] text-bege-claro shadow-[0_6px_28px_rgba(0,0,0,.45)] transition hover:border-bege-claro hover:bg-bege-escuro/40">Explorar {primordialSelected ? 'Primordial' : selectedUniverse?.name}</button>
    </div>}
    {isMaster && universes.length === 0 && <button className="absolute bottom-3 border border-bege-escuro/40 bg-roxo-escuro/70 px-4 py-2 font-title text-xs uppercase tracking-widest text-bege-claro" onClick={onCreateUniverse}>Criar primeiro universo</button>}
  </div>
}
