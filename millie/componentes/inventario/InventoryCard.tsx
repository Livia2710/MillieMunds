import Image from "next/image";
import Link from "next/link";
import type { InventoryItem } from "@/lib/types/inventory";
import BookCover from "./BookCover";

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
  if (item.isLocked) {
    return null;
  }

  return (
    <Link href={`/inventario/${item.slug}`} className="block">
      <article className="arcane-hover relative aspect-square overflow-hidden border border-bege-escuro/45 bg-roxo-escuro/60 p-3 shadow-card">
        {/* Brasão de Raridade */}
        <Image
          src={rarityCrests[item.rarity]}
          alt=""
          width={24}
          height={24}
          className="absolute left-2 top-2 z-[3] opacity-80"
        />

        {/* Quantidade */}
        {item.quantity > 1 && (
          <span className="absolute bottom-2 right-3 z-[3] font-title text-base text-bege-claro">
            {item.quantity}
          </span>
        )}

        {/* Conteúdo Central */}
        <div className="flex h-full w-full items-center justify-center">
          {item.category === "livro" ? (
            <div className="h-[80%] w-[60%] shadow-card">
              {/* Passando hideText aqui para esconder o título e autor no grid */}
              <BookCover book={item} hideText={true} />
            </div>
          ) : item.image ? (
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
    </Link>
  );
}
