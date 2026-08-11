"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import MillieModal from "@/componentes/ui/MillieModal";
import MillieInput from "@/componentes/ui/MillieInput";
import MillieTextarea from "@/componentes/ui/MillieTextarea";
import MillieSelect from "@/componentes/ui/MillieSelect";
import { PrimaryButton } from "@/componentes/PrimaryButton";
import { WORLD_COVER_COLORS, DEFAULT_WORLD_COVER_COLOR } from "@/lib/types/world";
import { updateWorld } from "@/app/actions/world";

type ChapterDraft = { title: string; content: string };

type WorldToEdit = {
  id: string;
  name: string;
  description: string | null;
  coverColor: string | null;
  chapters: { title: string; content: string }[];
};

type Props = { isOpen: boolean; onClose: () => void; world: WorldToEdit | null };

const colorOptions = WORLD_COVER_COLORS.map((c) => ({ value: c.value, label: c.label }));

export default function EditarMundoModal({ isOpen, onClose, world }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [coverColor, setCoverColor] = useState(DEFAULT_WORLD_COVER_COLOR);
  const [chapters, setChapters] = useState<ChapterDraft[]>([{ title: "", content: "" }]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!world) return;
    setName(world.name);
    setDescription(world.description ?? "");
    setCoverColor((world.coverColor as typeof coverColor) ?? DEFAULT_WORLD_COVER_COLOR);
    setChapters(world.chapters.length ? world.chapters : [{ title: "", content: "" }]);
  }, [world]);

  function addChapter() { setChapters((p) => [...p, { title: "", content: "" }]); }
  function removeChapter(i: number) { setChapters((p) => p.filter((_, idx) => idx !== i)); }
  function updateChapter(i: number, field: keyof ChapterDraft, value: string) {
    setChapters((p) => p.map((ch, idx) => (idx === i ? { ...ch, [field]: value } : ch)));
  }

  function handleClose() { setError(""); onClose(); }

  function handleSubmit() {
    if (!world) return;
    if (!name.trim()) { setError("Nome é obrigatório."); return; }
    setError("");
    startTransition(async () => {
      try {
        await updateWorld(world.id, { name: name.trim(), description: description.trim(), coverColor, chapters });
        router.refresh();
        handleClose();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Erro ao editar mundo.");
      }
    });
  }

  return (
    <MillieModal isOpen={isOpen} onClose={handleClose} title="Editar Mundo" maxWidth="max-w-2xl">
      <div className="space-y-5">
        <MillieInput label="Nome do Mundo" value={name} onChange={(e) => setName(e.target.value)} />
        <MillieTextarea label="Descrição" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />

        <div className="flex items-end gap-3">
          <div className="flex-1">
            <MillieSelect label="Cor da Capa" options={colorOptions} value={coverColor}
              onChange={(e) => setCoverColor(e.target.value as typeof coverColor)} />
          </div>
          <div className="mb-0.5 h-10 w-10 shrink-0 border border-bege-escuro/40" style={{ backgroundColor: coverColor }} />
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="font-title text-[10px] uppercase tracking-[0.2em] text-bege-escuro">Capítulos</span>
            <button onClick={addChapter} className="flex items-center gap-1.5 font-title text-[10px] uppercase tracking-widest text-bege-medio/60 hover:text-bege-claro">
              <Plus size={12} /> Adicionar
            </button>
          </div>
          <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
            {chapters.map((ch, i) => (
              <div key={i} className="border border-bege-escuro/20 bg-roxo-escuro/40 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-title text-[10px] uppercase tracking-widest text-bege-medio/50">Capítulo {i + 1}</span>
                  {chapters.length > 1 && (
                    <button onClick={() => removeChapter(i)} className="text-bege-medio/40 hover:text-red-400"><Trash2 size={12} /></button>
                  )}
                </div>
                <div className="space-y-3">
                  <MillieInput placeholder="Título" value={ch.title} onChange={(e) => updateChapter(i, "title", e.target.value)} />
                  <MillieTextarea placeholder="Conteúdo..." rows={3} value={ch.content} onChange={(e) => updateChapter(i, "content", e.target.value)} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex justify-end gap-3 border-t border-bege-escuro/20 pt-4">
          <button onClick={handleClose} className="font-title text-xs uppercase tracking-widest text-bege-medio/50 hover:text-bege-claro">Cancelar</button>
          <PrimaryButton onClick={handleSubmit} disabled={isPending}>{isPending ? "Salvando..." : "Salvar Alterações"}</PrimaryButton>
        </div>
      </div>
    </MillieModal>
  );
}