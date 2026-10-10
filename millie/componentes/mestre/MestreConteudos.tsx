"use client";
import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ExternalLink, FileText, Pencil, RefreshCw, Save, Trash2 } from "lucide-react";
import { SectionTitle, Empty } from "@/componentes/mestre/MestreUI";
import ConfirmModal from "@/componentes/modais/ConfirmModal";
import { useToast } from "@/componentes/ui/ToastProvider";
import { deleteWorld, getWorldsForMasterPanel, renameWorld } from "@/app/actions/world";
import { deleteInventoryItem, getBooksForMasterPanel, renameBook } from "@/app/actions/inventory";

type Row = { id: string; name: string; slug: string; isDraft: boolean; chapters: { id: string; title: string; content: string }[]; coverColor: string | null; coverImage: string | null; coverType?: string | null; author?: string | null; rarity?: string | null; kind: "world" | "book" };

export default function MestreConteudos() {
  const router = useRouter();
  const toast = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [worlds, books] = await Promise.all([getWorldsForMasterPanel(), getBooksForMasterPanel()]);
      setRows([
        ...worlds.map((world) => ({ id: world.id, name: world.name, slug: world.slug, isDraft: world.isDraft, chapters: world.chapters, coverColor: world.coverColor, coverImage: world.coverImage, kind: "world" as const })),
        ...books.map((book) => ({ id: book.id, name: book.name, slug: book.slug, isDraft: book.isDraft, chapters: book.chapters, coverColor: book.coverColor, coverImage: book.coverImage, coverType: book.coverType, author: book.author, rarity: book.rarity, kind: "book" as const })),
      ]);
      setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível carregar os conteúdos."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);

  function openEditor(row: Row) { window.open(`/mestre/editor/${row.kind}/${row.id}`, "_blank", "noopener,noreferrer"); }
  function saveRename(row: Row) {
    startTransition(async () => {
      try { if (row.kind === "world") await renameWorld(row.id, renameValue); else await renameBook(row.id, renameValue); await load(); router.refresh(); setEditingId(null); toast.success("Nome atualizado."); }
      catch (cause) { toast.error(cause instanceof Error ? cause.message : "Não foi possível renomear."); }
    });
  }
  async function remove(row: Row) { if (row.kind === "world") await deleteWorld(row.id); else await deleteInventoryItem(row.id); await load(); router.refresh(); }

  return <section className="space-y-3">
    <SectionTitle icon={<BookOpen size={14} />} label="Mundos e livros" />
    <div className="flex justify-end"><button type="button" onClick={() => void load()} className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-bege-escuro/60 hover:text-bege-claro"><RefreshCw size={12} /> Atualizar lista</button></div>
    {loading ? <Empty label="Carregando mundos e livros…" /> : rows.length === 0 ? <Empty label="Ainda não há mundos ou livros nesta campanha." /> : <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {rows.map((row) => <article key={`${row.kind}-${row.id}`} className="overflow-hidden border border-bege-escuro/20 bg-roxo-escuro/45">
        <div className="relative flex h-28 items-end overflow-hidden p-4" style={{ backgroundColor: row.coverType === "image" || row.kind === "world" ? row.coverColor ?? "#2a1307" : row.coverColor ?? "#2a1307", backgroundImage: row.coverImage && (row.kind === "world" || row.coverType === "image") ? `linear-gradient(0deg,rgba(20,12,20,.92),rgba(20,12,20,.08)),url("${row.coverImage}")` : undefined, backgroundSize: "cover", backgroundPosition: "center" }}>
          <span className="font-title text-sm uppercase tracking-widest text-bege-claro drop-shadow">{row.name}</span>
          <span className="absolute right-3 top-3 border border-bege-escuro/30 bg-roxo-escuro/75 px-2 py-1 text-[9px] uppercase tracking-wider">{row.kind === "world" ? "Mundo" : "Livro"}{row.isDraft ? " · Rascunho" : ""}</span>
        </div>
        <div className="space-y-3 p-4">
          {editingId === row.id ? <div className="flex gap-2"><input autoFocus value={renameValue} onChange={(event) => setRenameValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") saveRename(row); if (event.key === "Escape") setEditingId(null); }} className="min-w-0 flex-1 border border-bege-escuro/30 bg-black/20 px-3 py-2 text-sm text-bege-claro outline-none focus:border-bege-medio" aria-label="Novo nome" /><button type="button" onClick={() => saveRename(row)} disabled={pending} className="border border-bege-escuro/30 px-3 text-bege-claro disabled:opacity-50" title="Salvar nome"><Save size={15} /></button></div> : <div className="flex items-center justify-between gap-2"><p className="truncate text-xs text-bege-escuro/60">{row.chapters.length} {row.chapters.length === 1 ? "capítulo" : "capítulos"}{row.kind === "book" && row.author ? ` · ${row.author}` : ""}</p><button type="button" onClick={() => { setEditingId(row.id); setRenameValue(row.name); }} title="Renomear" className="flex h-8 w-8 shrink-0 items-center justify-center border border-bege-escuro/20 hover:bg-white/5"><Pencil size={13} /></button></div>}
          <div className="flex gap-2">
            <button type="button" onClick={() => openEditor(row)} className="flex min-h-9 flex-1 items-center justify-center gap-2 border border-bege-medio/40 bg-bege-escuro/5 px-2 text-[10px] uppercase tracking-wider text-bege-claro hover:bg-bege-escuro/15"><FileText size={13} /> Abrir editor</button>
            {!row.isDraft && <a href={row.kind === "world" ? `/mundos/${row.slug}` : `/inventario/${row.slug}`} target="_blank" rel="noreferrer" className="flex h-9 w-10 items-center justify-center border border-bege-escuro/25 hover:bg-white/5" aria-label="Visualizar"><ExternalLink size={14} /></a>}
            <button type="button" onClick={() => setDeleteTarget(row)} className="flex h-9 w-10 items-center justify-center border border-red-400/25 text-red-300 hover:bg-red-950/30" aria-label="Excluir"><Trash2 size={14} /></button>
          </div>
        </div>
      </article>)}
    </div>}
    {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
    <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => deleteTarget ? remove(deleteTarget) : undefined} title={`Excluir ${deleteTarget?.kind === "world" ? "mundo" : "livro"}`} message={`Excluir “${deleteTarget?.name}” permanentemente? Todos os capítulos serão removidos.`} confirmLabel="Excluir" successMessage="Conteúdo excluído." />
  </section>;
}
