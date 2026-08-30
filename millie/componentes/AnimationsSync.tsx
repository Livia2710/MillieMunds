"use client";

import { useEffect } from "react";
import { usePreferences } from "@/lib/contexts/PreferencesContext";

export default function AnimationsSync() {
  const { preferences } = usePreferences();

  useEffect(() => {
    document.documentElement.classList.toggle("no-animations", !preferences.animacoesInterface);
  }, [preferences.animacoesInterface]);

  return null;
}