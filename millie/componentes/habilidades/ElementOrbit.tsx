"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { CharacterElement } from "@/lib/types/character";
import { ELEMENT_META } from "@/lib/types/skill";

const ORBIT_ORDER: CharacterElement[] = ["fogo", "agua", "terra", "vento", "luz", "trevas"];

type AnimationPhase = "spinning" | "slowing" | "departing" | "done";

type ElementOrbitProps = {
  characterElement: CharacterElement;
  onAnimationComplete: () => void;
};

export function ElementOrbit({ characterElement, onAnimationComplete }: ElementOrbitProps) {
  const [phase, setPhase] = useState<AnimationPhase>("spinning");
  // currentIndex controla qual símbolo está "na frente" da roleta
  const [currentIndex, setCurrentIndex] = useState(0);
  // spinSpeed controla o intervalo entre trocas — começa rápido, desacelera
  const [spinSpeed, setSpinSpeed] = useState(80);

  const targetIndex = ORBIT_ORDER.indexOf(characterElement);

  useEffect(() => {
    if (phase === "done") return;

    // Fase spinning: gira rápido por 1.5s
    const slowStart = setTimeout(() => setPhase("slowing"), 1500);

    return () => clearTimeout(slowStart);
  }, []);

  useEffect(() => {
    if (phase === "done" || phase === "departing") return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % ORBIT_ORDER.length;

        // Na fase slowing: quando chegamos no elemento certo, para
        if (phase === "slowing" && next === targetIndex) {
          clearInterval(interval);
          // Pequena pausa antes de descer
          setTimeout(() => setPhase("departing"), 1000);
          setTimeout(() => {
            setPhase("done");
            onAnimationComplete();
          }, 1400);
        }

        return next;
      });
    }, phase === "spinning" ? 80 : spinSpeed);

    // A cada tick na fase slowing, aumenta o intervalo (desacelera)
    if (phase === "slowing") {
      const slow = setTimeout(() => {
        setSpinSpeed((prev) => Math.min(prev + 60, 400));
      }, spinSpeed);
      return () => { clearInterval(interval); clearTimeout(slow); };
    }

    return () => clearInterval(interval);
  }, [phase, spinSpeed, targetIndex, onAnimationComplete]);

  const meta = ELEMENT_META[characterElement];
  const currentMeta = ELEMENT_META[ORBIT_ORDER[currentIndex]];

  return (
    <div className="relative flex h-72 w-full flex-col items-center justify-center gap-6 md:h-80">

      {/* Slot da roleta — mostra o símbolo atual */}
      <div className="flex flex-col items-center gap-4">

        {/* Indicadores laterais — setas apontando para o slot central */}
        <div className="flex items-center gap-6">
          <span className="font-title text-bege-escuro/30 text-xl">❯</span>

          {/* Slot principal */}
          <div
            className="relative flex h-24 w-24 items-center justify-center rounded-full border-2 transition-all duration-100 md:h-28 md:w-28"
            style={{
              borderColor: phase === "departing" || phase === "done"
                ? meta.color
                : currentMeta.color,
              backgroundColor: phase === "departing" || phase === "done"
                ? `${meta.color}18`
                : `${currentMeta.color}12`,
              boxShadow: phase === "departing" || phase === "done"
                ? `0 0 32px ${meta.glow}88, 0 0 64px ${meta.glow}33`
                : `0 0 12px ${currentMeta.color}44`,
            }}
          >
            <div
              key={currentIndex}
              style={{
                animation: phase === "departing"
                  ? "slot-depart 900ms cubic-bezier(0.22, 1, 0.36, 1) forwards"
                  : "slot-flip 100ms ease-out",
              }}
            >
              <Image
                src={phase === "departing" || phase === "done"
                  ? meta.svgPath
                  : currentMeta.svgPath
                }
                alt={currentMeta.label}
                width={52}
                height={52}
                className="object-contain md:h-16 md:w-16"
              />
            </div>
          </div>

          <span className="font-title text-bege-escuro/30 text-xl rotate-180">❯</span>
        </div>

        {/* Nome do elemento atual */}
        <p
          className="font-title text-sm uppercase tracking-[0.28em] transition-all duration-100"
          style={{
            color: phase === "departing" || phase === "done"
              ? meta.glow
              : currentMeta.glow,
            opacity: phase === "departing" ? 0 : 1,
          }}
        >
          {phase === "departing" || phase === "done"
            ? meta.label
            : currentMeta.label
          }
        </p>
      </div>

      {/* Faixa de símbolos abaixo — mostra o contexto da roleta */}
      <div className="flex items-center gap-3 md:gap-4">
        {ORBIT_ORDER.map((el, i) => {
          const elMeta = ELEMENT_META[el];
          const isActive = i === currentIndex;
          const isTarget = el === characterElement;

          return (
            <div
              key={el}
              className="flex flex-col items-center gap-1 transition-all duration-150"
              style={{
                opacity: isActive ? 1 : 0.3,
                transform: isActive ? "scale(1.2)" : "scale(1)",
              }}
            >
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-150 md:h-8 md:w-8"
                style={{
                  borderColor: isActive ? elMeta.color : "transparent",
                  backgroundColor: isActive ? `${elMeta.color}20` : "transparent",
                }}
              >
                <Image
                  src={elMeta.svgPath}
                  alt={elMeta.label}
                  width={18}
                  height={18}
                  className="object-contain"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Texto de status */}
      <p className="font-title text-[10px] uppercase tracking-[0.22em] text-bege-escuro/40">
        {phase === "spinning" && "Identificando elemento..."}
        {phase === "slowing" && "Convergindo..."}
        {phase === "departing" && `Elemento ${meta.label} confirmado`}
        {phase === "done" && ""}
      </p>
    </div>
  );
}