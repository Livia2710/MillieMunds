export type MapObjectType = 'scene' | 'item' | 'character' | 'portal' | 'mission'
export type PortalState = 'active' | 'inactive' | 'blocked'
export type PortalStyle = 'arch' | 'rune-circle' | 'mirror' | 'rift'
export type MapSceneOption = { id: string; label: string; resultText?: string; affinityCharacterId?: string; affinityDelta?: number }
export type MapObject = { id: string; title: string; type: MapObjectType; x: number; y: number; image?: string; description?: string; discoveredOnce?: boolean; targetMapId?: string; targetRoomId?: string; portalState?: PortalState; portalStyle?: PortalStyle; inventoryItemId?: string; characterId?: string; options?: MapSceneOption[]; access?: MapAccess; missionObjectiveItemId?: string; missionObjectiveQuantity?: number; missionFavorCharacterId?: string; missionFavorDelta?: number; missionCurrencyDelta?: number }
export type MapAccess = { level?: number; code?: string; itemId?: string; affinityCharacterId?: string; affinity?: number }
type LegacyAccess = { type: 'open' } | { type: 'level'; value: number } | { type: 'code'; value: string }
export type MapConnection = { roomId: string; label?: string; access?: MapAccess | LegacyAccess }

export type PublicObject = Pick<MapObject, 'id' | 'title' | 'type' | 'x' | 'y' | 'image' | 'description' | 'portalState' | 'portalStyle' | 'missionObjectiveItemId' | 'missionObjectiveQuantity' | 'missionFavorCharacterId' | 'missionFavorDelta' | 'missionCurrencyDelta'> & { needsCode?: boolean }
export type PublicDoor = {
  roomId: string; label: string; direction: 'up' | 'down' | 'left' | 'right'
  needsCode: boolean; minLevel: number | null; needsItem: boolean; needsAffinity?: boolean; isStairs?: boolean
}
export type MapFloor = {id: string; name: string}
export type MapRoom = { floorId?: string; id: string; name: string; x: number; y: number; width: number; height: number; background?: string; connections: MapConnection[]; objects: MapObject[] }
export type ExplorationMapRecord = { id: string; name: string; rooms: MapRoom[]; floors?: MapFloor[]; isEditing: boolean; isPublished: boolean }
