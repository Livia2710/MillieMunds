'use client'

import { useState, useTransition } from 'react'
import type { InventoryItem, InventoryRarity } from '@/lib/types/inventory'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import NoCampaign from '@/componentes/NoCampaign'
import InventoryGrid from '@/componentes/inventario/InventoryGrid'
import CriarCampanhaModal from '@/componentes/modais/CriarCampanhaModal'
import EntrarCampanhaModal from '@/componentes/modais/EntrarCampanhaModal'
import { unlockItem } from '@/app/actions/inventory'

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
}

export default function InventarioClient({ items, isMaster, hasCampaign }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isJoinOpen, setIsJoinOpen] = useState(false)

  function handleUnlock(itemId: string) {
    startTransition(async () => {
      await unlockItem(itemId)
      router.refresh()
    })
  }

  const normalized = items.map((item) => {
  const base = {
    id: item.id,
    slug: item.slug,
    name: item.name,
    rarity: item.rarity as InventoryRarity,
    quantity: item.quantity,
    image: item.image ?? undefined,
    description: '',
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
    return { ...base, category: 'equipamento' as const, forgedBy: item.forgedBy ?? '', effect: item.effect ?? '' }
  }
  if (item.category === 'consumivel') {
    return { ...base, category: 'consumivel' as const, origin: item.origin ?? '', effect: item.effect ?? '' }
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
      <div className="relative block min-h-screen w-full bg-roxo-escuro p-8 shadow-header md:p-12">
        <PageCorners />
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
    <div className="relative block min-h-screen w-full bg-roxo-escuro shadow-header">
      <PageCorners />
      <InventoryGrid items={visible} isMaster={isMaster} onUnlock={handleUnlock} />
    </div>
  )
}

function PageCorners() {
  return (
    <>
      <Image src="/assets/svgs/corner-left-top.svg" alt="" width={100} height={100} className="pointer-events-none absolute left-0 top-0 h-19 w-19 md:h-25 md:w-25" />
      <Image src="/assets/svgs/corner-right-top.svg" alt="" width={100} height={100} className="pointer-events-none absolute right-0 top-0 h-19 w-19 md:h-25 md:w-25" />
      <Image src="/assets/svgs/corner-left-bottom.svg" alt="" width={100} height={100} className="pointer-events-none absolute bottom-0 left-0 h-19 w-19 md:h-25 md:w-25" />
      <Image src="/assets/svgs/corner-right-bottom.svg" alt="" width={100} height={100} className="pointer-events-none absolute bottom-0 right-0 h-19 w-19 md:h-25 md:w-25" />
    </>
  )
}