import Image from "next/image";
import ConfiguracoesClient from "@/componentes/configuracoes/ConfiguracoesClient";

export default function ConfiguracoesPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-roxo-escuro shadow-header">
      <PageCorners />
      <div className="relative z-10 w-full max-w-3xl mx-auto px-4 py-10 pt-16 sm:px-6 md:px-12 md:py-14">
        <ConfiguracoesClient />
      </div>
    </div>
  );
}

function PageCorners() {
  return (
    <>
      <Image src="/assets/svgs/corner-left-top.svg" alt="" width={100} height={100}
        className="pointer-events-none absolute left-0 top-0 m-0 block h-19 w-19 md:h-25 md:w-25 z-0" />
      <Image src="/assets/svgs/corner-right-top.svg" alt="" width={100} height={100}
        className="pointer-events-none absolute right-0 top-0 m-0 block h-19 w-19 md:h-25 md:w-25 z-0" />
      <Image src="/assets/svgs/corner-left-bottom.svg" alt="" width={100} height={100}
        className="pointer-events-none absolute bottom-0 left-0 m-0 block h-19 w-19 md:h-25 md:w-25 z-0" />
      <Image src="/assets/svgs/corner-right-bottom.svg" alt="" width={100} height={100}
        className="pointer-events-none absolute bottom-0 right-0 m-0 block h-19 w-19 md:h-25 md:w-25 z-0" />
    </>
  );
}