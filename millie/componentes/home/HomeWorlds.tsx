"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { WorldCard } from "./WorldCard";
import NoCampaign from "@/componentes/NoCampaign";
import CriarCampanhaModal from "@/componentes/modais/CriarCampanhaModal";
import EntrarCampanhaModal from "@/componentes/modais/EntrarCampanhaModal";
import { deleteWorld, unlockWorld } from "@/app/actions/world";
import { useRouter } from "next/navigation";
import ConfirmModal from "@/componentes/modais/ConfirmModal";
import EditarMundoModal from "@/componentes/modais/EditarMundoModal"; 
import { Trash2, Pencil } from "lucide-react";

type World = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  coverColor: string | null;
  isLocked: boolean;
  chapters: { id: string; title: string; content: string }[];
};

type Props = {
  worlds: World[];
  isMaster: boolean;
  hasCampaign: boolean;
};

export function HomeWorlds({ worlds, isMaster, hasCampaign }: Props) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [worldToUnlock, setWorldToUnlock] = useState<{ id: string; name: string } | null>(null);
  const [worldToEdit, setWorldToEdit] = useState<World | null>(null);  
  const [worldToDelete, setWorldToDelete] = useState<{ id: string; name: string } | null>(null);

function handleDelete(worldId: string) {
  startTransition(async () => {
    await deleteWorld(worldId);
    router.refresh();
  });
}
  function scrollWorlds(direction: "left" | "right") {
    if (!carouselRef.current) return;
    const firstItem = carouselRef.current.firstElementChild as HTMLElement;
    const scrollAmount = firstItem ? firstItem.offsetWidth + 32 : 280;
    carouselRef.current.scrollBy({
      left: direction === "right" ? scrollAmount : -scrollAmount,
      behavior: "smooth",
    });
  }

  function handleUnlock(worldId: string) {
    startTransition(async () => {
      await unlockWorld(worldId);
      router.refresh();
    });
  }

  const visibleWorlds = isMaster
    ? worlds
    : worlds.filter((w) => !w.isLocked);

  return (
    <>
      <section className="relative mt-5 min-h-130 overflow-hidden rounded-[10px] bg-roxo-escuro px-6 py-10 text-bege-escuro shadow-header md:mt-10 md:px-16 md:py-14">
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
            <div className="relative mt-10 flex w-full flex-col items-center justify-start lg:flex-row lg:justify-center md:mt-16">
              <button type="button" onClick={() => scrollWorlds("left")} className="absolute left-0 z-20 hidden cursor-pointer transition hover:brightness-125 lg:block">
                <Image src="/assets/svgs/arrow.svg" alt="Mundos anteriores" width={70} height={38} />
              </button>

              <div ref={carouselRef} className="flex w-full snap-x snap-mandatory gap-8 overflow-x-auto scroll-smooth px-0 pb-4 scrollbar-none [&::-webkit-scrollbar]:hidden md:gap-10 lg:max-w-190">
                {visibleWorlds.length === 0 && (
                  <p className="w-full text-center font-title text-bege-escuro/50 uppercase tracking-widest text-sm">
                    Nenhum mundo disponível ainda.
                  </p>
                )}
                {visibleWorlds.map((world) => (
                  <div key={world.id} className="shrink-0 basis-full snap-center sm:basis-[44%] md:basis-[30%]">
                   {world.isLocked ? (
                      <div className="relative group">
                        <WorldCard
                          name={world.name}
                          description={world.description ?? ""}
                          image={world.coverImage ?? undefined}
                          coverColor={world.coverColor ?? undefined}
                          isLocked
                          forceReveal={isMaster}
                        />
                        {isMaster && (
                          <>
                            <button
                              onClick={() => handleUnlock(world.id)}
                              disabled={isPending}
                              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-title text-sm text-bege-claro border border-bege-escuro uppercase tracking-wider"
                            >
                              Liberar para Jogadores
                            </button>
                            {/* ADICIONAR — editar/excluir */}
                            <div className="absolute left-2.5 top-2.5 z-30 flex gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setWorldToEdit(world); }}
                                className="flex h-7 w-7 items-center justify-center rounded-full border border-bege-escuro/40 bg-roxo-escuro/70 hover:border-bege-medio"
                                aria-label="Editar mundo"
                              >
                                <Pencil size={12} strokeWidth={1.5} className="text-bege-escuro" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setWorldToDelete({ id: world.id, name: world.name }); }}
                                className="flex h-7 w-7 items-center justify-center rounded-full border border-red-500/40 bg-roxo-escuro/70 hover:border-red-400"
                                aria-label="Excluir mundo"
                              >
                                <Trash2 size={12} strokeWidth={1.5} className="text-red-400" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="relative group">
                         <Link href={`/mundos/${world.slug}`} className="block w-full h-full">
                          <WorldCard
                            name={world.name}
                            description={world.description ?? ""}
                            image={world.coverImage ?? undefined}
                            coverColor={world.coverColor ?? undefined}
                            isLocked={false}
                          />
                          </Link>
                          {isMaster && (
                          <div className="absolute left-2.5 top-2.5 z-30 flex gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setWorldToEdit(world); }}
                              className="flex h-7 w-7 items-center justify-center rounded-full border border-bege-escuro/40 bg-roxo-escuro/70 opacity-0 group-hover:opacity-100 transition-opacity hover:border-bege-medio"
                              aria-label="Editar mundo"
                            >
                              <Pencil size={12} strokeWidth={1.5} className="text-bege-escuro" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setWorldToDelete({ id: world.id, name: world.name }); }}
                              className="flex h-7 w-7 items-center justify-center rounded-full border border-red-500/40 bg-roxo-escuro/70 opacity-0 group-hover:opacity-100 transition-opacity hover:border-red-400"
                              aria-label="Excluir mundo"
                            >
                              <Trash2 size={12} strokeWidth={1.5} className="text-red-400" />
                            </button>
                          </div>
                        )}
                      </div>
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
      <ConfirmModal
        isOpen={!!worldToUnlock}
        onClose={() => setWorldToUnlock(null)}
        onConfirm={() => handleUnlock(worldToUnlock!.id)}
        title="Liberar Mundo"
        message={`Tem certeza que quer liberar "${worldToUnlock?.name}" para os jogadores? Essa ação não pode ser desfeita.`}
        confirmLabel="Liberar"
      />
      <EditarMundoModal isOpen={!!worldToEdit} onClose={() => setWorldToEdit(null)} world={worldToEdit} />
      <ConfirmModal
        isOpen={!!worldToDelete}
        onClose={() => setWorldToDelete(null)}
        onConfirm={() => handleDelete(worldToDelete!.id)}
        title="Excluir Mundo"
        message={`Tem certeza que quer excluir "${worldToDelete?.name}" permanentemente? Todos os capítulos serão perdidos e essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
      />
    </>
  );
}