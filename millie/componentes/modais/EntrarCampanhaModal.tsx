"use client";

import MillieModal from "@/componentes/ui/MillieModal";
import MillieInput from "@/componentes/ui/MillieInput";
import { PrimaryButton } from "@/componentes/PrimaryButton";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function EntrarCampanhaModal({ open, onClose }: Props) {
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // futuramente:
    // joinCampaign(code)

    console.log("Entrando");
    onClose();
  }

  return (
    <MillieModal isOpen={open} onClose={onClose} title="Entrar em Crônica">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <MillieInput label="Código da campanha" placeholder="ABC-123" />
        <PrimaryButton>Entrar</PrimaryButton>
      </form>
    </MillieModal>
  );
}
