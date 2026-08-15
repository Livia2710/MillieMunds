"use client";

import { createContext, useContext, useState, useCallback } from "react";
import type { UserPreferences } from "@/lib/types/settings";

type PreferencesContextValue = {
  preferences: UserPreferences;
  setPreferences: (prefs: UserPreferences) => void;
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({
  initial,
  children,
}: {
  initial: UserPreferences;
  children: React.ReactNode;
}) {
  const [preferences, setPreferences] = useState<UserPreferences>(initial);

  const updatePreference = useCallback(
    <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
      setPreferences((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  return (
    <PreferencesContext.Provider value={{ preferences, setPreferences, updatePreference }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences deve ser usado dentro de PreferencesProvider");
  return ctx;
}