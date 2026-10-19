"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import MillieModal from "@/componentes/ui/MillieModal"
import MillieInput from "@/componentes/ui/MillieInput"
import MillieTextarea from "@/componentes/ui/MillieTextarea"
import MillieSelect from "@/componentes/ui/MillieSelect"
import { PrimaryButton } from "@/componentes/PrimaryButton"
import { ELEMENT_META } from "@/lib/types/skill"
import type { SkillBranch } from "@/lib/types/skill"
import type { CharacterElement } from "@/lib/types/character"
import { createRaceSkill, createSkill, getSkillCreationTargets } from "@/app/actions/skill"
import { useToast } from "@/componentes/ui/ToastProvider"
import SkillEvolutionStagesEditor, { createInitialSkillStages } from "@/componentes/habilidades/SkillEvolutionStagesEditor"
import type { SkillEvolutionStage } from "@/lib/types/skill"

type Props = { isOpen: boolean; onClose: () => void; initialOrigin?: Origin; initialTargetId?: string }
type Origin = "innate" | "trained"

const BRANCH_OPTIONS: { value: SkillBranch; label: string }[] = [
  { value: "ativa", label: "Ativa" }, { value: "passiva", label: "Passiva" },
  { value: "reacao", label: "Reação" }, { value: "aprimoramento", label: "Aprimoramento" },
]
const ELEMENT_OPTIONS = Object.values(ELEMENT_META).map((m) => ({ value: m.element, label: m.label }))
const LEVEL_OPTIONS = [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} Forma${n > 1 ? "s" : ""}` }))

export default function CriarHabilidadeModal({ isOpen, onClose, initialOrigin = "trained", initialTargetId = "" }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [origin, setOrigin] = useState<Origin>(initialOrigin)
  const [characters, setCharacters] = useState<{ id: string; name: string }[]>([])
  const [races, setRaces] = useState<{ id: string; name: string }[]>([])
  const [targetsLoaded, setTargetsLoaded] = useState(false)
  const [targetId, setTargetId] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [branch, setBranch] = useState<SkillBranch>("ativa")
  const [element, setElement] = useState<CharacterElement>("fogo")
  const [maxLevel, setMaxLevel] = useState("1")
  const [stages, setStages] = useState<SkillEvolutionStage[]>(createInitialSkillStages(1))
  const [lineName, setLineName] = useState("")
  const [interactions, setInteractions] = useState("")
  const [error, setError] = useState("")
  const selectedMeta = ELEMENT_META[element]

  useEffect(() => {
    if (!isOpen || targetsLoaded) return
    getSkillCreationTargets().then((targets) => {
      setCharacters(targets.characters)
      setRaces(targets.races)
      setOrigin(initialOrigin)
      setTargetId(initialTargetId)
      setTargetsLoaded(true)
    }).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : "Não foi possível carregar personagens e raças."
      setError(message)
      setTargetsLoaded(true)
      toast.error(message)
    })
  }, [isOpen, targetsLoaded, toast, initialOrigin, initialTargetId])

  function reset() {
    setOrigin(initialOrigin); setTargetId(initialTargetId); setName(""); setDescription(""); setBranch("ativa"); setElement("fogo")
    setMaxLevel("1"); setStages(createInitialSkillStages(1)); setLineName(""); setInteractions(""); setError("")
  }

  function handleClose() { reset(); onClose() }

  function submit() {
    if (!targetId) { setError(origin === "innate" ? "Selecione uma raça." : "Selecione um personagem."); return }
    if (!name.trim()) { setError("Nome é obrigatório."); return }
    const activeStages = stages.slice(0, Number(maxLevel))
    if (Number(maxLevel) >= 4 && activeStages.some((stage, index) => index >= 3 && ["E", "D", "C"].includes(stage.requiredRank))) { setError("Despertares 4 e 5 exigem Rank mínimo B."); return }
    if (activeStages.some((stage) => stage.costResource !== "none" && stage.costAmount < 1)) { setError("Informe a quantidade do custo em cada etapa que tenha custo."); return }
    if (activeStages.some((stage) => stage.range === "Fórmula personalizada" && !stage.customRange.trim())) { setError("Informe a fórmula para cada alcance personalizado."); return }
    if (activeStages.some((stage) => stage.results.some((result) => !result.card.trim() || !result.interpretation.trim()))) { setError("Preencha a carta/condição e a interpretação de cada resultado, ou remova a linha incompleta."); return }
    setError("")
    const initial = activeStages[0]
    activeStages[0] = { ...initial, name: name.trim() }
    const payload = {
      name: name.trim(), description: description.trim() || initial.execution.trim(), branch, element,
      maxLevel: Number(maxLevel), requiredCharacterLevel: initial.requiredCharacterLevel,
      levelEffects: activeStages.map((stage) => stage.execution).filter(Boolean), evolutionStages: activeStages,
      costResource: initial.costResource, costAmount: initial.costAmount, range: initial.range === "Fórmula personalizada" ? initial.customRange.trim() : initial.range,
      duration: initial.duration, trigger: initial.trigger, enhances: initial.enhances,
      execution: initial.execution, testAttribute: initial.testAttribute, results: "", potency: initial.potency,
      lineName, formNumber: 1, requiredRank: initial.requiredRank,
      evolvesTo: activeStages[1]?.name ?? "", requirements: initial.requirements, interactions,
    }
    startTransition(async () => {
      try {
        if (origin === "innate") await createRaceSkill({ ...payload, raceId: targetId })
        else await createSkill({ ...payload, characterId: targetId })
        router.refresh()
        toast.success(origin === "innate" ? "Habilidade inata adicionada à raça." : "Habilidade treinada criada para o personagem.")
        handleClose()
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erro ao criar habilidade."
        setError(message)
        toast.error(message)
      }
    })
  }

  const targetOptions = (origin === "innate" ? races : characters).map((target) => ({ value: target.id, label: target.name }))
  return <MillieModal isOpen={isOpen} onClose={handleClose} title="Criar Habilidade" maxWidth="max-w-3xl">
    <div className="max-h-[72vh] space-y-5 overflow-y-auto pr-2">
      <p className="text-sm leading-relaxed text-bege-claro/70">Preencha a ficha da habilidade. Inatas ficam vinculadas à raça e aparecem para todos os seus indivíduos; treinadas pertencem somente ao personagem escolhido.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <MillieSelect label="Origem da habilidade" options={[{ value: "innate", label: "Inata · compartilhada pela raça" }, { value: "trained", label: "Treinada · individual" }]} value={origin} onChange={(event) => { setOrigin(event.target.value as Origin); setTargetId("") }} />
        <MillieSelect label={origin === "innate" ? "Raça (todos os indivíduos)" : "Personagem"} options={[{ value: "", label: targetsLoaded ? "Selecione…" : "Carregando…" }, ...targetOptions]} value={targetId} onChange={(event) => setTargetId(event.target.value)} />
      </div>
      {origin === "innate" && <p className="-mt-3 text-[10px] text-bege-medio/60">A habilidade será compartilhada por qualquer personagem que pertença a esta raça.</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <MillieInput label="Nome da habilidade" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Presença da Terra" />
        <MillieInput label="Linha de evolução" value={lineName} onChange={(event) => setLineName(event.target.value)} placeholder="Ex.: Presença da Terra" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <MillieSelect label="Categoria" options={BRANCH_OPTIONS} value={branch} onChange={(event) => setBranch(event.target.value as SkillBranch)} />
        <div className="flex items-end gap-2"><div className="flex-1"><MillieSelect label="Elemento" options={ELEMENT_OPTIONS} value={element} onChange={(event) => setElement(event.target.value as CharacterElement)} /></div>{selectedMeta && <div className="relative mb-1 h-9 w-9 shrink-0"><Image src={selectedMeta.svgPath} alt={selectedMeta.label} fill className="object-contain" /></div>}</div>
      </div>
      <MillieTextarea label="Descrição curta" value={description} onChange={(event) => setDescription(event.target.value)} rows={2} maxLength={180} placeholder="Resumo mostrado no card da habilidade." />

      <section className="space-y-3 border-t border-bege-escuro/20 pt-4">
        <h3 className="font-title text-xs uppercase tracking-widest text-bege-medio">Despertar e evolução</h3>
        <MillieSelect label="Número de etapas (forma inicial + despertares)" options={LEVEL_OPTIONS} value={maxLevel} onChange={(event) => { const count = Number(event.target.value); setMaxLevel(event.target.value); setStages((current) => [...current.slice(0, count), ...createInitialSkillStages(count).slice(current.length)]) }} />
        {Number(maxLevel) >= 4 && <p className="text-xs text-amber-200/80">Despertares 4 e 5 exigem Rank B ou superior.</p>}
      </section>
      <SkillEvolutionStagesEditor count={Number(maxLevel)} stages={stages} onChange={setStages} branch={branch} baseName={name} />
      <MillieTextarea label="Interações e exceções da habilidade" value={interactions} onChange={(event) => setInteractions(event.target.value)} rows={3} />
      {error && <p role="alert" className="border border-red-400/30 bg-red-950/20 p-3 text-sm text-red-200">{error}</p>}
      <div className="flex justify-end gap-3 border-t border-bege-escuro/20 pt-4"><button type="button" onClick={handleClose} className="font-title text-xs uppercase tracking-widest text-bege-medio/60">Cancelar</button><PrimaryButton className="h-12 max-w-64 text-sm" onClick={submit} disabled={isPending}>{isPending ? "Criando…" : "Criar habilidade"}</PrimaryButton></div>
    </div>
  </MillieModal>
}
