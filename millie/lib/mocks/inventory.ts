import type { InventoryItem } from "@/lib/types/inventory";

export const mockInventoryItems: InventoryItem[] = [
  {
    id: "item-espada-ferro-antigo",
    slug: "espada-ferro-antigo",
    name: "Espada de Ferro Antigo",
    category: "equipamento",
    rarity: "comum",
    quantity: 1,
    image: "/assets/images/inventory/espada.png",
    description: "Uma lâmina simples, marcada por batalhas antigas.",
    worldSlug: "escola-millie-munds",
    isLocked: false,
  },
  {
    id: "item-pocao-rubra",
    slug: "pocao-rubra",
    name: "Poção Rubra",
    category: "consumivel",
    rarity: "incomum",
    quantity: 12,
    image: "/assets/images/inventory/pocao-rubra.png",
    description: "Restaura parte da vitalidade de quem a bebe.",
    worldSlug: "escola-millie-munds",
    isLocked: false,
  },
];