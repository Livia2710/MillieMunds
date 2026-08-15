"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import MillieModal from "@/componentes/ui/MillieModal"
import MillieInput from "@/componentes/ui/MillieInput"
import MillieTextarea from "@/componentes/ui/MillieTextarea"
import MillieSelect from "@/componentes/ui/MillieSelect"
import { PrimaryButton } from "@/componentes/PrimaryButton"
import { ELEMENT_META } from "@/lib/types/skill"
import type { SkillBranch, Skill } from "@/lib/types/skill"
import type { CharacterElement } from "@/lib/types/character"
import { updateSkill } from "@/app/actions/skill"

type Props = { isOpen: boolean; onClose: () => void; skill: Skill | null; onSaved?: () => void }

const BRANCH_OPTIONS: { value: SkillBranch; label: string }[] = [
  { value: "ativa", label: "Ativa" },
  { value: "passiva", label: "Passiva" },
  { value: "reacao", label: "Reação" },
  { value: "aprimoramento", label: "Aprimoramento" },
]

const ELEMENT_OPTIONS = Object.values(ELEMENT_META).map((m) => ({ value: m.element, label: m.label }))
const MAX_LEVEL_OPTIONS = [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} nível${n > 1 ? "s" : ""}` }))

export default function EditarHabilidadeModal({ isOpen, onClose, skill, onSaved }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [branch, setBranch] = useState<SkillBranch>("ativa")
  const [element, setElement] = useState<CharacterElement>("fogo")
  const [maxLevel, setMaxLevel] = useState("3")
  const [requiredLevel, setRequiredLevel] = useState("1")
  const [levelEffects, setLevelEffects] = useState<string[]>(["", "", ""])
  const [error, setError] = useState("")

  useEffect(() => {
    if (!skill) return
    setName(skill.name)
    setDescription(skill.description)
    setBranch(skill.branch)
    setMaxLevel(String(skill.maxLevel))
    setRequiredLevel(String(skill.requiredCharacterLevel))
    const effects = skill.levelEffects ?? []
    const padded = [...effects]
    while (padded.length < skill.maxLevel) padded.push("")
    setLevelEffects(padded.slice(0, skill.maxLevel))
  }, [skill])

  useEffect(() => {
    const n = Number(maxLevel)
    setLevelEffects((prev) => {
      const next = [...prev]
      while (next.length < n) next.push("")
      return next.slice(0, n)
    })
  }, [maxLevel])

  function updateLevelEffect(index: number, value: string) {
    setLevelEffects((prev) => prev.map((t, i) => (i === index ? value : t)))
  }

  function handleClose() {
    setError("")
    onClose()
  }

  function handleSubmit() {
    if (!skill) return
    if (!name.trim()) { setError("Nome é obrigatório."); return }
    setError("")
    startTransition(async () => {
      try {
        await updateSkill(skill.id, {
          name: name.trim(),
          description,
          branch,
          element,
          maxLevel: Number(maxLevel),
          requiredCharacterLevel: Number(requiredLevel),
          levelEffects,
        })
        router.refresh()
        onSaved?.()
        handleClose()
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Erro ao editar habilidade.")
      }
    })
  }

  const selectedMeta = ELEMENT_META[element]
  if (!skill) return null

  return (
    <MillieModal isOpen={isOpen} onClose={handleClose} title="Editar Habilidade">
      <div className="space-y-4">
        <MillieInput label="Nome" value={name} onChange={(e) => setName(e.target.value)} />
        <MillieTextarea label="Descrição" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />

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
          <MillieSelect label="Nível Máximo" options={MAX_LEVEL_OPTIONS} value={maxLevel} onChange={(e) => setMaxLevel(e.target.value)} />
          <MillieInput label="Nível mín. do personagem" type="number" min={1} max={20} value={requiredLevel} onChange={(e) => setRequiredLevel(e.target.value)} />
        </div>

        <div className="space-y-3 border-t border-bege-escuro/20 pt-4">
          <span className="font-title text-[10px] uppercase tracking-[0.2em] text-bege-escuro">Efeito por Nível</span>
          {levelEffects.map((text, i) => (
            <MillieTextarea key={i} label={`Nível ${i + 1}`} rows={2} value={text} onChange={(e) => updateLevelEffect(i, e.target.value)} />
          ))}
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex justify-end gap-3 border-t border-bege-escuro/20 pt-4">
          <button onClick={handleClose} className="font-title text-xs uppercase tracking-widest text-bege-medio/50 hover:text-bege-claro">Cancelar</button>
          <PrimaryButton onClick={handleSubmit} disabled={isPending}>{isPending ? "Salvando..." : "Salvar Alterações"}</PrimaryButton>
        </div>
      </div>
    </MillieModal>
  )
}