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
      <article className="arcane-hover relative aspect-square overflow-hidden border border-bege-escuro/45 bg-roxo-escuro/60 p-3 shadow-card transition-colors hover:border-bege-medio">
        
        {/* Brasão de Raridade posicionado elegantemente no topo superior direito */}
        <div className="absolute top-2 right-2 w-4 h-4 z-10 opacity-80 group-hover:opacity-100 transition-opacity">
          <Image
            src={rarityCrests[item.rarity] || rarityCrests.comum}
            alt={`Raridade ${item.rarity}`}
            fill
            className="object-contain"
          />
        </div>

        {/* Quantidade padronizada no canto inferior direito estilo RPG (ex: x5) */}
        <span className="absolute bottom-2 right-3 z-10 font-mono text-[10px] text-bege-escuro/60">
          x{item.quantity}
        </span>

        {/* Nome do item na parte inferior esquerda se não for livro */}
        {item.category !== "livro" && (
          <span className="absolute bottom-2 left-3 z-10 font-title text-[10px] text-bege-escuro truncate max-w-[70%]">
            {item.name}
          </span>
        )}

        {/* Conteúdo Central */}
        <div className="flex h-full w-full items-center justify-center pb-2">
          {item.category === "livro" ? (
            <div className="h-[80%] w-[60%] shadow-card">
              <BookCover book={item} hideText={true} />
            </div>
          ) : item.image ? (
            <Image
              src={item.image}
              alt={item.name}
              width={140}
              height={140}
              className="h-[68%] w-[68%] object-contain"
              priority
            />
          ) : (
            <span className="px-2 text-center font-title text-[10px] uppercase tracking-wider text-bege-medio/40">
              {item.name}
            </span>
          )}
        </div>

      </article>
    </Link>
  );
}
