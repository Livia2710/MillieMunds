"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { WorldCard } from "./WorldCard";

const worlds = [
  {
    id: 1,
    slug: "desconhecido",
    name: "Gaia",
    description: "Um mundo que não deveria existir.",
    image: "/mundos/mundo-1.png",
    isLocked: true,
  },
  {
    id: 2,
    slug: "dois",
    name: "Nome",
    description: "Breve descrição",
    image: "/mundos/mundo-1.png",
    isLocked: false,
  },
  {
    id: 3,
    slug: "tres",
    name: "Nome",
    description: "Breve descrição",
    image: "/mundos/mundo-2.png",
    isLocked: false,
  },
  {
    id: 4,
    slug: "quatro",
    name: "Aster",
    description: "Breve descrição",
    image: "/mundos/mundo-3.jpg",
    isLocked: false,
  },
];

export function HomeWorlds() {
  const carouselRef = useRef<HTMLDivElement>(null);

  function scrollWorlds(direction: "left" | "right") {
    if (!carouselRef.current) return;

    // 1. Tornou o cálculo dinâmico: ele pega a largura do primeiro card que encontrar para fazer o pulo perfeito
    const firstItem = carouselRef.current.firstElementChild as HTMLElement;
    const scrollAmount = firstItem ? firstItem.offsetWidth + 32 : 280;

    carouselRef.current.scrollBy({
      left: direction === "right" ? scrollAmount : -scrollAmount,
      behavior: "smooth",
    });
  }

  return (
    <section className="relative mt-5 min-h-130 overflow-hidden rounded-[10px] bg-roxo-escuro px-6 py-10 text-bege-escuro shadow-header md:mt-10 md:px-16 md:py-14">
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

      <div className="relative z-10 flex flex-col items-center text-center">
        <h2 className="font-title text-2xl uppercase tracking-[0.18em] md:text-4xl">
          Mundos Conhecidos
        </h2>

        <Image
          src="/assets/svgs/divider.svg"
          alt=""
          width={360}
          height={28}
          className="mt-4 max-w-[80%]"
        />

        {/* 2. Container geral flex-col para posicionar as setas abaixo do carrossel em telas pequenas */}
        <div className="relative mt-10 flex w-full flex-col items-center justify-start lg:flex-row lg:justify-center md:mt-16">
          
          {/* Seta Esquerda Desktop */}
          <button
            type="button"
            onClick={() => scrollWorlds("left")}
            className="absolute left-0 z-20 hidden cursor-pointer transition hover:brightness-125 lg:block"
          >
            <Image
              src="/assets/svgs/arrow.svg"
              alt="Mundos anteriores"
              width={70}
              height={38}
            />
          </button>

        {/* Carrossel ajustado para centralizar uma única carta por vez no mobile */}
                   <div
            ref={carouselRef}
            className="flex w-full snap-x snap-mandatory gap-8 overflow-x-auto scroll-smooth px-0 pb-4 scrollbar-none [&::-webkit-scrollbar]:hidden md:gap-10 lg:max-w-190"
          >
            {worlds.map((world) => (
              <div
                key={world.id}
                className="shrink-0 basis-full snap-center sm:basis-[44%] md:basis-[30%]"
              >
                {world.isLocked ? (
                  <WorldCard
                    name={world.name}
                    description={world.description}
                    image={world.image}
                    isLocked={world.isLocked}
                  />
                ) : (
                  /* Adicionado w-full e h-full no Link para garantir que a estrutura da carta não sofra distorção */
                  <Link href={`/mundos/${world.slug}`} className="block w-full h-full">
                    <WorldCard
                      name={world.name}
                      description={world.description}
                      image={world.image}
                      isLocked={world.isLocked}
                    />
                  </Link>
                )}
              </div>
            ))}
          </div>



          {/* Seta Direita Desktop */}
          <button
            type="button"
            onClick={() => scrollWorlds("right")}
            className="absolute right-0 z-20 hidden cursor-pointer transition hover:brightness-125 lg:block"
          >
            <Image
              src="/assets/svgs/arrow.svg"
              alt="Próximos mundos"
              width={70}
              height={38}
              className="rotate-180"
            />
          </button>

          {/* 3. CONTROLES MOBILE ADDED: Só aparecem em telas pequenas (escondem a partir de lg:) */}
          <div className="mt-6 flex items-center gap-10 lg:hidden">
            <button
              type="button"
              onClick={() => scrollWorlds("left")}
              className="p-2 cursor-pointer active:scale-95 transition-transform"
            >
              <Image
                src="/assets/svgs/arrow.svg"
                alt="Mundos anteriores"
                width={50}
                height={28}
              />
            </button>

            <button
              type="button"
              onClick={() => scrollWorlds("right")}
              className="p-2 cursor-pointer active:scale-95 transition-transform rotate-180"
            >
              <Image
                src="/assets/svgs/arrow.svg"
                alt="Próximos mundos"
                width={50}
                height={28}
              />
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}
