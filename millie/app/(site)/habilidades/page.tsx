"use client";

import { useState } from "react";
import Image from "next/image";
import NoCampaign from "@/componentes/NoCampaign";
import HabilidadesClient from "@/componentes/habilidades/HabilidadesClient";
import MasterSkillDashboard from "@/componentes/habilidades/MasterSkillDashboard";
import CriarCampanhaModal from "@/componentes/modais/CriarCampanhaModal"; // Ajuste os caminhos se necessário
import EntrarCampanhaModal from "@/componentes/modais/EntrarCampanhaModal";
import { useCampaign } from "@/lib/contexts/CampaignContext";
import { mockProfileCharacters } from "@/lib/mocks/profile";
import { getSkillTreeByRace } from "@/lib/mocks/skills";

// Mantemos o mock apenas para o personagem simulado do usuário
const mockUser = {
  activeCharacterId: "char_aluno_1",
};

export default function HabilidadesPage() {
  // Consome os estados reais se há campanha ativa e o papel do usuário
  const { hasCampaign, isMaster } = useCampaign();

  // Estados locais para controlar a abertura dos modais de campanha
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  // 1. Guard de vínculo com campanha (Sem campanha ativa)
  if (!hasCampaign) {
    return (
      <PageShell>
        <NoCampaign 
          message="As habilidades só ficam disponíveis depois que você entra em uma campanha ativa." 
          onCreate={() => setIsCreateOpen(true)}
          onJoin={() => setIsJoinOpen(true)}
        />
        
        {/* Modais injetados dentro do fluxo para renderizarem na tela quando os botões forem clicados */}
        <CriarCampanhaModal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
        <EntrarCampanhaModal open={isJoinOpen} onClose={() => setIsJoinOpen(false)} />
      </PageShell>
    );
  }

  // 2. Visão do Mestre
  if (isMaster) {
    const allCharacters = Object.values(mockProfileCharacters);
    return (
      <div className="relative min-h-screen w-full block bg-roxo-escuro shadow-header">
        <PageCorners />
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-10 pt-16 md:px-12 md:py-14">
          <MasterSkillDashboard characters={allCharacters} />
        </div>
      </div>
    );
  }

  // 3. Sem personagem ativo vinculado
  if (!mockUser.activeCharacterId) {
    return (
      <PageShell>
        <NoCampaign message="Crie um personagem primeiro para ver sua árvore de habilidades." />
      </PageShell>
    );
  }

  // 4. Fluxo normal de Jogador (Com campanha e personagem ativos)
  const character = mockProfileCharacters[mockUser.activeCharacterId];
  const tree = getSkillTreeByRace(character.race);

  if (!tree) {
    return (
      <PageShell>
        <NoCampaign message="Árvore de habilidades para esta raça ainda não foi registrada pelo Mestre." />
      </PageShell>
    );
  }

  return (
    <div className="relative min-h-screen w-full block bg-roxo-escuro shadow-header">
      <PageCorners />
      <HabilidadesClient character={character} tree={tree} />
    </div>
  );
}

// Shell reutilizável para as telas de guard
function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full block bg-roxo-escuro shadow-header">
      <PageCorners />
      <div className="max-w-5xl mx-auto pt-16 px-6 relative z-10">
        {children}
      </div>
    </div>
  );
}

function PageCorners() {
  return (
    <>
      <Image src="/assets/svgs/corner-left-top.svg" alt="" width={100} height={100}
        className="pointer-events-none absolute left-0 top-0 m-0 block h-19 w-19 md:h-25 md:w-25 z-0" />
      <Image src="/assets/svgs/corner-right-top.svg" alt="" width={100} height={100}
        className="pointer-events-none absolute right-0 top-0 m-0 block h-19 w-19 md:h-25 md:w-25 z-0" />
      <Image src="/assets/svgs/corner-left-bottom.svg" alt="" width={100} height={100}
        className="pointer-events-none absolute bottom-0 left-0 m-0 block h-19 w-19 md:h-25 md:w-25 z-0" />
      <Image src="/assets/svgs/corner-right-bottom.svg" alt="" width={100} height={100}
        className="pointer-events-none absolute bottom-0 right-0 m-0 block h-19 w-19 md:h-25 md:w-25 z-0" />
    </>
  );
}
