import Image from "next/image";
import type { InventoryItem } from "@/lib/types/inventory";

type RegularInventoryItem = Exclude<InventoryItem, { category: "livro" }>;

type InventoryItemDetailsProps = {
  item: RegularInventoryItem;
};

const rarityCrests: Record<string, string> = {
  comum: "/assets/svgs/Comum.svg",
  incomum: "/assets/svgs/Incomum.svg",
  raro: "/assets/svgs/Raro.svg",
  epico: "/assets/svgs/Epico.svg",
  lendario: "/assets/svgs/Lendario.svg",
  mitico: "/assets/svgs/Mitico.svg",
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

export default function InventoryItemDetails({
  item,
}: InventoryItemDetailsProps) {

  const fields = getSpecificFields(item);

  return (
    <main className=" min-h-screen  bg-roxo-escuro  px-5 py-8 text-bege-medio md:px-16 md:py-1 ">

      <section className=" mx-auto  max-w-6xl grid gap-8 md:grid-cols-[260px_1fr] md:gap-1 ">

        {/* IMAGEM */}
        <div className="arcane-hover overflow-hidden mx-auto flex aspect-square w-full max-w-[220px] items-center justify-center border border-bege-escuro/40 bg-roxo-escuro/50 p-4 shadow-card md:max-w-[260px ">

          {item.image ? (
            <>
            <Image
            src={rarityCrests[item.rarity]}
            alt=""
            width={32}
            height={32}
            className=" pointer-events-none absolute left-1 top-2 h-8 w-8 object-contain opacity-80"
            />
            <Image
              src={item.image}
              alt={item.name}
              width={260}
              height={260}
              className="h-full w-full object-contain"/>
              </>
          ) : (
            <span className=" font-title text-xs uppercase tracking-widest text-bege-medio/40">
              Sem imagem
            </span>
          )}

        </div>

        {/* CONTEÚDO */}
        <div>

          <div className="flex items-center gap-3 md:justify-start max-md:flex-col max-md:text-center">

            <p className=" font-title text-xs uppercase tracking-[0.25em] text-bege-escuro">
            {item.category} / {item.rarity}
            </p>
          </div>

          <h1 className=" mt-3 font-title text-4xl uppercase tracking-[0.08em] text-bege-claro text-center md:text-left md:text-6xl">
            {item.name}
          </h1>

          <Image
            src="/assets/svgs/divider.svg"
            alt=""
            width={320}
            height={24}
            className="mt-3 opacity-70"
          />

          <p className=" mt-5 max-w-2xl text-base leading-7 text-bege-medio/90 md:text-lg md:leading-8">
            {item.description}
          </p>

          <div className=" mt-8 border-t border-bege-escuro/30 pt-6 grid gap-3">

            <DetailLine
              label="Quantidade"
              value={String(item.quantity)}
            />

            <DetailLine
              label="Mundo"
              value={item.worldSlug}
            />

            {fields.map((field)=>(
              <DetailLine
                key={field.label}
                label={field.label}
                value={field.value}
              />
            ))}

          </div>
        </div>
      </section>
    </main>
  );
}

function DetailLine({
  label,
  value
}:{
  label:string;
  value:string;
}){
return (
  <p className=" flex flex-col gap-1 border-b border-bege-escuro/15 pb-3 sm:flex-row sm:gap-3">
    <strong className=" min-w-32 font-title text-xs uppercase text-bege-escuro">
    {label}:
    </strong>

    <span className="text-bege-claro/90">
    {value}
    </span>
  </p>
);
}