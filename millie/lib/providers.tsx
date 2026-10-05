"use client";

import { SessionProvider } from "next-auth/react";
import { CampaignProvider } from "@/lib/contexts/CampaignContext";
import { PreferencesProvider } from "@/lib/contexts/PreferencesContext";
import AnimationsSync from "@/componentes/AnimationsSync";
import { ToastProvider } from "@/componentes/ui/ToastProvider";
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
          <ToastProvider>{children}</ToastProvider>
        </PreferencesProvider>
      </CampaignProvider>
    </SessionProvider>
  );
}
