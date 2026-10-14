"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, Compass, Dices, Package, ScrollText, Shield, Users, X } from "lucide-react";
import { useCampaign } from "@/lib/contexts/CampaignContext";
import { getActiveExplorationMap } from "@/app/actions/exploration";

const campaignLinks = [
  { href: "/perfil", label: "Perfil e regras", icon: <Dices size={16} /> },
  { href: "/personagens", label: "Personagens", icon: <Users size={16} /> },
  { href: "/inventario", label: "Inventário", icon: <Package size={16} /> },
  { href: "/habilidades", label: "Habilidades", icon: <ScrollText size={16} /> },
  { href: "/mapas", label: "Exploração", icon: <Compass size={16} /> },
] as const;

export function CampaignOrb() {
  const { activeCampaign, hasCampaign, campaigns, switchCampaign } = useCampaign();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isGuarding, setIsGuarding] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [activeMap, setActiveMap] = useState<{ mapName: string; roomName: string | null } | null>(null);
  const isExploring = pathname === "/mapas" || pathname.startsWith("/mapas/");
  const previousPath = useRef(pathname);

  useEffect(() => {
    const wasExploring = previousPath.current === "/mapas" || previousPath.current.startsWith("/mapas/");
    if (wasExploring && !isExploring) setIsGuarding(true);
    if (!wasExploring && isExploring) setIsGuarding(false);
    previousPath.current = pathname;
  }, [isExploring, pathname]);

  useEffect(() => {
    let cancelled = false;
    const refreshMap = async () => {
      try {
        const location = await getActiveExplorationMap();
        if (!cancelled) setActiveMap(location);
      } catch {
        if (!cancelled) setActiveMap(null);
      }
    };
    if (hasCampaign) {
      void refreshMap();
      const timer = setInterval(() => void refreshMap(), 15_000);
      return () => { cancelled = true; clearInterval(timer); };
    }
    setActiveMap(null);
    return () => { cancelled = true; };
  }, [activeCampaign?.id, hasCampaign]);

  if (!hasCampaign || !activeCampaign) return null;

  function changeCampaign(id: string) {
    startTransition(async () => {
      await switchCampaign(id);
      setIsOpen(false);
    });
  }

  function navigate(href: string) {
    if (isExploring && !href.startsWith("/mapas")) setIsGuarding(true);
    if (href.startsWith("/mapas")) setIsGuarding(false);
    setIsOpen(false);
    router.push(href);
  }

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {isOpen && (
        <section className="mb-3 w-72 overflow-hidden rounded-lg border border-bege-escuro/45 bg-roxo-escuro/95 text-bege-claro shadow-2xl" aria-label="Central da campanha">
          <header className="border-b border-bege-escuro/20 px-4 py-3">
            <p className="flex items-center gap-2 font-title text-xs uppercase tracking-[.16em] text-bege-medio"><Shield size={15} /> Campanha ativa</p>
            <p className="mt-2 truncate text-sm">{activeCampaign.name}</p>
            <p className="mt-1 text-[11px] text-bege-claro/60">{activeCampaign.role === "MASTER" ? "Mestre" : "Jogador"}</p>
            <p className="mt-2 flex items-center gap-2 text-[10px] uppercase tracking-wider text-bege-medio">
              <span className={`h-2 w-2 rounded-full ${isExploring ? "bg-emerald-400" : isGuarding ? "bg-amber-300" : "bg-bege-medio/60"}`} />
              {isExploring ? "Na exploração" : isGuarding ? "Guardando · fora do mapa" : "Exploração disponível"}
            </p>
            {activeMap && <p className="mt-1 pl-4 text-[10px] text-bege-claro/65">Mapa: {activeMap.mapName}{activeMap.roomName ? ` · ${activeMap.roomName}` : ""}</p>}
            {campaigns.length > 1 && (
              <label className="mt-3 block text-[10px] uppercase tracking-widest text-bege-claro/60">
                Trocar campanha
                <select value={activeCampaign.id} disabled={isPending} onChange={event => changeCampaign(event.target.value)} className="mt-1 w-full border border-bege-escuro/30 bg-[#1d1020] p-2 text-xs normal-case text-bege-claro">
                  {campaigns.map(campaign => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}
                </select>
              </label>
            )}
          </header>

          <div className="p-2">
            <div className="mb-2 border-b border-bege-escuro/15 pb-2">
              <button type="button" onClick={() => navigate(isExploring ? "/perfil" : "/mapas")} className="flex min-h-10 w-full items-center gap-3 px-3 text-left text-xs uppercase tracking-wider hover:bg-bege-escuro/10">
                <Compass size={16} />
                {isExploring ? "Sair do mapa · continuar guardando" : isGuarding ? "Retomar exploração" : "Entrar no mapa"}
              </button>
              <p className="px-3 pb-2 text-[10px] leading-relaxed text-bege-claro/55">
                {isExploring ? "O grupo continua na sala atual enquanto você navega pelo restante do sistema." : "A exploração compartilhada permanece ativa enquanto você acessa outras áreas."}
              </p>
            </div>
            {campaignLinks.map(link => (
              <Link key={link.href} href={link.href} onClick={() => { if (isExploring) setIsGuarding(true); setIsOpen(false); }} className="flex min-h-10 items-center gap-3 px-3 text-xs uppercase tracking-wider hover:bg-bege-escuro/10">
                {link.icon}<span>{link.label}</span>
              </Link>
            ))}
            {activeCampaign.role === "MASTER" && <Link href="/mestre" onClick={() => { if (isExploring) setIsGuarding(true); setIsOpen(false); }} className="flex min-h-10 items-center gap-3 px-3 text-xs uppercase tracking-wider hover:bg-bege-escuro/10"><Shield size={16} /><span>Painel do Mestre</span></Link>}
            <Link href="/" onClick={() => { if (isExploring) setIsGuarding(true); setIsOpen(false); }} className="flex min-h-10 items-center gap-3 px-3 text-xs uppercase tracking-wider hover:bg-bege-escuro/10">
              <BookOpen size={16} /><span>Mundos</span>
            </Link>
          </div>
        </section>
      )}
      <button type="button" onClick={() => setIsOpen(value => !value)} aria-label={isOpen ? "Fechar central da campanha" : "Abrir central da campanha"} aria-expanded={isOpen} className="arcane-hover flex h-14 w-14 items-center justify-center rounded-full border border-bege-escuro/65 bg-roxo-escuro text-bege-escuro shadow-[0_0_28px_rgba(191,167,122,0.22)] transition overflow-hidden">
        {isOpen ? <X size={22} strokeWidth={1.5} /> : <Compass size={23} strokeWidth={1.5} />}
      </button>
    </div>
  );
}
