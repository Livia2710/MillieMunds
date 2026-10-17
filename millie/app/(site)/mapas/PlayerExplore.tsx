'use client'
/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from 'react'
import { ArrowDown, Compass, LoaderCircle, Smartphone, Sparkles, X } from 'lucide-react'
import type { CSSProperties } from 'react'
import { PrimaryButton } from '@/componentes/PrimaryButton'
import { useMapDialog } from '@/componentes/mapas/useMapDialog'
import { answerMapClass, chooseExplorationRoom, chooseExplorationSceneOption, closeExplorationInteraction, discoverExplorationObject, getExplorationRoomChoice, getPlayerExplorationSnapshot, heartbeatExplorationPresence, moveExplorationGroup } from '@/app/actions/exploration'
import type { MapSceneOption, PublicDoor, PublicObject } from '@/lib/types/exploration'

type CharacterChoice = { id: string; name: string; image?: string | null; portraitImage?: string | null; capacity: number; used: number; items: { id: string; name: string }[] }
type FoundObject = Omit<PublicObject, 'type'> & { type: string; description?: string; options?: MapSceneOption[]; itemName?: string; preview?: boolean; objectId?:string; choiceText?:string; chosenOptionId?:string; mapId?:string; roomId?:string; ritualSymbol?:string; teacherCharacterId?:string; teacherName?:string; correctOptionId?:string; favorReward?:number; answers?:Record<string,{correct:boolean;selectedOptionId:string;gainedFavor?:boolean}> }
type Room = { id:string; name:string; floorName:string; background:string|null; objects:PublicObject[] }
type Snapshot = {
  map: { id: string; name: string } | null
  room: Room | null
  doors: PublicDoor[]
  notice: string | null
  characters: CharacterChoice[]
  masterPreview: boolean
  previewMaps: {id:string;name:string;rooms:{id:string;name:string;floorName:string}[]}[]
  activeInteraction: FoundObject | null
}
type RoomChoice = {id:string;mapId:string;roomId:string;title:string;description:string;options:Array<{id:string;label:string;targetRoomId:string}>}
type Replacement = { object: PublicObject; items: { id: string; name: string }[]; capacity: number; used: number }

const ARROW_ROTATION = { up: '-90deg', down: '90deg', left: '0deg', right: '180deg' } as const
const FALLBACK_TEXT = 'O grupo descobriu algo neste local.'

function paginateDialogue(text: string, limit = 210) {
  const pages: string[] = []
  let remaining = text.trim()
  while (remaining.length > limit) {
    let split = remaining.lastIndexOf(' ', limit)
    if (split < limit * 0.55) split = remaining.indexOf(' ', limit)
    if (split < 0) split = limit
    pages.push(remaining.slice(0, split).trim())
    remaining = remaining.slice(split).trim()
  }
  if (remaining || !pages.length) pages.push(remaining)
  return pages
}

export default function PlayerExplore() {
  const mapDialog = useMapDialog()
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [scene, setScene] = useState<FoundObject | null>(null)
  const [characterId, setCharacterId] = useState('')
  const [visibleChars, setVisibleChars] = useState(0)
  const [dialoguePage, setDialoguePage] = useState(0)
  const [replacement, setReplacement] = useState<Replacement | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [previewMapId, setPreviewMapId] = useState('')
  const [previewRoomId, setPreviewRoomId] = useState('')
  const [imageRatio, setImageRatio] = useState(4 / 3)
  const [needsLandscape, setNeedsLandscape] = useState(false)
  const [canRequestLandscape, setCanRequestLandscape] = useState(false)
  const [roomChoice, setRoomChoice] = useState<RoomChoice | null>(null)
  const activeCharacter = characterId || snapshot?.characters[0]?.id

  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px) and (orientation: portrait)')
    const update = () => setNeedsLandscape(query.matches)
    const orientation = window.screen.orientation as unknown as { lock?: unknown } | undefined
    setCanRequestLandscape(typeof orientation?.lock === 'function')
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  async function requestLandscape() {
    const orientation = window.screen.orientation as unknown as { lock?: (value: string) => Promise<void> } | undefined
    try { await orientation?.lock?.('landscape') } catch { /* Alguns navegadores só aceitam orientação após o usuário girar o aparelho. */ }
  }

  const refresh = useCallback(async () => {
    try {
      const [next, choice] = await Promise.all([getPlayerExplorationSnapshot(previewMapId || undefined, previewRoomId || undefined) as Promise<Snapshot>, getExplorationRoomChoice()])
      setSnapshot(next)
      setRoomChoice(choice)
      if (next.masterPreview && choice && previewMapId !== choice.mapId) {
        setPreviewMapId(choice.mapId)
        setPreviewRoomId(choice.roomId)
      }
      if (next.masterPreview && !previewMapId && next.previewMaps[0]) {
        setPreviewMapId(next.previewMaps[0].id)
        setPreviewRoomId(next.previewMaps[0].rooms[0]?.id ?? '')
      }
      if (next.activeInteraction?.type === 'room-choice') setScene(null)
      else if (next.activeInteraction) setScene(next.activeInteraction)
      else if (!next.masterPreview) setScene(null)
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível carregar a exploração') }
  }, [previewMapId, previewRoomId])

  useEffect(() => {
    void refresh()
    const timer = setInterval(() => void refresh(), 3000)
    return () => clearInterval(timer)
  }, [refresh])

  useEffect(() => {
    const mapId = snapshot?.map?.id
    const roomId = snapshot?.room?.id
    if (!mapId || !roomId || snapshot?.masterPreview) return
    const heartbeat = () => {
      if (document.visibilityState === 'visible') void heartbeatExplorationPresence(mapId, roomId, activeCharacter).catch(() => {})
    }
    heartbeat()
    const timer = setInterval(heartbeat, 15000)
    document.addEventListener('visibilitychange', heartbeat)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', heartbeat)
    }
  }, [snapshot?.map?.id, snapshot?.room?.id, snapshot?.masterPreview, activeCharacter])

  const currentText = scene?.choiceText || scene?.description || (scene?.type === 'scene' ? 'O Mestre ainda não escreveu a narração desta sala.' : FALLBACK_TEXT)
  const dialoguePages = paginateDialogue(currentText)
  const currentPageText = dialoguePages[dialoguePage] ?? ''
  const speakerImage = scene?.choiceText
    ? (snapshot?.characters.find(character => character.id === activeCharacter)?.portraitImage || snapshot?.characters.find(character => character.id === activeCharacter)?.image)
    : (scene?.speakerImage || (scene?.type === 'character' ? scene.image : undefined))
  const advanceDialogue = useCallback(() => {
    if (!scene) return
    if (visibleChars < currentPageText.length) {
      setVisibleChars(currentPageText.length)
    } else if (dialoguePage < dialoguePages.length - 1) {
      setDialoguePage(page => page + 1)
      setVisibleChars(0)
    } else if (scene.type !== 'class') {
      setScene(null)
      if (!snapshot?.masterPreview && snapshot?.map && snapshot?.room) {
        void closeExplorationInteraction(snapshot.map.id, snapshot.room.id, scene.id).then(() => void refresh())
      }
    }
  }, [scene, visibleChars, currentPageText.length, dialoguePage, dialoguePages.length, snapshot, refresh])

  useEffect(() => {
    setDialoguePage(0)
  }, [scene?.id, scene?.choiceText, scene?.description])

  useEffect(() => {
    setVisibleChars(0)
    if (!scene?.id) return
    const timer = setInterval(() => setVisibleChars(n => Math.min(currentPageText.length, n + 3)), 22)
    return () => clearInterval(timer)
  }, [scene?.id, scene?.choiceText, scene?.description, dialoguePage, currentPageText])

  useEffect(() => {
    if (!scene) return
    const handleActionKey = (event: KeyboardEvent) => {
      if (!['Enter', ' ', 'ArrowRight', 'ArrowDown'].includes(event.key)) return
      const target = event.target as HTMLElement | null
      if (target?.tagName === 'SELECT' || target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.tagName === 'BUTTON' || target?.tagName === 'A') return
      event.preventDefault()
      advanceDialogue()
    }
    window.addEventListener('keydown', handleActionKey)
    return () => window.removeEventListener('keydown', handleActionKey)
  }, [scene, advanceDialogue])

  async function interact(object: PublicObject, replaceItemId?: string) {
    if (!snapshot?.map || !snapshot.room) return
    if (object.type === 'portal' && (object.portalState ?? 'active') === 'active' && !await mapDialog.confirm('Atravessar portal', `Deseja atravessar o portal “${object.title}”?`, 'Atravessar')) return
    let accessCode: string | undefined
    if (object.needsCode) {
      const enteredCode = await mapDialog.prompt('Código de acesso', 'Digite o código de acesso:', 'Código')
      if (enteredCode === null) return
      accessCode = enteredCode
    }
    setBusy(true); setError('')
    try {
      const found = await discoverExplorationObject(snapshot.map.id, snapshot.room.id, object.id, activeCharacter, replaceItemId, accessCode)
      if ('needsReplacement' in found && found.needsReplacement) {
        setReplacement({ object, items: found.replaceItems, capacity: found.capacity, used: found.used }); return
      }
      setReplacement(null)
      if (snapshot.masterPreview) setScene({ ...object, ...found })
      await refresh()
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível interagir'); await refresh() }
    finally { setBusy(false) }
  }

  async function move(door: PublicDoor) {
    if (!snapshot?.room) return
    if (snapshot.masterPreview) { setPreviewRoomId(door.roomId); setScene(null); return }
    if (door.isStairs && !await mapDialog.confirm('Mudar de andar', `Deseja ir para ${door.label}?`, 'Continuar')) return
    let code: string | undefined
    if (door.needsCode) { const enteredCode = await mapDialog.prompt('Código da passagem', 'Digite o código para abrir a passagem:', 'Código'); if (enteredCode === null) return; code = enteredCode }
    setBusy(true); setError('')
    try { await moveExplorationGroup(snapshot.room.id, door.roomId, code); setScene(null); await refresh() }
    catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível avançar') }
    finally { setBusy(false) }
  }

  async function selectRoom(targetRoomId: string) {
    if (!roomChoice || !snapshot?.map) return
    if (snapshot.masterPreview) {
      setPreviewMapId(roomChoice.mapId)
      setPreviewRoomId(targetRoomId)
      setScene(null)
      return
    }
    setBusy(true); setError('')
    try {
      await chooseExplorationRoom(roomChoice.mapId, roomChoice.id, targetRoomId)
      setRoomChoice(null)
      setScene(null)
      await refresh()
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível escolher a sala') }
    finally { setBusy(false) }
  }

  async function choose(option: MapSceneOption) {
    if (!snapshot?.map || !snapshot.room || !scene) return
    if (snapshot.masterPreview) {
      setScene(current => current ? { ...current, choiceText: option.resultText || `O grupo escolheu: ${option.label}`, chosenOptionId: option.id } : current)
      return
    }
    setBusy(true); setError('')
    try { await chooseExplorationSceneOption(snapshot.map.id, snapshot.room.id, scene.id, option.id); await refresh() }
    catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível registrar a escolha') }
    finally { setBusy(false) }
  }

  async function answerClass(optionId: string) {
    if (!scene || !activeCharacter || snapshot?.masterPreview) return
    setBusy(true); setError('')
    try { await answerMapClass(activeCharacter, optionId); await refresh() }
    catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível registrar a resposta'); await refresh() }
    finally { setBusy(false) }
  }

  if (!snapshot) return <div className="py-20 text-center"><LoaderCircle className="mx-auto animate-spin text-bege-medio" /></div>
  if (snapshot.masterPreview && snapshot.previewMaps.length > 0) {
    const selectedMap = snapshot.previewMaps.find(m => m.id === previewMapId) ?? snapshot.previewMaps[0]
    return <><section className="mx-auto max-w-6xl px-3 py-6 text-bege-claro md:px-8">
      <div className="mb-4 flex flex-wrap items-end gap-3 border-b border-bege-escuro/30 pb-4">
        <label className="text-[10px] uppercase tracking-widest">Mapa<select value={selectedMap.id} onChange={e => { const next=snapshot.previewMaps.find(m=>m.id===e.target.value); setPreviewMapId(e.target.value); setPreviewRoomId(next?.rooms[0]?.id??''); setScene(null) }} className="mt-1 block border border-bege-escuro/40 bg-[#1d1020] px-3 py-2 text-sm normal-case">{snapshot.previewMaps.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
        <label className="text-[10px] uppercase tracking-widest">Sala<select value={previewRoomId} onChange={e => {setPreviewRoomId(e.target.value);setScene(null)}} className="mt-1 block border border-bege-escuro/40 bg-[#1d1020] px-3 py-2 text-sm normal-case">{selectedMap.rooms.map(r=><option key={r.id} value={r.id}>{r.name} · {r.floorName}</option>)}</select></label>
        <span className="ml-auto text-xs text-bege-escuro/60">Prévia do Mestre · somente leitura</span>
      </div>
      {snapshot.notice && <p className="border border-bege-escuro/30 p-8 text-center text-sm">{snapshot.notice}</p>}
      {snapshot.map && snapshot.room && <RoomView snapshot={snapshot} room={snapshot.room} roomChoice={roomChoice} activeCharacter={activeCharacter} scene={scene} replacement={replacement} busy={busy} error={error} currentText={currentPageText} visibleChars={visibleChars} dialoguePage={dialoguePage} dialoguePageCount={dialoguePages.length} speakerImage={speakerImage} onAdvanceDialogue={advanceDialogue} imageRatio={imageRatio} setImageRatio={setImageRatio} onInteract={interact} onMove={move} onSelectRoom={selectRoom} onChoose={choose} onAnswer={answerClass} onClose={()=>{setScene(null);if(!snapshot.masterPreview&&scene&&scene.type!=='class')void closeExplorationInteraction(snapshot.map!.id,snapshot.room!.id,scene.id).then(()=>void refresh())}} onCancelReplacement={()=>setReplacement(null)}/>}
    </section>{mapDialog.dialog}</>
  }
  if (snapshot.notice) return <section className="mx-auto my-10 max-w-3xl border border-bege-escuro/30 bg-roxo-escuro/40 p-10 text-center text-bege-claro"><Compass className="mx-auto mb-4 text-bege-medio"/><h2 className="font-title text-xl uppercase tracking-widest">Exploração</h2><p className="mt-3 text-sm text-bege-escuro/75">{snapshot.notice}</p></section>
  if (!snapshot.map || !snapshot.room) return <section className="p-10 text-center text-bege-medio">Sala não encontrada.</section>

  return <><section className="mx-auto max-w-6xl px-3 py-8 text-bege-claro md:px-8">
    {needsLandscape&&!snapshot.masterPreview&&<div role="dialog" aria-modal="true" aria-labelledby="landscape-title" className="fixed inset-0 z-[100] grid place-items-center bg-[#120a18] p-6 text-center text-bege-claro md:hidden"><div className="max-w-sm"><Smartphone size={56} className="mx-auto rotate-90 text-bege-medio"/><h2 id="landscape-title" className="mt-6 font-title text-xl uppercase tracking-widest">Gire o aparelho</h2><p className="mt-3 text-sm leading-relaxed text-bege-escuro/80">A exploração do mapa foi feita para a tela horizontal. Gire o celular para ver a sala inteira e alcançar as passagens.</p>{canRequestLandscape&&<button onClick={()=>void requestLandscape()} className="mt-5 border border-bege-medio/60 px-4 py-3 text-xs uppercase tracking-widest">Tentar ativar modo horizontal</button>}</div></div>}
    <div className="mb-4 flex items-end justify-between"><div><p className="font-title text-[10px] uppercase tracking-[.25em] text-bege-medio">{snapshot.map.name}</p><h1 className="mt-1 font-title text-2xl uppercase tracking-widest">{snapshot.room.name}</h1><p className="mt-1 text-xs text-bege-escuro/60">{snapshot.room.floorName}</p></div><span className="text-xs text-bege-escuro/60">Exploração compartilhada</span></div>
    {snapshot.characters.length > 0 && <label className="mb-3 flex items-center gap-3 text-xs">Personagem ativo<select value={activeCharacter} onChange={e=>setCharacterId(e.target.value)} className="border border-bege-escuro/30 bg-roxo-escuro p-2">{snapshot.characters.map(c=><option key={c.id} value={c.id}>{c.name} · inventário {c.used}/{c.capacity}</option>)}</select><span className="text-bege-escuro/60">Usado para receber itens e responder às aulas.</span></label>}
    {snapshot.characters.length === 0 && <p className="mb-3 text-xs text-bege-escuro/60">Você precisa de um personagem nesta campanha para receber itens ou responder às aulas.</p>}
    <RoomView snapshot={snapshot} room={snapshot.room} roomChoice={roomChoice} activeCharacter={activeCharacter} scene={scene} replacement={replacement} busy={busy} error={error} currentText={currentPageText} visibleChars={visibleChars} dialoguePage={dialoguePage} dialoguePageCount={dialoguePages.length} speakerImage={speakerImage} onAdvanceDialogue={advanceDialogue} imageRatio={imageRatio} setImageRatio={setImageRatio} onInteract={interact} onMove={move} onSelectRoom={selectRoom} onChoose={choose} onAnswer={answerClass} onClose={()=>{setScene(null);if(scene&&scene.type!=='class')void closeExplorationInteraction(snapshot.map!.id,snapshot.room!.id,scene.id).then(()=>void refresh())}} onCancelReplacement={()=>setReplacement(null)}/>
  </section>{mapDialog.dialog}</>
}

function RoomView({snapshot,room,roomChoice,activeCharacter,scene,replacement,busy,error,currentText,visibleChars,dialoguePage,dialoguePageCount,speakerImage,onAdvanceDialogue,imageRatio,setImageRatio,onInteract,onMove,onSelectRoom,onChoose,onAnswer,onClose,onCancelReplacement}:{snapshot:Snapshot;room:Room;roomChoice:RoomChoice|null;activeCharacter?:string;scene:FoundObject|null;replacement:Replacement|null;busy:boolean;error:string;currentText:string;visibleChars:number;dialoguePage:number;dialoguePageCount:number;speakerImage?:string|null;onAdvanceDialogue:()=>void;imageRatio:number;setImageRatio:(value:number)=>void;onInteract:(o:PublicObject,replaceId?:string)=>void;onMove:(d:PublicDoor)=>void;onSelectRoom:(roomId:string)=>void;onChoose:(o:MapSceneOption)=>void;onAnswer:(optionId:string)=>void;onClose:()=>void;onCancelReplacement:()=>void}) {
  return <>
    {error && <p role="alert" className="mb-3 border border-red-400/30 p-3 text-sm text-red-200">{error}</p>}
    <div className="relative mx-auto overflow-hidden border border-bege-medio/70 bg-[#26182c]" style={{width:`min(100%, ${70*imageRatio}vh, ${900*imageRatio}px)`,aspectRatio:imageRatio,maxHeight:'min(70vh, 900px)'}}>
      {room.background ? <img src={room.background} alt={`Fundo da sala ${room.name}`} onLoad={e=>{const img=e.currentTarget;if(img.naturalWidth&&img.naturalHeight)setImageRatio(img.naturalWidth/img.naturalHeight)}} className="absolute inset-0 h-full w-full object-fill"/> : <div className="absolute inset-0 grid place-items-center bg-[#25172a]"><span className="text-xs uppercase tracking-[.2em] text-bege-escuro/40">A sala ainda não tem imagem</span></div>}
      {room.objects.map(object => {
        const hiddenItem = object.type === 'item'
        const noImage = !object.image
        const portalState = object.portalState ?? 'active'
        const portalStyle = object.portalStyle ?? 'arch'
        const portalActive = portalState === 'active'
        const portalShape = portalStyle === 'rune-circle' ? 'rounded-full' : portalStyle === 'mirror' ? 'rounded-[50%]' : portalStyle === 'rift' ? 'rounded-[50%_12%_50%_12%]' : 'rounded-t-[50%] rounded-b-sm'
        const portalColors = portalState === 'blocked' ? 'border-red-400 bg-red-950/70 shadow-[0_0_14px_5px_#ef444477,inset_0_0_12px_#fca5a588]' : portalState === 'inactive' ? 'border-slate-400/70 bg-slate-950/80 grayscale opacity-75 shadow-[0_0_8px_2px_#94a3b855]' : 'border-violet-200/90 bg-[radial-gradient(ellipse_at_center,#c4a6ff55_0%,#593b9b99_42%,#160d24_72%)] shadow-[0_0_12px_4px_#a78bfa88,inset_0_0_10px_#e9d5ff99]'
        const portalLabel = portalState === 'blocked' ? 'Bloqueado' : portalState === 'inactive' ? 'Inativo' : 'Ativo'
        return <button disabled={busy || (!!scene && scene.type === 'scene') || (object.type === 'portal' && !portalActive)} key={object.id} onClick={()=>void onInteract(object)} className={hiddenItem?'absolute z-10 h-8 w-8 -translate-x-1/2 -translate-y-1/2 cursor-crosshair rounded-sm border-0 bg-transparent shadow-none':object.type==='portal'?`absolute z-10 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center overflow-hidden border-2 transition md:h-16 md:w-16 ${portalShape} ${portalColors} ${portalActive?'hover:scale-110':''}`:object.type==='character'?'absolute z-10 grid -translate-x-1/2 -translate-y-1/2 place-items-center overflow-visible bg-transparent shadow-none transition hover:scale-[1.04] hover:drop-shadow-[0_0_14px_rgba(216,180,254,.95)] focus-visible:drop-shadow-[0_0_14px_rgba(216,180,254,.95)] disabled:opacity-50':'absolute z-10 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center overflow-hidden rounded-full border border-bege-medio/70 bg-roxo-escuro/75 shadow-lg transition hover:scale-110 disabled:opacity-50 md:h-14 md:w-14'} style={{left:`${object.x}%`,top:`${object.y}%`,width:object.type==='character'?`${object.width??12}%`:undefined,height:object.type==='character'?`${object.height??28}%`:undefined,backgroundImage:object.image&&object.type!=='character'?`url(${object.image})`:undefined,backgroundSize:hiddenItem?'contain':'cover',backgroundPosition:'center',backgroundRepeat:'no-repeat',borderRadius:object.type==='portal'?(portalStyle==='rune-circle'?'50%':portalStyle==='mirror'?'50% / 60%':portalStyle==='rift'?'50% 12% 50% 12%':'50% 50% 6% 6%'):undefined}} aria-label={object.type==='item'?'Investigar algo neste local':object.type==='portal'?`${object.title} — ${portalLabel}`:object.title} title={hiddenItem?'':object.type==='portal'?`${object.title} · ${portalLabel}`:object.title}>{object.type==='portal'?<><span className={object.image?'absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/30':'grid h-[78%] w-[58%] place-items-center rounded-[50%_50%_45%_45%] border border-white/70 bg-black/25 text-violet-50 shadow-[0_0_8px_#ddd6fe]'} aria-hidden="true">{object.image?null:<Sparkles size={17}/>}</span><span className={`absolute right-0 top-0 grid h-4 w-4 place-items-center rounded-full border border-white/60 text-[9px] ${portalState==='blocked'?'bg-red-700 text-white':portalState==='inactive'?'bg-slate-600 text-white':'bg-violet-500 text-white'}`} aria-hidden="true">{portalState==='blocked'?'🔒':portalState==='inactive'?'◌':'✧'}</span><span className="sr-only">{portalLabel}</span></>:object.type==='character'&&object.image?<img src={object.image} alt="" aria-hidden="true" className="pointer-events-none h-full w-full object-contain"/>:!hiddenItem&&noImage&&<span className="text-lg">{object.type==='character'?'♟':'?'}</span>}</button>
      })}
      {snapshot.doors.map(door=>{const directionDoors=snapshot.doors.filter(d=>d.direction===door.direction);const along=`${((directionDoors.indexOf(door)+1)/(directionDoors.length+1))*100}%`;const style=(door.direction==='up'||door.direction==='down'?{left:along,[door.direction==='up'?'top':'bottom']:8,transform:'translateX(-50%)'}:{top:along,[door.direction==='left'?'left':'right']:8,transform:'translateY(-50%)'}) as CSSProperties;return <button key={door.roomId} disabled={busy||scene?.type==='scene'} onClick={()=>onMove(door)} aria-label={`${door.isStairs?'Escada':'Passagem'} para ${door.label}`} title={`${door.isStairs?'Escada':'Passagem'} para ${door.label}`} style={style} className="absolute z-20 grid h-11 w-12 place-items-center bg-transparent disabled:opacity-50 md:h-14 md:w-14"><span aria-hidden="true" className="block h-9 w-10 bg-contain bg-center bg-no-repeat" style={{backgroundImage:'url(/assets/svgs/arrow.svg)',transform:`rotate(${ARROW_ROTATION[door.direction]})`,filter:'brightness(0) saturate(100%) invert(81%) sepia(24%) saturate(670%) hue-rotate(355deg)'}}/>{door.isStairs&&<span className="absolute -bottom-1 rounded border border-bege-medio/70 bg-roxo-escuro px-1 text-[10px] text-bege-claro">↕</span>}{door.needsCode||door.minLevel||door.needsItem||door.needsAffinity?<span className="absolute right-0 top-0 text-[10px]">🔒</span>:null}</button>})}
      {roomChoice && roomChoice.mapId===snapshot.map?.id && <article role="dialog" aria-modal="false" aria-labelledby="map-room-choice-title" className="scrollbar-none absolute inset-x-3 top-3 z-40 max-h-[calc(100%-1.5rem)] overflow-y-auto border border-bege-medio/60 bg-roxo-escuro/95 p-4 text-bege-claro shadow-header backdrop-blur-sm md:inset-x-[12%] md:top-5 md:p-6"><p className="font-title text-[9px] uppercase tracking-[.24em] text-bege-medio">Escolha de destino aberta pelo Mestre</p><h2 id="map-room-choice-title" className="mt-1 font-title text-lg uppercase tracking-widest">{roomChoice.title}</h2><p className="mt-1 text-xs text-bege-claro/70">{snapshot.masterPreview?'Prévia: selecione para navegar sem mover o grupo.':'Escolham uma sala deste mapa; a primeira escolha move o grupo.'}</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{roomChoice.options.map(option=><PrimaryButton key={option.id} disabled={busy} onClick={()=>onSelectRoom(option.targetRoomId)} className="h-auto min-h-12 max-w-none whitespace-normal py-3 text-left text-sm leading-snug tracking-[.08em] text-bege-claro sm:h-auto sm:text-sm sm:tracking-[.08em] disabled:opacity-50">{option.label}</PrimaryButton>)}</div></article>}
      {replacement&&<article role="dialog" aria-modal="false" className="absolute inset-x-3 bottom-3 z-40 max-h-[48%] overflow-y-auto border-2 border-[#80633f] bg-[#d9c49d] p-4 text-[#241a18] shadow-2xl"><h2 className="font-title text-lg uppercase">Inventário cheio</h2><p className="mt-1 text-sm">O personagem ocupa {replacement.used}/{replacement.capacity} espaços. Escolha um item para devolver ao Mestre e receber {replacement.object.title}.</p><div className="mt-3 flex flex-wrap gap-2">{replacement.items.map(item=><button key={item.id} disabled={busy} onClick={()=>void onInteract(replacement.object,item.id)} className="border border-[#694f3a] px-3 py-2 text-sm hover:bg-[#b49a70]">Devolver: {item.name}</button>)}</div><button onClick={onCancelReplacement} className="absolute right-1 top-1 p-2" aria-label="Cancelar troca"><X size={18}/></button></article>}
      {scene&&!replacement&&<article role="dialog" aria-modal="false" aria-label={`Diálogo: ${scene.title}`} className="absolute inset-x-2 bottom-2 z-30 max-h-[42vh] min-h-[25vh] overflow-hidden border-[3px] border-[#80633f] p-3 pb-12 pt-9 text-[#241a18] shadow-2xl sm:inset-x-[8%] sm:p-5 sm:pb-12 sm:pt-10 md:inset-x-[14%] md:bottom-4" style={{backgroundColor:'#d9c49d',backgroundImage:'radial-gradient(ellipse at top left,rgba(255,247,219,.62),transparent 55%),radial-gradient(ellipse at bottom right,rgba(155,119,70,.16),transparent 55%),repeating-linear-gradient(0deg,rgba(102,74,45,.035) 0px,rgba(102,74,45,.035) 1px,transparent 1px,transparent 4px)'}}>
        {speakerImage&&<div className="absolute -top-1 left-3 z-10 h-32 w-24 -translate-y-1/3 overflow-hidden rounded-sm border-[3px] border-[#80633f] bg-[#d9c49d] shadow-lg sm:left-5 sm:h-[170px] sm:w-32 md:h-48 md:w-36"><img src={speakerImage} alt={`Retrato de ${scene.choiceText?'seu personagem':scene.type==='class'?scene.teacherName??'professor':scene.title}`} className="h-full w-full object-cover object-top"/></div>}
        {scene.type!=='class'&&<button onClick={onClose} className="absolute right-1 top-1 z-10 p-2" aria-label="Fechar cena"><X size={17}/></button>}{scene.type==='class'&&scene.image&&<img src={scene.image} alt="Imagem do quadro da aula" className="mb-3 max-h-24 w-full border border-[#80633f] object-contain sm:max-h-32"/>}<div className="max-h-[20vh] overflow-hidden"><h2 className={`font-title text-base uppercase tracking-wider md:text-lg ${speakerImage?'pl-20 sm:pl-28':''}`}>{scene.type==='character'?`Encontro — ${scene.title}`:scene.title}</h2>{scene.type==='class'&&scene.teacherName&&<p className="mt-1 text-xs font-semibold">Professor: {scene.teacherName}</p>}{scene.type==='class'&&scene.ritualSymbol&&<p className="mt-2 inline-block border border-[#80633f] bg-[#ead6ae]/60 px-3 py-2 font-mono text-lg tracking-[.2em]">{scene.ritualSymbol}</p>}<p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed">{currentText.slice(0,visibleChars)}<span className="animate-pulse">{visibleChars<currentText.length?'▍':''}</span></p></div>
        {scene.type==='item'&&<p className="mt-3 border-t border-[#80633f]/40 pt-2 text-xs">{scene.itemName?`${scene.itemName} foi adicionado ao inventário.`:'Descoberta registrada para todo o grupo.'}</p>}{scene.preview&&<p className="mt-3 border-t border-[#80633f]/40 pt-2 text-xs">Prévia do Mestre — nada foi registrado.</p>}{scene.type==='character'&&(scene.options??[]).map(option=><button key={option.id} disabled={busy||!!scene.chosenOptionId} onClick={()=>onChoose(option)} className="mr-2 mt-3 inline-flex border border-[#694f3a] px-4 py-2 text-sm hover:bg-[#b49a70] disabled:opacity-60">{option.label}</button>)}{scene.type==='class'&&<><div className="mt-3 flex flex-wrap gap-2">{(scene.options??[]).map(option=>{const answer=scene.answers?.[activeCharacter??''];return <button key={option.id} disabled={busy||!!answer||snapshot.masterPreview||!activeCharacter} onClick={()=>onAnswer(option.id)} className="border border-[#694f3a] px-4 py-2 text-sm hover:bg-[#b49a70] disabled:opacity-60">{option.label}</button>})}</div>{scene.answers?.[activeCharacter??'']&&<p className="mt-3 border-t border-[#80633f]/40 pt-2 text-sm font-semibold">{scene.answers[activeCharacter??''].correct?(scene.answers[activeCharacter??''].gainedFavor?'Resposta correta! Você ganhou Favor com o professor.':'Resposta correta! O limite de Favor desta sessão já foi atingido.'):'Resposta registrada. Tente novamente na próxima aula.'}</p>}{snapshot.masterPreview&&<p className="mt-3 text-xs">Prévia do Mestre — a resposta não altera Favor.</p>}</>}
        <div className="absolute bottom-2 right-2 flex items-center gap-2"><span aria-live="polite" className="text-[9px] tabular-nums">{dialoguePage+1}/{dialoguePageCount}</span><button type="button" onClick={onAdvanceDialogue} className="grid h-8 w-8 place-items-center rounded-full border border-[#80633f]/70 bg-[#ead6ae]/80 transition hover:bg-[#c8ac7c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#80633f]" aria-label={visibleChars<currentText.length?'Mostrar o restante desta fala':dialoguePage+1<dialoguePageCount?'Próxima página do diálogo':'Continuar'} title="Enter, Espaço ou seta para a direita"><ArrowDown size={17}/></button></div>
      </article>}
    </div>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-bege-escuro/60">{room.objects.length?`${room.objects.length} elemento(s) nesta sala`:'Esta sala não tem elementos posicionados.'}</p></div>
  </>
}
