'use client'
/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from 'react'
import { Compass, LoaderCircle, X } from 'lucide-react'
import type { CSSProperties } from 'react'
import { chooseExplorationSceneOption, closeExplorationInteraction, discoverExplorationObject, getPlayerExplorationSnapshot, moveExplorationGroup } from '@/app/actions/exploration'
import type { MapSceneOption, PublicDoor, PublicObject } from '@/lib/types/exploration'

type CharacterChoice = { id: string; name: string; capacity: number; used: number; items: { id: string; name: string }[] }
type FoundObject = PublicObject & { description?: string; options?: MapSceneOption[]; itemName?: string; preview?: boolean; objectId?:string; choiceText?:string; chosenOptionId?:string; mapId?:string; roomId?:string }
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
type Replacement = { object: PublicObject; items: { id: string; name: string }[]; capacity: number; used: number }

const ARROW_ROTATION = { up: '-90deg', down: '90deg', left: '0deg', right: '180deg' } as const
const FALLBACK_TEXT = 'O grupo descobriu algo neste local.'

export default function PlayerExplore() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [scene, setScene] = useState<FoundObject | null>(null)
  const [characterId, setCharacterId] = useState('')
  const [visibleChars, setVisibleChars] = useState(0)
  const [replacement, setReplacement] = useState<Replacement | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [previewMapId, setPreviewMapId] = useState('')
  const [previewRoomId, setPreviewRoomId] = useState('')
  const [imageRatio, setImageRatio] = useState(4 / 3)
  const activeCharacter = characterId || snapshot?.characters[0]?.id

  const refresh = useCallback(async () => {
    try {
      const next = await getPlayerExplorationSnapshot(previewMapId || undefined, previewRoomId || undefined) as Snapshot
      setSnapshot(next)
      if (next.masterPreview && !previewMapId && next.previewMaps[0]) {
        setPreviewMapId(next.previewMaps[0].id)
        setPreviewRoomId(next.previewMaps[0].rooms[0]?.id ?? '')
      }
      if (next.activeInteraction) setScene(next.activeInteraction)
      else if (!next.masterPreview) setScene(null)
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível carregar a exploração') }
  }, [previewMapId, previewRoomId])

  useEffect(() => {
    void refresh()
    const timer = setInterval(() => void refresh(), 3000)
    return () => clearInterval(timer)
  }, [refresh])

  const currentText = scene?.choiceText || scene?.description || FALLBACK_TEXT
  useEffect(() => {
    setVisibleChars(0)
    if (!scene?.id) return
    const timer = setInterval(() => setVisibleChars(n => Math.min(currentText.length, n + 3)), 22)
    return () => clearInterval(timer)
  }, [scene?.id, scene?.choiceText, scene?.description, currentText])

  async function interact(object: PublicObject, replaceItemId?: string) {
    if (!snapshot?.map || !snapshot.room) return
    setBusy(true); setError('')
    try {
      const accessCode = object.needsCode ? window.prompt('Digite o código de acesso:') ?? undefined : undefined
      if (object.needsCode && accessCode === undefined) return
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
    let code: string | undefined
    if (door.needsCode) { code = window.prompt('Digite o código para abrir a passagem:') ?? undefined; if (code === undefined) return }
    setBusy(true); setError('')
    try { await moveExplorationGroup(snapshot.room.id, door.roomId, code); setScene(null); await refresh() }
    catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível avançar') }
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

  if (!snapshot) return <div className="py-20 text-center"><LoaderCircle className="mx-auto animate-spin text-bege-medio" /></div>
  if (snapshot.masterPreview && snapshot.previewMaps.length > 0) {
    const selectedMap = snapshot.previewMaps.find(m => m.id === previewMapId) ?? snapshot.previewMaps[0]
    return <section className="mx-auto max-w-6xl px-3 py-6 text-bege-claro md:px-8">
      <div className="mb-4 flex flex-wrap items-end gap-3 border-b border-bege-escuro/30 pb-4">
        <label className="text-[10px] uppercase tracking-widest">Mapa<select value={selectedMap.id} onChange={e => { const next=snapshot.previewMaps.find(m=>m.id===e.target.value); setPreviewMapId(e.target.value); setPreviewRoomId(next?.rooms[0]?.id??''); setScene(null) }} className="mt-1 block border border-bege-escuro/40 bg-[#1d1020] px-3 py-2 text-sm normal-case">{snapshot.previewMaps.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
        <label className="text-[10px] uppercase tracking-widest">Sala<select value={previewRoomId} onChange={e => {setPreviewRoomId(e.target.value);setScene(null)}} className="mt-1 block border border-bege-escuro/40 bg-[#1d1020] px-3 py-2 text-sm normal-case">{selectedMap.rooms.map(r=><option key={r.id} value={r.id}>{r.name} · {r.floorName}</option>)}</select></label>
        <span className="ml-auto text-xs text-bege-escuro/60">Prévia do Mestre · somente leitura</span>
      </div>
      {snapshot.notice && <p className="border border-bege-escuro/30 p-8 text-center text-sm">{snapshot.notice}</p>}
      {snapshot.map && snapshot.room && <RoomView snapshot={snapshot} room={snapshot.room} scene={scene} replacement={replacement} busy={busy} error={error} currentText={currentText} visibleChars={visibleChars} imageRatio={imageRatio} setImageRatio={setImageRatio} onInteract={interact} onMove={move} onChoose={choose} onClose={()=>{setScene(null);if(!snapshot.masterPreview&&scene)void closeExplorationInteraction(snapshot.map!.id,snapshot.room!.id,scene.id).then(()=>void refresh())}} onCancelReplacement={()=>setReplacement(null)}/>}
    </section>
  }
  if (snapshot.notice) return <section className="mx-auto my-10 max-w-3xl border border-bege-escuro/30 bg-roxo-escuro/40 p-10 text-center text-bege-claro"><Compass className="mx-auto mb-4 text-bege-medio"/><h2 className="font-title text-xl uppercase tracking-widest">Exploração</h2><p className="mt-3 text-sm text-bege-escuro/75">{snapshot.notice}</p></section>
  if (!snapshot.map || !snapshot.room) return <section className="p-10 text-center text-bege-medio">Sala não encontrada.</section>

  return <section className="mx-auto max-w-6xl px-3 py-8 text-bege-claro md:px-8">
    <div className="mb-4 flex items-end justify-between"><div><p className="font-title text-[10px] uppercase tracking-[.25em] text-bege-medio">{snapshot.map.name}</p><h1 className="mt-1 font-title text-2xl uppercase tracking-widest">{snapshot.room.name}</h1><p className="mt-1 text-xs text-bege-escuro/60">{snapshot.room.floorName}</p></div><span className="text-xs text-bege-escuro/60">Exploração compartilhada</span></div>
    {snapshot.characters.length > 0 && <label className="mb-3 flex items-center gap-3 text-xs">Personagem para receber itens<select value={activeCharacter} onChange={e=>setCharacterId(e.target.value)} className="border border-bege-escuro/30 bg-roxo-escuro p-2">{snapshot.characters.map(c=><option key={c.id} value={c.id}>{c.name} · inventário {c.used}/{c.capacity}</option>)}</select></label>}
    {snapshot.characters.length === 0 && <p className="mb-3 text-xs text-bege-escuro/60">Nenhum personagem seu disponível para receber itens.</p>}
    <RoomView snapshot={snapshot} room={snapshot.room} scene={scene} replacement={replacement} busy={busy} error={error} currentText={currentText} visibleChars={visibleChars} imageRatio={imageRatio} setImageRatio={setImageRatio} onInteract={interact} onMove={move} onChoose={choose} onClose={()=>{setScene(null);if(scene)void closeExplorationInteraction(snapshot.map!.id,snapshot.room!.id,scene.id).then(()=>void refresh())}} onCancelReplacement={()=>setReplacement(null)}/>
  </section>
}

function RoomView({snapshot,room,scene,replacement,busy,error,currentText,visibleChars,imageRatio,setImageRatio,onInteract,onMove,onChoose,onClose,onCancelReplacement}:{snapshot:Snapshot;room:Room;scene:FoundObject|null;replacement:Replacement|null;busy:boolean;error:string;currentText:string;visibleChars:number;imageRatio:number;setImageRatio:(value:number)=>void;onInteract:(o:PublicObject,replaceId?:string)=>void;onMove:(d:PublicDoor)=>void;onChoose:(o:MapSceneOption)=>void;onClose:()=>void;onCancelReplacement:()=>void}) {
  return <>
    {error && <p role="alert" className="mb-3 border border-red-400/30 p-3 text-sm text-red-200">{error}</p>}
    <div className="relative mx-auto overflow-hidden border border-bege-medio/70 bg-[#26182c]" style={{width:`min(100%, ${70*imageRatio}vh, ${900*imageRatio}px)`,aspectRatio:imageRatio,maxHeight:'min(70vh, 900px)'}}>
      {room.background ? <img src={room.background} alt={`Fundo da sala ${room.name}`} onLoad={e=>{const img=e.currentTarget;if(img.naturalWidth&&img.naturalHeight)setImageRatio(img.naturalWidth/img.naturalHeight)}} className="absolute inset-0 h-full w-full object-fill"/> : <div className="absolute inset-0 grid place-items-center bg-[#25172a]"><span className="text-xs uppercase tracking-[.2em] text-bege-escuro/40">A sala ainda não tem imagem</span></div>}
      {room.objects.map(object => {
        const hiddenItem = object.type === 'item'
        const noImage = !object.image
        return <button disabled={busy} key={object.id} onClick={()=>void onInteract(object)} className={hiddenItem?'absolute z-10 h-8 w-8 -translate-x-1/2 -translate-y-1/2 cursor-crosshair rounded-sm border-0 bg-transparent shadow-none':'absolute z-10 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center overflow-hidden rounded-full border border-bege-medio/70 bg-roxo-escuro/75 shadow-lg transition hover:scale-110 disabled:opacity-50 md:h-14 md:w-14'} style={{left:`${object.x}%`,top:`${object.y}%`,backgroundImage:object.image?`url(${object.image})`:undefined,backgroundSize:hiddenItem?'contain':'cover',backgroundPosition:'center',backgroundRepeat:'no-repeat'}} aria-label={object.type==='item'?'Investigar algo neste local':object.title} title={hiddenItem?'':object.title}>{!hiddenItem&&noImage&&<span className="text-lg">{object.type==='character'?'♟':object.type==='portal'?'◉':'?'}</span>}</button>
      })}
      {snapshot.doors.map(door=>{const directionDoors=snapshot.doors.filter(d=>d.direction===door.direction);const along=`${((directionDoors.indexOf(door)+1)/(directionDoors.length+1))*100}%`;const style=(door.direction==='up'||door.direction==='down'?{left:along,[door.direction==='up'?'top':'bottom']:8,transform:'translateX(-50%)'}:{top:along,[door.direction==='left'?'left':'right']:8,transform:'translateY(-50%)'}) as CSSProperties;return <button key={door.roomId} disabled={busy||snapshot.masterPreview} onClick={()=>onMove(door)} aria-label="Passagem para outra sala" title="Passagem" style={style} className="absolute z-20 grid h-11 w-12 place-items-center bg-transparent disabled:opacity-50 md:h-14 md:w-14"><span aria-hidden="true" className="block h-9 w-10 bg-contain bg-center bg-no-repeat" style={{backgroundImage:'url(/assets/svgs/arrow.svg)',transform:`rotate(${ARROW_ROTATION[door.direction]})`,filter:'brightness(0) saturate(100%) invert(81%) sepia(24%) saturate(670%) hue-rotate(355deg)'}}/>{door.needsCode||door.minLevel||door.needsItem||door.needsAffinity?<span className="absolute right-0 top-0 text-[10px]">🔒</span>:null}</button>})}
      {replacement&&<article role="dialog" aria-modal="false" className="absolute inset-x-3 bottom-3 z-40 max-h-[48%] overflow-y-auto border-2 border-[#80633f] bg-[#d9c49d] p-4 text-[#241a18] shadow-2xl"><h2 className="font-title text-lg uppercase">Inventário cheio</h2><p className="mt-1 text-sm">O personagem ocupa {replacement.used}/{replacement.capacity} espaços. Escolha um item para devolver ao Mestre e receber {replacement.object.title}.</p><div className="mt-3 flex flex-wrap gap-2">{replacement.items.map(item=><button key={item.id} disabled={busy} onClick={()=>void onInteract(replacement.object,item.id)} className="border border-[#694f3a] px-3 py-2 text-sm hover:bg-[#b49a70]">Devolver: {item.name}</button>)}</div><button onClick={onCancelReplacement} className="absolute right-1 top-1 p-2" aria-label="Cancelar troca"><X size={18}/></button></article>}
      {scene&&!replacement&&<article role="dialog" aria-modal="false" className="absolute inset-x-2 bottom-2 z-30 max-h-[48%] overflow-y-auto border-2 border-[#80633f] p-3 text-[#241a18] shadow-2xl md:inset-x-[12%] md:bottom-4 md:p-5" style={{backgroundColor:'#d9c49d',backgroundImage:'radial-gradient(ellipse at top left,rgba(255,247,219,.55),transparent 55%),repeating-linear-gradient(0deg,rgba(102,74,45,.035) 0px,rgba(102,74,45,.035) 1px,transparent 1px,transparent 4px)'}}>
        <button onClick={onClose} className="absolute right-1 top-1 p-2" aria-label="Fechar cena"><X size={17}/></button><div className={`grid w-full gap-3 pr-8 ${scene.image?'grid-cols-[76px_minmax(0,1fr)] items-start':'grid-cols-1'}`}>{scene.image&&<div role="img" aria-label={scene.title} className="h-[76px] w-[76px] rounded-full border-2 border-[#80633f] bg-contain bg-center bg-no-repeat" style={{backgroundImage:`url(${scene.image})`}}/>}<div className="w-full min-w-0"><h2 className="font-title text-lg uppercase tracking-wider">{scene.title}</h2><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed">{currentText.slice(0,visibleChars)}<span className="animate-pulse">{visibleChars<currentText.length?'▍':''}</span></p></div></div>
        {scene.type==='item'&&<p className="mt-3 border-t border-[#80633f]/40 pt-2 text-xs">{scene.itemName?`${scene.itemName} foi adicionado ao inventário.`:'Descoberta registrada para todo o grupo.'}</p>}{scene.preview&&<p className="mt-3 border-t border-[#80633f]/40 pt-2 text-xs">Prévia do Mestre — nada foi registrado.</p>}{scene.type==='character'&&(scene.options??[]).map(option=><button key={option.id} disabled={busy||!!scene.chosenOptionId} onClick={()=>onChoose(option)} className="mr-2 mt-3 inline-flex border border-[#694f3a] px-4 py-2 text-sm hover:bg-[#b49a70] disabled:opacity-60">{option.label}</button>)}
      </article>}
    </div>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-bege-escuro/60">{room.objects.length?`${room.objects.length} elemento(s) nesta sala`:'Esta sala não tem elementos posicionados.'}</p></div>
  </>
}
