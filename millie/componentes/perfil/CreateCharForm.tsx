'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { BaseRank } from '@/lib/generated/prisma'
import { PrimaryButton } from '@/componentes/PrimaryButton'
import { getUniverses, createPlayerCharacter } from '@/app/actions/character'
import type { CharacterCategory } from '@/lib/types/character'
import MillieImageUpload from '@/componentes/ui/MillieImageUpload'
import { getRankMin, getRankMax, getTotalPoints, calcPV, calcPM } from '@/lib/utils/rank'

// ─── tipos locais ──────────────────────────────────────────
type Race = { id: string; name: string; element: string; baseRank: string }
type UniverseWorld = { id: string; name: string; races: Race[] }
type Universe = { id: string; name: string; worlds: UniverseWorld[] }

type AttributeMethod = 'equilibrado' | 'aleatorio'

const RANK_MULTIPLIER: Record<string, number> = {
  D: 1,
  C: 4.5,
  B: 6.36,
  A: 8.18,
  S: 10,
}

// cartas do baralho para o método aleatório (Ás=1, J/Q/K = 11/12/13 → cap em 10)
const DECK = [1,2,3,4,5,6,7,8,9,10,10,10,10] // 13 valores, figuras valem 10

function drawCard(): number {
  return DECK[Math.floor(Math.random() * DECK.length)]
}

// ─── atributos ────────────────────────────────────────────
const ATTR_LABELS: Record<string, string> = {
  agilidade: 'Agilidade',
  inteligencia: 'Inteligência',
  forca: 'Força',
  vigor: 'Vigor',
  sorte: 'Sorte',
}
const ATTR_KEYS = ['agilidade', 'inteligencia', 'forca', 'vigor', 'sorte'] as const
type AttrKey = typeof ATTR_KEYS[number]
type Attributes = Record<AttrKey, number>

export default function CreateCharForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [universes, setUniverses] = useState<Universe[]>([])

  // seleções
  const [category, setCategory] = useState<CharacterCategory>('aluno')
  const [name, setName] = useState('')
  const [universeId, setUniverseId] = useState('')
  const [worldId, setWorldId] = useState('')
  const [raceId, setRaceId] = useState('')
  const [element, setElement] = useState('')
  const [baseRank, setBaseRank] = useState('D')
  const [year, setYear] = useState(1)
  const [subject, setSubject] = useState('')
  const [occupation, setOccupation] = useState('')
  const [image, setImage] = useState('')
  const [error, setError] = useState('')

  // atributos
  const [method, setMethod] = useState<AttributeMethod>('equilibrado')
  const [attrs, setAttrs] = useState<Attributes>({
    agilidade: 1, inteligencia: 1, forca: 1, vigor: 1, sorte: 1,
  })
  const [drawnCards, setDrawnCards] = useState<number[] | null>(null)

  // ─── carrega universos ───────────────────────────────────
  useEffect(() => {
    getUniverses().then((data) => {
      setUniverses(data)
      const u = data[0]
      if (!u) return
      setUniverseId(u.id)
      const w = u.worlds[0]
      if (!w) return
      setWorldId(w.id)
      const r = w.races[0]
      if (!r) return
      setRaceId(r.id)
      setElement(r.element)
      setBaseRank(r.baseRank)
    })
  }, [])

  const selectedUniverse = universes.find((u) => u.id === universeId)
  const worlds = selectedUniverse?.worlds ?? []
  const selectedWorld = worlds.find((w) => w.id === worldId)
  const races = selectedWorld?.races ?? []

  useEffect(() => { if (worlds[0]) setWorldId(worlds[0].id) }, [universeId])
  useEffect(() => {
    if (races[0]) {
      setRaceId(races[0].id)
      setElement(races[0].element)
      setBaseRank(races[0].baseRank)
    }
  }, [worldId])
  useEffect(() => {
    const race = races.find((r) => r.id === raceId)
    if (race) {
      setElement(race.element)
      setBaseRank(race.baseRank)
    }
  }, [raceId])

  // quando muda o rank, reseta os atributos para o mínimo do novo rank
  useEffect(() => {
    const min = getRankMin(baseRank)
    setAttrs({ agilidade: min, inteligencia: min, forca: min, vigor: min, sorte: min })
    setDrawnCards(null)
  }, [baseRank])

  // ─── método equilibrado ──────────────────────────────────
  const totalPoints = getTotalPoints(baseRank)
  const usedPoints = ATTR_KEYS.reduce((acc, k) => acc + attrs[k], 0)
  const remainingPoints = totalPoints - usedPoints
  const rankMin = getRankMin(baseRank)
  const rankMax = getRankMax(baseRank)

  function handleAttrChange(key: AttrKey, raw: string) {
    const val = parseInt(raw) || rankMin
    const clamped = Math.max(rankMin, Math.min(rankMax, val))
    // verifica se não estoura o total
    const otherSum = ATTR_KEYS.filter((k) => k !== key).reduce((s, k) => s + attrs[k], 0)
    const maxAllowed = Math.min(clamped, totalPoints - otherSum)
    setAttrs((prev) => ({ ...prev, [key]: Math.max(rankMin, maxAllowed) }))
  }

  // ─── método aleatório ────────────────────────────────────
  function handleDraw() {
    const cards = ATTR_KEYS.map(() => drawCard())
    setDrawnCards(cards)
    const mult = RANK_MULTIPLIER[baseRank] ?? 1
    const newAttrs: Attributes = {} as Attributes
    ATTR_KEYS.forEach((key, i) => {
      const val = Math.round(cards[i] * mult)
      newAttrs[key] = Math.max(rankMin, Math.min(rankMax, val))
    })
    setAttrs(newAttrs)
  }

  // ─── PV e PM calculados ──────────────────────────────────
  const pv = calcPV(attrs.vigor)
  const pm = calcPM(attrs.inteligencia)

  // ─── submit ──────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !raceId) { setError('Preencha nome e selecione uma raça.'); return }
    if (remainingPoints < 0) { setError('Pontos de atributo excedidos.'); return }
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
          ...attrs,
          pv,
          pvMax: pv,
          pm,
          pmMax: pm,
          birthRank: baseRank as BaseRank,
        })
        router.refresh()
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erro ao criar personagem.')
      }
    })
  }

  // ─── render ──────────────────────────────────────────────
  return (
    <div className="relative max-w-xl mx-auto bg-roxo-escuro/60 border border-bege-escuro/45 p-8 shadow-card">
      <div className="text-center mb-6">
        <h2 className="text-xl font-title text-bege-medio tracking-[0.2em] uppercase">Forjar Nova Identidade</h2>
        <Image src="/assets/svgs/divider.svg" alt="" width={120} height={8} className="mx-auto mt-2 opacity-80" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Nome */}
        <div>
          <label className="block text-[10px] text-bege-escuro/70 uppercase tracking-widest font-title mb-1">Nome</label>
          <input
            type="text" required value={name} onChange={(e) => setName(e.target.value)}
            className="w-full bg-roxo-escuro/40 border border-bege-escuro/30 p-2 text-xs text-bege-claro font-title outline-none focus:border-bege-medio"
            placeholder="Ex: Alistair Vance"
          />
        </div>

        {/* Arquétipo */}
        <div>
          <label className="block text-[10px] text-bege-escuro/70 uppercase tracking-widest font-title mb-1.5">Arquétipo</label>
          <div className="grid grid-cols-3 gap-2">
            {(['aluno', 'professor', 'npc'] as CharacterCategory[]).map((cat) => (
              <button type="button" key={cat} onClick={() => setCategory(cat)}
                className={`py-2 text-xs font-title uppercase tracking-wider border transition-all ${category === cat ? 'bg-roxo-escuro border-bege-medio text-bege-medio' : 'bg-roxo-escuro/30 border-bege-escuro/30 text-bege-escuro/50 hover:text-bege-medio'}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Universo / Mundo / Raça / Elemento */}
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
              <label className="block text-[10px] text-bege-escuro/70 uppercase tracking-widest font-title mb-1">Elemento</label>
              <div className="w-full bg-roxo-escuro/20 border border-bege-escuro/20 p-2 text-xs text-bege-medio font-title uppercase tracking-widest">
                {element || '—'}
              </div>
            </div>
          </div>
        )}

        {/* Rank de nascença (readonly, vem da raça) */}
        <div className="flex items-center gap-3 p-3 border border-bege-escuro/20 bg-roxo-escuro/20">
          <span className="text-[10px] text-bege-escuro/70 uppercase tracking-widest font-title">Rank de Nascença</span>
          <span className="text-sm font-title text-bege-medio tracking-widest">{baseRank}</span>
          <span className="text-[10px] text-bege-escuro/50 font-title ml-auto">
            Atributos: {getRankMin(baseRank)} – {getRankMax(baseRank)}
          </span>
        </div>

        {/* Campo específico por categoria */}
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

        {/* ── SEÇÃO DE ATRIBUTOS ── */}
        <div className="pt-2 border-t border-bege-escuro/20 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-bege-escuro/70 uppercase tracking-widest font-title">Distribuição de Atributos</label>
            <div className="flex gap-1">
              {(['equilibrado', 'aleatorio'] as AttributeMethod[]).map((m) => (
                <button type="button" key={m} onClick={() => setMethod(m)}
                  className={`px-3 py-1 text-[10px] font-title uppercase tracking-widest border transition-all ${method === m ? 'bg-roxo-escuro border-bege-medio text-bege-medio' : 'bg-roxo-escuro/30 border-bege-escuro/30 text-bege-escuro/50 hover:text-bege-medio'}`}>
                  {m === 'equilibrado' ? 'Equilibrado' : 'Aleatório'}
                </button>
              ))}
            </div>
          </div>

          {method === 'equilibrado' && (
            <div className="space-y-3">
              {/* contador de pontos */}
              <div className="flex justify-between items-center text-[10px] font-title uppercase tracking-widest">
                <span className="text-bege-escuro/60">Pontos disponíveis</span>
                <span className={remainingPoints < 0 ? 'text-red-400' : 'text-bege-medio'}>
                  {remainingPoints} / {totalPoints}
                </span>
              </div>
              {ATTR_KEYS.map((key) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-[10px] font-title uppercase tracking-widest text-bege-escuro/70 w-24 shrink-0">
                    {ATTR_LABELS[key]}
                  </span>
                  <input
                    type="number"
                    min={rankMin}
                    max={rankMax}
                    value={attrs[key]}
                    onChange={(e) => handleAttrChange(key, e.target.value)}
                    className="w-20 bg-roxo-escuro/40 border border-bege-escuro/30 p-1.5 text-xs text-bege-claro font-title outline-none focus:border-bege-medio text-center"
                  />
                  <div className="flex-1 h-0.5 bg-bege-escuro/10 relative">
                    <div
                      className="absolute inset-y-0 left-0 bg-bege-escuro/40 transition-all"
                      style={{ width: `${((attrs[key] - rankMin) / (rankMax - rankMin)) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-bege-escuro/40 font-title w-8 text-right">{rankMax}</span>
                </div>
              ))}
            </div>
          )}

          {method === 'aleatorio' && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleDraw}
                className="w-full py-2.5 text-xs font-title uppercase tracking-widest border border-bege-escuro/40 text-bege-escuro/70 hover:border-bege-medio hover:text-bege-medio transition-all bg-roxo-escuro/20"
              >
                {drawnCards ? '↺ Sortear Novamente' : '✦ Sortear 5 Cartas'}
              </button>

              {drawnCards && (
                <div className="space-y-2.5">
                  {/* exibe cartas sorteadas e valores resultantes */}
                  <div className="grid grid-cols-5 gap-1 text-center mb-2">
                    {drawnCards.map((card, i) => (
                      <div key={i} className="bg-roxo-escuro/40 border border-bege-escuro/20 p-1.5">
                        <div className="text-[10px] text-bege-escuro/50 font-title uppercase">carta</div>
                        <div className="text-sm text-bege-medio font-title">{card}</div>
                      </div>
                    ))}
                  </div>
                  {ATTR_KEYS.map((key, i) => (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-[10px] font-title uppercase tracking-widest text-bege-escuro/70 w-24 shrink-0">
                        {ATTR_LABELS[key]}
                      </span>
                      <div className="flex-1 h-0.5 bg-bege-escuro/10 relative">
                        <div
                          className="absolute inset-y-0 left-0 bg-bege-escuro/40 transition-all"
                          style={{ width: `${((attrs[key] - rankMin) / (rankMax - rankMin)) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-bege-medio font-title w-10 text-right">{attrs[key]}</span>
                    </div>
                  ))}
                </div>
              )}

              {!drawnCards && (
                <p className="text-[10px] text-bege-escuro/40 font-title uppercase tracking-widest text-center">
                  Cada carta sorteada × {RANK_MULTIPLIER[baseRank]} (rank {baseRank})
                </p>
              )}
            </div>
          )}

          {/* PV e PM calculados */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-bege-escuro/20">
            <div className="bg-roxo-escuro/30 border border-bege-escuro/20 p-3 text-center">
              <div className="text-[10px] text-bege-escuro/60 font-title uppercase tracking-widest mb-1">Pontos de Vida</div>
              <div className="text-xl text-bege-medio font-title">{pv}</div>
              <div className="text-[10px] text-bege-escuro/40 font-title">10 + (Vigor {attrs.vigor} × 2)</div>
            </div>
            <div className="bg-roxo-escuro/30 border border-bege-escuro/20 p-3 text-center">
              <div className="text-[10px] text-bege-escuro/60 font-title uppercase tracking-widest mb-1">Pontos de Mana</div>
              <div className="text-xl text-bege-medio font-title">{pm}</div>
              <div className="text-[10px] text-bege-escuro/40 font-title">10 + (Int {attrs.inteligencia} × 2)</div>
            </div>
          </div>
        </div>

        <MillieImageUpload
          label="Foto do personagem (opcional)"
          value={image}
          onChange={setImage}
          aspectRatio="portrait"
        />

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="pt-4 flex justify-end">
          <PrimaryButton
            type="submit"
            disabled={isPending || (method === 'equilibrado' && remainingPoints !== 0) || (method === 'aleatorio' && !drawnCards)}
            className="w-full sm:w-auto px-6 py-2.5 text-xs tracking-widest uppercase"
          >
            {isPending ? 'Forjando...' : 'Sincronizar Grimório'}
          </PrimaryButton>
        </div>
      </form>
    </div>
  )
}