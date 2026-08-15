"use client";

import { useState } from "react";
import Image from "next/image";
import { User, Sliders, Bell, BookOpen, Trash2 } from "lucide-react";
import { updateUserSettings, getUserSettings } from "@/app/actions/auth";
import { NotificationPreferences,UserPreferences } from "@/lib/types/settings";
import TabConta from "./TabConta";
import TabPreferencias from "./TabPreferencias";
import TabNotificacoes from "./TabNotificacoes";
import TabBiblioteca from "./TabBiblioteca";
import TabCampanha from "./TabCampanha";

type Profile = { username: string | null; avatar: string | null; email: string } | null;
type ConfigTab = "conta" | "preferencias" | "notificacoes" | "biblioteca" | "campanha";
type Settings = { preferences: UserPreferences; notifications: NotificationPreferences };

const TABS: { key: ConfigTab; label: string; icon: React.ReactNode }[] = [
  { key: "conta", label: "Conta", icon: <User size={15} strokeWidth={1.5} /> },
  { key: "preferencias", label: "Preferências", icon: <Sliders size={15} strokeWidth={1.5} /> },
  { key: "notificacoes", label: "Notificações", icon: <Bell size={15} strokeWidth={1.5} /> },
  { key: "biblioteca", label: "Biblioteca", icon: <BookOpen size={15} strokeWidth={1.5} /> },
  { key: "campanha", label: "Campanha", icon: <Trash2 size={15} strokeWidth={1.5} /> },
];

export default function ConfiguracoesClient({ settings, profile }: { settings: Settings; profile: Profile }) {
  const [activeTab, setActiveTab] = useState<ConfigTab>("conta");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-title text-4xl uppercase tracking-[0.08em] text-bege-medio md:text-5xl">Configurações</h1>
        <Image src="/assets/svgs/divider.svg" alt="" width={320} height={20} className="mt-3 max-w-[200px] md:max-w-xs" />
      </div>

      <div className="flex min-w-0 flex-col gap-8 md:flex-row md:gap-12">
        <nav className="flex w-full flex-wrap gap-1 md:w-44 md:flex-col md:flex-nowrap">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const isDanger = tab.key === "campanha";
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex h-10 w-10 items-center justify-center border-b-2 transition-all sm:h-auto sm:w-auto sm:justify-start sm:gap-3 sm:px-3 sm:py-2.5 md:border-b-0 md:border-l-2
                  ${isActive
                    ? isDanger ? "border-red-500/60 text-red-400" : "border-bege-medio text-bege-medio"
                    : isDanger ? "border-transparent text-red-500/40 hover:text-red-400" : "border-transparent text-bege-escuro/50 hover:text-bege-medio"
                  }`}
              >
                <span className="shrink-0">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex-1 min-w-0">
          {activeTab === "conta" && <TabConta initial={profile} />}
          {activeTab === "preferencias" && <TabPreferencias initial={settings.preferences} />}
          {activeTab === "notificacoes" && <TabNotificacoes initial={settings.notifications} />}
          {activeTab === "biblioteca" && <TabBiblioteca />}
          {activeTab === "campanha" && <TabCampanha />}
        </div>
      </div>
    </div>
  );
}