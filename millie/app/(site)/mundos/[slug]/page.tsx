import { notFound } from "next/navigation";
import { getWorldBySlug } from "@/lib/mocks/worlds";
import { MundoReader } from "@/componentes/mundo/MundoReader";

type MundoPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function MundoPage({ params }: MundoPageProps) {
  const { slug } = await params;
  const world = getWorldBySlug(slug);

  if (!world) {
    notFound();
  }

  return <MundoReader world={world} />;
}