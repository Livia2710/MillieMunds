import Image from "next/image";
import type { Character } from "@/lib/types/character";

type CharacterCardProps = {
  character: Character;
};

const rankCoatOfArms: Record<string, string> = {
  S: "/assets/svgs/S.svg", A: "/assets/svgs/A.svg", B: "/assets/svgs/B.svg",
  C: "/assets/svgs/C.svg", D: "/assets/svgs/D.svg", E: "/assets/svgs/E.svg", V: "/assets/svgs/V.svg",
};

export default function CharacterCard({ character }: CharacterCardProps) {
  return (
    // Alterado: No mobile vira flex-row (alinhado lado a lado) e min-h-0 para encolher deitado
    <article className=" arcane-hover overflow-hidden relative min-h-0 lg:min-h-[360px] w-full border border-bege-escuro/45 bg-roxo-escuro/60 p-4 lg:p-5 shadow-card transition-all flex flex-row lg:flex-col gap-4 items-center">
      
      {/* Brasão posicionado no canto superior esquerdo em telas grandes, ou integrado no fluxo no mobile */}
      <div className="absolute right-4 top-4 lg:left-4 lg:right-auto lg:top-4 h-8 w-8 lg:h-9 lg:w-9 pointer-events-none">
        <img src={rankCoatOfArms[character.rank]} alt="" className="h-full w-full object-contain" />
      </div>

      {/* Espaço da Imagem: Encolhe e vira um quadrado menor na esquerda no mobile */}
      <div className="flex h-20 w-20 lg:h-36 lg:w-full items-center justify-center overflow-hidden shrink-0">
        {character.image ? (
          <Image
            src={character.image}
            alt={character.name}
            width={120}
            height={120}
            className="h-full w-full object-cover rounded-sm"
          />
        ) : (
          <span className="text-[10px] uppercase tracking-wider text-bege-medio/40 font-title text-center">
            Sem Foto
          </span>
        )}
      </div>

      {/* CONTEÚDO ESCRITO */}
      <div className="flex-1 w-full flex flex-col items-start lg:items-center text-left lg:text-center">
        <h2 className="font-title text-lg lg:text-xl uppercase tracking-[0.12em] text-bege-claro">
          {character.name}
        </h2>
        
        {/* Ocultado o divisor de linha grande no celular para economizar altura de tela */}
        <Image
          src="/assets/svgs/divider.svg"
          alt=""
          width={180}
          height={14}
          className="hidden lg:block mt-2 max-w-[60%] opacity-70"
        />

        {/* PROPRIEDADES COMPACTADAS (Texto menor no mobile para caber deitado) */}
        <div className="w-full mt-2 lg:mt-4 space-y-1 text-xs lg:text-base text-bege-medio/90 font-body">
          <p className="flex gap-2 lg:justify-between border-b border-bege-escuro/10 pb-0.5">
            <strong className="font-title uppercase text-bege-escuro">Raça:</strong> <span>{character.race}</span>
          </p>
          <p className="flex gap-2 lg:justify-between border-b border-bege-escuro/10 pb-0.5">
            <strong className="font-title uppercase text-bege-escuro">Elemento:</strong> <span className="capitalize">{character.element}</span>
          </p>
          <p className="flex gap-2 lg:justify-between">
            <strong className="font-title uppercase text-bege-escuro">Mundo:</strong> <span className="truncate max-w-[100px] lg:max-w-[140px]">{character.worldSlug}</span>
          </p>
        </div>
      </div>
      
    </article>
  );
}
