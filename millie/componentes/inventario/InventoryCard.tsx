import Image from "next/image";
import type { InventoryItem } from "@/lib/types/inventory";

type InventoryCardProps = {
  item: InventoryItem;
};

const rarityCrests: Record<string, string> = {
  comum: "/assets/svgs/C.svg",
  incomum: "/assets/svgs/E.svg",
  raro: "/assets/svgs/B.svg",
  epico: "/assets/svgs/A.svg",
  lendario: "/assets/svgs/S.svg",
  mitico: "/assets/svgs/V.svg",
};

export default function InventoryCard({ item }: InventoryCardProps) {
  return (
    <article className="arcane-hover relative aspect-square overflow-hidden border border-bege-escuro/45 bg-roxo-escuro/60 p-3 shadow-card transition-all">
      <img
        src={rarityCrests[item.rarity]}
        alt=""
        className="pointer-events-none absolute left-2 top-2 h-6 w-6 object-contain opacity-80"
      />

      {item.quantity > 1 && (
        <span className="absolute bottom-2 right-3 font-title text-base text-bege-claro md:text-xl">
          {item.quantity}
        </span>
      )}

      <div className="flex h-full w-full items-center justify-center">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            width={140}
            height={140}
            className="h-[72%] w-[72%] object-contain"
          />
        ) : (
          <span className="px-2 text-center font-title text-xs uppercase tracking-wider text-bege-medio/50">
            {item.name}
          </span>
        )}
      </div>
    </article>
  );
}