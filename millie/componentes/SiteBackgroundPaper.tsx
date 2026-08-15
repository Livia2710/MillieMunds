"use client";

import { usePreferences } from "@/lib/contexts/PreferencesContext";

export default function SiteBackgroundPaper() {
  const { preferences } = usePreferences();

  if (!preferences.texturaPapel) return null;

  return <div className="site-background-paper" aria-hidden="true" />;
}