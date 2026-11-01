'use client'

import { useMemo, useState, useTransition } from 'react'
import { Crown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { GrimoireData } from '@/lib/types/grimoire'
import { AFFINITY_STAGES, GRIMOIRE_ELEMENTS } from '@/lib/types/grimoire'
import { adjustRitualMastery, grantCharacterRitual, recordGrimoireActivity, recordRitualLearningOutcome, removeCharacterElementAffinity, removeCharacterRitual, setCharacterElementAffinity, updateGrimoireConfig, updateRitualCatalogEntry } from '@/app/actions/grimoire'
import { GrimoireHeader } from './GrimoireHeader'
import { AffinityPanel } from './AffinityPanel'
import { RitualCollection } from './RitualCollection'
import { RitualDetailsPanel, type ActivityKind } from './RitualDetailsPanel'
import { EmptyNotice } from './EmptyNotice'

const ELEMENT_NAMES: Record<string, string> = { luz: 'Luz', vento: 'Vento', fogo: 'Fogo', trevas: 'Trevas', terra: 'Terra', agua: 'Água' }
const normalize = (v: string) => v.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '')

export default function GrimoireClient({ data }: { data: GrimoireData }) {
  const router = useRouter()
  const [characterId, setCharacterId] = useState(data.character?.id ?? '')
  const [selectedId, setSelectedId] = useState(data.character?.rituals[0]?.id ?? '')
  const [detailOpen, setDetailOpen] = useState(false)
  const [activityElement, setActivityElement] = useState('')
  const [adminOpen, setAdminOpen] = useState(false)
  const [busy, startTransition] = useTransition()
  const [message, setMessage] = useState('')
  const character = data.character
  const learned = useMemo(() => character?.rituals ?? [], [character?.rituals])
  const selected = learned.find(ritual => ritual.id === selectedId) ?? null
  const affinities = character?.affinities ?? []
  const learnedSet = useMemo(() => new Set(learned.map(ritual => ritual.id)), [learned])
  const run = (fn: () => Promise<unknown>, success = 'Alteração salva.') => startTransition(async () => { try { await fn(); setMessage(success); router.refresh() } catch (e) { setMessage(e instanceof Error ? e.message : 'Não foi possível salvar.') } })
  const handleActivity = (kind: ActivityKind, element?: string) => {
    if (!character || !selected) return
    run(() => recordGrimoireActivity({ characterId: character.id, ritualId: selected.id, kind, affinityElement: element }), kind === 'failure' ? 'Tentativa fracassada registrada sem XP.' : 'Atividade registrada.')
  }

  if (!data.hasCampaign) return <EmptyNotice title="Entre em uma campanha" text="O Grimório fica disponível dentro de uma campanha da Escola dos Mil Mundos." />

  return <main className="w-full min-h-[75vh] pb-10 text-bege-claro">
    <GrimoireHeader
      character={character}
      characters={data.characters}
      characterId={characterId}
      isMaster={data.isMaster}
      onCharacterChange={id => { setCharacterId(id); setSelectedId(''); setDetailOpen(false); router.replace(`/grimorio?characterId=${encodeURIComponent(id)}`) }}
      onToggleAdmin={() => setAdminOpen(current => !current)}
    />

    {data.isMaster && adminOpen && character && <AdminPanel data={data} characterId={character.id} learnedIds={learnedSet} run={run} busy={busy}/>}
    {message && <p role="status" className="mb-4 rounded border border-bege-medio/30 bg-roxo-escuro/70 p-3 text-sm text-bege-medio">{message}</p>}
    {!character ? <EmptyNotice title={data.isMaster ? 'Selecione um personagem' : 'Personagem não encontrado'} text={data.isMaster ? 'Escolha um personagem para consultar ou administrar sua coleção.' : 'Sua conta ainda não tem um personagem nesta campanha.'}/> : <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[230px_minmax(0,1fr)] 2xl:grid-cols-[300px_minmax(0,1fr)_310px]">
      <AffinityPanel affinities={affinities}/>
      <RitualCollection rituals={learned} catalogCount={data.catalogCount} elementOptions={data.elementOptions} selectedId={selectedId} onSelect={id => { setSelectedId(id); setDetailOpen(true) }} onSelectionResolved={id => setSelectedId(current => current === id ? current : id)}/>
      <div className="hidden 2xl:block"><RitualDetailsPanel ritual={selected} isMaster={data.isMaster} affinities={affinities} activityElement={activityElement} onActivityElementChange={setActivityElement} onActivity={handleActivity} busy={busy}/></div>
    </div>}
    {character && detailOpen && selected && <RitualDetailsPanel ritual={selected} isMaster={data.isMaster} affinities={affinities} activityElement={activityElement} onActivityElementChange={setActivityElement} onActivity={handleActivity} onClose={() => setDetailOpen(false)} overlay busy={busy}/>}
  </main>
}

function AdminPanel({data,characterId,learnedIds,run,busy}:{data:GrimoireData;characterId:string;learnedIds:Set<string>;run:(fn:()=>Promise<unknown>,success?:string)=>void;busy:boolean}) {
  const [ritualId,setRitualId]=useState(''); const [xp,setXp]=useState(''); const [filter,setFilter]=useState(''); const [aff,setAff]=useState('luz'); const [removeAff,setRemoveAff]=useState(''); const [stage,setStage]=useState('1'); const [stageXp,setStageXp]=useState('0')
  const [editId,setEditId]=useState(''); const editable=data.catalog.find(r=>r.id===editId)
  const [configJson,setConfigJson]=useState(JSON.stringify({
    affinitySuccessXpByDegree:data.config.affinitySuccessXpByDegree,
    affinityPracticeXpByDegree:data.config.affinityPracticeXpByDegree,
    affinityStudyXpByDegree:data.config.affinityStudyXpByDegree,
    domainSuccessXpByRitual:data.config.domainSuccessXpByRitual,
    domainPracticeXpByRitual:data.config.domainPracticeXpByRitual,
    difficultyModifiers:data.config.difficultyModifiers,
    repetitionDiminishingRule:data.config.repetitionDiminishingRule,
  },null,2))
  const available=data.catalog.filter(r=>!learnedIds.has(r.id)&&(!filter||r.name.toLocaleLowerCase('pt-BR').includes(filter.toLocaleLowerCase('pt-BR')))).slice(0,100)
  return <section className="mb-5 rounded-xl border border-amber-200/30 bg-[#21142b] p-4"><h2 className="mb-3 flex items-center gap-2 font-title text-lg"><Crown size={16} className="text-amber-200"/>Ferramentas do Mestre</h2><div className="grid gap-4 lg:grid-cols-3">
    <div className="space-y-2 rounded border border-bege-medio/15 p-3"><h3 className="text-sm text-bege-medio">Coleção do personagem</h3><input placeholder="Buscar no catálogo" value={filter} onChange={e=>setFilter(e.target.value)} className="w-full rounded bg-roxo-escuro p-2 text-xs"/><select value={ritualId} onChange={e=>setRitualId(e.target.value)} className="w-full rounded bg-roxo-escuro p-2 text-xs"><option value="">Selecionar ritual</option>{available.map(r=><option key={r.id} value={r.id}>G{r.degree} · {r.name}</option>)}</select><div className="flex flex-wrap gap-2"><button disabled={busy||!ritualId} onClick={()=>run(()=>grantCharacterRitual(characterId,ritualId),'Ritual concedido.')} className="rounded border border-bege-medio/30 px-3 py-1 text-xs disabled:opacity-40">Conceder ritual</button><button disabled={busy||!ritualId} onClick={()=>run(()=>recordRitualLearningOutcome(characterId,ritualId,true),'Aprendizado bem-sucedido registrado; o ritual entrou na coleção.')} className="rounded border border-bege-medio/30 px-2 py-1 text-xs disabled:opacity-40">Aprendeu</button><button disabled={busy||!ritualId} onClick={()=>run(()=>recordRitualLearningOutcome(characterId,ritualId,false),'Tentativa de aprendizado falhou; nenhum XP foi concedido.')} className="rounded border border-bege-medio/30 px-2 py-1 text-xs disabled:opacity-40">Falhou</button></div><div className="flex gap-2"><input aria-label="XP de domínio" type="number" min="0" value={xp} onChange={e=>setXp(e.target.value)} placeholder="XP Domínio" className="w-28 rounded bg-roxo-escuro p-2 text-xs"/><button disabled={!ritualId||!learnedIds.has(ritualId)||busy} onClick={()=>run(()=>adjustRitualMastery(characterId,ritualId,Number(xp)),'XP de domínio ajustado.')} className="rounded border border-bege-medio/30 px-2 text-xs disabled:opacity-40">Ajustar XP</button><button disabled={!ritualId||!learnedIds.has(ritualId)||busy} onClick={()=>run(()=>removeCharacterRitual(characterId,ritualId),'Ritual removido.')} className="rounded border border-red-200/20 px-2 text-xs disabled:opacity-40">Remover</button></div></div>
    <div className="space-y-2 rounded border border-bege-medio/15 p-3"><h3 className="text-sm text-bege-medio">Afinidade elemental</h3><div className="flex gap-2"><select value={aff} onChange={e=>setAff(e.target.value)} className="rounded bg-roxo-escuro p-2 text-xs">{[...GRIMOIRE_ELEMENTS.map(e=><option key={e} value={e}>{ELEMENT_NAMES[e]}</option>),...data.elementOptions.filter(e=>!GRIMOIRE_ELEMENTS.some(g=>normalize(ELEMENT_NAMES[g])===normalize(e))).map(e=><option key={e} value={e}>{e}</option>)]}</select><select value={stage} onChange={e=>setStage(e.target.value)} className="rounded bg-roxo-escuro p-2 text-xs">{AFFINITY_STAGES.map((s,i)=><option key={s} value={i+1}>{s}</option>)}</select></div><input aria-label="XP do estágio" type="number" min="0" max="1000" value={stageXp} onChange={e=>setStageXp(e.target.value)} className="w-full rounded bg-roxo-escuro p-2 text-xs"/><button disabled={busy} onClick={()=>run(()=>setCharacterElementAffinity(characterId,aff,Number(stage),Number(stageXp)),'Afinidade salva.')} className="rounded border border-bege-medio/30 px-3 py-1 text-xs">Conceder / ajustar</button><div className="flex gap-2"><select value={removeAff} onChange={e=>setRemoveAff(e.target.value)} className="min-w-0 flex-1 rounded bg-roxo-escuro p-2 text-xs"><option value="">Afinidade registrada</option>{(data.character?.affinities??[]).map(a=><option key={a.id} value={a.element}>{ELEMENT_NAMES[a.element]??a.element}</option>)}</select><button disabled={busy||!removeAff} onClick={()=>run(()=>removeCharacterElementAffinity(characterId,removeAff),'Afinidade removida.')} className="rounded border border-red-200/20 px-2 text-xs disabled:opacity-40">Remover</button></div></div>
    <div className="space-y-2 rounded border border-bege-medio/15 p-3"><h3 className="text-sm text-bege-medio">Editar dado do catálogo</h3><select value={editId} onChange={e=>setEditId(e.target.value)} className="w-full rounded bg-roxo-escuro p-2 text-xs"><option value="">Selecionar ritual</option>{data.catalog.map(r=><option key={r.id} value={r.id}>G{r.degree} · {r.name}</option>)}</select>{editable&&<form action={form=>{const cap=String(form.get('cap')??'').trim();run(()=>updateRitualCatalogEntry(editable.id,{name:String(form.get('name')??''),effect:String(form.get('effect')??''),pmBase:String(form.get('pm')??''),difficulty:String(form.get('difficulty')??''),difficultyModifier:String(form.get('difficultyModifier')??''),affinityXpModifier:String(form.get('affinityXpModifier')??''),domainXpMax:cap?Number(cap):null}),'Catálogo atualizado.')}} className="space-y-1"><input name="name" defaultValue={editable.name} placeholder="Nome" className="w-full rounded bg-roxo-escuro p-2 text-xs"/><textarea name="effect" defaultValue={editable.effect??''} placeholder="Efeito" className="w-full rounded bg-roxo-escuro p-2 text-xs"/><div className="grid grid-cols-2 gap-1"><input name="pm" defaultValue={editable.pmBase??''} placeholder="PM" className="rounded bg-roxo-escuro p-2 text-xs"/><input name="difficulty" defaultValue={editable.difficulty??''} placeholder="Dificuldade" className="rounded bg-roxo-escuro p-2 text-xs"/><input name="difficultyModifier" defaultValue={editable.difficultyModifier??''} placeholder="Modificador de dificuldade" className="rounded bg-roxo-escuro p-2 text-xs"/><input name="affinityXpModifier" defaultValue={editable.affinityXpModifier??''} placeholder="Modificador de XP de Afinidade" className="rounded bg-roxo-escuro p-2 text-xs"/><input name="cap" type="number" min="0" defaultValue={editable.domainXpMax??''} placeholder="Limite Domínio" className="rounded bg-roxo-escuro p-2 text-xs"/></div><button disabled={busy} className="rounded border border-bege-medio/30 px-3 py-1 text-xs">Salvar campos</button></form>}</div>
  </div><details className="mt-4 rounded border border-bege-medio/15 p-3"><summary className="cursor-pointer text-sm text-bege-medio">Configurar regras de XP e progressão</summary><p className="my-2 text-xs text-bege-claro/55">Edite o JSON abaixo. Dificuldade usa o texto da coluna Dificuldade como chave e um multiplicador numérico. Regra de repetição aceita windowHours, decrementMultiplier e minMultiplier; esses parâmetros só atuam quando preenchidos. Não há valores presumidos.</p><textarea value={configJson} onChange={e=>setConfigJson(e.target.value)} rows={13} spellCheck={false} className="w-full rounded bg-roxo-escuro p-3 font-mono text-xs"/><input id="grimoire-transition-rule" defaultValue={data.config.stageTransitionRule??''} placeholder="Regra de continuidade entre estágios (opcional)" className="mt-2 w-full rounded bg-roxo-escuro p-2 text-xs"/><button disabled={busy} onClick={()=>run(async()=>{const c=JSON.parse(configJson); return updateGrimoireConfig({stageTransitionRule:(document.getElementById('grimoire-transition-rule') as HTMLInputElement)?.value??'',affinitySuccessXpByDegree:c.affinitySuccessXpByDegree,affinityPracticeXpByDegree:c.affinityPracticeXpByDegree,affinityStudyXpByDegree:c.affinityStudyXpByDegree??null,domainSuccessXpByRitual:c.domainSuccessXpByRitual,domainPracticeXpByRitual:c.domainPracticeXpByRitual,difficultyModifiers:c.difficultyModifiers??null,repetitionDiminishingRule:c.repetitionDiminishingRule??null})},'Configuração salva.')} className="mt-2 rounded border border-bege-medio/30 px-3 py-1 text-xs">Salvar configuração</button></details><p className="mt-3 text-[11px] text-bege-claro/45">Campos em branco permanecem sem definição. Alterações ficam registradas no histórico administrativo.</p></section>
}
