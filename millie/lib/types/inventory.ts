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

export type InventoryChapter = {
  id: string;
  title: string;
  content: string;
};

interface BaseInventoryItem {
  id: string;
  slug: string;
  name: string;
  category: InventoryCategory;
  rarity: InventoryRarity;
  quantity: number;
  image?: string;
  description: string;
  worldSlug: string;
  isLocked?: boolean;
}

interface EquipmentItem extends BaseInventoryItem {
  category: "equipamento";
  forgedBy: string;
  effect: string;
}

interface ConsumableItem extends BaseInventoryItem {
  category: "consumivel";
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

interface BookItem extends BaseInventoryItem {
  category: "livro";
  author?: string;
  coverColor?: string;
  chapters: InventoryChapter[];
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