"use client";

import { createContext, useContext, useState, useEffect, ReactNode,} from "react";
import { getUserCampaigns, createCampaign as actionCreateCampaign, joinCampaign as actionJoinCampaign, switchCampaign as actionSwitchCampaign,} from "@/app/actions/campaign";

export type UserCampaign = {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  role: "MASTER" | "PLAYER";
  active: boolean;
};

type CampaignContextType = {
  campaigns: UserCampaign[];
  activeCampaign: UserCampaign | null;
  hasCampaign: boolean;
  isMaster: boolean;
  loading: boolean;
  createCampaign: (name: string, description: string) => Promise<void>;
  joinCampaign: (code: string) => Promise<void>;
  switchCampaign: (id: string) => Promise<void>;
};

const CampaignContext = createContext<CampaignContextType | null>(null);

export function CampaignProvider({ children }: { children: ReactNode }) {
  const [campaigns, setCampaigns] = useState<UserCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchCampaigns() {
    const data = await getUserCampaigns();
    setCampaigns(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const activeCampaign = campaigns.find((c) => c.active) ?? null;

  async function createCampaign(name: string, description: string) {
    await actionCreateCampaign(name, description);
    await fetchCampaigns();
  }

  async function joinCampaign(code: string) {
    await actionJoinCampaign(code);
    await fetchCampaigns();
  }

  async function switchCampaign(id: string) {
    await actionSwitchCampaign(id);
    await fetchCampaigns();
  }

  return (
    <CampaignContext.Provider
      value={{
        campaigns,
        activeCampaign,
        hasCampaign: !!activeCampaign,
        isMaster: activeCampaign?.role === "MASTER",
        loading,
        createCampaign,
        joinCampaign,
        switchCampaign,
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