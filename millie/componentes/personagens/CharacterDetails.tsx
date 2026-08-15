"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Pencil, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Character } from "@/lib/types/character";
import { updateCharacterHistory } from "@/app/actions/character";

type Props = {
  character: Character;
  canEditStory?: boolean;
};

const rankCoatOfArms: Record<string, string> = {
  S: "/assets/svgs/S.svg",
  A: "/assets/svgs/A.svg",
  B: "/assets/svgs/B.svg",
  C: "/assets/svgs/C.svg",
  D: "/assets/svgs/D.svg",
  E: "/assets/svgs/E.svg",
  V: "/assets/svgs/V.svg",
};

const elementIcon: Record<string, string> = {
  fogo: "/assets/svgs/fogo.svg",
  agua: "/assets/svgs/agua.svg",
  terra: "/assets/svgs/terra.svg",
  vento: "/assets/svgs/vento.svg",
  luz: "/assets/svgs/luz.svg",
  trevas: "/assets/svgs/trevas.svg",
};

const elementLabel: Record<string, string> = {
  fogo: "Fogo", agua: "Água", terra: "Terra",
  vento: "Vento", luz: "Luz", trevas: "Trevas",
};

function getCategoryLabel(category: Character["category"]) {
  const map = { aluno: "Aluno", professor: "Professor", npc: "NPC", monstro: "Monstro" };
  return map[category];
}

function getSpecificFields(character: Character): { label: string; value: string }[] {
  switch (character.category) {
    case "aluno":
      return [{ label: "Ano Letivo", value: `${character.year}º ano` }];
    case "professor":
      return [{ label: "Disciplina", value: character.subject }];
    case "npc":
      return [{ label: "Ocupação", value: character.occupation }];
    case "monstro":
      return [{ label: "Nível de Perigo", value: character.dangerLevel }];
  }
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-bege-escuro/20 py-2">
      <span className="font-title text-xs uppercase tracking-widest text-bege-escuro">
        {label}
      </span>
      <span className="font-body text-sm text-bege-claro/90 capitalize">{value}</span>
    </div>
  );
}

export default function CharacterDetails({ character, canEditStory = false }: Props) {
  const specificFields = getSpecificFields(character);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isEditingStory, setIsEditingStory] = useState(false);
  const [storyDraft, setStoryDraft] = useState(character.story ?? "");

  function handleSaveStory() {
    startTransition(async () => {
      await updateCharacterHistory(character.id, storyDraft);
      router.refresh();
      setIsEditingStory(false);
    });
  }

  function handleCancelStory() {
    setStoryDraft(character.story ?? "");
    setIsEditingStory(false);
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Voltar */}
      <Link
        href="/personagens"
        className="mb-8 inline-flex items-center gap-2 font-title text-xs uppercase tracking-widest text-bege-medio/70 transition-colors hover:text-bege-claro"
      >
        <ArrowLeft size={14} />
        Voltar aos personagens
      </Link>

      {/* Layout principal */}
      <div className="mt-4 flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">

        {/* Coluna esquerda — imagem + brasões */}
        <div className="flex flex-col items-center gap-4 lg:w-64 lg:shrink-0">
          {/* Imagem */}
          <div className="relative w-full overflow-hidden border border-bege-escuro/40 shadow-card"
            style={{ aspectRatio: "3/4" }}>
            {character.image ? (
              <Image
                src={character.image}
                alt={character.name}
                fill
                className="object-cover object-top"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-roxo">
                <span className="font-title text-xs uppercase tracking-wider text-bege-medio/40">
                  Sem Imagem
                </span>
              </div>
            )}

            {/* Rank no canto */}
            <div className="absolute right-3 top-3 h-10 w-10">
              <Image
                src={rankCoatOfArms[character.rank]}
                alt={`Rank ${character.rank}`}
                fill
                className="object-contain drop-shadow-lg"
              />
            </div>
          </div>

          {/* Elemento */}
          <div className="flex w-full items-center justify-center gap-3 border border-bege-escuro/30 bg-roxo/60 px-4 py-3">
            <div className="relative h-7 w-7 shrink-0">
              <Image
                src={elementIcon[character.element]}
                alt={character.element}
                fill
                className="object-contain"
              />
            </div>
            <span className="font-title text-sm uppercase tracking-widest text-bege-claro">
              {elementLabel[character.element]}
            </span>
          </div>

          {/* Categoria badge */}
          <div className="w-full border border-bege-escuro/30 bg-roxo/60 px-4 py-2 text-center">
            <span className="font-title text-xs uppercase tracking-[0.2em] text-bege-medio">
              {getCategoryLabel(character.category)}
            </span>
          </div>
        </div>

        {/* Coluna direita — detalhes */}
        <div className="flex flex-1 flex-col">
          {/* Nome */}
          <h1 className="font-title text-3xl uppercase tracking-[0.15em] text-bege-claro md:text-4xl">
            {character.name}
          </h1>

          <Image
            src="/assets/svgs/divider.svg"
            alt=""
            width={320}
            height={14}
            className="my-4 opacity-60"
          />

          {/* Ficha */}
          <section className="relative rounded-[10px] border border-bege-escuro/25 bg-roxo/40 px-6 py-5 shadow-header">
            <h2 className="mb-4 font-title text-xs uppercase tracking-[0.25em] text-bege-escuro">
              Ficha do Personagem
            </h2>

            <div className="space-y-0.5">
              <InfoRow label="Raça" value={character.race} />
              <InfoRow label="Elemento" value={character.element} />
              <InfoRow label="Rank" value={character.rank} />
              <InfoRow label="Mundo Natal" value={character.worldSlug} />
              {specificFields.map((f) => (
                <InfoRow key={f.label} label={f.label} value={f.value} />
              ))}
            </div>
          </section>

          {/* História */}
                {/* Substitui a seção "Placeholder bio" por esta */}
      <section className="relative mt-6 rounded-[10px] border border-bege-escuro/25 bg-roxo/40 px-6 py-5 shadow-header">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-title text-xs uppercase tracking-[0.25em] text-bege-escuro">
            História
          </h2>

          {canEditStory && !isEditingStory && (
            <button
              type="button"
              onClick={() => setIsEditingStory(true)}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-bege-escuro/40 text-bege-escuro hover:border-bege-medio"
              aria-label="Editar história"
            >
              <Pencil size={12} strokeWidth={1.5} />
            </button>
          )}
        </div>

        {isEditingStory ? (
          <div className="space-y-3">
            <textarea
              value={storyDraft}
              onChange={(e) => setStoryDraft(e.target.value)}
              rows={6}
              className="w-full resize-none border border-bege-escuro/30 bg-roxo-escuro/60 p-3 font-body text-sm leading-relaxed text-bege-claro/90 outline-none focus:border-bege-medio"
              placeholder="Escreva a história deste personagem..."
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelStory}
                className="flex items-center gap-1 border border-bege-escuro/40 px-3 py-1.5 font-title text-xs uppercase tracking-wider text-bege-medio hover:border-bege-medio"
              >
                <X size={12} /> Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveStory}
                disabled={isPending}
                className="flex items-center gap-1 border border-dourado/60 px-3 py-1.5 font-title text-xs uppercase tracking-wider text-dourado hover:bg-roxo disabled:opacity-50"
              >
                <Check size={12} /> {isPending ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        ) : (
          <p className={`font-body text-sm leading-relaxed ${character.story ? "text-bege-claro/90" : "text-bege-medio/70 italic"}`}>
            {character.story || "Nenhuma história registrada ainda."}
          </p>
        )}
      </section>
        </div>
      </div>
    </div>
  );
}