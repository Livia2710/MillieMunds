"use client";

import { useEffect, useState, useTransition } from "react";
import MillieModal from "@/componentes/ui/MillieModal";
import { PrimaryButton } from "@/componentes/PrimaryButton";

type ConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
};

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirmar",
}: ConfirmModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) setError(null);
  }, [isOpen]);

  function handleClose() {
    if (isPending) return;
    setError(null);
    onClose();
  }

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      try {
        await onConfirm();
        onClose();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Não foi possível concluir esta ação. Tente novamente.");
      }
    });
  }

  return (
    <MillieModal isOpen={isOpen} onClose={handleClose} title={title} maxWidth="max-w-md">
      <div className="space-y-6">
        <p className="text-sm leading-relaxed text-bege-claro/70">{message}</p>
        {error && <p role="alert" aria-live="polite" className="border border-red-400/30 bg-red-950/20 px-3 py-2 text-sm text-red-300">{error}</p>}
        <div className="flex justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={isPending}
            className="font-title text-xs uppercase tracking-widest text-bege-medio/50 hover:text-bege-claro"
          >
            Cancelar
          </button>
          <PrimaryButton onClick={handleConfirm} disabled={isPending}>
            {isPending ? "Aguarde..." : confirmLabel}
          </PrimaryButton>
        </div>
      </div>
    </MillieModal>
  );
}
