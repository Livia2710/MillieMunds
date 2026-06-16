export type InventoryCategory =
  | "equipamento"
  | "consumivel"
  | "material"
  | "reliquia"
  | "outro";

export type InventoryRarity =
  | "comum"
  | "incomum"
  | "raro"
  | "epico"
  | "lendario"
  | "mitico";

export type InventoryItem = {
  id: string;
  slug: string;
  name: string;
  category: InventoryCategory;
  rarity: InventoryRarity;
  quantity: number;
  image?: string;
  description?: string;
  worldSlug: string;
  isLocked?: boolean;
};