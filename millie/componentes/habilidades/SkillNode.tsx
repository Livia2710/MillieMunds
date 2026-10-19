"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import type { Skill, ElementMeta } from "@/lib/types/skill";
import { registerInnateSkillUse, registerSkillUse, deleteRaceSkill, deleteSkill, setCharacterInnateSkillLevel, setCharacterSkillLevel } from "@/app/actions/skill";
import { useCampaign } from "@/lib/contexts/CampaignContext";
import ConfirmModal from "@/componentes/modais/ConfirmModal";
import EditarHabilidadeModal from "@/componentes/modais/EditarHabilidadeModal";
import { useToast } from "@/componentes/ui/ToastProvider";

type SkillNodeProps = {
  skill: Skill & { uses?: number; isInnate?: boolean };
  meta: ElementMeta;
  characterLevel: number;
  birthRank: string;
  characterId: string;
  onSkillChanged?: () => void;
};

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

export function SkillNode({ skill, meta, characterLevel, birthRank, characterId, onSkillChanged }: SkillNodeProps) {
  const toast = useToast();
  const { isMaster } = useCampaign();
  const router = useRouter();
  const [expanded,    setExpanded]    = useState(false);
  const [feedback,    setFeedback]    = useState<string | null>(null);
  const [isPending,   startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const isLocked = !skill.isUnlocked || characterLevel < skill.requiredCharacterLevel;
  const isMaxed  = skill.currentLevel >= skill.maxLevel;
  const levelDots = Array.from({ length: skill.maxLevel }, (_, i) => i < skill.currentLevel);

  const uses        = skill.uses ?? 0;
  const needed      = usesRequired(birthRank, skill.currentLevel);
  const usePct      = isMaxed ? 100 : Math.min((uses / needed) * 100, 100);

  const canUse = !isLocked && !isMaxed;
  const canManage = isMaster;
  const canOpen = !isLocked || canManage;

  // efeito já alcançado (nível atual) e o próximo, se existir
  const currentEffect = skill.currentLevel > 0 ? skill.levelEffects?.[skill.currentLevel - 1] : undefined;
  const nextEffect = !isMaxed ? skill.levelEffects?.[skill.currentLevel] : undefined;
  const activeStage = skill.evolutionStages?.[Math.min(skill.currentLevel, skill.maxLevel - 1)] ?? skill.evolutionStages?.[0];

  function handleUse() {
    if (!canUse) return;
    startTransition(async () => {
      try {
        const result = skill.isInnate
          ? await registerInnateSkillUse(skill.id, characterId)
          : await registerSkillUse(skill.id);
        if (result.leveledUp) {
          const message = `Subiu para nível ${result.newLevel}!`
          setFeedback(message);
          toast.success(message);
        } else {
          const message = `${result.uses}/${result.usesRequired} usos`
          setFeedback(message);
          toast.success(`Uso registrado: ${message}.`);
        }
        setTimeout(() => setFeedback(null), 2500);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Erro ao registrar uso.";
        setFeedback(message);
        toast.error(message);
        setTimeout(() => setFeedback(null), 2500);
      }
    });
  }

  function handleMasterSetLevel(level: number) {
    if (!canManage || level < 0 || level > skill.maxLevel) return;
    startTransition(async () => {
      try {
        if (skill.isInnate) await setCharacterInnateSkillLevel(skill.id, characterId, level);
        else await setCharacterSkillLevel(skill.id, level);
        router.refresh();
        onSkillChanged?.();
        toast.success(level >= skill.maxLevel ? "Habilidade definida na forma máxima." : `Habilidade ajustada para a forma ${level + 1}.`);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Não foi possível ajustar a forma da habilidade.";
        toast.error(message);
      }
    });
  }

  async function handleDelete() {
    if (skill.isInnate) await deleteRaceSkill(skill.id)
    else await deleteSkill(skill.id)
    router.refresh();
    onSkillChanged?.();
  }

  return (
    <div className="flex flex-col items-center gap-1.5">

      <button
        type="button"
        onClick={() => canOpen && setExpanded((v) => !v)}
        className={`
          group relative flex h-12 w-12 items-center justify-center rounded-full border-2
          transition-all duration-300 md:h-14 md:w-14
          ${isLocked ? (canManage ? "cursor-pointer" : "opacity-40 grayscale cursor-default") : "cursor-pointer"}
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
          {currentEffect && (
            <p className="mt-2 text-[10px] italic leading-relaxed text-bege-claro/70">
              &quot;{currentEffect}&quot;
            </p>
          )}
        </div>
      </button>

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

      {!isLocked && !isMaxed && (
        <div className="w-12 md:w-14 h-0.5 rounded-full overflow-hidden bg-roxo">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${usePct}%`, backgroundColor: meta.color }}
          />
        </div>
      )}

      <p
        className="max-w-[72px] text-center font-title text-[9px] uppercase tracking-wide leading-tight md:max-w-[80px] md:text-[10px]"
        style={{ color: isLocked ? "#6b6b7b" : meta.glow }}
      >
        {skill.name}
      </p>

      {expanded && canOpen && (
        <div
          className="mt-1 w-64 max-w-[calc(100vw-2rem)] rounded border p-3 text-left"
          style={{
            borderColor:     `${meta.color}40`,
            backgroundColor: "#1a0f22ee",
          }}
        >
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="font-title text-[10px] uppercase tracking-wider" style={{ color: meta.color }}>
              {skill.name}
            </p>
            {canManage && (
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="flex h-5 w-5 items-center justify-center rounded-full border border-bege-escuro/40 text-bege-escuro hover:border-bege-medio"
                  aria-label="Editar habilidade"
                >
                  <Pencil size={10} strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteOpen(true)}
                  className="flex h-5 w-5 items-center justify-center rounded-full border border-bege-escuro/40 text-bege-escuro hover:border-red-400"
                  aria-label="Excluir habilidade"
                >
                  <Trash2 size={10} strokeWidth={1.5} />
                </button>
              </div>
            )}
          </div>

          <p className="text-[10px] leading-relaxed text-bege-claro/75">{skill.description}</p>

          <div className="mt-2 space-y-1 border-t border-bege-escuro/20 pt-2 text-[9px] leading-relaxed text-bege-claro/70">
            {activeStage ? <>
              <p><strong>Forma atual:</strong> {activeStage.name}</p>
              {activeStage.execution && <p><strong>Efeito:</strong> {activeStage.execution}</p>}
              <p><strong>Custo:</strong> {activeStage.costResource === "pm" ? `${activeStage.costAmount} PM` : activeStage.costResource === "pv" ? `${activeStage.costAmount} PV` : "Sem custo"} · <strong>Alcance:</strong> {activeStage.customRange || activeStage.range}</p>
              {activeStage.duration && <p><strong>Duração:</strong> {activeStage.duration}</p>}
              {activeStage.testAttribute && <p><strong>Teste:</strong> {activeStage.testAttribute}</p>}
              {activeStage.potency && <p><strong>Potência:</strong> {activeStage.potency}</p>}
              {activeStage.requiredRank && <p><strong>Rank mínimo:</strong> {activeStage.requiredRank}</p>}
              {activeStage.requirements && <p><strong>Requisitos:</strong> {activeStage.requirements}</p>}
              {activeStage.results.length > 0 && <div><strong>Resultados por carta:</strong><ul className="ml-3 list-disc">{activeStage.results.map((result, index) => <li key={`${result.card}-${index}`}><strong>{result.card} · {result.outcome}:</strong> {result.interpretation}</li>)}</ul></div>}
            </> : <>
              {skill.execution && <p><strong>Execução:</strong> {skill.execution}</p>}
              <p><strong>Custo:</strong> {skill.costResource === "pm" ? `${skill.costAmount ?? 0} PM` : skill.costResource === "pv" ? `${skill.costAmount ?? 0} PV` : "Sem custo"} · <strong>Alcance:</strong> {skill.range ?? "—"}</p>
              {skill.duration && <p><strong>Duração:</strong> {skill.duration}</p>}
              {skill.testAttribute && <p><strong>Teste:</strong> {skill.testAttribute}</p>}
              {skill.potency && <p><strong>Potência:</strong> {skill.potency}</p>}
              {skill.results && <p className="whitespace-pre-wrap"><strong>Resultados:</strong> {skill.results}</p>}
              {skill.trigger && <p><strong>Gatilho:</strong> {skill.trigger}</p>}
              {skill.enhances && <p><strong>Aprimora:</strong> {skill.enhances}</p>}
              {skill.requirements && <p><strong>Requisitos:</strong> {skill.requirements}</p>}
            </>}
            {skill.interactions && <p><strong>Interações:</strong> {skill.interactions}</p>}
          </div>

          <p className="mt-2 font-mono text-[9px] text-bege-escuro/50">
            Nível {skill.currentLevel}/{skill.maxLevel}
          </p>

          {isLocked && canManage && <p className="mt-1 font-mono text-[9px] text-amber-200/70">Habilidade bloqueada para o personagem; o ajuste do Mestre ainda pode definir sua forma.</p>}

          {!isMaxed && (
            <p className="font-mono text-[9px] text-bege-escuro/40">
              {uses}/{needed} usos para evoluir
            </p>
          )}

          {currentEffect && (
            <p className="mt-2 text-[9px] italic leading-relaxed text-bege-claro/70">
              Efeito atual: &quot;{currentEffect}&quot;
            </p>
          )}
          {nextEffect && (
            <p className="mt-1 text-[9px] italic leading-relaxed text-bege-escuro/40">
              Próximo (nível {skill.currentLevel + 1}): &quot;{nextEffect}&quot;
            </p>
          )}

          {feedback && (
            <p className="mt-1.5 font-title text-[9px] uppercase tracking-wider" style={{ color: meta.glow }}>
              {feedback}
            </p>
          )}

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

          {canManage && !isMaxed && (
            <div className="mt-3 space-y-2 border-t pt-2" style={{ borderColor: `${meta.color}30` }}>
              <p className="font-title text-[9px] uppercase tracking-widest" style={{ color: meta.glow }}>Ajuste do Mestre</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleMasterSetLevel(skill.currentLevel + 1)}
                  disabled={isPending}
                  className="flex-1 border px-2 py-1.5 font-title text-[9px] uppercase tracking-wide disabled:opacity-40"
                  style={{ borderColor: `${meta.color}60`, color: meta.color }}
                >
                  Evoluir sem usos
                </button>
                <button
                  type="button"
                  onClick={() => handleMasterSetLevel(skill.maxLevel)}
                  disabled={isPending}
                  className="flex-1 border px-2 py-1.5 font-title text-[9px] uppercase tracking-wide disabled:opacity-40"
                  style={{ borderColor: `${meta.color}60`, color: meta.glow }}
                >
                  Forma máxima
                </button>
              </div>
            </div>
          )}

          {skill.isInnate && !isMaxed && !canManage && (
            <p className="mt-2 font-title text-[9px] uppercase tracking-widest text-bege-escuro/30">
              Habilidade inata — evolução em breve
            </p>
          )}
        </div>
      )}

      {canManage && (
        <>
          <EditarHabilidadeModal
            isOpen={editOpen}
            onClose={() => setEditOpen(false)}
            skill={skill}
            onSaved={onSkillChanged}
          />
          <ConfirmModal
            isOpen={confirmDeleteOpen}
            onClose={() => setConfirmDeleteOpen(false)}
            onConfirm={handleDelete}
            title="Excluir Habilidade"
            message={`Tem certeza que quer excluir "${skill.name}"? Essa ação não pode ser desfeita.`}
            successMessage="Habilidade excluída com sucesso."
            confirmLabel="Excluir"
          />
        </>
      )}
    </div>
  );
}
