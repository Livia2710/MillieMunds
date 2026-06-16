import Image from "next/image";
import NoCampaign from "@/componentes/NoCampaign";
import CharactersGrid from "@/componentes/personagens/CharactersGrid";
import { mockCharacters } from "@/lib/mocks/characters";

const mockUser = {
  hasCampaign: true,
  isMaster: false,
};

export default function PersonagensPage() {
  if (!mockUser.hasCampaign) {
    return (
      // Adicionado p-8 (no mobile) e md:p-12 para empurrar o conteúdo para longe dos cantos
      <div className="relative min-h-screen w-full p-8 md:p-12 block">
        {/* Cantos decorativos com correção de brecha */}
        <Image
          src="/assets/svgs/corner-left-top.svg"
          alt=""
          width={100}
          height={100}
          className="pointer-events-none absolute left-0 top-0 w-19 h-19 md:w-25 md:h-25 m-0 block"
        />
        <Image
          src="/assets/svgs/corner-right-top.svg"
          alt=""
          width={100}
          height={100}
          className="pointer-events-none absolute right-0 top-0 w-19 h-19 md:w-25 md:h-25 m-0 block"
        />
        <Image
          src="/assets/svgs/corner-left-bottom.svg"
          alt=""
          width={100}
          height={100}
          className="pointer-events-none absolute bottom-0 left-0 w-19 h-19 md:w-25 md:h-25 m-0 block"
        />
        <Image
          src="/assets/svgs/corner-right-bottom.svg"
          alt=""
          width={100}
          height={100}
          className="pointer-events-none absolute bottom-0 right-0 w-19 h-19 md:w-25 md:h-25 m-0 block"
        />

        <NoCampaign message="Os personagens só aparecem depois que você entra em uma campanha ou cria a sua própria." />
      </div>
    );
  }

  const characters = mockUser.isMaster
    ? mockCharacters
    : mockCharacters.filter((character) => !character.isLocked);

  return (
    <div className="relative min-h-screen w-full p-8 block bg-roxo-escuro shadow-header">
      <Image
        src="/assets/svgs/corner-left-top.svg"
        alt=""
        width={100}
        height={100}
        className="pointer-events-none absolute left-0 top-0 w-19 h-19 md:w-25 md:h-25 m-0 block"
      />
      <Image
        src="/assets/svgs/corner-right-top.svg"
        alt=""
        width={100}
        height={100}
        className="pointer-events-none absolute right-0 top-0 w-19 h-19 md:w-25 md:h-25 m-0 block"
      />
      <Image
        src="/assets/svgs/corner-left-bottom.svg"
        alt=""
        width={100}
        height={100}
        className="pointer-events-none absolute bottom-0 left-0 w-19 h-19 md:w-25 md:h-25 m-0 block"
      />
      <Image
        src="/assets/svgs/corner-right-bottom.svg"
        alt=""
        width={100}
        height={100}
        className="pointer-events-none absolute bottom-0 right-0 w-19 h-19 md:w-25 md:h-25 m-0 block"
      />

      <CharactersGrid characters={characters} isMaster={mockUser.isMaster} />
    </div>
  );
}
