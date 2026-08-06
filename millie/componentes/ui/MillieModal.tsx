"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import Image from "next/image";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string; // ex: "max-w-lg", "max-w-2xl"
};

export default function MillieModal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "max-w-lg",
}: Props) {
  // Bloqueia scroll do body quando aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Fecha com ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-roxo-escuro/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Painel */}
      <div
        className={[
          "relative z-10 w-full shadow-header",
          "border border-bege-escuro/40 bg-roxo",
          "max-h-[90vh] overflow-y-auto",
          maxWidth,
        ].join(" ")}
      >
  
        {/* Header */}
        <div className="flex items-center justify-between border-b border-bege-escuro/30 px-6 py-4">
          <h2 className="font-title text-sm uppercase tracking-[0.2em] text-bege-claro">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-bege-medio/60 transition-colors hover:text-bege-claro"
            aria-label="Fechar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="px-6 py-6">{children}</div>
      </div>
    </div>
  );
}