import Image from "next/image";
import NoCampaign from "@/componentes/NoCampaign";
import MasterDashboard from "@/componentes/perfil/MasterDashboard";
import CreateCharForm from "@/componentes/perfil/CreateCharForm";
import ProfileGrid from "@/componentes/perfil/ProfileGrid";
import { mockProfileCharacters } from "@/lib/mocks/profile";

// Objeto de controle local para simular e testar facilmente todos os estados da tela
const mockUser = {
  hasCampaign: true,
  isMaster: false,            // Mude para true para testar a visão do Mestre
  activeCharacterId: "char_aluno_1", // Altere para null para testar o CreateCharForm
  username: "Eldritch_User",
};

export default function ProfilePage() {
  // 1. Guard de vínculo com campanha
  if (!mockUser.hasCampaign) {
    return (
      <div className="relative min-h-screen w-full p-8 md:p-12 block bg-roxo-escuro shadow-header">
        <PageCorners />
        {/* Adicionado contêiner de proteção com padding superior para dar respiro */}
        <div className="max-w-5xl mx-auto pt-16 relative z-10">
          <NoCampaign message="As informações do seu perfil só aparecem depois que você entra em uma campanha ativa." />
        </div>
      </div>
    );
  }

  // 2. Fluxo Visão do Mestre
  if (mockUser.isMaster) {
    const allCharacters = Object.values(mockProfileCharacters);
    return (
      <div className="relative min-h-screen w-full p-8 block bg-roxo-escuro shadow-header">
        <PageCorners />
        {/* 
          Contêiner de proteção: pt-16 afasta o título das cantoneiras do topo,
          e px-4/md:px-12 empurra o grid para dentro protegendo as laterais.
        */}
        <div className="max-w-5xl mx-auto pt-16 px-4 md:px-12 relative z-10">
          <MasterDashboard characters={allCharacters} />
        </div>
      </div>
    );
  }

  // 3. Fluxo Visão do Jogador sem ficha criada
  if (!mockUser.activeCharacterId) {
    return (
      <div className="relative min-h-screen w-full p-8 block bg-roxo-escuro shadow-header">
        <PageCorners />
        {/* Contêiner de proteção para o formulário de grimório respirar */}
        <div className="max-w-5xl mx-auto pt-16 px-4 md:px-12 relative z-10">
          <CreateCharForm />
        </div>
      </div>
    );
  }

  // 4. Fluxo Visão do Jogador com sua própria ficha ativa (Gerenciado pelo ProfileGrid)
  const myCharacter = mockProfileCharacters[mockUser.activeCharacterId];

  return (
    <div className="relative min-h-screen w-full p-8 block bg-roxo-escuro shadow-header">
      <PageCorners />
      {/* 
        Contêiner de proteção para a ficha: removemos o padding excessivo de dentro 
        do ProfileGrid e concentramos o respiro global de forma limpa aqui.
      */}
      <div className="max-w-5xl mx-auto pt-16 px-4 md:px-12 relative z-10">
        <ProfileGrid character={myCharacter} username={mockUser.username} />
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
