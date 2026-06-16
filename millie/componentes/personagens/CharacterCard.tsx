import Image from "next/image";
import type { Character } from "@/lib/types/character";

type CharacterCardProps = {
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

function getCharacterSpecificInfo(character: Character) {
  switch (character.category) {
    case "aluno":
      return {
        label: "Ano",
        value: `${character.year}º ano`,
      };

    case "professor":
      return {
        label: "Matéria",
        value: character.subject,
      };

    case "npc":
      return {
        label: "Ocupação",
        value: character.occupation,
      };

    case "monstro":
      return {
        label: "Perigo",
        value: character.dangerLevel,
      };
  }
}

export default function CharacterCard({ character }: CharacterCardProps) {
  const specificInfo = getCharacterSpecificInfo(character);

  return (
    <article className="arcane-hover relative flex min-h-0 w-full flex-row items-center gap-4 overflow-hidden border border-bege-escuro/45 bg-roxo-escuro/60 p-4 shadow-card transition-all lg:min-h-[360px] lg:flex-col lg:p-5">
      <div className="pointer-events-none absolute right-4 top-4 h-8 w-8 lg:left-4 lg:right-auto lg:top-4 lg:h-9 lg:w-9">
        <img
          src={rankCoatOfArms[character.rank]}
          alt=""
          className="h-full w-full object-contain"
        />
      </div>

      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden lg:h-36 lg:w-full">
        {character.image ? (
          <Image
            src={character.image}
            alt={character.name}
            width={120}
            height={120}
            className="h-full w-full rounded-sm object-cover"
          />
        ) : (
          <span className="text-center font-title text-[10px] uppercase tracking-wider text-bege-medio/40">
            Sem Foto
          </span>
        )}
      </div>

      <div className="flex w-full flex-1 flex-col items-start text-left lg:items-center lg:text-center">
        <h2 className="font-title text-lg uppercase tracking-[0.12em] text-bege-claro lg:text-xl">
          {character.name}
        </h2>

        <Image
          src="/assets/svgs/divider.svg"
          alt=""
          width={180}
          height={14}
          className="mt-2 hidden max-w-[60%] opacity-70 lg:block"
        />

        <div className="mt-2 w-full space-y-1 font-body text-xs text-bege-medio/90 lg:mt-4 lg:text-base">
          <p className="flex gap-2 border-b border-bege-escuro/10 pb-0.5 lg:justify-between">
            <strong className="font-title uppercase text-bege-escuro">
              Raça:
            </strong>
            <span>{character.race}</span>
          </p>

          <p className="flex gap-2 border-b border-bege-escuro/10 pb-0.5 lg:justify-between">
            <strong className="font-title uppercase text-bege-escuro">
              Elemento:
            </strong>
            <span className="capitalize">{character.element}</span>
          </p>

          <p className="flex gap-2 border-b border-bege-escuro/10 pb-0.5 lg:justify-between">
            <strong className="font-title uppercase text-bege-escuro">
              {specificInfo.label}:
            </strong>
            <span className="truncate max-w-[110px] lg:max-w-[150px]">
              {specificInfo.value}
            </span>
          </p>

          <p className="flex gap-2 lg:justify-between">
            <strong className="font-title uppercase text-bege-escuro">
              Mundo:
            </strong>
            <span className="truncate max-w-[100px] lg:max-w-[140px]">
              {character.worldSlug}
            </span>
          </p>
        </div>
      </div>
    </article>
  );
}