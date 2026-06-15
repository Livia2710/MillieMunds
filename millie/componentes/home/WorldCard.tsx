import Image from "next/image";

type WorldCardProps = {
  name: string;
  description: string;
  image?: string;
  isLocked?: boolean;
};

export function WorldCard({
  name,
  description,
  image,
  isLocked = false,
}: WorldCardProps) {
  const displayName = isLocked ? "?????" : name;
  const displayDescription = isLocked ? "?????" : description;

  return (
    /* Mantida a proporção de carta perfeita e o limite de largura para a responsividade no celular */
    <article className="relative mx-auto aspect-11/15 w-full max-w-60 overflow-hidden rounded-xl text-bege-escuro">
      
      {/* Moldura SVG: Fica por cima de tudo no z-20 */}
      <Image
        src="/assets/svgs/moldura.svg"
        alt=""
        width={220}
        height={300}
        className="pointer-events-none absolute inset-0 z-20 h-full w-full object-fill"
      />

      {/* Imagem de Fundo: Ajustada com padding e rounded para embutir e cortar o que ficava fora da moldura */}
      {image && !isLocked && (
        <Image
          src={image}
          alt={name}
          width={220}
          height={300}
          className="absolute inset-0 h-full w-full object-cover opacity-55 p-1.5 rounded-[14px]"
        />
      )}

      {/* Camada de cor de fundo escurecida: Também recebe o mesmo recuo para não vazar a cor nas quinas transparentes */}
      <div className="absolute inset-0 z-10 bg-roxo-escuro/45 m-1.5 rounded-[14px]" />

      {/* Conteúdo de Texto e Ícones */}
      <div className="relative z-30 flex h-full flex-col items-center justify-center px-6 py-4 text-center">
        <Image
          src="/assets/svgs/logo.svg"
          alt=""
          width={42}
          height={42}
          className="mb-2 md:mb-4 opacity-80"
        />

        {/* Corrigido wrap-break-word para break-words do Tailwind */}
        <h3 className="mt-2 w-full wrap-break-word font-title text-base uppercase tracking-[0.16em] md:mt-5 md:text-xl">
          {displayName}
        </h3>
        
        <p className="mt-1 md:mt-4 line-clamp-3 text-xs md:text-lg leading-snug text-bege-claro">
          {displayDescription}
        </p>
      </div>
    </article>
  );
}
