"use client";

import { SessionProvider } from "next-auth/react";
import { CampaignProvider } from "@/lib/contexts/CampaignContext";
import { PreferencesProvider } from "@/lib/contexts/PreferencesContext";
import AnimationsSync from "@/componentes/AnimationsSync";
import type { UserPreferences } from "@/lib/types/settings";

export function Providers({
  children,
  initialPreferences,
}: {
  children: React.ReactNode;
  initialPreferences: UserPreferences;
}) {
  return (
    <SessionProvider>
      <CampaignProvider>
        <PreferencesProvider initial={initialPreferences}>
          <AnimationsSync />
          {children}
        </PreferencesProvider>
      </CampaignProvider>
    </SessionProvider>
  );
}