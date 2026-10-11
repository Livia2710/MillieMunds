export type MapObjectType = 'scene' | 'item' | 'character' | 'portal'
export type MapSceneOption = { id: string; label: string; resultText?: string }
export type MapObject = { id: string; title: string; type: MapObjectType; x: number; y: number; image?: string; description?: string; discoveredOnce?: boolean; targetMapId?: string; targetRoomId?: string; inventoryItemId?: string; options?: MapSceneOption[] }
export type MapConnection = { roomId: string; label?: string; access?: { type: 'open' } | { type: 'level'; value: number } | { type: 'code'; value: string } }
export type MapRoom = { id: string; name: string; x: number; y: number; width: number; height: number; background?: string; connections: MapConnection[]; objects: MapObject[] }
export type ExplorationMapRecord = { id: string; name: string; rooms: MapRoom[]; isEditing: boolean; isPublished: boolean }
