'use client';
import { useState } from 'react';
import Image from 'next/image';
import { ProfileCharacter } from '@/lib/types/profile';
import { PrimaryButton } from '../PrimaryButton';

interface ProfileCardsProps {
  character: ProfileCharacter;
}

const BARALHO_MOCK = [
  { id: 'carta-0', name: 'O Louco', src: '/assets/images/cartas/louco.png' },
  { id: 'carta-1', name: 'O Mago', src: '/assets/images/cartas/mago.png' },
  { id: 'carta-2', name: 'A Imperatriz', src: '/assets/images/cartas/imperatriz.png' },
  { id: 'carta-3', name: 'O Imperador', src: '/assets/images/cartas/imperador.png' },
  { id: 'carta-4', name: 'O Carruagem', src: '/assets/images/cartas/carruagem.png' },
  { id: 'carta-5', name: 'O Eremita', src: '/assets/images/cartas/eremita.png' },
  { id: 'carta-6', name: 'A Força', src: '/assets/images/cartas/forca.png' },
  { id: 'carta-7', name: 'O Diabo', src: '/assets/images/cartas/diabo.png' },
  { id: 'carta-8', name: 'A Estrela', src: '/assets/images/cartas/estrela.png' },
  { id: 'carta-9', name: 'A Lua', src: '/assets/images/cartas/lua.png' },
  { id: 'carta-10', name: 'O Sol', src: '/assets/images/cartas/sol.png' },
];

export default function ProfileCards({ character }: ProfileCardsProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeCard, setActiveCard] = useState(BARALHO_MOCK[0]);

  const handleGenerateCard = () => {
    if (isAnimating) return;
    setIsAnimating(true);

    if (isFlipped) {
      setIsFlipped(false);
      setTimeout(() => {
        sortearENovaCarta();
      }, 400);
    } else {
      sortearENovaCarta();
    }
  };

  const sortearENovaCarta = () => {
    const randomIndex = Math.floor(Math.random() * BARALHO_MOCK.length);
    setActiveCard(BARALHO_MOCK[randomIndex]);
    setIsFlipped(true);

    setTimeout(() => {
      setIsAnimating(false);
    }, 700);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
      
      {/* CARD ESQUERDO: CARTAS */}
      <div className="relative border border-bege-escuro/40 p-6 flex flex-col items-center justify-between min-h-[380px] backdrop-blur-sm shadow-card">
        <div className="text-center w-full">
          <h2 className="text-md text-bege-medio tracking-[0.2em] font-title uppercase">Cartas</h2>
          <Image 
            src="/assets/svgs/divider.svg" 
            alt="" 
            width={120} 
            height={8} 
            className="mx-auto my-2 opacity-80" 
          />
        </div>

        {/* Zona da Carta Animada */}
        <div style={{ perspective: '1000px' }} className="my-4">
          <div 
            style={{ 
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' 
            }}
            className="relative w-40 h-65 transition-transform duration-700"
          >
            
            {/* FRENTE: Verso da carta (O seu "Carta.svg" fechado) */}
            <div 
              style={{ backfaceVisibility: 'hidden' }}
              className="absolute inset-0 w-full h-full flex flex-col items-center justify-center rounded-lg overflow-hidden"
            >
              <Image 
                src="/assets/svgs/Carta.svg" 
                alt="Carta Oculta" 
                fill
                priority
              />
              <span className="relative z-10 text-3xl text-bege-medio font-title opacity-40">?</span>
            </div>

            {/* VERSO: Revelando a imagem real do Canva sorteada */}
            <div 
              style={{ 
                backfaceVisibility: 'hidden', 
                transform: 'rotateY(180deg)' 
              }}
              className="absolute inset-0 w-full h-full flex items-center justify-center rounded-lg overflow-hidden shadow-2xl bg-[#120e1a]"
            >
              <Image 
                src={activeCard.src} 
                alt={activeCard.name}
                fill 
                className="object-cover"
                sizes="160px"
                unoptimized
                priority
              />
            </div>

          </div>
        </div>

        {/* Instrução e Ação */}
        <div className="w-full text-center space-y-4">
          <p className="text-[11px] text-bege-escuro/60 max-w-[240px] mx-auto italic tracking-wide h-4">
            {isFlipped ? `Você tirou: ${activeCard.name}` : 'Gere uma carta aleatória e descubra o destino'}
          </p>
          
          <PrimaryButton 
            onClick={handleGenerateCard}
            className="w-full max-w-80"
            disabled={isAnimating}
          >
            {isAnimating ? 'Sorteando...' : 'Gerar Cartas'}
          </PrimaryButton>
        </div>
      </div>

      {/* CARD DIREITO: ESTATÍSTICAS */}
      <div className="relative border border-bege-escuro/40 p-6 flex flex-col justify-between backdrop-blur-sm shadow-card">
        <div className="text-center w-full">
          <h2 className="text-md text-bege-medio tracking-[0.2em] font-title uppercase">Estatísticas</h2>
          <Image 
            src="/assets/svgs/divider.svg" 
            alt="" 
            width={120} 
            height={8} 
            className="mx-auto my-2 opacity-80" 
          />
        </div>

        <div className="space-y-4 my-auto py-4">
          {Object.entries(character.stats).map(([key, value]) => (
            <div key={key} className="space-y-1.5">
              <div className="flex justify-between text-[11px] uppercase tracking-widest text-bege-escuro">
                <span className="font-title text-sm capitalize">{key}:</span>
                <span className="font-mono text-sm">{value}</span>
              </div>
              
              <div className="w-full h-1.5 rounded-sm overflow-hidden border border-roxo">
                <div 
                  className="h-full bg-bege-medio rounded-sm transition-all duration-500" 
                  style={{ width: `${(value / 20) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
