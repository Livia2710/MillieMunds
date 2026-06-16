import Image from "next/image";
import { notFound } from "next/navigation";
import InventoryBookDetails from "@/componentes/inventario/InventoryBookDetails";
import InventoryItemDetails from "@/componentes/inventario/InventoryItemDetails";
import { mockInventoryItems } from "@/lib/mocks/inventory";

type InventoryDetailsPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function InventoryDetailsPage({
  params,
}: InventoryDetailsPageProps) {
  const { slug } = await params;

  const item = mockInventoryItems.find((item) => item.slug === slug);

  if (!item) {
    notFound();
  }

  if (item.category === "livro") {
    return (
      <div className="relative block min-h-screen w-full bg-roxo-escuro p-8 shadow-header">
          <PageCorners />
    
         <InventoryBookDetails book={item} />
   </div>
    )
  }

  return ( 
    <div className="relative block min-h-screen w-full bg-roxo-escuro p-8 shadow-header">
          <PageCorners />
    
        <InventoryItemDetails item={item} />;
   </div>

  );
   
}

function PageCorners() {
  return (
    <>
      <Image
        src="/assets/svgs/corner-left-top.svg"
        alt=""
        width={100}
        height={100}
        className="pointer-events-none absolute left-0 top-0 m-0 block h-19 w-19 md:h-25 md:w-25"
      />
      <Image
        src="/assets/svgs/corner-right-top.svg"
        alt=""
        width={100}
        height={100}
        className="pointer-events-none absolute right-0 top-0 m-0 block h-19 w-19 md:h-25 md:w-25"
      />
      <Image
        src="/assets/svgs/corner-left-bottom.svg"
        alt=""
        width={100}
        height={100}
        className="pointer-events-none absolute bottom-0 left-0 m-0 block h-19 w-19 md:h-25 md:w-25"
      />
      <Image
        src="/assets/svgs/corner-right-bottom.svg"
        alt=""
        width={100}
        height={100}
        className="pointer-events-none absolute bottom-0 right-0 m-0 block h-19 w-19 md:h-25 md:w-25"
      />
    </>
  );
}