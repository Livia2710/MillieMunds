"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changeEquipmentDurability } from "@/app/actions/inventory";
import { useToast } from "@/componentes/ui/ToastProvider";

export default function EquipmentDurabilityControl({ itemId, durability, maxDurability, isMaster }: { itemId: string; durability: number | null; maxDurability: number | null; isMaster: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [current, setCurrent] = useState(durability);
  if (maxDurability === null || current === null) return <p className="text-xs">Durabilidade: não se desgasta (Mítico)</p>;

  function run(action: 'wear' | 'repair' | 'replace') {
    startTransition(async () => {
      try {
        const result = await changeEquipmentDurability(itemId, action);
        setCurrent(result.durability);
        toast.success(action === 'wear' ? 'Desgaste registrado.' : action === 'repair' ? `Equipamento consertado por ${result.repairCost} Estilhaços.` : `Equipamento trocado por ${result.repairCost} Estilhaços.`);
        router.refresh();
      } catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível atualizar a durabilidade.'); }
  });
  }

  return <div className="space-y-2 border-t border-bege-escuro/20 pt-3">
    <p className="text-xs">Durabilidade: <strong>{current}/{maxDurability}</strong>{current === 0 ? ' · Quebrado' : ''}</p>
    {isMaster && <div className="flex gap-2">
      <button type="button" disabled={pending || current <= 0} onClick={() => run('wear')} className="border border-bege-escuro/30 px-3 py-2 text-[10px] uppercase disabled:opacity-40">Registrar desgaste −1</button>
      {current === 0 && <><button type="button" disabled={pending} onClick={() => run('repair')} className="border border-bege-medio/40 px-3 py-2 text-[10px] uppercase disabled:opacity-40">Consertar · 30%</button><button type="button" disabled={pending} onClick={() => run('replace')} className="border border-bege-medio/40 px-3 py-2 text-[10px] uppercase disabled:opacity-40">Trocar · 50%</button></>}
    </div>}
  </div>;
}
