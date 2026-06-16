import Image from "next/image";
import type { InventoryItem } from "@/lib/types/inventory";

type RegularInventoryItem = Exclude<InventoryItem, { category: "livro" }>;

type InventoryItemDetailsProps = {
  item: RegularInventoryItem;
};

function getSpecificFields(item: RegularInventoryItem) {
  switch (item.category) {
    case "equipamento":
      return [
        { label: "Forjado por", value: item.forgedBy },
        { label: "Efeito", value: item.effect },
      ];

    case "consumivel":
    case "reliquia":
      return [
        { label: "Origem", value: item.origin },
        { label: "Efeito", value: item.effect },
      ];

    case "material":
      return [
        { label: "Origem", value: item.origin },
        { label: "Efeito", value: item.effect ?? "Nenhum efeito conhecido" },
      ];

    case "outro":
      return [
        { label: "Origem", value: item.origin ?? "Origem desconhecida" },
        { label: "Efeito", value: item.effect ?? "Nenhum efeito conhecido" },
      ];
  }
}

export default function InventoryItemDetails({ item }: InventoryItemDetailsProps) {
  const fields = getSpecificFields(item);

  return (
    <main className="min-h-screen bg-roxo-escuro px-6 py-12 text-bege-medio md:px-16">
      <section className="mx-auto grid max-w-5xl gap-10 md:grid-cols-[320px_1fr]">
        <div className="aspect-square border border-bege-escuro/45 bg-roxo-escuro/60 p-6 shadow-card">
          {item.image ? (
            <Image
              src={item.image}
              alt={item.name}
              width={320}
              height={320}
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex h-full items-center justify-center font-title uppercase tracking-widest text-bege-medio/50">
              Sem imagem
            </div>
          )}
        </div>

        <div>
          <p className="font-title text-sm uppercase tracking-[0.22em] text-bege-escuro">
            {item.category} / {item.rarity}
          </p>

          <h1 className="mt-3 font-title text-4xl uppercase tracking-[0.08em] text-bege-claro md:text-6xl">
            {item.name}
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-bege-medio/90">
            {item.description}
          </p>

          <div className="mt-8 grid gap-4 border-t border-bege-escuro/30 pt-6">
            <DetailLine label="Quantidade" value={String(item.quantity)} />
            <DetailLine label="Mundo" value={item.worldSlug} />

            {fields.map((field) => (
              <DetailLine key={field.label} label={field.label} value={field.value} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex gap-3 border-b border-bege-escuro/15 pb-2">
      <strong className="min-w-32 font-title uppercase text-bege-escuro">
        {label}:
      </strong>
      <span>{value}</span>
    </p>
  );
}