"use client";

import { useState } from "react";
import { MoreVertical } from "lucide-react";

type MenuAction = {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  show?: boolean;
};

type Props = { actions: MenuAction[] };

export default function InventoryCardMenu({ actions }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const visibleActions = actions.filter((a) => a.show !== false);

  if (!visibleActions.length) return null;

  return (
    <div className="absolute left-2 top-2 z-30">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen((curr) => !curr);
        }}
        className="flex h-6 w-6 items-center justify-center rounded-full border border-bege-escuro/40 bg-roxo-escuro/85 hover:border-bege-medio"
        aria-label={isOpen ? "Fechar menu" : "Ações do Mestre"}
      >
        <MoreVertical size={12} strokeWidth={1.5} className="text-bege-escuro" />
      </button>

      {isOpen && (
        <div
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          className="absolute left-0 top-7 w-36 overflow-hidden rounded-[6px] border border-bege-escuro/40 bg-roxo-escuro/95 shadow-2xl"
        >
          {visibleActions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(false);
                action.onClick();
              }}
              className="flex w-full items-center gap-2 border-b border-bege-escuro/10 px-3 py-2 text-left font-title text-[10px] uppercase tracking-wider text-bege-escuro transition last:border-b-0 hover:bg-bege-escuro/5"
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}