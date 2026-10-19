"use client"

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState } from 'react'
import { Compass, Search, Sparkles } from 'lucide-react'

type Skill = { id: string; name: string; visibility: string }
type Race = { id: string; name: string; element: string; baseRank: string; visibility: string; skills: Skill[] }
type World = { id: string; name: string; visibility: string; races: Race[] }
type Universe = { id: string; name: string; artworkUrl: string | null; kind: string; visibility: string; worlds: World[] }

export default function AtlasSidebar({ universes, isMaster, selectedUniverseId, onCreateUniverse, onSelectUniverse, onSelectEntity, onVisibleUniversesChange }: {
  universes: Universe[]
  isMaster: boolean
  selectedUniverseId: string
  onCreateUniverse: () => void
  onSelectUniverse: (id: string) => void
  onSelectEntity: (id: string) => void
  onVisibleUniversesChange: (ids: string[]) => void
}) {
  const [query, setQuery] = useState('')
  const [filterUniverse, setFilterUniverse] = useState('')
  const [filterWorld, setFilterWorld] = useState('')
  const [filterRace, setFilterRace] = useState('')
  const [filterSkill, setFilterSkill] = useState('')
  const [filterElement, setFilterElement] = useState('')
  const [filterRank, setFilterRank] = useState('')
  const [filterVisibility, setFilterVisibility] = useState('')

  const entities = useMemo(() => universes.flatMap((universe) => [universe, ...universe.worlds, ...universe.worlds.flatMap((world) => world.races)]), [universes])
  const searchResults = query.trim() ? entities.filter((item) => item.name.toLocaleLowerCase('pt-BR').includes(query.trim().toLocaleLowerCase('pt-BR'))).slice(0, 12) : []
  const mapUniverses = useMemo(() => universes.filter((universe) => universe.kind !== 'origin').filter((universe) => {
    const nested = universe.worlds.flatMap((world) => [world, ...world.races, ...world.races.flatMap((race) => race.skills)])
    const matchesQuery = !query.trim() || [universe, ...nested].some((entry) => entry.name.toLocaleLowerCase('pt-BR').includes(query.trim().toLocaleLowerCase('pt-BR')))
    const races = universe.worlds.flatMap((world) => world.races)
    return matchesQuery && (!filterUniverse || universe.id === filterUniverse) && (!filterWorld || universe.worlds.some((world) => world.id === filterWorld)) && (!filterRace || races.some((race) => race.id === filterRace)) && (!filterSkill || races.some((race) => race.skills.some((skill) => skill.id === filterSkill))) && (!filterElement || races.some((race) => race.element === filterElement)) && (!filterRank || races.some((race) => race.baseRank === filterRank)) && (!filterVisibility || [universe, ...nested].some((item) => item.visibility === filterVisibility))
  }), [universes, query, filterUniverse, filterWorld, filterRace, filterSkill, filterElement, filterRank, filterVisibility])

  useEffect(() => { onVisibleUniversesChange(mapUniverses.map((item) => item.id)) }, [mapUniverses, onVisibleUniversesChange])

  const option = (id: string, label: string): [string, string] => [id, label]
  const filterGroups: { label: string; value: string; onChange: (value: string) => void; options: [string, string][] }[] = [
    { label: 'Universo', value: filterUniverse, onChange: setFilterUniverse, options: universes.map((item) => option(item.id, item.name)) },
    { label: 'Mundo', value: filterWorld, onChange: setFilterWorld, options: universes.flatMap((item) => item.worlds.map((world) => option(world.id, world.name))) },
    { label: 'Raça', value: filterRace, onChange: setFilterRace, options: universes.flatMap((item) => item.worlds.flatMap((world) => world.races.map((race) => option(race.id, race.name)))) },
    { label: 'Habilidade inata', value: filterSkill, onChange: setFilterSkill, options: universes.flatMap((item) => item.worlds.flatMap((world) => world.races.flatMap((race) => race.skills.map((skill) => option(skill.id, skill.name))))) },
    { label: 'Elemento', value: filterElement, onChange: setFilterElement, options: [...new Set(universes.flatMap((item) => item.worlds.flatMap((world) => world.races.map((race) => race.element))))].map((element) => option(element, element)) },
    { label: 'Rank', value: filterRank, onChange: setFilterRank, options: [...new Set(universes.flatMap((item) => item.worlds.flatMap((world) => world.races.map((race) => race.baseRank))))].map((rank) => option(rank, `Rank ${rank}`)) },
    { label: 'Visibilidade', value: filterVisibility, onChange: setFilterVisibility, options: [option('PUBLIC', 'Público'), option('DISCOVERED', 'Descoberto'), option('MASTER_ONLY', 'Mestre')] },
  ]
  const orderedUniverses = [...universes].sort((a, b) => a.kind === 'origin' ? -1 : b.kind === 'origin' ? 1 : a.name.localeCompare(b.name, 'pt-BR'))

  return <aside className="relative flex min-h-full flex-col border-b border-bege-escuro/25 bg-[linear-gradient(180deg,rgba(26,15,34,.96),rgba(17,11,23,.98))] p-4 md:p-5 lg:max-h-[78vh] lg:overflow-y-auto lg:border-b-0 lg:border-r lg:p-6 scrollbar-none">
    <div className="mb-5 border-b border-bege-escuro/25 pb-5"><p className="font-title text-[10px] uppercase tracking-[.22em] text-bege-medio/60">Atlas das</p><h2 className="mt-1 font-title text-xl uppercase leading-tight tracking-[.12em] text-bege-claro">Mil Linhagens</h2><div className="my-4 h-px w-full bg-gradient-to-r from-bege-medio/60 via-bege-escuro/40 to-transparent"/><p className="font-title text-xs uppercase tracking-[.18em] text-bege-medio">Arquivo Cosmológico</p><p className="mt-2 text-xs leading-relaxed text-bege-medio/55">Universos, mundos, raças e habilidades reunidos em um só mapa.</p><div className="mt-4 space-y-1.5 text-[11px] text-bege-claro/65"><p>{universes.length} universos catalogados</p><p>{universes.reduce((total, item) => total + item.worlds.length, 0)} mundos mapeados</p><p>{universes.reduce((total, item) => total + item.worlds.reduce((worldTotal, world) => worldTotal + world.races.length, 0), 0)} linhagens registradas</p></div>{isMaster && <button onClick={onCreateUniverse} className="mt-4 w-full border border-bege-escuro/45 bg-roxo-escuro/40 px-3 py-2.5 font-title text-[10px] uppercase tracking-[.12em] text-bege-claro transition hover:border-bege-medio hover:bg-bege-escuro/10"><Sparkles size={14} className="mr-2 inline"/>Criar universo</button>}</div>

    <div className="mb-4"><h3 className="mb-3 font-title text-sm uppercase tracking-[.14em] text-bege-claro">Exploração</h3><p className="mb-3 text-[11px] leading-relaxed text-bege-medio/55">Busque e filtre as linhagens entre os mundos.</p><label className="flex items-center gap-2 border border-bege-escuro/45 bg-[#0d0812]/65 px-3 shadow-inner"><Search size={14} className="shrink-0 text-bege-medio/60"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar universo, mundo, raça…" className="h-10 min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-bege-medio/40"/></label></div>
    {query.trim() && <div className="mb-4 max-h-32 overflow-y-auto border border-bege-escuro/25">{searchResults.map((item) => <button key={item.id} onClick={() => onSelectEntity(item.id)} className="block w-full border-b border-bege-escuro/10 px-3 py-2 text-left text-xs text-bege-claro/80 hover:bg-white/5">{item.name}</button>)}{!searchResults.length && <p className="p-3 text-xs text-bege-medio/50">Nenhum resultado.</p>}</div>}

    <div className="mb-5"><h3 className="mb-3 font-title text-[10px] uppercase tracking-[.18em] text-bege-medio">Refinar busca</h3><div className="space-y-1.5">{filterGroups.map(({ label, value, onChange, options }) => <details key={label} className="group border border-bege-escuro/25 bg-black/[.08]"><summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-xs text-bege-claro/85"><span>{label}</span><span className="text-bege-medio/55">⌄</span></summary><select value={value} onChange={(event) => onChange(event.target.value)} className="m-2 w-[calc(100%-1rem)] border border-bege-escuro/30 bg-[#1b1121] px-2 py-2 text-xs text-bege-claro outline-none"><option value="">Todos</option>{options.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></details>)}</div></div>

    <h3 className="mb-3 font-title text-[10px] uppercase tracking-[.18em] text-bege-medio">Universos</h3><div className="max-h-[34vh] space-y-1 overflow-y-auto pr-1 lg:flex-1">{orderedUniverses.map((item) => <button key={item.id} onClick={() => onSelectUniverse(item.id)} className={`flex w-full items-center gap-2 border px-2 py-2 text-left transition ${item.id === selectedUniverseId ? 'border-bege-medio/45 bg-bege-escuro/10' : 'border-bege-escuro/15 hover:border-bege-escuro/35 hover:bg-white/[.03]'}`}><span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-bege-escuro/35 bg-roxo-escuro">{item.artworkUrl ? <img src={item.artworkUrl} alt="" className="h-full w-full object-cover"/> : <span className="text-bege-medio">{item.kind === 'origin' ? <Sparkles size={14}/> : <Compass size={14}/>}</span>}</span><span className="min-w-0"><span className="block truncate font-title text-[10px] uppercase tracking-wide">{item.name}</span><span className="block truncate text-[9px] text-bege-medio/55">{item.kind === 'origin' ? 'O início. O elo. Tudo.' : `${item.worlds.length} mundos`}</span></span></button>)}</div>
  </aside>
}
