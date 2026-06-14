import Image from "next/image";
import { PrimaryButton } from "@/componentes/PrimaryButton";

export function HomeCastle() {
  return (
    <section className="relative min-h-140 overflow-hidden rounded-[10px] bg-roxo-escuro px-20 py-20 text-bege-claro shadow-header">
      <Image
        src="/assets/svgs/corner-left-top.svg"
        alt=""
        width={100}
        height={100}
        className="pointer-events-none absolute left-0 top-0"
      />

      <Image
        src="/assets/svgs/corner-right-top.svg"
        alt=""
        width={100}
        height={100}
        className="pointer-events-none absolute right-0 top-0"
      />

      <Image
        src="/assets/svgs/corner-left-bottom.svg"
        alt=""
        width={100}
        height={100}
        className="pointer-events-none absolute bottom-0 left-0"
      />

      <Image
        src="/assets/svgs/corner-right-bottom.svg"
        alt=""
        width={100}
        height={100}
        className="pointer-events-none absolute bottom-0 right-0"
      />

      <div className="relative z-10 grid min-h-100 grid-cols-[0.9fr_1.1fr] items-center gap-10">
        <div>
          <p className="font-title text-xl uppercase tracking-[0.18em] text-bege-escuro">
            Bem-vindo(a)
          </p>

          <h1 className="mt-8 font-title text-7xl uppercase leading-tight tracking-[0.12em] text-bege-escuro">
            A Escola <br />
            Millie Munds
          </h1>

          <Image
            src="/assets/svgs/divider.svg"
            alt=""
            width={420}
            height={28}
            className="my-8"
          />

          <p className="max-w-130 text-2xl leading-relaxed text-bege-claro">
            O único onde os habitantes dos mil mundos podem se encontrar
          </p>

          <PrimaryButton className="mt-10">
            Explorar
          </PrimaryButton>
        </div>

        {/* Adicionado bg-roxo-escuro aqui para garantir que a transparência da máscara do castelo encontre a cor sólida correta por baixo */}
        <div className="relative flex justify-center overflow-hidden rounded-[10px] bg-roxo-escuro">
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
