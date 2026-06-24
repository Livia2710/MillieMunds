"use client";

import { useState, useEffect } from "react";
import MillieModal from "@/componentes/ui/MillieModal";
import MillieInput from "@/componentes/ui/MillieInput";
import MillieSelect from "@/componentes/ui/MillieSelect";
import {PrimaryButton} from "@/componentes/PrimaryButton";
import type { CharacterCategory, CharacterElement } from "@/lib/types/character";

// Replicando a estrutura do multiverso do CreateCharForm
// TODO: mover MULTIVERSO_DATA para lib/mocks/ e importar de lá
const MULTIVERSO_DATA = {
  "Escola dos Mil Mundos": {
    worlds: {
      Aethelgard: {
        races: {
          Dalalilaz: "fogo" as CharacterElement,
          Sylvari: "vento" as CharacterElement,
          Aquelion: "agua" as CharacterElement,
        },
      },
      Umbra: {
        races: {
          Humana: "trevas" as CharacterElement,
          Sombraluz: "luz" as CharacterElement,
        },
      },
      Kharadur: {
        races: {
          Anão: "terra" as CharacterElement,
          Ferreiro: "fogo" as CharacterElement,
        },
      },
    },
  },
};

const CATEGORY_OPTIONS: { value: CharacterCategory; label: string }[] = [
  { value: "aluno", label: "Aluno" },
  { value: "professor", label: "Professor" },
  { value: "npc", label: "NPC" },
  { value: "monstro", label: "Monstro" },
];

const DANGER_LEVELS = [
  { value: "Iniciante", label: "Iniciante" },
  { value: "Intermediário", label: "Intermediário" },
  { value: "Avançado", label: "Avançado" },
  { value: "Calamidade", label: "Calamidade" },
];

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function CriarPersonagemModal({ isOpen, onClose }: Props) {
  const universes = Object.keys(MULTIVERSO_DATA);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<CharacterCategory>("aluno");
  const [universe, setUniverse] = useState(universes[0]);
  const [world, setWorld] = useState("");
  const [race, setRace] = useState("");
  const [element, setElement] = useState<CharacterElement | "">("");

  // Campos dinâmicos por categoria
  const [year, setYear] = useState("1");
  const [subject, setSubject] = useState("");
  const [occupation, setOccupation] = useState("");
  const [dangerLevel, setDangerLevel] = useState("Iniciante");

  const worldsInUniverse = Object.keys(
    MULTIVERSO_DATA[universe as keyof typeof MULTIVERSO_DATA]?.worlds ?? {}
  );

  const racesInWorld =
    world
      ? Object.keys(
          MULTIVERSO_DATA[universe as keyof typeof MULTIVERSO_DATA]?.worlds[
            world as keyof (typeof MULTIVERSO_DATA)[keyof typeof MULTIVERSO_DATA]["worlds"]
          ]?.races ?? {}
        )
      : [];

  // Efeito 1: universo muda → reseta mundo
  useEffect(() => {
    const firstWorld = worldsInUniverse[0] ?? "";
    setWorld(firstWorld);
  }, [universe]);

  // Efeito 2: mundo muda → reseta raça
  useEffect(() => {
    const firstRace = racesInWorld[0] ?? "";
    setRace(firstRace);
  }, [world]);

  // Efeito 3: raça muda → puxa elemento automaticamente
  useEffect(() => {
    if (!race || !world) return;
    const racesMap =
      MULTIVERSO_DATA[universe as keyof typeof MULTIVERSO_DATA]?.worlds[
        world as keyof (typeof MULTIVERSO_DATA)[keyof typeof MULTIVERSO_DATA]["worlds"]
      ]?.races ?? {};
    const autoElement = racesMap[race as keyof typeof racesMap];
    if (autoElement) setElement(autoElement);
  }, [race, world, universe]);

  function handleSubmit() {
    // TODO: conectar ao back-end
    console.log({ name, category, universe, world, race, element, year, subject, occupation, dangerLevel });
    handleClose();
  }

  function handleClose() {
    setName("");
    setCategory("aluno");
    setUniverse(universes[0]);
    setYear("1");
    setSubject("");
    setOccupation("");
    setDangerLevel("Iniciante");
    onClose();
  }

  return (
    <MillieModal isOpen={isOpen} onClose={handleClose} title="Criar Personagem" maxWidth="max-w-xl">
      <div className="space-y-4">
        <MillieInput
          label="Nome"
          placeholder="Nome do personagem"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <MillieSelect
          label="Categoria"
          options={CATEGORY_OPTIONS}
          value={category}
          onChange={(e) => setCategory(e.target.value as CharacterCategory)}
        />

        <MillieSelect
          label="Universo"
          options={universes.map((u) => ({ value: u, label: u }))}
          value={universe}
          onChange={(e) => setUniverse(e.target.value)}
        />

        <MillieSelect
          label="Mundo Natal"
          options={worldsInUniverse.map((w) => ({ value: w, label: w }))}
          value={world}
          onChange={(e) => setWorld(e.target.value)}
        />

        <MillieSelect
          label="Raça"
          options={racesInWorld.map((r) => ({ value: r, label: r }))}
          value={race}
          onChange={(e) => setRace(e.target.value)}
        />

        {/* Elemento — somente leitura */}
        <div className="flex flex-col gap-1.5">
          <label className="font-title text-[10px] uppercase tracking-[0.2em] text-bege-escuro">
            Elemento (automático)
          </label>
          <div className="border border-bege-escuro/20 bg-roxo-escuro/40 px-3 py-2.5">
            <span className="font-body text-sm capitalize text-bege-medio/60">
              {element || "—"}
            </span>
          </div>
        </div>

        {/* Campos dinâmicos */}
        {category === "aluno" && (
          <MillieSelect
            label="Ano Letivo"
            options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n}º ano` }))}
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
        )}
        {category === "professor" && (
          <MillieInput
            label="Disciplina"
            placeholder="Ex: Alquimia Avançada"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        )}
        {category === "npc" && (
          <MillieInput
            label="Ocupação"
            placeholder="Ex: Comerciante, Guardião"
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
          />
        )}
        {category === "monstro" && (
          <MillieSelect
            label="Nível de Perigo"
            options={DANGER_LEVELS}
            value={dangerLevel}
            onChange={(e) => setDangerLevel(e.target.value)}
          />
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={handleClose}
            className="font-title text-xs uppercase tracking-widest text-bege-medio/50 transition-colors hover:text-bege-claro"
          >
            Cancelar
          </button>
          <PrimaryButton onClick={handleSubmit}>
            Criar Personagem
          </PrimaryButton>
        </div>
      </div>
    </MillieModal>
  );
}