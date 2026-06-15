import Image from "next/image";
import type { WorldChapter } from "@/lib/types/world";

type MundoSummaryProps = {
  chapters: WorldChapter[];
  onSelectChapter: (chapterIndex: number) => void;
};

export function MundoSummary({
  chapters,
  onSelectChapter,
}: MundoSummaryProps) {
  return (
    <aside className="border-r border-bege-escuro/25 pr-6 pt-32">
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

      <nav className="mt-6">
        {chapters.map((chapter, index) => (
          <button
            key={chapter.id}
            type="button"
            onClick={() => onSelectChapter(index)}
            className={`flex min-h-13 w-full items-center gap-4 border border-transparent px-4 text-left font-title text-lg uppercase tracking-[0.12em] transition hover:border-bege-escuro/30 ${
              index === 0 ? "border-bege-escuro/35 bg-roxo" : ""
            }`}
          >
            {chapter.title}
          </button>
        ))}
      </nav>
    </aside>
  );
}