import Image from "next/image";
import NoCampaign from "@/componentes/NoCampaign";
import InventoryGrid from "@/componentes/inventario/InventoryGrid";
import { mockInventoryItems } from "@/lib/mocks/inventory";

const mockUser = {
  hasCampaign: true,
  isMaster: false,
};

export default function InventarioPage() {
  if (!mockUser.hasCampaign) {
    return (
      <div className="relative block min-h-screen w-full p-8 md:p-12 bg-roxo-escuro shadow-header">
        <PageCorners />

        <NoCampaign message="O inventário só aparece depois que você entra em uma campanha ou cria a sua própria." />
      </div>
    );
  }

  const items = mockUser.isMaster
    ? mockInventoryItems
    : mockInventoryItems.filter((item) => !item.isLocked);

  return (
    <div className="relative block min-h-screen w-full bg-roxo-escuro p-8 shadow-header">
      <PageCorners />

      <InventoryGrid items={items} isMaster={mockUser.isMaster} />
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