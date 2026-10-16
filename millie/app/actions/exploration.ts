'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import type { ExplorationMapRecord, MapFloor, MapRoom, PublicObject } from '@/lib/types/exploration'
import { calcInventoryCapacity } from '@/lib/utils/inventory'
import { Prisma } from '@/lib/generated/prisma'
import { doorsFor, isOnce, normalizeAccess, validateRoomsGeometry } from '@/lib/utils/exploration'

type Tx = Prisma.TransactionClient
type MapRow = { id: string; name: string; rooms: unknown; floors?: unknown; isEditing: boolean; isPublished: boolean }

async function member(role?: 'MASTER' | 'PLAYER') {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')
  const result = await prisma.campaignMember.findFirst({ where: { userId: session.user.id, active: true, campaign: { archived: false }, ...(role ? { role } : {}) }, select: { campaignId: true, role: true } })
  if (!result) throw new Error(role === 'MASTER' ? 'Apenas o Mestre pode editar mapas' : 'Entre em uma campanha para acessar os mapas')
  return { ...result, userId: session.user.id }
}
function checkedRooms(value: unknown): MapRoom[] {
  // 1. Validação inicial do array de salas
  if (!Array.isArray(value) || value.length > 80) {
    throw new Error('O mapa pode ter até 80 salas');
  }

  // Fazemos o cast para 'any[]' temporariamente para inspecionar com segurança
  const rooms = value as MapRoom[];

  // Criamos o Set de IDs logo no início para usar nas validações
  const ids = new Set(rooms.map(r => r?.id).filter(Boolean));

  const okUrl = (v?: string) => !v || (v.length <= 2048 && /^https:\/\//.test(v));

  for (const room of rooms) {
    // Validação básica da estrutura da sala
    if (
      !room ||
      !room.id ||
      typeof room.name !== 'string' ||
      room.name.length > 80 ||
      !Array.isArray(room.connections) ||
      !Array.isArray(room.objects) ||
      room.objects.length > 100
    ) {
      throw new Error('Dados de sala inválidos');
    }

    // Validação da imagem de fundo da sala
    if (!okUrl(room.background)) {
      throw new Error('Imagem de fundo inválida');
    }
    if (room.class) {
      const lesson = room.class
      if (typeof lesson.prompt !== 'string' || lesson.prompt.length > 2000 || !Array.isArray(lesson.options) || lesson.options.length < 2 || lesson.options.length > 6 || lesson.options.some(option => !option?.id || typeof option.label !== 'string' || !option.label.trim() || option.label.length > 160) || !lesson.correctOptionId || !lesson.options.some(option => option.id === lesson.correctOptionId) || !lesson.teacherCharacterId || !Number.isInteger(lesson.favorReward ?? 1) || (lesson.favorReward ?? 1) < 1 || (lesson.favorReward ?? 1) > 3 || !okUrl(lesson.image)) {
        throw new Error(`Configure professor, pergunta, imagem opcional e de 2 a 6 respostas para a aula de "${room.name}"`)
      }
      if (lesson.ritualSymbol && lesson.ritualSymbol.length > 500) throw new Error('O símbolo de ritual deve ter no máximo 500 caracteres')
    }

    // Validação das conexões entre salas
    if (room.connections.some((c) => !c || c.roomId === room.id || !ids.has(c.roomId))) {
      throw new Error('Conexão inválida entre salas');
    }
    if (room.roomChoiceTargets !== undefined && (!Array.isArray(room.roomChoiceTargets) || room.roomChoiceTargets.length > 80 || room.roomChoiceTargets.some(id => typeof id !== 'string' || id === room.id || !ids.has(id)) || new Set(room.roomChoiceTargets).size !== room.roomChoiceTargets.length)) {
      throw new Error(`Destinos inválidos na escolha de sala de "${room.name}"`)
    }

    // Validação dos objetos/elementos da sala
    for (const object of room.objects) {
      if (!object || !object.id || !['scene', 'item', 'character', 'portal', 'mission'].includes(object.type)) {
        throw new Error('Elemento inválido');
      }

      // Validação de posição (x, y)
      if (![object.x, object.y].every(n => Number.isFinite(n) && n >= 0 && n <= 100)) {
        throw new Error('Posição de elemento inválida');
      }

      // Validação de Textos (title e description) e Imagem do objeto
      if (
        typeof object.title !== 'string' || 
        object.title.length > 120 || 
        (object.description && typeof object.description !== 'string') ||
        (object.description?.length ?? 0) > 2000 || 
        !okUrl(object.image)
      ) {
        throw new Error('Elemento com dados inválidos');
      }

      // Regras de negócio específicas por tipo de objeto
      if (object.type === 'item' && !object.inventoryItemId) {
        throw new Error(`Selecione um item do inventário para "${object.title}"`);
      }

      if (object.type === 'portal' && (!object.targetMapId || !object.targetRoomId)) {
        throw new Error(`Configure o mapa e a sala de destino do portal "${object.title}"`);
      }
      if (object.type === 'portal' && object.portalState !== undefined && !['active', 'inactive', 'blocked'].includes(object.portalState)) {
        throw new Error(`Estado inválido para o portal "${object.title}"`)
      }
      if (object.type === 'portal' && object.portalStyle !== undefined && !['arch', 'rune-circle', 'mirror', 'rift'].includes(object.portalStyle)) {
        throw new Error(`Forma inválida para o portal "${object.title}"`)
      }
      if (object.type === 'mission' && (!object.missionObjectiveItemId || !Number.isInteger(object.missionObjectiveQuantity) || (object.missionObjectiveQuantity ?? 0) < 1 || (object.missionObjectiveQuantity ?? 0) > 999))
        throw new Error(`Configure o item e a quantidade do objetivo da missão "${object.title}"`)
      if (object.type === 'mission' && (!Number.isInteger(object.missionFavorDelta ?? 0) || Math.abs(object.missionFavorDelta ?? 0) > 3 || !Number.isInteger(object.missionCurrencyDelta ?? 0)))
        throw new Error(`Recompensa inválida na missão "${object.title}"`)

      // Validação das opções da cena (garantindo que é um array antes de testar)
      if (Array.isArray(object.options)) {
        if (object.options.some((option) => !option || typeof option.label !== 'string' || !option.label.trim())) {
          throw new Error('Preencha o nome de todas as opções da cena');
        }
      }
    }
  }
  validateRoomsGeometry(rooms as MapRoom[]);
  return rooms as MapRoom[];
}

const mapRecord = (row: MapRow) => ({ ...row, rooms: (row.rooms ?? []) as MapRoom[], floors: (row.floors ?? [{id:'ground',name:'Térreo'}]) as MapFloor[] })

export async function listExplorationMaps() {
  const m = await member()
  const rows = m.role === 'MASTER'
    ? await prisma.$queryRaw<MapRow[]>`SELECT "id","name","rooms","floors","isEditing","isPublished" FROM "ExplorationMap" WHERE "campaignId"=${m.campaignId} ORDER BY "createdAt" DESC`
    : await prisma.$queryRaw<MapRow[]>`SELECT "id","name","rooms","floors","isEditing","isPublished" FROM "ExplorationMap" WHERE "campaignId"=${m.campaignId} AND "isPublished"=true ORDER BY "createdAt" DESC`
  const [state] = await prisma.$queryRaw<Array<{ currentMapId: string | null; currentRoomId: string | null }>>`SELECT "currentMapId","currentRoomId" FROM "CampaignExplorationState" WHERE "campaignId"=${m.campaignId} LIMIT 1`
  const maps = rows.map(mapRecord)
  return {
    maps: (m.role === 'MASTER' ? maps : maps.map(map => ({ ...map, rooms: [] }))) satisfies ExplorationMapRecord[],
    currentMapId: state?.currentMapId ?? null,
    currentRoomId: state?.currentRoomId ?? null,
  }
}

export async function getActiveExplorationMap() {
  const m = await member()
  const [state] = await prisma.$queryRaw<Array<{ currentMapId: string | null; currentRoomId: string | null }>>`SELECT "currentMapId","currentRoomId" FROM "CampaignExplorationState" WHERE "campaignId"=${m.campaignId} LIMIT 1`
  if (!state?.currentMapId) return null
  const [map] = await prisma.$queryRaw<Array<{ name: string; rooms: unknown }>>`SELECT "name","rooms" FROM "ExplorationMap" WHERE "id"=${state.currentMapId} AND "campaignId"=${m.campaignId} LIMIT 1`
  if (!map) return null
  const room = ((map.rooms ?? []) as MapRoom[]).find(candidate => candidate.id === state.currentRoomId)
  return { mapName: map.name, roomName: room?.name ?? null }
}

export async function createExplorationMap(name = 'Novo mapa') {
  const m = await member('MASTER'); const id = randomUUID(); const clean = name.trim().slice(0,80) || 'Novo mapa'
  // Raw SQL bypasses Prisma's @updatedAt handling, so provide both timestamps.
  await prisma.$executeRaw`INSERT INTO "ExplorationMap" ("id","campaignId","name","rooms","floors","isEditing","isPublished","createdAt","updatedAt") VALUES (${id},${m.campaignId},${clean},'[]'::jsonb,'[{"id":"ground","name":"Térreo"}]'::jsonb,true,false,NOW(),NOW())`
  revalidatePath('/mapas'); return id
}
export async function getExplorationAssets() {
  const m=await member('MASTER')
  const [maps,items, allItems]=await Promise.all([
    prisma.$queryRaw<Array<{id:string;name:string;rooms:unknown;isPublished:boolean;isEditing:boolean}>>`SELECT "id","name","rooms","floors","isPublished","isEditing" FROM "ExplorationMap" WHERE "campaignId"=${m.campaignId} ORDER BY "createdAt" DESC`,
    prisma.$queryRaw<Array<{id:string;name:string;category:string;image:string|null}>>`SELECT "id","name","category","image" FROM "InventoryItem" WHERE "campaignId"=${m.campaignId} AND "ownerId" IS NULL AND "isLocked"=false AND "isDraft"=false ORDER BY "name"`,
    prisma.$queryRaw<Array<{ id: string; name: string }>>`SELECT "id","name" FROM "InventoryItem" WHERE "campaignId"=${m.campaignId} AND "isDraft"=false ORDER BY "name"`,
  ])
  const characters=await prisma.character.findMany({where:{campaignId:m.campaignId},select:{id:true,name:true,image:true,category:true},orderBy:{name:'asc'}})
  return {maps:maps.map(mapRecord),items, allItems, characters}
}
export async function getExplorationMap(id: string) {
  const m = await member('MASTER'); const rows = await prisma.$queryRaw<MapRow[]>`SELECT "id","name","rooms","floors","isEditing","isPublished" FROM "ExplorationMap" WHERE "id"=${id} AND "campaignId"=${m.campaignId} LIMIT 1`
  return rows[0] ? mapRecord(rows[0]) : null
}
export async function saveExplorationMap(id: string, name: string, value: unknown, floorValue?: unknown) {
  const m = await member('MASTER'); const rooms = checkedRooms(value).map(room => ({...room,connections:room.connections.map(connection => ({...connection,accessMode:connection.accessMode ?? (Object.values(normalizeAccess(connection.access)).some(Boolean) ? 'restricted' : 'open')}))})); const clean = name.trim().slice(0,80) || 'Mapa sem nome'; const floors = Array.isArray(floorValue) ? floorValue.filter((f): f is MapFloor => !!f && typeof f.id === 'string' && typeof f.name === 'string' && !!f.name.trim()).slice(0,20) : [{id:'ground',name:'Térreo'}]; if(!floors.length) throw new Error('Adicione pelo menos um andar'); const floorIds=new Set(floors.map(f=>f.id)); if(rooms.some(r=>!floorIds.has(r.floorId??'ground'))) throw new Error('Cada sala precisa pertencer a um andar existente')
  const missionItems = [...new Set(rooms.flatMap(room => room.objects.filter(object => object.type === 'mission').map(object => object.missionObjectiveItemId!)))]
  const missionFavorCharacters = [...new Set(rooms.flatMap(room => room.objects.filter(object => object.type === 'mission' && (object.missionFavorDelta ?? 0) !== 0).map(object => object.missionFavorCharacterId).filter((value): value is string => !!value)))]
  const classTeachers = [...new Set(rooms.map(room => room.class?.teacherCharacterId).filter((value): value is string => !!value))]
  if (missionItems.length && await prisma.inventoryItem.count({ where: { id: { in: missionItems }, campaignId: m.campaignId } }) !== missionItems.length) throw new Error('Uma missão referencia um item que não pertence à campanha')
  if (missionFavorCharacters.length && await prisma.character.count({ where: { id: { in: missionFavorCharacters }, campaignId: m.campaignId } }) !== missionFavorCharacters.length) throw new Error('Uma missão referencia um personagem inválido para a recompensa de Favor')
  if (classTeachers.length && await prisma.character.count({ where: { id: { in: classTeachers }, campaignId: m.campaignId } }) !== classTeachers.length) throw new Error('Uma aula referencia um professor que não pertence à campanha')
  const n = await prisma.$executeRaw`UPDATE "ExplorationMap" SET "name"=${clean},"rooms"=${JSON.stringify(rooms)}::jsonb,"floors"=${JSON.stringify(floors)}::jsonb,"updatedAt"=NOW() WHERE "id"=${id} AND "campaignId"=${m.campaignId} AND "isEditing"=true`
  if (!n) throw new Error('Mapa não encontrado ou edição encerrada'); revalidatePath('/mapas')
}
export async function finishExplorationMap(id: string) {
  const m = await member('MASTER')
  await prisma.$transaction(async tx => {
    const rows = await tx.$queryRaw<Array<{rooms: unknown}>>`UPDATE "ExplorationMap" SET "isEditing"=false,"isPublished"=true,"updatedAt"=NOW() WHERE "id"=${id} AND "campaignId"=${m.campaignId} AND jsonb_array_length("rooms")>0 RETURNING "rooms"`
    if (!rows.length) throw new Error('Adicione pelo menos uma sala antes de liberar o mapa')
    const rooms = rows[0].rooms as MapRoom[]
    const states = await tx.$queryRaw<Array<{ currentMapId: string | null; currentRoomId: string | null }>>`SELECT "currentMapId","currentRoomId" FROM "CampaignExplorationState" WHERE "campaignId"=${m.campaignId} FOR UPDATE`
    if (!states.length) {
      const interaction = await firstEntryScene(tx, m.campaignId, id, rooms[0], m.userId)
      await tx.$executeRaw`INSERT INTO "CampaignExplorationState" ("campaignId","currentMapId","currentRoomId","discovered","activeInteraction","updatedAt") VALUES (${m.campaignId},${id},${rooms[0].id},'[]'::jsonb,${interaction ? JSON.stringify(interaction) : null}::jsonb,NOW())`
    } else if (!states[0].currentMapId) {
      const interaction = await firstEntryScene(tx, m.campaignId, id, rooms[0], m.userId)
      await tx.$executeRaw`UPDATE "CampaignExplorationState" SET "currentMapId"=${id},"currentRoomId"=${rooms[0].id},"activeInteraction"=${interaction ? JSON.stringify(interaction) : null}::jsonb,"updatedAt"=NOW() WHERE "campaignId"=${m.campaignId}`
    } else if (states[0].currentMapId === id && !rooms.some(r => r.id === states[0].currentRoomId)) {
      const interaction = await firstEntryScene(tx, m.campaignId, id, rooms[0], m.userId)
      await tx.$executeRaw`UPDATE "CampaignExplorationState" SET "currentRoomId"=${rooms[0].id},"activeInteraction"=${interaction ? JSON.stringify(interaction) : null}::jsonb,"updatedAt"=NOW() WHERE "campaignId"=${m.campaignId}`
    }
  })
  revalidatePath('/mapas')
}

async function assertAccess(tx: Tx, campaignId: string, playerId: string, raw: unknown, code?: string) {
  const a = normalizeAccess(raw)
  if (a.code && a.code.toLowerCase() !== (code ?? '').trim().toLowerCase()) throw new Error('Código incorreto')
  if (!a.level && !a.itemId && !a.affinityCharacterId) return
  const party = await tx.character.findMany({ where: { campaignId, playerId }, select: { id: true, level: true, category: true } })
  if (a.level && !party.some(c => c.level >= a.level!)) throw new Error(`Seu personagem precisa ter nível ${a.level}`)
  if (a.itemId && !(await tx.inventoryItem.count({ where: { id: a.itemId, campaignId, ownerId: { in: party.map(c => c.id) } } })))
    throw new Error('Seu personagem não possui o item necessário')
  const students = party.filter(character => character.category === 'aluno')
  if (a.affinityCharacterId && (!students.length || !(await tx.$queryRaw<Array<{ ok: number }>>`SELECT 1 AS ok FROM "CharacterAffinity" WHERE "campaignId"=${campaignId} AND "sourceCharacterId"=${a.affinityCharacterId} AND "targetCharacterId" IN (${Prisma.join(students.map(c => c.id))}) AND "value">=${a.affinity ?? 0} LIMIT 1`).length))
    throw new Error(`Um aluno precisa ter Favor ${a.affinity ?? 0} com o personagem exigido`)
}

async function firstEntryScene(tx: Tx, campaignId: string, mapId: string, room: MapRoom, userId: string) {
  for (const scene of room.objects.filter(object => object.type === 'scene')) {
    const inserted = await tx.$executeRaw`INSERT INTO "ExplorationDiscovery" ("campaignId","mapId","objectId","type","title","foundByUserId") VALUES (${campaignId},${mapId},${scene.id},'scene',${scene.title},${userId}) ON CONFLICT DO NOTHING`
    if (inserted) return { id: scene.id, mapId, roomId: room.id, objectId: scene.id, title: scene.title, type: 'scene', image: scene.image ?? null, description: scene.description ?? '', options: [], choiceText: '' }
  }
  return null
}

export async function beginExplorationMapEdit(id:string) { const m=await member('MASTER'); const n=await prisma.$executeRaw`UPDATE "ExplorationMap" SET "isEditing"=true,"updatedAt"=NOW() WHERE "id"=${id} AND "campaignId"=${m.campaignId}`; if(!n) throw new Error('Mapa não encontrado'); revalidatePath('/mapas') }
export async function deleteExplorationMap(id:string) { const m=await member('MASTER'); await prisma.$transaction(async tx=>{ await tx.$executeRaw`DELETE FROM "ExplorationMap" WHERE "id"=${id} AND "campaignId"=${m.campaignId}`; await tx.$executeRaw`UPDATE "CampaignExplorationState" SET "currentMapId"=NULL,"currentRoomId"=NULL,"updatedAt"=NOW() WHERE "campaignId"=${m.campaignId} AND "currentMapId"=${id}` }); revalidatePath('/mapas') }
export async function getPlayerExplorationSnapshot(previewMapId?: string, previewRoomId?: string) {
  const m = await member()
  const previewMaps = m.role === 'MASTER' ? (await prisma.$queryRaw<MapRow[]>`SELECT "id","name","rooms","floors","isEditing","isPublished" FROM "ExplorationMap" WHERE "campaignId"=${m.campaignId} ORDER BY "createdAt" DESC`).map(x => ({ id:x.id, name:x.name, rooms:((x.rooms ?? []) as MapRoom[]).map(r=>({id:r.id,name:r.name,floorName:((x.floors ?? []) as MapFloor[]).find(f=>f.id===(r.floorId??'ground'))?.name??'Térreo'})) })) : []
  const closed = (notice: string) => ({ map: null, room: null, doors: [], notice, characters: [], masterPreview: m.role === 'MASTER', previewMaps, activeInteraction: null })
  const [s] = await prisma.$queryRaw<Array<{ currentMapId: string | null; currentRoomId: string | null }>>`SELECT "currentMapId","currentRoomId" FROM "CampaignExplorationState" WHERE "campaignId"=${m.campaignId} LIMIT 1`
  const selectedMapId = m.role === 'MASTER' && previewMapId ? previewMapId : s?.currentMapId
  const selectedRoomId = m.role === 'MASTER' && previewMapId ? previewRoomId : s?.currentRoomId
  if (!selectedMapId || !selectedRoomId) return closed(m.role === 'MASTER' ? 'Escolha um mapa e uma sala para pré-visualizar.' : 'O Mestre ainda não liberou um mapa para exploração.')
  const [row] = await prisma.$queryRaw<MapRow[]>`SELECT "id","name","rooms","floors","isEditing","isPublished" FROM "ExplorationMap" WHERE "id"=${selectedMapId} AND "campaignId"=${m.campaignId} LIMIT 1`
  if (!row) return closed('Mapa não encontrado.')
  if (!row?.isPublished && m.role !== 'MASTER') return closed('O Mestre ainda não liberou um mapa para exploração.')
  if (row?.isEditing && m.role !== 'MASTER') return closed('O Mestre está editando o mapa. A exploração será liberada novamente em breve.')
  const rooms = (row.rooms ?? []) as MapRoom[]
  const room = rooms.find(r => r.id === selectedRoomId)
  if (!room) return closed('A sala atual deixou de existir. O Mestre precisa reposicionar o grupo.')

  const found = await prisma.$queryRaw<Array<{ objectId: string }>>`SELECT "objectId" FROM "ExplorationDiscovery" WHERE "campaignId"=${m.campaignId} AND "mapId"=${row.id}`
  const done = new Set(found.map(f => f.objectId))
  if (m.role === 'PLAYER' && s?.currentMapId === row.id && s.currentRoomId === room.id && room.objects.some(o => o.type === 'scene' && !done.has(o.id))) {
    await prisma.$transaction(async tx => {
      const [state] = await tx.$queryRaw<Array<{currentMapId:string|null;currentRoomId:string|null;activeInteraction:unknown}>>`SELECT "currentMapId","currentRoomId","activeInteraction" FROM "CampaignExplorationState" WHERE "campaignId"=${m.campaignId} FOR UPDATE`
      if (!state || state.currentMapId !== row.id || state.currentRoomId !== room.id || state.activeInteraction) return
      const interaction = await firstEntryScene(tx, m.campaignId, row.id, room, m.userId)
      if (interaction) await tx.$executeRaw`UPDATE "CampaignExplorationState" SET "activeInteraction"=${JSON.stringify(interaction)}::jsonb,"updatedAt"=NOW() WHERE "campaignId"=${m.campaignId}`
    })
  }
  const itemIds = room.objects.flatMap(o => (o.type === 'item' && o.inventoryItemId ? [o.inventoryItemId] : []))
  const free = new Set((await prisma.inventoryItem.findMany({ where: { id: { in: itemIds }, campaignId: m.campaignId, ownerId: null, isLocked: false }, select: { id: true } })).map(i => i.id))
  const objects: PublicObject[] = room.objects
    .filter(o => (o.type !== 'scene' || m.role === 'MASTER') && !(isOnce(o) && done.has(o.id)) && (o.type !== 'item' || (!!o.inventoryItemId && free.has(o.inventoryItemId))))
    .map(o => ({ id: o.id, title: o.title, type: o.type, x: o.x, y: o.y, image: o.image, portalState: o.type === 'portal' ? (o.portalState ?? 'active') : undefined, portalStyle: o.type === 'portal' ? (o.portalStyle ?? 'arch') : undefined, description: o.type === 'mission' ? o.description : undefined, missionObjectiveItemId: o.type === 'mission' ? o.missionObjectiveItemId : undefined, missionObjectiveQuantity: o.type === 'mission' ? o.missionObjectiveQuantity : undefined, missionFavorCharacterId: o.type === 'mission' ? o.missionFavorCharacterId : undefined, missionFavorDelta: o.type === 'mission' ? o.missionFavorDelta : undefined, missionCurrencyDelta: o.type === 'mission' ? o.missionCurrencyDelta : undefined, needsCode: o.type === 'portal' && !!normalizeAccess(o.access).code }))

  const mine = m.role === 'PLAYER'
    ? await prisma.character.findMany({ where: { campaignId: m.campaignId, playerId: m.userId }, select: { id: true, name: true, forca: true, level: true, birthRank: true, rankLosses: true, race: { select: { isCorrupted: true } } } })
    : []
  const inv = mine.length ? await prisma.inventoryItem.findMany({ where: { campaignId: m.campaignId, ownerId: { in: mine.map(c => c.id) } }, select: { id: true, name: true, ownerId: true } }) : []
  const characters = mine.map(c => {
    const owned = inv.filter(i => i.ownerId === c.id)
    return { id: c.id, name: c.name, capacity: calcInventoryCapacity(c), used: owned.length, items: owned.map(i => ({ id: i.id, name: i.name })) }
  })

  const [stateRow] = !previewMapId && s?.currentMapId === row.id ? await prisma.$queryRaw<Array<{activeInteraction:unknown}>>`SELECT "activeInteraction" FROM "CampaignExplorationState" WHERE "campaignId"=${m.campaignId} LIMIT 1` : []
  const storedInteraction = stateRow?.activeInteraction as {mapId:string;roomId:string;objectId:string;title:string;type:string;image?:string;description?:string;options?:MapRoom['objects'][number]['options'];choiceText?:string}|null
  let activeInteraction = storedInteraction
  if (activeInteraction?.type === 'class') {
    const lesson = activeInteraction as typeof activeInteraction & { correctOptionId?: string; answers?: Record<string, {correct:boolean;selectedOptionId:string}> }
    const ownIds = new Set(mine.map(character => character.id))
    activeInteraction = {
      ...lesson,
      ...(m.role === 'PLAYER' ? { correctOptionId: undefined, answers: Object.fromEntries(Object.entries(lesson.answers ?? {}).filter(([id]) => ownIds.has(id))) } : {}),
    }
  }
  return {
    map: { id: row.id, name: row.name },
    room: { id: room.id, name: room.name, floorName: ((row.floors ?? []) as MapFloor[]).find(f => f.id === (room.floorId ?? 'ground'))?.name ?? 'Térreo', background: room.background ?? null, objects },
    doors: doorsFor(rooms, room),
    notice: null,
    characters,
    masterPreview: m.role === 'MASTER',
    previewMaps,
    activeInteraction: activeInteraction?.mapId === row.id && activeInteraction.roomId === room.id ? activeInteraction : null,
  }
}

export async function moveExplorationGroup(fromRoomId: string, roomId: string, accessCode?: string) {
  const m = await member()
  const moved = await prisma.$transaction(async tx => {
    const [s] = await tx.$queryRaw<Array<{ currentMapId: string | null; currentRoomId: string | null }>>`SELECT "currentMapId","currentRoomId" FROM "CampaignExplorationState" WHERE "campaignId"=${m.campaignId} FOR UPDATE`
    if (m.role === 'MASTER') throw new Error('A visão de jogador do Mestre é apenas uma prévia')
    if (!s?.currentMapId || !s.currentRoomId) throw new Error('Nenhum mapa ativo')
    if (s.currentRoomId !== fromRoomId) throw new Error('O grupo já mudou de sala')
    const [map] = await tx.$queryRaw<Array<{ rooms: unknown; isEditing: boolean; isPublished: boolean }>>`SELECT "rooms","isEditing","isPublished" FROM "ExplorationMap" WHERE "id"=${s.currentMapId} AND "campaignId"=${m.campaignId} FOR UPDATE`
    if (!map?.isPublished || map.isEditing) throw new Error('O mapa está temporariamente fechado para edição')
    const rooms = map.rooms as MapRoom[]
    const current = rooms.find(r => r.id === s.currentRoomId)
    const dest = rooms.find(r => r.id === roomId)
    const door = current?.connections.find(c => c.roomId === roomId) ?? dest?.connections.find(c => c.roomId === s.currentRoomId)
    if (!dest || !door) throw new Error('Esse caminho não está conectado a esta sala')
    await assertAccess(tx, m.campaignId, m.userId, door.access, accessCode)
    const interaction = await firstEntryScene(tx, m.campaignId, s.currentMapId, dest, m.userId)
    await tx.$executeRaw`UPDATE "CampaignExplorationState" SET "currentRoomId"=${roomId},"activeInteraction"=${interaction ? JSON.stringify(interaction) : null}::jsonb,"updatedAt"=NOW() WHERE "campaignId"=${m.campaignId}`
    return dest.name
  })
  revalidatePath('/mapas'); return moved
}

/** Abre uma escolha de destino para o grupo, limitada às salas do mapa ativo. */
export async function startExplorationRoomChoice() {
  const m = await member('MASTER')
  await prisma.$transaction(async tx => {
    const [state] = await tx.$queryRaw<Array<{currentMapId:string|null;currentRoomId:string|null;activeInteraction:unknown}>>`SELECT "currentMapId","currentRoomId","activeInteraction" FROM "CampaignExplorationState" WHERE "campaignId"=${m.campaignId} FOR UPDATE`
    if (!state?.currentMapId || !state.currentRoomId) throw new Error('Ative um mapa e coloque o grupo em uma sala antes de pedir uma escolha')
    const [map] = await tx.$queryRaw<Array<{name:string;rooms:unknown;floors:unknown;isPublished:boolean;isEditing:boolean}>>`SELECT "name","rooms","floors","isPublished","isEditing" FROM "ExplorationMap" WHERE "id"=${state.currentMapId} AND "campaignId"=${m.campaignId} FOR UPDATE`
    if (!map?.isPublished || map.isEditing) throw new Error('O mapa precisa estar publicado e fora de edição')
    if (state.activeInteraction) throw new Error('Encerre a interação atual antes de abrir a escolha de sala')
    const rooms = map.rooms as MapRoom[]
    const currentRoom = rooms.find(room => room.id === state.currentRoomId)
    if (!currentRoom) throw new Error('A sala ativa não pertence mais ao mapa')
    const targets = currentRoom.roomChoiceTargets ?? rooms.filter(room => room.id !== currentRoom.id).map(room => room.id)
    const floors = (map.floors ?? []) as MapFloor[]
    const options = rooms.filter(room => room.id !== currentRoom.id && targets.includes(room.id)).map(room => {
      const floorName = floors.find(floor => floor.id === (room.floorId ?? 'ground'))?.name
      return {id:room.id,label:floorName ? `${room.name} · ${floorName}` : room.name,targetRoomId:room.id}
    })
    if (!options.length) throw new Error('Este mapa não possui outras salas para escolher')
    const interaction = {id:randomUUID(),mapId:state.currentMapId,roomId:state.currentRoomId,objectId:'room-choice',title:'Escolham o próximo destino',type:'room-choice',description:'O Mestre abriu uma escolha de destino. O grupo pode selecionar uma sala deste mapa.',options}
    await tx.$executeRaw`UPDATE "CampaignExplorationState" SET "activeInteraction"=${JSON.stringify(interaction)}::jsonb,"updatedAt"=NOW() WHERE "campaignId"=${m.campaignId}`
  })
  revalidatePath('/mapas')
}

export async function cancelExplorationRoomChoice() {
  const m = await member('MASTER')
  const n = await prisma.$executeRaw`UPDATE "CampaignExplorationState" SET "activeInteraction"=NULL,"updatedAt"=NOW() WHERE "campaignId"=${m.campaignId} AND "activeInteraction"->>'type'='room-choice'`
  if (!n) throw new Error('Não há uma escolha de sala ativa')
  revalidatePath('/mapas')
}

export async function getExplorationRoomChoice() {
  const m = await member()
  const [state] = await prisma.$queryRaw<Array<{activeInteraction:unknown}>>`SELECT "activeInteraction" FROM "CampaignExplorationState" WHERE "campaignId"=${m.campaignId} LIMIT 1`
  const interaction = state?.activeInteraction as {id:string;mapId:string;roomId:string;objectId:string;title:string;type:string;description:string;options:Array<{id:string;label:string;targetRoomId:string}>}|null
  if (!interaction || interaction.type !== 'room-choice') return null
  return {id:interaction.id,mapId:interaction.mapId,roomId:interaction.roomId,title:interaction.title,description:interaction.description,options:interaction.options}
}

export async function chooseExplorationRoom(mapId: string, choiceId: string, targetRoomId: string) {
  const m = await member('PLAYER')
  await prisma.$transaction(async tx => {
    const [state] = await tx.$queryRaw<Array<{currentMapId:string|null;currentRoomId:string|null;activeInteraction:unknown}>>`SELECT "currentMapId","currentRoomId","activeInteraction" FROM "CampaignExplorationState" WHERE "campaignId"=${m.campaignId} FOR UPDATE`
    const interaction = state?.activeInteraction as {id:string;mapId:string;roomId:string;type:string;options:Array<{id:string;label:string;targetRoomId:string}>}|null
    if (!interaction || interaction.type !== 'room-choice' || interaction.id !== choiceId || interaction.mapId !== mapId || state?.currentMapId !== mapId || state.currentRoomId !== interaction.roomId) throw new Error('Esta escolha de sala não está mais ativa')
    const option = interaction.options.find(entry => entry.targetRoomId === targetRoomId)
    if (!option) throw new Error('Sala indisponível nesta escolha')
    const [map] = await tx.$queryRaw<Array<{rooms:unknown;isPublished:boolean;isEditing:boolean}>>`SELECT "rooms","isPublished","isEditing" FROM "ExplorationMap" WHERE "id"=${mapId} AND "campaignId"=${m.campaignId} FOR UPDATE`
    if (!map?.isPublished || map.isEditing) throw new Error('O mapa está temporariamente fechado para edição')
    const dest = (map.rooms as MapRoom[]).find(room => room.id === targetRoomId)
    if (!dest) throw new Error('A sala escolhida não pertence mais a este mapa')
    const scene = await firstEntryScene(tx,m.campaignId,mapId,dest,m.userId)
    await tx.$executeRaw`UPDATE "CampaignExplorationState" SET "currentRoomId"=${dest.id},"activeInteraction"=${scene?JSON.stringify(scene):null}::jsonb,"updatedAt"=NOW() WHERE "campaignId"=${m.campaignId}`
  })
  revalidatePath('/mapas')
}

export async function discoverExplorationObject(mapId: string, roomId: string, objectId: string, characterId?: string, replaceItemId?: string, accessCode?: string) {
  const m = await member()
  const found = await prisma.$transaction(async tx => {
    const [s] = await tx.$queryRaw<Array<{ currentMapId: string | null; currentRoomId: string | null }>>`SELECT "currentMapId","currentRoomId" FROM "CampaignExplorationState" WHERE "campaignId"=${m.campaignId} FOR UPDATE`
    if (m.role !== 'MASTER' && (!s || s.currentMapId !== mapId || s.currentRoomId !== roomId)) throw new Error('O grupo já está explorando outra sala')
    const [map] = await tx.$queryRaw<Array<{ rooms: unknown; isEditing: boolean; isPublished: boolean }>>`SELECT "rooms","isEditing","isPublished" FROM "ExplorationMap" WHERE "id"=${mapId} AND "campaignId"=${m.campaignId} FOR UPDATE`
    if (!map || (m.role !== 'MASTER' && (!map.isPublished || map.isEditing))) throw new Error('A exploração está pausada para edição')
    const object = (map.rooms as MapRoom[]).find(r => r.id === roomId)?.objects.find(o => o.id === objectId)
    if (!object) throw new Error('Elemento não encontrado')

    const once = isOnce(object)
    const base = { title: object.title, type: object.type, description: object.description ?? '', image: object.image ?? '', options: object.options ?? [] }
    // A visão do Mestre é apenas uma prévia, inclusive para portais e itens.
    if (m.role === 'MASTER') return { ...base, targetMapId: null, preview: true as const }
    if (object.type === 'portal' && object.portalState === 'inactive') throw new Error('Este portal está inativo')
    if (object.type === 'portal' && object.portalState === 'blocked') throw new Error('Este portal está bloqueado')
    if (once) {
      const done = await tx.$queryRaw<Array<{ ok: number }>>`SELECT 1 AS "ok" FROM "ExplorationDiscovery" WHERE "campaignId"=${m.campaignId} AND "mapId"=${mapId} AND "objectId"=${objectId}`
      if (done.length) throw new Error('Outro jogador já encontrou isso')
    }

    let nextMapId: string | null = null
    let itemName: string | undefined
    if (object.type === 'item') {
      if (!object.inventoryItemId) throw new Error('Item sem vínculo com o inventário')
      if (!characterId) throw new Error('Escolha um personagem para receber o item')
      const character = await tx.character.findFirst({ where: { id: characterId, campaignId: m.campaignId, playerId: m.userId }, include: { race: true } })
      if (!character) throw new Error('Personagem inválido para esta campanha')
      const item = await tx.inventoryItem.findFirst({ where: { id: object.inventoryItemId, campaignId: m.campaignId, ownerId: null, isLocked: false } })
      const [draft] = await tx.$queryRaw<Array<{ isDraft: boolean }>>`SELECT "isDraft" FROM "InventoryItem" WHERE "id"=${object.inventoryItemId} LIMIT 1`
      if (!item || draft?.isDraft) throw new Error('Este item não está mais disponível no inventário do Mestre')
      itemName = item.name

      const owned = await tx.inventoryItem.findMany({ where: { campaignId: m.campaignId, ownerId: character.id }, select: { id: true, name: true } })
      const capacity = calcInventoryCapacity(character)
      if (owned.length >= capacity) {
        // Nada é consumido: o cliente pede a troca e chama de novo com replaceItemId.
        if (!replaceItemId) return { ...base, targetMapId: null, needsReplacement: true as const, capacity, used: owned.length, replaceItems: owned }
        if (!owned.some(i => i.id === replaceItemId)) throw new Error('Escolha um item que esteja no inventário desse personagem')
        await tx.inventoryItem.update({ where: { id: replaceItemId }, data: { ownerId: null } }) // volta ao Mestre, sem aprovação
      } else if (replaceItemId) throw new Error('O personagem ainda tem espaço; tente encontrar o item novamente')
      await tx.inventoryItem.update({ where: { id: item.id }, data: { ownerId: character.id, isLocked: false } })
    }

    if (object.type === 'portal' && object.targetMapId && object.targetRoomId) {
      await assertAccess(tx, m.campaignId, m.userId, object.access, accessCode)
      const [target] = await tx.$queryRaw<Array<{ isPublished: boolean; isEditing: boolean; rooms: unknown }>>`SELECT "isPublished","isEditing","rooms" FROM "ExplorationMap" WHERE "id"=${object.targetMapId} AND "campaignId"=${m.campaignId} LIMIT 1`
      if (!target?.isPublished || target.isEditing || !(target.rooms as MapRoom[]).some(r => r.id === object.targetRoomId)) throw new Error('Portal indisponível')
      const targetRoom = (target.rooms as MapRoom[]).find(r => r.id === object.targetRoomId)!
      const interaction = await firstEntryScene(tx, m.campaignId, object.targetMapId, targetRoom, m.userId)
      await tx.$executeRaw`UPDATE "CampaignExplorationState" SET "currentMapId"=${object.targetMapId},"currentRoomId"=${object.targetRoomId},"activeInteraction"=${interaction ? JSON.stringify(interaction) : null}::jsonb,"updatedAt"=NOW() WHERE "campaignId"=${m.campaignId}`
      nextMapId = object.targetMapId
    }

    if (object.type === 'scene') throw new Error('A cena da sala aparece automaticamente na primeira entrada')
    if (object.type === 'character') {
      const interaction = { id: objectId, mapId, roomId, objectId, title: object.title, type: object.type, image: object.image ?? null, description: object.description ?? '', options: object.options ?? [], choiceText: '' }
      await tx.$executeRaw`UPDATE "CampaignExplorationState" SET "activeInteraction"=${JSON.stringify(interaction)}::jsonb,"updatedAt"=NOW() WHERE "campaignId"=${m.campaignId}`
    }

    if (once) {
      const n = await tx.$executeRaw`INSERT INTO "ExplorationDiscovery" ("campaignId","mapId","objectId","type","title","inventoryItemId","itemName","foundByUserId","characterId") VALUES (${m.campaignId},${mapId},${objectId},${object.type},${object.title},${object.inventoryItemId ?? null},${itemName ?? null},${m.userId},${characterId ?? null}) ON CONFLICT DO NOTHING`
      if (!n) throw new Error('Outro jogador já encontrou isso') // desfaz a transação inteira
    }
    return { ...base, targetMapId: nextMapId, itemName }
  })
  revalidatePath('/mapas'); return found
}

/** Atualiza a fala compartilhada e aplica afinidade conquistada pela escolha. */
export async function chooseExplorationSceneOption(mapId: string, roomId: string, objectId: string, optionId: string) {
  const m = await member()
  if (m.role === 'MASTER') throw new Error('A prévia do Mestre não altera a exploração')
  await prisma.$transaction(async tx => {
    const [state] = await tx.$queryRaw<Array<{currentMapId:string;currentRoomId:string;activeInteraction:unknown}>>`SELECT "currentMapId","currentRoomId","activeInteraction" FROM "CampaignExplorationState" WHERE "campaignId"=${m.campaignId} FOR UPDATE`
    if (state?.currentMapId !== mapId || state.currentRoomId !== roomId) throw new Error('O grupo já mudou de sala')
    const interaction = state.activeInteraction as {mapId:string;roomId:string;objectId:string;type?:string;options?:MapRoom['objects'][number]['options'];chosenOptionId?:string} | null
    if (!interaction || interaction.type !== 'character' || interaction.mapId !== mapId || interaction.roomId !== roomId || interaction.objectId !== objectId) throw new Error('Esta conversa não está mais ativa')
    if (interaction.chosenOptionId) throw new Error('O grupo já fez uma escolha nesta conversa')
    const option = interaction.options?.find(o => o.id === optionId)
    if (!option) throw new Error('Opção indisponível')
    if (option.affinityCharacterId && !(await tx.character.count({where:{id:option.affinityCharacterId,campaignId:m.campaignId}}))) throw new Error('Personagem de afinidade inválido')
    const choiceText = option.resultText || `O grupo escolheu: ${option.label}`
    await tx.$executeRaw`UPDATE "CampaignExplorationState" SET "activeInteraction"="activeInteraction" || ${JSON.stringify({choiceText,chosenOptionId:optionId})}::jsonb,"updatedAt"=NOW() WHERE "campaignId"=${m.campaignId}`
    if (option.affinityCharacterId && option.affinityDelta) {
      if (!Number.isInteger(option.affinityDelta) || Math.abs(option.affinityDelta) > 3) throw new Error('A mudança de Favor deve ser de 1 a 3 pontos')
      const characters = await tx.character.findMany({where:{campaignId:m.campaignId,playerId:m.userId},select:{id:true}})
      for (const character of characters) {
        const [relation] = await tx.$queryRaw<Array<{value:number;sessionChange:number}>>`SELECT "value","sessionChange" FROM "CharacterAffinity" WHERE "campaignId"=${m.campaignId} AND "sourceCharacterId"=${option.affinityCharacterId} AND "targetCharacterId"=${character.id} FOR UPDATE`
        const sessionChange = Math.max(-3, Math.min(3, (relation?.sessionChange ?? 0) + option.affinityDelta))
        const appliedDelta = sessionChange - (relation?.sessionChange ?? 0)
        if (!appliedDelta) continue
        if (relation) await tx.$executeRaw`UPDATE "CharacterAffinity" SET "value"=GREATEST(-9,LEAST(9,"value"+${appliedDelta})),"sessionChange"=${sessionChange} WHERE "campaignId"=${m.campaignId} AND "sourceCharacterId"=${option.affinityCharacterId} AND "targetCharacterId"=${character.id}`
        else await tx.$executeRaw`INSERT INTO "CharacterAffinity" ("campaignId","sourceCharacterId","targetCharacterId","value","sessionChange") VALUES (${m.campaignId},${option.affinityCharacterId},${character.id},GREATEST(-9,LEAST(9,${appliedDelta})),${sessionChange}) ON CONFLICT ("campaignId","sourceCharacterId","targetCharacterId") DO NOTHING`
      }
    }
  })
  revalidatePath('/mapas')
  revalidatePath('/personagens')
}

/** O Mestre inicia uma aula configurada na sala atual; a sessão é compartilhada com os jogadores. */
export async function startMapClassSession(mapId: string, roomId: string) {
  const m = await member('MASTER')
  await prisma.$transaction(async tx => {
    const [state] = await tx.$queryRaw<Array<{ currentMapId: string | null; currentRoomId: string | null }>>`SELECT "currentMapId","currentRoomId" FROM "CampaignExplorationState" WHERE "campaignId"=${m.campaignId} FOR UPDATE`
    const [map] = await tx.$queryRaw<Array<{ rooms: unknown; isEditing: boolean; isPublished: boolean }>>`SELECT "rooms","isEditing","isPublished" FROM "ExplorationMap" WHERE "id"=${mapId} AND "campaignId"=${m.campaignId} LIMIT 1`
    if (!map?.isPublished || map.isEditing || state?.currentMapId !== mapId || state.currentRoomId !== roomId) throw new Error('O grupo precisa estar nesta sala e o mapa deve estar liberado')
    const room = (map.rooms as MapRoom[]).find(entry => entry.id === roomId)
    const lesson = room?.class
    if (!lesson?.teacherCharacterId || !lesson.correctOptionId || lesson.options.length < 2) throw new Error('Configure a aula nesta sala antes de iniciá-la')
    const teacher = await tx.character.findFirst({ where: { id: lesson.teacherCharacterId, campaignId: m.campaignId }, select: { name: true } })
    if (!teacher) throw new Error('O professor configurado não pertence à campanha')
    const interaction = { id: randomUUID(), sessionId: randomUUID(), mapId, roomId, objectId: `class:${roomId}`, title: `Aula — ${room?.name ?? "Sala"}`, type: 'class', image: lesson.image ?? null, description: lesson.prompt, ritualSymbol: lesson.ritualSymbol ?? '', teacherCharacterId: lesson.teacherCharacterId, teacherName: teacher.name, favorReward: lesson.favorReward ?? 1, correctOptionId: lesson.correctOptionId, options: lesson.options, answers: {} }
    await tx.$executeRaw`UPDATE "CampaignExplorationState" SET "activeInteraction"=${JSON.stringify(interaction)}::jsonb,"updatedAt"=NOW() WHERE "campaignId"=${m.campaignId}`
  })
  revalidatePath('/mapas')
}

/** Cada personagem responde uma vez por sessão; acertos concedem Favor ao professor configurado. */
export async function answerMapClass(characterId: string, optionId: string) {
  const m = await member('PLAYER')
  const result = await prisma.$transaction(async tx => {
    const [state] = await tx.$queryRaw<Array<{ currentMapId: string | null; currentRoomId: string | null; activeInteraction: unknown }>>`SELECT "currentMapId","currentRoomId","activeInteraction" FROM "CampaignExplorationState" WHERE "campaignId"=${m.campaignId} FOR UPDATE`
    const lesson = state?.activeInteraction as {mapId:string;roomId:string;type:string;correctOptionId:string;teacherCharacterId:string;favorReward:number;options:Array<{id:string;label:string}>;answers:Record<string,{correct:boolean;selectedOptionId:string;gainedFavor?:boolean}>}|null
    if (!lesson || lesson.type !== 'class' || lesson.mapId !== state?.currentMapId || lesson.roomId !== state?.currentRoomId) throw new Error('Não há aula ativa nesta sala')
    const character = await tx.character.findFirst({ where: { id: characterId, campaignId: m.campaignId, playerId: m.userId }, select: { id: true } })
    if (!character) throw new Error('Escolha um personagem seu para responder')
    if (!lesson.options.some(option => option.id === optionId)) throw new Error('Resposta inválida')
    const answers = lesson.answers ?? {}
    if (answers[characterId]) throw new Error('Este personagem já respondeu à aula')
    const correct = optionId === lesson.correctOptionId
    let gainedFavor = false
    if (correct) {
      const [relation] = await tx.$queryRaw<Array<{value:number;sessionChange:number}>>`SELECT "value","sessionChange" FROM "CharacterAffinity" WHERE "campaignId"=${m.campaignId} AND "sourceCharacterId"=${lesson.teacherCharacterId} AND "targetCharacterId"=${characterId} FOR UPDATE`
      const sessionChange = Math.max(-3, Math.min(3, (relation?.sessionChange ?? 0) + lesson.favorReward))
      const delta = sessionChange - (relation?.sessionChange ?? 0)
      gainedFavor = delta > 0 && (relation?.value ?? 0) < 9
      if (delta > 0) {
        if (relation) await tx.$executeRaw`UPDATE "CharacterAffinity" SET "value"=LEAST(9,"value"+${delta}),"sessionChange"=${sessionChange} WHERE "campaignId"=${m.campaignId} AND "sourceCharacterId"=${lesson.teacherCharacterId} AND "targetCharacterId"=${characterId}`
        else await tx.$executeRaw`INSERT INTO "CharacterAffinity" ("campaignId","sourceCharacterId","targetCharacterId","value","sessionChange") VALUES (${m.campaignId},${lesson.teacherCharacterId},${characterId},${delta},${delta}) ON CONFLICT ("campaignId","sourceCharacterId","targetCharacterId") DO NOTHING`
      }
    }
    answers[characterId] = { correct, selectedOptionId: optionId, gainedFavor }
    const updated = { ...lesson, answers }
    await tx.$executeRaw`UPDATE "CampaignExplorationState" SET "activeInteraction"=${JSON.stringify(updated)}::jsonb,"updatedAt"=NOW() WHERE "campaignId"=${m.campaignId}`
    return { correct, gainedFavor }
  })
  revalidatePath('/mapas'); revalidatePath('/personagens')
  return result
}

export async function endMapClassSession(mapId: string, roomId: string) {
  const m = await member('MASTER')
  const [state] = await prisma.$queryRaw<Array<{activeInteraction:unknown}>>`SELECT "activeInteraction" FROM "CampaignExplorationState" WHERE "campaignId"=${m.campaignId} AND "currentMapId"=${mapId} AND "currentRoomId"=${roomId} LIMIT 1`
  const active = state?.activeInteraction as {type?:string;objectId?:string}|null
  if (active?.type !== 'class' || active.objectId !== `class:${roomId}`) throw new Error('Não há aula ativa nesta sala')
  await prisma.$executeRaw`UPDATE "CampaignExplorationState" SET "activeInteraction"=NULL,"updatedAt"=NOW() WHERE "campaignId"=${m.campaignId} AND "currentMapId"=${mapId} AND "currentRoomId"=${roomId} AND "activeInteraction"->>'type'='class'`
  revalidatePath('/mapas')
}

/** O Mestre abre uma nova sessão e zera o limite de mudança de Favor. */
export async function resetFavorSession() {
  const m = await member('MASTER')
  await prisma.$executeRaw`UPDATE "CharacterAffinity" SET "sessionChange"=0 WHERE "campaignId"=${m.campaignId}`
  revalidatePath('/personagens')
}

export async function closeExplorationInteraction(mapId:string,roomId:string,objectId:string) {
  const m=await member()
  if(m.role==='MASTER') return
  await prisma.$executeRaw`UPDATE "CampaignExplorationState" SET "activeInteraction"=NULL,"updatedAt"=NOW() WHERE "campaignId"=${m.campaignId} AND "currentMapId"=${mapId} AND "currentRoomId"=${roomId} AND "activeInteraction"->>'objectId'=${objectId}`
  revalidatePath('/mapas')
}

export async function getExplorationProgress() {
  const m = await member('MASTER')
  const [state] = await prisma.$queryRaw<Array<{ currentMapId: string | null; currentRoomId: string | null }>>`SELECT "currentMapId","currentRoomId" FROM "CampaignExplorationState" WHERE "campaignId"=${m.campaignId} LIMIT 1`
  const found = await prisma.$queryRaw<Array<{ mapId: string; mapName: string; objectId: string; type: string; title: string; itemName: string | null; foundBy: string | null; createdAt: Date }>>`
    SELECT d."mapId", mp."name" AS "mapName", d."objectId", d."type", d."title", d."itemName", c."name" AS "foundBy", d."createdAt"
    FROM "ExplorationDiscovery" d
    JOIN "ExplorationMap" mp ON mp."id" = d."mapId"
    LEFT JOIN "Character" c ON c."id" = d."characterId"
    WHERE d."campaignId" = ${m.campaignId} ORDER BY d."createdAt" DESC`
  return { state: state ?? null, found }
}

/** Redefine o estado de descobertas de um mapa. returnItems=true também devolve ao Mestre os itens coletados nele. */
export async function resetExplorationMap(mapId: string, returnItems = false) {
  const m = await member('MASTER')
  await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT 1 FROM "CampaignExplorationState" WHERE "campaignId"=${m.campaignId} FOR UPDATE`
    if (returnItems) await tx.$executeRaw`UPDATE "InventoryItem" SET "ownerId"=NULL WHERE "campaignId"=${m.campaignId} AND "id" IN (SELECT "inventoryItemId" FROM "ExplorationDiscovery" WHERE "campaignId"=${m.campaignId} AND "mapId"=${mapId} AND "inventoryItemId" IS NOT NULL)`
    await tx.$executeRaw`DELETE FROM "ExplorationDiscovery" WHERE "campaignId"=${m.campaignId} AND "mapId"=${mapId}`
  })
  revalidatePath('/mapas')
}

/** Mestre posiciona o grupo em qualquer sala de um mapa liberado. */
export async function setExplorationLocation(mapId: string, roomId: string) {
  const m = await member('MASTER')
  const [row] = await prisma.$queryRaw<Array<{ rooms: unknown; isPublished: boolean; isEditing: boolean }>>`SELECT "rooms","isPublished","isEditing" FROM "ExplorationMap" WHERE "id"=${mapId} AND "campaignId"=${m.campaignId} LIMIT 1`
  if (!row?.isPublished || row.isEditing || !(row.rooms as MapRoom[]).some(r => r.id === roomId)) throw new Error('Mapa ou sala indisponível')
  const targetRoom = (row.rooms as MapRoom[]).find(room => room.id === roomId)!
  await prisma.$transaction(async tx => {
    const interaction = await firstEntryScene(tx, m.campaignId, mapId, targetRoom, m.userId)
    await tx.$executeRaw`INSERT INTO "CampaignExplorationState" ("campaignId","currentMapId","currentRoomId","discovered","activeInteraction","updatedAt") VALUES (${m.campaignId},${mapId},${roomId},'[]'::jsonb,${interaction ? JSON.stringify(interaction) : null}::jsonb,NOW()) ON CONFLICT ("campaignId") DO UPDATE SET "currentMapId"=EXCLUDED."currentMapId","currentRoomId"=EXCLUDED."currentRoomId","activeInteraction"=EXCLUDED."activeInteraction","updatedAt"=NOW()`
  })
  revalidatePath('/mapas')
}
