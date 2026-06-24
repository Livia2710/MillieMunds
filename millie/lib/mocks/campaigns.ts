import { Campaign, CampaignMember } from "../types/campaign";

// Banco de dados simulado de campanhas existentes no sistema
export const mockCampaigns: Campaign[] = [
  {
    id: "1",
    name: "Crônicas de Umbrael",
    description: "Uma terra esquecida",
    code: "UMB123",
    active: true,
  },
  {
    id: "2",
    name: "A Travessia dos Mil Mundos",
    description: "Uma aventura pelos planos",
    code: "MIL456",
    active: false,
  },
];

// Vínculos do usuário logado (quais ele participa e qual o cargo dele)
export const mockCampaignMembers: CampaignMember[] = [
  {
    campaignId: "1",
    role: "MASTER",
  },
  {
    campaignId: "2",
    role: "PLAYER",
  },
];
