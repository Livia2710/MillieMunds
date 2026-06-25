import { notFound } from "next/navigation"
import Image from "next/image"
import { getCharacterById } from "@/app/actions/character"
import CharacterDetails from "@/componentes/personagens/CharacterDetails"
import type { Character, CharacterRank, CharacterElement, CharacterCategory } from "@/lib/types/character"

type Props = { params: Promise<{ id: string }> }

export default async function CharacterDetailsPage({ params }: Props) {
  const { id } = await params
  const raw = await getCharacterById(id)
  if (!raw) notFound()

  // Normaliza para o union type discriminado
  const base = {
    id: raw.id,
    name: raw.name,
    image: raw.image ?? undefined,
    rank: raw.rank as CharacterRank,
    element: raw.element as CharacterElement,
    race: raw.race as string,
    worldSlug: raw.worldSlug,
    isLocked: raw.isLocked,
  }

  let character: Character
  const cat = raw.category as CharacterCategory
  if (cat === 'aluno') {
    character = { ...base, category: 'aluno', year: (raw.year ?? 1) as 1|2|3|4|5 }
  } else if (cat === 'professor') {
    character = { ...base, category: 'professor', subject: raw.subject ?? '' }
  } else if (cat === 'npc') {
    character = { ...base, category: 'npc', occupation: raw.occupation ?? '' }
  } else {
    character = { ...base, category: 'monstro', dangerLevel: (raw.dangerLevel ?? 'Iniciante') as 'Iniciante'|'Intermediário'|'Avançado'|'Calamidade' }
  }

  return (
    <div className="relative min-h-screen w-full bg-roxo-escuro p-6 shadow-header md:p-10">
      <PageCorners />
      <CharacterDetails character={character} />
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