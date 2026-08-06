"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { transferInventoryItem } from "@/app/actions/inventory";
import { PrimaryButton } from "@/componentes/PrimaryButton";
import MillieModal from "@/componentes/ui/MillieModal";
import MillieSelect from "@/componentes/ui/MillieSelect";
import type { InventoryItem } from "@/lib/types/inventory";

type PlayerCharacter = { id: string; name: string };

type Props = {
  item: InventoryItem | null;
  players: PlayerCharacter[];
  onClose: () => void;
};

export default function EntregarItemModal({ item, players, onClose }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [characterId, setCharacterId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!item || !characterId) {
      setError("Escolha o personagem que receberá o item.");
      return;
    }

    startTransition(async () => {
      try {
        await transferInventoryItem(item.id, characterId, Number(quantity));
        router.refresh();
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não foi possível entregar o item.");
      }
    });
  }

  return (
    <MillieModal isOpen={!!item} onClose={onClose} title="Entregar item">
      <div className="space-y-5">
        <p className="text-sm text-bege-medio">
          Entregar <strong className="text-bege-claro">{item?.name}</strong>
          {item ? ` (x${item.quantity})` : ""} ao inventário de um jogador.
        </p>
        <p className="text-xs text-bege-escuro/80">
          A entrega move a pilha inteira e deixa o item visível para o jogador imediatamente.
        </p>
        <MillieSelect
          label="Personagem"
          placeholder="Selecione um personagem"
          options={players.map((player) => ({ value: player.id, label: player.name }))}
          value={characterId}
          onChange={(event) => setCharacterId(event.target.value)}
          disabled={!players.length || isPending}
        />
        <label className="flex flex-col gap-1.5">
          <span className="font-title text-[10px] uppercase tracking-[0.2em] text-bege-escuro">Quantidade</span>
          <input
            type="number"
            min={1}
            max={item?.quantity ?? 1}
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className="w-full border border-bege-escuro/40 bg-roxo-escuro/80 px-3 py-2.5 font-body text-sm text-bege-claro outline-none focus:border-bege-medio/70"
          />
        </label>
        {!players.length && (
          <p className="text-xs text-bege-medio/70">Não há personagens de jogadores nesta campanha.</p>
        )}
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex justify-end gap-3 border-t border-bege-escuro/20 pt-4">
          <button onClick={onClose} className="font-title text-xs uppercase tracking-widest text-bege-medio/60 hover:text-bege-claro">
            Cancelar
          </button>
          <PrimaryButton onClick={handleSubmit} disabled={isPending || !players.length}>
            {isPending ? "Entregando..." : "Entregar"}
          </PrimaryButton>
        </div>
      </div>
    </MillieModal>
  );
}
