'use client'

import { useState } from 'react'
import type { ConsumableType, EquipmentEffectRecord, EquipmentType, InventoryItem, InventoryRarity } from '@/lib/types/inventory'
import NoCampaign from '@/componentes/NoCampaign'
import InventoryGrid from '@/componentes/inventario/InventoryGrid'
import EntregarItemModal from '@/componentes/inventario/EntregarItemModal'
import CriarCampanhaModal from '@/componentes/modais/CriarCampanhaModal'
import EntrarCampanhaModal from '@/componentes/modais/EntrarCampanhaModal'

type Item = {
  id: string
  name: string
  slug: string
  category: string
  rarity: string
  quantity: number
  isLocked: boolean
  image: string | null
  effect: string | null
  origin: string | null
  forgedBy: string | null
  equipmentType: string | null
  equipmentSubtype: string | null
  equipmentEffects: unknown
  equipmentDurability?: number | null
  equipmentMaxDurability?: number | null
  consumableType?: string | null
  worldSlug: string | null
  author: string | null
  coverType: string | null
  coverColor: string | null
  coverImage: string | null
  chapters: { id: string; title: string; content: string; order: number }[]
}

type Props = {
  items: Item[]
  isMaster: boolean
  hasCampaign: boolean
  playerCharacters: { id: string; name: string }[]
}

export default function InventarioClient({ items, isMaster, hasCampaign, playerCharacters }: Props) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isJoinOpen, setIsJoinOpen] = useState(false)
  const [itemToAssign, setItemToAssign] = useState<InventoryItem | null>(null)

  const normalized = items.map((item) => {
  const base = {
    id: item.id,
    slug: item.slug,
    name: item.name,
    rarity: item.rarity as InventoryRarity,
    quantity: item.quantity,
    image: item.image ?? undefined,
    worldSlug: item.worldSlug ?? '',
    isLocked: item.isLocked,
  }

  if (item.category === 'livro') {
    const cover = item.coverType === 'image'
      ? { coverType: 'image' as const, coverImage: item.coverImage ?? '' }
      : { coverType: 'color' as const, coverColor: item.coverColor ?? '#1a0f22' }

    return {
      ...base,
      category: 'livro' as const,
      author: item.author ?? undefined,
      chapters: item.chapters.map((ch) => ({
        id: ch.id,
        title: ch.title,
        content: ch.content,
      })),
      ...cover,
    }
  }
  if (item.category === 'equipamento') {
    return {
      ...base,
      category: 'equipamento' as const,
      forgedBy: item.forgedBy ?? '',
      effect: item.effect ?? '',
      equipmentType: (item.equipmentType ?? undefined) as EquipmentType | undefined,
      equipmentSubtype: (item.equipmentSubtype ?? undefined) as import('@/lib/types/inventory').EquipmentSubtype | undefined,
      equipmentEffects: Array.isArray(item.equipmentEffects) ? item.equipmentEffects as EquipmentEffectRecord[] : [],
      equipmentDurability: item.equipmentDurability ?? null,
      equipmentMaxDurability: item.equipmentMaxDurability ?? null,
    }
  }
  if (item.category === 'consumivel') {
    return { ...base, category: 'consumivel' as const, origin: item.origin ?? '', effect: item.effect ?? '', consumableType: (item.consumableType ?? undefined) as ConsumableType | undefined }
  }
  if (item.category === 'material') {
    return { ...base, category: 'material' as const, origin: item.origin ?? '', effect: item.effect ?? undefined }
  }
  if (item.category === 'reliquia') {
    return { ...base, category: 'reliquia' as const, origin: item.origin ?? '', effect: item.effect ?? '' }
  }
  return { ...base, category: 'outro' as const, origin: item.origin ?? undefined, effect: item.effect ?? undefined }
}) satisfies InventoryItem[]

const visible = isMaster ? normalized : normalized.filter((i) => !i.isLocked)

  if (!hasCampaign) {
    return (
      <div className="relative block min-h-screen w-full p-8 md:p-12">
        <NoCampaign
          message="O inventário só aparece depois que você entra em uma campanha ou cria a sua própria."
          onCreate={() => setIsCreateOpen(true)}
          onJoin={() => setIsJoinOpen(true)}
        />
        <CriarCampanhaModal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
        <EntrarCampanhaModal open={isJoinOpen} onClose={() => setIsJoinOpen(false)} />
      </div>
    )
  }

  return (
    <div className="relative block min-h-screen w-full">
      <InventoryGrid
        items={visible}
        isMaster={isMaster}
        onAssign={setItemToAssign}
      />
      <EntregarItemModal
        key={itemToAssign?.id ?? 'none'}
        item={itemToAssign}
        players={playerCharacters}
        onClose={() => setItemToAssign(null)}
      />
    </div>
  )
}
