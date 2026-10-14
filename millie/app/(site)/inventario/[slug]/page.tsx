import Image from "next/image"
import { notFound } from "next/navigation"
import { getItemBySlug } from "@/app/actions/inventory"
import InventoryBookDetails from "@/componentes/inventario/InventoryBookDetails"
import InventoryItemDetails from "@/componentes/inventario/InventoryItemDetails"
import type { ConsumableType, EquipmentEffectRecord, EquipmentSubtype, EquipmentType, InventoryItem, InventoryRarity, InventoryCategory } from "@/lib/types/inventory"

type Props = { params: Promise<{ slug: string }> }

export default async function InventoryDetailsPage({ params }: Props) {
  const { slug } = await params
  const raw = await getItemBySlug(slug)
  if (!raw) notFound()
  const detail = raw as typeof raw & { equipmentType?: string | null; equipmentSubtype?: string | null; equipmentEffects?: unknown; equipmentDurability?: number | null; equipmentMaxDurability?: number | null; consumableType?: string | null }

  const base = {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    rarity: raw.rarity as InventoryRarity,
    quantity: raw.quantity,
    image: raw.image ?? undefined,
    worldSlug: raw.worldSlug ?? '',
    isLocked: raw.isLocked,
  }

  let item: InventoryItem
  const bookLayout = raw as typeof raw & { pageColor?: string; pageTexture?: boolean; pageHeader?: string; pageFooter?: string }
  const cat = raw.category as InventoryCategory

  if (cat === 'livro') {
    const cover = raw.coverType === 'image'
      ? { coverType: 'image' as const, coverImage: raw.coverImage ?? '' }
      : { coverType: 'color' as const, coverColor: raw.coverColor ?? '#1a0f22' }
    item = {
      ...base,
      category: 'livro',
      author: raw.author ?? undefined,
      pageColor: bookLayout.pageColor ?? "#f7f3e9",
      pageTexture: bookLayout.pageTexture ?? true,
      pageHeader: bookLayout.pageHeader ?? "",
      pageFooter: bookLayout.pageFooter ?? "",
      chapters: raw.chapters.map((ch) => ({ id: ch.id, title: ch.title, content: ch.content })),
      ...cover,
    }
  } else if (cat === 'equipamento') {
    item = {
      ...base,
      category: 'equipamento',
      forgedBy: raw.forgedBy ?? '',
      effect: raw.effect ?? '',
      equipmentType: (detail.equipmentType ?? undefined) as EquipmentType | undefined,
      equipmentSubtype: (detail.equipmentSubtype ?? undefined) as EquipmentSubtype | undefined,
      equipmentEffects: Array.isArray(detail.equipmentEffects) ? detail.equipmentEffects as EquipmentEffectRecord[] : [],
      equipmentDurability: detail.equipmentDurability ?? null,
      equipmentMaxDurability: detail.equipmentMaxDurability ?? null,
    }
  } else if (cat === 'consumivel') {
    item = { ...base, category: 'consumivel', origin: raw.origin ?? '', effect: raw.effect ?? '', consumableType: (detail.consumableType ?? undefined) as ConsumableType | undefined }
  } else if (cat === 'material') {
    item = { ...base, category: 'material', origin: raw.origin ?? '', effect: raw.effect ?? undefined }
  } else if (cat === 'reliquia') {
    item = { ...base, category: 'reliquia', origin: raw.origin ?? '', effect: raw.effect ?? '' }
  } else {
    item = { ...base, category: 'outro', origin: raw.origin ?? undefined, effect: raw.effect ?? undefined }
  }

  return (
    <div className="relative block min-h-screen w-full bg-roxo-escuro p-8 shadow-header">
      <PageCorners />
      {item.category === 'livro'
        ? <InventoryBookDetails book={item} />
        : <InventoryItemDetails item={item} isMaster={(raw as typeof raw & {viewerRole?: string}).viewerRole === 'MASTER'} canUseConsumable={(raw as typeof raw & {canUseConsumable?: boolean}).canUseConsumable ?? false} />
      }
    </div>
  )
}

function PageCorners() {
  return (
    <>
      <Image src="/assets/svgs/corner-left-top.svg" alt="" width={100} height={100} className="pointer-events-none absolute left-0 top-0 m-0 block h-19 w-19 md:h-25 md:w-25" />
      <Image src="/assets/svgs/corner-right-top.svg" alt="" width={100} height={100} className="pointer-events-none absolute right-0 top-0 m-0 block h-19 w-19 md:h-25 md:w-25" />
      <Image src="/assets/svgs/corner-left-bottom.svg" alt="" width={100} height={100} className="pointer-events-none absolute bottom-0 left-0 m-0 block h-19 w-19 md:h-25 md:w-25" />
      <Image src="/assets/svgs/corner-right-bottom.svg" alt="" width={100} height={100} className="pointer-events-none absolute bottom-0 right-0 h-19 w-19 md:h-25 md:w-25" />
    </>
  )
}
