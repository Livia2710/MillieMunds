"use client";

import { forwardRef, useRef, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { ChevronDown } from "lucide-react";

import type { World } from "@/lib/types/world";
import { DEFAULT_WORLD_COVER_COLOR } from "@/lib/types/world";

const HTMLFlipBook = dynamic(() => import("react-pageflip"), { ssr: false });

type MundoBookProps = {
  world: World;
  onFlip?: (pageIndex: number) => void;
};

export const MundoBook = forwardRef<any, MundoBookProps>(
  function MundoBook({ world, onFlip }, ref) {
    const [currentPage, setCurrentPage] = useState(0);
    const [openMobileChapter, setOpenMobileChapter] = useState<string | null>(
      null
    );


    const isReturningToCover = useRef(false);

    // capa + folha branca atrás da capa + introdução + capítulos + folha branca final
    const totalPages = world.chapters.length + 4;
    const finalBlankPageIndex = totalPages - 1;

    const totalSpreads = Math.ceil((totalPages - 1) / 2);
    const currentSpread =
      currentPage === 0
        ? 0
        : Math.min(Math.ceil(currentPage / 2), totalSpreads);

    const getBook = () => {
      if (ref && "current" in ref && ref.current) {
        return ref.current.pageFlip();
      }

      return null;
    };

    const animateBackToCover = () => {
      const book = getBook();

      if (!book || isReturningToCover.current) return;

      isReturningToCover.current = true;

      const interval = window.setInterval(() => {
        const currentIndex = book.getCurrentPageIndex?.() ?? 0;

        if (currentIndex <= 0) {
          window.clearInterval(interval);
          isReturningToCover.current = false;
          setCurrentPage(0);
          onFlip?.(0);
          return;
        }

        book.flipPrev();
      }, 560);
    };

    const handleFlipEvent = (e: any) => {
      const pageIndex = e.data;

      setCurrentPage(pageIndex);
      onFlip?.(pageIndex);

      if (pageIndex === finalBlankPageIndex) {
        window.setTimeout(animateBackToCover, 700);
      }
    };

    const handlePrev = () => {
      if (isReturningToCover.current) return;
      getBook()?.flipPrev();
    };

    const handleNext = () => {
      if (isReturningToCover.current) return;
      getBook()?.flipNext();
    };

    const coverColor = world.coverColor ?? "#2a1307";

    return (
      <div className="flex h-full min-h-[680px] w-full select-none flex-col items-center justify-center">
                {/* MOBILE */}
        <div className="flex w-full flex-col items-center px-6 pb-10 md:hidden">
          <h1 className="font-title mt-8 text-center text-4xl uppercase tracking-[0.18em] text-bege-escuro">
            Mundo
          </h1>

          <p className="font-title mt-4 text-center text-xl text-bege-claro">
            {world.name}
          </p>

          {world.image && (
            <div className="relative mt-5 h-50 w-full max-w-[320px] overflow-hidden rounded-sm shadow-md border border-bege-escuro/20">
              <Image
                src={world.image}
                alt={world.name}
                fill
                className="object-cover sepia-[0.15]"
                priority
              />
            </div>
          )}

          {/* CONTAINER DOS CAPÍTULOS ACORDION */}
          <div className="mt-12 w-full max-w-[340px] border border-bege-escuro/40 rounded-sm overflow-hidden bg-black/5">
            {world.chapters.map((chapter) => {
              const isOpen = openMobileChapter === chapter.id;

              return (
                <div
                  key={chapter.id}
                  className={`border-b border-bege-escuro/35 last:border-b-0 transition-colors duration-300 ${
                    isOpen ? "bg-black/20" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOpenMobileChapter(isOpen ? null : chapter.id)
                    }
                    className={`font-title flex min-h-16 w-full items-center justify-between px-6 py-3 text-left text-base tracking-widest transition-colors ${
                      isOpen ? "text-bege-claro font-bold" : "text-bege-escuro"
                    }`}
                  >
                    <span className="max-w-[85%] break-words">{chapter.title}</span>

                    {/* ÍCONE DO LUCIDE COM ANIMAÇÃO DE ROTAÇÃO */}
                    <ChevronDown
                      size={18}
                      className={`transform transition-transform duration-300 shrink-0 ${
                        isOpen ? "rotate-180 text-bege-claro" : "text-bege-escuro/70"
                      }`}
                    />
                  </button>

                  {/* CONTEÚDO DO CAPÍTULO - OTIMIZADO PARA LEITURA CONFORTÁVEL */}
                  {isOpen && (
                    <div className="px-6 pb-6 text-base leading-relaxed text-justify text-bege-claro/90 font-body">
                      {chapter.content}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>


        {/* DESKTOP / TABLET */}
        <div className="relative hidden w-full items-center justify-center overflow-visible px-2 md:flex md:px-6">
          <div className="relative flex min-h-[780px] w-full max-w-[1180px] items-center justify-center">
           
             {/* Eu quero apagar essa div, mas sempre que apago da erro */}
            <div className="relative z-10 w-full max-w-[1100px] overflow-visible rounded-[4px] p-1">
              <HTMLFlipBook
                ref={ref}
                width={540}
                height={660}
                size="stretch"
                minWidth={330}
                maxWidth={1180}
                minHeight={430}
                maxHeight={820}
                showCover={true}
                onFlip={handleFlipEvent}
                startPage={0}
                style={{
                  margin: "0 auto",
                  transform:
                    currentPage === 0 ? "translateX(-25%)" : "translateX(0)",
                  transition: "transform 500ms ease",
                }}
                className="book-pages-container"
                startZIndex={10}
                drawShadow={true}
                maxShadowOpacity={0.65}
                showPageCorners={false}
                flippingTime={900}
                usePortrait={false}
                autoSize={true}
                useMouseEvents={true}
                mobileScrollSupport={true}
                clickEventForward={true}
                swipeDistance={30}
                disableFlipByClick={false}
              >
              {/* CAPA */}
                <div
                className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden border border-black/40 p-12 text-center text-bege-claro shadow-[inset_0_0_50px_rgba(0,0,0,0.85)]"
                data-density="hard"
                >
                {/* COR REAL DA CAPA */}
                <div
                    className="absolute inset-0 z-0"
                    style={{ backgroundColor: coverColor }}
                />

                {/* SOMBRA INTERNA DA CAPA */}
                <div className="pointer-events-none absolute inset-0 z-[1] shadow-[inset_0_0_70px_rgba(0,0,0,0.55),inset_0_0_18px_rgba(209,186,142,0.08)]" />

                <div className="pointer-events-none absolute inset-4 z-[2] border border-bege-medio/20" />

                <div className="relative z-10 flex flex-col items-center">
                    <h1 className="mt-5 font-title text-4xl uppercase tracking-widest text-bege-medio drop-shadow-md">
                    {world.name}
                    </h1>

                    <div className="relative mx-auto my-6 flex h-6 w-full max-w-[180px] items-center justify-center">
                    <Image
                        src="/assets/svgs/divider.svg"
                        alt="Divisor"
                        fill
                        className="object-contain opacity-80"
                    />
                    </div>

                    <p className="font-title text-sm uppercase tracking-[0.2em] text-bege-escuro opacity-60">
                    {world.description}
                    </p>
                </div>
                </div>


                {/* FOLHA BRANCA ATRÁS DA CAPA */}
                <div
                  className="h-full border-r border-black/[0.04] bg-bege-claro shadow-[inset_-20px_0_36px_rgba(86,45,14,0.08)]"
                  data-density="hard"
                />

                {/* INTRODUÇÃO */}
                <div className="relative flex h-full flex-col justify-between overflow-hidden border-r border-black/[0.06] bg-bege-claro p-8 text-[#2a1307] shadow-[inset_0_0_36px_rgba(86,45,14,0.12)] before:pointer-events-none before:absolute before:inset-4 before:border before:border-bege-escuro/25 after:pointer-events-none after:absolute after:inset-0 after:bg-[linear-gradient(90deg,rgba(72,35,12,0.1),transparent_14%,transparent_86%,rgba(72,35,12,0.12))] md:p-12">
                  <div className="relative z-10">
                    <h1 className="font-title text-3xl uppercase tracking-widest md:text-4xl">
                      {world.name}
                    </h1>

                    <p className="mt-6 text-justify text-lg leading-relaxed opacity-90 md:text-xl">
                      {world.description}
                    </p>
                  </div>

                  {world.image && (
                    <div className="relative z-10 mt-6 h-56 w-full overflow-hidden rounded-sm border border-[#bfa77a]/30 shadow-sm md:h-64">
                      <Image
                        src={world.image}
                        alt={world.name}
                        fill
                        className="object-cover sepia-[0.15]"
                      />
                    </div>
                  )}
                </div>

                {/* CAPÍTULOS */}
                {world.chapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    className="relative flex h-full flex-col overflow-hidden border-r border-black/[0.06] bg-bege-claro p-8 text-[#2a1307] shadow-[inset_0_0_36px_rgba(86,45,14,0.12)] before:pointer-events-none before:absolute before:inset-4 before:border before:border-bege-escuro/25 after:pointer-events-none after:absolute after:inset-0 after:bg-[linear-gradient(90deg,rgba(72,35,12,0.1),transparent_14%,transparent_86%,rgba(72,35,12,0.12))] md:p-12"
                  >
                    <div className="relative z-10">
                      <h2 className="font-title mb-8 border-b border-[#bfa77a]/20 pb-3 text-2xl uppercase tracking-widest md:text-3xl">
                        {chapter.title}
                      </h2>

                      <p className="text-justify text-lg leading-relaxed opacity-95 md:text-xl">
                        {chapter.content}
                      </p>
                    </div>
                  </div>
                ))}

                {/* FOLHA BRANCA FINAL */}
                <div className="relative h-full overflow-hidden border-r border-black/[0.06] bg-bege-claro shadow-[inset_0_0_36px_rgba(86,45,14,0.12)] before:pointer-events-none before:absolute before:inset-4 before:border before:border-bege-escuro/25 after:pointer-events-none after:absolute after:inset-0 after:bg-[linear-gradient(90deg,rgba(72,35,12,0.1),transparent_14%,transparent_86%,rgba(72,35,12,0.12))]" />
              </HTMLFlipBook>
            </div>
          </div>
        </div>

        {/* CONTROLES DESKTOP */}
        <div className="font-title mt-8 hidden w-full max-w-[500px] items-center justify-center px-5 py-3 text-sm tracking-widest text-bege-escuro md:mt-10 md:flex md:gap-10 md:px-6">
          <button
            onClick={handlePrev}
            disabled={currentPage === 0 || isReturningToCover.current}
            className="uppercase transition-colors hover:bg-roxo disabled:pointer-events-none disabled:opacity-20 gap-6 border border-[#bfa77a]/20 bg-black/10 px-5 py-2.5 whitespace-nowrap "
          >
            Capítulo Anterior
          </button>

  
          <span className="min-w-16 text-center tabular-nums text-bege-claro opacity-80">
            {currentPage === 0
              ? "Capa"
              : currentPage === finalBlankPageIndex
                ? "Fim"
                : `${currentSpread} / ${totalSpreads}`}
          </span>


          <button
            onClick={handleNext}
            disabled={
              currentPage >= finalBlankPageIndex || isReturningToCover.current
            }
            className="uppercase transition-colors hover:bg-roxo disabled:pointer-events-none disabled:opacity-20 border border-[#bfa77a]/20 bg-black/10 px-5 py-2.5 whitespace-nowrap "
          >
            Próximo Capítulo
          </button>
        </div>
      </div>
    );
  }
);

MundoBook.displayName = "MundoBook";