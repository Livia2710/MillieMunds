import type { Dispatch, SetStateAction, ReactNode } from "react";
import Image from "next/image";
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
  S: "/assets/svgs/rank/S.svg",
  A: "/assets/svgs/rank/A.svg",
  B: "/assets/svgs/rank/B.svg",
  C: "/assets/svgs/rank/C.svg",
  D: "/assets/svgs/rank/D.svg",
  E: "/assets/svgs/rank/E.svg",
  V: "/assets/svgs/rank/V.svg",
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
    <aside data-frame="simple" className={`relative isolate overflow-hidden border border-bege-medio/45 bg-[radial-gradient(ellipse_at_50%_0%,rgba(113,74,128,.18),transparent_48%),linear-gradient(155deg,#2b1c34,#1a0f22_60%,#130b19)] p-5 shadow-[0_0_24px_rgba(209,186,142,.06)] ${isMobile ? "w-full" : "h-fit md:sticky md:top-24"}`}>
      <Image src="/assets/svgs/corner-left-top.svg" alt="" width={100} height={100} className="pointer-events-none absolute left-0 top-0 h-14 w-14 opacity-55" />
      <Image src="/assets/svgs/corner-right-top.svg" alt="" width={100} height={100} className="pointer-events-none absolute right-0 top-0 h-14 w-14 opacity-55" />
      <div className="relative z-10 space-y-6">
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
      </div>
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
      <h2 className="mb-3 flex items-center gap-2 font-title text-sm uppercase tracking-[0.16em] text-bege-medio">
        <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-transparent to-bege-medio/40" />
        <span aria-hidden="true" className="text-[9px]">✦</span>{title}<span aria-hidden="true" className="text-[9px]">✦</span>
        <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-l from-transparent to-bege-medio/40" />
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
