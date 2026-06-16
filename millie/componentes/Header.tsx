"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Scroll, X, Sparkles, Home, Users, Menu, BookOpen, Feather, Compass, Wand, Eye ,Backpack} from "lucide-react";

const campaigns = [
  {
    id: "1",
    name: "Crônicas de Umbrael",
    role: "master",
  },
  {
    id: "2",
    name: "A Travessia dos Mil Mundos",
    role: "player",
  },
  {
    id: "3",
    name: "O Véu de Aster",
    role: "master",
  },
] as const;

export function Header() {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Estados independentes para os Accordions das campanhas
  const [isMasterOpen, setIsMasterOpen] = useState(false);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  const masterCampaigns = campaigns.filter((campaign) => campaign.role === "master");
  const playerCampaigns = campaigns.filter((campaign) => campaign.role === "player");

  return (
    <>
      <header className="relative h-20 overflow-hidden rounded-[10px] bg-roxo-escuro text-bege-escuro shadow-header">
        <Image
          src="/assets/svgs/header-left.svg"
          alt=""
          width={170}
          height={70}
          className="pointer-events-none absolute left-0 top-0 w-19 h-19 md:w-25 md:h-25"
        />

        <Image
          src="/assets/svgs/header-right.svg"
          alt=""
          width={170}
          height={70}
          className="pointer-events-none absolute right-0 top-0 w-19 h-19 md:w-25 md:h-25"
        />

        <div className="relative z-10 flex h-full items-center px-28">
          <Image
            src="/assets/svgs/logo.svg"
            alt=""
            width={58}
            height={58}
            className="mr-14 opacity-90"
          />

          <nav className="hidden md:flex items-center gap-14">
            <Link href="/" className="font-title text-lg uppercase tracking-[0.18em] hover:opacity-80 transition-opacity">
              Home
            </Link>
            <Link href="/personagens" className="font-title text-lg uppercase tracking-[0.18em] hover:opacity-80 transition-opacity">
              Personagens
            </Link>
            <Link href="/habilidades" className="font-title text-lg uppercase tracking-[0.18em] hover:opacity-80 transition-opacity">
              Habilidades
            </Link>
          </nav>

          <button
            type="button"
            onClick={() => setIsSidebarOpen((current) => !current)}
            className="ml-auto flex items-center gap-3 font-title text-[24px] leading-[1.1] tracking-wider cursor-pointer hover:opacity-80 transition-opacity"
          >
            <span className="hidden md:inline">Username</span>
            <div className="hidden md:block">
              <ChevronDown size={22} strokeWidth={1.5} className={`transition-transform duration-200 ${isSidebarOpen ? 'rotate-180' : ''}`} />
            </div>
            <div className="block md:hidden p-1 hover:bg-bege-escuro/10 rounded">
              <Menu size={28} strokeWidth={1.5} />
            </div>
          </button>
        </div>
      </header>

      {isSidebarOpen && (
        /* Adicionado classes para ocultar a barra de rolagem cinza padrão do navegador */
        <aside className="fixed right-0 top-0 z-30 h-dvh w-80 overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden border-l border-bege-escuro/40 bg-roxo-escuro px-6 py-6 text-bege-escuro shadow-2xl">
          <div className="flex justify-end mb-2">
            <button 
              type="button" 
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 cursor-pointer hover:bg-bege-escuro/10 rounded-md transition-colors"
            >
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>

          <div className="flex items-center gap-3 border-b border-bege-escuro/20 pb-4 justify-center">
            <div className="h-10 w-10 rounded-full border border-bege-escuro/40 bg-roxo" />
            <div>
              <p className="font-title text-md uppercase tracking-[0.14em] text-bege-claro">
                Username
              </p>
            </div>
          </div>

          {/* Seção Campanhas: Trocado os ícones por Pena e Bússola */}
          <SidebarBlock title="Ações">
            <SidebarAction
              label="Criar campanha"
              icon={<Feather size={16} strokeWidth={1.4} />}
            />
            <SidebarAction
              label="Participar de"
              icon={<Compass size={16} strokeWidth={1.4} />}
            />
          </SidebarBlock>

          <SidebarBlock title="Páginas">
            <div className="block md:hidden">
               <SidebarLink
              href="/"
              label="Home"
              icon={<Home size={17} strokeWidth={1.4}/>}
              closeSidebar={() => setIsSidebarOpen(false)}
              active={pathname === "/"}
              />
            <SidebarLink
              href="/personagens"
              label="Personagens"
              icon={<Users size={17} strokeWidth={1.4}/>}
              closeSidebar={() => setIsSidebarOpen(false)}
              active={pathname === "/personagens"}
              />
              <SidebarLink
              href="/"
              label="Habilidades"
              icon={<Sparkles size={17} strokeWidth={1.4}/>}
              closeSidebar={() => setIsSidebarOpen(false)}
              active={pathname === "/"}
              />
            </div>
            <SidebarLink
              href="/"
              label="Perfil"
              icon={<Users size={17} strokeWidth={1.4}/>}
              closeSidebar={() => setIsSidebarOpen(false)}
              active={pathname === "/"}
              />
            <SidebarLink
              href="/inventario"
              label="Inventário"
              icon={<Backpack size={17} strokeWidth={1.4}/>}
              closeSidebar={() => setIsSidebarOpen(false)}
              active={pathname === "/inventario"}
              />
              <SidebarLink
              href="/"
              label="Configurações"
              icon={<Eye size={17} strokeWidth={1.4}/>}
              closeSidebar={() => setIsSidebarOpen(false)}
              active={pathname === "/"}
              />
          </SidebarBlock>

          <SidebarBlock title="Minhas Crônicas">
            {/* Accordion de Mestre */}
            <CampaignGroup
              title="Como Mestre"
              campaigns={masterCampaigns}
              icon={<Wand size={15} strokeWidth={1.4} />}
              isOpen={isMasterOpen}
              onToggle={() => setIsMasterOpen(!isMasterOpen)}
            />

            {/* Accordion de Jogador */}
            <CampaignGroup
              title="Como Jogador"
              campaigns={playerCampaigns}
              icon={<BookOpen size={15} strokeWidth={1.4} />}
              isOpen={isPlayerOpen}
              onToggle={() => setIsPlayerOpen(!isPlayerOpen)}
            />
          </SidebarBlock>
        </aside>
      )}
    </>
  );
}

function SidebarLink({label, icon, href, closeSidebar, active,}: {
  label: string;
  icon: React.ReactNode;
  href: string;
  closeSidebar: () => void;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={closeSidebar}
      className={` flex min-h-12 w-full items-center gap-4 border-b border-bege-escuro/10 px-4 py-3 text-left font-title text-[15px] uppercase tracking-[0.12em] transition-all hover:pl-5 group
      ${active
          ? "text-bege-claro pl-5 bg-bege-escuro/5"
          : "text-bege-medio"
      }`}>

      <span className={`shrink-0 transition-colors
          ${
            active
            ? "text-bege-claro"
            : "text-bege-escuro/50 group-hover:text-bege-medio"
          }`}>
      {icon}
      </span>

      <span className="truncate">
        {label}
      </span>

    </Link>
  );
}

function SidebarAction({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <button
      type="button"
      className="flex min-h-12 w-full items-center gap-4 border-b border-bege-escuro/10 px-4 py-3 text-left font-title text-[15px] uppercase tracking-[0.12em] text-bege-medio transition-all hover:text-bege-claro hover:pl-5 cursor-pointer group"
    >
      <span className="text-bege-escuro/50 group-hover:text-bege-medio transition-colors shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}

function SidebarBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 flex flex-col w-full">
      <h3 className="mb-2 px-4 font-title text-[11px] uppercase tracking-[0.2em] text-bege-escuro/40 text-left">
        {title}
      </h3>

      {/* Caixa com cantos e bordas sutis para agrupar os links de forma limpa */}
      <div className="w-full flex flex-col overflow-hidden">
        {children}
      </div>
      
      {/* Divisor estético centralizado após o bloco */}
      <div className="mt-5 flex items-center justify-center w-20 mx-auto opacity-15">
        <div className="h-[1px] w-full bg-bege-escuro" />
        <div className="h-1 w-1 rotate-45 border border-bege-escuro bg-roxo-escuro mx-2 shrink-0" />
        <div className="h-[1px] w-full bg-bege-escuro" />
      </div>
    </section>
  );
}

function CampaignGroup({
  title,
  campaigns,
  icon,
  isOpen,
  onToggle,
}: {
  title: string;
  campaigns: readonly { id: string; name: string; role: "master" | "player" }[];
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="w-full border-b border-bege-escuro/10 last:border-b-0">
      {/* Cabeçalho do Accordion alinhado à esquerda */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 font-title text-[13px] uppercase tracking-[0.14em] text-bege-escuro/60 hover:text-bege-medio transition-colors cursor-pointer px-4 py-3"
      >
        <span>{title}</span>
        <ChevronDown 
          size={14} 
          className={`transition-transform duration-200 text-bege-escuro/40 ${isOpen ? "rotate-180" : ""}`} 
        />
      </button>

      {/* Lista retrátil de Campanhas */}
      <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 overflow-hidden"}`}>
        <div className="overflow-hidden bg-black/10">
          {campaigns.map((campaign) => (
            <button
              key={campaign.id}
              type="button"
              className="flex min-h-11 w-full items-center gap-3 px-6 py-2.5 text-left transition hover:bg-bege-escuro/5 border-t border-bege-escuro/5 first:border-t-0 group"
            >
              <span className="text-bege-escuro/40 group-hover:text-bege-medio transition-colors shrink-0">{icon}</span>
              <span className="truncate font-title text-md tracking-[0.08em] text-bege-claro/90 " >
                {campaign.name}
              </span>
            </button>
          ))}
          
          {/* Alerta caso não haja nenhuma campanha ativa na lista */}
          {campaigns.length === 0 && (
            <p className="px-6 py-3 text-sm italic text-bege-escuro/40 text-left">
              Nenhuma crônica ativa.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
