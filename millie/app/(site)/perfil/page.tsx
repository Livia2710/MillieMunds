"use client";

import { useState } from "react";
import Image from "next/image";
import NoCampaign from "@/componentes/NoCampaign";
import MasterDashboard from "@/componentes/perfil/MasterDashboard";
import CreateCharForm from "@/componentes/perfil/CreateCharForm";
import ProfileGrid from "@/componentes/perfil/ProfileGrid";
import CriarCampanhaModal from "@/componentes/modais/CriarCampanhaModal";
import EntrarCampanhaModal from "@/componentes/modais/EntrarCampanhaModal";
import { useCampaign } from "@/lib/contexts/CampaignContext";
import { mockProfileCharacters } from "@/lib/mocks/profile";

// Mantemos apenas os dados simulados do usuário que não pertencem ao contexto de campanhas
const mockUser = {
  activeCharacterId: "char_aluno_1", // Altere para null para testar o CreateCharForm
  username: "Eldritch_User",
};

export default function ProfilePage() {
  // Consome os estados reais e reativos do seu contexto de campanhas
  const { hasCampaign, isMaster } = useCampaign();

  // Estados locais para controlar a abertura dos modais de campanha
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  // 1. Guard de vínculo com campanha (Cenário sem campanha ativa)
  if (!hasCampaign) {
    return (
      <div className="relative min-h-screen w-full p-8 md:p-12 block bg-roxo-escuro shadow-header">
        <PageCorners />
        <div className="max-w-5xl mx-auto pt-16 relative z-10">
          <NoCampaign 
            message="As informações do seu perfil só aparecem depois que você entra em uma campanha ativa." 
            onCreate={() => setIsCreateOpen(true)}
            onJoin={() => setIsJoinOpen(true)}
          />
        </div>

        {/* Modais montados na raiz da página prontos para escutar o clique */}
        <CriarCampanhaModal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
        <EntrarCampanhaModal open={isJoinOpen} onClose={() => setIsJoinOpen(false)} />
      </div>
    );
  }

  // 2. Fluxo Visão do Mestre
  if (isMaster) {
    const allCharacters = Object.values(mockProfileCharacters);
    return (
      <div className="relative min-h-screen w-full p-8 block bg-roxo-escuro shadow-header">
        <PageCorners />
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
        <div className="max-w-5xl mx-auto pt-16 px-4 md:px-12 relative z-10">
          <CreateCharForm />
        </div>
      </div>
    );
  }

  // 4. Fluxo Visão do Jogador com sua própria ficha ativa
  const myCharacter = mockProfileCharacters[mockUser.activeCharacterId];

  return (
    <div className="relative min-h-screen w-full p-8 block bg-roxo-escuro shadow-header">
      <PageCorners />
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
