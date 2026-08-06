"use client";

import { useState, useTransition } from "react";
import { updateUserSettings, getUserSettings } from "@/app/actions/auth";
import { ConfigSection, ToggleRow, ConfigActionButton } from "./shared";
import { NotificationPreferences } from "@/lib/types/settings";

export default function TabNotificacoes({ initial }: { initial: NotificationPreferences }) {
  const [notifs, setNotifs] = useState<NotificationPreferences>(initial);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  function setField<K extends keyof NotificationPreferences>(key: K, value: NotificationPreferences[K]) {
    setNotifs((n) => ({ ...n, [key]: value }));
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await updateUserSettings({ notifications: notifs });
        setFeedback("Notificações salvas.");
        setTimeout(() => setFeedback(null), 3000);
      } catch (e: any) {
        setFeedback(e.message);
      }
    });
  }

  return (
    <ConfigSection title="Notificações">
      <ToggleRow label="Novas sessões de campanha" description="Quando o Mestre agendar ou iniciar uma nova sessão."
        checked={notifs.novasSessoes} onChange={(v) => setField("novasSessoes", v)} />
      <ToggleRow label="Itens adicionados ao inventário" description="Quando o Mestre adicionar um item ao seu inventário."
        checked={notifs.itensAdicionados} onChange={(v) => setField("itensAdicionados", v)} />
      <ToggleRow label="Habilidades desbloqueadas" description="Quando você subir de nível e desbloquear novas habilidades."
        checked={notifs.habilidadesDesbloqueadas} onChange={(v) => setField("habilidadesDesbloqueadas", v)} />
      <ToggleRow label="Atualizações do sistema" description="Novos conteúdos, raças e mundos adicionados ao Millie Munds."
        checked={notifs.atualizacoesSistema} onChange={(v) => setField("atualizacoesSistema", v)} />

      <ConfigActionButton label={isPending ? "Salvando..." : "Salvar notificações"} onClick={handleSave} disabled={isPending} />
      {feedback && <p className="font-title text-xs uppercase tracking-wider text-terra">{feedback}</p>}
    </ConfigSection>
  );
}