"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Character } from "@/lib/types/character";

type Props = {
  character: Character;
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

export default function CharacterDetails({ character }: Props) {
  const specificFields = getSpecificFields(character);

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

          {/* Placeholder bio */}
          <section className="relative mt-6 rounded-[10px] border border-bege-escuro/25 bg-roxo/40 px-6 py-5 shadow-header">
            <h2 className="mb-3 font-title text-xs uppercase tracking-[0.25em] text-bege-escuro">
              História
            </h2>
            <p className="font-body text-sm leading-relaxed text-bege-medio/70 italic">
              Nenhuma história registrada ainda.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}