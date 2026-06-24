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

const RARITY_OPTIONS: { value: InventoryRarity; label: string }[] = [
  { value: "comum", label: "Comum" },
  { value: "incomum", label: "Incomum" },
  { value: "raro", label: "Raro" },
  { value: "epico", label: "Épico" },
  { value: "lendario", label: "Lendário" },
  { value: "mitico", label: "Mítico" },
];

export default function CriarEquipamentoModal({ isOpen, onClose }: Props) {
  const [name, setName] = useState("");
  const [rarity, setRarity] = useState<InventoryRarity>("comum");
  const [forgedBy, setForgedBy] = useState("");
  const [effect, setEffect] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [worldSlug, setWorldSlug] = useState("");

  function handleClose() {
    setName(""); setRarity("comum"); setForgedBy("");
    setEffect(""); setQuantity("1"); setWorldSlug("");
    onClose();
  }

  function handleSubmit() {
    // TODO: conectar ao back-end
    console.log({ name, rarity, forgedBy, effect, quantity: Number(quantity), worldSlug, category: "equipamento" });
    handleClose();
  }

  return (
    <MillieModal isOpen={isOpen} onClose={handleClose} title="Criar Equipamento">
      <div className="space-y-4">
        <MillieInput
          label="Nome"
          placeholder="Ex: Espada da Aurora"
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
          placeholder="Ex: Kharadur"
          value={worldSlug}
          onChange={(e) => setWorldSlug(e.target.value)}
        />

        <MillieInput
          label="Forjado por"
          placeholder="Ex: Ferreiros do Vulcão"
          value={forgedBy}
          onChange={(e) => setForgedBy(e.target.value)}
        />

        <MillieTextarea
          label="Efeito"
          placeholder="Descreva o efeito ou propriedades do equipamento..."
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
          <PrimaryButton onClick={handleSubmit}>Criar Equipamento</PrimaryButton>
        </div>
      </div>
    </MillieModal>
  );
}