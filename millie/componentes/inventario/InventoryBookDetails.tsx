"use client";

import { useState } from "react";
import Image from "next/image";
import type { InventoryItem } from "@/lib/types/inventory";
import BookCover from "./BookCover";
import { splitRichPages } from "@/lib/types/world";

type BookInventoryItem = Extract<InventoryItem, { category: "livro" }>;

export default function InventoryBookDetails({
  book,
}: {
  book: BookInventoryItem;
}) {
  const [currentChapter, setCurrentChapter] = useState(0);

  const pages = book.chapters.flatMap((chapter, chapterIndex) => splitRichPages(chapter.content).map((content, pageIndex) => ({
    chapterIndex,
    title: pageIndex === 0 ? chapter.title : `${chapter.title} (continuação)`,
    content,
  })));
  const page = pages[currentChapter];

  const nextChapter = () => setCurrentChapter((prev) => Math.min(prev + 1, pages.length - 1));
  const previousChapter = () => setCurrentChapter((prev) => Math.max(prev - 1, 0));

  return (
    <main className="min-h-screen bg-roxo-escuro px-5 py-8 text-bege-medio md:px-16 md:py-14">
      <section className="mx-auto max-w-6xl grid gap-8 md:grid-cols-[260px_1fr]">
        {/* CAPA */}
        <aside>
          <BookCover book={book} />
        </aside>

        {/* LEITURA */}
        <article>
          <div className="text-center md:text-left">
            <p className="font-title text-sm uppercase tracking-[0.22em] text-bege-escuro">
              {book.rarity} / {book.worldSlug}
            </p>

            <h1 className="mt-3 font-title text-4xl uppercase tracking-wider text-bege-claro md:text-6xl">
              {book.name}
            </h1>

            <Image
              src="/assets/svgs/divider.svg"
              alt=""
              width={320}
              height={20}
              className="mx-auto mt-3 md:mx-0"
            />
          </div>

          {/* SELECT CAPITULOS */}
          <div className="mt-8 border border-bege-escuro/40">
            <select
              value={currentChapter}
              onChange={(e) => setCurrentChapter(Number(e.target.value))}
              className="w-full bg-transparent px-5 py-4 font-title uppercase tracking-wider text-bege-medio outline-none"
            >
              {pages.map((page, index) => (
                <option
                  key={`${page.chapterIndex}-${index}`}
                  value={index}
                  className="bg-roxo-escuro"
                >
                  {page.title}
                </option>
              ))}
            </select>
          </div>

          {/* CAPITULO ATUAL */}
          <div className={`mt-8 min-h-65 p-6 text-[#2a1307] ${book.pageTexture === false ? "" : "shadow-[inset_0_0_36px_rgba(86,45,14,0.10)]"}`} style={{ backgroundColor: book.pageColor ?? "#f7f3e9" }}>
            {book.pageHeader && <div className="mb-4 border-b border-[#9b8258]/30 pb-2 text-xs tracking-widest opacity-65">{book.pageHeader}</div>}
            <h2 className="font-title text-2xl uppercase tracking-wider text-bege-claro">
              {page?.title ?? "Livro vazio"}
            </h2>

            <div className="rich-book-content mt-4 leading-8 text-[#3c3327]" dangerouslySetInnerHTML={{ __html: page?.content ?? "" }} />
            {book.pageFooter && <div className="mt-6 border-t border-[#9b8258]/30 pt-2 text-right text-xs tracking-widest opacity-65">{book.pageFooter}</div>}
          </div>

          {/* NAVEGAÇÃO (Igual ao estilo do Grid) */}
          <div className="mt-10 flex items-center justify-between font-title text-base tracking-wider md:text-lg">
            <button
              onClick={previousChapter}
              disabled={currentChapter === 0}
              className="group flex h-10 w-10 items-center justify-center border border-bege-escuro/30 disabled:opacity-20"
            >
              <Image
                src="/assets/svgs/arrow.svg"
                alt="Voltar"
                width={16}
                height={16}
                className="transition-transform group-hover:-translate-x-1"
              />
            </button>

            <span className="text-bege-medio uppercase">
              Página{" "}
              <span className="text-xl text-bege-claro">
                {currentChapter + 1}
              </span>{" "}
              de{" "}
              <span className="text-xl text-bege-claro">
                {pages.length}
              </span>
            </span>

            <button
              onClick={nextChapter}
              disabled={pages.length === 0 || currentChapter >= pages.length - 1}
              className="group flex h-10 w-10 items-center justify-center border border-bege-escuro/30 disabled:opacity-20"
            >
              <Image
                src="/assets/svgs/arrow.svg"
                alt="Avançar"
                width={16}
                height={16}
                className="rotate-180 transition-transform group-hover:translate-x-1"
              />
            </button>
          </div>
        </article>
      </section>
      <style jsx global>{`.rich-book-content p{margin:0 0 1em}.rich-book-content ul,.rich-book-content ol{padding-left:1.5em}.rich-book-content img{display:block;max-width:100%;height:auto}.rich-book-content img[data-align="left"]{margin:1em auto 1em 0}.rich-book-content img[data-align="center"]{margin:1em auto}.rich-book-content img[data-align="right"]{margin:1em 0 1em auto}.rich-book-content blockquote{border-left:3px solid #bfa77a;padding-left:1em;font-style:italic}`}</style>
    </main>
  );
}

