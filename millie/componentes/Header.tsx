"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Scroll,Hammer,Backpack, X, Sparkles, Home, Users, Menu } from "lucide-react";

export function Header() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      <header className="relative h-20 overflow-hidden rounded-[10px] bg-roxo-escuro text-bege-escuro shadow-header">
        <Image
          src="/assets/svgs/header-left.svg"
          alt=""
          width={170}
          height={70}
          className="pointer-events-none absolute left-0 top-0 h-full w-auto"
        />

        <Image
          src="/assets/svgs/header-right.svg"
          alt=""
          width={170}
          height={70}
          className="pointer-events-none absolute right-0 top-0 h-full w-auto"
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
                <ChevronDown size={22} strokeWidth={1.5} />
            </div>

            {/* Ícone de Hambúrguer: Só aparece no mobile (esconde do 'md' para cima) */}
            <div className="block md:hidden p-1 hover:bg-bege-escuro/10 rounded">
                <Menu size={28} strokeWidth={1.5} />
            </div>


          </button>
        </div>
      </header>

      {isSidebarOpen && (
        <aside className="fixed right-0 top-0 z-30 h-dvh w-80 border border-bege-escuro/60 bg-roxo-escuro/95 px-4 py-4 text-bege-escuro shadow-2xl">
          <div className="flex justify-end mb-2">
            <button 
              type="button" 
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 cursor-pointer hover:bg-bege-escuro/10 rounded-md transition-colors"
            >
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>

          <div className="flex items-center gap-3 border-b border-bege-escuro/20 pb-4">
            <div className="h-12 w-12 rounded-full border border-bege-escuro/50 bg-roxo" />

            <div>
              <p className="font-title text-md uppercase tracking-[0.12em]">
                Username
              </p>
            </div>
          </div>

          <nav className="mt-4 space-y-1">
            {/* BLOCO MOBILE: Só aparece em telas menores que 'md' */}
            <div className="block md:hidden mb-2 space-y-1">
                <SidebarLink label="Home" icon={<Home size={18} strokeWidth={1.4} />} />
                <SidebarLink label="Personagens" icon={<Users size={18} strokeWidth={1.4} />}/>
                <SidebarLink label="Habilidades" icon={<Sparkles size={18} strokeWidth={1.4} />}/>
            </div>
            
            <SidebarLink label="Perfil" icon={<Scroll size={18} strokeWidth={1.4} />} />
            <SidebarLink label="Inventário" icon={<Backpack size={18} strokeWidth={1.4} />} />
            <SidebarLink label="Configurações" icon={<Hammer size={18} strokeWidth={1.4} />} />
          </nav>
        </aside>
      )}
    </>
  );
}

function SidebarLink({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-4 border-b border-bege-escuro/15 py-3 text-left font-title text-sm uppercase tracking-[0.12em] cursor-pointer hover:bg-bege-escuro/5 px-2 rounded transition-colors"
    >

      {icon}
      {label}
    </button>
  );
}
