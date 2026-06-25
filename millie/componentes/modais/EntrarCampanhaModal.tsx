"use client";

import { useState } from "react";
import MillieModal from "@/componentes/ui/MillieModal";
import MillieInput from "@/componentes/ui/MillieInput";
import { PrimaryButton } from "@/componentes/PrimaryButton";
import { useCampaign } from "@/lib/contexts/CampaignContext";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function EntrarCampanhaModal({ open, onClose }: Props) {
  const { joinCampaign } = useCampaign();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) {
      setError("Digite o código.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await joinCampaign(code.trim());
      setCode("");
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Código inválido.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <MillieModal isOpen={open} onClose={onClose} title="Entrar em Crônica">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <MillieInput
          label="Código da campanha"
          placeholder="ABC123"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <PrimaryButton type="submit" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </PrimaryButton>
      </form>
    </MillieModal>
  );
}