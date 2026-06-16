"use client";

import { useMemo, useState, useEffect } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type {InventoryCategory,InventoryItem, InventoryRarity,} from "@/lib/types/inventory";
import InventoryCard from "./InventoryCard";
import InventoryFilters from "./InventoryFilters";

export type InventoryCategoryFilter = "todos" | InventoryCategory;
export type InventoryRarityFilter = "todos" | InventoryRarity;

type InventoryGridProps = {
  items: InventoryItem[];
  isMaster: boolean;
};

const ITEMS_PER_PAGE = 18;

export default function InventoryGrid({ items, isMaster }: InventoryGridProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<InventoryCategoryFilter>("todos");
  const [rarity, setRarity] = useState<InventoryRarityFilter>("todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.name
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesCategory =
        category === "todos" || item.category === category;

      const matchesRarity = rarity === "todos" || item.rarity === rarity;

      return matchesSearch && matchesCategory && matchesRarity;
    });
  }, [items, search, category, rarity]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, category, rarity]);

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const paginatedItems = filteredItems.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  const filtersProps = {
    category,
    setCategory,
    rarity,
    setRarity,
  };

  const usedSpaces = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <main className="min-h-screen bg-roxo-escuro text-bege-escuro font-body md:grid md:grid-cols-[220px_1fr]">
      <div className="hidden md:block">
        <InventoryFilters {...filtersProps} variant="desktop" />
      </div>

      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 md:hidden">
          <aside className="absolute bottom-0 left-0 right-0 max-h-[82vh] overflow-y-auto border-t border-bege-escuro/40 bg-roxo-escuro px-6 py-7 shadow-header">
            <div className="mb-5 flex items-center justify-between border-b border-bege-escuro/30 pb-4">
              <h2 className="font-title text-xl uppercase tracking-[0.16em] text-bege-medio">
                Filtros
              </h2>

              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(false)}
                className="flex h-9 w-9 items-center justify-center text-bege-medio"
                aria-label="Fechar filtros"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <InventoryFilters {...filtersProps} variant="mobile" />
          </aside>
        </div>
      )}

      <section className="flex min-h-screen flex-col justify-between px-4 py-9 sm:px-6 md:px-12 md:py-16">
        <div>
          <div className="mb-6 flex flex-col gap-5 md:mb-10 md:flex-row md:items-end md:justify-between md:gap-8">
            <div>
              <h1 className="font-title text-4xl uppercase tracking-[0.08em] text-bege-medio sm:text-5xl md:text-6xl">
                Inventário
              </h1>

              <p className="mt-3 font-title text-lg text-bege-claro sm:text-xl md:text-2xl">
                {usedSpaces}/200 espaços utilizados
              </p>

              {isMaster && (
                <p className="mt-2 font-title text-base text-bege-medio/80">
                  Todos os itens registrados da campanha
                </p>
              )}
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-3 md:block md:w-full md:max-w-md">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-bege-escuro/60 md:h-5 md:w-5" />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar..."
                  className="h-11 w-full border border-bege-escuro/40 bg-transparent pl-11 pr-4 text-base tracking-wider text-bege-claro outline-none placeholder:font-title placeholder:text-bege-medio/55 md:h-14 md:pl-12 md:text-lg"
                />
              </div>

              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(true)}
                className="flex h-11 items-center justify-center gap-2 border border-bege-escuro/40 px-4 font-title text-sm uppercase tracking-[0.12em] text-bege-medio md:hidden"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mb-5 md:hidden">
            <MobilePagination
              currentPage={currentPage}
              pages={pageNumbers}
              setCurrentPage={setCurrentPage}
            />
          </div>

          {paginatedItems.length > 0 ? (
            <div className="grid grid-cols-3 gap-3 md:grid-cols-4 md:gap-5 lg:grid-cols-6">
              {paginatedItems.map((item) => (
                <InventoryCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <p className="mt-16 text-center font-title text-lg tracking-wide text-bege-medio/70">
              Nenhum item encontrado.
            </p>
          )}

          <div className="mt-6 md:hidden">
            <MobilePagination
              currentPage={currentPage}
              pages={pageNumbers}
              setCurrentPage={setCurrentPage}
            />
          </div>
        </div>

        {totalPages > 1 && (
          <div className="mt-12 hidden items-center justify-center gap-6 font-title text-lg tracking-wider md:flex">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="flex h-10 w-10 items-center justify-center rounded border border-bege-escuro/30 disabled:opacity-20"
            >
              &lt;
            </button>

            {pageNumbers.map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`flex h-10 w-10 items-center justify-center border ${
                  currentPage === page
                    ? "border-bege-claro text-bege-claro"
                    : "border-transparent text-bege-medio"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="flex h-10 w-10 items-center justify-center rounded border border-bege-escuro/30 disabled:opacity-20"
            >
              &gt;
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

function MobilePagination({
  currentPage,
  pages,
  setCurrentPage,
}: {
  currentPage: number;
  pages: number[];
  setCurrentPage: (page: number) => void;
}) {
  if (pages.length <= 1) return null;

  return (
    <div className="flex justify-center gap-2">
      {pages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => setCurrentPage(page)}
          className={`flex h-7 w-7 items-center justify-center border font-title text-xs ${
            currentPage === page
              ? "border-bege-claro bg-bege-claro text-roxo-escuro"
              : "border-bege-escuro/40 text-bege-medio"
          }`}
        >
          {page}
        </button>
      ))}
    </div>
  );
}