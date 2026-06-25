"use client";

import { useState } from "react";
import MillieModal from "@/componentes/ui/MillieModal";
import MillieInput from "@/componentes/ui/MillieInput";
import MillieTextarea from "@/componentes/ui/MillieTextarea";
import { PrimaryButton } from "@/componentes/PrimaryButton";
import { useCampaign } from "@/lib/contexts/CampaignContext";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function CriarCampanhaModal({ open, onClose }: Props) {
  const { createCampaign } = useCampaign();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Nome é obrigatório.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await createCampaign(name.trim(), description.trim());
      setName("");
      setDescription("");
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao criar crônica.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <MillieModal isOpen={open} onClose={onClose} title="Criar Crônica">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <MillieInput
          label="Nome da campanha"
          placeholder="As Crônicas do Éter"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <MillieTextarea
          label="Descrição"
          placeholder="Conte sobre esta aventura..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <PrimaryButton type="submit" disabled={loading}>
          {loading ? "Criando..." : "Criar Campanha"}
        </PrimaryButton>
      </form>
    </MillieModal>
  );
}