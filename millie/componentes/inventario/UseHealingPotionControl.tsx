"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useHealingPotion } from "@/app/actions/inventory";
import { useToast } from "@/componentes/ui/ToastProvider";
import type { ConsumableType } from "@/lib/types/inventory";

export default function UseHealingPotionControl({ itemId, type, canUse }: { itemId: string; type?: ConsumableType; canUse: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  if (!canUse || (type !== 'cura_pv' && type !== 'cura_pm')) return null;
  function usePotion() {
    startTransition(async () => {
      try {
        const result = await useHealingPotion(itemId);
        const removed = result.conditionsRemoved ? ` · ${result.conditionsRemoved} condição(ões) removida(s)` : '';
        toast.success(`${result.characterName} recuperou ${result.recovered} ${result.resource}${removed}.`);
        router.refresh();
      } catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível usar a poção.'); }
    });
  }
  return <button type="button" disabled={pending} onClick={usePotion} className="border border-bege-medio/40 px-3 py-2 text-[10px] uppercase tracking-widest text-bege-medio disabled:opacity-40">{pending ? 'Usando…' : 'Usar poção'}</button>;
}
