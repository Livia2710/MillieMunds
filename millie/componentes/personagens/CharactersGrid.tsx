"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import { Search } from "lucide-react";
import type { Character, CharacterCategory, CharacterRank } from "@/lib/types/character";
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

// Configuração de paginação (6 itens por tela = 2 linhas de 3 no desktop)
const ITEMS_PER_PAGE = 6;

export default function CharactersGrid({
  characters,
  isMaster,
}: CharactersGridProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("todos");
  const [rank, setRank] = useState<RankFilter>("todos");
  const [year, setYear] = useState<YearFilter>("todos");
  
  // Estado para a paginação
  const [currentPage, setCurrentPage] = useState(1);

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

  // Reseta a paginação de volta para a primeira página sempre que um filtro ou busca for modificado
  useEffect(() => {
    setCurrentPage(1);
  }, [search, category, rank, year]);

  // Cálculos matemáticos dos limites da paginação
  const totalPages = Math.ceil(filteredCharacters.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  
  // Array final fatiado contendo no máximo 6 personagens
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

  return (
    <main className="grid min-h-screen grid-cols-[220px_1fr] bg-roxo-escuro text-bege-escuro font-body">

      <CharacterFilters
        category={category}
        setCategory={setCategory}
        rank={rank}
        setRank={setRank}
        year={year}
        setYear={setYear}
      />

      <section className="flex flex-col justify-between px-12 py-16">
        
        <div>
          <div className="mb-10 flex items-end justify-between gap-8">
            <div>
              <h1 className="font-title text-6xl uppercase tracking-[0.08em] text-bege-medio">
                {categoryTitles[category]}
              </h1>
              
              <Image
                src="/assets/svgs/divider.svg"
                alt=""
                width={360}
                height={28}
                className="mt-4 max-w-[80%]"
              />

              <p className="mt-4 text-2xl font-title text-bege-claro">
                {getSubtext()}
              </p>
            </div>

            <div className="relative w-full max-w-md">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-bege-escuro/60 pointer-events-none" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar..."
                className="h-14 w-full border border-bege-escuro/40 bg-transparent pl-12 pr-5 text-lg text-bege-claro outline-none placeholder:font-title placeholder:text-bege-medio/55 tracking-wider"
              />
            </div>
          </div>

          <hr className="mb-10 border-t border-bege-escuro/40" />

          {paginatedCharacters.length > 0 ? (
            // Alterado: w-full e lg:grid-cols-3 força exatamente duas linhas de 3 itens no desktop
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {paginatedCharacters.map((character) => (
                <CharacterCard key={character.id} character={character} />
              ))}
            </div>
          ) : (
            <p className="mt-20 text-center text-xl text-bege-medio/70 font-title tracking-wide">
              Nenhum personagem encontrado.
            </p>
          )}
        </div>

        {/* CONTROLES DE PAGINAÇÃO (Exibidos apenas se houver mais de uma página ativa) */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-6 font-title text-lg tracking-wider">
            {/* Seta da Esquerda (Voltar) */}
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="group flex h-10 w-10 items-center justify-center rounded border border-bege-escuro/30 transition-all hover:border-bege-medio disabled:opacity-20 disabled:hover:border-bege-escuro/30"
              title="Página Anterior"
            >
              <Image 
                src="/assets/svgs/arrow.svg" 
                alt="Voltar" 
                width={16} 
                height={16} 
                className=" transition-transform group-hover:-translate-x-0.5" 
              />
            </button>

            {/* Indicador de Páginas Medieval */}
            <span className="text-bege-medio">
              PÁGINA <span className="text-bege-claro text-xl">{currentPage}</span> DE <span className="text-bege-claro text-xl">{totalPages}</span>
            </span>

            {/* Seta da Direita (Avançar) */}
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="group flex h-10 w-10 items-center justify-center rounded border border-bege-escuro/30 transition-all hover:border-bege-medio disabled:opacity-20 disabled:hover:border-bege-escuro/30"
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
