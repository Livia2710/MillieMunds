"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import MillieModal from "@/componentes/ui/MillieModal";
import MillieInput from "@/componentes/ui/MillieInput";
import MillieTextarea from "@/componentes/ui/MillieTextarea";
import MillieSelect from "@/componentes/ui/MillieSelect";
import { PrimaryButton } from "@/componentes/PrimaryButton";
import type { InventoryRarity } from "@/lib/types/inventory";
import { createInventoryItem } from "@/app/actions/inventory";
import MillieImageUpload from "../ui/MillieImageUpload";

type Props = { isOpen: boolean; onClose: () => void }

const RARITY_OPTIONS: { value: InventoryRarity; label: string }[] = [
  { value: "comum", label: "Comum" }, { value: "incomum", label: "Incomum" },
  { value: "raro", label: "Raro" }, { value: "epico", label: "Épico" },
  { value: "lendario", label: "Lendário" }, { value: "mitico", label: "Mítico" },
]

export default function CriarArtefatoModal({ isOpen, onClose }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState("")
  const [rarity, setRarity] = useState<InventoryRarity>("comum")
  const [origin, setOrigin] = useState("")
  const [effect, setEffect] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [worldSlug, setWorldSlug] = useState("")
  const [image, setImage] = useState("")
  const [error, setError] = useState("")

  function handleClose() {
    setName(""); setRarity("comum"); setOrigin("")
    setEffect(""); setQuantity("1"); setWorldSlug(""); setError(""); onClose()
  }

  function handleSubmit() {
    if (!name.trim()) { setError("Nome é obrigatório."); return }
    setError("")
    startTransition(async () => {
      try {
        await createInventoryItem({ name: name.trim(), category: "reliquia", rarity, quantity: Number(quantity), worldSlug, origin, effect })
        router.refresh()
        handleClose()
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Erro ao criar artefato.")
      }
    })
  }

  return (
    <MillieModal isOpen={isOpen} onClose={handleClose} title="Criar Artefato">
      <div className="space-y-4">
        <MillieInput label="Nome" placeholder="Ex: Anel da Vigília" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <MillieSelect label="Raridade" options={RARITY_OPTIONS} value={rarity} onChange={(e) => setRarity(e.target.value as InventoryRarity)} />
          <MillieInput label="Quantidade" type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </div>
        <MillieInput label="Mundo de Origem" placeholder="Ex: Aethelgard" value={worldSlug} onChange={(e) => setWorldSlug(e.target.value)} />
        <MillieInput label="Origem" placeholder="Ex: Forjado pelos Anões" value={origin} onChange={(e) => setOrigin(e.target.value)} />
        <MillieTextarea label="Efeito" placeholder="Descreva o efeito mágico..." rows={3} value={effect} onChange={(e) => setEffect(e.target.value)} />
          <MillieImageUpload
          label="Imagem (opcional)"
          value={image}
          onChange={setImage}
          aspectRatio="portrait" // para personagem
          // aspectRatio="square" // para artefato/equipamento
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex justify-end gap-3 border-t border-bege-escuro/20 pt-4">
          <button onClick={handleClose} className="font-title text-xs uppercase tracking-widest text-bege-medio/50 hover:text-bege-claro">Cancelar</button>
          <PrimaryButton onClick={handleSubmit} disabled={isPending}>{isPending ? "Criando..." : "Criar Artefato"}</PrimaryButton>
        </div>
      </div>
    </MillieModal>
  )
}