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
import { EQUIPMENT_TYPES, NATIVE_EQUIPMENT_EFFECTS, type ConsumableType, type EquipmentEffectRule, type EquipmentSubtype, type EquipmentType, type InventoryRarity } from "@/lib/types/inventory";
import { getArmorProtection, getEquipmentMaxDurability, getEquipmentPropertyLimit, getShieldBlockBonus, getWeaponPotency } from "@/lib/utils/equipment";
import { useToast } from "@/componentes/ui/ToastProvider";

type Props = { isOpen: boolean; onClose: () => void };

type ItemCategory = "equipamento" | "consumivel" | "material" | "reliquia";

const CATEGORY_OPTIONS: { value: ItemCategory; label: string }[] = [
  { value: "equipamento", label: "Equipamento" },
  { value: "consumivel",  label: "Consumível"  },
  { value: "material",    label: "Material"    },
  { value: "reliquia",    label: "Artefato"    },
];
type EquipmentEffectDraft = { rule: EquipmentEffectRule; name: string; description: string };

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
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const [category, setCategory] = useState<ItemCategory>("equipamento");
  const [name,     setName]     = useState("");
  const [rarity,   setRarity]   = useState<InventoryRarity>("comum");
  const [quantity, setQuantity] = useState("1");
  const [worldSlug,setWorldSlug]= useState("");
  const [image,    setImage]    = useState("");
  const [forgedBy, setForgedBy] = useState("");
  const [effect,   setEffect]   = useState("");
  const [equipmentType, setEquipmentType] = useState<EquipmentType>("arma");
  const [equipmentSubtype, setEquipmentSubtype] = useState<EquipmentSubtype>("corpo_a_corpo");
  const [equipmentEffects, setEquipmentEffects] = useState<EquipmentEffectDraft[]>([]);
  const [customEffectName, setCustomEffectName] = useState("");
  const [customEffectDescription, setCustomEffectDescription] = useState("");
  const [origin,   setOrigin]   = useState("");
  const [consumableType, setConsumableType] = useState<ConsumableType>("cura_pv");
  const [error,    setError]    = useState("");

  function reset() {
    setCategory("equipamento"); setName(""); setRarity("comum");
    setQuantity("1"); setWorldSlug(""); setImage("");
    setForgedBy(""); setEffect(""); setOrigin(""); setConsumableType("cura_pv"); setEquipmentType("arma"); setEquipmentSubtype("corpo_a_corpo");
    setEquipmentEffects([]); setCustomEffectName(""); setCustomEffectDescription(""); setError("");
  }

  function handleClose() { reset(); onClose(); }

  function addNativeEffect(rule: EquipmentEffectRule) {
    if (equipmentType === "outro") return;
    if (equipmentEffects.length >= propertyLimit) return;
    const preset = NATIVE_EQUIPMENT_EFFECTS[equipmentType].find(effect => effect.rule === rule);
    if (!preset || equipmentEffects.some(existing => existing.rule === preset.rule)) return;
    setEquipmentEffects(current => [...current, preset]);
  }

  function addCustomEffect() {
    if (equipmentEffects.length >= propertyLimit) {
      setError(`Este equipamento permite até ${propertyLimit} propriedade(s).`);
      return;
    }
    if (!customEffectName.trim() || !customEffectDescription.trim()) {
      setError("Preencha o nome e a descrição do efeito personalizado.");
      return;
    }
    setEquipmentEffects(current => [...current, {
      rule: "custom", name: customEffectName.trim(), description: customEffectDescription.trim(),
    }]);
    setCustomEffectName("");
    setCustomEffectDescription("");
    setError("");
  }

  function effectValue(item: EquipmentEffectDraft) {
    if (item.rule !== 'custom') return 'Propriedade nativa';
    return 'Descrição personalizada';
  }

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
          effect: category === "equipamento"
            ? equipmentEffects.map(item => `${item.name}: ${item.description} (${effectValue(item)})`).join("\n") || undefined
            : effect || undefined,
          equipmentType: category === "equipamento" ? equipmentType : undefined,
          equipmentSubtype: category === "equipamento" ? equipmentSubtype : undefined,
          equipmentEffects: category === "equipamento" ? equipmentEffects : undefined,
          consumableType: category === "consumivel" ? consumableType : undefined,
          origin:    origin    || undefined,
        });
        router.refresh();
        toast.success("Item criado com sucesso.");
        handleClose();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erro ao criar item.";
        setError(message);
        toast.error(message);
      }
    });
  }

  const fields = FIELDS[category];
  const categoryLabel = CATEGORY_OPTIONS.find((c) => c.value === category)?.label ?? "Item";
  const propertyLimit = equipmentType === 'outro' ? 8 : getEquipmentPropertyLimit(rarity);

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

        {category === "consumivel" && <MillieSelect label="Tipo de consumível" options={[{value:"cura_pv",label:"Poção de cura · PV"},{value:"cura_pm",label:"Poção de recuperação · PM"},{value:"outro",label:"Outro consumível"}]} value={consumableType} onChange={event => setConsumableType(event.target.value as ConsumableType)} />}

        {fields.effect && (
          <>
            {category !== "equipamento" && <MillieTextarea
              label="Efeito"
              placeholder="Descreva o efeito..."
              rows={3}
              value={effect}
              onChange={(e) => setEffect(e.target.value)}
            />}
            {category === "equipamento" && <div className="space-y-4 border border-bege-escuro/20 p-3">
              <MillieSelect label="Categoria do equipamento" options={EQUIPMENT_TYPES} value={equipmentType} onChange={event => { const next = event.target.value as EquipmentType; setEquipmentType(next); if (next === 'arma') setEquipmentSubtype('corpo_a_corpo'); if (next === 'armadura') setEquipmentSubtype('leve_armadura'); setEquipmentEffects(current => current.filter(item => item.rule === 'custom')); }} />
              {equipmentType === 'arma' && <MillieSelect label="Tipo de arma" options={[{value:'corpo_a_corpo',label:'Corpo a corpo'},{value:'leve',label:'Leve'},{value:'distancia',label:'À distância'},{value:'foco_magico',label:'Foco mágico'}]} value={equipmentSubtype} onChange={event => setEquipmentSubtype(event.target.value as EquipmentSubtype)} />}
              {equipmentType === 'armadura' && <MillieSelect label="Tipo de armadura" options={[{value:'leve_armadura',label:'Leve · 5 pp'},{value:'media_armadura',label:'Média · 10 pp (−1 Agilidade)'},{value:'pesada_armadura',label:'Pesada · 15 pp (−2 Agilidade)'}]} value={equipmentSubtype} onChange={event => setEquipmentSubtype(event.target.value as EquipmentSubtype)} />}
              {equipmentType !== 'outro' && <p className="text-[11px] text-bege-escuro/80">{equipmentType === 'arma' ? `Potência: ${getWeaponPotency(rarity)} · Durabilidade: ${getEquipmentMaxDurability(rarity) ?? 'não se desgasta'}` : equipmentType === 'armadura' ? `Proteção: ${getArmorProtection(equipmentSubtype, rarity)} pp · Durabilidade: ${getEquipmentMaxDurability(rarity) ?? 'não se desgasta'}` : `Bônus de bloqueio: +${getShieldBlockBonus(rarity)} · Durabilidade: ${getEquipmentMaxDurability(rarity) ?? 'não se desgasta'}`}</p>}

              {equipmentType !== "outro" && <div className="space-y-2 border border-bege-escuro/15 p-3">
                <p className="font-title text-[10px] uppercase tracking-widest text-bege-medio">Propriedades nativas</p>
                {NATIVE_EQUIPMENT_EFFECTS[equipmentType].map(nativeEffect => {
                  const alreadyAdded = equipmentEffects.some(item => item.rule === nativeEffect.rule);
                  return <div key={nativeEffect.rule} className="flex items-center justify-between gap-2 border-t border-bege-escuro/10 pt-2">
                    <span className="text-xs"><strong>{nativeEffect.name}</strong><span className="block text-bege-escuro/80">{nativeEffect.description}</span></span>
                    <button type="button" disabled={alreadyAdded || equipmentEffects.length >= propertyLimit} onClick={() => addNativeEffect(nativeEffect.rule)} className="min-h-9 shrink-0 border border-bege-medio/40 px-2 text-[9px] uppercase tracking-widest disabled:opacity-40">{alreadyAdded ? "Adicionado" : "Adicionar"}</button>
                  </div>;
                })}
              </div>}

              <div className="space-y-2 border border-bege-escuro/15 p-3">
                <p className="font-title text-[10px] uppercase tracking-widest text-bege-medio">Novo efeito personalizado</p>
                <MillieInput label="Nome do efeito" placeholder="Ex.: Retorno de energia" value={customEffectName} onChange={event => setCustomEffectName(event.target.value)} />
                <MillieTextarea label="O que ele faz" placeholder="Descreva o efeito para jogadores e Mestre..." rows={2} value={customEffectDescription} onChange={event => setCustomEffectDescription(event.target.value)} />
                <div className="flex items-end gap-2">
                  <button type="button" disabled={equipmentEffects.length >= propertyLimit} onClick={addCustomEffect} className="min-h-10 shrink-0 border border-bege-medio/40 px-3 text-[10px] uppercase tracking-widest disabled:opacity-40">Adicionar efeito</button>
                </div>
                <p className="text-[11px] text-bege-escuro/80">Propriedades: {equipmentEffects.length}/{propertyLimit}. Equipamento Mítico pode ter uma propriedade única.</p>
                <p className="text-[11px] text-bege-escuro/80">Os valores de potência, proteção, bloqueio e durabilidade vêm do tipo e da raridade. Efeitos personalizados ficam descritos no item e são resolvidos pelo Mestre.</p>
              </div>

              {equipmentEffects.length > 0 && <ul className="space-y-2" aria-label="Efeitos adicionados">
                {equipmentEffects.map((item, index) => <li key={`${item.rule}-${item.name}-${index}`} className="flex items-start justify-between gap-3 border border-bege-escuro/15 p-2 text-xs">
                  <span><strong>{item.name}</strong> · {item.description}<span className="block text-bege-medio">{effectValue(item)}</span></span>
                  <button type="button" onClick={() => setEquipmentEffects(current => current.filter((_, currentIndex) => currentIndex !== index))} aria-label={`Remover efeito ${item.name}`} className="text-red-200">Remover</button>
                </li>)}
              </ul>}
            </div>}
          </>
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
