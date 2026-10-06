"use client";

import { useState, useTransition } from "react";
import { updateUserSettings } from "@/app/actions/auth";
import { NotificationPreferences } from "@/lib/types/settings";
import { useToast } from "@/componentes/ui/ToastProvider";
import { ConfigActionButton, ConfigSection, ToggleRow } from "./shared";

export default function TabNotificacoes({ initial }: { initial: NotificationPreferences }) {
  const [preferences, setPreferences] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();
  const dirty = Object.keys(preferences).some((key) => preferences[key as keyof NotificationPreferences] !== saved[key as keyof NotificationPreferences]);

  function save() {
    startTransition(async () => {
      try {
        await updateUserSettings({ notifications: preferences });
        setSaved(preferences);
        toast.success("Preferências de notificação salvas.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Não foi possível salvar as preferências.");
      }
    });
  }

  return (
    <ConfigSection title="Notificações">
      <p className="text-sm leading-relaxed text-bege-claro/60">
        Escolha quais avisos persistentes deseja receber no Millie. Eles aparecem no sino do cabeçalho e na caixa de notificações.
      </p>
      <div className="space-y-4 border-t border-bege-escuro/10 pt-4">
        <ToggleRow label="Itens entregues ao personagem" description="Avisar quando o Mestre adicionar ou transferir itens para um dos seus personagens." checked={preferences.itensAdicionados} onChange={(value) => setPreferences((current) => ({ ...current, itensAdicionados: value }))} disabled={isPending} />
        <ToggleRow label="Habilidades desbloqueadas" description="Avisar quando o Mestre liberar uma habilidade para um dos seus personagens." checked={preferences.habilidadesDesbloqueadas} onChange={(value) => setPreferences((current) => ({ ...current, habilidadesDesbloqueadas: value }))} disabled={isPending} />
        <ToggleRow label="Novas sessões de campanha (em breve)" description="Será ativado quando o Millie tiver criação e agenda de sessões." checked={false} onChange={() => undefined} disabled />
        <ToggleRow label="Atualizações do sistema (em breve)" description="Será ativado quando houver um canal de comunicados do sistema." checked={false} onChange={() => undefined} disabled />
      </div>
      <ConfigActionButton label={isPending ? "Salvando..." : "Salvar notificações"} onClick={save} disabled={isPending || !dirty} />
    </ConfigSection>
  );
}
