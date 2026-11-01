"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Lock, Pencil, Trash2 } from "lucide-react";
import type { Character } from "@/lib/types/character";
import { useCampaign } from "@/lib/contexts/CampaignContext";
import ConfirmModal from "@/componentes/modais/ConfirmModal";
import { unlockCharacter, deleteCharacter } from "@/app/actions/character";
import EditarPersonagemModal from "../modais/EditarPersonagemModal";
import CharacterCardModal from "./CharacterCardModal";

type CharacterCardProps = {
  character: Character;
  number?: number;
};

const rankCoatOfArms: Record<string, string> = {
  S: "/assets/svgs/rank/S.svg",
  A: "/assets/svgs/rank/A.svg",
  B: "/assets/svgs/rank/B.svg",
  C: "/assets/svgs/rank/C.svg",
  D: "/assets/svgs/rank/D.svg",
  E: "/assets/svgs/rank/E.svg",
  V: "/assets/svgs/rank/V.svg",
};

const elementIcons: Record<string, string> = {
  luz: "/assets/svgs/elemento/luz.svg", vento: "/assets/svgs/elemento/vento.svg",
  fogo: "/assets/svgs/elemento/fogo.svg", trevas: "/assets/svgs/elemento/trevas.svg",
  terra: "/assets/svgs/elemento/terra.svg", agua: "/assets/svgs/elemento/agua.svg",
};

function toRoman(value: number) {
  const numerals: [number, string][] = [[1000,"M"],[900,"CM"],[500,"D"],[400,"CD"],[100,"C"],[90,"XC"],[50,"L"],[40,"XL"],[10,"X"],[9,"IX"],[5,"V"],[4,"IV"],[1,"I"]];
  let remainder = Math.max(1, value);
  return numerals.reduce((result, [amount, numeral]) => {
    while (remainder >= amount) { result += numeral; remainder -= amount; }
    return result;
  }, "");
}

export default function CharacterCard({ character, number = 1 }: CharacterCardProps) {
  const { isMaster } = useCampaign();
  const router = useRouter();
  const [confirmUnlockOpen, setConfirmUnlockOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);

  async function handleUnlock() {
    await unlockCharacter(character.id);
    router.refresh();
  }

  async function handleDelete() {
    await deleteCharacter(character.id);
    router.refresh();
  }

  return (
    <div className="relative">
      <Link href={isMaster ? `/personagens/${character.id}` : "/personagens"} onClick={(event) => { if (!isMaster) { event.preventDefault(); setCardOpen(true) } }} className="block">
        <article className="arcane-hover group/card relative aspect-[2/3] w-full overflow-hidden border border-bege-medio/55 bg-[#160e1c] shadow-[0_10px_30px_rgba(0,0,0,.35)] transition duration-300 hover:-translate-y-1 hover:border-bege-claro/80 hover:shadow-[0_0_25px_rgba(209,186,142,.2)]">
          <div className="absolute inset-1 z-10 border border-bege-medio/30" />
          <div className="absolute inset-[7%] z-10 rounded-[48%] border border-bege-medio/30" />
          <div className="absolute inset-[13%] z-10 rotate-45 border border-bege-medio/20" />
          <div className="absolute inset-x-[13%] top-[18%] z-10 aspect-square rounded-full border border-bege-medio/15" />
          <div className="absolute inset-0 z-10 bg-gradient-to-b from-[#100a17]/50 via-transparent via-45% to-[#130b19]/95" />

          <div className="absolute left-1/2 top-3 z-20 flex h-8 w-8 -translate-x-1/2 rotate-45 items-center justify-center border border-bege-medio/65 bg-[#1a1022]/90 shadow-[0_0_12px_rgba(209,186,142,.18)]">
            <span className="-rotate-45 font-title text-[10px] text-bege-claro">{toRoman(number)}</span>
          </div>
          <div className="pointer-events-none absolute left-3 top-3 z-20 h-10 w-8 drop-shadow-[0_0_5px_rgba(209,186,142,.55)]">
            <img src={rankCoatOfArms[character.rank]} alt={`Rank ${character.rank}`} className="h-full w-full object-contain" />
          </div>

          {/* Ícones do Mestre — canto oposto ao brasão de rank */}
          {isMaster && (
            <div className="absolute right-3 top-3 z-30 flex gap-1.5">
              {character.isLocked && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setConfirmUnlockOpen(true);
                  }}
                  className="flex h-7 w-7 items-center justify-center border border-bege-medio/50 bg-roxo-escuro/90 hover:border-bege-claro"
                  aria-label="Desbloquear personagem"
                >
                  <Lock size={12} strokeWidth={1.5} className="text-bege-escuro" />
                </button>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setEditOpen(true);
                }}
                className="flex h-7 w-7 items-center justify-center border border-bege-medio/50 bg-roxo-escuro/90 hover:border-bege-claro"
                aria-label="Editar personagem"
              >
                <Pencil size={12} strokeWidth={1.5} className="text-bege-escuro" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setConfirmDeleteOpen(true);
                }}
                className="flex h-7 w-7 items-center justify-center border border-bege-medio/50 bg-roxo-escuro/90 hover:border-bege-claro"
                aria-label="Excluir personagem"
              >
                <Trash2 size={12} strokeWidth={1.5} className="text-bege-escuro" />
              </button>
            </div>
          )}

          <div className="absolute inset-x-[9%] bottom-[24%] top-[14%] flex items-center justify-center overflow-hidden">
            {(character.image || character.portraitImage) ? (
              <Image src={character.image || character.portraitImage!} alt={character.name} fill sizes="(max-width: 640px) 80vw, (max-width: 1024px) 36vw, 23vw" className="object-contain object-center transition duration-700 group-hover/card:scale-[1.025]" />
            ) : (
              <span className="text-center font-title text-xs uppercase tracking-[.2em] text-bege-medio/50">Sem imagem</span>
            )}
          </div>

          <div className="absolute inset-x-[8%] bottom-[6%] z-20 border-y border-bege-medio/60 bg-[linear-gradient(90deg,transparent,rgba(20,12,27,.94)_12%,rgba(20,12,27,.94)_88%,transparent)] px-4 py-3 text-center shadow-[0_0_18px_rgba(0,0,0,.25)]">
            <span aria-hidden="true" className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 text-[10px] text-bege-claro">✦</span>
            <h2 className="truncate font-title text-lg uppercase tracking-[0.13em] text-bege-claro sm:text-xl">{character.name}</h2>
            {elementIcons[character.element] && <img src={elementIcons[character.element]} alt="" aria-hidden="true" className="mx-auto mt-1 h-6 w-6 object-contain drop-shadow-[0_0_6px_rgba(209,186,142,.5)]" />}
          </div>
        </article>
      </Link>

      {!isMaster && <CharacterCardModal character={cardOpen ? character : null} onClose={() => setCardOpen(false)} />}

      <ConfirmModal
        isOpen={confirmUnlockOpen}
        onClose={() => setConfirmUnlockOpen(false)}
        onConfirm={handleUnlock}
        title="Desbloquear Personagem"
        message={`Tem certeza que quer desbloquear "${character.name}" para os jogadores?`}
        confirmLabel="Desbloquear"
        successMessage="Personagem desbloqueado para os jogadores."
      />

      <ConfirmModal
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Excluir Personagem"
        message={`Tem certeza que quer excluir "${character.name}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        successMessage="Personagem excluído com sucesso."
      />

       <EditarPersonagemModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        character={{
          id: character.id,
          name: character.name,
          category: character.category,
          image: character.image ?? null,
          portraitImage: character.portraitImage ?? null,
          year: character.category === "aluno" ? character.year : null,
          subject: character.category === "professor" ? character.subject : null,
          occupation: character.category === "npc" ? character.occupation : null,
        }}
      />
    </div>
  );
}
