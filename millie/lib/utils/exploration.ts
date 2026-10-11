import type { MapAccess, MapObject, MapRoom, PublicDoor } from '@/lib/types/exploration'

export const isOnce = (o: Pick<MapObject, 'type' | 'discoveredOnce'>) => o.type === 'item' || o.discoveredOnce !== false

/** Aceita o formato antigo ({type:'code',value}) e o novo (combinável). */
export function normalizeAccess(raw: unknown): MapAccess {
  if (!raw || typeof raw !== 'object') return {}
  const a = raw as Record<string, unknown>
  if (a.type === 'open') return {}
  if (a.type === 'level') return { level: Number(a.value) > 0 ? Math.floor(Number(a.value)) : undefined }
  if (a.type === 'code') return { code: typeof a.value === 'string' && a.value.trim() ? a.value.trim() : undefined }
  const level = Number(a.level)
  return {
    level: Number.isFinite(level) && level > 0 ? Math.floor(level) : undefined,
    code: typeof a.code === 'string' && a.code.trim() ? a.code.trim() : undefined,
    itemId: typeof a.itemId === 'string' && a.itemId ? a.itemId : undefined,
    affinityCharacterId: typeof a.affinityCharacterId === 'string' && a.affinityCharacterId ? a.affinityCharacterId : undefined,
    affinity: Number.isFinite(Number(a.affinity)) && Number(a.affinity) > 0 ? Math.floor(Number(a.affinity)) : undefined,
  }
}

/** Portas da sala (nas duas direções) já sem o código e com a direção da seta. */
export function doorsFor(rooms: MapRoom[], room: MapRoom): PublicDoor[] {
  const raw = new Map<string, unknown>()
  for (const c of room.connections) raw.set(c.roomId, c.access)
  for (const r of rooms) {
    const back = r.connections.find(c => c.roomId === room.id)
    if (back && !raw.has(r.id)) raw.set(r.id, back.access)
  }
  return [...raw].flatMap(([roomId, access]) => {
    const t = rooms.find(r => r.id === roomId)
    if (!t) return []
    const a = normalizeAccess(access)
    const dx = t.x + t.width / 2 - (room.x + room.width / 2)
    const dy = t.y + t.height / 2 - (room.y + room.height / 2)
    const direction = Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 'right' : 'left') : dy >= 0 ? 'down' : 'up'
    return [{ roomId, label: t.name, direction, needsCode: !!a.code, minLevel: a.level ?? null, needsItem: !!a.itemId, needsAffinity: !!a.affinityCharacterId } as PublicDoor]
  })
}

/** Salas dentro da grade 0–100% e sem sobreposição. */
export function validateRoomsGeometry(rooms: MapRoom[]) {
  for (const r of rooms) {
    const nums = [r.x, r.y, r.width, r.height]
    if (!nums.every(Number.isFinite) || r.width <= 0 || r.height <= 0 || r.x < 0 || r.y < 0 || r.x + r.width > 100.01 || r.y + r.height > 100.01)
      throw new Error(`A sala "${r.name}" ultrapassa os limites da grade`)
  }
  for (let i = 0; i < rooms.length; i++) for (let j = i + 1; j < rooms.length; j++) {
    const a = rooms[i], b = rooms[j]
    if ((a.floorId ?? 'ground') !== (b.floorId ?? 'ground')) continue
    if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height)
      throw new Error(`As salas "${a.name}" e "${b.name}" se sobrepõem`)
  }
}
