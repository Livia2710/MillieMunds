'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import type { GrimoireRitual } from '@/lib/types/grimoire'
import { RitualCard } from './RitualCard'
import { EmptyNotice } from './EmptyNotice'

const normalize = (value: string) => value.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '')

export function RitualCollection({ rituals, catalogCount, elementOptions, selectedId, onSelect, onSelectionResolved }: {
  rituals: GrimoireRitual[]
  catalogCount: number
  elementOptions: string[]
  selectedId: string
  onSelect: (id: string) => void
  onSelectionResolved: (id: string) => void
}) {
  const [degree, setDegree] = useState<number | null>(null)
  const [element, setElement] = useState('')
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => rituals.filter(ritual =>
    (degree === null || ritual.degree === degree) &&
    (!element || ritual.elements.some(item => normalize(item) === normalize(element)) || normalize(ritual.grade4ResultElement ?? '') === normalize(element)) &&
    normalize(ritual.name).includes(normalize(query))), [rituals, degree, element, query])
  const selected = filtered.find(ritual => ritual.id === selectedId) ?? filtered[0] ?? null

  useEffect(() => {
    const resolvedId = selected?.id ?? ''
    if (resolvedId !== selectedId) onSelectionResolved(resolvedId)
  }, [selected?.id, selectedId, onSelectionResolved])

  return <section className="min-w-0 rounded-xl border border-bege-medio/30 bg-[#1c1125]/90">
    <header className="border-b border-bege-medio/20 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 className="font-title text-xl">Coleção de Rituais</h2><span className="text-sm text-bege-medio">Aprendidos: {rituals.length} / {catalogCount}</span></div>
      <div className="mt-4 flex flex-wrap gap-2">{[null, 1, 2, 3, 4].map(value => <button key={String(value)} type="button" onClick={() => setDegree(value)} className={`rounded-full border px-3 py-1 text-xs ${degree === value ? 'border-bege-medio bg-bege-medio text-roxo-escuro' : 'border-bege-medio/25 text-bege-claro/75 hover:border-bege-medio/60'}`}>{value === null ? 'Todos' : `Grau ${value}`}</button>)}
        <select aria-label="Filtrar por elemento" value={element} onChange={event => setElement(event.target.value)} className="ml-auto min-w-36 rounded border border-bege-medio/25 bg-roxo-escuro px-2 py-1 text-xs"><option value="">Todos os elementos</option>{elementOptions.map(item => <option key={item} value={item}>{item}</option>)}</select>
      </div>
      <label className="mt-3 flex items-center gap-2 rounded border border-bege-medio/20 bg-roxo-escuro/80 px-3"><Search size={15} className="text-bege-medio"/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar ritual" className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-bege-claro/35"/></label>
    </header>
    {rituals.length === 0 ? <EmptyNotice title="Seu grimório está vazio" text="Nenhum ritual foi aprendido ainda. Quando o Mestre registrar um aprendizado, as cartas aparecerão aqui."/> : filtered.length === 0 ? <p className="p-8 text-center text-sm text-bege-medio">Nenhum ritual corresponde aos filtros.</p> : <div className="grid max-h-[calc(100vh-270px)] grid-cols-2 gap-3 overflow-y-auto p-4 sm:grid-cols-3 2xl:grid-cols-4">{filtered.map(ritual => <RitualCard key={ritual.id} ritual={ritual} selected={ritual.id === selected?.id} onClick={() => onSelect(ritual.id)}/>)}</div>}
  </section>
}
