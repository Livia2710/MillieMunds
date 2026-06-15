"use client";

import { useRef } from "react";
import Image from "next/image";
import type { World } from "@/lib/types/world";
import { MundoBook } from "./MundoBook";
import { MundoSummary } from "./MundoSummary";

type MundoReaderProps = {
  world: World;
};

export function MundoReader({ world }: MundoReaderProps) {
  const desktopBookRef = useRef<any>(null);
  const mobileBookRef = useRef<any>(null);

  function handleSelectChapter(chapterIndex: number) {
    // 0 = capa
    // 1 = folha branca atrás da capa
    // 2 = introdução
    // 3 em diante = capítulos
    const pageIndex = chapterIndex + 3;

    desktopBookRef.current?.pageFlip().flip(pageIndex);
  }

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

      {/* DESKTOP / TABLET */}
      <div className="relative z-10 hidden grid-cols-[220px_1fr] gap-10 md:grid">
        <MundoSummary
          chapters={world.chapters}
          onSelectChapter={handleSelectChapter}
        />

        <MundoBook ref={desktopBookRef} world={world} />
      </div>

      {/* MOBILE */}
      <div className="relative z-10 md:hidden">
        <MundoBook ref={mobileBookRef} world={world} />
      </div>
    </section>
  );
}