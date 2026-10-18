"use client"
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import MillieModal from "@/componentes/ui/MillieModal"
import MillieInput from "@/componentes/ui/MillieInput"
import MillieTextarea from "@/componentes/ui/MillieTextarea"
import MillieSelect from "@/componentes/ui/MillieSelect"
import { PrimaryButton } from "@/componentes/PrimaryButton"
import { ELEMENT_META } from "@/lib/types/skill"
import type { SkillBranch, Skill, SkillEvolutionStage } from "@/lib/types/skill"
import type { CharacterElement } from "@/lib/types/character"
import { updateRaceSkill, updateSkill } from "@/app/actions/skill"
import { useToast } from "@/componentes/ui/ToastProvider"
import SkillEvolutionStagesEditor, { createInitialSkillStages, normalizeSkillStages } from "@/componentes/habilidades/SkillEvolutionStagesEditor"

type Props = { isOpen: boolean; onClose: () => void; skill: Skill | null; onSaved?: () => void }

const BRANCH_OPTIONS: { value: SkillBranch; label: string }[] = [
  { value: "ativa", label: "Ativa" },
  { value: "passiva", label: "Passiva" },
  { value: "reacao", label: "Reação" },
  { value: "aprimoramento", label: "Aprimoramento" },
]

const ELEMENT_OPTIONS = Object.values(ELEMENT_META).map((m) => ({ value: m.element, label: m.label }))
const MAX_LEVEL_OPTIONS = [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} etapa${n > 1 ? "s" : ""}` }))

export default function EditarHabilidadeModal({ isOpen, onClose, skill, onSaved }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [branch, setBranch] = useState<SkillBranch>("ativa")
  const [element, setElement] = useState<CharacterElement>("fogo")
  const [maxLevel, setMaxLevel] = useState("3")
  const [stages, setStages] = useState<SkillEvolutionStage[]>(createInitialSkillStages(3))
  const [lineName, setLineName] = useState("")
  const [interactions, setInteractions] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!skill) return
    setName(skill.name)
    setDescription(skill.description)
    setBranch(skill.branch)
    setElement((skill.element as CharacterElement) ?? "fogo")
    setMaxLevel(String(skill.maxLevel))
    setLineName(skill.lineName ?? "")
    setInteractions(skill.interactions ?? "")
    const fallback: Partial<SkillEvolutionStage> = {
      name: skill.name,
      requiredRank: skill.requiredRank ?? "D",
      requiredCharacterLevel: skill.requiredCharacterLevel,
      requirements: skill.requirements ?? "",
      costResource: skill.costResource ?? "none",
      costAmount: skill.costAmount ?? 0,
      range: skill.range ?? "Pessoal",
      duration: skill.duration ?? "",
      potency: skill.potency ?? "",
      testAttribute: skill.testAttribute ?? "",
      execution: skill.execution ?? skill.levelEffects?.[0] ?? "",
      trigger: skill.trigger ?? "",
      enhances: skill.enhances ?? "",
    }
    setStages(normalizeSkillStages(skill.evolutionStages, skill.maxLevel, fallback))
  }, [skill])

  function handleClose() {
    setError("")
    onClose()
  }

  function handleSubmit() {
    if (!skill) return
    if (!name.trim()) { setError("Nome é obrigatório."); return }
    const activeStages = stages.slice(0, Number(maxLevel))
    activeStages[0] = { ...activeStages[0], name: name.trim() }
    if (Number(maxLevel) >= 4 && ["E", "D", "C"].includes(activeStages[0].requiredRank)) { setError("Habilidades com 4 ou 5 etapas exigem Rank mínimo B."); return }
    if (activeStages.some((stage, index) => index >= 3 && ["E", "D", "C"].includes(stage.requiredRank))) { setError("Despertares 4 e 5 exigem Rank mínimo B."); return }
    if (activeStages.some((stage) => stage.costResource !== "none" && stage.costAmount < 1)) { setError("Informe a quantidade do custo em cada etapa que tenha custo."); return }
    if (activeStages.some((stage) => stage.range === "Fórmula personalizada" && !stage.customRange.trim())) { setError("Informe a fórmula para cada alcance personalizado."); return }
    if (activeStages.some((stage) => stage.results.some((result) => !result.card.trim() || !result.interpretation.trim()))) { setError("Preencha a carta/condição e a interpretação de cada resultado, ou remova a linha incompleta."); return }
    setError("")
    startTransition(async () => {
      try {
        const payload = {
          name: name.trim(),
          description,
          branch,
          element,
          maxLevel: Number(maxLevel),
          requiredCharacterLevel: activeStages[0].requiredCharacterLevel,
          levelEffects: activeStages.map((stage) => stage.execution).filter(Boolean),
          evolutionStages: activeStages,
          costResource: activeStages[0].costResource,
          costAmount: activeStages[0].costAmount,
          range: activeStages[0].range === "Fórmula personalizada" ? activeStages[0].customRange.trim() : activeStages[0].range,
          duration: activeStages[0].duration,
          trigger: activeStages[0].trigger,
          enhances: activeStages[0].enhances,
          execution: activeStages[0].execution,
          testAttribute: activeStages[0].testAttribute,
          results: "",
          potency: activeStages[0].potency,
          lineName,
          formNumber: 1,
          requiredRank: Number(maxLevel) >= 4 ? "B" : activeStages[0].requiredRank,
          evolvesTo: activeStages[1]?.name ?? "",
          requirements: activeStages[0].requirements,
          interactions,
        }
        if (skill.isInnate) await updateRaceSkill(skill.id, payload)
        else await updateSkill(skill.id, payload)
        router.refresh()
        onSaved?.()
        toast.success("Habilidade atualizada com sucesso.")
        handleClose()
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erro ao editar habilidade."
        setError(message)
        toast.error(message)
      }
    })
  }

  const selectedMeta = ELEMENT_META[element]
  if (!skill) return null

  return (
    <MillieModal isOpen={isOpen} onClose={handleClose} title="Editar Habilidade">
      <div className="space-y-4">
        <MillieInput label="Nome" value={name} onChange={(e) => setName(e.target.value)} />
        <MillieTextarea label="Descrição curta" rows={3} maxLength={180} value={description} onChange={(e) => setDescription(e.target.value)} />

        <div className="grid grid-cols-2 gap-3">
          <MillieSelect label="Tipo (Branch)" options={BRANCH_OPTIONS} value={branch} onChange={(e) => setBranch(e.target.value as SkillBranch)} />
          <div className="flex flex-col gap-1.5">
            <label className="font-title text-[10px] uppercase tracking-[0.2em] text-bege-escuro">Elemento</label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <MillieSelect options={ELEMENT_OPTIONS} value={element} onChange={(e) => setElement(e.target.value as CharacterElement)} />
              </div>
              {selectedMeta && (
                <div className="relative h-9 w-9 shrink-0">
                  <Image src={selectedMeta.svgPath} alt={selectedMeta.label} fill className="object-contain" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <MillieSelect label="Número de etapas" options={MAX_LEVEL_OPTIONS} value={maxLevel} onChange={(e) => { const next = Number(e.target.value); setMaxLevel(e.target.value); setStages((current) => { const updated = [...current.slice(0, next), ...createInitialSkillStages(next).slice(current.length)]; if (next >= 4) updated[0] = { ...updated[0], requiredRank: "B" }; return updated }) }} />
          <MillieInput label="Linha de evolução" value={lineName} onChange={(e) => setLineName(e.target.value)} />
        </div>
        <SkillEvolutionStagesEditor count={Number(maxLevel)} stages={stages} onChange={setStages} branch={branch} baseName={name} />
        <MillieTextarea label="Interações e exceções da habilidade" rows={3} value={interactions} onChange={(e) => setInteractions(e.target.value)} />

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex justify-end gap-3 border-t border-bege-escuro/20 pt-4">
          <button onClick={handleClose} className="font-title text-xs uppercase tracking-widest text-bege-medio/50 hover:text-bege-claro">Cancelar</button>
          <PrimaryButton onClick={handleSubmit} disabled={isPending}>{isPending ? "Salvando..." : "Salvar Alterações"}</PrimaryButton>
        </div>
      </div>
    </MillieModal>
  )
}
