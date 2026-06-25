import { notFound } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { MundoReader } from "@/componentes/mundo/MundoReader"
import type { World } from "@/lib/types/world"

type Props = { params: Promise<{ slug: string }> }

export default async function MundoPage({ params }: Props) {
  const { slug } = await params
  const session = await auth()
  if (!session?.user?.id) notFound()

  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true },
  })
  if (!membership) notFound()

  const raw = await prisma.world.findFirst({
    where: { slug, campaignId: membership.campaignId },
    include: { chapters: { orderBy: { order: 'asc' } } },
  })

  if (!raw) notFound()

  const world: World = {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    description: raw.description ?? '',
    image: raw.coverImage ?? '',
    coverColor: raw.coverColor ?? undefined,
    chapters: raw.chapters.map((ch) => ({
      id: ch.id,
      title: ch.title,
      content: ch.content,
    })),
  }

  return <MundoReader world={world} />
}