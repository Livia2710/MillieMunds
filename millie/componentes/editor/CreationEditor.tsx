"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowLeft, ArrowUp, Eye, FileDown, Plus, Save, Send, Trash2 } from "lucide-react";
import MillieImageUpload from "@/componentes/ui/MillieImageUpload";
import MillieInput from "@/componentes/ui/MillieInput";
import MillieTextarea from "@/componentes/ui/MillieTextarea";
import MillieSelect from "@/componentes/ui/MillieSelect";
import { PrimaryButton } from "@/componentes/PrimaryButton";
import RichTextChapterEditor from "@/componentes/editor/RichTextChapterEditor";
import { DEFAULT_WORLD_COVER_COLOR, WORLD_COVER_COLORS } from "@/lib/types/world";
import type { InventoryRarity } from "@/lib/types/inventory";
import { updateWorld, publishWorld } from "@/app/actions/world";
import { updateInventoryBook, publishBook } from "@/app/actions/inventory";

type Chapter = { id?: string; title: string; content: string };
type WorldInitial = { id: string; name: string; description: string | null; coverColor: string | null; coverImage: string | null; pageColor?: string; pageTexture?: boolean; pageHeader?: string; pageFooter?: string; isDraft: boolean; chapters: Chapter[] };
type BookInitial = { id: string; name: string; author: string | null; rarity: string; worldSlug: string | null; coverType: string | null; coverColor: string | null; coverImage: string | null; pageColor?: string; pageTexture?: boolean; pageHeader?: string; pageFooter?: string; isDraft: boolean; chapters: Chapter[] };
type Props = { kind: "world" | "book"; initial: WorldInitial | BookInitial };
type Snapshot = { name: string; description: string; author: string; rarity: string; worldSlug: string; coverType: string; coverColor: string; coverImage: string; pageColor: string; pageTexture: boolean; pageHeader: string; pageFooter: string; chapters: Chapter[] };
const coverColors = WORLD_COVER_COLORS.map((color) => ({ value: color.value, label: color.label }));
const rarityOptions = [{ value: "comum", label: "Comum" }, { value: "incomum", label: "Incomum" }, { value: "raro", label: "Raro" }, { value: "epico", label: "Épico" }, { value: "lendario", label: "Lendário" }, { value: "mitico", label: "Mítico" }];
const coverOptions = [{ value: "color", label: "Cor sólida" }, { value: "image", label: "Imagem" }];

export default function CreationEditor({ kind, initial }: Props) {
  const router = useRouter();
  const isWorld = kind === "world";
  const world = initial as WorldInitial;
  const book = initial as BookInitial;
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(isWorld ? world.description ?? "" : "");
  const [author, setAuthor] = useState(!isWorld ? book.author ?? "" : "");
  const [rarity, setRarity] = useState<InventoryRarity>(!isWorld ? book.rarity as InventoryRarity : "comum");
  const [worldSlug, setWorldSlug] = useState(!isWorld ? book.worldSlug ?? "" : "");
  const [coverType, setCoverType] = useState<"color" | "image">(!isWorld && book.coverType === "image" ? "image" : "color");
  const [coverColor, setCoverColor] = useState(initial.coverColor ?? DEFAULT_WORLD_COVER_COLOR);
  const [coverImage, setCoverImage] = useState(initial.coverImage ?? "");
  const [pageColor, setPageColor] = useState(initial.pageColor ?? "#f7f3e9");
  const [pageTexture, setPageTexture] = useState(initial.pageTexture ?? true);
  const [pageHeader, setPageHeader] = useState(initial.pageHeader ?? "");
  const [pageFooter, setPageFooter] = useState(initial.pageFooter ?? "");
  const [chapters, setChapters] = useState<Chapter[]>(initial.chapters.length ? initial.chapters.map(({ title, content }) => ({ title, content })) : [{ title: "Introdução", content: "<p></p>" }]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDraft, setIsDraft] = useState(initial.isDraft);
  const [status, setStatus] = useState("Salvo");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());

  const snapshot: Snapshot = { name, description, author, rarity, worldSlug, coverType, coverColor, coverImage, pageColor, pageTexture, pageHeader, pageFooter, chapters };
  function persist(value: Snapshot) {
    saveQueue.current = saveQueue.current.catch(() => undefined).then(async () => {
      if (isWorld) await updateWorld(initial.id, { name: value.name, description: value.description, coverColor: value.coverColor, coverImage: value.coverImage || undefined, pageColor: value.pageColor, pageTexture: value.pageTexture, pageHeader: value.pageHeader, pageFooter: value.pageFooter, chapters: value.chapters });
      else await updateInventoryBook(initial.id, { name: value.name, author: value.author, rarity: value.rarity, worldSlug: value.worldSlug, coverType: value.coverType, coverColor: value.coverType === "color" ? value.coverColor : undefined, coverImage: value.coverType === "image" ? value.coverImage : undefined, pageColor: value.pageColor, pageTexture: value.pageTexture, pageHeader: value.pageHeader, pageFooter: value.pageFooter, chapters: value.chapters });
    });
    return saveQueue.current;
  }

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setStatus("Salvando…"); setError("");
      void persist(snapshot).then(() => { if (active) setStatus("Salvo automaticamente"); }).catch((reason: unknown) => {
        if (active) { setStatus("Falha ao salvar"); setError(reason instanceof Error ? reason.message : "Não foi possível salvar o rascunho."); }
      });
    }, 1300);
    return () => { active = false; window.clearTimeout(timer); };
    // Snapshot fields define the autosave payload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, description, author, rarity, worldSlug, coverType, coverColor, coverImage, pageColor, pageTexture, pageHeader, pageFooter, chapters]);

  async function saveNow() {
    setStatus("Salvando…"); setError("");
    try { await persist(snapshot); setStatus("Salvo automaticamente"); }
    catch (reason) { const message = reason instanceof Error ? reason.message : "Não foi possível salvar."; setStatus("Falha ao salvar"); setError(message); throw reason; }
  }

  async function publish() {
    try {
      await saveNow();
      if (isWorld) await publishWorld(initial.id); else await publishBook(initial.id);
      setIsDraft(false); setStatus("Publicado"); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível publicar."); }
  }

  function moveChapter(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= chapters.length) return;
    setChapters((current) => { const next = [...current]; [next[index], next[target]] = [next[target], next[index]]; return next; });
    setActiveIndex(target);
  }

  function addChapter() {
    const next = [...chapters, { title: `Capítulo ${chapters.length + 1}`, content: "<p></p>" }];
    setChapters(next); setActiveIndex(next.length - 1); setPreview(false);
  }

  const coverStyle = { backgroundColor: coverColor, ...((isWorld || coverType === "image") && coverImage ? { backgroundImage: `url("${coverImage}")`, backgroundSize: "cover", backgroundPosition: "center" } : {}) };

  return <main className="min-h-screen bg-roxo-escuro text-bege-medio">
    <header className="sticky top-0 z-30 flex flex-wrap items-center gap-3 border-b border-bege-escuro/20 bg-roxo-escuro/95 px-4 py-3 backdrop-blur md:px-8">
      <button type="button" onClick={() => router.push("/mestre")} aria-label="Voltar ao painel do Mestre" className="flex h-9 w-9 items-center justify-center border border-bege-escuro/25 hover:bg-white/5"><ArrowLeft size={16} /></button>
      <div className="min-w-0 flex-1"><h1 className="truncate font-title text-sm uppercase tracking-[.15em] text-bege-claro">{name || (isWorld ? "Novo mundo" : "Novo livro")}</h1><p className="text-[10px] text-bege-escuro/60">{status}{isDraft ? " · Rascunho privado" : ""}</p></div>
      <button type="button" onClick={() => setPreview((current) => !current)} className="flex h-9 items-center gap-2 border border-bege-escuro/30 px-3 text-[10px] uppercase tracking-widest hover:bg-white/5"><Eye size={14} />{preview ? "Editar" : "Visualizar"}</button>
      <button type="button" onClick={() => { setPreview(true); window.setTimeout(() => window.print(), 250); }} className="flex h-9 items-center gap-2 border border-bege-escuro/30 px-3 text-[10px] uppercase tracking-widest hover:bg-white/5"><FileDown size={14} />PDF</button>
      <button type="button" onClick={() => void saveNow()} className="flex h-9 items-center gap-2 border border-bege-escuro/30 px-3 text-[10px] uppercase tracking-widest hover:bg-white/5"><Save size={14} />Salvar</button>
      {isDraft && <PrimaryButton onClick={() => void publish()}><span className="flex items-center gap-2"><Send size={14} /> Publicar</span></PrimaryButton>}
    </header>

    <div className={`mx-auto max-w-[1500px] gap-5 px-4 py-5 md:px-8 ${preview ? "block" : "grid lg:grid-cols-[290px_minmax(0,1fr)]"}`}>
      {!preview && <aside className="space-y-4 lg:sticky lg:top-22 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
        <section className="space-y-3 border border-bege-escuro/20 bg-black/10 p-4">
          <p className="font-title text-[10px] uppercase tracking-[.2em] text-bege-escuro/70">Dados do {isWorld ? "mundo" : "livro"}</p>
          <MillieInput label={isWorld ? "Nome do mundo" : "Título"} value={name} onChange={(event) => setName(event.target.value)} />
          {isWorld ? <MillieTextarea label="Descrição" rows={3} value={description} onChange={(event) => setDescription(event.target.value)} /> : <>
            <MillieInput label="Autor" value={author} onChange={(event) => setAuthor(event.target.value)} />
            <MillieSelect label="Raridade" options={rarityOptions} value={rarity} onChange={(event) => setRarity(event.target.value as InventoryRarity)} />
            <MillieInput label="Mundo de origem" value={worldSlug} onChange={(event) => setWorldSlug(event.target.value)} />
            <MillieSelect label="Tipo de capa" options={coverOptions} value={coverType} onChange={(event) => setCoverType(event.target.value as "color" | "image")} />
          </>}
          {isWorld || coverType === "color" ? <div><MillieSelect label="Cor da capa" options={coverColors} value={coverColor} onChange={(event) => setCoverColor(event.target.value)} /><div className="mt-2 h-7 border border-bege-escuro/25" style={{ backgroundColor: coverColor }} /></div> : null}
          {(isWorld || coverType === "image") && <MillieImageUpload label="Imagem de capa" value={coverImage} onChange={setCoverImage} aspectRatio="card" />}
        </section>
        <section className="space-y-3 border border-bege-escuro/20 bg-black/10 p-4">
          <p className="font-title text-[10px] uppercase tracking-[.2em] text-bege-escuro/70">Aparência das páginas</p>
          <label className="flex items-center justify-between gap-3 text-xs"><span>Cor do fundo</span><input aria-label="Cor do fundo das páginas" type="color" value={pageColor} onChange={(event) => setPageColor(event.target.value)} className="h-9 w-12 cursor-pointer border border-bege-escuro/30 bg-transparent p-1" /></label>
          <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={pageTexture} onChange={(event) => setPageTexture(event.target.checked)} /> Manter textura e sombreamento de papel</label>
          <MillieInput label="Cabeçalho (opcional)" value={pageHeader} onChange={(event) => setPageHeader(event.target.value)} />
          <MillieInput label="Rodapé (opcional)" value={pageFooter} onChange={(event) => setPageFooter(event.target.value)} />
          <p className="text-[10px] text-bege-escuro/60">Cabeçalho e rodapé aparecem em cada página do conteúdo.</p>
        </section>
        <section className="border border-bege-escuro/20 bg-black/10 p-3">
          <div className="mb-3 flex items-center justify-between"><p className="font-title text-[10px] uppercase tracking-[.2em] text-bege-escuro/70">Capítulos e seções</p><button type="button" onClick={addChapter} title="Adicionar capítulo" className="flex h-8 w-8 items-center justify-center border border-bege-escuro/25 hover:bg-white/5"><Plus size={15} /></button></div>
          <div className="space-y-1">{chapters.map((chapter, index) => <div key={index} className={`flex items-center gap-1 border p-1 ${activeIndex === index ? "border-bege-medio/60 bg-white/5" : "border-transparent"}`}>
            <button type="button" onClick={() => { setActiveIndex(index); setPreview(false); }} className="min-w-0 flex-1 truncate px-2 py-2 text-left text-xs">{chapter.title || `Capítulo ${index + 1}`}</button>
            <button type="button" onClick={() => moveChapter(index, -1)} disabled={!index} title="Mover para cima" className="p-1 disabled:opacity-20"><ArrowUp size={12} /></button>
            <button type="button" onClick={() => moveChapter(index, 1)} disabled={index === chapters.length - 1} title="Mover para baixo" className="p-1 disabled:opacity-20"><ArrowDown size={12} /></button>
            <button type="button" onClick={() => { if (chapters.length === 1) { setChapters([{ title: "", content: "<p></p>" }]); setActiveIndex(0); } else { const next = chapters.filter((_, i) => i !== index); setChapters(next); setActiveIndex(Math.min(index, next.length - 1)); } }} title="Excluir capítulo" className="p-1 text-red-300/70 hover:text-red-300"><Trash2 size={12} /></button>
          </div>)}</div>
        </section>
      </aside>}

      {!preview && <section className="min-w-0 space-y-3">
        <MillieInput label="Título da seção" value={chapters[activeIndex]?.title ?? ""} onChange={(event) => setChapters((current) => current.map((chapter, index) => index === activeIndex ? { ...chapter, title: event.target.value } : chapter))} />
        <RichTextChapterEditor key={activeIndex} value={chapters[activeIndex]?.content ?? "<p></p>"} onChange={(content) => setChapters((current) => current.map((chapter, index) => index === activeIndex ? { ...chapter, content } : chapter))} pageColor={pageColor} pageTexture={pageTexture} />
      </section>}

      {preview && <article className="print-document mx-auto max-w-[900px] bg-[#f7f3e9] p-8 text-[#29251f] shadow-xl md:p-16">
        <section className="print-cover flex min-h-[70vh] flex-col items-center justify-center border-4 border-double border-[#8d754c] p-10 text-center" style={coverStyle}>
          <p className="font-title text-xs uppercase tracking-[.3em] opacity-70">{isWorld ? "Mundo" : "Livro"}</p>
          <h1 className="mt-5 font-title text-4xl uppercase tracking-[.14em] md:text-6xl">{name}</h1>
          {description && <p className="mt-8 max-w-xl text-lg leading-relaxed">{description}</p>}
          {!isWorld && author && <p className="mt-8 italic">{author}</p>}
        </section>
        {chapters.map((chapter, index) => <section key={index} className={`print-chapter relative min-h-[70vh] border-b border-[#b6a587] px-8 py-12 md:px-16 md:py-16 ${pageTexture ? "shadow-[inset_0_0_36px_rgba(86,45,14,0.10)]" : ""}`} style={{ backgroundColor: pageColor }}>
          {pageHeader && <div className="mb-6 border-b border-current/20 pb-2 text-xs tracking-widest opacity-65">{pageHeader}</div>}
          <h2 className="mb-8 border-b border-[#b6a587] pb-3 font-title text-2xl uppercase tracking-wider">{chapter.title || `Capítulo ${index + 1}`}</h2>
          <div className="rich-content" dangerouslySetInnerHTML={{ __html: chapter.content }} />
          {pageFooter && <div className="mt-8 border-t border-current/20 pt-2 text-right text-xs tracking-widest opacity-65">{pageFooter}</div>}
        </section>)}
      </article>}
    </div>
    {error && <div role="alert" className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-3xl border border-red-400/50 bg-roxo-escuro p-4 text-sm text-red-200 shadow-xl">{error}</div>}
    <style jsx global>{`@media print{body *{visibility:hidden!important}.print-document,.print-document *{visibility:visible!important}.print-document{display:block!important;position:absolute;left:0;top:0;width:100%;max-width:none!important;padding:0!important;background:#fff!important;box-shadow:none!important;color:#211d17!important}.print-cover{min-height:95vh!important;break-after:page;print-color-adjust:exact;-webkit-print-color-adjust:exact}.print-chapter{min-height:0!important;padding:18mm 12mm!important;break-after:page;print-color-adjust:exact;-webkit-print-color-adjust:exact}.print-chapter:last-child{break-after:auto}.rich-content{font:12pt/1.65 Georgia,serif}.rich-content img{max-width:100%;max-height:220mm;object-fit:contain}.editor-page-break,[data-page-break]{break-after:page}.fixed,header,aside{display:none!important}@page{size:A4;margin:15mm}}.rich-content p{margin:0 0 1em}.rich-content ul,.rich-content ol{padding-left:1.5em}.rich-content blockquote{margin:1.2em 0;padding-left:1em;border-left:3px solid #9b8258;font-style:italic}.rich-content img{display:block;max-width:100%;height:auto}.rich-content img[data-align="left"]{margin:1em auto 1em 0}.rich-content img[data-align="center"]{margin:1em auto}.rich-content img[data-align="right"]{margin:1em 0 1em auto}.rich-content table{width:100%;border-collapse:collapse}.rich-content td,.rich-content th{border:1px solid #b9aa8d;padding:.4em}`}</style>
  </main>;
}
