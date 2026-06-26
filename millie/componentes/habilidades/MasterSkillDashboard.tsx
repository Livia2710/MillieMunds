"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Search, ArrowLeft } from "lucide-react";
import type { ProfileCharacter } from "@/lib/types/profile";
import type { CharacterElement, CharacterRank, CharacterCategory } from "@/lib/types/character";
import { ELEMENT_META } from "@/lib/types/skill";
import { SkillTree } from "./SkillTree";
import { getSkillTreeByRace } from "@/lib/mocks/skills";

type Tab = "jogadores" | "personagens";

type Filters = {
  search: string;
  element: CharacterElement | "todos";
  rank: CharacterRank | "todos";
  category: CharacterCategory | "todos";
};

const RANKS: (CharacterRank | "todos")[] = ["todos", "S", "A", "B", "C", "D", "E", "V"];
const ELEMENTS: (CharacterElement | "todos")[] = ["todos", "fogo", "agua", "terra", "vento", "luz", "trevas"];
const CATEGORIES: { value: CharacterCategory | "todos"; label: string }[] = [
  { value: "todos",     label: "Todos" },
  { value: "aluno",     label: "Aluno" },
  { value: "professor", label: "Professor" },
  { value: "npc",       label: "NPC" },
  { value: "monstro",   label: "Monstro" },
];

const rankCoatOfArms: Record<string, string> = {
  S: "/assets/svgs/S.svg", A: "/assets/svgs/A.svg", B: "/assets/svgs/B.svg",
  C: "/assets/svgs/C.svg", D: "/assets/svgs/D.svg", E: "/assets/svgs/E.svg",
  V: "/assets/svgs/V.svg",
};

type MasterSkillDashboardProps = {
  characters: ProfileCharacter[];
};

export default function MasterSkillDashboard({ characters }: MasterSkillDashboardProps) {
  const [activeTab, setActiveTab]             = useState<Tab>("jogadores");
  const [selectedChar, setSelectedChar]       = useState<ProfileCharacter | null>(null);
  const [filters, setFilters]                 = useState<Filters>({
    search: "", element: "todos", rank: "todos", category: "todos",
  });

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const filtered = useMemo(() => {
    return characters.filter((char) => {
      const matchSearch   = char.name.toLowerCase().includes(filters.search.toLowerCase());
      const matchElement  = filters.element  === "todos" || char.element  === filters.element;
      const matchRank     = filters.rank     === "todos" || char.rank     === filters.rank;
      const matchCategory = filters.category === "todos" || char.category === filters.category;
      return matchSearch && matchElement && matchRank && matchCategory;
    });
  }, [characters, filters]);

  // ── Visão da árvore de um personagem específico ──
  if (selectedChar) {
    const tree = getSkillTreeByRace(selectedChar.race);
    const meta = ELEMENT_META[selectedChar.element];

    return (
      <div className="space-y-6">

        {/* Botão voltar */}
        <button
          type="button"
          onClick={() => setSelectedChar(null)}
          className="flex items-center gap-2 font-title text-xs uppercase tracking-widest text-bege-escuro/60 transition hover:text-bege-medio"
        >
          <ArrowLeft size={14} strokeWidth={1.5} />
          Voltar ao painel
        </button>

        {/* Cabeçalho do personagem */}
        <div
          className="flex flex-col gap-4 rounded-sm border p-5 sm:flex-row sm:items-center"
          style={{ borderColor: `${meta.color}40`, backgroundColor: `${meta.color}08` }}
        >
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2"
            style={{ borderColor: `${meta.color}60` }}>
            {selectedChar.image ? (
              <Image src={selectedChar.image} alt={selectedChar.name} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-title text-lg text-bege-escuro/40">?</div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-title text-xl uppercase tracking-wider text-bege-medio">
                {selectedChar.name}
              </h2>
              <div className="relative h-5 w-5">
                <Image src={rankCoatOfArms[selectedChar.rank]} alt={`Rank ${selectedChar.rank}`} fill className="object-contain" />
              </div>
            </div>
            <p className="font-title text-xs uppercase tracking-widest text-bege-escuro/50">
              {selectedChar.race} · {selectedChar.category} · Nível {selectedChar.level}
            </p>
          </div>

          {/* Elemento com ícone */}
          <div className="flex items-center gap-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full border"
              style={{ borderColor: `${meta.color}60`, backgroundColor: `${meta.color}18` }}
            >
              <Image src={meta.svgPath} alt={meta.label} width={20} height={20} className="object-contain" />
            </div>
            <span className="font-title text-sm uppercase tracking-wider" style={{ color: meta.color }}>
              {meta.label}
            </span>
          </div>
        </div>

        {/* Árvore ou aviso */}
        {tree ? (
          <SkillTree
            tree={tree}
            meta={meta}
            characterLevel={selectedChar.level}
            birthRank={selectedChar.birthRank}
            visible={true}
          />
        ) : (
          <p className="py-12 text-center font-title text-sm uppercase tracking-wider text-bege-escuro/40">
            Árvore de habilidades não registrada para esta raça.
          </p>
        )}
      </div>
    );
  }

  // ── Visão da lista (padrão) ──
  return (
    <div className="space-y-6 md:space-y-8">

      {/* Cabeçalho */}
      <div>
        <h1 className="font-title text-3xl uppercase tracking-[0.08em] text-bege-medio md:text-6xl">
          Habilidades
        </h1>
        <Image src="/assets/svgs/divider.svg" alt="" width={360} height={28}
          className="mt-3 max-w-[180px] md:max-w-[400px]" />
        <p className="mt-3 font-title text-sm text-bege-claro/60 md:text-lg">
          Visão geral das habilidades de toda a campanha
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-bege-escuro/25">
        {(["jogadores", "personagens"] as Tab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`
              px-4 py-2.5 font-title text-xs uppercase tracking-[0.16em] transition-all border-b-2 -mb-px md:px-6 md:py-3 md:text-sm
              ${activeTab === tab
                ? "border-bege-medio text-bege-medio"
                : "border-transparent text-bege-escuro/50 hover:text-bege-medio"
              }
            `}
          >
            {tab === "jogadores" ? "Jogadores" : "Personagens"}
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="relative w-full md:max-w-xs">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-bege-escuro/50" />
          <input
            value={filters.search}
            onChange={(e) => setFilter("search", e.target.value)}
            placeholder="Buscar..."
            className="h-11 w-full border border-bege-escuro/40 bg-transparent pl-11 pr-4 font-title text-sm tracking-wider text-bege-claro outline-none placeholder:text-bege-medio/40"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Elemento */}
          <div className="relative">
            <select
              value={filters.element}
              onChange={(e) => setFilter("element", e.target.value as CharacterElement | "todos")}
              className="h-10 appearance-none border border-bege-escuro/40 bg-roxo-escuro px-3 pr-7 font-title text-xs uppercase tracking-wider text-bege-medio outline-none cursor-pointer"
            >
              {ELEMENTS.map((el) => (
                <option key={el} value={el} className="bg-roxo-escuro">
                  {el === "todos" ? "Elemento" : ELEMENT_META[el as CharacterElement].label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-bege-escuro/50">▼</span>
          </div>

          {/* Rank */}
          <div className="relative">
            <select
              value={filters.rank}
              onChange={(e) => setFilter("rank", e.target.value as CharacterRank | "todos")}
              className="h-10 appearance-none border border-bege-escuro/40 bg-roxo-escuro px-3 pr-7 font-title text-xs uppercase tracking-wider text-bege-medio outline-none cursor-pointer"
            >
              {RANKS.map((r) => (
                <option key={r} value={r} className="bg-roxo-escuro">
                  {r === "todos" ? "Rank" : `Rank ${r}`}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-bege-escuro/50">▼</span>
          </div>

          {/* Arquétipo */}
          <div className="relative">
            <select
              value={filters.category}
              onChange={(e) => setFilter("category", e.target.value as CharacterCategory | "todos")}
              className="h-10 appearance-none border border-bege-escuro/40 bg-roxo-escuro px-3 pr-7 font-title text-xs uppercase tracking-wider text-bege-medio outline-none cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value} className="bg-roxo-escuro">
                  {c.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-bege-escuro/50">▼</span>
          </div>

          {(filters.element !== "todos" || filters.rank !== "todos" || filters.category !== "todos" || filters.search !== "") && (
            <button
              type="button"
              onClick={() => setFilters({ search: "", element: "todos", rank: "todos", category: "todos" })}
              className="h-10 border border-bege-escuro/30 px-3 font-title text-xs uppercase tracking-wider text-bege-escuro/50 transition hover:text-bege-medio"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      <hr className="border-t border-bege-escuro/25" />

      <p className="font-title text-xs text-bege-escuro/40 uppercase tracking-widest">
        {filtered.length} {filtered.length === 1 ? "resultado" : "resultados"} · Toque em um card para ver a árvore
      </p>

      {/* Grid de cards */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((char) => {
            const meta = ELEMENT_META[char.element];

            return (
              <button
                key={char.id}
                type="button"
                onClick={() => setSelectedChar(char)}
                className="group relative flex flex-col gap-3 border border-bege-escuro/35 bg-roxo-escuro/40 p-4 text-left shadow-card transition-all hover:border-bege-medio/50 active:scale-[0.98]"
              >
                {/* Linha de cor do elemento */}
                <div
                  className="absolute left-0 right-0 top-0 h-px"
                  style={{ background: `linear-gradient(to right, transparent, ${meta.color}, transparent)` }}
                />

                {/* Avatar + nome + rank */}
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-bege-escuro/40 bg-roxo">
                    {char.image ? (
                      <Image src={char.image} alt={char.name} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-title text-sm text-bege-escuro/40">?</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-title text-sm uppercase tracking-wider text-bege-claro group-hover:text-bege-medio transition-colors">
                      {char.name}
                    </p>
                    <p className="font-title text-[10px] uppercase tracking-widest text-bege-escuro/50">
                      {char.race} · Nível {char.level}
                    </p>
                  </div>
                  <div className="relative h-5 w-5 shrink-0">
                    <Image src={rankCoatOfArms[char.rank]} alt={`Rank ${char.rank}`} fill className="object-contain" />
                  </div>
                </div>

                <hr className="border-t border-bege-escuro/15" />

                {/* Elemento + XP */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-full border"
                      style={{ borderColor: `${meta.color}50`, backgroundColor: `${meta.color}15` }}
                    >
                      <Image src={meta.svgPath} alt={meta.label} width={14} height={14} className="object-contain" />
                    </div>
                    <span className="font-title text-[10px] uppercase tracking-wider" style={{ color: meta.color }}>
                      {meta.label}
                    </span>
                  </div>

                  <span className="font-mono text-[10px] text-bege-escuro/40">
                    {char.xp}/{char.maxXp} XP
                  </span>
                </div>

                {/* Barra XP */}
                <div className="h-0.5 w-full overflow-hidden rounded-full bg-roxo">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(char.xp / char.maxXp) * 100}%`,
                      backgroundColor: meta.color,
                    }}
                  />
                </div>

                {/* Indicador de habilidades — só na tab personagens */}
                {activeTab === "personagens" && (
                  <p className="font-title text-[10px] uppercase tracking-widest text-bege-escuro/40">
                    Ver árvore de habilidades →
                  </p>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="py-16 text-center font-title text-base tracking-wide text-bege-medio/40">
          Nenhum resultado encontrado.
        </p>
      )}
    </div>
  );
}