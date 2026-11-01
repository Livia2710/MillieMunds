'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Image from 'next/image'
import { BookOpen, LoaderCircle, Search, Sparkles, Trash2, X } from 'lucide-react'
import { adjustRitualMastery, getGrimoireCharacterData, getGrimoireData, grantCharacterRitual, removeCharacterElementAffinity, removeCharacterRitual, setCharacterElementAffinity } from '@/app/actions/grimoire'
import type { GrimoireData } from '@/lib/types/grimoire'
import { AFFINITY_STAGES, GRIMOIRE_ELEMENTS } from '@/lib/types/grimoire'
import { SigilArt } from '@/componentes/grimorio/SigilArt'

const ELEMENT_LABELS: Record<string, string> = { luz: 'Luz', vento: 'Vento', fogo: 'Fogo', trevas: 'Trevas', terra: 'Terra', agua: 'Água' }
const CATEGORY_LABELS: Record<string, string> = { aluno: 'Aluno', professor: 'Professor', npc: 'NPC', monstro: 'Monstro' }
const normalize = (value: string) => value.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
const PAGE_SIZE = 6

function Pager({ page, count, pageSize = PAGE_SIZE, onChange }: { page: number; count: number; pageSize?: number; onChange: (page: number) => void }) {
  const pages = Math.ceil(count / pageSize)
  if (pages <= 1) return null
  return <div className="mt-2 flex items-center justify-center gap-3 text-[11px] text-bege-claro/55"><button type="button" onClick={() => onChange(Math.max(0, page - 1))} disabled={page === 0} className="rounded border border-bege-medio/20 px-2 py-1 disabled:opacity-30">Anterior</button><span>{page + 1} / {pages}</span><button type="button" onClick={() => onChange(Math.min(pages - 1, page + 1))} disabled={page >= pages - 1} className="rounded border border-bege-medio/20 px-2 py-1 disabled:opacity-30">Próxima</button></div>
}

function ElementIcon({ element, size = 18 }: { element: string; size?: number }) {
  const key = normalize(element)
  const icon = GRIMOIRE_ELEMENTS.includes(key as (typeof GRIMOIRE_ELEMENTS)[number]) ? key : ['escolha', 'vazio'].includes(key) ? 'vazio' : null
  return icon
    ? <Image src={`/assets/svgs/elemento/${icon}.svg`} alt="" width={size} height={size} className="shrink-0 object-contain" />
    : <Sparkles aria-hidden="true" size={size} className="shrink-0 text-bege-medio/60" />
}

export default function GerenciarGrimorioModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [data, setData] = useState<GrimoireData | null>(null)
  const [characterId, setCharacterId] = useState('')
  const [ritualId, setRitualId] = useState('')
  const [characterQuery, setCharacterQuery] = useState('')
  const [characterRank, setCharacterRank] = useState('')
  const [characterType, setCharacterType] = useState('')
  const [characterElement, setCharacterElement] = useState('')
  const [characterPage, setCharacterPage] = useState(0)
  const [ritualQuery, setRitualQuery] = useState('')
  const [ritualDegree, setRitualDegree] = useState<number | null>(null)
  const [ritualElement, setRitualElement] = useState('')
  const [ritualPage, setRitualPage] = useState(0)
  const [learnedPage, setLearnedPage] = useState(0)
  const [affinityPage, setAffinityPage] = useState(0)
  const [ritualXp, setRitualXp] = useState<Record<string, string>>({})
  const [affinity, setAffinity] = useState('luz')
  const [stage, setStage] = useState('1')
  const [stageXp, setStageXp] = useState('0')
  const [affinityEdits, setAffinityEdits] = useState<Record<string, { stage: string; xp: string }>>({})
  const [notice, setNotice] = useState('')
  const [busy, startTransition] = useTransition()

  const character = data?.character?.id === characterId ? data.character : null
  const learnedIds = useMemo(() => new Set(character?.rituals.map(item => item.id) ?? []), [character?.rituals])
  const unlearned = useMemo(() => data?.catalog.filter(item => !learnedIds.has(item.id)) ?? [], [data?.catalog, learnedIds])
  const filteredCharacters = useMemo(() => (data?.characters ?? []).filter(item =>
    (!characterQuery || normalize(`${item.name} ${item.race}`).includes(normalize(characterQuery))) &&
    (!characterRank || item.rank === characterRank) && (!characterType || item.category === characterType) &&
    (!characterElement || normalize(item.element) === normalize(characterElement))), [data?.characters, characterQuery, characterRank, characterType, characterElement])
  const ritualElements = useMemo(() => [...new Set([...(data?.elementOptions ?? []), ...unlearned.flatMap(item => item.elements), ...unlearned.map(item => item.grade4ResultElement ?? '')].filter(Boolean).map(normalize))].filter(value => !['vazio', 'escolha'].includes(value)), [data?.elementOptions, unlearned])
  const characterElements = useMemo(() => [...new Set((data?.characters ?? []).map(item => normalize(item.element)).filter(Boolean))], [data?.characters])
  const filteredRituals = useMemo(() => unlearned.filter(item =>
    (ritualDegree === null || item.degree === ritualDegree) &&
    (!ritualElement || item.elements.some(value => normalize(value) === normalize(ritualElement)) || normalize(item.grade4ResultElement ?? '') === normalize(ritualElement)) &&
    (!ritualQuery || normalize(`${item.name} ${item.elementText}`).includes(normalize(ritualQuery)))), [unlearned, ritualDegree, ritualElement, ritualQuery])
  const selectedCatalogItem = unlearned.find(item => item.id === ritualId) ?? null
  const visibleCharacters = filteredCharacters.slice(characterPage * PAGE_SIZE, (characterPage + 1) * PAGE_SIZE)
  const visibleRituals = filteredRituals.slice(ritualPage * PAGE_SIZE, (ritualPage + 1) * PAGE_SIZE)
  const visibleLearned = (character?.rituals ?? []).slice(learnedPage * 4, learnedPage * 4 + 4)
  const visibleAffinities = (character?.affinities ?? []).slice(affinityPage * 4, affinityPage * 4 + 4)

  async function load(selectedCharacterId?: string) {
    const result = selectedCharacterId ? await getGrimoireCharacterData(selectedCharacterId) : await getGrimoireData()
    setData(result)
    if (result.character) setCharacterId(result.character.id)
    setRitualId('')
  }

  useEffect(() => {
    if (!isOpen) return
    let active = true
    getGrimoireData().then(result => {
      if (!active) return
      setData(result)
      setCharacterId(result.characters[0]?.id ?? '')
      setNotice('')
    }).catch(error => {
      if (active) setNotice(error instanceof Error ? error.message : 'Não foi possível carregar o Grimório.')
    })
    return () => { active = false }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !characterId) return
    let active = true
    getGrimoireCharacterData(characterId).then(result => {
      if (active) setData(result)
    }).catch(error => {
      if (active) setNotice(error instanceof Error ? error.message : 'Não foi possível carregar o personagem.')
    })
    return () => { active = false }
  }, [isOpen, characterId])

  function run(action: () => Promise<unknown>, success: string, selectedCharacterId = characterId) {
    startTransition(async () => {
      try {
        await action()
        setNotice(success)
        setRitualXp({})
        setAffinityEdits({})
        setRitualPage(0)
        setLearnedPage(0)
        setAffinityPage(0)
        await load(selectedCharacterId)
      } catch (error) {
        setNotice(error instanceof Error ? error.message : 'Não foi possível salvar a alteração.')
      }
    })
  }

  if (!isOpen) return null

  const choices = [...GRIMOIRE_ELEMENTS.map(value => ({ value, label: ELEMENT_LABELS[value] })), ...(data?.elementOptions ?? [])
    .filter(value => !GRIMOIRE_ELEMENTS.some(element => ELEMENT_LABELS[element].toLocaleLowerCase('pt-BR') === value.toLocaleLowerCase('pt-BR')))
    .map(value => ({ value, label: value }))]

  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-2 backdrop-blur-sm sm:p-3" role="dialog" aria-modal="true" aria-labelledby="grimoire-admin-title" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <section className="relative flex h-[96vh] max-h-[1100px] w-[98vw] max-w-[1600px] flex-col overflow-hidden rounded-xl border border-bege-medio/45 bg-[#1b1022] text-bege-claro shadow-[0_0_48px_rgba(0,0,0,.55)]">
      <header className="flex items-center justify-between border-b border-bege-medio/20 bg-roxo-escuro/80 px-5 py-4">
        <div className="flex items-center gap-3"><BookOpen className="text-bege-medio" size={21}/><div><h2 id="grimoire-admin-title" className="font-title text-xl">Administrar Grimório</h2><p className="text-xs text-bege-claro/50">Vincule rituais e edite progresso por personagem.</p></div></div>
        <button type="button" onClick={onClose} aria-label="Fechar" className="rounded p-2 text-bege-medio hover:bg-white/5"><X size={19}/></button>
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 md:p-5">
        {data?.characters.length ? <section className="space-y-3 rounded-lg border border-bege-medio/20 bg-black/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-title text-xs uppercase tracking-widest text-bege-medio">Escolher personagem</h3><span className="text-[11px] text-bege-claro/45">{filteredCharacters.length} de {data.characters.length}</span></div>
          <label className="flex items-center gap-2 rounded border border-bege-medio/20 bg-roxo-escuro/75 px-3"><Search size={15} className="shrink-0 text-bege-medio"/><input value={characterQuery} onChange={event => { setCharacterQuery(event.target.value); setCharacterPage(0) }} placeholder="Buscar personagem ou raça" className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-bege-claro/35"/></label>
          <div className="grid gap-2 sm:grid-cols-3"><select aria-label="Filtrar por rank" value={characterRank} onChange={event => { setCharacterRank(event.target.value); setCharacterPage(0) }} className="rounded border border-bege-medio/20 bg-roxo-escuro px-3 py-2 text-xs"><option value="">Todos os ranks</option>{[...new Set(data.characters.map(item => item.rank))].sort().map(value => <option key={value} value={value}>Rank {value}</option>)}</select><select aria-label="Filtrar por tipo de personagem" value={characterType} onChange={event => { setCharacterType(event.target.value); setCharacterPage(0) }} className="rounded border border-bege-medio/20 bg-roxo-escuro px-3 py-2 text-xs"><option value="">Todos os tipos</option>{[...new Set(data.characters.map(item => item.category))].map(value => <option key={value} value={value}>{CATEGORY_LABELS[value] ?? value}</option>)}</select><label className="flex items-center gap-2 rounded border border-bege-medio/20 bg-roxo-escuro px-2"><ElementIcon element={characterElement} size={17}/><select aria-label="Filtrar por elemento" value={characterElement} onChange={event => { setCharacterElement(event.target.value); setCharacterPage(0) }} className="min-w-0 flex-1 bg-transparent px-1 py-2 text-xs"><option value="">Todos os elementos</option>{characterElements.map(value => <option key={value} value={value}>{value === 'escolha' ? 'Vazio · condição' : ELEMENT_LABELS[value] ?? value[0].toLocaleUpperCase('pt-BR') + value.slice(1)}</option>)}</select></label></div>
          <div className="grid gap-2 sm:grid-cols-2">{visibleCharacters.map(item => <button key={item.id} type="button" onClick={() => { setCharacterId(item.id); setRitualId(''); setRitualXp({}); setAffinityEdits({}); setRitualPage(0); setLearnedPage(0); setAffinityPage(0) }} className={`flex items-center gap-3 rounded border px-3 py-2 text-left transition ${item.id === characterId ? 'border-bege-medio/65 bg-bege-medio/10' : 'border-bege-medio/15 bg-roxo-escuro/35 hover:border-bege-medio/40'}`}><ElementIcon element={item.element} size={24}/><span className="min-w-0 flex-1"><span className="block truncate font-title text-sm">{item.name}</span><span className="block truncate text-[10px] text-bege-claro/50">{item.race} · {CATEGORY_LABELS[item.category] ?? item.category}</span></span><span className="shrink-0 text-[10px] uppercase text-bege-medio">Rank {item.rank}</span></button>)}{filteredCharacters.length === 0 && <p className="col-span-full py-4 text-center text-xs text-bege-claro/45">Nenhum personagem corresponde aos filtros.</p>}</div>
          <Pager page={characterPage} count={filteredCharacters.length} onChange={setCharacterPage}/>
          {character && <p className="text-xs text-bege-claro/50">Selecionado: <span className="text-bege-medio">{character.name}</span> · {character.affinities.length} afinidade(s) · {character.rituals.length} ritual(is) aprendido(s)</p>}
        </section> : <p className="rounded border border-dashed border-bege-medio/25 p-5 text-center text-sm text-bege-claro/60">Nenhum personagem encontrado na campanha ativa.</p>}

        {character && <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-lg border border-bege-medio/20 bg-black/10 p-4">
            <h3 className="font-title text-base text-bege-medio">Vincular ritual aprendido</h3>
            <p className="mt-1 text-xs text-bege-claro/50">O vínculo e o domínio ficam guardados neste personagem.</p>
            <div className="mt-3 grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px]">
              <div className="space-y-2">
                <label className="flex items-center gap-2 rounded border border-bege-medio/20 bg-roxo-escuro/75 px-3"><Search size={14} className="shrink-0 text-bege-medio"/><input value={ritualQuery} onChange={event => { setRitualQuery(event.target.value); setRitualPage(0); setRitualId('') }} placeholder="Buscar ritual ou elemento" className="min-w-0 flex-1 bg-transparent py-2 text-xs outline-none placeholder:text-bege-claro/35"/></label>
                <div className="grid gap-2 sm:grid-cols-2"><select aria-label="Filtrar por grau" value={ritualDegree ?? ''} onChange={event => { setRitualDegree(event.target.value ? Number(event.target.value) : null); setRitualPage(0); setRitualId('') }} className="rounded border border-bege-medio/20 bg-roxo-escuro px-3 py-2 text-xs"><option value="">Todos os graus</option>{[1, 2, 3, 4].map(value => <option key={value} value={value}>Grau {value}</option>)}</select><label className="flex items-center gap-2 rounded border border-bege-medio/20 bg-roxo-escuro px-2"><ElementIcon element={ritualElement} size={17}/><select aria-label="Filtrar por elemento" value={ritualElement} onChange={event => { setRitualElement(event.target.value); setRitualPage(0); setRitualId('') }} className="min-w-0 flex-1 bg-transparent px-1 py-2 text-xs"><option value="">Todos os elementos</option>{ritualElements.map(value => <option key={value} value={value}>{ELEMENT_LABELS[value] ?? value[0].toLocaleUpperCase('pt-BR') + value.slice(1)}</option>)}</select></label></div>
                <div className="space-y-1">{visibleRituals.map(item => <button key={item.id} type="button" onClick={() => setRitualId(item.id)} className={`flex w-full items-center gap-2 rounded border px-2.5 py-2 text-left ${ritualId === item.id ? 'border-bege-medio/60 bg-bege-medio/10' : 'border-bege-medio/10 bg-roxo-escuro/35 hover:border-bege-medio/35'}`}><span className="w-10 shrink-0 text-center font-title text-[9px] uppercase tracking-wider text-bege-medio">Grau {item.degree}</span><ElementIcon element={item.elements[0] ?? item.grade4ResultElement ?? ''} size={16}/><span className="min-w-0 flex-1 truncate font-title text-xs">{item.name}</span><span className="hidden max-w-40 truncate text-[10px] text-bege-claro/45 sm:block">{item.elementText}</span></button>)}{filteredRituals.length === 0 && <p className="py-4 text-center text-xs text-bege-claro/45">Nenhum ritual corresponde aos filtros.</p>}</div>
                <Pager page={ritualPage} count={filteredRituals.length} onChange={setRitualPage}/>
                <div className="flex items-center justify-between gap-2"><span className="text-[10px] text-bege-claro/45">{filteredRituals.length} de {unlearned.length} rituais disponíveis</span><button type="button" disabled={!ritualId || busy} onClick={() => run(() => grantCharacterRitual(character.id, ritualId), 'Ritual vinculado ao personagem.')} className="rounded border border-bege-medio/35 px-4 py-2 font-title text-xs uppercase tracking-wider text-bege-medio hover:bg-bege-medio/10 disabled:opacity-40">Vincular ritual</button></div>
              </div>
              <div className="rounded-lg border border-bege-medio/15 bg-roxo-escuro/40 p-3">{selectedCatalogItem ? <><p className="mb-2 text-center text-[9px] uppercase tracking-[.18em] text-bege-medio">Prévia da carta · Grau {selectedCatalogItem.degree}</p><div className="mx-auto max-w-40 rounded border-2 border-bege-medio/35 bg-[linear-gradient(145deg,#34223e,#1a1022)] p-2"><div className="aspect-[4/3]"><SigilArt ritual={selectedCatalogItem}/></div><h4 className="mt-2 line-clamp-2 text-center font-title text-sm">{selectedCatalogItem.name}</h4><p className="mt-1 text-center text-[9px] text-bege-claro/55">{selectedCatalogItem.elementText}</p></div><p className="mt-2 line-clamp-3 text-xs leading-relaxed text-bege-claro/55">{selectedCatalogItem.effect ?? 'Efeito não definido.'}</p></> : <p className="flex h-full min-h-32 items-center justify-center text-center text-xs text-bege-claro/40">Selecione um ritual para ver a prévia da carta.</p>}</div>
            </div>

            <h4 className="mt-5 border-b border-bege-medio/15 pb-2 font-title text-xs uppercase tracking-widest text-bege-claro/65">Rituais vinculados</h4>
            <div className="mt-2 space-y-2">{character.rituals.length ? visibleLearned.map(ritual => <div key={ritual.id} className="rounded border border-bege-medio/15 bg-roxo-escuro/45 p-3"><div className="flex items-start justify-between gap-2"><div><p className="font-title text-sm">{ritual.name}</p><p className="text-[11px] text-bege-claro/50">Grau {ritual.degree} · {ritual.elementText}{ritual.domainXpMax === null ? ' · Limite não definido' : ` · Máximo ${ritual.domainXpMax} XP`}</p></div><button type="button" disabled={busy} onClick={() => run(() => removeCharacterRitual(character.id, ritual.id), 'Vínculo do ritual removido.')} aria-label={`Desvincular ${ritual.name}`} title="Desvincular ritual" className="rounded p-1.5 text-red-200/70 hover:bg-red-300/10 disabled:opacity-40"><Trash2 size={15}/></button></div><div className="mt-2 flex items-center gap-2"><label htmlFor={`ritual-xp-${ritual.id}`} className="text-xs text-bege-claro/60">Domínio (XP)</label><input id={`ritual-xp-${ritual.id}`} type="number" min="0" max={ritual.domainXpMax ?? undefined} value={ritualXp[ritual.id] ?? String(ritual.masteryXp)} onChange={event => setRitualXp(current => ({ ...current, [ritual.id]: event.target.value }))} className="w-28 rounded border border-bege-medio/20 bg-[#130c19] px-2 py-1 text-sm"/><button type="button" disabled={busy} onClick={() => run(() => adjustRitualMastery(character.id, ritual.id, Number(ritualXp[ritual.id] ?? ritual.masteryXp)), 'Domínio do ritual atualizado.')} className="rounded border border-bege-medio/25 px-3 py-1 text-[10px] uppercase text-bege-medio hover:bg-bege-medio/10 disabled:opacity-40">Salvar</button></div></div>) : <p className="py-4 text-center text-xs text-bege-claro/45">Este personagem ainda não tem rituais vinculados.</p>}</div>
            <Pager page={learnedPage} count={character.rituals.length} pageSize={4} onChange={setLearnedPage}/>
          </section>

          <section className="rounded-lg border border-bege-medio/20 bg-black/10 p-4">
            <h3 className="font-title text-base text-bege-medio">Afinidades do personagem</h3>
            <p className="mt-1 text-xs text-bege-claro/50">Edite estágio e XP, conceda ou remova afinidades.</p>
            <div className="mt-3 space-y-2">{character.affinities.length ? visibleAffinities.map(item => {
              const edit = affinityEdits[item.element] ?? { stage: String(item.stage), xp: String(item.stageXp) }
              return <div key={item.id} className="flex flex-wrap items-center gap-2 rounded border border-bege-medio/15 bg-roxo-escuro/45 p-3"><div className="min-w-24 flex-1"><p className="font-title text-sm">{ELEMENT_LABELS[item.element] ?? item.element}</p><p className="text-[10px] text-bege-claro/45">{item.source === 'RACIAL' ? `Natural · Rank ${item.racialRank ?? '—'}` : 'Concedida'}</p></div><select aria-label={`Estágio de ${item.element}`} value={edit.stage} onChange={event => setAffinityEdits(current => ({ ...current, [item.element]: { ...edit, stage: event.target.value } }))} className="rounded border border-bege-medio/20 bg-[#130c19] px-2 py-1 text-xs">{AFFINITY_STAGES.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}</select><input aria-label={`XP de ${item.element}`} type="number" min="0" max="1000" value={edit.xp} onChange={event => setAffinityEdits(current => ({ ...current, [item.element]: { ...edit, xp: event.target.value } }))} className="w-24 rounded border border-bege-medio/20 bg-[#130c19] px-2 py-1 text-sm"/><button type="button" disabled={busy} onClick={() => run(() => setCharacterElementAffinity(character.id, item.element, Number(edit.stage), Number(edit.xp)), 'Afinidade atualizada.')} className="rounded border border-bege-medio/25 px-2 py-1 text-[10px] uppercase text-bege-medio hover:bg-bege-medio/10 disabled:opacity-40">Salvar</button><button type="button" disabled={busy} onClick={() => run(() => removeCharacterElementAffinity(character.id, item.element), 'Afinidade removida.')} aria-label={`Remover afinidade ${item.element}`} title="Remover afinidade" className="rounded p-1.5 text-red-200/70 hover:bg-red-300/10 disabled:opacity-40"><Trash2 size={15}/></button></div>
            }) : <p className="py-4 text-center text-xs text-bege-claro/45">Este personagem ainda não tem afinidades registradas.</p>}</div>
            <Pager page={affinityPage} count={character.affinities.length} pageSize={4} onChange={setAffinityPage}/>

            <h4 className="mt-5 border-b border-bege-medio/15 pb-2 font-title text-xs uppercase tracking-widest text-bege-claro/65">Conceder afinidade</h4>
            <div className="mt-2 grid grid-cols-2 gap-2"><select value={affinity} onChange={event => setAffinity(event.target.value)} className="rounded border border-bege-medio/20 bg-roxo-escuro px-2 py-2 text-xs">{choices.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select><select value={stage} onChange={event => setStage(event.target.value)} className="rounded border border-bege-medio/20 bg-roxo-escuro px-2 py-2 text-xs">{AFFINITY_STAGES.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}</select><input aria-label="XP inicial da afinidade" type="number" min="0" max="1000" value={stageXp} onChange={event => setStageXp(event.target.value)} className="rounded border border-bege-medio/20 bg-[#130c19] px-2 py-2 text-sm"/><button type="button" disabled={busy} onClick={() => run(() => setCharacterElementAffinity(character.id, affinity, Number(stage), Number(stageXp)), 'Afinidade concedida ou atualizada.')} className="rounded border border-bege-medio/35 px-3 py-2 font-title text-[10px] uppercase tracking-wider text-bege-medio hover:bg-bege-medio/10 disabled:opacity-40">Conceder / editar</button></div>
          </section>
        </div>}

        {notice && <p role="status" className="rounded border border-bege-medio/20 bg-roxo-escuro/60 px-3 py-2 text-sm text-bege-medio">{notice}</p>}
        {busy && <p className="flex items-center gap-2 text-xs text-bege-claro/50"><LoaderCircle size={14} className="animate-spin"/>Salvando alteração…</p>}
      </div>
    </section>
  </div>
}
