"use client"

import MillieInput from "@/componentes/ui/MillieInput"
import MillieTextarea from "@/componentes/ui/MillieTextarea"
import MillieSelect from "@/componentes/ui/MillieSelect"
import type { SkillBranch, SkillCardResult, SkillEvolutionStage } from "@/lib/types/skill"

const RANK_OPTIONS = ["E", "D", "C", "B", "A", "S"].map((rank) => ({ value: rank, label: `Rank ${rank}` }))
const RESOURCE_OPTIONS = [
  { value: "none", label: "Sem custo" },
  { value: "pm", label: "Pontos de Mana (PM)" },
  { value: "pv", label: "Pontos de Vida (PV)" },
]
const TEST_ATTRIBUTE_OPTIONS = ["", "Agilidade", "Inteligência", "Força", "Vigor", "Sorte", "Teste de Vontade"].map((value) => ({ value, label: value || "Sem teste" }))
const OUTCOME_OPTIONS = ["Fracasso crítico", "Fracasso", "Sucesso parcial", "Sucesso", "Sucesso excepcional"].map((value) => ({ value, label: value }))
const RANGE_PRESETS = ["Pessoal", "Toque (2 m)", "Curto (10 m)", "Médio (30 m)", "Longo (100 m)", "Visual"]
const RANGE_OPTIONS = [...RANGE_PRESETS, "Fórmula personalizada"].map((value) => ({ value, label: value }))
const POTENCY_OPTIONS = ["", "Ínfima", "Fraca", "Normal", "Forte", "Devastadora"].map((value) => ({ value, label: value || "Não se aplica" }))

export function createInitialSkillStages(count: number): SkillEvolutionStage[] {
  return Array.from({ length: count }, (_, index) => ({
    number: index + 1,
    name: index === 0 ? "Forma inicial" : `Despertar ${index + 1}`,
    requiredRank: index >= 3 ? "B" : "D",
    requiredCharacterLevel: 1,
    requirements: "",
    costResource: "none",
    costAmount: 0,
    range: "Pessoal",
    customRange: "",
    duration: "",
    potency: "",
    testAttribute: "",
    execution: "",
    trigger: "",
    enhances: "",
    results: [],
  }))
}

export function normalizeSkillStages(value: unknown, count: number, fallback?: Partial<SkillEvolutionStage>): SkillEvolutionStage[] {
  const defaults = createInitialSkillStages(count)
  const parsed = typeof value === "string" ? (() => { try { return JSON.parse(value) as unknown } catch { return [] } })() : value
  const saved = Array.isArray(parsed) ? parsed as Partial<SkillEvolutionStage>[] : []
  return defaults.map((stage, index) => {
    const old = saved[index]
    const legacy = index === 0 ? fallback : undefined
    const rawRange = old?.range ?? legacy?.range ?? stage.range
    const isPresetRange = RANGE_PRESETS.includes(String(rawRange))
    const customRange = old?.customRange ?? legacy?.customRange ?? (isPresetRange || rawRange === "Fórmula personalizada" ? "" : String(rawRange))
    return {
      ...stage,
      ...legacy,
      ...old,
      number: index + 1,
      requiredRank: old?.requiredRank ?? legacy?.requiredRank ?? stage.requiredRank,
      requiredCharacterLevel: Number(old?.requiredCharacterLevel ?? legacy?.requiredCharacterLevel ?? stage.requiredCharacterLevel),
      costAmount: Number(old?.costAmount ?? legacy?.costAmount ?? stage.costAmount),
      range: isPresetRange ? String(rawRange) : "Fórmula personalizada",
      customRange: String(customRange),
      results: Array.isArray(old?.results) ? old.results.map((result) => ({
        card: String(result.card ?? ""),
        outcome: String(result.outcome ?? "Sucesso parcial"),
        interpretation: String(result.interpretation ?? ""),
      })) : [],
    }
  })
}

type Props = {
  count: number
  stages: SkillEvolutionStage[]
  onChange: (stages: SkillEvolutionStage[]) => void
  branch?: SkillBranch
  baseName?: string
}

export default function SkillEvolutionStagesEditor({ count, stages, onChange, branch, baseName }: Props) {
  function updateStage(index: number, patch: Partial<SkillEvolutionStage>) {
    onChange(stages.map((stage, i) => i === index ? { ...stage, ...patch } : stage))
  }

  function updateResult(stageIndex: number, resultIndex: number, patch: Partial<SkillCardResult>) {
    const results = [...(stages[stageIndex]?.results ?? [])]
    results[resultIndex] = { ...results[resultIndex], ...patch }
    updateStage(stageIndex, { results })
  }

  return <section className="space-y-4 border-t border-bege-escuro/20 pt-4">
    <div>
      <h3 className="font-title text-xs uppercase tracking-widest text-bege-medio">Despertar e evolução</h3>
      <p className="mt-1 text-xs text-bege-claro/60">Cada forma pode ter seus próprios requisitos, custos, efeitos e interpretações das cartas.</p>
    </div>
    {stages.slice(0, count).map((stage, index) => <fieldset key={stage.number} className="space-y-3 border border-bege-escuro/30 bg-black/10 p-3 sm:p-4">
      <legend className="px-2 font-title text-xs uppercase tracking-widest text-bege-medio">{index === 0 ? `Forma inicial${baseName ? ` · ${baseName}` : ""}` : `Despertar ${index + 1}`}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {index > 0 && <MillieInput label="Nome da evolução" value={stage.name} onChange={(event) => updateStage(index, { name: event.target.value })} placeholder="Ex.: Manipulação de Água" />}
        <MillieSelect label="Rank mínimo" options={RANK_OPTIONS} value={stage.requiredRank} onChange={(event) => updateStage(index, { requiredRank: event.target.value })} />
        <MillieInput label="Nível necessário" type="number" min={1} value={stage.requiredCharacterLevel} onChange={(event) => updateStage(index, { requiredCharacterLevel: Number(event.target.value) })} />
        <MillieTextarea label="Requisitos adicionais" rows={2} value={stage.requirements} onChange={(event) => updateStage(index, { requirements: event.target.value })} placeholder="Ex.: professor, local ou Marcas de Uso" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <MillieTextarea label="Efeito / o que acontece" rows={3} value={stage.execution} onChange={(event) => updateStage(index, { execution: event.target.value })} />
        <div className="grid gap-3">
          <MillieSelect label="Recurso do custo" options={RESOURCE_OPTIONS} value={stage.costResource} onChange={(event) => updateStage(index, { costResource: event.target.value, costAmount: event.target.value === "none" ? 0 : stage.costAmount })} />
          <MillieInput label="Quantidade" type="number" min={0} value={stage.costAmount} disabled={stage.costResource === "none"} onChange={(event) => updateStage(index, { costAmount: Number(event.target.value) })} />
        </div>
        <div>
          <MillieSelect label="Alcance" options={RANGE_OPTIONS} value={stage.range} onChange={(event) => updateStage(index, { range: event.target.value })} />
          {stage.range === "Fórmula personalizada" && <MillieInput className="mt-2" label="Fórmula do alcance" value={stage.customRange} onChange={(event) => updateStage(index, { customRange: event.target.value })} placeholder="Ex.: Vigor × 2 m" />}
        </div>
        <MillieInput label="Duração" value={stage.duration} onChange={(event) => updateStage(index, { duration: event.target.value })} placeholder="Instantânea, 3 rodadas, cena…" />
        <MillieSelect label="Potência" options={POTENCY_OPTIONS} value={stage.potency} onChange={(event) => updateStage(index, { potency: event.target.value })} />
        <MillieSelect label="Atributo do teste" options={TEST_ATTRIBUTE_OPTIONS} value={stage.testAttribute} onChange={(event) => updateStage(index, { testAttribute: event.target.value })} />
      </div>
      {index === 0 && (branch === "reacao" || branch === "aprimoramento") && <div className="grid gap-3 sm:grid-cols-2">{branch === "reacao" && <MillieInput label="Gatilho da reação" value={stage.trigger} onChange={(event) => updateStage(index, { trigger: event.target.value })} placeholder="Quando a reação pode ser usada?" />}{branch === "aprimoramento" && <MillieInput label="Habilidade aprimorada" value={stage.enhances} onChange={(event) => updateStage(index, { enhances: event.target.value })} placeholder="Nome ou linha aprimorada" />}</div>}
      <div className="space-y-3 border-t border-bege-escuro/20 pt-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-title text-[10px] uppercase tracking-[0.18em] text-bege-escuro">Resultados por carta</h4>
          <button type="button" className="text-xs text-bege-medio underline" onClick={() => updateStage(index, { results: [...stage.results, { card: "", outcome: "Sucesso parcial", interpretation: "" }] })}>Adicionar resultado</button>
        </div>
        {stage.results.length === 0 && <p className="text-xs text-bege-claro/50">Adicione uma entrada para cada carta ou resultado previsto pelas regras.</p>}
        {stage.results.map((result, resultIndex) => <div key={resultIndex} className="grid gap-2 border border-bege-escuro/20 p-3 sm:grid-cols-2">
          <MillieInput label="Carta / condição" value={result.card} onChange={(event) => updateResult(index, resultIndex, { card: event.target.value })} placeholder="Ex.: O Louco, Ás, 1–3" />
          <div className="flex items-end gap-2"><div className="min-w-0 flex-1"><MillieSelect label="Resultado" options={OUTCOME_OPTIONS} value={result.outcome} onChange={(event) => updateResult(index, resultIndex, { outcome: event.target.value })} /></div><button type="button" aria-label="Remover resultado" className="mb-1 px-2 py-2 text-sm text-red-300" onClick={() => updateStage(index, { results: stage.results.filter((_, i) => i !== resultIndex) })}>Remover</button></div>
          <div className="sm:col-span-2"><MillieTextarea label="Interpretação / efeito desta carta" rows={2} value={result.interpretation} onChange={(event) => updateResult(index, resultIndex, { interpretation: event.target.value })} /></div>
        </div>)}
      </div>
    </fieldset>)}
  </section>
}
