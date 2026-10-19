"use client"

/* eslint-disable @next/next/no-img-element */
import { useCallback, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'
import MillieModal from '@/componentes/ui/MillieModal'
import MillieInput from '@/componentes/ui/MillieInput'
import MillieTextarea from '@/componentes/ui/MillieTextarea'
import MillieSelect from '@/componentes/ui/MillieSelect'
import MillieImageUpload from '@/componentes/ui/MillieImageUpload'
import { PrimaryButton } from '@/componentes/PrimaryButton'
import CriarHabilidadeModal from '@/componentes/modais/CriarHabilidadeModal'
import { useToast } from '@/componentes/ui/ToastProvider'
import { createAtlasRace, createAtlasUniverse, createAtlasWorld, revealAtlasEntry, updateAtlasRace, updateAtlasUniverse, updateAtlasWorld } from '@/app/actions/atlas'
import AtlasCosmicMap from '@/componentes/atlas/AtlasCosmicMap'
import AtlasSidebar from '@/componentes/atlas/AtlasSidebar'
import AtlasLibraryView from '@/componentes/atlas/AtlasLibraryView'

type Skill = { id: string; name: string; description: string; branch: string; maxLevel: number; element: string; visibility: string }
type Race = { id: string; name: string; element: string; baseRank: string; description: string | null; image: string | null; appearance: string; biology: string; culture: string; masterNotes: string; visibility: string; canAscend: boolean; canCorrupt: boolean; skills: Skill[] }
type World = { id: string; name: string; description: string; imageUrl: string | null; visibility: string; races: Race[] }
type Universe = { id: string; name: string; description: string; artworkUrl: string | null; artStyle: string; kind: string; visibility: string; worlds: World[] }
type Data = { isMaster: boolean; universes: Universe[] }

type Form = Record<string, string | boolean>
const EMPTY: Form = { name: '', description: '', artStyle: '', artworkUrl: '', imageUrl: '', image: '', kind: 'universe', visibility: 'PUBLIC', element: 'terra', baseRank: 'D', appearance: '', biology: '', culture: '', masterNotes: '', canAscend: false, canCorrupt: false }

const elementLabels: Record<string, string> = { agua: 'Água', fogo: 'Fogo', terra: 'Terra', vento: 'Vento', luz: 'Luz', trevas: 'Trevas' }

function RaceInsignia({ element, rank, compact = false }: { element: string; rank: string; compact?: boolean }) {
  const normalizedElement = element.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const normalizedRank = rank.toUpperCase()
  const elementLabel = elementLabels[normalizedElement] ?? element
  return <span className={`flex items-center gap-3 ${compact ? 'text-[10px]' : 'text-xs'}`}>
    <span className="inline-flex items-center gap-1.5 border border-bege-escuro/35 bg-black/15 px-2 py-1 uppercase tracking-wider text-bege-claro/85"><img src={`/assets/svgs/elemento/${normalizedElement}.svg`} alt="" className={`${compact ? 'h-5 w-5' : 'h-7 w-7'} object-contain`} /><span>{elementLabel}</span></span>
    <span className="inline-flex items-center gap-1.5 border border-bege-escuro/35 bg-black/15 px-2 py-1 uppercase tracking-wider text-bege-claro/85"><img src={`/assets/svgs/rank/${normalizedRank}.svg`} alt={`Brasão de Rank ${normalizedRank}`} className={`${compact ? 'h-6 w-5' : 'h-8 w-6'} object-contain`} /><span>Rank {normalizedRank}</span></span>
  </span>
}


function PageCorners() {
  return (
    <>
      <Image src="/assets/svgs/corner-left-top.svg" alt="" width={100} height={100} className="pointer-events-none absolute left-0 top-0 z-30 h-14 w-14 opacity-80 md:h-20 md:w-20" />
      <Image src="/assets/svgs/corner-right-top.svg" alt="" width={100} height={100} className="pointer-events-none absolute right-0 top-0 z-30 h-14 w-14 opacity-80 md:h-20 md:w-20" />
      <Image src="/assets/svgs/corner-left-bottom.svg" alt="" width={100} height={100} className="pointer-events-none absolute bottom-0 left-0 z-30 h-14 w-14 opacity-80 md:h-20 md:w-20" />
      <Image src="/assets/svgs/corner-right-bottom.svg" alt="" width={100} height={100} className="pointer-events-none absolute bottom-0 right-0 z-30 h-14 w-14 opacity-80 md:h-20 md:w-20" />
    </>
  )
}

export default function AtlasClient({ data }: { data: Data }) {
  const router = useRouter()
  const toast = useToast()
  const [pending, startTransition] = useTransition()
  const [level, setLevel] = useState<'cosmos' | 'universe' | 'world' | 'race'>('cosmos')
  const [universeId, setUniverseId] = useState('')
  const [worldId, setWorldId] = useState('')
  const [raceId, setRaceId] = useState('')
  const [visibleUniverseIds, setVisibleUniverseIds] = useState<string[]>(data.universes.filter((item) => item.kind !== 'origin').map((item) => item.id))
  const [atlasSection, setAtlasSection] = useState<'universes' | 'worlds' | 'races' | 'skills'>('universes')
  const [modal, setModal] = useState<'' | 'universe' | 'world' | 'race'>('')
  const [form, setForm] = useState<Form>(EMPTY)
  const [editing, setEditing] = useState(false)
  const [skillOpen, setSkillOpen] = useState(false)

  const universe = data.universes.find((item) => item.id === universeId)
  const world = universe?.worlds.find((item) => item.id === worldId)
  const race = world?.races.find((item) => item.id === raceId)
  const visibleUniverses = data.universes.filter((item) => visibleUniverseIds.includes(item.id) && item.kind !== 'origin')
  const selected = level === 'race' ? race : level === 'world' ? world : level === 'universe' ? universe : null

  function openForm(type: typeof modal, entry?: Universe | World | Race) {
    setModal(type)
    setEditing(!!entry)
    setForm(entry ? { ...EMPTY, ...entry, description: entry.description ?? '' } as unknown as Form : { ...EMPTY, ...(type === 'world' && universe ? { universeId: universe.id } : {}), ...(type === 'race' && world ? { universeWorldId: world.id } : {}) })
  }
  function set(key: string, value: string | boolean) { setForm((current) => ({ ...current, [key]: value })) }
  function run(action: () => Promise<unknown>, success: string) {
    startTransition(async () => { try { await action(); toast.success(success); setModal(''); router.refresh() } catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível salvar o registro.') } })
  }
  function save() {
    const f = form as Form & { id?: string }
    if (modal === 'universe') run(() => editing && f.id ? updateAtlasUniverse(f.id, f as never) : createAtlasUniverse(f as never), editing ? 'Universo atualizado.' : 'Universo adicionado ao Atlas.')
    if (modal === 'world') run(() => editing && f.id ? updateAtlasWorld(f.id, f as never) : createAtlasWorld(f as never), editing ? 'Mundo atualizado.' : 'Mundo adicionado ao Atlas.')
    if (modal === 'race') run(() => editing && f.id ? updateAtlasRace(f.id, f as never) : createAtlasRace(f as never), editing ? 'Raça atualizada.' : 'Raça adicionada ao Atlas.')
  }
  const enterUniverse = useCallback((id: string) => { setUniverseId(id); setWorldId(''); setRaceId(''); setLevel('universe') }, [])
  function navigateSection(section: typeof atlasSection) {
    setAtlasSection(section)
    setLevel('cosmos')
  }
  function goBack() { if (level === 'race') setLevel('world'); else if (level === 'world') setLevel('universe'); else if (level === 'universe') setLevel('cosmos') }
  const selectSearchResult = useCallback((id: string) => {
    for (const u of data.universes) {
      if (u.id === id) { enterUniverse(u.id); return }
      for (const w of u.worlds) {
        if (w.id === id) { setUniverseId(u.id); setWorldId(w.id); setLevel('world'); return }
        const r = w.races.find((item) => item.id === id)
        if (r) { setUniverseId(u.id); setWorldId(w.id); setRaceId(r.id); setLevel('race'); return }
      }
    }
  }, [data.universes, enterUniverse])
  const handleVisibleUniversesChange = useCallback((ids: string[]) => setVisibleUniverseIds(ids), [])
  async function reveal(type: string, id: string) { try { await revealAtlasEntry(type, id); toast.success('Registro descoberto nesta campanha.'); router.refresh() } catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível revelar.') } }

  const button = 'border border-bege-escuro/40 bg-roxo-escuro/40 px-4 py-2 font-title text-xs uppercase tracking-[0.12em] text-bege-claro transition hover:border-bege-medio hover:bg-bege-escuro/10'
  const formVisibility = [{ value: 'PUBLIC', label: 'Público' }, { value: 'DISCOVERED', label: 'Descoberto na campanha' }, { value: 'MASTER_ONLY', label: 'Somente Mestre' }]

  return <main className="mx-auto min-h-[75vh] max-w-[1800px] px-3 pb-10 text-bege-claro md:px-5">
    <div className="relative isolate min-h-[78vh] overflow-hidden border border-bege-escuro/35 bg-[#100a16] shadow-[0_18px_80px_rgba(0,0,0,.42)]">
      <PageCorners />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(102,75,126,0.18),transparent_58%)]" />
      <div aria-hidden className="atlas-star-pulse absolute inset-0 opacity-25" style={{ backgroundImage: 'radial-gradient(1px 1px at 18% 22%,#f0d89b 99%,transparent),radial-gradient(1px 1px at 76% 34%,#f0d89b 99%,transparent),radial-gradient(1.5px 1.5px at 56% 72%,#fff 99%,transparent),radial-gradient(1px 1px at 31% 81%,#fff 99%,transparent),radial-gradient(1px 1px at 88% 77%,#f0d89b 99%,transparent)' }} />
      <div className="relative z-10 grid min-h-[78vh] lg:grid-cols-[320px_minmax(0,1fr)]">
        <AtlasSidebar universes={data.universes} isMaster={data.isMaster} selectedUniverseId={universeId} onCreateUniverse={() => openForm('universe')} onSelectUniverse={enterUniverse} onSelectEntity={selectSearchResult} onVisibleUniversesChange={handleVisibleUniversesChange}/>
        <section className="relative flex min-w-0 min-h-[75vh] flex-col p-4 md:p-7 lg:p-9">
          <nav className="mb-7 flex flex-wrap gap-2 border-b border-bege-escuro/20 pb-4 pr-8" aria-label="Seções do Atlas">{([['universes','Universos'],['worlds','Mundos'],['races','Raças'],['skills','Habilidades']] as const).map(([key,label]) => <button key={key} onClick={() => navigateSection(key)} className={`px-3 py-2 font-title text-[10px] uppercase tracking-[.13em] transition md:text-xs ${atlasSection === key ? 'border-b border-bege-medio text-bege-claro' : 'text-bege-medio/55 hover:text-bege-claro'}`}>{label}</button>)}</nav>
          {!(level === 'cosmos' && atlasSection !== 'universes') && <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><p className="font-title text-[10px] uppercase tracking-[0.22em] text-bege-medio/60">{level === 'cosmos' ? 'Mapa cosmológico interativo' : 'Arquivo das linhagens'}</p><h1 className="mt-1 font-title text-2xl uppercase tracking-[0.12em] md:text-3xl">{level === 'cosmos' ? 'Entre as linhagens' : selected?.name}</h1>{level === 'universe' && universe?.description && <p className="mt-2 max-w-2xl text-xs text-bege-claro/60">{universe.description}</p>}</div><div className="flex gap-2">{level !== 'cosmos' && <button className={button} onClick={goBack}><ArrowLeft className="mr-2 inline" size={14}/>Voltar</button>}{data.isMaster && level === 'universe' && universe && <button className={button} onClick={() => openForm('universe', universe)}>Editar núcleo</button>}{data.isMaster && level === 'universe' && <button className={button} onClick={() => openForm('world')}>+ Mundo</button>}{data.isMaster && level === 'world' && world && <button className={button} onClick={() => openForm('world', world)}>Editar mundo</button>}{data.isMaster && level === 'world' && <button className={button} onClick={() => openForm('race')}>+ Raça</button>}{data.isMaster && level === 'race' && race && <button className={button} onClick={() => openForm('race', race)}>Editar raça</button>}</div></div>}
          {level === 'cosmos' && atlasSection === 'universes' && <AtlasCosmicMap universes={visibleUniverses} isMaster={data.isMaster} originUniverseId={data.universes.find((item) => item.kind === 'origin')?.id} onSelectUniverse={enterUniverse} onCreateUniverse={() => openForm('universe')}/>}
          {level === 'cosmos' && atlasSection !== 'universes' && <AtlasLibraryView section={atlasSection} universes={data.universes} isMaster={data.isMaster} onSelectWorld={(u, w) => { setUniverseId(u); setWorldId(w); setRaceId(''); setLevel('world') }} onSelectRace={(u, w, r) => { setUniverseId(u); setWorldId(w); setRaceId(r); setLevel('race') }} onEditWorld={(item) => openForm('world', item)} onEditRace={(item) => openForm('race', item)}/>}
          {level === 'universe' && universe && <div className="flex flex-1 flex-col gap-4">{universe.artStyle && <p className="text-[10px] uppercase tracking-widest text-bege-medio/60">Linguagem visual · {universe.artStyle}</p>}<AtlasLibraryView section="worlds" universes={[universe]} isMaster={data.isMaster} onSelectWorld={(u, w) => { setUniverseId(u); setWorldId(w); setRaceId(''); setLevel('world') }} onSelectRace={(u, w, r) => { setUniverseId(u); setWorldId(w); setRaceId(r); setLevel('race') }} onEditWorld={(item) => openForm('world', item)} onEditRace={(item) => openForm('race', item)}/></div>}
          {level === 'world' && world && <div className="flex flex-1 flex-col gap-4"><p className="max-w-3xl text-sm text-bege-claro/65">{world.description || 'Arquivo deste mundo e de suas linhagens.'}</p><AtlasLibraryView section="races" universes={universe ? [universe] : []} initialWorldId={world.id} isMaster={data.isMaster} onSelectWorld={(u, w) => { setUniverseId(u); setWorldId(w); setLevel('world') }} onSelectRace={(u, w, r) => { setUniverseId(u); setWorldId(w); setRaceId(r); setLevel('race') }} onEditWorld={(item) => openForm('world', item)} onEditRace={(item) => openForm('race', item)}/></div>}
          {level === 'race' && race && <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(250px,360px)]"><article className="space-y-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-title text-xs uppercase tracking-[0.18em] text-bege-medio">Linhagem · {world?.name}</p><h2 className="mt-2 font-title text-3xl uppercase tracking-wider">{race.name}</h2></div><RaceInsignia element={race.element} rank={race.baseRank} /></div><p className="leading-relaxed text-bege-claro/75">{race.description || 'Ainda não há descrição registrada.'}</p><div className="grid gap-4 sm:grid-cols-2">{[['Aparência', race.appearance], ['Biologia', race.biology], ['Cultura', race.culture]].map(([label, value]) => <section key={label} className="border-t border-bege-escuro/25 pt-3"><h3 className="mb-2 font-title text-xs uppercase tracking-widest text-bege-medio">{label}</h3><p className="whitespace-pre-wrap text-sm leading-relaxed text-bege-claro/70">{value || 'Sem registro.'}</p></section>)}</div>{data.isMaster && race.masterNotes && <p className="border border-amber-200/20 bg-amber-950/20 p-4 text-sm text-amber-100/70"><strong>Notas do Mestre:</strong> {race.masterNotes}</p>}</article><aside className="border-t border-bege-escuro/25 pt-4 lg:border-l lg:border-t-0 lg:pl-5"><div className="mb-3 flex items-center justify-between"><h3 className="font-title text-xs uppercase tracking-widest text-bege-medio">Habilidades inatas</h3>{data.isMaster && <button onClick={() => setSkillOpen(true)} className="text-xs text-bege-medio hover:text-bege-claro">+ adicionar</button>}</div><div className="space-y-3">{race.skills.map((skill) => <article key={skill.id} className="border border-bege-escuro/25 bg-black/10 p-3"><p className="font-title text-sm uppercase tracking-wide">{skill.name}</p><p className="mt-1 text-xs text-bege-medio/60">{skill.branch} · {skill.element} · {skill.maxLevel} forma(s)</p><p className="mt-2 text-sm text-bege-claro/70">{skill.description}</p>{data.isMaster && skill.visibility !== 'PUBLIC' && <span className="mt-2 block text-[10px] uppercase text-bege-medio/50">{skill.visibility === 'MASTER_ONLY' ? 'Somente mestre' : 'Descoberta'}</span>}</article>)}{!race.skills.length && <p className="text-sm text-bege-medio/55">Nenhuma habilidade inata registrada.</p>}</div>{data.isMaster && <div className="mt-5 space-y-2 border-t border-bege-escuro/20 pt-4"><button className={`${button} w-full`} onClick={() => openForm('race', race)}>Editar linhagem</button><button className={`${button} w-full`} onClick={() => void reveal('race', race.id)}>Marcar linhagem como descoberta</button>{race.skills.map((skill) => <button key={skill.id} className={`${button} w-full`} onClick={() => void reveal('skill', skill.id)}>Revelar: {skill.name}</button>)}</div>}</aside></div>}
        </section>
      </div>
    </div>

    <MillieModal isOpen={!!modal} onClose={() => setModal('')} title={`${editing ? 'Editar' : 'Criar'} ${modal === 'universe' ? 'universo' : modal === 'world' ? 'mundo' : 'linhagem'}`} maxWidth="max-w-3xl">
      <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-2">
        {modal === 'universe' && <><MillieInput label="Nome do universo" value={String(form.name)} onChange={(e) => set('name', e.target.value)}/><MillieTextarea label="Descrição" value={String(form.description)} onChange={(e) => set('description', e.target.value)} rows={3}/><MillieInput label="Linguagem artística" value={String(form.artStyle)} onChange={(e) => set('artStyle', e.target.value)} placeholder="Ex.: gravura gótica, aquarela celestial"/><MillieSelect label="Tipo de universo" options={[...(editing && form.kind === 'origin' ? [{ value: 'origin', label: 'Núcleo de origem' }] : []), { value: 'universe', label: 'Universo' }, { value: 'multiversal', label: 'Multiversal' }]} value={String(form.kind)} onChange={(e) => set('kind', e.target.value)}/>{form.kind === 'origin' ? <p className="text-xs text-bege-medio/60">O Primordial é representado pelo núcleo central dourado e não precisa de imagem.</p> : <MillieImageUpload label="Imagem do universo" value={String(form.artworkUrl)} onChange={(url) => set('artworkUrl', url)}/>}<MillieSelect label="Visibilidade" options={formVisibility} value={String(form.visibility)} onChange={(e) => set('visibility', e.target.value)}/></>}
        {modal === 'world' && <><MillieInput label="Nome do mundo" value={String(form.name)} onChange={(e) => set('name', e.target.value)}/><MillieTextarea label="Descrição" value={String(form.description)} onChange={(e) => set('description', e.target.value)} rows={3}/><MillieImageUpload label="Imagem do mundo (upload externo)" value={String(form.imageUrl)} onChange={(url) => set('imageUrl', url)}/><MillieSelect label="Visibilidade" options={formVisibility} value={String(form.visibility)} onChange={(e) => set('visibility', e.target.value)}/></>}
        {modal === 'race' && <><MillieInput label="Nome da linhagem / raça" value={String(form.name)} onChange={(e) => set('name', e.target.value)}/><div className="grid gap-3 sm:grid-cols-2"><MillieSelect label="Elemento" options={['fogo','agua','terra','vento','luz','trevas'].map((v) => ({ value: v, label: v }))} value={String(form.element)} onChange={(e) => set('element', e.target.value)}/><MillieSelect label="Rank natural" options={['E','D','C','B','A','S'].map((v) => ({ value: v, label: `Rank ${v}` }))} value={String(form.baseRank)} onChange={(e) => set('baseRank', e.target.value)}/></div><MillieTextarea label="Descrição" value={String(form.description)} onChange={(e) => set('description', e.target.value)} rows={3}/><MillieImageUpload label="Imagem da linhagem (upload externo)" value={String(form.image)} onChange={(url) => set('image', url)}/><MillieTextarea label="Aparência" value={String(form.appearance)} onChange={(e) => set('appearance', e.target.value)} rows={2}/><MillieTextarea label="Biologia" value={String(form.biology)} onChange={(e) => set('biology', e.target.value)} rows={2}/><MillieTextarea label="Cultura" value={String(form.culture)} onChange={(e) => set('culture', e.target.value)} rows={2}/><MillieTextarea label="Notas do Mestre" value={String(form.masterNotes)} onChange={(e) => set('masterNotes', e.target.value)} rows={2}/><MillieSelect label="Visibilidade" options={formVisibility} value={String(form.visibility)} onChange={(e) => set('visibility', e.target.value)}/><div className="flex gap-5 text-sm"><label><input type="checkbox" checked={Boolean(form.canAscend)} onChange={(e) => set('canAscend', e.target.checked)}/> Pode ascender</label><label><input type="checkbox" checked={Boolean(form.canCorrupt)} onChange={(e) => set('canCorrupt', e.target.checked)}/> Pode corromper</label></div></>}
        <div className="flex justify-end"><PrimaryButton onClick={save} disabled={pending}>{pending ? 'Salvando…' : editing ? 'Salvar alterações' : 'Adicionar ao Atlas'}</PrimaryButton></div>
      </div>
    </MillieModal>
    {race && <CriarHabilidadeModal isOpen={skillOpen} onClose={() => setSkillOpen(false)} initialOrigin="innate" initialTargetId={race.id}/>}
  </main>
}
