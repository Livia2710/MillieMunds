"use client";

import { useState } from "react";
import MillieModal from "@/componentes/ui/MillieModal";
import MillieInput from "@/componentes/ui/MillieInput";
import MillieTextarea from "@/componentes/ui/MillieTextarea";
import MillieSelect from "@/componentes/ui/MillieSelect";
import {PrimaryButton} from "@/componentes/PrimaryButton";
import type { InventoryRarity } from "@/lib/types/inventory";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

// Artefato = RelicItem no sistema de tipos
const RARITY_OPTIONS: { value: InventoryRarity; label: string }[] = [
  { value: "comum", label: "Comum" },
  { value: "incomum", label: "Incomum" },
  { value: "raro", label: "Raro" },
  { value: "epico", label: "Épico" },
  { value: "lendario", label: "Lendário" },
  { value: "mitico", label: "Mítico" },
];

export default function CriarArtefatoModal({ isOpen, onClose }: Props) {
  const [name, setName] = useState("");
  const [rarity, setRarity] = useState<InventoryRarity>("comum");
  const [origin, setOrigin] = useState("");
  const [effect, setEffect] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [worldSlug, setWorldSlug] = useState("");

  function handleClose() {
    setName(""); setRarity("comum"); setOrigin("");
    setEffect(""); setQuantity("1"); setWorldSlug("");
    onClose();
  }

  function handleSubmit() {
    // TODO: conectar ao back-end
    console.log({ name, rarity, origin, effect, quantity: Number(quantity), worldSlug, category: "reliquia" });
    handleClose();
  }

  return (
    <MillieModal isOpen={isOpen} onClose={handleClose} title="Criar Artefato">
      <div className="space-y-4">
        <MillieInput
          label="Nome"
          placeholder="Ex: Anel da Vigília"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <MillieSelect
            label="Raridade"
            options={RARITY_OPTIONS}
            value={rarity}
            onChange={(e) => setRarity(e.target.value as InventoryRarity)}
          />
          <MillieInput
            label="Quantidade"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>

        <MillieInput
          label="Mundo de Origem"
          placeholder="Ex: Aethelgard"
          value={worldSlug}
          onChange={(e) => setWorldSlug(e.target.value)}
        />

        <MillieInput
          label="Origem"
          placeholder="Ex: Forjado pelos Anões de Kharadur"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
        />

        <MillieTextarea
          label="Efeito"
          placeholder="Descreva o efeito mágico do artefato..."
          rows={3}
          value={effect}
          onChange={(e) => setEffect(e.target.value)}
        />

        <div className="flex justify-end gap-3 border-t border-bege-escuro/20 pt-4">
          <button
            onClick={handleClose}
            className="font-title text-xs uppercase tracking-widest text-bege-medio/50 transition-colors hover:text-bege-claro"
          >
            Cancelar
          </button>
          <PrimaryButton onClick={handleSubmit}>Criar Artefato</PrimaryButton>
        </div>
      </div>
    </MillieModal>
  );
}