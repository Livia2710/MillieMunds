import Image from "next/image";
import NoCampaign from "@/componentes/NoCampaign";
import HabilidadesClient from "@/componentes/habilidades/HabilidadesClient";
import MasterSkillDashboard from "@/componentes/habilidades/MasterSkillDashboard";
import { mockProfileCharacters } from "@/lib/mocks/profile";
import { getSkillTreeByRace } from "@/lib/mocks/skills";

const mockUser = {
  hasCampaign: true,
  isMaster: false,          // mude para true para testar visão do Mestre
  activeCharacterId: "char_aluno_1",
};

export default function HabilidadesPage() {
  if (!mockUser.hasCampaign) {
    return (
      <PageShell>
        <NoCampaign message="As habilidades só ficam disponíveis depois que você entra em uma campanha ativa." />
      </PageShell>
    );
  }

  // Visão do Mestre
  if (mockUser.isMaster) {
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

  // Sem personagem
  if (!mockUser.activeCharacterId) {
    return (
      <PageShell>
        <NoCampaign message="Crie um personagem primeiro para ver sua árvore de habilidades." />
      </PageShell>
    );
  }

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