"use client"

import { useState, useTransition, useEffect } from "react" // Corrigido: adicionado useEffect
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
import { createSkill } from "@/app/actions/skill"
import { getCharactersByActiveCampaign } from "@/app/actions/character"

type Props = { isOpen: boolean; onClose: () => void }

const BRANCH_OPTIONS: { value: SkillBranch; label: string }[] = [
  { value: "ativa", label: "Ativa" },
  { value: "passiva", label: "Passiva" },
  { value: "reacao", label: "Reação" },
  { value: "aprimoramento", label: "Aprimoramento" },
]

const ELEMENT_OPTIONS = Object.values(ELEMENT_META).map((m) => ({ value: m.element, label: m.label }))
const MAX_LEVEL_OPTIONS = [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} nível${n > 1 ? "s" : ""}` }))

export default function CriarHabilidadeModal({ isOpen, onClose }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  // Estados corrigidos para evitar inputs não controlados (undefined)
  const [characterId, setCharacterId] = useState("")
  const [characters, setCharacters] = useState<{ id: string; name: string }[]>([])
  const [charsLoaded, setCharsLoaded] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [branch, setBranch] = useState<SkillBranch>("ativa")
  const [element, setElement] = useState<CharacterElement>("fogo")
  const [maxLevel, setMaxLevel] = useState("3")
  const [requiredLevel, setRequiredLevel] = useState("1") // Corrigido: alterado para string para o input HTML
  const [error, setError] = useState("")

  const selectedMeta = ELEMENT_META[element]

  function handleClose() {
    setName("")
    setDescription("")
    setBranch("ativa")
    setElement("fogo")
    setMaxLevel("3")
    setRequiredLevel("1")
    setCharacterId("")
    setError("")
    onClose()
  }

  function handleSubmit() {
    if (!characterId) {
      setError("Selecione um personagem.")
      return
    }
    if (!name.trim()) {
      setError("Nome é obrigatório.")
      return
    }

    setError("")
    startTransition(async () => {
      try {
        await createSkill({
          characterId,
          name: name.trim(),
          description,
          branch,
          element,
          maxLevel: Number(maxLevel),
          requiredCharacterLevel: Number(requiredLevel),
        })
        router.refresh()
        handleClose()
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Erro ao criar habilidade.")
      }
    })
  }

  useEffect(() => {
    if (isOpen && !charsLoaded) {
      getCharactersByActiveCampaign().then((chars) => {
        setCharacters(chars.map((c) => ({ id: c.id, name: c.name })))
        setCharsLoaded(true)
      })
    }
  }, [isOpen, charsLoaded])

  const CHARACTER_OPTIONS = characters.map((c) => ({ value: c.id, label: c.name }))

  return (
    // Corrigido: removido o atributo onAfterOpen={handleOpen} que quebrava o app
    <MillieModal isOpen={isOpen} onClose={handleClose} title="Criar Habilidade">
      <div className="space-y-4">
        {/* Personagem */}
        <MillieSelect
          label="Personagem"
          options={[{ value: "", label: charsLoaded ? "Selecione..." : "Carregando..." }, ...CHARACTER_OPTIONS]}
          value={characterId}
          onChange={(e) => setCharacterId(e.target.value)}
        />

        <MillieInput
          label="Nome"
          placeholder="Ex: Chama Eterna"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <MillieTextarea
          label="Descrição"
          placeholder="Descreva o efeito..."
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <MillieSelect
            label="Tipo (Branch)"
            options={BRANCH_OPTIONS}
            value={branch}
            onChange={(e) => setBranch(e.target.value as SkillBranch)}
          />

          <div className="flex flex-col gap-1.5">
            <label className="font-title text-[10px] uppercase tracking-[0.2em] text-bege-escuro">Elemento</label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <MillieSelect
                  options={ELEMENT_OPTIONS}
                  value={element}
                  onChange={(e) => setElement(e.target.value as CharacterElement)}
                />
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
          <MillieSelect
            label="Nível Máximo"
            options={MAX_LEVEL_OPTIONS}
            value={maxLevel}
            onChange={(e) => setMaxLevel(e.target.value)}
          />
          <MillieInput
            label="Nível mín. do personagem"
            type="number"
            min={1}
            max={20}
            value={requiredLevel}
            onChange={(e) => setRequiredLevel(e.target.value)}
          />
        </div>

        {selectedMeta && (
          <div className="flex items-center gap-3 border px-4 py-3" style={{ borderColor: selectedMeta.color + "40" }}>
            <div className="relative h-6 w-6 shrink-0">
              <Image src={selectedMeta.svgPath} alt="" fill className="object-contain" />
            </div>
            <div>
              <p className="font-title text-xs uppercase tracking-widest" style={{ color: selectedMeta.color }}>
                {selectedMeta.label}
              </p>
              <p className="font-body text-[11px] text-bege-medio/50">Habilidade de {branch}</p>
            </div>
          </div>
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex justify-end gap-3 border-t border-bege-escuro/20 pt-4">
          <button onClick={handleClose} className="font-title text-xs uppercase tracking-widest text-bege-medio/50 hover:text-bege-claro">
            Cancelar
          </button>
          <PrimaryButton onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Criando..." : "Criar Habilidade"}
          </PrimaryButton>
        </div>
      </div>
    </MillieModal>
  )
}
