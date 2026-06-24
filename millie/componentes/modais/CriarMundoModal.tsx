"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import MillieModal from "@/componentes/ui/MillieModal";
import MillieInput from "@/componentes/ui/MillieInput";
import MillieTextarea from "@/componentes/ui/MillieTextarea";
import MillieSelect from "@/componentes/ui/MillieSelect";
import {PrimaryButton} from "@/componentes/PrimaryButton";
import { WORLD_COVER_COLORS, DEFAULT_WORLD_COVER_COLOR } from "@/lib/types/world";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

type ChapterDraft = { title: string; content: string };

const colorOptions = WORLD_COVER_COLORS.map((c) => ({
  value: c.value,
  label: c.label,
}));

export default function CriarMundoModal({ isOpen, onClose }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [coverColor, setCoverColor] = useState<(typeof WORLD_COVER_COLORS)[number]["value"]>(DEFAULT_WORLD_COVER_COLOR);
  const [chapters, setChapters] = useState<ChapterDraft[]>([
    { title: "", content: "" },
  ]);

  function addChapter() {
    setChapters((prev) => [...prev, { title: "", content: "" }]);
  }

  function removeChapter(index: number) {
    setChapters((prev) => prev.filter((_, i) => i !== index));
  }

  function updateChapter(index: number, field: keyof ChapterDraft, value: string) {
    setChapters((prev) =>
      prev.map((ch, i) => (i === index ? { ...ch, [field]: value } : ch))
    );
  }

  function handleClose() {
    setName("");
    setDescription("");
    setCoverColor(DEFAULT_WORLD_COVER_COLOR);
    setChapters([{ title: "", content: "" }]);
    onClose();
  }

  function handleSubmit() {
    // TODO: conectar ao back-end
    console.log({ name, description, coverColor, chapters });
    handleClose();
  }

  return (
    <MillieModal isOpen={isOpen} onClose={handleClose} title="Criar Mundo" maxWidth="max-w-2xl">
      <div className="space-y-5">
        <MillieInput
          label="Nome do Mundo"
          placeholder="Ex: Aethelgard"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <MillieTextarea
          label="Descrição"
          placeholder="Uma breve descrição deste mundo..."
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="flex items-end gap-3">
          <div className="flex-1">
            <MillieSelect
              label="Cor da Capa"
              options={colorOptions}
              value={coverColor}
              onChange={(e) => setCoverColor(e.target.value as (typeof WORLD_COVER_COLORS)[number]["value"])}
            />
          </div>
          <div
            className="mb-0.5 h-10 w-10 shrink-0 border border-bege-escuro/40"
            style={{ backgroundColor: coverColor }}
          />
        </div>

        {/* Capítulos */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="font-title text-[10px] uppercase tracking-[0.2em] text-bege-escuro">
              Capítulos
            </span>
            <button
              onClick={addChapter}
              className="flex items-center gap-1.5 font-title text-[10px] uppercase tracking-widest text-bege-medio/60 transition-colors hover:text-bege-claro"
            >
              <Plus size={12} />
              Adicionar
            </button>
          </div>

          <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
            {chapters.map((ch, i) => (
              <div
                key={i}
                className="border border-bege-escuro/20 bg-roxo-escuro/40 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-title text-[10px] uppercase tracking-widest text-bege-medio/50">
                    Capítulo {i + 1}
                  </span>
                  {chapters.length > 1 && (
                    <button
                      onClick={() => removeChapter(i)}
                      className="text-bege-medio/40 transition-colors hover:text-red-400"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  <MillieInput
                    placeholder="Título do capítulo"
                    value={ch.title}
                    onChange={(e) => updateChapter(i, "title", e.target.value)}
                  />
                  <MillieTextarea
                    placeholder="Conteúdo do capítulo..."
                    rows={3}
                    value={ch.content}
                    onChange={(e) => updateChapter(i, "content", e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-bege-escuro/20 pt-4">
          <button
            onClick={handleClose}
            className="font-title text-xs uppercase tracking-widest text-bege-medio/50 transition-colors hover:text-bege-claro"
          >
            Cancelar
          </button>
          <PrimaryButton onClick={handleSubmit}>Criar Mundo</PrimaryButton>
        </div>
      </div>
    </MillieModal>
  );
}