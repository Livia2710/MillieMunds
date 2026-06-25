"use client";

import { SessionProvider } from "next-auth/react";
import { CampaignProvider } from "@/lib/contexts/CampaignContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CampaignProvider>
        {children}
      </CampaignProvider>
    </SessionProvider>
  );
}