export type WorldChapter = {
  id: string;
  title: string;
  content: string;
};

export type World = {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  coverColor?: string;
  chapters: WorldChapter[];
};

export const WORLD_COVER_COLORS = [
  { label: "Marrom Arcano", value: "#2a1307" },
  { label: "Roxo Profundo", value: "#2b1c34" },
  { label: "Vinho Antigo", value: "#3a121c" },
  { label: "Verde Musgo", value: "#1f2b20" },
  { label: "Azul Nocturno", value: "#121d2e" },
  { label: "Petróleo Escuro", value: "#143033" },
  { label: "Grafite Ritual", value: "#202026" },
] as const;

export const DEFAULT_WORLD_COVER_COLOR = WORLD_COVER_COLORS[0].value;