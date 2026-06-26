"use client";

import Image from "next/image";
import type { RaceSkillTree } from "@/lib/types/skill";
import type { ElementMeta } from "@/lib/types/skill";
import { SkillNode } from "./SkillNode";

type SkillTreeProps = {
  tree: RaceSkillTree;
  meta: ElementMeta;
  characterLevel: number;
  birthRank: string;
  visible: boolean;
};

const BRANCH_CONFIG = [
  { key: "ativa"          as const, label: "Ativa",          description: "Habilidades usadas ativamente",           delay: "0ms" },
  { key: "passiva"        as const, label: "Passiva",         description: "Efeitos permanentes automáticos",         delay: "120ms" },
  { key: "reacao"         as const, label: "Reação",          description: "Respostas a ações inimigas",              delay: "240ms" },
  { key: "aprimoramento" as const, label: "Aprimoramento",   description: "Amplificações de outras habilidades",     delay: "360ms" },
];

export function SkillTree({ tree, meta, characterLevel, birthRank, visible }: SkillTreeProps) {
  return (
    <div className="flex w-full flex-col items-center">

      {/* ── GALHOS (topo) ── */}
      <div className="grid w-full grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {BRANCH_CONFIG.map((branch) => {
          const skills = tree.skills.filter((s) => s.branch === branch.key);

          return (
            <div
              key={branch.key}
              className="flex flex-col items-center gap-3"
              style={{
                opacity:   visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(-20px)",
                transition: `opacity 500ms ease ${branch.delay}, transform 500ms ease ${branch.delay}`,
              }}
            >
              {/* Nós de habilidade — crescem de cima para baixo dentro do galho */}
              <div className="flex flex-col items-center gap-4 w-full">
                {skills.length > 0 ? (
                  skills.map((skill, i) => (
                    <div key={skill.id} className="flex flex-col items-center gap-3">
                      <SkillNode skill={skill} meta={meta} characterLevel={characterLevel} birthRank={birthRank} />

                      {/* Linha entre nós do mesmo galho */}
                      {i < skills.length - 1 && (
                        <div
                          className="w-px"
                          style={{
                            height: "16px",
                            background: `linear-gradient(to bottom, ${meta.color}50, ${meta.color}20)`,
                          }}
                        />
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-center font-title text-[10px] uppercase tracking-wider text-bege-escuro/25 py-4">
                    Nenhuma
                  </p>
                )}
              </div>

              {/* Linha conectora descendo até o cabeçalho do galho */}
              <div
                className="w-px flex-1"
                style={{
                  minHeight: "16px",
                  background: `linear-gradient(to bottom, ${meta.color}20, ${meta.color}60)`,
                }}
              />

              {/* Cabeçalho do galho — fica na base de cada coluna, conectado ao tronco */}
              <div
                className="w-full rounded-sm border px-2 py-2 text-center"
                style={{
                  borderColor: `${meta.color}50`,
                  backgroundColor: `${meta.color}0d`,
                }}
              >
                <p
                  className="font-title text-[10px] uppercase tracking-[0.16em] md:text-xs md:tracking-[0.18em]"
                  style={{ color: meta.color }}
                >
                  {branch.label}
                </p>
                {/* Descrição só aparece em desktop */}
                <p className="mt-0.5 hidden text-[9px] leading-snug text-bege-escuro/40 md:block">
                  {branch.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── TRONCO — linha vertical conectando galhos ao elemento ── */}
      <div
        className="w-px"
        style={{
          height: "48px",
          opacity: visible ? 1 : 0,
          transition: "opacity 500ms ease 480ms",
          background: `linear-gradient(to bottom, ${meta.color}60, ${meta.color})`,
        }}
      />

      {/* ── RAIZ — elemento base ── */}
      <div
        className="flex flex-col items-center gap-2"
        style={{
          opacity: visible ? 1 : 0,
          transition: "opacity 600ms ease 560ms",
        }}
      >
        {/* Círculo do elemento */}
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full border-2 md:h-20 md:w-20"
          style={{
            borderColor: meta.color,
            backgroundColor: `${meta.color}18`,
            boxShadow: `0 0 28px ${meta.glow}77, 0 0 56px ${meta.glow}22`,
          }}
        >
          <Image
            src={meta.svgPath}
            alt={meta.label}
            width={36}
            height={36}
            className="object-contain md:h-11 md:w-11"
          />
        </div>

        {/* Nome */}
        <p
          className="font-title text-xs uppercase tracking-[0.24em]"
          style={{ color: meta.glow }}
        >
          {meta.label}
        </p>
      </div>
    </div>
  );
}