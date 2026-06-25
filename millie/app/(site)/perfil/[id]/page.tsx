import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getCharacterById } from '@/app/actions/character'
import ProfileGrid from '@/componentes/perfil/ProfileGrid'

interface Props {
  params: Promise<{ id: string }>
}

export default async function CharacterDetailPage({ params }: Props) {
  const { id } = await params
  const character = await getCharacterById(id)

  if (!character) notFound()

  return (
    <div className="relative min-h-screen w-full p-8 block bg-roxo-escuro shadow-header">
      <PageCorners />
      <div className="max-w-5xl mx-auto pt-16 px-4 md:px-12 relative z-10 space-y-6">
        <div className="flex justify-between items-center bg-roxo-escuro/60 p-4 border border-bege-escuro/45 shadow-card">
          <Link
            href="/perfil"
            className="text-xs text-bege-escuro hover:text-bege-medio transition flex items-center gap-2 font-title tracking-widest uppercase"
          >
            &larr; Voltar para Painel do Mestre
          </Link>
          <span className="text-[10px] font-title bg-bege-medio/10 text-bege-medio border border-bege-escuro/30 px-3 py-1 rounded-full uppercase tracking-widest">
            Modo Inspeção (Mestre)
          </span>
        </div>
        <ProfileGrid character={character as any} username="" />
      </div>
    </div>
  )
}

function PageCorners() {
  return (
    <>
      <Image
        src="/assets/svgs/corner-left-top.svg"
        alt=""
        width={100}
        height={100}
        className="pointer-events-none absolute left-0 top-0 m-0 block h-19 w-19 md:h-25 md:w-25 z-0"
      />
      <Image
        src="/assets/svgs/corner-right-top.svg"
        alt=""
        width={100}
        height={100}
        className="pointer-events-none absolute right-0 top-0 m-0 block h-19 w-19 md:h-25 md:w-25 z-0"
      />
      <Image
        src="/assets/svgs/corner-left-bottom.svg"
        alt=""
        width={100}
        height={100}
        className="pointer-events-none absolute bottom-0 left-0 m-0 block h-19 w-19 md:h-25 md:w-25 z-0"
      />
      <Image
        src="/assets/svgs/corner-right-bottom.svg"
        alt=""
        width={100}
        height={100}
        className="pointer-events-none absolute bottom-0 right-0 m-0 block h-19 w-19 md:h-25 md:w-25 z-0"
      />
    </>
  );
}
