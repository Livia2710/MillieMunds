import Image from 'next/image';

interface ClosedBookProps {
  activating?: boolean;
}

export default function ClosedBook({ activating = false }: ClosedBookProps) {
  return (
    <>
      <div
        className="relative h-[68vh] w-95 md:h-[76vh] md:w-[28vw]"
        style={{
          backgroundImage: 'radial-gradient(circle, #2B1C34 10%, #1A0F22 100%)'
        }}
      >
        <Image
          src="/assets/svgs/carta.svg"
          fill
          alt="Moldura decorativa"
          className="absolute z-10"
        />

        {/* Energia que nasce no centro e vai para as bordas */}
        {activating && (
          <>
            {/* Onda que expande do centro */}
            <div className="energy-birth" />

            {/* Tentáculos indo para cada canto */}
            <div className="energy-tentacle energy-tentacle-top" />
            <div className="energy-tentacle energy-tentacle-bottom" />
            <div className="energy-tentacle energy-tentacle-left" />
            <div className="energy-tentacle energy-tentacle-right" />

            {/* Energia chegando nas bordas */}
            <div className="energy-border-top" />
            <div className="energy-border-bottom" />
            <div className="energy-border-left" />
            <div className="energy-border-right" />
          </>
        )}
      </div>

      <p className={`font-title text-bege-medio absolute bottom-10 w-full text-center text-xs transition-opacity duration-300 ${activating ? "opacity-0" : "opacity-100"}`}>
        CLIQUE PARA ABRIR
      </p>
    </>
  );
}