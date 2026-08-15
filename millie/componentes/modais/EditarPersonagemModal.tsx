"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import MillieModal from "@/componentes/ui/MillieModal";
import MillieInput from "@/componentes/ui/MillieInput";
import MillieSelect from "@/componentes/ui/MillieSelect";
import MillieImageUpload from "@/componentes/ui/MillieImageUpload";
import { PrimaryButton } from "@/componentes/PrimaryButton";
import type { CharacterCategory } from "@/lib/types/character";
import { updateCharacter } from "@/app/actions/character";

type CharacterToEdit = {
  id: string;
  name: string;
  category: CharacterCategory;
  image: string | null;
  year: number | null;
  subject: string | null;
  occupation: string | null;
};

type Props = { isOpen: boolean; onClose: () => void; character: CharacterToEdit | null };

export default function EditarPersonagemModal({ isOpen, onClose, character }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [year, setYear] = useState("1");
  const [subject, setSubject] = useState("");
  const [occupation, setOccupation] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!character) return;
    setName(character.name);
    setImage(character.image ?? "");
    setYear(String(character.year ?? 1));
    setSubject(character.subject ?? "");
    setOccupation(character.occupation ?? "");
  }, [character]);

  function handleClose() {
    setError("");
    onClose();
  }

  function handleSubmit() {
    if (!character) return;
    if (!name.trim()) {
      setError("Nome é obrigatório.");
      return;
    }
    setError("");

    startTransition(async () => {
      try {
        await updateCharacter(character.id, {
          name: name.trim(),
          image: image || undefined,
          year: character.category === "aluno" ? Number(year) : undefined,
          subject: character.category === "professor" ? subject : undefined,
          occupation: character.category === "npc" ? occupation : undefined,
        });
        router.refresh();
        handleClose();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Erro ao editar personagem.");
      }
    });
  }

  if (!character) return null;

  return (
    <MillieModal isOpen={isOpen} onClose={handleClose} title="Editar Personagem" maxWidth="max-w-xl">
      <div className="space-y-4">
        <MillieInput label="Nome" value={name} onChange={(e) => setName(e.target.value)} />

        {character.category === "aluno" && (
          <MillieSelect
            label="Ano Letivo"
            options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n}º ano` }))}
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
        )}

        {character.category === "professor" && (
          <MillieInput label="Disciplina" value={subject} onChange={(e) => setSubject(e.target.value)} />
        )}

        {character.category === "npc" && (
          <MillieInput label="Ocupação" value={occupation} onChange={(e) => setOccupation(e.target.value)} />
        )}

        <MillieImageUpload label="Imagem" value={image} onChange={setImage} aspectRatio="portrait" />

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={handleClose}
            className="font-title text-xs uppercase tracking-widest text-bege-medio/50 hover:text-bege-claro"
          >
            Cancelar
          </button>
          <PrimaryButton onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar Alterações"}
          </PrimaryButton>
        </div>
      </div>
    </MillieModal>
  );
}