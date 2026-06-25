'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { PrimaryButton } from '@/componentes/PrimaryButton'
import { getUniverses, createPlayerCharacter } from '@/app/actions/character'
import type { CharacterCategory } from '@/lib/types/character'
import MillieImageUpload from '@/componentes/ui/MillieImageUpload'

type Race = { id: string; name: string; element: string }
type UniverseWorld = { id: string; name: string; races: Race[] }
type Universe = { id: string; name: string; worlds: UniverseWorld[] }

export default function CreateCharForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [universes, setUniverses] = useState<Universe[]>([])
  const [category, setCategory] = useState<CharacterCategory>('aluno')
  const [name, setName] = useState('')
  const [universeId, setUniverseId] = useState('')
  const [worldId, setWorldId] = useState('')
  const [raceId, setRaceId] = useState('')
  const [element, setElement] = useState('')
  const [year, setYear] = useState(1)
  const [subject, setSubject] = useState('')
  const [occupation, setOccupation] = useState('')
  const [image, setImage] = useState("")
  const [error, setError] = useState('')

  useEffect(() => {
    getUniverses().then((data) => {
      setUniverses(data)
      if (data[0]) {
        setUniverseId(data[0].id)
        if (data[0].worlds[0]) {
          setWorldId(data[0].worlds[0].id)
          if (data[0].worlds[0].races[0]) {
            setRaceId(data[0].worlds[0].races[0].id)
            setElement(data[0].worlds[0].races[0].element)
          }
        }
      }
    })
  }, [])

  const selectedUniverse = universes.find((u) => u.id === universeId)
  const worlds = selectedUniverse?.worlds ?? []
  const selectedWorld = worlds.find((w) => w.id === worldId)
  const races = selectedWorld?.races ?? []

  useEffect(() => {
    if (worlds[0]) setWorldId(worlds[0].id)
  }, [universeId])

  useEffect(() => {
    if (races[0]) { setRaceId(races[0].id); setElement(races[0].element) }
  }, [worldId])

  useEffect(() => {
    const race = races.find((r) => r.id === raceId)
    if (race) setElement(race.element)
  }, [raceId])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !raceId) { setError('Preencha nome e selecione uma raça.'); return }
    setError('')
    startTransition(async () => {
      try {
        await createPlayerCharacter({
          name: name.trim(),
          category,
          raceId,
          element,
          worldSlug: selectedWorld?.name.toLowerCase() ?? '',
          image: image || undefined,
          year: category === 'aluno' ? year : undefined,
          subject: category === 'professor' ? subject : undefined,
          occupation: category === 'npc' ? occupation : undefined,
        })
        router.refresh()
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erro ao criar personagem.')
      }
    })
  }

  return (
    <div className="relative max-w-xl mx-auto bg-roxo-escuro/60 border border-bege-escuro/45 p-8 shadow-card">
      <div className="text-center mb-6">
        <h2 className="text-xl font-title text-bege-medio tracking-[0.2em] uppercase">Forjar Nova Identidade</h2>
        <Image src="/assets/svgs/divider.svg" alt="" width={120} height={8} className="mx-auto mt-2 opacity-80" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-[10px] text-bege-escuro/70 uppercase tracking-widest font-title mb-1">Nome</label>
          <input
            type="text" required value={name} onChange={(e) => setName(e.target.value)}
            className="w-full bg-roxo-escuro/40 border border-bege-escuro/30 p-2 text-xs text-bege-claro font-title outline-none focus:border-bege-medio"
            placeholder="Ex: Alistair Vance"
          />
        </div>

        <div>
          <label className="block text-[10px] text-bege-escuro/70 uppercase tracking-widest font-title mb-1.5">Arquétipo</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['aluno', 'professor', 'npc'] as CharacterCategory[]).map((cat) => (
              <button type="button" key={cat} onClick={() => setCategory(cat)}
                className={`py-2 text-xs font-title uppercase tracking-wider border transition-all ${category === cat ? 'bg-roxo-escuro border-bege-medio text-bege-medio' : 'bg-roxo-escuro/30 border-bege-escuro/30 text-bege-escuro/50 hover:text-bege-medio'}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {universes.length === 0 ? (
          <p className="text-xs text-bege-medio/50 font-title uppercase tracking-widest">
            Nenhum universo cadastrado. Peça ao Mestre para rodar o seed.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-bege-escuro/70 uppercase tracking-widest font-title mb-1">Universo</label>
              <select value={universeId} onChange={(e) => setUniverseId(e.target.value)}
                className="w-full bg-roxo-escuro border border-bege-escuro/30 p-2 text-xs text-bege-claro font-title outline-none">
                {universes.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-bege-escuro/70 uppercase tracking-widest font-title mb-1">Mundo Natal</label>
              <select value={worldId} onChange={(e) => setWorldId(e.target.value)}
                className="w-full bg-roxo-escuro border border-bege-escuro/30 p-2 text-xs text-bege-claro font-title outline-none">
                {worlds.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-bege-escuro/70 uppercase tracking-widest font-title mb-1">Raça</label>
              <select value={raceId} onChange={(e) => setRaceId(e.target.value)}
                className="w-full bg-roxo-escuro border border-bege-escuro/30 p-2 text-xs text-bege-claro font-title outline-none">
                {races.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-bege-escuro/70 uppercase tracking-widest font-title mb-1">Elemento Vinculado</label>
              <div className="w-full bg-roxo-escuro/20 border border-bege-escuro/20 p-2 text-xs text-bege-medio font-title uppercase tracking-widest">
                {element || '—'}
              </div>
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-bege-escuro/20">
          {category === 'aluno' && (
            <div>
              <label className="block text-[10px] text-bege-escuro/70 uppercase tracking-widest font-title mb-1">Ano Letivo</label>
              <div className="grid grid-cols-4 gap-2">
                {[1,2,3,4].map((num) => (
                  <button type="button" key={num} onClick={() => setYear(num)}
                    className={`py-1.5 text-xs font-title border transition-all ${year === num ? 'bg-roxo-escuro border-bege-medio text-bege-medio' : 'bg-roxo-escuro/30 border-bege-escuro/30 text-bege-escuro/50'}`}>
                    {num}º Ano
                  </button>
                ))}
              </div>
            </div>
          )}
          {category === 'professor' && (
            <div>
              <label className="block text-[10px] text-bege-escuro/70 uppercase tracking-widest font-title mb-1">Matéria</label>
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-roxo-escuro/40 border border-bege-escuro/30 p-2 text-xs text-bege-claro font-title outline-none focus:border-bege-medio"
                placeholder="Ex: Alquimia Proibida" />
            </div>
          )}
          {category === 'npc' && (
            <div>
              <label className="block text-[10px] text-bege-escuro/70 uppercase tracking-widest font-title mb-1">Ocupação</label>
              <input type="text" value={occupation} onChange={(e) => setOccupation(e.target.value)}
                className="w-full bg-roxo-escuro/40 border border-bege-escuro/30 p-2 text-xs text-bege-claro font-title outline-none focus:border-bege-medio"
                placeholder="Ex: Guardião da Biblioteca" />
            </div>
          )}
        </div>

        <MillieImageUpload
          label="Foto do personagem (opcional)"
          value={image}
          onChange={setImage}
          aspectRatio="portrait"
        />

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="pt-4 flex justify-end">
          <PrimaryButton type="submit" disabled={isPending} className="w-full sm:w-auto px-6 py-2.5 text-xs tracking-widest uppercase">
            {isPending ? 'Forjando...' : 'Sincronizar Grimório'}
          </PrimaryButton>
        </div>
      </form>
    </div>
  )
}