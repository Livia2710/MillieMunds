"use client";

import { useRef, useState } from "react"; 
import Image from "next/image";
import { getWorldPages, type World } from "@/lib/types/world";
import { MundoBook, type MundoBookHandle } from "./MundoBook";
import { MundoSummary } from "./MundoSummary";
import { Pencil } from "lucide-react";
import EditarMundoModal from "../modais/EditarMundoModal";

type MundoReaderProps = {
  world: World;
  isMaster: boolean;
};

export function MundoReader({ world, isMaster = false }: MundoReaderProps) {
  const desktopBookRef = useRef<MundoBookHandle | null>(null);
  const mobileBookRef = useRef<MundoBookHandle | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Criamos o estado para rastrear a página física atual do livro
  const [currentPage, setCurrentPage] = useState(0);

  // Função que o MundoBook vai disparar toda vez que uma página for virada
  function handleFlip(pageIndex: number) {
    setCurrentPage(pageIndex);
  }

  function handleSelectChapter(chapterIndex: number) {
    // 0 = capa
    // 1 = folha branca atrás da capa
    // 2 = introdução
    // 3 em diante = capítulos
    const firstPage = worldPages.findIndex((page) => page.chapterIndex === chapterIndex);
    if (firstPage >= 0) desktopBookRef.current?.pageFlip().flip(firstPage + 3);
  }

  // Calculamos em qual "folha aberta" (spread) o livro está baseado na página atual
  // Ex: página 0 ou 1 = spread 0 (Capa). Página 2 ou 3 = spread 1, etc.
  const worldPages = getWorldPages(world.chapters);
  const selectedPageIndex = currentPage - 3;
  const activeChapterIndex = currentPage < 3 ? -1 : worldPages[selectedPageIndex]?.chapterIndex ?? -1;

  return (
    <section className="relative min-h-180 overflow-hidden rounded-[10px] bg-roxo-escuro px-6 py-10 text-bege-escuro shadow-header md:px-10 md:py-8">
      <Image
        src="/assets/svgs/corner-left-top.svg"
        alt=""
        width={100}
        height={100}
        className="pointer-events-none absolute left-0 top-0 h-19 w-19 md:h-25 md:w-25"
      />

      <Image
        src="/assets/svgs/corner-right-top.svg"
        alt=""
        width={100}
        height={100}
        className="pointer-events-none absolute right-0 top-0 h-19 w-19 md:h-25 md:w-25"
      />

      <Image
        src="/assets/svgs/corner-left-bottom.svg"
        alt=""
        width={100}
        height={100}
        className="pointer-events-none absolute bottom-0 left-0 h-19 w-19 md:h-25 md:w-25"
      />

      <Image
        src="/assets/svgs/corner-right-bottom.svg"
        alt=""
        width={100}
        height={100}
        className="pointer-events-none absolute bottom-0 right-0 h-19 w-19 md:h-25 md:w-25"
      />

      {isMaster && (
        <button
          type="button"
          onClick={() => setIsEditOpen(true)}
          className="absolute right-6 top-6 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-bege-escuro/40 bg-roxo-escuro/80 hover:border-bege-medio md:right-10 md:top-8"
          aria-label="Editar mundo"
        >
          <Pencil size={14} strokeWidth={1.5} className="text-bege-escuro" />
        </button>
      )}

      {/* DESKTOP / TABLET */}
      <div className="relative z-10 hidden grid-cols-[220px_1fr] gap-10 md:grid">
        <MundoSummary
          chapters={world.chapters}
          onSelectChapter={handleSelectChapter}
          // Passamos o índice correto baseado no cálculo do spread
          // Se estiver na capa (spread 0), o activeChapterIndex será -1 (nenhum botão aceso)
          // Se estiver no primeiro capítulo (spread 2), acende o índice 0 do sumário (2 - 2)
          activeChapterIndex={activeChapterIndex} 
        />

        {/* Passamos o handleFlip para atualizar o estado do pai sempre que folhear */}
        <MundoBook ref={desktopBookRef} world={world} onFlip={handleFlip} />
      </div>

      {/* MOBILE */}
      <div className="relative z-10 md:hidden">
        <MundoBook ref={mobileBookRef} world={world} />
      </div>

      <EditarMundoModal
        key={`${world.id}-${isEditOpen}`}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        world={{
          id: world.id,
          name: world.name,
          description: world.description,
          coverColor: world.coverColor ?? null,
          coverImage: world.image ?? null,
          chapters: world.chapters.map((ch) => ({ title: ch.title, content: ch.content })),
        }}
      />
    </section>
  );
}
