import type { CharacterElement } from "./character";

export type SkillBranch = "ativa" | "passiva" | "reacao" | "aprimoramento";

export type Skill = {
  id: string;
  name: string;
  description: string;
  branch: SkillBranch;
  currentLevel: number;
  maxLevel: number;
  isUnlocked: boolean;
  requiredCharacterLevel: number;
};

export type RaceSkillTree = {
  race: string;
  element: CharacterElement;
  skills: Skill[];
};

// Metadados visuais de cada elemento — usados em toda a UI de habilidades
export type ElementMeta = {
  element: CharacterElement;
  label: string;
  color: string;       // cor principal (hex) — para inline styles quando necessário
  glow: string;        // cor de brilho (hex)
  colorClass: string;  // classe Tailwind para texto
  bgClass: string;     // classe Tailwind para fundo
  borderClass: string; // classe Tailwind para borda
  glowClass: string;   // classe Tailwind para o glow (usado em box-shadow inline)
  svgPath: string;     // caminho do SVG do símbolo
};

export const ELEMENT_META: Record<CharacterElement, ElementMeta> = {
  fogo: {
    element: "fogo",
    label: "Fogo",
    color: "#D96A2B",
    glow: "#FF9A56",
    colorClass: "text-fogo",
    bgClass: "bg-fogo",
    borderClass: "border-fogo",
    glowClass: "text-fogo-glow",
    svgPath: "/assets/svgs/fogo.svg",
  },
  agua: {
    element: "agua",
    label: "Água",
    color: "#5BA8D6",
    glow: "#9BE1FF",
    colorClass: "text-agua",
    bgClass: "bg-agua",
    borderClass: "border-agua",
    glowClass: "text-agua-glow",
    svgPath: "/assets/svgs/agua.svg",
  },
  terra: {
    element: "terra",
    label: "Terra",
    color: "#8FA96B",
    glow: "#C7E39B",
    colorClass: "text-terra",
    bgClass: "bg-terra",
    borderClass: "border-terra",
    glowClass: "text-terra-glow",
    svgPath: "/assets/svgs/terra.svg",
  },
  vento: {
    element: "vento",
    label: "Vento",
    color: "#6CCFCF",
    glow: "#B5FFFF",
    colorClass: "text-vento",
    bgClass: "bg-vento",
    borderClass: "border-vento",
    glowClass: "text-vento-glow",
    svgPath: "/assets/svgs/vento.svg",
  },
  luz: {
    element: "luz",
    label: "Luz",
    color: "#D8B35E",
    glow: "#FFE9AB",
    colorClass: "text-luz",
    bgClass: "bg-luz",
    borderClass: "border-luz",
    glowClass: "text-luz-glow",
    svgPath: "/assets/svgs/luz.svg",
  },
  trevas: {
    element: "trevas",
    label: "Trevas",
    color: "#8C5ACF",
    glow: "#C89BFF",
    colorClass: "text-trevas",
    bgClass: "bg-trevas",
    borderClass: "border-trevas",
    glowClass: "text-trevas-glow",
    svgPath: "/assets/svgs/trevas.svg",
  },
};