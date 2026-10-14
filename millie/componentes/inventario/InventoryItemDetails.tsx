import Image from "next/image";
import type { InventoryItem } from "@/lib/types/inventory";
import { getEquipmentPrice, getEquipmentMaxDurability, getPotionPrice } from "@/lib/utils/equipment";
import CurrencyDisplay from "@/componentes/moedas/CurrencyDisplay";
import EquipmentDurabilityControl from "@/componentes/inventario/EquipmentDurabilityControl";
import UseHealingPotionControl from "@/componentes/inventario/UseHealingPotionControl";

type RegularInventoryItem = Exclude<InventoryItem, { category: "livro" }>;

type InventoryItemDetailsProps = {
  item: RegularInventoryItem;
  isMaster?: boolean;
  canUseConsumable?: boolean;
};

type DetailField = { label: string; value?: string; currencyAmount?: number };

const equipmentTypeLabels: Record<string, string> = {
  arma: "Arma", armadura: "Armadura", escudo: "Escudo", outro: "Outro",
};
const equipmentSubtypeLabels: Record<string, string> = { corpo_a_corpo: 'Corpo a corpo', leve: 'Leve', distancia: 'À distância', foco_magico: 'Foco mágico', leve_armadura: 'Leve', media_armadura: 'Média', pesada_armadura: 'Pesada' };

const rarityCrests: Record<string, string> = {
  comum: "/assets/svgs/raridade/Comum.svg",
  incomum: "/assets/svgs/raridade/Incomum.svg",
  raro: "/assets/svgs/raridade/Raro.svg",
  epico: "/assets/svgs/raridade/Epico.svg",
  lendario: "/assets/svgs/raridade/Lendario.svg",
  mitico: "/assets/svgs/raridade/Mitico.svg",
};
const categoryLabels: Record<string, string> = {
  equipamento: "Equipamento", consumivel: "Consumível", material: "Material",
  reliquia: "Artefato", livro: "Livro", outro: "Outro",
};
function potionEffect(rarity: string, type: 'cura_pv' | 'cura_pm') {
  const percentages: Record<string, number> = { comum: 15, incomum: 25, raro: 40, epico: 40, lendario: 60, mitico: 60 };
  const resource = type === 'cura_pv' ? 'PV' : 'PM';
  const extra = rarity === 'epico' ? ' e remove 1 condição' : rarity === 'mitico' ? ' e remove todas as condições' : '';
  return `Recupera ${percentages[rarity] ?? 0}% dos ${resource} máximos${extra}.`;
}

function getSpecificFields(item: RegularInventoryItem): DetailField[] {
  switch (item.category) {
    case "equipamento":
      return [
        { label: "Tipo", value: equipmentTypeLabels[item.equipmentType ?? ""] ?? "Não definido" },
        ...(item.equipmentSubtype ? [{ label: "Subtipo", value: equipmentSubtypeLabels[item.equipmentSubtype] ?? item.equipmentSubtype }] : []),
        { label: "Preço base", currencyAmount: getEquipmentPrice(item.rarity, item.equipmentSubtype) },
        { label: "Forjado por", value: item.forgedBy },
        { label: "Efeitos", value: item.equipmentEffects?.length
          ? item.equipmentEffects.map(effect => `${effect.name}${effect.rule === 'custom' ? ' · personalizado' : ' · propriedade nativa'}\n${effect.description}`).join("\n\n")
          : item.effect || "Nenhum efeito cadastrado" },
      ];

    case "consumivel":
    case "reliquia":
      return [
        { label: "Origem", value: item.origin },
        ...(item.category === 'consumivel' ? [{ label: "Preço base", currencyAmount: getPotionPrice(item.rarity) }] : []),
        { label: "Efeito", value: item.category === 'consumivel' && item.consumableType && item.consumableType !== 'outro' ? potionEffect(item.rarity, item.consumableType) : item.effect },
      ];

    case "material":
      return [
        { label: "Origem", value: item.origin },
        { label: "Efeito", value: item.effect ?? "Nenhum efeito conhecido" },
      ];

    case "outro":
      return [
        { label: "Origem", value: item.origin ?? "Origem desconhecida" },
        { label: "Efeito", value: item.effect ?? "Nenhum efeito conhecido" },
      ];
  }
}

export default function InventoryItemDetails({ item, isMaster = false, canUseConsumable = false }: InventoryItemDetailsProps) {

  const fields = getSpecificFields(item);

  return (
    <main className=" min-h-screen  bg-roxo-escuro  px-5 py-8 text-bege-medio md:px-16 md:py-1 ">

      <section className=" mx-auto  max-w-6xl grid gap-8 md:grid-cols-[260px_1fr] md:gap-1 ">

        {/* IMAGEM */}
        <div className="arcane-hover overflow-hidden mx-auto flex aspect-square w-full max-w-[220px] items-center justify-center border border-bege-escuro/40 bg-roxo-escuro/50 p-4 shadow-card md:max-w-[260px ">

          {item.image ? (
            <>
            <Image
            src={rarityCrests[item.rarity]}
            alt=""
            width={32}
            height={32}
            className=" pointer-events-none absolute left-1 top-2 h-8 w-8 object-contain opacity-80"
            />
            <Image
              src={item.image}
              alt={item.name}
              width={260}
              height={260}
              className="h-full w-full object-contain"/>
              </>
          ) : (
            <span className=" font-title text-xs uppercase tracking-widest text-bege-medio/40">
              Sem imagem
            </span>
          )}

        </div>

        {/* CONTEÚDO */}
        <div>

          <div className="flex items-center gap-3 md:justify-start max-md:flex-col max-md:text-center">

            <p className=" font-title text-xs uppercase tracking-[0.25em] text-bege-escuro">
            {categoryLabels[item.category] ?? item.category} / {item.rarity}
            </p>
          </div>

          <h1 className=" mt-3 font-title text-4xl uppercase tracking-[0.08em] text-bege-claro text-center md:text-left md:text-6xl">
            {item.name}
          </h1>

          <Image
            src="/assets/svgs/divider.svg"
            alt=""
            width={320}
            height={24}
            className="mt-3 opacity-70"
          />
          
          <div className=" mt-8 border-t border-bege-escuro/30 pt-6 grid gap-3">

            <DetailLine
              label="Quantidade"
              value={String(item.quantity)}
            />

            <DetailLine
              label="Mundo"
              value={item.worldSlug}
            />

            {fields.map((field)=>(
              <DetailLine
                key={field.label}
                label={field.label}
                value={field.value}
                currencyAmount={field.currencyAmount}
              />
            ))}

            {item.category === 'equipamento' && item.equipmentType !== 'outro' && <EquipmentDurabilityControl itemId={item.id} durability={item.equipmentDurability ?? null} maxDurability={item.equipmentMaxDurability ?? getEquipmentMaxDurability(item.rarity)} isMaster={isMaster} />}
            {item.category === 'consumivel' && <UseHealingPotionControl itemId={item.id} type={item.consumableType} canUse={canUseConsumable} />}

          </div>
        </div>
      </section>
    </main>
  );
}

function DetailLine({
  label,
  value,
  currencyAmount,
}:{
  label:string;
  value?:string;
  currencyAmount?:number;
}){
return (
  <p className=" flex flex-col gap-1 border-b border-bege-escuro/15 pb-3 sm:flex-row sm:gap-3">
    <strong className=" min-w-32 font-title text-xs uppercase text-bege-escuro">
    {label}:
    </strong>

    <span className="whitespace-pre-line text-bege-claro/90">
    {currencyAmount !== undefined ? <CurrencyDisplay amount={currencyAmount} iconSize={20} /> : value}
    </span>
  </p>
);
}
