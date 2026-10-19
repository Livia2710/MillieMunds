"use client"

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, BookOpen, Feather, Pencil, Search, Sparkles } from 'lucide-react'

type Skill = { id: string; name: string; description: string; branch: string; maxLevel: number; element: string; visibility: string }
type Race = { id: string; name: string; element: string; baseRank: string; description: string | null; image: string | null; appearance: string; biology: string; culture: string; masterNotes: string; visibility: string; canAscend: boolean; canCorrupt: boolean; skills: Skill[] }
type World = { id: string; name: string; description: string; imageUrl: string | null; visibility: string; races: Race[] }
type Universe = { id: string; name: string; artworkUrl: string | null; kind: string; worlds: World[] }
type Section = 'worlds' | 'races' | 'skills'

const elementNames: Record<string, string> = { agua: 'Água', fogo: 'Fogo', terra: 'Terra', vento: 'Vento', luz: 'Luz', trevas: 'Trevas' }
const elementPath = (element: string) => `/assets/svgs/elemento/${element.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}.svg`

function MiniElement({ element }: { element: string }) {
  const name = elementNames[element.toLowerCase()] ?? element
  return <span title={name} className="inline-flex items-center gap-1 rounded border border-bege-escuro/25 bg-black/15 px-1.5 py-1 text-[9px] uppercase tracking-wide text-bege-claro/80"><img src={elementPath(element)} alt="" className="h-4 w-4 object-contain"/>{name}</span>
}

function MiniRank({ rank }: { rank: string }) {
  return <span className="inline-flex items-center gap-1 rounded border border-bege-escuro/25 bg-black/15 px-1.5 py-1 text-[9px] uppercase tracking-wide text-bege-claro/80"><img src={`/assets/svgs/rank/${rank.toUpperCase()}.svg`} alt="" className="h-5 w-4 object-contain"/>Rank {rank.toUpperCase()}</span>
}

export default function AtlasLibraryView({ section, universes, isMaster, onSelectWorld, onSelectRace, onEditWorld, onEditRace, initialWorldId }: {
  section: Section
  universes: Universe[]
  isMaster: boolean
  onSelectWorld: (universeId: string, worldId: string) => void
  onSelectRace: (universeId: string, worldId: string, raceId: string) => void
  onEditWorld: (world: World) => void
  onEditRace: (race: Race) => void
  initialWorldId?: string
}) {
  const [query, setQuery] = useState('')
  const [universeId, setUniverseId] = useState('')
  const [worldId, setWorldId] = useState(initialWorldId ?? '')
  const [activeBranch, setActiveBranch] = useState('')
  const [selectedSkill, setSelectedSkill] = useState('')

  useEffect(() => {
    setQuery('')
    setUniverseId('')
    setWorldId(initialWorldId ?? '')
    setActiveBranch('')
    setSelectedSkill('')
  }, [section, initialWorldId])

  const worlds = useMemo(() => universes.flatMap((universe) => universe.worlds.map((world) => ({ universe, world }))), [universes])
  const races = useMemo(() => worlds.flatMap(({ universe, world }) => world.races.map((race) => ({ universe, world, race }))), [worlds])
  const skills = useMemo(() => races.flatMap(({ universe, world, race }) => race.skills.map((skill) => ({ universe, world, race, skill }))), [races])
  const queryKey = query.trim().toLocaleLowerCase('pt-BR')
  const filteredWorlds = worlds.filter(({ universe, world }) => (!universeId || universe.id === universeId) && (!queryKey || `${universe.name} ${world.name} ${world.description}`.toLocaleLowerCase('pt-BR').includes(queryKey)))
  const filteredRaces = races.filter(({ universe, world, race }) => (!universeId || universe.id === universeId) && (!worldId || world.id === worldId) && (!queryKey || `${universe.name} ${world.name} ${race.name} ${race.element} ${race.baseRank} ${race.description ?? ''}`.toLocaleLowerCase('pt-BR').includes(queryKey)))
  const branches = [...new Set(skills.map(({ skill }) => skill.branch).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
  const filteredSkills = skills.filter(({ universe, world, race, skill }) => (!universeId || universe.id === universeId) && (!worldId || world.id === worldId) && (!activeBranch || skill.branch === activeBranch) && (!queryKey || `${universe.name} ${world.name} ${race.name} ${skill.name} ${skill.branch} ${skill.element} ${skill.description}`.toLocaleLowerCase('pt-BR').includes(queryKey)))

  const title = section === 'worlds' ? 'Mundos' : section === 'races' ? 'Raças' : 'Habilidades inatas'
  const subtitle = section === 'worlds' ? 'Cada universo abriga mundos únicos, com suas próprias leis, ecossistemas e histórias.' : section === 'races' ? 'Linhagens que habitam os mundos e carregam o potencial de seus universos.' : 'Poderes naturais que emergem da essência de cada linhagem.'
  const filterBar = <div className="mb-5 flex flex-wrap items-center gap-2">
    <label className="flex h-10 min-w-[210px] flex-1 items-center gap-2 border border-bege-escuro/35 bg-black/15 px-3 text-bege-claro/65"><Search size={14}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Buscar ${section === 'worlds' ? 'mundo' : section === 'races' ? 'raça' : 'habilidade'}…`} className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-bege-claro/45"/></label>
    {section !== 'skills' && <select aria-label="Filtrar por universo" value={universeId} onChange={(event) => { setUniverseId(event.target.value); setWorldId('') }} className="h-10 max-w-48 border border-bege-escuro/35 bg-[#1b1121] px-3 text-xs text-bege-claro outline-none"><option value="">Todos os universos</option>{universes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>}
    {(section === 'races' || section === 'skills') && <select aria-label="Filtrar por mundo" value={worldId} onChange={(event) => setWorldId(event.target.value)} className="h-10 max-w-48 border border-bege-escuro/35 bg-[#1b1121] px-3 text-xs text-bege-claro outline-none"><option value="">Todos os mundos</option>{worlds.filter(({ universe }) => !universeId || universe.id === universeId).map(({ world }) => <option key={world.id} value={world.id}>{world.name}</option>)}</select>}
  </div>

  if (section === 'skills') return <section className="relative flex min-h-[520px] flex-1 flex-col overflow-hidden border border-[#8c7048] bg-[#dfc99d] text-[#3e2c1c] shadow-[inset_0_0_70px_rgba(112,77,38,.12),0_14px_45px_rgba(0,0,0,.2)]">
    <div className="relative z-10 border-b border-[#80633d]/35 px-5 py-5 md:px-7"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="font-title text-[10px] uppercase tracking-[.2em] text-[#80633d]">Arquivo de linhagens</p><h2 className="mt-1 font-title text-2xl uppercase tracking-[.12em] text-[#3f2d1c]">{title}</h2><p className="mt-1 max-w-2xl text-xs text-[#604a32]/75">{subtitle}</p></div><span className="font-title text-xs uppercase tracking-widest text-[#80633d]">{filteredSkills.length} registro(s)</span></div></div>
    <div className="relative z-10 flex min-h-0 flex-1 flex-col lg:flex-row">
      <aside className="border-b border-[#80633d]/30 bg-[#cbb487]/35 p-3 lg:w-48 lg:shrink-0 lg:border-b-0 lg:border-r lg:p-4"><button onClick={() => setActiveBranch('')} className={`mb-1 flex w-full items-center gap-2 px-3 py-2 text-left font-title text-xs uppercase transition ${!activeBranch ? 'bg-[#8c7048]/20 text-[#382719]' : 'text-[#604a32] hover:bg-[#8c7048]/10'}`}><Sparkles size={14}/>Geral</button>{branches.map((branch) => <button key={branch} onClick={() => setActiveBranch(branch)} className={`mb-1 flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition ${activeBranch === branch ? 'bg-[#8c7048]/20 font-semibold text-[#382719]' : 'text-[#604a32] hover:bg-[#8c7048]/10'}`}><Feather size={13}/>{branch}</button>)}</aside>
      <div className="min-w-0 flex-1 p-4 md:p-6">{filterBar}<div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_180px]">
        <div className="space-y-3">{filteredSkills.map(({ universe, world, race, skill }) => <article key={skill.id} className="flex gap-3 border border-[#94764b]/45 bg-[#f1dfb7]/65 p-3 shadow-[0_3px_10px_rgba(83,56,27,.10)] md:gap-4 md:p-4"><div className="flex h-[72px] w-[62px] shrink-0 items-center justify-center border border-[#94764b]/35 bg-[#c7ad7e]/40 md:h-[82px] md:w-[72px]"><img src={elementPath(skill.element)} alt="" className="h-11 w-11 object-contain opacity-90" onError={(event) => { event.currentTarget.style.display = 'none' }}/><Sparkles size={30} className="hidden text-[#725b38]"/></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-title text-sm uppercase tracking-wide text-[#3d2b1a] md:text-base">{skill.name}</h3><p className="mt-1 text-[10px] uppercase tracking-wider text-[#745a37]">{skill.branch} · {skill.element} · {skill.maxLevel} nível(is)</p></div><button onClick={() => setSelectedSkill((current) => current === skill.id ? '' : skill.id)} className="shrink-0 border border-[#94764b]/45 px-2.5 py-1.5 text-[10px] uppercase tracking-wide text-[#4d3924] transition hover:bg-[#8c7048]/15">{selectedSkill === skill.id ? 'Fechar' : 'Ver detalhes'} <ArrowRight size={12} className="ml-1 inline"/></button></div><p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#51402d]/85">{skill.description || 'Descrição ainda não registrada.'}</p>{selectedSkill === skill.id && <div className="mt-3 border-t border-[#94764b]/30 pt-2 text-xs text-[#51402d]"><p><strong>Linhagem:</strong> {race.name} · {world.name} · {universe.name}</p><p className="mt-1">{skill.description || 'Esta habilidade ainda precisa de uma descrição.'}</p><button onClick={() => onSelectRace(universe.id, world.id, race.id)} className="mt-2 underline decoration-[#94764b]/60 underline-offset-2">Abrir linhagem</button></div>}</div></article>)}{!filteredSkills.length && <p className="border border-dashed border-[#94764b]/50 p-8 text-center text-sm text-[#604a32]/75">Nenhuma habilidade encontrada com esses filtros.</p>}</div>
        <aside className="hidden border-l border-[#94764b]/30 pl-4 text-center text-[#6e5738] xl:block"><div className="flex h-28 items-center justify-center opacity-50"><BookOpen size={70} strokeWidth={.8}/></div><p className="mt-3 font-title text-sm italic leading-relaxed">“Cada linhagem carrega uma chama. Algumas são vistas, outras apenas sentidas.”</p><span className="mx-auto mt-4 block h-px w-16 bg-[#94764b]/50"/></aside>
      </div></div></div>
  </section>

  return <section className="flex min-h-[520px] flex-1 flex-col">
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="font-title text-[10px] uppercase tracking-[.2em] text-bege-medio/65">Atlas das linhagens</p><h2 className="mt-1 font-title text-2xl uppercase tracking-[.12em] md:text-3xl">{title}</h2><p className="mt-1 max-w-2xl text-xs text-bege-claro/60">{subtitle}</p></div><span className="font-title text-[10px] uppercase tracking-widest text-bege-medio/70">{section === 'worlds' ? filteredWorlds.length : filteredRaces.length} registro(s)</span></header>
    {filterBar}
    {section === 'worlds' && <div className="grid flex-1 content-start gap-4 sm:grid-cols-2 xl:grid-cols-3">{filteredWorlds.map(({ universe, world }) => { const incomplete = !world.imageUrl || !world.description; return <article key={world.id} className="group relative overflow-hidden border border-bege-escuro/45 bg-[#130d1a] shadow-[0_9px_25px_rgba(0,0,0,.2)] transition hover:-translate-y-0.5 hover:border-bege-medio/65 hover:shadow-[0_12px_32px_rgba(0,0,0,.33)]"><button onClick={() => onSelectWorld(universe.id, world.id)} className="block w-full text-left"><div className="relative h-36 overflow-hidden border-b border-bege-escuro/35 bg-[radial-gradient(circle_at_35%_35%,rgba(128,94,150,.55),rgba(24,15,31,.95))]">{world.imageUrl ? <img src={world.imageUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"/> : <div className="flex h-full items-center justify-center text-bege-medio/45"><BookOpen size={36} strokeWidth={1}/></div>}<span className="absolute left-3 top-3 border border-bege-medio/35 bg-[#130d1a]/85 px-2 py-1 font-title text-[9px] uppercase tracking-[.14em] text-bege-claro"><Sparkles size={11} className="mr-1 inline text-bege-medio"/>{universe.name}</span><span className="absolute bottom-2 right-3 text-bege-claro/80 drop-shadow"><ArrowRight size={16}/></span></div><div className="p-4"><h3 className="font-title text-base uppercase tracking-wider">{world.name}</h3><p className="mt-1 line-clamp-2 min-h-8 text-xs leading-relaxed text-bege-claro/60">{world.description || 'Uma região à espera de sua história.'}</p><div className="mt-3 flex items-center justify-between gap-2"><span className="text-[10px] uppercase tracking-wider text-bege-medio/70">{world.races.length} linhagem(ns)</span><span className="flex gap-1">{[...new Set(world.races.map((race) => race.element))].slice(0, 4).map((element) => <img key={element} title={elementNames[element] ?? element} src={elementPath(element)} alt="" className="h-4 w-4 opacity-80"/>)}</span></div></div></button>{isMaster && <button aria-label={`Editar mundo ${world.name}`} title="Editar mundo" onClick={() => onEditWorld(world)} className={`absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center border border-bege-medio/35 bg-[#130d1a]/90 text-bege-medio transition hover:bg-bege-escuro/50 ${incomplete ? 'opacity-100' : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100'}`}><Pencil size={13}/></button>}</article> })}</div>}
    {section === 'races' && <div className="grid flex-1 content-start gap-4 sm:grid-cols-2 xl:grid-cols-3">{filteredRaces.map(({ universe, world, race }) => { const incomplete = !race.image || !race.description || !race.appearance || !race.biology || !race.culture; return <article key={race.id} className="group relative flex min-h-[190px] overflow-hidden border border-bege-escuro/45 bg-[linear-gradient(115deg,rgba(25,16,32,.98),rgba(44,29,51,.84))] shadow-[0_9px_25px_rgba(0,0,0,.2)] transition hover:-translate-y-0.5 hover:border-bege-medio/65"><button onClick={() => onSelectRace(universe.id, world.id, race.id)} className="flex min-h-[190px] min-w-0 flex-1 text-left"><span className="relative min-h-[190px] w-[36%] shrink-0 border-r border-bege-escuro/35 bg-[radial-gradient(circle_at_50%_35%,rgba(166,128,79,.3),rgba(20,13,27,.8))]">{race.image ? <img src={race.image} alt="" className="absolute inset-0 h-full w-full object-cover object-top"/> : <span className="flex h-full items-center justify-center text-bege-medio/45"><Feather size={38} strokeWidth={1}/></span>}<span className="absolute bottom-2 left-2 border border-bege-medio/35 bg-[#140d1b]/85 px-1.5 py-1 font-title text-[8px] uppercase tracking-wider text-bege-claro">{universe.name}</span></span><span className="flex min-w-0 flex-1 flex-col p-3 md:p-4"><span className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-bege-medio/65">{world.name}</span><span className="mt-1 font-title text-sm uppercase tracking-wide text-bege-claro md:text-base">{race.name}</span><span className="mt-2 flex flex-wrap gap-1"><MiniElement element={race.element}/><MiniRank rank={race.baseRank}/></span><span className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-bege-claro/55">{race.description || 'Descrição ainda não registrada.'}</span><span className="mt-auto flex items-center justify-between pt-3 text-[9px] uppercase tracking-wide text-bege-medio/65"><span>{race.skills.length} habilidade(s)</span><ArrowRight size={13}/></span></span></button>{isMaster && <button aria-label={`Editar raça ${race.name}`} title="Editar raça" onClick={() => onEditRace(race)} className={`absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center border border-bege-medio/35 bg-[#130d1a]/90 text-bege-medio transition hover:bg-bege-escuro/50 ${incomplete ? 'opacity-100' : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100'}`}><Pencil size={13}/></button>}</article> })}</div>}
    {!((section === 'worlds' && filteredWorlds.length) || (section === 'races' && filteredRaces.length)) && <p className="mt-2 border border-dashed border-bege-escuro/30 p-8 text-center text-sm text-bege-medio/65">{section === 'worlds' ? 'Nenhum mundo encontrado.' : 'Nenhuma raça encontrada.'}</p>}
    {section === 'worlds' && worlds.length === 0 && isMaster && <p className="mt-3 text-center text-xs text-bege-medio/60">Use o lápis de edição do universo para adicionar mundos.</p>}
  </section>
}
