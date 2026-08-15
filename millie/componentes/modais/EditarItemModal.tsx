"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import MillieModal from "@/componentes/ui/MillieModal";
import MillieInput from "@/componentes/ui/MillieInput";
import MillieImageUpload from "@/componentes/ui/MillieImageUpload";
import { PrimaryButton } from "@/componentes/PrimaryButton";
import { updateInventoryItem } from "@/app/actions/inventory";

type ItemToEdit = { id: string; name: string; quantity: number; image?: string };
type Props = { isOpen: boolean; onClose: () => void; item: ItemToEdit | null };

export default function EditarItemModal({ isOpen, onClose, item }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [image, setImage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!item) return;
    setName(item.name);
    setQuantity(String(item.quantity));
    setImage(item.image ?? "");
  }, [item]);

  function handleClose() {
    setError("");
    onClose();
  }

  function handleSubmit() {
    if (!item) return;
    if (!name.trim()) { setError("Nome é obrigatório."); return; }
    setError("");
    startTransition(async () => {
      try {
        await updateInventoryItem(item.id, {
          name: name.trim(),
          quantity: Math.max(1, Number(quantity) || 1),
          image: image || undefined,
        });
        router.refresh();
        handleClose();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Erro ao editar item.");
      }
    });
  }

  if (!item) return null;

  return (
    <MillieModal isOpen={isOpen} onClose={handleClose} title="Editar Item" maxWidth="max-w-md">
      <div className="space-y-4">
        <MillieInput label="Nome" value={name} onChange={(e) => setName(e.target.value)} />
        <MillieInput label="Quantidade" type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        <MillieImageUpload label="Imagem" value={image} onChange={setImage} aspectRatio="square" />

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={handleClose} className="font-title text-xs uppercase tracking-widest text-bege-medio/50 hover:text-bege-claro">
            Cancelar
          </button>
          <PrimaryButton onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar Alterações"}
          </PrimaryButton>
        </div>
      </div>
    </MillieModal>
  );
}