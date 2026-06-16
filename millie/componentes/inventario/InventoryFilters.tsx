import type { Dispatch, SetStateAction, ReactNode } from "react";
import type {
  InventoryCategoryFilter,
  InventoryRarityFilter,
} from "./InventoryGrid";

type InventoryFiltersProps = {
  category: InventoryCategoryFilter;
  setCategory: Dispatch<SetStateAction<InventoryCategoryFilter>>;
  rarity: InventoryRarityFilter;
  setRarity: Dispatch<SetStateAction<InventoryRarityFilter>>;
  variant?: "desktop" | "mobile";
};

const categories: { label: string; value: InventoryCategoryFilter }[] = [
  { label: "Todos", value: "todos" },
  { label: "Equipamentos", value: "equipamento" },
  { label: "Consumíveis", value: "consumivel" },
  { label: "Materiais", value: "material" },
  { label: "Relíquias", value: "reliquia" },
  { label: "Outros", value: "outro" },
];

const rarities: { label: string; value: InventoryRarityFilter }[] = [
  { label: "Comum", value: "comum" },
  { label: "Incomum", value: "incomum" },
  { label: "Raro", value: "raro" },
  { label: "Épico", value: "epico" },
  { label: "Lendário", value: "lendario" },
  { label: "Mítico", value: "mitico" },
];

const rarityCrests: Record<string, string> = {
  comum: "/assets/svgs/C.svg",
  incomum: "/assets/svgs/E.svg",
  raro: "/assets/svgs/B.svg",
  epico: "/assets/svgs/A.svg",
  lendario: "/assets/svgs/S.svg",
  mitico: "/assets/svgs/V.svg",
};

export default function InventoryFilters({
  category,
  setCategory,
  rarity,
  setRarity,
  variant = "desktop",
}: InventoryFiltersProps) {
  const isMobile = variant === "mobile";

  return (
    <aside
      className={
        isMobile
          ? "w-full"
          : "w-60 border-r border-bege-escuro/25 px-4 py-10"
      }
    >
      <FilterGroup title="Categoria" compact={isMobile}>
        {categories.map((item) => (
          <FilterButton
            key={item.value}
            selected={category === item.value}
            onClick={() => setCategory(item.value)}
            label={item.label}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Raridade" compact={isMobile}>
        {rarities.map((item) => (
          <FilterButton
            key={item.value}
            selected={rarity === item.value}
            onClick={() => setRarity(rarity === item.value ? "todos" : item.value)}
            label={item.label}
            icon={rarityCrests[item.value]}
          />
        ))}
      </FilterGroup>
    </aside>
  );
}

function FilterButton({
  selected,
  onClick,
  label,
  icon,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  icon?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 border border-transparent px-0.5 py-1 text-left text-sm uppercase transition-all ${
        selected ? "bg-roxo" : "hover:border-bege-escuro/40"
      }`}
    >
      <div className="flex h-6 w-6 shrink-0 items-center justify-center">
        {icon ? (
          <img src={icon} alt="" className="h-full w-full object-contain" />
        ) : (
          <span
            className={`h-3.5 w-3.5 rounded-full border ${
              selected
                ? "border-bege-medio bg-bege-medio"
                : "border-bege-escuro"
            }`}
          />
        )}
      </div>

      <span className="tracking-wide">{label}</span>
    </button>
  );
}

function FilterGroup({
  title,
  children,
  compact = false,
}: {
  title: string;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "mb-5" : "mb-6"}>
      <h2 className="mb-2 border-b border-bege-escuro/20 pb-1.5 font-title text-base uppercase tracking-[0.12em] text-bege-claro">
        {title}
      </h2>

      <div
        className={
          compact
            ? "grid grid-cols-2 gap-2 text-bege-medio"
            : "flex flex-col gap-2 text-bege-medio"
        }
      >
        {children}
      </div>
    </div>
  );
}