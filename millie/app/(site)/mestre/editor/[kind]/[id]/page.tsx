import { notFound } from "next/navigation";
import CreationEditor from "@/componentes/editor/CreationEditor";
import { getWorldForEditor } from "@/app/actions/world";
import { getBookForEditor } from "@/app/actions/inventory";

export default async function CreationEditorPage({ params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params;
  if (kind === "world") {
    let world;
    try { world = await getWorldForEditor(id); } catch { notFound(); }
    if (!world) notFound();
    return <CreationEditor kind="world" initial={world} />;
  }
  if (kind === "book") {
    let book;
    try { book = await getBookForEditor(id); } catch { notFound(); }
    if (!book) notFound();
    return <CreationEditor kind="book" initial={book} />;
  }
  notFound();
}
