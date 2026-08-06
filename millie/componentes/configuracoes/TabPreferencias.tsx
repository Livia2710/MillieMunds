"use client";

import { useState, useTransition } from "react";
import { updateUserSettings, getUserSettings } from "@/app/actions/auth";
import { ConfigSection, ToggleRow, ConfigActionButton } from "./shared";
import { UserPreferences } from "@/lib/types/settings";

export default function TabPreferencias({ initial }: { initial: UserPreferences }) {
  const [prefs, setPrefs] = useState<UserPreferences>(initial);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  function setField<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) {
    setPrefs((p) => ({ ...p, [key]: value }));
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await updateUserSettings({ preferences: prefs });
        setFeedback("Preferências salvas.");
        setTimeout(() => setFeedback(null), 3000);
      } catch (e: any) {
        setFeedback(e.message);
      }
    });
  }

  return (
    <ConfigSection title="Preferências Visuais e de Sistema">
      <ToggleRow
        label="Animações da interface"
        description="Inclui a animação de órbita na tela de Habilidades e transições de página."
        checked={prefs.animacoesInterface}
        onChange={(v) => setField("animacoesInterface", v)}
      />
      <ToggleRow
        label="Efeito de textura de papel"
        description="Camada overlay de papel sobre toda a interface."
        checked={prefs.texturaPapel}
        onChange={(v) => setField("texturaPapel", v)}
      />
      <ToggleRow
        label="Sons de interface"
        description="Sons ao virar cartas e interagir com elementos arcanos. (em breve)"
        checked={prefs.sonsInterface}
        onChange={(v) => setField("sonsInterface", v)}
      />

      <div className="mt-6 border-t border-bege-escuro/20 pt-6 opacity-50 pointer-events-none">
        <p className="mb-3 font-title text-xs uppercase tracking-[0.16em] text-bege-escuro/50">Idioma (em breve)</p>
        <div className="relative w-48">
          <select disabled className="w-full appearance-none border border-bege-escuro/40 bg-roxo-escuro px-4 py-2.5 pr-8 font-title text-xs uppercase tracking-wider text-bege-medio outline-none">
            <option className="bg-roxo-escuro">Português (BR)</option>
            <option className="bg-roxo-escuro">English</option>
          </select>
        </div>
      </div>

      <ConfigActionButton label={isPending ? "Salvando..." : "Salvar preferências"} onClick={handleSave} disabled={isPending} />
      {feedback && <p className="font-title text-xs uppercase tracking-wider text-terra">{feedback}</p>}
    </ConfigSection>
  );
}