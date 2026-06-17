"use client";

import { useState } from "react";
import Image from "next/image";
import type { InventoryItem } from "@/lib/types/inventory";
import BookCover from "./BookCover";

type BookInventoryItem = Extract<InventoryItem, { category: "livro" }>;

export default function InventoryBookDetails({
  book,
}: {
  book: BookInventoryItem;
}) {
  const [currentChapter, setCurrentChapter] = useState(0);

  const chapter = book.chapters[currentChapter];

  const nextChapter = () => {
    setCurrentChapter((prev) => Math.min(prev + 1, book.chapters.length - 1));
  };

  const previousChapter = () => {
    setCurrentChapter((prev) => Math.max(prev - 1, 0));
  };

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

            <p className="mt-5 leading-8 text-bege-medio/90">
              {book.description}
            </p>
          </div>

          {/* SELECT CAPITULOS */}
          <div className="mt-8 border border-bege-escuro/40">
            <select
              value={currentChapter}
              onChange={(e) => setCurrentChapter(Number(e.target.value))}
              className="w-full bg-transparent px-5 py-4 font-title uppercase tracking-wider text-bege-medio outline-none"
            >
              {book.chapters.map((chapter, index) => (
                <option
                  key={chapter.id}
                  value={index}
                  className="bg-roxo-escuro"
                >
                  {chapter.title}
                </option>
              ))}
            </select>
          </div>

          {/* CAPITULO ATUAL */}
          <div className="mt-8 min-h-65">
            <h2 className="font-title text-2xl uppercase tracking-wider text-bege-claro">
              {chapter.title}
            </h2>

            <p className="mt-4 whitespace-pre-line leading-8 text-bege-medio/90">
              {chapter.content}
            </p>
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
              Capítulo{" "}
              <span className="text-xl text-bege-claro">
                {currentChapter + 1}
              </span>{" "}
              de{" "}
              <span className="text-xl text-bege-claro">
                {book.chapters.length}
              </span>
            </span>

            <button
              onClick={nextChapter}
              disabled={currentChapter === book.chapters.length - 1}
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
    </main>
  );
}
