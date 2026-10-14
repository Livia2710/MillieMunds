export type InventoryCategory =
  | "equipamento"
  | "consumivel"
  | "material"
  | "reliquia"
  | "livro"
  | "outro";

export type InventoryRarity =
  | "comum"
  | "incomum"
  | "raro"
  | "epico"
  | "lendario"
  | "mitico";

export type EquipmentType = "arma" | "armadura" | "escudo" | "outro";
export type EquipmentSubtype = "corpo_a_corpo" | "leve" | "distancia" | "foco_magico" | "leve_armadura" | "media_armadura" | "pesada_armadura";
export type ConsumableType = "cura_pv" | "cura_pm" | "outro";
export type EquipmentEffectRule = "perfurante" | "contundente" | "longa" | "elemental" | "espiritual" | "rapida" | "resistencia" | "leveza" | "firmeza" | "reflexo" | "protecao" | "bloqueio" | "custom";
export type EquipmentEffectRecord = {
  id: string;
  rule: EquipmentEffectRule;
  name: string;
  description: string;
};

export const EQUIPMENT_TYPES: { value: EquipmentType; label: string }[] = [
  { value: "arma", label: "Arma" },
  { value: "armadura", label: "Armadura" },
  { value: "escudo", label: "Escudo" },
  { value: "outro", label: "Outro" },
];

export type NativeEquipmentEffect = { rule: Exclude<EquipmentEffectRule, "custom" | "protecao" | "bloqueio">; name: string; description: string };
export const NATIVE_EQUIPMENT_EFFECTS: Record<Exclude<EquipmentType, "outro">, NativeEquipmentEffect[]> = {
  arma: [
    { rule: "perfurante", name: "Perfurante", description: "Ignora a redução da armadura (não ignora resistências)." },
    { rule: "contundente", name: "Contundente", description: "Em um Excepcional, deixa o alvo Caído ou Empurrado." },
    { rule: "longa", name: "Longa", description: "Aumenta o alcance para Curto em vez de Toque." },
    { rule: "elemental", name: "Elemental", description: "O dano usa um elemento e pode aplicar sua condição em um Excepcional." },
    { rule: "espiritual", name: "Espiritual", description: "O dano é mental/espiritual; armadura não reduz." },
    { rule: "rapida", name: "Rápida", description: "+1 na ordem de ação do dono." },
  ],
  armadura: [
    { rule: "resistencia", name: "Resistência", description: "Reduz em um degrau o dano do tipo indicado." },
    { rule: "leveza", name: "Leveza", description: "Reduz em 1 a penalidade de Agilidade da armadura (mínimo 0)." },
    { rule: "firmeza", name: "Firmeza", description: "+1 no teste contra uma condição indicada." },
  ],
  escudo: [
    { rule: "resistencia", name: "Resistência", description: "Reduz em um degrau o dano do tipo indicado." },
    { rule: "leveza", name: "Leveza", description: "Reduz em 1 a penalidade de Agilidade da armadura (mínimo 0)." },
    { rule: "firmeza", name: "Firmeza", description: "+1 no teste contra uma condição indicada." },
    { rule: "reflexo", name: "Reflexo", description: "Em um Excepcional no bloqueio, permite contra-atacar sem gastar ação." },
  ],
};

export type InventoryChapter = {
  id: string;
  title: string;
  content: string;
};

type BookCover =
  | {
      coverType: "image";
      coverImage: string;
      coverColor?: never;
    }
  | {
      coverType: "color";
      coverColor: string;
      coverImage?: never;
    };

type BookItem = BaseInventoryItem & BookCover & {
  category: "livro";
  pageColor?: string;
  pageTexture?: boolean;
  pageHeader?: string;
  pageFooter?: string;
  author?: string;
  chapters: InventoryChapter[];
};



interface BaseInventoryItem {
  id: string;
  slug: string;
  name: string;
  category: InventoryCategory;
  rarity: InventoryRarity;
  quantity: number;
  image?: string;
  worldSlug: string;
  isLocked?: boolean;
}

interface EquipmentItem extends BaseInventoryItem {
  category: "equipamento";
  forgedBy: string;
  effect: string;
  equipmentType?: EquipmentType;
  equipmentSubtype?: EquipmentSubtype;
  equipmentEffects?: EquipmentEffectRecord[];
  equipmentDurability?: number | null;
  equipmentMaxDurability?: number | null;
}

interface ConsumableItem extends BaseInventoryItem {
  category: "consumivel";
  consumableType?: ConsumableType;
  ownerId?: string | null;
  origin: string;
  effect: string;
}

interface MaterialItem extends BaseInventoryItem {
  category: "material";
  origin: string;
  effect?: string;
}

interface RelicItem extends BaseInventoryItem {
  category: "reliquia";
  origin: string;
  effect: string;
}


interface OtherItem extends BaseInventoryItem {
  category: "outro";
  origin?: string;
  effect?: string;
}

export type InventoryItem =
  | EquipmentItem
  | ConsumableItem
  | MaterialItem
  | RelicItem
  | BookItem
  | OtherItem;
