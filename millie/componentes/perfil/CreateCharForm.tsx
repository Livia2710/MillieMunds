'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { CharacterCategory, CharacterElement, CharacterRank } from '@/lib/types/character';
import { PrimaryButton } from '@/componentes/PrimaryButton';

// Insira ou importe a estrutura MULTIVERSO_DATA aqui
const MULTIVERSO_DATA = {
  arcan: {
    label: "Arcan",
    mundos: {
      "lumina": { label: "Lumina", racas: { "humano-arcano": { name: "Humano Arcano", element: "luz" as const }, "asimar": { name: "Asimar", element: "luz" as const } } },
      "umbra": { label: "Umbra", racas: { "tiefling": { name: "Tiefling", element: "trevas" as const }, "vampiro-nobre": { name: "Vampiro Nobre", element: "trevas" as const } } },
      "aethel": { label: "Aethel", racas: { "espirito": { name: "Espírito", element: "agua" as const } } }
    }
  },
  bestiariu: {
    label: "Bestiariu",
    mundos: {
      "reino-bestial": { label: "Reino Bestial", racas: { "lycan": { name: "Lycan", element: "terra" as const }, "minotauro": { name: "Minotauro", element: "terra" as const } } }
    }
  },
  gaia: {
    label: "Gaia",
    mundos: {
      "floresta-ancestral": { label: "Floresta Ancestral", racas: { "elfo": { name: "Elfo Silvestre", element: "terra" as const }, "dryade": { name: "Dríade", element: "terra" as const } } }
    }
  },
  veyron: {
    label: "Veyron (Intergalático)",
    mundos: {
      "nebula-prime": { label: "Nébula Prime", racas: { "cyborg": { name: "Cyborg Estelar", element: "vento" as const } } }
    }
  }
};

type UniversoKey = keyof typeof MULTIVERSO_DATA;

export default function CreateCharForm() {
  const [category, setCategory] = useState<CharacterCategory>('aluno');
  const [name, setName] = useState('');
  
  
  // Estados de Seleção do Multiverso (Em Cascata)
  const [selectedUniverso, setSelectedUniverso] = useState<UniversoKey>('arcan');
  const [selectedMundo, setSelectedMundo] = useState<string>('');
  const [selectedRaca, setSelectedRaca] = useState<string>('');
  const [element, setElement] = useState<CharacterElement>('luz');
  const [filterElement, setFilterElement] = useState<CharacterElement | 'todos'>('todos');
  const elementosOpcoes = [ 'todos', 'luz', 'trevas', 'agua', 'terra', 'vento', 'fogo'] as const;

  // Campos Dinâmicos por Categoria de RPG
  const [year, setYear] = useState(1);
  const [subject, setSubject] = useState('');
  const [occupation, setOccupation] = useState('');
  const [danger, setDanger] = useState<'Iniciante' | 'Intermediário' | 'Avançado' | 'Calamidade'>('Iniciante');

  // Efeito 1: Quando muda o Universo, reseta o mundo selecionado para o primeiro disponível do novo universo
  useEffect(() => {
    const mundosDisponiveis = Object.keys(MULTIVERSO_DATA[selectedUniverso].mundos);
    if (mundosDisponiveis.length > 0) {
      setSelectedMundo(mundosDisponiveis[0]);
    }
  }, [selectedUniverso]);

  // Efeito 2: Quando o Mundo muda, atualiza as raças disponíveis e escolhe a primeira
  useEffect(() => {
    if (!selectedMundo) return;
    const universeMundos = MULTIVERSO_DATA[selectedUniverso].mundos as any;
    const racasDisponiveis = Object.keys(universeMundos[selectedMundo]?.racas || {});
    if (racasDisponiveis.length > 0) {
      setSelectedRaca(racasDisponiveis[0]);
    } else {
      setSelectedRaca('');
    }
  }, [selectedMundo, selectedUniverso]);

  // Efeito 3: Lógica Crítica - Quando a raça é definida, puxa e trava automaticamente o elemento de nascimento dela
  useEffect(() => {
    if (!selectedMundo || !selectedRaca) return;
    const universeMundos = MULTIVERSO_DATA[selectedUniverso].mundos as any;
    const racaInfo = universeMundos[selectedMundo]?.racas?.[selectedRaca];
    if (racaInfo) {
      setElement(racaInfo.element);
    }
  }, [selectedRaca, selectedMundo, selectedUniverso]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Resgata o nome real da raça cadastrada baseado nas chaves
    const universeMundos = MULTIVERSO_DATA[selectedUniverso].mundos as any;
    const racaFinalName = universeMundos[selectedMundo]?.racas?.[selectedRaca]?.name || selectedRaca;

    const characterData = {
      name,
      category,
      element, // Vinculado de nascença automaticamente
      race: racaFinalName,
      worldSlug: selectedMundo, // Registra o mundo de origem
      rank: 'E' as CharacterRank,
      ...(category === 'aluno' && { year }),
      ...(category === 'professor' && { subject }),
      ...(category === 'npc' && { occupation }),
      ...(category === 'monstro' && { dangerLevel: danger }),
    };

    alert(`Personagem integrado ao Grimório de Millie Mundos!`);
    console.log(characterData);
  };

  // Atalhos para renderizar as opções dos selects com segurança de tipos
  const mundosOpcoes = Object.entries(MULTIVERSO_DATA[selectedUniverso].mundos);
  const universeMundos = MULTIVERSO_DATA[selectedUniverso].mundos as any;
  const racasOpcoes = selectedMundo
? Object.entries(universeMundos[selectedMundo]?.racas || {})
    .filter(([_, raca]: [string, any]) =>
      filterElement === 'todos' ||
      raca.element === filterElement
    )
: [];

  return (
    <div className="relative max-w-xl mx-auto bg-roxo-escuro/60 border border-bege-escuro/45 p-8 shadow-card backdrop-blur-sm">
      <div className="text-center mb-6">
        <h2 className="text-xl font-title text-bege-medio tracking-[0.2em] uppercase">Forjar Nova Identidade</h2>
        <Image src="/assets/svgs/divider.svg" alt="" width={120} height={8} className="mx-auto mt-2 opacity-80" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
        
        {/* Nome do Personagem */}
        <div>
          <label className="block text-[10px] text-bege-escuro/70 uppercase tracking-widest font-title mb-1">Nome do Personagem</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-roxo-escuro/40 border border-bege-escuro/30 p-2 text-xs text-bege-claro font-title outline-none focus:border-bege-medio transition-colors"
            placeholder="Ex: Alistair Vance"
          />
        </div>

        {/* Seletor de Categoria */}
        <div>
          <label className="block text-[10px] text-bege-escuro/70 uppercase tracking-widest font-title mb-1.5">Arquétipo Escolar</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['aluno', 'professor', 'npc', 'monstro'] as CharacterCategory[]).map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => setCategory(cat)}
                className={`py-2 text-xs font-title uppercase tracking-wider border transition-all ${
                  category === cat
                    ? 'bg-roxo-escuro border-bege-medio text-bege-medio'
                    : 'bg-roxo-escuro/30 border-bege-escuro/30 text-bege-escuro/50 hover:text-bege-medio'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* SELEÇÃO 1: Universo Origem */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] text-bege-escuro/70 uppercase tracking-widest font-title mb-1">Universo de Origem</label>
            <div className="relative">
              <select
                value={selectedUniverso}
                onChange={(e) => setSelectedUniverso(e.target.value as UniversoKey)}
                className="w-full bg-roxo-escuro border border-bege-escuro/30 p-2 text-xs text-bege-claro font-title outline-none appearance-none cursor-pointer"
              >
                {Object.entries(MULTIVERSO_DATA).map(([key, value]) => (
                  <option key={key} value={key} className="bg-roxo-escuro text-bege-claro">{value.label}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-bege-escuro/50 text-[10px] font-mono">▼</div>
            </div>
          </div>

          {/* SELEÇÃO 2: Mundo/Dimensão dentro do Universo */}
          <div>
            <label className="block text-[10px] text-bege-escuro/70 uppercase tracking-widest font-title mb-1">Mundo / Dimensão Natal</label>
            <div className="relative">
              <select
                value={selectedMundo}
                onChange={(e) => setSelectedMundo(e.target.value)}
                className="w-full bg-roxo-escuro border border-bege-escuro/30 p-2 text-xs text-bege-claro font-title outline-none appearance-none cursor-pointer"
              >
                {mundosOpcoes.map(([key, value]) => (
                  <option key={key} value={key} className="bg-roxo-escuro text-bege-claro">{value.label}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-bege-escuro/50 text-[10px] font-mono">▼</div>
            </div>
          </div>

          {/* FILTRO ELEMENTAL */}
<div>
  <label className="
    block 
    text-[10px] 
    text-bege-escuro/70 
    uppercase 
    tracking-widest 
    font-title 
    mb-1
  ">
    Afinidade Desejada
  </label>


  <select
    value={filterElement}
    onChange={(e)=> {
      setFilterElement(
        e.target.value as CharacterElement | 'todos'
      );
      setSelectedRaca('');
    }}
    className="
      w-full
      bg-roxo-escuro
      border
      border-bege-escuro/30
      p-2
      text-xs
      text-bege-claro
      font-title
      outline-none
      cursor-pointer
    "
  >

    {elementosOpcoes.map((item)=>(
      <option
        key={item}
        value={item}
      >
        {item === 'todos'
          ? 'Todos os Elementos'
          : item.toUpperCase()
        }
      </option>
    ))}

  </select>

</div>


        </div>

        {/* SELEÇÃO 3 E REQUISITO: Raça e Elemento de Nascença Automático */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

  {/* Raça Nativa */}
  <div>
    <label className="block text-[10px] text-bege-escuro/70 uppercase tracking-widest font-title mb-1">
      Linhagem / Raça
    </label>

    <div className="relative">
      <select
        value={selectedRaca}
        onChange={(e) => setSelectedRaca(e.target.value)}
        className="
          w-full 
          bg-roxo-escuro 
          border border-bege-escuro/30 
          p-2 
          text-xs 
          text-bege-claro 
          font-title 
          outline-none 
          appearance-none 
          cursor-pointer
        "
      >
        {racasOpcoes.map(([key, value]: [string, any]) => (
          <option
            key={key}
            value={key}
            className="bg-roxo-escuro text-bege-claro"
          >
            {value.name}
          </option>
        ))}
      </select>

      <div className="
        pointer-events-none 
        absolute 
        inset-y-0 
        right-0 
        flex 
        items-center 
        px-2 
        text-bege-escuro/60
      ">
        ▼
      </div>
    </div>
  </div>


  {/* Elemento Automático */}
  <div>
    <label className="block text-[10px] text-bege-escuro/70 uppercase tracking-widest font-title mb-1">
      Elemento Vinculado
    </label>

    <div className="
      w-full 
      bg-roxo-escuro/20 
      border border-bege-escuro/20 
      p-2 
      text-xs 
      text-bege-medio 
      font-title 
      uppercase 
      tracking-widest 
      select-none 
      flex 
      items-center 
      justify-between
    ">
      <span>{element}</span>

      <span className="
        text-[10px] 
        text-bege-escuro/45 
        lowercase 
        font-mono 
        italic
      ">
        (Inato da Raça)
      </span>
    </div>

  </div>

</div>
        {/* CAMPOS DINÂMICOS: Condicionais por Categoria */}
        <div className="pt-2 border-t border-bege-escuro/20">

          {category === 'aluno' && (
            <div>
              <label className="block text-[10px] text-bege-escuro/70 uppercase tracking-widest font-title mb-1">
                Ano Letivo
              </label>

              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((num) => (
                  <button
                    type="button"
                    key={num}
                    onClick={() => setYear(num)}
                    className={`py-1.5 text-xs font-title border transition-all ${
                      year === num
                        ? 'bg-roxo-escuro border-bege-medio text-bege-medio'
                        : 'bg-roxo-escuro/30 border-bege-escuro/30 text-bege-escuro/50'
                    }`}
                  >
                    {num}º Ano
                  </button>
                ))}
              </div>
            </div>
          )}


          {category === 'professor' && (
            <div>
              <label className="block text-[10px] text-bege-escuro/70 uppercase tracking-widest font-title mb-1">
                Matéria de Lecionamento
              </label>

              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-roxo-escuro/40 border border-bege-escuro/30 p-2 text-xs text-bege-claro font-title outline-none focus:border-bege-medio"
                placeholder="Ex: Alquimia Proibida"
              />
            </div>
          )}


          {category === 'npc' && (
            <div>
              <label className="block text-[10px] text-bege-escuro/70 uppercase tracking-widest font-title mb-1">
                Ocupação / Função
              </label>

              <input
                type="text"
                required
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                className="w-full bg-roxo-escuro/40 border border-bege-escuro/30 p-2 text-xs text-bege-claro font-title outline-none focus:border-bege-medio"
                placeholder="Ex: Guardião da Biblioteca"
              />
            </div>
          )}


          {category === 'monstro' && (
            <div>
              <label className="block text-[10px] text-bege-escuro/70 uppercase tracking-widest font-title mb-1">
                Nível de Ameaça
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">

                {(['Iniciante', 'Intermediário', 'Avançado', 'Calamidade'] as const)
                .map((lvl) => (
                  <button
                    type="button"
                    key={lvl}
                    onClick={() => setDanger(lvl)}
                    className={`py-1.5 text-[10px] font-title uppercase border transition-all ${
                      danger === lvl
                      ? 'bg-roxo-escuro border-bege-medio text-bege-medio'
                      : 'bg-roxo-escuro/30 border-bege-escuro/30 text-bege-escuro/50'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}

              </div>
            </div>
          )}

        </div>


        {/* Botão */}
        <div className="pt-4 flex justify-end">

          <PrimaryButton
            type="submit"
            className="w-full sm:w-auto px-6 py-2.5 text-xs tracking-widest uppercase"
          >
            Sincronizar Grimório
          </PrimaryButton>

        </div>


      </form>

    </div>
  );
}