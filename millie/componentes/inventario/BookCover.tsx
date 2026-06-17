import Image from "next/image";
import type { InventoryItem } from "@/lib/types/inventory";

type BookInventoryItem = Extract<InventoryItem, { category: "livro" }>;

type BookCoverProps = {
  book: BookInventoryItem;
  hideText?: boolean; // Nova propriedade opcional para controlar os textos
};

export default function BookCover({ book, hideText = false }: BookCoverProps) {
  return (
    <div className="relative aspect-3/4 w-full overflow-hidden border border-bege-escuro/40">
      {book.coverType === "image" ? (
        <Image
          src={book.coverImage}
          alt={book.name}
          fill
          className="object-cover"
        />
      ) : (
        <>
          <div
            className="h-full w-full"
            style={{ backgroundColor: book.coverColor }}
          />

          <div className="pointer-events-none absolute inset-0 z-1 shadow-[inset_0_0_70px_rgba(0,0,0,0.55),inset_0_0_18px_rgba(209,186,142,0.08)]" />

          <div className="pointer-events-none absolute inset-4 z-2 border border-bege-medio/20" />
        </>
      )}

      {/* Só renderiza o container de textos e o overlay escuro se hideText for falso */}
      {!hideText && (
        <div className="absolute inset-0 flex flex-col justify-between p-5 bg-black/20 text-center">
          <h1 className="mt-5 font-title uppercase text-bege-claro">
            {book.name}
          </h1>

          <p className="font-title text-sm text-bege-medio">
            {book.author ?? "Autor desconhecido"}
          </p>
        </div>
      )}
    </div>
  );
}
