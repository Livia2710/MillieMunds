import type { Dispatch, SetStateAction, ReactNode } from "react";
import type { CategoryFilter, RankFilter, YearFilter } from "./CharactersGrid";

type CharacterFiltersProps = {
  category: CategoryFilter;
  setCategory: Dispatch<SetStateAction<CategoryFilter>>;
  rank: RankFilter;
  setRank: Dispatch<SetStateAction<RankFilter>>;
  year: YearFilter;
  setYear: Dispatch<SetStateAction<YearFilter>>;
  variant?: "desktop" | "mobile";
};

const categories: { label: string; value: CategoryFilter }[] = [
  { label: "Todos", value: "todos" },
  { label: "Alunos", value: "aluno" },
  { label: "Professores", value: "professor" },
  { label: "NPC", value: "npc" },
  { label: "Monstros", value: "monstro" },
];

const years: { label: string; value: YearFilter }[] = [
  { label: "1 ano", value: 1 },
  { label: "2 ano", value: 2 },
  { label: "3 ano", value: 3 },
  { label: "4 ano", value: 4 },
  { label: "5 ano", value: 5 },
];

const ranks: { label: string; value: RankFilter }[] = [
  { label: "Rank S", value: "S" },
  { label: "Rank A", value: "A" },
  { label: "Rank B", value: "B" },
  { label: "Rank C", value: "C" },
  { label: "Rank D", value: "D" },
  { label: "Rank E", value: "E" },
  { label: "Rank V", value: "V" },
];

const rankCoatOfArms: Record<string, string> = {
  S: "/assets/svgs/S.svg",
  A: "/assets/svgs/A.svg",
  B: "/assets/svgs/B.svg",
  C: "/assets/svgs/C.svg",
  D: "/assets/svgs/D.svg",
  E: "/assets/svgs/E.svg",
  V: "/assets/svgs/V.svg",
};

const buttonBaseClass =
  "flex w-full items-center gap-2 border border-transparent px-0.5 py-1 text-left text-sm uppercase transition-all";

export default function CharacterFilters({
  category,
  setCategory,
  rank,
  setRank,
  year,
  setYear,
  variant = "desktop",
}: CharacterFiltersProps) {
  const isMobile = variant === "mobile";

  return (
    <aside
      className={
        isMobile
          ? "w-full"
          : "md:border-r md:border-bege-escuro/25 md:px-4 py-10"
      }
    >
      <FilterGroup title="Categoria" compact={isMobile}>
        {categories.map((item) => {
          const isSelected = category === item.value;

          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setCategory(item.value)}
              className={`${buttonBaseClass} ${
                isSelected ? "bg-roxo" : "hover:border-bege-escuro/40"
              }`}
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                <span
                  className={`h-3.5 w-3.5 rounded-full border ${
                    isSelected
                      ? "border-bege-medio bg-bege-medio"
                      : "border-bege-escuro"
                  }`}
                />
              </div>

              <span className="tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </FilterGroup>

      <FilterGroup title="Ano" compact={isMobile}>
        {years.map((item) => {
          const isSelected = year === item.value;

          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setYear(isSelected ? "todos" : item.value)}
              className={`${buttonBaseClass} ${
                isSelected ? "bg-roxo" : "hover:border-bege-escuro/40"
              }`}
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                <span
                  className={`h-3.5 w-3.5 border ${
                    isSelected
                      ? "border-bege-medio bg-bege-medio"
                      : "border-bege-escuro"
                  }`}
                />
              </div>

              <span className="tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </FilterGroup>

      <FilterGroup title="Rank" compact={isMobile}>
        {ranks.map((item) => {
          const isSelected = rank === item.value;

          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setRank(isSelected ? "todos" : item.value)}
              className={`${buttonBaseClass} ${
                isSelected ? "bg-roxo" : "hover:border-bege-escuro/40"
              }`}
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                <img
                  src={rankCoatOfArms[item.value]}
                  alt={`Brasão ${item.label}`}
                  className="h-full w-full object-contain"
                />
              </div>

              <span className="tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </FilterGroup>
    </aside>
  );
}

function FilterGroup({
  title,
  children,
  compact = false,
}: {
  title: string;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "mb-5" : "mb-6"}>
      <h2 className="mb-2 border-b border-bege-escuro/20 pb-1.5 font-title text-base uppercase tracking-[0.12em] text-bege-claro">
        {title}
      </h2>

      <div
        className={
          compact
            ? "grid grid-cols-2 gap-2 text-bege-medio"
            : "flex flex-col gap-2 text-bege-medio"
        }
      >
        {children}
      </div>
    </div>
  );
}