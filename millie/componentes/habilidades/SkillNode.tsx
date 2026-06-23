"use client";

import { useState } from "react";
import type { Skill, ElementMeta } from "@/lib/types/skill";

type SkillNodeProps = {
  skill: Skill;
  meta: ElementMeta;
  characterLevel: number;
};

export function SkillNode({ skill, meta, characterLevel }: SkillNodeProps) {
  const [expanded, setExpanded] = useState(false);
  const isLocked = !skill.isUnlocked || characterLevel < skill.requiredCharacterLevel;
  const isMaxed = skill.currentLevel >= skill.maxLevel;
  const levelDots = Array.from({ length: skill.maxLevel }, (_, i) => i < skill.currentLevel);

  return (
    <div className="flex flex-col items-center gap-1.5">

      {/* Nó clicável */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={`
          group relative flex h-12 w-12 items-center justify-center rounded-full border-2
          transition-all duration-300 md:h-14 md:w-14
          ${isLocked ? "opacity-40 grayscale cursor-default" : "cursor-pointer"}
        `}
        style={{
          borderColor: isLocked ? "#4a4a5a" : meta.color,
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

        {/* Tooltip desktop — hover */}
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
        </div>
      </button>

      {/* Bolinhas de nível */}
      <div className="flex gap-1">
        {levelDots.map((filled, i) => (
          <div
            key={i}
            className="h-1.5 w-1.5 rounded-full border"
            style={{
              borderColor: meta.color,
              backgroundColor: filled ? meta.color : "transparent",
              boxShadow: filled ? `0 0 4px ${meta.glow}` : "none",
            }}
          />
        ))}
      </div>

      {/* Nome */}
      <p
        className="max-w-[72px] text-center font-title text-[9px] uppercase tracking-wide leading-tight md:max-w-[80px] md:text-[10px]"
        style={{ color: isLocked ? "#6b6b7b" : meta.glow }}
      >
        {skill.name}
      </p>

      {/* Painel expandido mobile — aparece ao toque */}
      {expanded && (
        <div
          className="mt-1 w-40 rounded border p-2.5 text-left md:hidden"
          style={{
            borderColor: `${meta.color}40`,
            backgroundColor: "#1a0f22ee",
          }}
        >
          <p className="mb-1 font-title text-[10px] uppercase tracking-wider" style={{ color: meta.color }}>
            {skill.name}
          </p>
          <p className="text-[10px] leading-relaxed text-bege-claro/75">{skill.description}</p>
          {isLocked && (
            <p className="mt-1.5 font-mono text-[9px]" style={{ color: meta.glow }}>
              Requer nível {skill.requiredCharacterLevel}
            </p>
          )}
          <p className="mt-1 font-mono text-[9px] text-bege-escuro/50">
            Nível {skill.currentLevel}/{skill.maxLevel}
          </p>
        </div>
      )}
    </div>
  );
}