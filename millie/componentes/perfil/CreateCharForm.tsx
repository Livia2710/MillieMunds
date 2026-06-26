'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { PrimaryButton } from '@/componentes/PrimaryButton'
import { getUniverses, createPlayerCharacter } from '@/app/actions/character'
import type { CharacterCategory } from '@/lib/types/character'
import type { BaseRank } from '@/lib/generated/prisma'
import MillieImageUpload from '@/componentes/ui/MillieImageUpload'
import { getRankMin, getRankMax, getTotalPoints, calcPV, calcPM } from '@/lib/utils/rank'

// ─── tipos locais ──────────────────────────────────────────
type Race = { id: string; name: string; element: string; baseRank: string }
type UniverseWorld = { id: string; name: string; races: Race[] }
type Universe = { id: string; name: string; worlds: UniverseWorld[] }
type AttributeMethod = 'equilibrado' | 'aleatorio'
type DrawMode = 'um_a_um' | 'todos'

const ATTR_LABELS: Record<string, string> = {
  agilidade:    'Agilidade',
  inteligencia: 'Inteligência',
  forca:        'Força',
  vigor:        'Vigor',
  sorte:        'Sorte',
}
const ATTR_KEYS = ['agilidade', 'inteligencia', 'forca', 'vigor', 'sorte'] as const
type AttrKey = typeof ATTR_KEYS[number]
type Attributes = Record<AttrKey, number>

// ─── baralho válido para criação ──────────────────────────
// Ás=1, 2-10=nominal, Valete/Cavaleiro/Rainha/Rei = inválidos (sorteia de novo)
const NAIPES = ['copas', 'espadas', 'ouro', 'paus'] as const
type Naipe = typeof NAIPES[number]

type CardResult = {
  value: number      // 1-10
  naipe: Naipe
  label: string      // 'as', '2', '3'... '10'
  imagePath: string
}

function drawValidCard(): CardResult {
  const naipe = NAIPES[Math.floor(Math.random() * NAIPES.length)]
  // válidas: as, 2, 3, 4, 5, 6, 7, 8, 9, 10
  const validLabels = ['as', '2', '3', '4', '5', '6', '7', '8', '9', '10']
  const label = validLabels[Math.floor(Math.random() * validLabels.length)]
  const value = label === 'as' ? 1 : parseInt(label)
  return {
    value,
    naipe,
    label,
    imagePath: `/assets/images/cartas/arcano_menor/${label}-${naipe}.png`,
  }
}

// ─── constantes fixas de criação ──────────────────────────
const CREATION_MIN = 1
const CREATION_MAX = 10
const CREATION_TOTAL = 25

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
  const [drawMode, setDrawMode] = useState<DrawMode>('todos')
  const [attrs, setAttrs] = useState<Attributes>({
    agilidade: 1, inteligencia: 1, forca: 1, vigor: 1, sorte: 1,
  })

  // estado do método aleatório
  const [drawnCards, setDrawnCards] = useState<CardResult[]>([])
  // um a um
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [currentCard, setCurrentCard] = useState<CardResult | null>(null)
  const [assignedAttrs, setAssignedAttrs] = useState<Partial<Record<AttrKey, CardResult>>>({})

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

  // reseta atributos ao trocar de raça
  useEffect(() => {
    setAttrs({ agilidade: 1, inteligencia: 1, forca: 1, vigor: 1, sorte: 1 })
    resetAleatorio()
  }, [baseRank])

  // ─── método equilibrado ──────────────────────────────────
  const usedPoints = ATTR_KEYS.reduce((acc, k) => acc + attrs[k], 0)
  const remainingPoints = CREATION_TOTAL - usedPoints

  function handleAttrChange(key: AttrKey, raw: string) {
    const val = parseInt(raw) || CREATION_MIN
    const clamped = Math.max(CREATION_MIN, Math.min(CREATION_MAX, val))
    const otherSum = ATTR_KEYS.filter((k) => k !== key).reduce((s, k) => s + attrs[k], 0)
    const maxAllowed = Math.min(clamped, CREATION_TOTAL - otherSum)
    setAttrs((prev) => ({ ...prev, [key]: Math.max(CREATION_MIN, maxAllowed) }))
  }

  // ─── reset aleatório ─────────────────────────────────────
  function resetAleatorio() {
    setDrawnCards([])
    setCurrentCardIndex(0)
    setCurrentCard(null)
    setAssignedAttrs({})
    setAttrs({ agilidade: 1, inteligencia: 1, forca: 1, vigor: 1, sorte: 1 })
  }

  // ─── método aleatório — todos de uma vez ─────────────────
  function handleDrawAll() {
    const cards: CardResult[] = []
    for (let i = 0; i < 5; i++) cards.push(drawValidCard())
    setDrawnCards(cards)
    const newAttrs: Attributes = {} as Attributes
    ATTR_KEYS.forEach((key, i) => {
      newAttrs[key] = Math.max(CREATION_MIN, Math.min(CREATION_MAX, cards[i].value))
    })
    setAttrs(newAttrs)
  }

  // ─── método aleatório — um a um ──────────────────────────
  function handleDrawOne() {
    if (currentCardIndex >= 5) return
    setCurrentCard(drawValidCard())
  }

  function handleAssignCard(key: AttrKey) {
    if (!currentCard) return
    if (assignedAttrs[key]) return // já atribuído
    const value = Math.max(CREATION_MIN, Math.min(CREATION_MAX, currentCard.value))
    setAttrs((prev) => ({ ...prev, [key]: value }))
    setAssignedAttrs((prev) => ({ ...prev, [key]: currentCard }))
    const nextIndex = currentCardIndex + 1
    setCurrentCardIndex(nextIndex)
    if (nextIndex < 5) {
      setCurrentCard(null) // aguarda próximo sorteio
    } else {
      setCurrentCard(null) // concluído
    }
  }

  const umAUmConcluido = Object.keys(assignedAttrs).length === 5

  // ─── PV e PM ─────────────────────────────────────────────
  const pv = calcPV(attrs.vigor)
  const pm = calcPM(attrs.inteligencia)

  // ─── aleatorio pronto? ───────────────────────────────────
  const aleatorioPronto =
    drawMode === 'todos'
      ? drawnCards.length === 5
      : umAUmConcluido

  // ─── submit ──────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !raceId) { setError('Preencha nome e selecione uma raça.'); return }
    if (method === 'equilibrado' && remainingPoints !== 0) { setError('Distribua exatamente todos os 25 pontos.'); return }
    if (method === 'aleatorio' && !aleatorioPronto) { setError('Conclua o sorteio de atributos.'); return }
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

        {/* Rank de nascença */}
        <div className="flex items-center gap-3 p-3 border border-bege-escuro/20 bg-roxo-escuro/20">
          <span className="text-[10px] text-bege-escuro/70 uppercase tracking-widest font-title">Rank de Nascença</span>
          <span className="text-sm font-title text-bege-medio tracking-widest">{baseRank}</span>
          <span className="text-[10px] text-bege-escuro/50 font-title ml-auto">
            Atributos na criação: 1 – 10 · Total: 25 pts
          </span>
        </div>

        {/* Campo por categoria */}
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
                <button type="button" key={m} onClick={() => { setMethod(m); resetAleatorio() }}
                  className={`px-3 py-1 text-[10px] font-title uppercase tracking-widest border transition-all ${method === m ? 'bg-roxo-escuro border-bege-medio text-bege-medio' : 'bg-roxo-escuro/30 border-bege-escuro/30 text-bege-escuro/50 hover:text-bege-medio'}`}>
                  {m === 'equilibrado' ? 'Equilibrado' : 'Aleatório'}
                </button>
              ))}
            </div>
          </div>

          {/* EQUILIBRADO */}
          {method === 'equilibrado' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] font-title uppercase tracking-widest">
                <span className="text-bege-escuro/60">Pontos disponíveis</span>
                <span className={remainingPoints < 0 ? 'text-red-400' : 'text-bege-medio'}>
                  {remainingPoints} / {CREATION_TOTAL}
                </span>
              </div>
              {ATTR_KEYS.map((key) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-[10px] font-title uppercase tracking-widest text-bege-escuro/70 w-24 shrink-0">
                    {ATTR_LABELS[key]}
                  </span>
                  <input
                    type="number" min={CREATION_MIN} max={CREATION_MAX}
                    value={attrs[key]}
                    onChange={(e) => handleAttrChange(key, e.target.value)}
                    className="w-20 bg-roxo-escuro/40 border border-bege-escuro/30 p-1.5 text-xs text-bege-claro font-title outline-none focus:border-bege-medio text-center"
                  />
                  <div className="flex-1 h-0.5 bg-bege-escuro/10 relative">
                    <div className="absolute inset-y-0 left-0 bg-bege-escuro/40 transition-all"
                      style={{ width: `${((attrs[key] - CREATION_MIN) / (CREATION_MAX - CREATION_MIN)) * 100}%` }} />
                  </div>
                  <span className="text-[10px] text-bege-escuro/40 font-title w-8 text-right">{CREATION_MAX}</span>
                </div>
              ))}
            </div>
          )}

          {/* ALEATÓRIO */}
          {method === 'aleatorio' && (
            <div className="space-y-4">
              {/* Escolha do modo */}
              <div className="flex gap-1">
                {(['todos', 'um_a_um'] as DrawMode[]).map((m) => (
                  <button type="button" key={m} onClick={() => { setDrawMode(m); resetAleatorio() }}
                    className={`px-3 py-1 text-[10px] font-title uppercase tracking-widest border transition-all ${drawMode === m ? 'bg-roxo-escuro border-bege-medio text-bege-medio' : 'bg-roxo-escuro/30 border-bege-escuro/30 text-bege-escuro/50 hover:text-bege-medio'}`}>
                    {m === 'todos' ? 'Sortear Tudo' : 'Um a Um'}
                  </button>
                ))}
              </div>

              {/* TODOS DE UMA VEZ */}
              {drawMode === 'todos' && (
                <div className="space-y-3">
                  <button type="button" onClick={handleDrawAll}
                    className="w-full py-2.5 text-xs font-title uppercase tracking-widest border border-bege-escuro/40 text-bege-escuro/70 hover:border-bege-medio hover:text-bege-medio transition-all bg-roxo-escuro/20">
                    {drawnCards.length > 0 ? '↺ Sortear Novamente' : '✦ Sortear 5 Cartas'}
                  </button>

                  {drawnCards.length > 0 && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-5 gap-2">
                        {drawnCards.map((card, i) => (
                          <div key={i} className="flex flex-col items-center gap-1">
                            <div className="relative w-full aspect-[2/3] border border-bege-escuro/20 overflow-hidden bg-roxo-escuro/40">
                              <Image src={card.imagePath} alt={`${card.label} de ${card.naipe}`} fill className="object-cover" />
                            </div>
                            <span className="text-[10px] font-title text-bege-medio">{card.value}</span>
                          </div>
                        ))}
                      </div>
                      {ATTR_KEYS.map((key, i) => (
                        <div key={key} className="flex items-center gap-3">
                          <span className="text-[10px] font-title uppercase tracking-widest text-bege-escuro/70 w-24 shrink-0">
                            {ATTR_LABELS[key]}
                          </span>
                          <div className="flex-1 h-0.5 bg-bege-escuro/10 relative">
                            <div className="absolute inset-y-0 left-0 bg-bege-escuro/40 transition-all"
                              style={{ width: `${((attrs[key] - CREATION_MIN) / (CREATION_MAX - CREATION_MIN)) * 100}%` }} />
                          </div>
                          <span className="text-xs text-bege-medio font-title w-10 text-right">{attrs[key]}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* UM A UM */}
              {drawMode === 'um_a_um' && (
                <div className="space-y-4">
                  {!umAUmConcluido && (
                    <div className="text-center space-y-3">
                      <p className="text-[10px] font-title uppercase tracking-widest text-bege-escuro/60">
                        Carta {currentCardIndex + 1} de 5
                      </p>

                      {/* carta atual */}
                      {currentCard ? (
                        <div className="space-y-3">
                          <div className="flex justify-center">
                            <div className="relative w-24 aspect-[2/3] border border-bege-medio/30 overflow-hidden bg-roxo-escuro/40">
                              <Image src={currentCard.imagePath} alt={`${currentCard.label} de ${currentCard.naipe}`} fill className="object-cover" />
                            </div>
                          </div>
                          <p className="text-sm font-title text-bege-medio tracking-widest">
                            Valor: {currentCard.value}
                          </p>
                          <p className="text-[10px] font-title uppercase tracking-widest text-bege-escuro/60">
                            Escolha qual atributo recebe este valor:
                          </p>
                          <div className="grid grid-cols-1 gap-1">
                            {ATTR_KEYS.filter((k) => !assignedAttrs[k]).map((key) => (
                              <button type="button" key={key} onClick={() => handleAssignCard(key)}
                                className="py-2 text-xs font-title uppercase tracking-widest border border-bege-escuro/30 text-bege-escuro/70 hover:border-bege-medio hover:text-bege-medio transition-all bg-roxo-escuro/20">
                                {ATTR_LABELS[key]}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <button type="button" onClick={handleDrawOne}
                          className="w-full py-2.5 text-xs font-title uppercase tracking-widest border border-bege-escuro/40 text-bege-escuro/70 hover:border-bege-medio hover:text-bege-medio transition-all bg-roxo-escuro/20">
                          ✦ Sortear Carta {currentCardIndex + 1}
                        </button>
                      )}
                    </div>
                  )}

                  {/* resultado final um a um */}
                  {umAUmConcluido && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-5 gap-2">
                        {ATTR_KEYS.map((key) => {
                          const card = assignedAttrs[key]
                          return card ? (
                            <div key={key} className="flex flex-col items-center gap-1">
                              <div className="relative w-full aspect-[2/3] border border-bege-escuro/20 overflow-hidden bg-roxo-escuro/40">
                                <Image src={card.imagePath} alt={`${card.label} de ${card.naipe}`} fill className="object-cover" />
                              </div>
                              <span className="text-[9px] font-title text-bege-escuro/60 uppercase">{ATTR_LABELS[key].slice(0,3)}</span>
                              <span className="text-[10px] font-title text-bege-medio">{card.value}</span>
                            </div>
                          ) : null
                        })}
                      </div>
                      <button type="button" onClick={resetAleatorio}
                        className="w-full py-2 text-[10px] font-title uppercase tracking-widest border border-bege-escuro/30 text-bege-escuro/50 hover:text-bege-medio transition-all">
                        ↺ Recomeçar Sorteio
                      </button>
                    </div>
                  )}

                  {/* atributos atribuídos até agora */}
                  <div className="space-y-2">
                    {ATTR_KEYS.map((key) => (
                      <div key={key} className="flex items-center gap-3">
                        <span className={`text-[10px] font-title uppercase tracking-widest w-24 shrink-0 ${assignedAttrs[key] ? 'text-bege-escuro/70' : 'text-bege-escuro/30'}`}>
                          {ATTR_LABELS[key]}
                        </span>
                        <div className="flex-1 h-0.5 bg-bege-escuro/10 relative">
                          {assignedAttrs[key] && (
                            <div className="absolute inset-y-0 left-0 bg-bege-escuro/40 transition-all"
                              style={{ width: `${((attrs[key] - CREATION_MIN) / (CREATION_MAX - CREATION_MIN)) * 100}%` }} />
                          )}
                        </div>
                        <span className={`text-xs font-title w-10 text-right ${assignedAttrs[key] ? 'text-bege-medio' : 'text-bege-escuro/20'}`}>
                          {assignedAttrs[key] ? attrs[key] : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PV e PM */}
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

        <MillieImageUpload label="Foto do personagem (opcional)" value={image} onChange={setImage} aspectRatio="portrait" />

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="pt-4 flex justify-end">
          <PrimaryButton
            type="submit"
            disabled={
              isPending ||
              (method === 'equilibrado' && remainingPoints !== 0) ||
              (method === 'aleatorio' && !aleatorioPronto)
            }
            className="w-full sm:w-auto px-6 py-2.5 text-xs tracking-widest uppercase"
          >
            {isPending ? 'Forjando...' : 'Sincronizar Grimório'}
          </PrimaryButton>
        </div>
      </form>
    </div>
  )
}