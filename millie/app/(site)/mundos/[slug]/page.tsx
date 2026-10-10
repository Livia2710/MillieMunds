import { notFound } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { MundoReader } from "@/componentes/mundo/MundoReader"
import type { World } from "@/lib/types/world"
import { sanitizeRichContent } from "@/lib/rich-content"

type Props = { params: Promise<{ slug: string }> }

export default async function MundoPage({ params }: Props) {
  const { slug } = await params
  const session = await auth()
  if (!session?.user?.id) notFound()

  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true },
  })
  if (!membership) notFound()

  const isMaster = membership.role === 'MASTER'
  
  const raw = await prisma.world.findFirst({
    where: { slug, campaignId: membership.campaignId },
    include: { chapters: { orderBy: { order: 'asc' } } },
  })

  if (!raw) notFound()
  const draftState = await prisma.$queryRaw<Array<{ isDraft: boolean }>>`SELECT \"isDraft\" FROM \"World\" WHERE \"id\" = ${raw.id}`
  if (draftState[0]?.isDraft || (raw.isLocked && !isMaster)) notFound()

  const layoutRows = await prisma.$queryRaw<Array<{pageColor:string;pageTexture:boolean;pageHeader:string;pageFooter:string}>>`SELECT "pageColor", "pageTexture", "pageHeader", "pageFooter" FROM "World" WHERE "id" = ${raw.id}`
  const pageLayout = layoutRows[0]
  const world: World = {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    description: raw.description ?? '',
    image: raw.coverImage ?? '',
    coverColor: raw.coverColor ?? undefined,
    pageColor: pageLayout?.pageColor ?? "#f7f3e9",
    pageTexture: pageLayout?.pageTexture ?? true,
    pageHeader: pageLayout?.pageHeader ?? "",
    pageFooter: pageLayout?.pageFooter ?? "",
    chapters: raw.chapters.map((ch) => ({
      id: ch.id,
      title: ch.title,
      content: sanitizeRichContent(ch.content),
    })),
  }

  return <MundoReader world={world} isMaster={isMaster} />
}
