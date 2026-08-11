"use client";

import { useTransition } from "react";
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

  function handleConfirm() {
    startTransition(async () => {
      await onConfirm();
      onClose();
    });
  }

  return (
    <MillieModal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="space-y-6">
        <p className="text-sm leading-relaxed text-bege-claro/70">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
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