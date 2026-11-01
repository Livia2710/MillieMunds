import type { Dispatch, SetStateAction, ReactNode } from "react";
import Image from "next/image";
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
  { label: "Artefatos", value: "reliquia" },
  { label: "Livros", value: "livro" },
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
  comum: "/assets/svgs/raridade/Comum.svg",
  incomum: "/assets/svgs/raridade/Incomum.svg",
  raro: "/assets/svgs/raridade/Raro.svg",
  epico: "/assets/svgs/raridade/Epico.svg",
  lendario: "/assets/svgs/raridade/Lendario.svg",
  mitico: "/assets/svgs/raridade/Mitico.svg",
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
    <aside data-frame="simple" className={`relative isolate overflow-hidden bg-[radial-gradient(ellipse_at_50%_0%,rgba(113,74,128,.18),transparent_48%),linear-gradient(155deg,#2b1c34,#1a0f22_60%,#130b19)] p-5 shadow-[0_0_24px_rgba(209,186,142,.06)] ${isMobile ? "w-full" : "h-fit md:sticky md:top-24"}`}>
      <Image src="/assets/svgs/corner-left-top.svg" alt="" width={100} height={100} className="pointer-events-none absolute left-0 top-0 h-14 w-14 opacity-55" />
      <Image src="/assets/svgs/corner-right-top.svg" alt="" width={100} height={100} className="pointer-events-none absolute right-0 top-0 h-14 w-14 opacity-55" />
      <Image src="/assets/svgs/corner-left-bottom.svg" alt="" width={100} height={100} className="pointer-events-none absolute bottom-0 left-0 h-14 w-14 opacity-55" />
      <Image src="/assets/svgs/corner-right-bottom.svg" alt="" width={100} height={100} className="pointer-events-none absolute bottom-0 right-0 h-14 w-14 opacity-55" />
      <div className="relative z-10">
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
      </div>
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
      <h2 className="mb-3 flex items-center gap-2 font-title text-sm uppercase tracking-[0.16em] text-bege-medio">
        <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-transparent to-bege-medio/40" />
        <span aria-hidden="true" className="text-[9px]">✦</span>{title}<span aria-hidden="true" className="text-[9px]">✦</span>
        <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-l from-transparent to-bege-medio/40" />
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
