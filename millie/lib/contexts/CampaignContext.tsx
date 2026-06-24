"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Campaign, CampaignMember } from "../types/campaign";
import { mockCampaigns, mockCampaignMembers } from "../mocks/campaigns";
import { mockCharacters } from "@/lib/mocks/characters";
import { mockInventoryItems } from "@/lib/mocks/inventory";

// Tipo para os mundos
export type World = {
  id: number;
  slug: string;
  name: string;
  description: string;
  image: string;
  isLocked: boolean;
};

// Mock inicial de mundos que agora fica sob o controle do contexto
const initialWorlds: World[] = [
  { id: 1, slug: "um", name: "Gaia", description: "Um mundo que não deveria existir.", image: "/mundos/mundo-1.png", isLocked: true },
  { id: 2, slug: "dois", name: "Nome", description: "Breve descrição", image: "/mundos/mundo-1.png", isLocked: false },
  { id: 3, slug: "tres", name: "Nome", description: "Breve descrição", image: "/mundos/mundo-2.png", isLocked: false },
  { id: 4, slug: "quatro", name: "Aster", description: "Breve descrição", image: "/mundos/mundo-3.jpg", isLocked: false },
];

export type UserCampaign = Campaign & {
  role: CampaignMember["role"];
};

type CampaignContextType = {
  campaigns: UserCampaign[];
  activeCampaign: UserCampaign | null;
  createCampaign: (name: string, description: string) => void;
  joinCampaign: (code: string) => void;
  switchCampaign: (id: string) => void;
  hasCampaign: boolean;
  isMaster: boolean;
  
  // Estados Reativos
  charactersState: any[];
  itemsState: any[];
  worldsState: World[];
  
  // Triggers de Desbloqueio (Prismas Simulation)
  unlockCharacter: (characterId: string) => void;
  unlockItem: (itemId: string) => void;
  unlockWorld: (worldId: number) => void;
};

const CampaignContext = createContext<CampaignContextType | null>(null);

export function CampaignProvider({ children }: { children: ReactNode }) {
  const [campaigns, setSetCampaigns] = useState<UserCampaign[]>(() => {
    return mockCampaigns.map((campaign) => {
      const memberInfo = mockCampaignMembers.find((m) => m.campaignId === campaign.id);
      return { ...campaign, role: memberInfo ? memberInfo.role : "PLAYER" };
    });
  });

  const [charactersState, setCharactersState] = useState(mockCharacters);
  const [itemsState, setItemsState] = useState(mockInventoryItems);
  const [worldsState, setWorldsState] = useState(initialWorlds);

  const activeCampaign = campaigns.find((c) => c.active) ?? null;

  function createCampaign(name: string, description: string) {
    const newCampaign: UserCampaign = {
      id: crypto.randomUUID(),
      name,
      description,
      role: "MASTER",
      code: Math.random().toString(36).substring(2, 8).toUpperCase(),
      active: true,
    };
    setSetCampaigns((prev) => [...prev.map((c) => ({ ...c, active: false })), newCampaign]);
  }

  function joinCampaign(code: string) {
    const found = campaigns.find((c) => c.code === code);
    if (!found) return;
    setSetCampaigns((prev) => prev.map((c) => ({ ...c, active: c.id === found.id })));
  }

  function switchCampaign(id: string) {
    setSetCampaigns((prev) => prev.map((c) => ({ ...c, active: c.id === id })));
  }

  function unlockCharacter(characterId: string) {
    setCharactersState((prev) =>
      prev.map((char) => (char.id === characterId ? { ...char, isLocked: false } : char))
    );
  }

  function unlockItem(itemId: string) {
    setItemsState((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, isLocked: false } : item))
    );
  }

  function unlockWorld(worldId: number) {
    setWorldsState((prev) =>
      prev.map((world) => (world.id === worldId ? { ...world, isLocked: false } : world))
    );
  }

  return (
    <CampaignContext.Provider
      value={{
        campaigns,
        activeCampaign,
        createCampaign,
        joinCampaign,
        switchCampaign,
        hasCampaign: !!activeCampaign,
        isMaster: activeCampaign?.role === "MASTER",
        charactersState,
        itemsState,
        worldsState,
        unlockCharacter,
        unlockItem,
        unlockWorld,
      }}
    >
      {children}
    </CampaignContext.Provider>
  );
}

export function useCampaign() {
  const ctx = useContext(CampaignContext);
  if (!ctx) throw new Error("useCampaign precisa estar dentro do CampaignProvider");
  return ctx;
}
