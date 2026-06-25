import Image from "next/image"
import { notFound } from "next/navigation"
import { getItemBySlug } from "@/app/actions/inventory"
import InventoryBookDetails from "@/componentes/inventario/InventoryBookDetails"
import InventoryItemDetails from "@/componentes/inventario/InventoryItemDetails"
import type { InventoryItem, InventoryRarity, InventoryCategory } from "@/lib/types/inventory"

type Props = { params: Promise<{ slug: string }> }

export default async function InventoryDetailsPage({ params }: Props) {
  const { slug } = await params
  const raw = await getItemBySlug(slug)
  if (!raw) notFound()

  const base = {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    rarity: raw.rarity as InventoryRarity,
    quantity: raw.quantity,
    image: undefined as string | undefined,
    description: '',
    worldSlug: raw.worldSlug ?? '',
    isLocked: raw.isLocked,
  }

  let item: InventoryItem
  const cat = raw.category as InventoryCategory

  if (cat === 'livro') {
    const cover = raw.coverType === 'image'
      ? { coverType: 'image' as const, coverImage: raw.coverImage ?? '' }
      : { coverType: 'color' as const, coverColor: raw.coverColor ?? '#1a0f22' }
    item = {
      ...base,
      category: 'livro',
      author: raw.author ?? undefined,
      chapters: raw.chapters.map((ch) => ({ id: ch.id, title: ch.title, content: ch.content })),
      ...cover,
    }
  } else if (cat === 'equipamento') {
    item = { ...base, category: 'equipamento', forgedBy: raw.forgedBy ?? '', effect: raw.effect ?? '' }
  } else if (cat === 'consumivel') {
    item = { ...base, category: 'consumivel', origin: raw.origin ?? '', effect: raw.effect ?? '' }
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
        : <InventoryItemDetails item={item} />
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