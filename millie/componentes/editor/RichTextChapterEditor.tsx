"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { Extension, Node } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import Highlight from "@tiptap/extension-highlight";
import { AlignCenter, AlignLeft, AlignRight, Bold, Heading2, Highlighter, ImagePlus, Italic, List, ListOrdered, Quote, Underline as UnderlineIcon, Undo2, Redo2 } from "lucide-react";
type Props = { value: string; onChange: (html: string) => void; pageColor?: string; pageTexture?: boolean };
const PageBreak = Node.create({ name: "pageBreak", group: "block", atom: true, selectable: true,
  parseHTML() { return [{ tag: "div[data-page-break]" }]; },
  renderHTML() { return ["div", { "data-page-break": "true", class: "editor-page-break" }, ["span", {}, "Quebra de página"]]; },
});
const FontSize = Extension.create({
  name: "fontSize",
  addGlobalAttributes() {
    return [{ types: ["textStyle"], attributes: { fontSize: {
      default: null,
      parseHTML: (element) => element.style.fontSize || null,
      renderHTML: (attributes) => attributes.fontSize ? { style: `font-size: ${attributes.fontSize}` } : {},
    } } }];
  },
});
const AlignedImage = Image.extend({
  addAttributes() {
    return { ...this.parent?.(), align: { default: "center", parseHTML: (element) => element.getAttribute("data-align") || "center", renderHTML: (attributes) => ({ "data-align": attributes.align, style: `display:block;max-width:100%;height:auto;margin:1.2em ${attributes.align === "left" ? "auto 0" : attributes.align === "right" ? "0 auto" : "auto"}` }) } }
  },
})
const extensions = [StarterKit, Underline, TextStyle, Color, FontFamily, FontSize, Highlight.configure({ multicolor: true }), AlignedImage.configure({ inline: false, allowBase64: false }), TextAlign.configure({ types: ["heading", "paragraph"] }), PageBreak,
  Extension.create({ name: "customShortcuts", addKeyboardShortcuts() { return { "Mod-Enter": () => this.editor.commands.insertContent({ type: "pageBreak" }) }; } }),
];
export default function RichTextChapterEditor({ value, onChange, pageColor = "#f7f3e9", pageTexture = true }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState("");
  const editor = useEditor({ extensions, content: value || "<p></p>", immediatelyRender: false, onUpdate: ({ editor: current }) => onChange(current.getHTML()), editorProps: { attributes: { class: "rich-editor-content", spellcheck: "true" } } });
  const controls = useMemo(() => [
    { label: "Negrito", icon: <Bold size={15} />, run: () => editor?.chain().focus().toggleBold().run(), active: editor?.isActive("bold") },
    { label: "Itálico", icon: <Italic size={15} />, run: () => editor?.chain().focus().toggleItalic().run(), active: editor?.isActive("italic") },
    { label: "Sublinhado", icon: <UnderlineIcon size={15} />, run: () => editor?.chain().focus().toggleUnderline().run(), active: editor?.isActive("underline") },
    { label: "Título", icon: <Heading2 size={15} />, run: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), active: editor?.isActive("heading", { level: 2 }) },
    { label: "Lista", icon: <List size={15} />, run: () => editor?.chain().focus().toggleBulletList().run(), active: editor?.isActive("bulletList") },
    { label: "Lista numerada", icon: <ListOrdered size={15} />, run: () => editor?.chain().focus().toggleOrderedList().run(), active: editor?.isActive("orderedList") },
    { label: "Citação", icon: <Quote size={15} />, run: () => editor?.chain().focus().toggleBlockquote().run(), active: editor?.isActive("blockquote") },
    { label: "Realce", icon: <Highlighter size={15} />, run: () => editor?.chain().focus().toggleHighlight({ color: "#f2df9b" }).run(), active: editor?.isActive("highlight") },
    { label: "Alinhar à esquerda", icon: <AlignLeft size={15} />, run: () => editor?.chain().focus().setTextAlign("left").run(), active: false },
    { label: "Centralizar", icon: <AlignCenter size={15} />, run: () => editor?.chain().focus().setTextAlign("center").run(), active: false },
    { label: "Alinhar à direita", icon: <AlignRight size={15} />, run: () => editor?.chain().focus().setTextAlign("right").run(), active: false },
  ], [editor]);
  useEffect(() => { if (editor && editor.getHTML() !== value && value !== "") editor.commands.setContent(value, { emitUpdate: false }); }, [editor, value]);
  async function addImage(file?: File) {
    if (!file || !editor) return;
    setUploadError("");
    const data = new FormData(); data.append("file", file);
    const response = await fetch("/api/upload", { method: "POST", body: data }); const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "Falha ao enviar imagem");
    editor.chain().focus().setImage({ src: result.url, alt: file.name }).run();
  }
  if (!editor) return <div className="min-h-96 animate-pulse bg-white/5" />;
  return <div className={`overflow-hidden border border-bege-escuro/25 text-[#29251f] ${pageTexture ? "shadow-xl" : ""}`} style={{ backgroundColor: pageColor }}>
    <div className="flex flex-wrap items-center gap-1 border-b border-[#b9aa8d] bg-[#ebe4d6] p-2">
      {controls.map((control) => <button key={control.label} type="button" title={control.label} aria-label={control.label} onClick={control.run} className={`flex h-9 w-9 items-center justify-center border ${control.active ? "border-[#80622d] bg-[#d8c7a5]" : "border-transparent hover:border-[#b9aa8d] hover:bg-white/60"}`}>{control.icon}</button>)}
      <span className="mx-1 h-6 w-px bg-[#b9aa8d]" />
      <label title="Cor do texto" className="flex h-9 w-10 flex-col items-center justify-center gap-0.5 text-[8px] uppercase">Cor<input aria-label="Cor do texto" type="color" className="h-4 w-6 cursor-pointer border-0 bg-transparent p-0" onChange={(event) => editor.chain().focus().setColor(event.target.value).run()} /></label>
      <select aria-label="Fonte" title="Fonte" defaultValue="Georgia" onChange={(event) => editor.chain().focus().setFontFamily(event.target.value).run()} className="h-9 max-w-28 border border-[#b9aa8d] bg-[#f7f3e9] px-1 text-xs"><option>Georgia</option><option>Arial</option><option>Times New Roman</option><option>Cormorant Garamond</option><option>serif</option></select>
      <select aria-label="Tamanho do texto" title="Tamanho do texto" defaultValue="16px" onChange={(event) => editor.chain().focus().setMark("textStyle", { fontSize: event.target.value }).run()} className="h-9 border border-[#b9aa8d] bg-[#f7f3e9] px-1 text-xs">{[10, 12, 14, 16, 18, 24, 32].map((size) => <option key={size} value={`${size}px`}>{size}</option>)}</select>
      <button type="button" title="Alinhar imagem à esquerda" aria-label="Alinhar imagem à esquerda" onClick={() => editor.chain().focus().updateAttributes("image", { align: "left" }).run()} disabled={!editor.isActive("image")} className="flex h-9 w-9 items-center justify-center hover:bg-white/60 disabled:opacity-30"><AlignLeft size={15} /></button>
      <button type="button" title="Centralizar imagem" aria-label="Centralizar imagem" onClick={() => editor.chain().focus().updateAttributes("image", { align: "center" }).run()} disabled={!editor.isActive("image")} className="flex h-9 w-9 items-center justify-center hover:bg-white/60 disabled:opacity-30"><AlignCenter size={15} /></button>
      <button type="button" title="Alinhar imagem à direita" aria-label="Alinhar imagem à direita" onClick={() => editor.chain().focus().updateAttributes("image", { align: "right" }).run()} disabled={!editor.isActive("image")} className="flex h-9 w-9 items-center justify-center hover:bg-white/60 disabled:opacity-30"><AlignRight size={15} /></button>
      <button type="button" title="Inserir imagem" aria-label="Inserir imagem" onClick={() => inputRef.current?.click()} className="flex h-9 w-9 items-center justify-center hover:bg-white/60"><ImagePlus size={15} /></button>
      <button type="button" title="Quebra de página" aria-label="Inserir quebra de página" onClick={() => editor.chain().focus().insertContent({ type: "pageBreak" }).run()} className="px-2 text-[10px] uppercase tracking-wider hover:bg-white/60">Nova página</button>
      <span className="flex-1" />
      <button type="button" title="Desfazer" aria-label="Desfazer" onClick={() => editor.chain().focus().undo().run()} className="flex h-9 w-9 items-center justify-center hover:bg-white/60"><Undo2 size={15} /></button>
      <button type="button" title="Refazer" aria-label="Refazer" onClick={() => editor.chain().focus().redo().run()} className="flex h-9 w-9 items-center justify-center hover:bg-white/60"><Redo2 size={15} /></button>
    </div>
    <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void addImage(file).catch((reason: unknown) => setUploadError(reason instanceof Error ? reason.message : "Falha ao enviar imagem.")); event.currentTarget.value = ""; }} />
    {uploadError && <p role="alert" className="px-4 pt-3 text-xs text-red-700">{uploadError}</p>}
    <EditorContent editor={editor} />
    <style jsx global>{` .rich-editor-content{min-height:68vh;max-width:850px;margin:0 auto;padding:48px clamp(24px,7vw,82px);outline:none;font:17px/1.8 Georgia,serif}.rich-editor-content p{margin:0 0 1em}.rich-editor-content h2,.rich-editor-content h3{margin:1.4em 0 .7em;font-family:Georgia,serif}.rich-editor-content ul,.rich-editor-content ol{padding-left:1.5em;margin:.8em 0}.rich-editor-content blockquote{margin:1.3em 0;padding-left:1em;border-left:3px solid #9b8258;color:#65594a;font-style:italic}.rich-editor-content img{max-width:100%;height:auto;display:block}.editor-page-break,[data-page-break]{margin:24px -20px;border-top:1px dashed #8d7b60;height:1px;position:relative;break-after:page}.editor-page-break span{position:absolute;right:0;top:-12px;padding:2px 8px;color:#76684f;background:#f7f3e9;font:10px sans-serif}@media(max-width:640px){.rich-editor-content{min-height:58vh;padding:28px 20px;font-size:16px}} `}</style>
  </div>;
}
