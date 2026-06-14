import Image from "next/image";
import { PrimaryButton } from "@/componentes/PrimaryButton";

export function HomeCastle() {
  return (
    /* 1. Ajustado os paddings (px e py) para serem menores no mobile e originais no desktop com md: */
    <section className="relative min-h-140 overflow-hidden rounded-[10px] bg-roxo-escuro px-6 py-12 md:px-20 md:py-20 text-bege-claro shadow-header">
      <Image
        src="/assets/svgs/corner-left-top.svg"
        alt=""
        width={100}
        height={100}
        className="pointer-events-none absolute left-0 top-0 w-19 h-19 md:w-25 md:h-25"
      />

      <Image
        src="/assets/svgs/corner-right-top.svg"
        alt=""
        width={100}
        height={100}
        className="pointer-events-none absolute right-0 top-0 w-19 h-19 md:w-25 md:h-25"
      />

      <Image
        src="/assets/svgs/corner-left-bottom.svg"
        alt=""
        width={100}
        height={100}
        className="pointer-events-none absolute bottom-0 left-0 w-19 h-19 md:w-25 md:h-25"
      />

      <Image
        src="/assets/svgs/corner-right-bottom.svg"
        alt=""
        width={100}
        height={100}
        className="pointer-events-none absolute bottom-0 right-0 w-19 h-19 md:w-25 md:h-25"
      />

      {/* 2. Grid inicia com 1 coluna no mobile e centraliza os textos; a partir de md: ativa as duas colunas e alinha à esquerda */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-[0.9fr_1.1fr] items-center gap-10 text-center md:text-left">
        <div className="flex flex-col items-center md:items-start">
          <p className="font-title text-lg md:text-xl uppercase tracking-[0.18em] text-bege-escuro">
            Bem-vindo(a)
          </p>

          {/* 3. Título reduzido para text-4xl no mobile para não quebrar a tela */}
          <h1 className="mt-4 md:mt-8 font-title text-4xl md:text-7xl uppercase leading-tight tracking-[0.12em] text-bege-escuro">
            A Escola <br />
            Millie Munds
          </h1>

          <Image
            src="/assets/svgs/divider.svg"
            alt=""
            width={360}
            height={24}
            className="my-6 md:my-8 max-w-full"
          />

          {/* 4. Descrição com fonte ajustada para text-xl no mobile */}
          <p className="max-w-130 text-xl md:text-2xl leading-relaxed text-bege-claro">
            O único onde os habitantes dos mil mundos podem se encontrar
          </p>

          {/* Botão ganha w-full (largura total com margem) no mobile e tamanho fixo no desktop */}
          <PrimaryButton className="mt-8 md:mt-10 w-full max-w-80">
            Explorar
          </PrimaryButton>
        </div>

        {/* 5. Caixa do castelo recebe mt-8 para não ficar colada no texto no mobile */}
        <div className="relative flex justify-center overflow-hidden rounded-[10px] bg-roxo-escuro mt-8 md:mt-0">
          <Image
            src="/assets/images/castelo.png"
            alt="Castelo da Escola Millie Munds"
            width={600}
            height={600}
            className="h-auto w-full max-w-155 object-contain opacity-90"
            style={{
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
              maskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)'
            }}
            priority
          />
          <div 
            className="absolute inset-0 pointer-events-none mix-blend-normal"
            style={{ background: 'radial-gradient(ellipse farthest-side, rgba(0, 0, 0, 0) 15%, var(--color-roxo-escuro) 100%)' }}
          />
        </div>
      </div>
    </section>
  );
}
