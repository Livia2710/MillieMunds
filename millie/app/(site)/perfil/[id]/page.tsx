import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { mockProfileCharacters } from '@/lib/mocks/profile';
import ProfileGrid from '@/componentes/perfil/ProfileGrid';

interface Props {
  params: Promise<{ id: string }>; // Atualizado para Promise
}

export default async function CharacterDetailPage({ params }: Props) {
  // Aguarda a resolução dos parâmetros da URL para evitar o 404 falso
  const resolvedParams = await params;
  const character = mockProfileCharacters[resolvedParams.id];

  if (!character) {
    notFound();
  }

  return (
    <div className="relative min-h-screen w-full p-8 block bg-roxo-escuro shadow-header">
      {/* Cantoneiras da Página de Inspeção */}
      <PageCorners />
      
      {/* Área de Proteção das Cantoneiras: pt-16 e px-4/md:px-12 */}
      <div className="max-w-5xl mx-auto pt-16 px-4 md:px-12 relative z-10 space-y-6">
        
        {/* Barra de Navegação Superior do Mestre com a sua paleta */}
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
        
        {/* O ProfileGrid assume o controle visual sem paddings duplicados */}
        <ProfileGrid character={character} username="" />
      </div>
    </div>
  );
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
