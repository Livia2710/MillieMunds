"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { ElementOrbit } from "./ElementOrbit";
import { SkillTree } from "./SkillTree";
import type { ProfileCharacter } from "@/lib/types/profile";
import type { RaceSkillTree } from "@/lib/types/skill";
import { ELEMENT_META } from "@/lib/types/skill";

type HabilidadesClientProps = {
  character: ProfileCharacter;
  tree: RaceSkillTree;
};

export default function HabilidadesClient({ character, tree }: HabilidadesClientProps) {
  const [treeVisible, setTreeVisible] = useState(false);

  const handleAnimationComplete = useCallback(() => {
    setTreeVisible(true);
  }, []);

  const meta = ELEMENT_META[character.element];

  return (
    <main className="relative z-10 min-h-screen px-4 py-8 md:px-16 md:py-14">

      {/* Cabeçalho */}
      <div className="mb-8 text-center md:mb-10">
        <p className="font-title text-xs uppercase tracking-[0.24em] text-bege-escuro md:text-sm md:tracking-[0.28em]">
          {character.name} — {character.race}
        </p>
        <h1 className="mt-2 font-title text-3xl uppercase tracking-[0.1em] text-bege-medio md:text-6xl">
          Habilidades
        </h1>
        <Image
          src="/assets/svgs/divider.svg" alt="" width={320} height={20}
          className="mx-auto mt-3 max-w-[50%] md:max-w-[40%]"
        />
      </div>

      {/* Animação da roleta */}
      <div
        style={{
          opacity: treeVisible ? 0 : 1,
          height: treeVisible ? 0 : "auto",
          overflow: "hidden",
          transition: "opacity 500ms ease, height 500ms ease",
          pointerEvents: treeVisible ? "none" : "auto",
        }}
      >
        <ElementOrbit
          characterElement={character.element}
          onAnimationComplete={handleAnimationComplete}
        />
      </div>

      {/* Árvore */}
      <div
        className="mx-auto max-w-4xl"
        style={{
          opacity: treeVisible ? 1 : 0,
          transition: "opacity 600ms ease",
        }}
      >
        {treeVisible && (
          <>
            {/* Stat bar */}
            <div
              className="mb-8 flex flex-wrap items-center justify-center gap-4 rounded-sm border px-4 py-3 md:gap-6 md:px-6"
              style={{
                borderColor: `${meta.color}30`,
                backgroundColor: `${meta.color}08`,
              }}
            >
              <StatBadge label="Nível"       value={String(character.level)} meta={meta} />
              <Divider />
              <StatBadge label="Elemento"    value={meta.label}              meta={meta} />
              <Divider />
              <StatBadge label="Raça"        value={character.race}          meta={meta} />
              <Divider />
              <StatBadge
                label="Habilidades"
                value={`${tree.skills.filter((s) => s.isUnlocked).length}/${tree.skills.length}`}
                meta={meta}
              />
            </div>

            <SkillTree
              tree={tree}
              meta={meta}
              characterLevel={character.level}
              visible={treeVisible}
            />
          </>
        )}
      </div>
    </main>
  );
}

function Divider() {
  return <div className="hidden h-5 w-px bg-bege-escuro/20 md:block" />;
}

function StatBadge({ label, value, meta }: {
  label: string;
  value: string;
  meta: typeof ELEMENT_META[keyof typeof ELEMENT_META];
}) {
  return (
    <div className="text-center">
      <p className="font-mono text-[9px] uppercase tracking-widest text-bege-escuro/50 md:text-[10px]">
        {label}
      </p>
      <p className="font-title text-xs uppercase tracking-wider md:text-sm" style={{ color: meta.color }}>
        {value}
      </p>
    </div>
  );
}