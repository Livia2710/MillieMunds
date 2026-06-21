'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ProfileCharacter } from '@/lib/types/profile';
import { InventoryItem } from '@/lib/types/inventory';

interface ProfileInventoryProps {
  character: ProfileCharacter;
}

// Mapeamento dos brasões de raridade oficiais do projeto baseado nos SVGs públicos
const rarityCrests: Record<string, string> = {
  comum: "/assets/svgs/Comum.svg",
  incomum: "/assets/svgs/Incomum.svg",
  raro: "/assets/svgs/Raro.svg",
  epico: "/assets/svgs/Epico.svg",
  lendario: "/assets/svgs/Lendario.svg",
  mitico: "/assets/svgs/Mitico.svg",
};

export default function ProfileInventory({ character }: ProfileInventoryProps) {
  const [activeTab, setActiveTab] = useState<'itens' | 'livros'>('itens');

  // Filtra itens usando a nova lógica categórica
  const filteredItems = character.inventory.filter((item) => {
    if (activeTab === 'livros') return item.category === 'livro';
    return item.category !== 'livro'; // Itens = todas as outras categorias unidas
  });

  // Garante a exibição estática de exatamente 6 slots na Grid lateral
  const slicedItems = filteredItems.slice(0, 6);
  const gridSlots = [...slicedItems, ...Array(Math.max(0, 6 - slicedItems.length)).fill(null)];

  return (
    <div className="relative w-full border border-bege-escuro/40 p-6 backdrop-blur-sm shadow-card mt-6">
      <div className="text-left w-full">
          <h2 className="text-md text-bege-medio tracking-[0.2em] font-title uppercase">Inventário</h2>
          <Image 
            src="/assets/svgs/divider.svg" 
            alt="" 
            width={120} 
            height={8} 
            className="block my-2 opacity-80" 
          />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-bege-escuro/20">
        <button
          onClick={() => setActiveTab('itens')}
          className={`px-4 py-1.5 text-xs font-title tracking-widest uppercase transition-colors rounded-t ${
            activeTab === 'itens' 
              ? 'bg-roxo text-bege-medio border-t border-x border-bege-escuro/40' 
              : 'text-bege-escuro/60 hover:text-bege-medio'
          }`}
        >
          Itens
        </button>
        <button
          onClick={() => setActiveTab('livros')}
          className={`px-4 py-1.5 text-xs font-title tracking-widest uppercase transition-colors rounded-t ${
            activeTab === 'livros' 
              ? 'bg-roxo text-bege-medio border-t border-x border-bege-escuro/40' 
              : 'text-bege-escuro/60 hover:text-bege-medio'
          }`}
        >
          Livros
        </button>
      </div>

      {/* Grid de Itens */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
        {gridSlots.map((item: InventoryItem | null, index) => {
          if (item) {
            const crestPath = rarityCrests[item.rarity] || rarityCrests.comum;
            
            // Resolve imagem de capa para livros que usam o padrão estrutural 'coverType'
            const itemImage = item.category === 'livro' && item.coverType === 'image' 
              ? item.coverImage 
              : item.image;

            return (
              <div 
                key={item.id} 
                className="arcane-hover relative aspect-square bg-roxo-escuro border border-bege-escuro/20 rounded p-2 flex flex-col items-center justify-center group hover:border-bege-medio transition-colors overflow-hidden shadow-card"
                title={`${item.name} (${item.rarity})`}
              >
                {/* Brasão Dinâmico de Raridade posicionado no canto superior direito do slot */}
                <div className="absolute top-1 right-1 w-3.5 h-3.5 z-10 pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
                  <Image 
                    src={crestPath} 
                    alt={`Raridade ${item.rarity}`} 
                    fill 
                    className="object-contain"
                  />
                </div>

                {/* Imagem do Item */}
                <div className="relative w-10 h-10 mb-1 z-0">
                  {itemImage ? (
                    <Image src={itemImage} alt={item.name} fill className="object-contain" />
                  ) : (
                    <div 
                      className="w-full h-full rounded-sm opacity-40"
                      style={{ backgroundColor: item.category === 'livro' && item.coverType === 'color' ? item.coverColor : 'var(--color-roxo)' }}
                    />
                  )}
                </div>
                
                <span className="text-[10px] text-bege-escuro truncate w-full text-center block font-title">{item.name}</span>
                <span className="text-[9px] text-bege-escuro/40 block font-mono">x{item.quantity}</span>
              </div>
            );
          }

          {/* Slots Vazios Estilizados com Bordas Tracejadas */}
          return (
            <div key={`empty-${index}`} className="aspect-square bg-roxo-escuro/20 border border-bege-escuro/20 border-dashed rounded" />
          );
        })}

        {/* Botão Especial: Ver Todos */}
        <Link 
          href="/inventario"
          className="relative aspect-square bg-roxo-escuro/40 border border-bege-escuro/40 rounded flex flex-col items-center justify-center text-bege-escuro hover:text-bege-medio hover:border-bege-medio transition-all group"
        >
          <span className="text-xl font-light group-hover:scale-110 transition-transform font-mono">+</span>
          <span className="text-[10px] tracking-wider uppercase font-title mt-1">Ver todos</span>
        </Link>
      </div>
    </div>
  );
}
