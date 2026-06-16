import type { InventoryItem } from "@/lib/types/inventory";

type BookInventoryItem = Extract<InventoryItem, { category: "livro" }>;

type InventoryBookDetailsProps = {
  book: BookInventoryItem;
};

export default function InventoryBookDetails({ book }: InventoryBookDetailsProps) {
  return (
    <main className="min-h-screen bg-roxo-escuro px-6 py-12 text-bege-medio md:px-16">
      <section className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[300px_1fr]">
        <aside
          className="min-h-[420px] border border-bege-escuro/45 p-8 shadow-card"
          style={{ backgroundColor: book.coverColor ?? "#2a1307" }}
        >
          <div className="flex h-full flex-col justify-between border border-bege-escuro/35 p-6 text-center">
            <div>
              <p className="font-title text-sm uppercase tracking-[0.24em] text-bege-escuro">
                Livro
              </p>

              <h1 className="mt-8 font-title text-3xl uppercase tracking-[0.1em] text-bege-claro">
                {book.name}
              </h1>
            </div>

            <p className="font-title text-sm text-bege-medio/80">
              {book.author ?? "Autor desconhecido"}
            </p>
          </div>
        </aside>

        <article>
          <p className="font-title text-sm uppercase tracking-[0.22em] text-bege-escuro">
            {book.rarity} / {book.worldSlug}
          </p>

          <h2 className="mt-3 font-title text-4xl uppercase tracking-[0.08em] text-bege-claro md:text-6xl">
            {book.name}
          </h2>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-bege-medio/90">
            {book.description}
          </p>

          <div className="mt-10 space-y-8 border-t border-bege-escuro/30 pt-8">
            {book.chapters.map((chapter) => (
              <section key={chapter.id}>
                <h3 className="font-title text-2xl uppercase tracking-[0.08em] text-bege-claro">
                  {chapter.title}
                </h3>

                <p className="mt-3 whitespace-pre-line leading-8 text-bege-medio/90">
                  {chapter.content}
                </p>
              </section>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}