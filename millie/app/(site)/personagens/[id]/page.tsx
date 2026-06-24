import { notFound } from "next/navigation";
import Image from "next/image";
import { mockCharacters } from "@/lib/mocks/characters";
import CharacterDetails from "@/componentes/personagens/CharacterDetails";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CharacterDetailsPage({ params }: Props) {
  const { id } = await params;
  const character = mockCharacters.find((c) => c.id === id);

  if (!character) notFound();

  return (
    <div className="relative min-h-screen w-full bg-roxo-escuro p-6 shadow-header md:p-10">
      <PageCorners />
      <CharacterDetails character={character} />
    </div>
  );
}

function PageCorners() {
  return (
    <>
      <Image src="/assets/svgs/corner-left-top.svg" alt="" width={100} height={100} className="pointer-events-none absolute left-0 top-0 h-19 w-19 md:h-25 md:w-25" />
      <Image src="/assets/svgs/corner-right-top.svg" alt="" width={100} height={100} className="pointer-events-none absolute right-0 top-0 h-19 w-19 md:h-25 md:w-25" />
      <Image src="/assets/svgs/corner-left-bottom.svg" alt="" width={100} height={100} className="pointer-events-none absolute bottom-0 left-0 h-19 w-19 md:h-25 md:w-25" />
      <Image src="/assets/svgs/corner-right-bottom.svg" alt="" width={100} height={100} className="pointer-events-none absolute bottom-0 right-0 h-19 w-19 md:h-25 md:w-25" />
    </>
  );
}