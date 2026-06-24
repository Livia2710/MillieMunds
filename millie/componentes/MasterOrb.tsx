"use client";

import { useState } from "react";
import { useCampaign } from "@/lib/contexts/CampaignContext";
import {
  BookOpen, Boxes, Gem, Scroll,
  Sparkles, UserRoundPlus, WandSparkles, X,
} from "lucide-react";
import CriarMundoModal from "@/componentes/modais/CriarMundoModal";
import CriarPersonagemModal from "@/componentes/modais/CriarPersonagemModal";
import CriarArtefatoModal from "@/componentes/modais/CriarArtefatoModal";
import CriarLivroModal from "@/componentes/modais/CriarLivroModal";
import CriarEquipamentoModal from "@/componentes/modais/CriarEquipamentoModal";
import CriarHabilidadeModal from "@/componentes/modais/CriarHabilidadeModal";

type ModalKey =
  | "mundo"
  | "personagem"
  | "artefato"
  | "livro"
  | "equipamento"
  | "habilidade"
  | null;

const masterActions: { label: string; icon: React.ReactNode; modal: ModalKey }[] = [
  { label: "Criar mundo",       icon: <Sparkles size={17} strokeWidth={1.5} />,     modal: "mundo" },
  { label: "Criar personagem",  icon: <UserRoundPlus size={17} strokeWidth={1.5} />, modal: "personagem" },
  { label: "Criar artefato",    icon: <Gem size={17} strokeWidth={1.5} />,           modal: "artefato" },
  { label: "Criar livro",       icon: <BookOpen size={17} strokeWidth={1.5} />,      modal: "livro" },
  { label: "Criar equipamento", icon: <Boxes size={17} strokeWidth={1.5} />,         modal: "equipamento" },
  { label: "Criar habilidade",  icon: <Scroll size={17} strokeWidth={1.5} />,        modal: "habilidade" },
];

export function MasterOrb() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalKey>(null);

  const { isMaster } = useCampaign();

  if (!isMaster) return null;

  function openModal(modal: ModalKey) {
    setIsOpen(false);  // fecha o menu
    setActiveModal(modal);
  }

  function closeModal() {
    setActiveModal(null);
  }

  return (
    <>
      {/* FAB + menu */}
      <div className="fixed bottom-15 left-15 z-40">
        {isOpen && (
          <div className="mb-4 w-64 overflow-hidden rounded-[10px] border border-bege-escuro/45 bg-roxo-escuro/95 text-bege-escuro shadow-2xl">
            <div className="border-b border-bege-escuro/15 px-4 py-3">
              <p className="font-title text-sm uppercase tracking-[0.16em]">
                Ferramentas do Mestre
              </p>
              <p className="mt-1 text-xs text-bege-claro/55">
                Crie conteúdos para a campanha ativa
              </p>
            </div>

            <div>
              {masterActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => openModal(action.modal)}
                  className="flex min-h-11 w-full items-center gap-3 border-b border-bege-escuro/10 px-4 py-3 text-left font-title text-xs uppercase tracking-[0.12em] transition last:border-b-0 hover:bg-bege-escuro/5"
                >
                  {action.icon}
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsOpen((curr) => !curr)}
          className="arcane-hover flex h-14 w-14 items-center justify-center rounded-full border border-bege-escuro/65 bg-roxo-escuro text-bege-escuro shadow-[0_0_28px_rgba(191,167,122,0.22)] transition overflow-hidden"
          aria-label={isOpen ? "Fechar ferramentas do mestre" : "Abrir ferramentas do mestre"}
        >
          {isOpen ? <X size={22} strokeWidth={1.5} /> : <WandSparkles size={24} strokeWidth={1.5} />}
        </button>
      </div>

      {/* Modais */}
      <CriarMundoModal       isOpen={activeModal === "mundo"}        onClose={closeModal} />
      <CriarPersonagemModal  isOpen={activeModal === "personagem"}   onClose={closeModal} />
      <CriarArtefatoModal    isOpen={activeModal === "artefato"}     onClose={closeModal} />
      <CriarLivroModal       isOpen={activeModal === "livro"}        onClose={closeModal} />
      <CriarEquipamentoModal isOpen={activeModal === "equipamento"}  onClose={closeModal} />
      <CriarHabilidadeModal  isOpen={activeModal === "habilidade"}   onClose={closeModal} />
    </>
  );
}