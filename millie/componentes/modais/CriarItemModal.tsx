"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import MillieModal from "@/componentes/ui/MillieModal";
import MillieInput from "@/componentes/ui/MillieInput";
import MillieTextarea from "@/componentes/ui/MillieTextarea";
import MillieSelect from "@/componentes/ui/MillieSelect";
import { PrimaryButton } from "@/componentes/PrimaryButton";
import MillieImageUpload from "@/componentes/ui/MillieImageUpload";
import { createInventoryItem } from "@/app/actions/inventory";
import type { InventoryRarity } from "@/lib/types/inventory";

type Props = { isOpen: boolean; onClose: () => void };

type ItemCategory = "equipamento" | "consumivel" | "material" | "reliquia";

const CATEGORY_OPTIONS: { value: ItemCategory; label: string }[] = [
  { value: "equipamento", label: "Equipamento" },
  { value: "consumivel",  label: "Consumível"  },
  { value: "material",    label: "Material"    },
  { value: "reliquia",    label: "Relíquia"    },
];

const RARITY_OPTIONS: { value: InventoryRarity; label: string }[] = [
  { value: "comum",    label: "Comum"    },
  { value: "incomum",  label: "Incomum"  },
  { value: "raro",     label: "Raro"     },
  { value: "epico",    label: "Épico"    },
  { value: "lendario", label: "Lendário" },
  { value: "mitico",   label: "Mítico"   },
];

// campos extras por categoria
const FIELDS: Record<ItemCategory, { forgedBy: boolean; effect: boolean; origin: boolean }> = {
  equipamento: { forgedBy: true,  effect: true,  origin: false },
  consumivel:  { forgedBy: false, effect: true,  origin: true  },
  material:    { forgedBy: false, effect: false, origin: true  },
  reliquia:    { forgedBy: false, effect: true,  origin: true  },
};

export default function CriarItemModal({ isOpen, onClose }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [category, setCategory] = useState<ItemCategory>("equipamento");
  const [name,     setName]     = useState("");
  const [rarity,   setRarity]   = useState<InventoryRarity>("comum");
  const [quantity, setQuantity] = useState("1");
  const [worldSlug,setWorldSlug]= useState("");
  const [image,    setImage]    = useState("");
  const [forgedBy, setForgedBy] = useState("");
  const [effect,   setEffect]   = useState("");
  const [origin,   setOrigin]   = useState("");
  const [error,    setError]    = useState("");

  function reset() {
    setCategory("equipamento"); setName(""); setRarity("comum");
    setQuantity("1"); setWorldSlug(""); setImage("");
    setForgedBy(""); setEffect(""); setOrigin(""); setError("");
  }

  function handleClose() { reset(); onClose(); }

  function handleSubmit() {
    if (!name.trim()) { setError("Nome é obrigatório."); return; }
    setError("");
    startTransition(async () => {
      try {
        await createInventoryItem({
          name:      name.trim(),
          category,
          rarity,
          quantity:  Number(quantity),
          worldSlug: worldSlug || undefined,
          image:     image     || undefined,
          forgedBy:  forgedBy  || undefined,
          effect:    effect    || undefined,
          origin:    origin    || undefined,
        });
        router.refresh();
        handleClose();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Erro ao criar item.");
      }
    });
  }

  const fields = FIELDS[category];
  const categoryLabel = CATEGORY_OPTIONS.find((c) => c.value === category)?.label ?? "Item";

  return (
    <MillieModal isOpen={isOpen} onClose={handleClose} title="Criar Item no Inventário">
      <div className="space-y-4">

        {/* Categoria — primeiro campo, controla o resto */}
        <MillieSelect
          label="Categoria"
          options={CATEGORY_OPTIONS}
          value={category}
          onChange={(e) => {
            setCategory(e.target.value as ItemCategory);
            setForgedBy(""); setEffect(""); setOrigin("");
          }}
        />

        <MillieInput
          label="Nome"
          placeholder={
            category === "equipamento" ? "Ex: Espada da Noite" :
            category === "consumivel"  ? "Ex: Poção de Cura"   :
            category === "material"    ? "Ex: Escama de Dragão" :
                                         "Ex: Anel da Vigília"
          }
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

        {fields.forgedBy && (
          <MillieInput
            label="Forjado por"
            placeholder="Ex: Anões de Kharak"
            value={forgedBy}
            onChange={(e) => setForgedBy(e.target.value)}
          />
        )}

        {fields.origin && (
          <MillieInput
            label="Origem"
            placeholder="Ex: Floresta de Eldenmoor"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
          />
        )}

        {fields.effect && (
          <MillieTextarea
            label="Efeito"
            placeholder="Descreva o efeito..."
            rows={3}
            value={effect}
            onChange={(e) => setEffect(e.target.value)}
          />
        )}

        <MillieImageUpload
          label="Imagem (opcional)"
          value={image}
          onChange={setImage}
          aspectRatio="square"
        />

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex justify-end gap-3 border-t border-bege-escuro/20 pt-4">
          <button
            onClick={handleClose}
            className="font-title text-xs uppercase tracking-widest text-bege-medio/50 hover:text-bege-claro"
          >
            Cancelar
          </button>
          <PrimaryButton onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Criando..." : `Criar ${categoryLabel}`}
          </PrimaryButton>
        </div>

      </div>
    </MillieModal>
  );
}