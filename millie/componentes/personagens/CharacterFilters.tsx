import type { Dispatch, SetStateAction } from "react";
import type { CategoryFilter, RankFilter, YearFilter } from "./CharactersGrid";

type CharacterFiltersProps = {
  category: CategoryFilter;
  setCategory: Dispatch<SetStateAction<CategoryFilter>>;
  rank: RankFilter;
  setRank: Dispatch<SetStateAction<RankFilter>>;
  year: YearFilter;
  setYear: Dispatch<SetStateAction<YearFilter>>;
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

const buttonBaseClass = "flex w-full items-center gap-2 py-1 px-0.5 text-left uppercase border border-transparent rounded transition-all text-sm";

export default function CharacterFilters({
  category,
  setCategory,
  rank,
  setRank,
  year,
  setYear,
}: CharacterFiltersProps) {
  return (
    <aside className="border-r border-bege-escuro/25 px-4 py-10 w-60">
      
      {/* CATEGORIA */}
      <FilterGroup title="Categoria">
        {categories.map((item) => {
          const isSelected = category === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setCategory(item.value)}
              className={`${buttonBaseClass} ${
                isSelected
                  ? "bg-roxo" 
                  : "hover:border-bege-escuro/40"
              }`}
            >
              {/* Modificado: tamanho reduzido para h-6 w-6 */}
              <div className="flex h-6 w-6 items-center justify-center shrink-0">
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

      {/* ANO */}
      <FilterGroup title="Ano">
        {years.map((item) => {
          const isSelected = year === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setYear(isSelected ? "todos" : item.value)}
              className={`${buttonBaseClass} ${
                isSelected
                  ? "bg-roxo" 
                  : "hover:border-bege-escuro/40"
              }`}
            >
              {/* Modificado: tamanho reduzido para h-6 w-6 */}
              <div className="flex h-6 w-6 items-center justify-center shrink-0">
                <span
                  className={`h-3.5 w-3.5 border ${
                    isSelected
                      ? "border-bege-medio bg-bege-medio"
                      : "border-bege-escuro font-medium "
                  }`}
                />
              </div>
              <span className="tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </FilterGroup>

      {/* RANK */}
      <FilterGroup title="Rank">
        {ranks.map((item) => {
          const isSelected = rank === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setRank(isSelected ? "todos" : item.value)}
              className={`${buttonBaseClass} ${
                isSelected
                  ? "bg-roxo" 
                  : "hover:border-bege-escuro/40"
              }`}
            >

              <div className="flex h-6 w-6 items-center justify-center shrink-0">
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
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <h2 className="mb-2 border-b border-bege-escuro/20 pb-1.5 font-title text-base text-bege-claro uppercase tracking-[0.12em]">
        {title}
      </h2>
     
      <div className="flex flex-col gap-2 text-bege-medio">{children}</div>
    </div>
  );
}
