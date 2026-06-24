"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { WorldCard } from "./WorldCard";
import NoCampaign from "@/componentes/NoCampaign";
import CriarCampanhaModal from "@/componentes/modais/CriarCampanhaModal";
import EntrarCampanhaModal from "@/componentes/modais/EntrarCampanhaModal";
import { useCampaign } from "@/lib/contexts/CampaignContext";

export function HomeWorlds() {
  const carouselRef = useRef<HTMLDivElement>(null);
  
  // Consome os estados dinâmicos do contexto global
  const { hasCampaign, isMaster, worldsState, unlockWorld } = useCampaign();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  function scrollWorlds(direction: "left" | "right") {
    if (!carouselRef.current) return;

    const firstItem = carouselRef.current.firstElementChild as HTMLElement;
    const scrollAmount = firstItem ? firstItem.offsetWidth + 32 : 280;

    carouselRef.current.scrollBy({
      left: direction === "right" ? scrollAmount : -scrollAmount,
      behavior: "smooth",
    });
  }

  // 🟢 MASTER: Vê todos os mundos do sistema | PLAYER: Só vê os mundos já liberados pelo mestre
  const worlds = isMaster
    ? worldsState
    : worldsState.filter((world) => !world.isLocked);

  return (
    <>
      <section className="relative mt-5 min-h-130 overflow-hidden rounded-[10px] bg-roxo-escuro px-6 py-10 text-bege-escuro shadow-header md:mt-10 md:px-16 md:py-14">
        {/* Cantoneiras Decorativas */}
        <Image src="/assets/svgs/corner-left-top.svg" alt="" width={100} height={100} className="pointer-events-none absolute left-0 top-0 h-19 w-19 md:h-25 md:w-25" />
        <Image src="/assets/svgs/corner-right-top.svg" alt="" width={100} height={100} className="pointer-events-none absolute right-0 top-0 h-19 w-19 md:h-25 md:w-25" />
        <Image src="/assets/svgs/corner-left-bottom.svg" alt="" width={100} height={100} className="pointer-events-none absolute bottom-0 left-0 h-19 w-19 md:h-25 md:w-25" />
        <Image src="/assets/svgs/corner-right-bottom.svg" alt="" width={100} height={100} className="pointer-events-none absolute bottom-0 right-0 h-19 w-19 md:h-25 md:w-25" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <h2 className="font-title text-2xl uppercase tracking-[0.18em] md:text-4xl">
            Mundos Conhecidos
          </h2>

          <Image src="/assets/svgs/divider.svg" alt="" width={360} height={28} className="mt-4 max-w-[80%]" />

          {!hasCampaign ? (
            <div className="mt-10 w-full max-w-2xl md:mt-16">
              <NoCampaign 
                message="Os detalhes dos mundos e crônicas só ficam visíveis enquanto você fizer parte de uma campanha ativa." 
                onCreate={() => setIsCreateOpen(true)}
                onJoin={() => setIsJoinOpen(true)}
              />
            </div>
          ) : (
            /* Carrossel de Mundos */
            <div className="relative mt-10 flex w-full flex-col items-center justify-start lg:flex-row lg:justify-center md:mt-16">
              <button type="button" onClick={() => scrollWorlds("left")} className="absolute left-0 z-20 hidden cursor-pointer transition hover:brightness-125 lg:block">
                <Image src="/assets/svgs/arrow.svg" alt="Mundos anteriores" width={70} height={38} />
              </button>

              <div ref={carouselRef} className="flex w-full snap-x snap-mandatory gap-8 overflow-x-auto scroll-smooth px-0 pb-4 scrollbar-none [&::-webkit-scrollbar]:hidden md:gap-10 lg:max-w-190">
                {worlds.map((world) => (
                  <div key={world.id} className="shrink-0 basis-full snap-center sm:basis-[44%] md:basis-[30%]">
                    {/* Se o mundo estiver trancado (apenas o Master verá devido ao filtro), renderiza o card sem link e passa o gatilho de desbloqueio */}
                    {world.isLocked ? (
                      <div className="relative group">
                        <WorldCard name={world.name} description={world.description} image={world.image} isLocked={world.isLocked} />
                        {isMaster && (
                          <button 
                            onClick={() => unlockWorld(world.id)}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-title text-sm text-bege-claro border border-bege-escuro uppercase tracking-wider"
                          >
                            Liberar para Jogadores
                          </button>
                        )}
                      </div>
                    ) : (
                      <Link href={`/mundos/${world.slug}`} className="block w-full h-full">
                        <WorldCard name={world.name} description={world.description} image={world.image} isLocked={world.isLocked} />
                      </Link>
                    )}
                  </div>
                ))}
              </div>

              <button type="button" onClick={() => scrollWorlds("right")} className="absolute right-0 z-20 hidden cursor-pointer transition hover:brightness-125 lg:block">
                <Image src="/assets/svgs/arrow.svg" alt="Próximos mundos" width={70} height={38} className="rotate-180" />
              </button>

              <div className="mt-6 flex items-center gap-10 lg:hidden">
                <button type="button" onClick={() => scrollWorlds("left")} className="p-2 cursor-pointer active:scale-95 transition-transform">
                  <Image src="/assets/svgs/arrow.svg" alt="Mundos anteriores" width={50} height={28} />
                </button>
                <button type="button" onClick={() => scrollWorlds("right")} className="p-2 cursor-pointer active:scale-95 transition-transform rotate-180">
                  <Image src="/assets/svgs/arrow.svg" alt="Próximos mundos" width={50} height={28} />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <CriarCampanhaModal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <EntrarCampanhaModal open={isJoinOpen} onClose={() => setIsJoinOpen(false)} />
    </>
  );
}
