"use client";

import { useState } from "react";
import Image from "next/image";
import NoCampaign from "@/componentes/NoCampaign";
import InventoryGrid from "@/componentes/inventario/InventoryGrid";
import CriarCampanhaModal from "@/componentes/modais/CriarCampanhaModal";
import EntrarCampanhaModal from "@/componentes/modais/EntrarCampanhaModal";
import { useCampaign } from "@/lib/contexts/CampaignContext";

export default function InventarioPage() {
  const { hasCampaign, isMaster, itemsState, unlockItem } = useCampaign();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  if (!hasCampaign) {
    return (
      <div className="relative block min-h-screen w-full bg-roxo-escuro p-8 shadow-header md:p-12">
        <PageCorners />
        <NoCampaign 
          message="O inventário só aparece depois que você entra em uma campanha ou cria a sua própria." 
          onCreate={() => setIsCreateOpen(true)}
          onJoin={() => setIsJoinOpen(true)}
        />
        <CriarCampanhaModal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
        <EntrarCampanhaModal open={isJoinOpen} onClose={() => setIsJoinOpen(false)} />
      </div>
    );
  }

  // 🟢 MASTER: Vê tudo | PLAYER: Só vê itens liberados
  const items = isMaster
    ? itemsState
    : itemsState.filter((item) => !item.isLocked);

  return (
    <div className="relative block min-h-screen w-full bg-roxo-escuro p-8 shadow-header">
      <PageCorners />
      {/* Repassamos a trigger de desbloqueio para o grid interno gerenciar os botões visuais do Mestre */}
      <InventoryGrid items={items} isMaster={isMaster} onUnlock={unlockItem} />
    </div>
  );
}

function PageCorners() {
  return (
    <>
      <Image src="/assets/svgs/corner-left-top.svg" alt="" width={100} height={100} className="pointer-events-none absolute left-0 top-0 m-0 block h-19 w-19 md:h-25 md:w-25" />
      <Image src="/assets/svgs/corner-right-top.svg" alt="" width={100} height={100} className="pointer-events-none absolute right-0 top-0 m-0 block h-19 w-19 md:h-25 md:w-25" />
      <Image src="/assets/svgs/corner-left-bottom.svg" alt="" width={100} height={100} className="pointer-events-none absolute bottom-0 left-0 m-0 block h-19 w-19 md:h-25 md:w-25" />
      <Image src="/assets/svgs/corner-right-bottom.svg" alt="" width={100} height={100} className="pointer-events-none absolute bottom-0 right-0 m-0 block h-19 w-19 md:h-25 md:w-25" />
    </>
  );
}
