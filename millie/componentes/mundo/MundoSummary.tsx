import Image from "next/image";
import type { WorldChapter } from "@/lib/types/world";

type MundoSummaryProps = {
  chapters: WorldChapter[];
  onSelectChapter: (chapterIndex: number) => void;
  // Nova prop essencial para sincronizar o livro com o sumário
  activeChapterIndex: number; 
};

export function MundoSummary({
  chapters,
  onSelectChapter,
  activeChapterIndex,
}: MundoSummaryProps) {
  return (
    <aside className="border-r border-bege-escuro/25 pr-6 pt-32 select-none">
      <h2 className="font-title text-2xl uppercase tracking-[0.16em]">
        Sumário
      </h2>

      <Image
        src="/assets/svgs/divider.svg"
        alt=""
        width={180}
        height={20}
        className="mt-3"
      />

      <nav className="mt-6 flex flex-col gap-2">
        {chapters.map((chapter, index) => {
          // O capítulo está ativo se o índice dele for igual ao capítulo que o livro está exibindo
          const isActive = index === activeChapterIndex;

          return (
            <button
              key={chapter.id}
              type="button"
              onClick={() => onSelectChapter(index)}
              // Lógica dinâmica baseada no estado ativo + efeitos de hover responsivos
              className={`flex min-h-13 w-full items-center gap-4 px-4 text-left font-title text-lg uppercase tracking-[0.12em] transition-all duration-300 rounded-sm cursor-pointer
                ${
                  isActive
                    ? "border border-bege-escuro/35 bg-roxo shadow-md"
                    : "border border-transparent text-bege-escuro hover:border-bege-escuro/30 hover:bg-black/5"
                }`}
            >
              {chapter.title}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
