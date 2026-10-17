'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { Lock, Search, SlidersHorizontal, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getCharactersByActiveCampaign, unlockCharacter } from '@/app/actions/character'
import type { ProfileCharacter } from '@/lib/types/profile'
import CharacterFilters from '@/componentes/personagens/CharacterFilters'
import type { CategoryFilter, RankFilter, YearFilter } from '@/componentes/personagens/CharactersGrid'
import { useToast } from '@/componentes/ui/ToastProvider'

type DashboardChar = Pick<ProfileCharacter, 'id' | 'name' | 'category' | 'image' | 'portraitImage' | 'rank' | 'level' | 'isLocked'> & { year?: number; subject?: string; occupation?: string; dangerLevel?: string }
const ITEMS_PER_PAGE = 6

export default function MasterDashboard() {
  const [characters, setCharacters] = useState<DashboardChar[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('todos')
  const [rank, setRank] = useState<RankFilter>('todos')
  const [year, setYear] = useState<YearFilter>('todos')
  const [currentPage, setCurrentPage] = useState(1)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const toast = useToast()

  useEffect(() => {
    getCharactersByActiveCampaign()
      .then((data) => setCharacters(data.map(char => ({
        ...char,
        year: 'year' in char ? char.year : undefined,
        subject: 'subject' in char ? char.subject : undefined,
        occupation: 'occupation' in char ? char.occupation : undefined,
        dangerLevel: 'dangerLevel' in char ? char.dangerLevel : undefined,
      }))))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { setCurrentPage(1) }, [search, category, rank, year])
  useEffect(() => {
    document.body.style.overflow = mobileFiltersOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileFiltersOpen])

  const filtered = useMemo(() => characters.filter(char =>
    char.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()) &&
    (category === 'todos' || char.category === category) &&
    (rank === 'todos' || char.rank === rank) &&
    (year === 'todos' || (char.category === 'aluno' && char.year === year))
  ), [characters, search, category, rank, year])
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const pageCharacters = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
  const filtersProps = { category, setCategory, rank, setRank, year, setYear }

  function handleUnlock(characterId: string) {
    startTransition(async () => {
      try {
        await unlockCharacter(characterId)
        setCharacters(current => current.map(char => char.id === characterId ? { ...char, isLocked: false } : char))
        router.refresh()
        toast.success('Personagem liberado para os jogadores.')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Não foi possível liberar o personagem.')
      }
    })
  }

  if (loading) return <div className="flex items-center justify-center py-20"><p className="animate-pulse font-title text-sm uppercase tracking-widest text-bege-escuro/50">Carregando fichas...</p></div>

  return (
    <div className="relative space-y-6">
      <div className="border-b border-roxo pb-4 text-center sm:text-left">
        <h1 className="font-title text-2xl uppercase tracking-[0.2em] text-bege-medio">Painel de Controle do Mestre</h1>
        <p className="mt-1 text-xs italic tracking-wide text-bege-escuro/60">Busque, filtre e gerencie personagens da campanha.</p>
      </div>

      {characters.length === 0 ? <p className="py-12 text-center font-title text-sm tracking-wide text-bege-escuro/40">Nenhum personagem criado ainda nesta campanha.</p> : (
        <div className="md:grid md:grid-cols-[190px_minmax(0,1fr)] md:gap-6">
          <div className="hidden md:block"><CharacterFilters {...filtersProps} /></div>
          {mobileFiltersOpen && <div className="fixed inset-0 z-50 bg-black/70 md:hidden"><aside className="absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto border-t border-bege-escuro/40 bg-roxo-escuro px-6 py-7"><div className="mb-5 flex items-center justify-between border-b border-bege-escuro/30 pb-4"><h2 className="font-title text-xl uppercase tracking-widest text-bege-medio">Filtros</h2><button type="button" onClick={() => setMobileFiltersOpen(false)} aria-label="Fechar filtros" className="text-bege-medio"><X size={20} /></button></div><CharacterFilters {...filtersProps} variant="mobile" /></aside></div>}

          <section className="min-w-0 space-y-4">
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-bege-escuro/60" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar personagem..." className="h-11 w-full border border-bege-escuro/40 bg-transparent pl-10 pr-3 text-sm text-bege-claro outline-none placeholder:text-bege-medio/50" /></div>
              <button type="button" onClick={() => setMobileFiltersOpen(true)} className="inline-flex h-11 items-center gap-2 border border-bege-escuro/40 px-3 font-title text-[10px] uppercase tracking-widest text-bege-medio md:hidden"><SlidersHorizontal size={14} /> Filtros</button>
            </div>
            <p className="text-[10px] uppercase tracking-widest text-bege-escuro/50">{filtered.length} {filtered.length === 1 ? 'personagem' : 'personagens'}</p>
            {pageCharacters.length ? <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {pageCharacters.map(char => <div key={char.id} className="relative">
                <Link href={`/perfil/${char.id}`} className="group flex min-h-20 items-center gap-4 border border-bege-escuro/40 bg-roxo-escuro/40 p-4 pr-14 shadow-card transition hover:border-bege-medio">
                  <div className={`absolute left-0 top-0 h-full w-1 opacity-70 ${char.category === 'aluno' ? 'bg-blue-500/40' : char.category === 'professor' ? 'bg-purple-500/40' : char.category === 'npc' ? 'bg-green-500/40' : 'bg-red-500/40'}`} />
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-bege-escuro/30 bg-roxo-escuro">{char.portraitImage || char.image ? <Image src={char.portraitImage || char.image!} alt={char.name} fill className="object-cover" /> : <div className="grid h-full place-items-center text-bege-escuro/40">?</div>}</div>
                  <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h2 className="truncate font-title text-sm uppercase text-bege-claro group-hover:text-bege-medio">{char.name}</h2><span className="shrink-0 border border-bege-escuro/20 bg-roxo-escuro px-1.5 py-0.5 font-mono text-[9px] uppercase text-bege-escuro/80">{char.category}</span></div><p className="mt-0.5 truncate font-title text-[11px] tracking-wide text-bege-escuro/50">{char.category === 'aluno' ? `${char.year}º Ano · ` : char.category === 'professor' ? `Leciona: ${char.subject} · ` : char.category === 'npc' ? `Ocupação: ${char.occupation} · ` : `Ameaça: ${char.dangerLevel} · `}Nível {char.level}</p></div>
                  <div className="relative h-6 w-6 shrink-0"><Image src={`/assets/svgs/rank/${char.rank}.svg`} alt={`Rank ${char.rank}`} fill className="object-contain" /></div>
                </Link>
                {char.isLocked && <button type="button" disabled={isPending} onClick={() => handleUnlock(char.id)} aria-label={`Liberar ${char.name} para os jogadores`} title="Liberar para os jogadores" className="absolute right-12 top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-bege-escuro/40 bg-roxo-escuro/90 text-bege-medio hover:border-bege-medio disabled:opacity-50"><Lock size={14} /></button>}
              </div>)}
            </div> : <p className="py-12 text-center font-title text-sm text-bege-escuro/50">Nenhum personagem encontrado com esses filtros.</p>}
            {totalPages > 1 && <div className="flex flex-wrap items-center justify-center gap-2 pt-3">{Array.from({ length: totalPages }, (_, index) => index + 1).map(page => <button key={page} type="button" onClick={() => setCurrentPage(page)} aria-label={`Ir para página ${page}`} aria-current={page === currentPage ? 'page' : undefined} className={`grid h-8 w-8 place-items-center border font-title text-xs ${page === currentPage ? 'border-bege-claro bg-bege-claro text-roxo-escuro' : 'border-bege-escuro/40 text-bege-medio'}`}>{page}</button>)}</div>}
          </section>
        </div>
      )}
    </div>
  )
}
