"use client";

import MillieModal from "@/componentes/ui/MillieModal";
import MillieInput from "@/componentes/ui/MillieInput";
import MillieTextarea from "@/componentes/ui/MillieTextarea";
import { PrimaryButton } from "@/componentes/PrimaryButton";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function CriarCampanhaModal({ open, onClose }: Props) {
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // futuramente:
    // server action createCampaign()

    console.log("Criar campanha");
    onClose();
  }

  return (
    <MillieModal isOpen={open} onClose={onClose} title="Criar Crônica">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <MillieInput label="Nome da campanha" placeholder="As Crônicas do Éter" />
        <MillieTextarea label="Descrição" placeholder="Conte sobre esta aventura..." />
        <PrimaryButton>Criar Campanha</PrimaryButton>
      </form>
    </MillieModal>
  );
}
