"use client";

import { forwardRef, useRef, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { ChevronDown } from "lucide-react";

import { getWorldPages, type World } from "@/lib/types/world";

const HTMLFlipBook = dynamic(() => import("react-pageflip"), { ssr: false });

function getPageTextColor(hex: string) {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!match) return "#29251f"
  const channels = match[1].match(/.{2}/g)!.map((channel) => parseInt(channel, 16) / 255).map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
  const luminance = 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
  return luminance > 0.42 ? "#29251f" : "#f7f3e9"
}

export type MundoBookHandle = {
  pageFlip: () => { flipPrev: () => void; flipNext: () => void; flip: (page: number) => void; getCurrentPageIndex: () => number };
};

type MundoBookProps = {
  world: World;
  onFlip?: (pageIndex: number) => void;
};

export const MundoBook = forwardRef<MundoBookHandle, MundoBookProps>(
  function MundoBook({ world, onFlip }, ref) {
    const [currentPage, setCurrentPage] = useState(0);
    const [openMobileChapter, setOpenMobileChapter] = useState<string | null>(
      null
    );


    const isReturningToCover = useRef(false);
    const pages = getWorldPages(world.chapters);

    // capa + folha branca atrás da capa + introdução + capítulos + folha branca final
    const totalPages = pages.length + 4;
    const finalBlankPageIndex = totalPages - 1;

    const totalSpreads = Math.ceil((totalPages - 1) / 2);
    const currentSpread =
      currentPage === 0
        ? 0
        : Math.min(Math.ceil(currentPage / 2), totalSpreads);

    const getBook = () => {
      if (ref && typeof ref === "object" && ref.current) {
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

    const handleFlipEvent = (e: { data: number }) => {
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
    const pageColor = world.pageColor ?? "#f7f3e9";
    const pageTextColor = getPageTextColor(pageColor);

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
                    <div className="px-6 pb-6 text-base leading-relaxed text-justify font-body">
                      <div className="p-5" style={{ backgroundColor: pageColor, color: pageTextColor }}>
                        {world.pageHeader && <div className="mb-3 border-b border-[#9b8258]/30 pb-2 text-xs tracking-widest opacity-65">{world.pageHeader}</div>}
                        <div className="rich-world-content" dangerouslySetInnerHTML={{ __html: chapter.content }} />
                        {world.pageFooter && <div className="mt-3 border-t border-[#9b8258]/30 pt-2 text-right text-xs tracking-widest opacity-65">{world.pageFooter}</div>}
                      </div>
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
                <div className="pointer-events-none absolute inset-0 z-0" style={{ backgroundColor: coverColor }} />
                {world.image && <Image src={world.image} alt={`Capa de ${world.name}`} fill priority className="pointer-events-none z-[1] object-cover" />}

                {/* SOMBRA INTERNA E MOLDURA DA CAPA */}
                <div className="pointer-events-none absolute inset-0 z-[2] shadow-[inset_0_0_70px_rgba(0,0,0,0.55),inset_0_0_18px_rgba(209,186,142,0.08)]" />
                <div className="pointer-events-none absolute inset-4 z-[3] border border-bege-medio/20" />

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
                  className={`relative h-full border border-[#bfa77a]/35 ${world.pageTexture === false ? "" : "shadow-[inset_-20px_0_36px_rgba(86,45,14,0.08)]"}`}
                  data-density="hard"
                ><div className="absolute inset-0" style={{ backgroundColor: pageColor }} /></div>

                {/* INTRODUÇÃO */}
                <div className={`relative flex h-full flex-col justify-between overflow-hidden border border-[#bfa77a]/35 p-8 md:p-12 ${world.pageTexture === false ? "" : "shadow-[inset_0_0_36px_rgba(86,45,14,0.12)] before:pointer-events-none before:absolute before:inset-4 before:border before:border-bege-escuro/25 after:pointer-events-none after:absolute after:inset-0 after:bg-[linear-gradient(90deg,rgba(72,35,12,0.1),transparent_14%,transparent_86%,rgba(72,35,12,0.12))]"}`}>
                  <div className="pointer-events-none absolute inset-0 z-0" style={{ backgroundColor: pageColor }} />
                  <div className="relative z-10" style={{ color: pageTextColor }}>
                    <h1 className="font-title text-3xl uppercase tracking-widest md:text-4xl">
                      {world.name}
                    </h1>

                    <p className="mt-6 text-justify text-lg leading-relaxed opacity-90 md:text-xl">
                      {world.description}
                    </p>
                  </div>


                </div>

                {/* CAPÍTULOS */}
                {pages.map((page) => (
                  <div
                    key={page.key}
                    className={`relative flex h-full flex-col overflow-hidden border border-[#bfa77a]/35 p-8 md:p-12 ${world.pageTexture === false ? "" : "shadow-[inset_0_0_36px_rgba(86,45,14,0.12)] before:pointer-events-none before:absolute before:inset-4 before:border before:border-bege-escuro/25 after:pointer-events-none after:absolute after:inset-0 after:bg-[linear-gradient(90deg,rgba(72,35,12,0.1),transparent_14%,transparent_86%,rgba(72,35,12,0.12))]"}`}
                  >
                    <div className="pointer-events-none absolute inset-0 z-0" style={{ backgroundColor: pageColor }} />
                    <div className="relative z-10 flex h-full flex-col overflow-y-auto pr-1" style={{ color: pageTextColor }}>
                      {world.pageHeader && <div className="mb-4 border-b border-[#9b8258]/30 pb-2 text-xs tracking-widest opacity-65">{world.pageHeader}</div>}
                      <h2 className="font-title mb-8 border-b border-[#bfa77a]/20 pb-3 text-2xl uppercase tracking-widest md:text-3xl">
                        {page.title}
                      </h2>

                      <div className="rich-world-content flex-1 text-justify text-lg leading-relaxed opacity-95 md:text-xl" dangerouslySetInnerHTML={{ __html: page.content }} />
                      {world.pageFooter && <div className="mt-4 border-t border-[#9b8258]/30 pt-2 text-right text-xs tracking-widest opacity-65">{world.pageFooter}</div>}
                    </div>
                  </div>
                ))}

                {/* FOLHA BRANCA FINAL */}
                <div className={`relative h-full overflow-hidden border border-[#bfa77a]/35 ${world.pageTexture === false ? "" : "shadow-[inset_0_0_36px_rgba(86,45,14,0.12)] before:pointer-events-none before:absolute before:inset-4 before:border before:border-bege-escuro/25 after:pointer-events-none after:absolute after:inset-0 after:bg-[linear-gradient(90deg,rgba(72,35,12,0.1),transparent_14%,transparent_86%,rgba(72,35,12,0.12))]"}`}><div className="absolute inset-0" style={{ backgroundColor: pageColor }} /></div>
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
      <style jsx global>{`.rich-world-content [data-page-break]{display:none}.rich-world-content p{margin:0 0 1em}.rich-world-content ul,.rich-world-content ol{padding-left:1.4em}.rich-world-content img{max-width:100%;max-height:48vh;object-fit:contain}.rich-world-content img[data-align="left"]{margin:1em auto 1em 0}.rich-world-content img[data-align="center"]{margin:1em auto}.rich-world-content img[data-align="right"]{margin:1em 0 1em auto}.rich-world-content blockquote{border-left:2px solid #9b8258;padding-left:.8em;font-style:italic}`}</style>
      </div>
    );
  }
);

MundoBook.displayName = "MundoBook";




