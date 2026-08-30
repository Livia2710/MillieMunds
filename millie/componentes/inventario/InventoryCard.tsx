"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Lock, Pencil, Trash2, Send } from "lucide-react";
import type { InventoryItem } from "@/lib/types/inventory";
import BookCover from "./BookCover";
import InventoryCardMenu from "./InventoryCardMenu";
import EditarItemModal from "@/componentes/modais/EditarItemModal";
import { unlockItem, deleteInventoryItem } from "@/app/actions/inventory";
import { useCampaign } from "@/lib/contexts/CampaignContext";
import ConfirmModal from "@/componentes/modais/ConfirmModal";

type InventoryCardProps = {
  item: InventoryItem;
  onAssign?: (item: InventoryItem) => void;
};

const rarityCrests: Record<string, string> = {
  comum: "/assets/svgs/raridade/Comum.svg",
  incomum: "/assets/svgs/raridade/Incomum.svg",
  raro: "/assets/svgs/raridade/Raro.svg",
  epico: "/assets/svgs/raridade/Epico.svg",
  lendario: "/assets/svgs/raridade/Lendario.svg",
  mitico: "/assets/svgs/raridade/Mitico.svg",
};

export default function InventoryCard({ item, onAssign }: InventoryCardProps) {
  const { isMaster } = useCampaign();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmUnlockOpen, setConfirmUnlockOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const hideContent = !!item.isLocked && !isMaster;

  function handleUnlock() {
    startTransition(async () => {
      await unlockItem(item.id);
      router.refresh();
      setConfirmUnlockOpen(false);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteInventoryItem(item.id);
      router.refresh();
      setConfirmDeleteOpen(false);
    });
  }

  return (
    <div className="relative">
      <Link href={`/inventario/${item.slug}`} className="block">
        <article className="arcane-hover relative aspect-square overflow-hidden border border-bege-escuro/45 bg-roxo-escuro/60 p-3 shadow-card transition-colors hover:border-bege-medio">

          {isMaster && (
            <InventoryCardMenu
              actions={[
                { label: "Desbloquear", icon: <Lock size={12} strokeWidth={1.5} />, onClick: () => setConfirmUnlockOpen(true), show: item.isLocked },
                { label: "Editar", icon: <Pencil size={12} strokeWidth={1.5} />, onClick: () => setEditOpen(true) },
                { label: "Entregar", icon: <Send size={12} strokeWidth={1.5} />, onClick: () => onAssign?.(item), show: !!onAssign },
                { label: "Excluir", icon: <Trash2 size={12} strokeWidth={1.5} />, onClick: () => setConfirmDeleteOpen(true) },
              ]}
            />
          )}

          <div className="absolute top-2 right-2 w-4 h-4 z-10 opacity-80 group-hover:opacity-100 transition-opacity">
            <Image src={rarityCrests[item.rarity] || rarityCrests.comum} alt={`Raridade ${item.rarity}`} fill className="object-contain" />
          </div>

          <span className="absolute bottom-2 right-3 z-10 font-mono text-[10px] text-bege-escuro/60">x{item.quantity}</span>

          {item.category !== "livro" && (
            <span className="absolute bottom-2 left-3 z-10 font-title text-[10px] text-bege-escuro truncate max-w-[70%]">
              {hideContent ? "?????" : item.name}
            </span>
          )}

          <div className="flex h-full w-full items-center justify-center pb-2">
            {item.category === "livro" ? (
              <div className="h-[80%] w-[60%] shadow-card">
                <BookCover book={item} hideText={true} isLocked={item.isLocked} forceReveal={isMaster} />
              </div>
            ) : item.image && !hideContent ? (
              <Image src={item.image} alt={item.name} width={140} height={140} className="h-[68%] w-[68%] object-contain" priority />
            ) : (
              <span className="px-2 text-center font-title text-[10px] uppercase tracking-wider text-bege-medio/40">
                {hideContent ? "?????" : item.name}
              </span>
            )}
          </div>

        </article>
      </Link>

      <ConfirmModal
        isOpen={confirmUnlockOpen}
        onClose={() => setConfirmUnlockOpen(false)}
        onConfirm={handleUnlock}
        title="Liberar Item"
        message={`Tem certeza que quer liberar "${item.name}" para os jogadores? Essa ação não pode ser desfeita.`}
        confirmLabel={isPending ? "Aguarde..." : "Liberar"}
      />

      <ConfirmModal
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Excluir Item"
        message={`Tem certeza que quer excluir "${item.name}"? Essa ação não pode ser desfeita.`}
        confirmLabel={isPending ? "Aguarde..." : "Excluir"}
      />

      <EditarItemModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        item={{ id: item.id, name: item.name, quantity: item.quantity, image: item.image }}
      />
    </div>
  );
}