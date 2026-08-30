"use client";

import useSound from "use-sound";
import { usePreferences } from "@/lib/contexts/PreferencesContext";

export function useInterfaceSound(src: string, options?: { volume?: number }) {
  const { preferences } = usePreferences();
  const [play] = useSound(src, options);

  return () => {
    if (preferences.sonsInterface) play();
  };
}