"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type {
  Character,
  CharacterCategory,
  CharacterRank,
} from "@/lib/types/character";
import CharacterCard from "./CharacterCard";
import CharacterFilters from "./CharacterFilters";

export type CategoryFilter = "todos" | CharacterCategory;
export type RankFilter = "todos" | CharacterRank;
export type YearFilter = "todos" | 1 | 2 | 3 | 4 | 5;

type CharactersGridProps = {
  characters: Character[];
  isMaster: boolean;
};

const categoryTitles: Record<CategoryFilter, string> = {
  todos: "Personagens",
  aluno: "Alunos",
  professor: "Professores",
  npc: "NPCs",
  monstro: "Monstros",
};

const ITEMS_PER_PAGE = 6;

export default function CharactersGrid({
  characters,
  isMaster,
}: CharactersGridProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("todos");
  const [rank, setRank] = useState<RankFilter>("todos");
  const [year, setYear] = useState<YearFilter>("todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const filteredCharacters = useMemo(() => {
    return characters.filter((character) => {
      const matchesSearch = character.name
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesCategory =
        category === "todos" || character.category === category;

      const matchesRank = rank === "todos" || character.rank === rank;

      const matchesYear =
        year === "todos" ||
        (character.category === "aluno" && character.year === year);

      return matchesSearch && matchesCategory && matchesRank && matchesYear;
    });
  }, [characters, search, category, rank, year]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, category, rank, year]);

  useEffect(() => {
    document.body.style.overflow = isMobileFiltersOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileFiltersOpen]);

  const totalPages = Math.ceil(filteredCharacters.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const pageNumbers = useMemo(() => {
  return Array.from({ length: totalPages }, (_, index) => index + 1);
}, [totalPages]);

const renderMobilePagination = () => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex w-full justify-center overflow-x-auto px-1 md:hidden">
      <div className="flex items-center gap-2">
        {pageNumbers.map((page) => {
          const isActive = currentPage === page;

          return (
            <button
              key={page}
              type="button"
              onClick={() => setCurrentPage(page)}
              className={`flex h-7 w-7 items-center justify-center border font-title text-xs transition-all ${
                isActive
                  ? "border-bege-claro bg-bege-claro text-roxo-escuro"
                  : "border-bege-escuro/40 text-bege-medio"
              }`}
              aria-label={`Ir para página ${page}`}
            >
              {page}
            </button>
          );
        })}
      </div>
    </div>
  );
};

  const paginatedCharacters = useMemo(() => {
    return filteredCharacters.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredCharacters, startIndex]);

  const getSubtext = () => {
    if (isMaster) return "Todos os registros da campanha";

    const subtexts: Record<CategoryFilter, string> = {
      todos: "Conteúdos desbloqueados da campanha",
      aluno: "Estudantes da Escola Millie Munds",
      professor: "Corpo docente e mentores da instituição",
      npc: "Habitantes e figuras notáveis do mundo",
      monstro: "Criaturas e ameaças catalogadas",
    };

    return subtexts[category];
  };

  const filtersProps = {
    category,
    setCategory,
    rank,
    setRank,
    year,
    setYear,
  };

  return (
    <main className="min-h-screen bg-roxo-escuro text-bege-escuro font-body md:grid md:grid-cols-[220px_1fr]">
      <div className="hidden md:block">
        <CharacterFilters {...filtersProps} />
      </div>

      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 md:hidden">
          <aside className="absolute bottom-0 left-0 right-0 max-h-[82vh] overflow-y-auto border-t border-bege-escuro/40 bg-roxo-escuro px-6 py-7 shadow-header">
            <div className="mb-5 flex items-center justify-between border-b border-bege-escuro/30 pb-4">
              <h2 className="font-title text-xl uppercase tracking-[0.16em] text-bege-medio">
                Filtros
              </h2>

              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(false)}
                className="flex h-9 w-9 items-center justify-center text-bege-medio"
                aria-label="Fechar filtros"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <CharacterFilters {...filtersProps} />
          </aside>
        </div>
      )}

      <section className="flex min-h-screen flex-col justify-between px-4 py-9 sm:px-6 md:px-12 md:py-16">
        <div>
          <div className="mb-6 flex flex-col gap-5 md:mb-10 md:flex-row md:items-end md:justify-between md:gap-8">
            <div>
              <h1 className="font-title text-4xl uppercase tracking-[0.08em] text-bege-medio sm:text-5xl md:text-6xl">
                {categoryTitles[category]}
              </h1>

              <Image
                src="/assets/svgs/divider.svg"
                alt=""
                width={360}
                height={28}
                className="mt-3 max-w-[220px] sm:max-w-[300px] md:mt-4 md:max-w-[80%]"
              />

              <p className="mt-3 font-title text-lg text-bege-claro sm:text-xl md:mt-4 md:text-2xl">
                {getSubtext()}
              </p>
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-3 md:block md:w-full md:max-w-md">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-bege-escuro/60 md:h-5 md:w-5" />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar..."
                  className="h-11 w-full border border-bege-escuro/40 bg-transparent pl-11 pr-4 text-base tracking-wider text-bege-claro outline-none placeholder:font-title placeholder:text-bege-medio/55 md:h-14 md:pl-12 md:pr-5 md:text-lg"
                />
              </div>

              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(true)}
                className="flex h-11 items-center justify-center gap-2 border border-bege-escuro/40 px-4 font-title text-sm uppercase tracking-[0.12em] text-bege-medio md:hidden"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filtros
              </button>
            </div>
          </div>

          <hr className="mb-6 border-t border-bege-escuro/40 md:mb-10" />

          <div className="mb-5">{renderMobilePagination()}</div>

          {paginatedCharacters.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
              {paginatedCharacters.map((character) => (
                <CharacterCard key={character.id} character={character} />
              ))}
            </div>
          ) : (
            <p className="mt-16 text-center font-title text-lg tracking-wide text-bege-medio/70 md:mt-20 md:text-xl">
              Nenhum personagem encontrado.
            </p>
          )}
        </div>
        <div className="mt-6">{renderMobilePagination()}</div>

        {totalPages > 1 && (
          <div className="mt-12 hidden items-center justify-center gap-6 font-title text-lg tracking-wider md:flex">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="group flex h-9 w-9 items-center justify-center rounded border border-bege-escuro/30 transition-all hover:border-bege-medio disabled:opacity-20 disabled:hover:border-bege-escuro/30 md:h-10 md:w-10"
              title="Página Anterior"
            >
              <Image
                src="/assets/svgs/arrow.svg"
                alt="Voltar"
                width={16}
                height={16}
                className="transition-transform group-hover:-translate-x-0.5"
              />
            </button>

            <span className="text-bege-medio md:hidden">
              <span className="text-base text-bege-claro">{currentPage}</span>
              {" / "}
              <span className="text-base text-bege-claro">{totalPages}</span>
            </span>

            <span className="hidden text-bege-medio md:inline">
              PÁGINA{" "}
              <span className="text-xl text-bege-claro">{currentPage}</span> DE{" "}
              <span className="text-xl text-bege-claro">{totalPages}</span>
            </span>

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="group flex h-9 w-9 items-center justify-center rounded border border-bege-escuro/30 transition-all hover:border-bege-medio disabled:opacity-20 disabled:hover:border-bege-escuro/30 md:h-10 md:w-10"
              title="Próxima Página"
            >
              <Image
                src="/assets/svgs/arrow.svg"
                alt="Avançar"
                width={16}
                height={16}
                className="rotate-180 transition-transform group-hover:translate-x-0.5"
              />
            </button>
          </div>
        )}
      </section>
    </main>
  );
}