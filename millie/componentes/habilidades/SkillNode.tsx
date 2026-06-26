"use client";

import { useState, useTransition } from "react";
import type { Skill, ElementMeta } from "@/lib/types/skill";
import { useSkill } from "@/app/actions/skill";

type SkillNodeProps = {
  skill: Skill & { uses?: number; isInnate?: boolean };
  meta: ElementMeta;
  characterLevel: number;
  birthRank: string;
};

// Tabela local — espelha calcSkillUsesRequired de rank.ts
const USES_TABLE: Record<string, number[]> = {
  E: [60, 100, 150],
  D: [45,  75, 120],
  C: [30,  50,  80],
  B: [20,  35,  55],
  A: [12,  20,  35],
  S: [ 6,  10,  18],
};

function usesRequired(birthRank: string, currentLevel: number): number {
  const table = USES_TABLE[birthRank] ?? USES_TABLE["D"];
  return table[currentLevel] ?? table[table.length - 1];
}

export function SkillNode({ skill, meta, characterLevel, birthRank }: SkillNodeProps) {
  const [expanded,    setExpanded]    = useState(false);
  const [feedback,    setFeedback]    = useState<string | null>(null);
  const [isPending,   startTransition] = useTransition();

  const isLocked = !skill.isUnlocked || characterLevel < skill.requiredCharacterLevel;
  const isMaxed  = skill.currentLevel >= skill.maxLevel;
  const levelDots = Array.from({ length: skill.maxLevel }, (_, i) => i < skill.currentLevel);

  const uses        = skill.uses ?? 0;
  const needed      = usesRequired(birthRank, skill.currentLevel);
  const usePct      = isMaxed ? 100 : Math.min((uses / needed) * 100, 100);

  // habilidades inatas não têm id de Skill no banco — botão desabilitado por ora
  const canUse = !isLocked && !isMaxed && !skill.isInnate;

  function handleUse() {
    if (!canUse) return;
    startTransition(async () => {
      try {
        const result = await useSkill(skill.id);
        if (result.leveledUp) {
          setFeedback(`Subiu para nível ${result.newLevel}!`);
        } else {
          setFeedback(`${result.uses}/${result.usesRequired} usos`);
        }
        setTimeout(() => setFeedback(null), 2500);
      } catch (e: any) {
        setFeedback(e.message);
        setTimeout(() => setFeedback(null), 2500);
      }
    });
  }

  return (
    <div className="flex flex-col items-center gap-1.5">

      {/* Nó clicável — abre/fecha painel */}
      <button
        type="button"
        onClick={() => !isLocked && setExpanded((v) => !v)}
        className={`
          group relative flex h-12 w-12 items-center justify-center rounded-full border-2
          transition-all duration-300 md:h-14 md:w-14
          ${isLocked ? "opacity-40 grayscale cursor-default" : "cursor-pointer"}
        `}
        style={{
          borderColor:     isLocked ? "#4a4a5a" : meta.color,
          backgroundColor: isLocked ? "#1a0f2210" : `${meta.color}18`,
          boxShadow: isLocked ? "none"
            : isMaxed ? `0 0 18px ${meta.glow}88, 0 0 36px ${meta.glow}33`
            : `0 0 8px ${meta.color}44`,
        }}
      >
        {isLocked ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="#6b6b7b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        ) : (
          <span
            className="font-title text-base font-bold uppercase md:text-lg"
            style={{ color: isMaxed ? meta.glow : meta.color }}
          >
            {skill.name.charAt(0)}
          </span>
        )}

        {isMaxed && !isLocked && (
          <span
            className="absolute -top-1.5 -right-1.5 rounded-full px-1 py-0.5 font-mono text-[7px] font-bold uppercase"
            style={{ backgroundColor: meta.color, color: "#1a0f22" }}
          >
            MAX
          </span>
        )}

        {/* Tooltip desktop */}
        <div
          className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 w-44 -translate-x-1/2
                     rounded border border-bege-escuro/30 bg-roxo-escuro p-3
                     opacity-0 shadow-xl transition-opacity duration-200
                     group-hover:opacity-100 hidden md:block"
          style={{ borderColor: `${meta.color}40` }}
        >
          <p className="mb-1 font-title text-xs uppercase tracking-wider" style={{ color: meta.color }}>
            {skill.name}
          </p>
          <p className="text-[11px] leading-relaxed text-bege-claro/80">{skill.description}</p>
          {isLocked && (
            <p className="mt-2 font-mono text-[10px]" style={{ color: meta.glow }}>
              Requer nível {skill.requiredCharacterLevel}
            </p>
          )}
          <p className="mt-1 font-mono text-[10px] text-bege-escuro/50">
            Nível {skill.currentLevel}/{skill.maxLevel}
          </p>
          {!isLocked && !isMaxed && (
            <p className="mt-0.5 font-mono text-[10px] text-bege-escuro/40">
              {uses}/{needed} usos para evoluir
            </p>
          )}
        </div>
      </button>

      {/* Bolinhas de nível */}
      <div className="flex gap-1">
        {levelDots.map((filled, i) => (
          <div
            key={i}
            className="h-1.5 w-1.5 rounded-full border"
            style={{
              borderColor:     meta.color,
              backgroundColor: filled ? meta.color : "transparent",
              boxShadow:       filled ? `0 0 4px ${meta.glow}` : "none",
            }}
          />
        ))}
      </div>

      {/* Barra de progresso de usos */}
      {!isLocked && !isMaxed && (
        <div className="w-12 md:w-14 h-0.5 rounded-full overflow-hidden bg-roxo">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${usePct}%`, backgroundColor: meta.color }}
          />
        </div>
      )}

      {/* Nome */}
      <p
        className="max-w-[72px] text-center font-title text-[9px] uppercase tracking-wide leading-tight md:max-w-[80px] md:text-[10px]"
        style={{ color: isLocked ? "#6b6b7b" : meta.glow }}
      >
        {skill.name}
      </p>

      {/* Painel expandido — mobile ao toque, desktop também */}
      {expanded && !isLocked && (
        <div
          className="mt-1 w-44 rounded border p-3 text-left"
          style={{
            borderColor:     `${meta.color}40`,
            backgroundColor: "#1a0f22ee",
          }}
        >
          <p className="mb-1 font-title text-[10px] uppercase tracking-wider" style={{ color: meta.color }}>
            {skill.name}
          </p>
          <p className="text-[10px] leading-relaxed text-bege-claro/75">{skill.description}</p>

          <p className="mt-2 font-mono text-[9px] text-bege-escuro/50">
            Nível {skill.currentLevel}/{skill.maxLevel}
          </p>

          {!isMaxed && (
            <p className="font-mono text-[9px] text-bege-escuro/40">
              {uses}/{needed} usos para evoluir
            </p>
          )}

          {/* Feedback de uso */}
          {feedback && (
            <p className="mt-1.5 font-title text-[9px] uppercase tracking-wider" style={{ color: meta.glow }}>
              {feedback}
            </p>
          )}

          {/* Botão registrar uso */}
          {canUse && (
            <button
              type="button"
              onClick={handleUse}
              disabled={isPending}
              className="mt-3 w-full border py-1.5 font-title text-[9px] uppercase tracking-widest transition disabled:opacity-40"
              style={{
                borderColor: `${meta.color}60`,
                color:       meta.color,
              }}
            >
              {isPending ? "Registrando..." : "Registrar uso"}
            </button>
          )}

          {skill.isInnate && !isMaxed && (
            <p className="mt-2 font-title text-[9px] uppercase tracking-widest text-bege-escuro/30">
              Habilidade inata — evolução em breve
            </p>
          )}
        </div>
      )}
    </div>
  );
}