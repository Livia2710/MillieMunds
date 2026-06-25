"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import MillieModal from "@/componentes/ui/MillieModal";
import MillieInput from "@/componentes/ui/MillieInput";
import MillieTextarea from "@/componentes/ui/MillieTextarea";
import MillieSelect from "@/componentes/ui/MillieSelect";
import { PrimaryButton } from "@/componentes/PrimaryButton";
import { WORLD_COVER_COLORS, DEFAULT_WORLD_COVER_COLOR } from "@/lib/types/world";
import type { InventoryRarity } from "@/lib/types/inventory";
import { createInventoryItem } from "@/app/actions/inventory";

type Props = { isOpen: boolean; onClose: () => void }
type ChapterDraft = { title: string; content: string }

const RARITY_OPTIONS: { value: InventoryRarity; label: string }[] = [
  { value: "comum", label: "Comum" }, { value: "incomum", label: "Incomum" },
  { value: "raro", label: "Raro" }, { value: "epico", label: "Épico" },
  { value: "lendario", label: "Lendário" }, { value: "mitico", label: "Mítico" },
]
const COVER_TYPE_OPTIONS = [{ value: "color", label: "Cor sólida" }, { value: "image", label: "Imagem" }]
const colorOptions = WORLD_COVER_COLORS.map((c) => ({ value: c.value, label: c.label }))

export default function CriarLivroModal({ isOpen, onClose }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState("")
  const [author, setAuthor] = useState("")
  const [rarity, setRarity] = useState<InventoryRarity>("comum")
  const [worldSlug, setWorldSlug] = useState("")
  const [coverType, setCoverType] = useState<"color" | "image">("color")
  const [coverColor, setCoverColor] = useState(DEFAULT_WORLD_COVER_COLOR)
  const [coverImage, setCoverImage] = useState("")
  const [chapters, setChapters] = useState<ChapterDraft[]>([{ title: "", content: "" }])
  const [error, setError] = useState("")

  function addChapter() { setChapters((p) => [...p, { title: "", content: "" }]) }
  function removeChapter(i: number) { setChapters((p) => p.filter((_, idx) => idx !== i)) }
  function updateChapter(i: number, field: keyof ChapterDraft, value: string) {
    setChapters((p) => p.map((ch, idx) => idx === i ? { ...ch, [field]: value } : ch))
  }

  function handleClose() {
    setName(""); setAuthor(""); setRarity("comum"); setWorldSlug("")
    setCoverType("color"); setCoverColor(DEFAULT_WORLD_COVER_COLOR)
    setCoverImage(""); setChapters([{ title: "", content: "" }]); setError(""); onClose()
  }

  function handleSubmit() {
    if (!name.trim()) { setError("Nome é obrigatório."); return }
    setError("")
    startTransition(async () => {
      try {
        await createInventoryItem({
          name: name.trim(), category: "livro", rarity,
          quantity: 1, worldSlug, author,
          coverType, coverColor: coverType === "color" ? coverColor : undefined,
          coverImage: coverType === "image" ? coverImage : undefined,
          chapters,
        })
        router.refresh()
        handleClose()
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Erro ao criar livro.")
      }
    })
  }

  return (
    <MillieModal isOpen={isOpen} onClose={handleClose} title="Criar Livro" maxWidth="max-w-2xl">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <MillieInput label="Título" placeholder="Ex: O Grimório das Sombras" value={name} onChange={(e) => setName(e.target.value)} />
          <MillieInput label="Autor (opcional)" placeholder="Ex: Arquimago Valdris" value={author} onChange={(e) => setAuthor(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <MillieSelect label="Raridade" options={RARITY_OPTIONS} value={rarity} onChange={(e) => setRarity(e.target.value as InventoryRarity)} />
          <MillieInput label="Mundo de Origem" placeholder="Ex: Umbra" value={worldSlug} onChange={(e) => setWorldSlug(e.target.value)} />
        </div>

        <div className="space-y-3 border border-bege-escuro/20 bg-roxo-escuro/30 p-4">
          <MillieSelect label="Tipo de Capa" options={COVER_TYPE_OPTIONS} value={coverType} onChange={(e) => setCoverType(e.target.value as "color" | "image")} />
          {coverType === "color" ? (
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <MillieSelect label="Cor da Capa" options={colorOptions} value={coverColor} onChange={(e) => setCoverColor(e.target.value as typeof coverColor)} />
              </div>
              <div className="mb-0.5 h-10 w-10 shrink-0 border border-bege-escuro/40" style={{ backgroundColor: coverColor }} />
            </div>
          ) : (
            <MillieInput label="URL da Imagem" placeholder="/assets/images/inventory/grimorio.jpg" value={coverImage} onChange={(e) => setCoverImage(e.target.value)} />
          )}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="font-title text-[10px] uppercase tracking-[0.2em] text-bege-escuro">Capítulos</span>
            <button onClick={addChapter} className="flex items-center gap-1.5 font-title text-[10px] uppercase tracking-widest text-bege-medio/60 hover:text-bege-claro">
              <Plus size={12} /> Adicionar
            </button>
          </div>
          <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
            {chapters.map((ch, i) => (
              <div key={i} className="border border-bege-escuro/20 bg-roxo-escuro/40 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-title text-[10px] uppercase tracking-widest text-bege-medio/50">Capítulo {i + 1}</span>
                  {chapters.length > 1 && <button onClick={() => removeChapter(i)} className="text-bege-medio/40 hover:text-red-400"><Trash2 size={12} /></button>}
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
          <PrimaryButton onClick={handleSubmit} disabled={isPending}>{isPending ? "Criando..." : "Criar Livro"}</PrimaryButton>
        </div>
      </div>
    </MillieModal>
  )
}