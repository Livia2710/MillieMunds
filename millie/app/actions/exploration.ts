'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import type { ExplorationMapRecord, MapRoom } from '@/lib/types/exploration'
import { calcCurrentRank } from '@/lib/utils/rank'
const requireCurrentRank = calcCurrentRank

type MapRow = { id: string; name: string; rooms: unknown; isEditing: boolean; isPublished: boolean }
async function member(role?: 'MASTER' | 'PLAYER') {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')
  const result = await prisma.campaignMember.findFirst({ where: { userId: session.user.id, active: true, campaign: { archived: false }, ...(role ? { role } : {}) }, select: { campaignId: true, role: true } })
  if (!result) throw new Error(role === 'MASTER' ? 'Apenas o Mestre pode editar mapas' : 'Entre em uma campanha para acessar os mapas')
  return { ...result, userId: session.user.id }
}
function checkedRooms(value: unknown): MapRoom[] {
  if (!Array.isArray(value) || value.length > 80) throw new Error('O mapa pode ter até 80 salas')
  for (const room of value as MapRoom[]) {
    if (!room?.id || typeof room.name !== 'string' || room.name.length > 80 || !Array.isArray(room.connections) || !Array.isArray(room.objects) || room.objects.length > 100) throw new Error('Dados de sala inválidos')
    for (const object of room.objects) {
      if (!object.id || !['scene', 'item', 'character', 'portal'].includes(object.type)) throw new Error('Elemento inválido')
      if (object.type === 'item' && !object.inventoryItemId) throw new Error(`Selecione um item do inventário para "${object.title}"`)
      if (object.type === 'portal' && (!object.targetMapId || !object.targetRoomId)) throw new Error(`Configure o mapa e a sala de destino do portal "${object.title}"`)
      if (object.options?.some(option => !option.label.trim())) throw new Error('Preencha o nome de todas as opções da cena')
    }
  }
  return value as MapRoom[]
}
const mapRecord = (row: MapRow) => ({ ...row, rooms: (row.rooms ?? []) as MapRoom[] })

export async function listExplorationMaps() {
  const m = await member()
  const rows = m.role === 'MASTER'
    ? await prisma.$queryRaw<MapRow[]>`SELECT "id","name","rooms","isEditing","isPublished" FROM "ExplorationMap" WHERE "campaignId"=${m.campaignId} ORDER BY "createdAt" DESC`
    : await prisma.$queryRaw<MapRow[]>`SELECT "id","name","rooms","isEditing","isPublished" FROM "ExplorationMap" WHERE "campaignId"=${m.campaignId} AND "isPublished"=true ORDER BY "createdAt" DESC`
  return rows.map(mapRecord) satisfies ExplorationMapRecord[]
}
export async function createExplorationMap(name = 'Novo mapa') {
  const m = await member('MASTER'); const id = randomUUID(); const clean = name.trim().slice(0,80) || 'Novo mapa'
  await prisma.$executeRaw`INSERT INTO "ExplorationMap" ("id","campaignId","name","rooms") VALUES (${id},${m.campaignId},${clean},'[]'::jsonb)`
  revalidatePath('/mapas'); return id
}
export async function getExplorationAssets() {
  const m=await member('MASTER')
  const [maps,items]=await Promise.all([
    prisma.$queryRaw<Array<{id:string;name:string;rooms:unknown;isPublished:boolean;isEditing:boolean}>>`SELECT "id","name","rooms","isPublished","isEditing" FROM "ExplorationMap" WHERE "campaignId"=${m.campaignId} ORDER BY "createdAt" DESC`,
    prisma.$queryRaw<Array<{id:string;name:string;category:string;image:string|null}>>`SELECT "id","name","category","image" FROM "InventoryItem" WHERE "campaignId"=${m.campaignId} AND "ownerId" IS NULL AND "isLocked"=false AND "isDraft"=false ORDER BY "name"`,
  ])
  return {maps:maps.map(mapRecord),items}
}
export async function getExplorationMap(id: string) {
  const m = await member('MASTER'); const rows = await prisma.$queryRaw<MapRow[]>`SELECT "id","name","rooms","isEditing","isPublished" FROM "ExplorationMap" WHERE "id"=${id} AND "campaignId"=${m.campaignId} LIMIT 1`
  return rows[0] ? mapRecord(rows[0]) : null
}
export async function saveExplorationMap(id: string, name: string, value: unknown) {
  const m = await member('MASTER'); const rooms = checkedRooms(value); const clean = name.trim().slice(0,80) || 'Mapa sem nome'
  const n = await prisma.$executeRaw`UPDATE "ExplorationMap" SET "name"=${clean},"rooms"=${JSON.stringify(rooms)}::jsonb,"updatedAt"=NOW() WHERE "id"=${id} AND "campaignId"=${m.campaignId} AND "isEditing"=true`
  if (!n) throw new Error('Mapa não encontrado ou edição encerrada'); revalidatePath('/mapas')
}
export async function finishExplorationMap(id: string) {
  const m = await member('MASTER')
  await prisma.$transaction(async tx => {
    const rows = await tx.$queryRaw<Array<{rooms: unknown}>>`UPDATE "ExplorationMap" SET "isEditing"=false,"isPublished"=true,"updatedAt"=NOW() WHERE "id"=${id} AND "campaignId"=${m.campaignId} AND jsonb_array_length("rooms")>0 RETURNING "rooms"`
    if (!rows.length) throw new Error('Adicione pelo menos uma sala antes de liberar o mapa')
    const rooms = rows[0].rooms as MapRoom[]
    const states = await tx.$queryRaw<Array<{currentMapId:string|null}>>`SELECT "currentMapId" FROM "CampaignExplorationState" WHERE "campaignId"=${m.campaignId} FOR UPDATE`
    if (!states.length) await tx.$executeRaw`INSERT INTO "CampaignExplorationState" ("campaignId","currentMapId","currentRoomId","discovered","updatedAt") VALUES (${m.campaignId},${id},${rooms[0].id},'[]'::jsonb,NOW())`
    else if (!states[0].currentMapId) await tx.$executeRaw`UPDATE "CampaignExplorationState" SET "currentMapId"=${id},"currentRoomId"=${rooms[0].id},"updatedAt"=NOW() WHERE "campaignId"=${m.campaignId}`
  })
  revalidatePath('/mapas')
}
export async function beginExplorationMapEdit(id:string) { const m=await member('MASTER'); const n=await prisma.$executeRaw`UPDATE "ExplorationMap" SET "isEditing"=true,"updatedAt"=NOW() WHERE "id"=${id} AND "campaignId"=${m.campaignId}`; if(!n) throw new Error('Mapa não encontrado'); revalidatePath('/mapas') }
export async function deleteExplorationMap(id:string) { const m=await member('MASTER'); await prisma.$transaction(async tx=>{ await tx.$executeRaw`DELETE FROM "ExplorationMap" WHERE "id"=${id} AND "campaignId"=${m.campaignId}`; await tx.$executeRaw`UPDATE "CampaignExplorationState" SET "currentMapId"=NULL,"currentRoomId"=NULL,"updatedAt"=NOW() WHERE "campaignId"=${m.campaignId} AND "currentMapId"=${id}` }); revalidatePath('/mapas') }
export async function getPlayerExplorationSnapshot() {
  const m=await member(); const states=await prisma.$queryRaw<Array<{currentMapId:string|null;currentRoomId:string|null;discovered:unknown}>>`SELECT "currentMapId","currentRoomId","discovered" FROM "CampaignExplorationState" WHERE "campaignId"=${m.campaignId} LIMIT 1`; const s=states[0]
  if(!s?.currentMapId||!s.currentRoomId) return {map:null,room:null,discovered:[],notice:'O Mestre ainda não liberou um mapa para exploração.',characters:[]}
  const rows=await prisma.$queryRaw<MapRow[]>`SELECT "id","name","rooms","isEditing","isPublished" FROM "ExplorationMap" WHERE "id"=${s.currentMapId} AND "campaignId"=${m.campaignId} LIMIT 1`; const row=rows[0]
  if(!row||!row.isPublished) return {map:null,room:null,discovered:[],notice:'O Mestre ainda não liberou um mapa para exploração.',characters:[]}
  if(row.isEditing) return {map:null,room:null,discovered:[],notice:'O Mestre está editando o mapa. A exploração será liberada novamente em breve.',characters:[]}
  const map=mapRecord(row)
  const characters=m.role==='PLAYER'?await prisma.character.findMany({where:{campaignId:m.campaignId,playerId:m.userId},select:{id:true,name:true,forca:true,level:true,birthRank:true,race:{select:{isCorrupted:true}}}}):[]
  const inventory=m.role==='PLAYER'?await prisma.inventoryItem.findMany({where:{campaignId:m.campaignId,ownerId:{in:characters.map(c=>c.id)}},select:{id:true,name:true,ownerId:true}}):[]
  const characterChoices=characters.map(c=>{const rank=requireCurrentRank(c.level,c.birthRank,c.race.isCorrupted);const capacity=10+c.forca+Math.max(0,['D','C','B','A','S'].indexOf(rank))*5;const owned=inventory.filter(i=>i.ownerId===c.id);return{id:c.id,name:c.name,capacity,used:owned.length,items:owned.map(i=>({id:i.id,name:i.name}))}})
  return {map,room:map.rooms.find(r=>r.id===s.currentRoomId)??null,discovered:Array.isArray(s.discovered)?s.discovered as string[]:[],notice:null,characters:characterChoices}
}
export async function moveExplorationGroup(roomId:string, accessCode?:string) {
  const m=await member()
  const moved=await prisma.$transaction(async tx=>{
    const states=await tx.$queryRaw<Array<{currentMapId:string|null;currentRoomId:string|null}>>`SELECT "currentMapId","currentRoomId" FROM "CampaignExplorationState" WHERE "campaignId"=${m.campaignId} FOR UPDATE`; const s=states[0]
    if(!s?.currentMapId||!s.currentRoomId) throw new Error('Nenhum mapa ativo')
    const rows=await tx.$queryRaw<Array<{rooms:unknown;isEditing:boolean;isPublished:boolean}>>`SELECT "rooms","isEditing","isPublished" FROM "ExplorationMap" WHERE "id"=${s.currentMapId} AND "campaignId"=${m.campaignId} FOR UPDATE`; const map=rows[0]
    if(!map?.isPublished||map.isEditing) throw new Error('O mapa está temporariamente fechado para edição')
    const rooms=map.rooms as MapRoom[]; const current=rooms.find(r=>r.id===s.currentRoomId); const dest=rooms.find(r=>r.id===roomId); const door=current?.connections.find(c=>c.roomId===roomId) ?? dest?.connections.find(c=>c.roomId===s.currentRoomId)
    if(!dest||!door) throw new Error('Esse caminho não está conectado a esta sala')
    if(door.access?.type==='code'&&door.access.value!==accessCode) throw new Error('Código incorreto')
    if(door.access?.type==='level') throw new Error('A regra de nível exige integração com os personagens')
    await tx.$executeRaw`UPDATE "CampaignExplorationState" SET "currentRoomId"=${roomId},"updatedAt"=NOW() WHERE "campaignId"=${m.campaignId}`; return dest.name
  })
  revalidatePath('/mapas'); return moved
}
export async function discoverExplorationObject(mapId:string,roomId:string,objectId:string,characterId?:string,replaceItemId?:string) {
  const m=await member()
  const found=await prisma.$transaction(async tx=>{
    const states=await tx.$queryRaw<Array<{currentMapId:string|null;currentRoomId:string|null;discovered:unknown}>>`SELECT "currentMapId","currentRoomId","discovered" FROM "CampaignExplorationState" WHERE "campaignId"=${m.campaignId} FOR UPDATE`; const s=states[0]
    if(!s||s.currentMapId!==mapId||s.currentRoomId!==roomId) throw new Error('O grupo já está explorando outra sala')
    const rows=await tx.$queryRaw<Array<{rooms:unknown;isEditing:boolean;isPublished:boolean}>>`SELECT "rooms","isEditing","isPublished" FROM "ExplorationMap" WHERE "id"=${mapId} AND "campaignId"=${m.campaignId} FOR UPDATE`; const map=rows[0]
    if(!map?.isPublished||map.isEditing) throw new Error('A exploração está pausada para edição')
    const object=(map.rooms as MapRoom[]).find(r=>r.id===roomId)?.objects.find(o=>o.id===objectId); if(!object) throw new Error('Elemento não encontrado')
    const key=`${mapId}:${objectId}`; const discovered=Array.isArray(s.discovered)?s.discovered as string[]:[]
    if(object.discoveredOnce!==false&&discovered.includes(key)) throw new Error('Outro jogador já encontrou isso')
    let nextMapId:string|null=null
    let itemName:string|undefined
    if(object.type==='item'&&object.inventoryItemId&&m.role==='PLAYER'){
      if(!characterId) throw new Error('Escolha um personagem para receber o item')
      const character=await tx.character.findFirst({where:{id:characterId,campaignId:m.campaignId,playerId:m.userId},include:{race:true}})
      if(!character) throw new Error('Personagem inválido para esta campanha')
      const item=await tx.inventoryItem.findFirst({where:{id:object.inventoryItemId,campaignId:m.campaignId,ownerId:null,isLocked:false}})
      const drafts=await tx.$queryRaw<Array<{isDraft:boolean}>>`SELECT "isDraft" FROM "InventoryItem" WHERE "id"=${object.inventoryItemId} LIMIT 1`
      if(drafts[0]?.isDraft) throw new Error('Este item não está mais disponível no inventário do Mestre')
      if(!item) throw new Error('Este item não está mais disponível no inventário do Mestre')
      itemName=item.name
      const owned=await tx.inventoryItem.findMany({where:{campaignId:m.campaignId,ownerId:character.id},select:{id:true}})
      const rank=calcCurrentRank(character.level,character.birthRank,character.race.isCorrupted)
      const capacity=10+character.forca+Math.max(0,['D','C','B','A','S'].indexOf(rank))*5
      if(owned.length>=capacity){
        if(!replaceItemId) return {title:object.title,type:object.type,description:object.description??'',image:object.image??'',targetMapId:null,needsReplacement:true,capacity,used:owned.length,replaceItems:await tx.inventoryItem.findMany({where:{campaignId:m.campaignId,ownerId:character.id},select:{id:true,name:true}})}
        const replacement=await tx.inventoryItem.findFirst({where:{id:replaceItemId,campaignId:m.campaignId,ownerId:character.id}})
        if(!replacement) throw new Error('Escolha um item que esteja no inventário desse personagem')
        await tx.inventoryItem.update({where:{id:replacement.id},data:{ownerId:null}})
      } else if(replaceItemId) throw new Error('O personagem ainda tem espaço; tente encontrar o item novamente')
      await tx.inventoryItem.update({where:{id:item.id},data:{ownerId:character.id,isLocked:false}})
    }

    if(object.type==='portal'&&object.targetMapId&&object.targetRoomId){
      const targets=await tx.$queryRaw<Array<{isPublished:boolean;isEditing:boolean;rooms:unknown}>>`SELECT "isPublished","isEditing","rooms" FROM "ExplorationMap" WHERE "id"=${object.targetMapId} AND "campaignId"=${m.campaignId} LIMIT 1`; const target=targets[0]
      if(!target?.isPublished||target.isEditing||!(target.rooms as MapRoom[]).some(r=>r.id===object.targetRoomId)) throw new Error('Portal indisponível')
      await tx.$executeRaw`UPDATE "CampaignExplorationState" SET "currentMapId"=${object.targetMapId},"currentRoomId"=${object.targetRoomId},"updatedAt"=NOW() WHERE "campaignId"=${m.campaignId}`; nextMapId=object.targetMapId
    }
    if(object.discoveredOnce!==false){const next=[...discovered,key]; await tx.$executeRaw`UPDATE "CampaignExplorationState" SET "discovered"=${JSON.stringify(next)}::jsonb,"updatedAt"=NOW() WHERE "campaignId"=${m.campaignId}`}
    return {title:object.title,type:object.type,description:object.description??'',image:object.image??'',targetMapId:nextMapId,itemName}
  })
  revalidatePath('/mapas'); return found
}
