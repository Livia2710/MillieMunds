import type { World } from "@/lib/types/world";
import { DEFAULT_WORLD_COVER_COLOR } from "@/lib/types/world";

export const worlds: World[] = [
  {
    id: "1",
    slug: "um",
    name: "Gaia",
    description: "Um mundo que não deveria existir.",
    image: "/mundos/mundo-1.png",
    coverColor: "#2b1c34",
    chapters: [
      {
        id: "historia",
        title: "História",
        content:
          "Eldoria nasceu entre montanhas antigas e bibliotecas esquecidas. Seus primeiros povos acreditavam que o conhecimento era uma forma de magia.",
      },
      {
        id: "racas",
        title: "Raças",
        content:
          "Humanos, elfos crepusculares e estudiosos errantes habitam Eldoria em regiões divididas por antigas linhagens.",
      },
      {
        id: "locais",
        title: "Locais",
        content:
          "Entre seus locais conhecidos estão a Torre de Vidro, o Porto Baixo e as ruínas da primeira escola arcana.",
      },
    ],
  },
    {
    id: "2",
    slug: "dois",
    name: "Dois",
    description: "22222222222222222222",
    image: "/mundos/mundo-1.png",
    coverColor: DEFAULT_WORLD_COVER_COLOR,
    chapters: [
      {
        id: "historia",
        title: "História",
        content:
          "Eldoria nasceu entre montanhas antigas e bibliotecas esquecidas. Seus primeiros povos acreditavam que o conhecimento era uma forma de magia.",
      },
      {
        id: "racas",
        title: "Raças",
        content:
          "Humanos, elfos crepusculares e estudiosos errantes habitam Eldoria em regiões divididas por antigas linhagens.",
      },
      {
        id: "locais",
        title: "Locais",
        content:
          "Entre seus locais conhecidos estão a Torre de Vidro, o Porto Baixo e as ruínas da primeira escola arcana.",
      },
    ],
  },  {
    id: "3",
    slug: "tres",
    name: "Tres",
    description: "33333333333333333333",
    image: "/mundos/mundo-2.png",
    coverColor: "#143033",
    chapters: [
      {
        id: "historia",
        title: "História",
        content:
          "Eldoria nasceu entre montanhas antigas e bibliotecas esquecidas. Seus primeiros povos acreditavam que o conhecimento era uma forma de magia.",
      },
      {
        id: "racas",
        title: "Raças",
        content:
          "Humanos, elfos crepusculares e estudiosos errantes habitam Eldoria em regiões divididas por antigas linhagens.",
      },
      {
        id: "locais",
        title: "Locais",
        content:
          "Entre seus locais conhecidos estão a Torre de Vidro, o Porto Baixo e as ruínas da primeira escola arcana.",
      },
    ],
  },  {
    id: "4",
    slug: "quatro",
    name: "Quatro",
    description: "44444444444444444444",
    image: "/mundos/mundo-3.jpg",
    coverColor: "#121d2e",
    chapters: [
      {
        id: "historia",
        title: "História",
        content:
          "Eldoria nasceu entre montanhas antigas e bibliotecas esquecidas. Seus primeiros povos acreditavam que o conhecimento era uma forma de magia.",
      },
      {
        id: "racas",
        title: "Raças",
        content:
          "Humanos, elfos crepusculares e estudiosos errantes habitam Eldoria em regiões divididas por antigas linhagens.",
      },
      {
        id: "locais",
        title: "Locais",
        content:
          "Entre seus locais conhecidos estão a Torre de Vidro, o Porto Baixo e as ruínas da primeira escola arcana.",
      },
    ],
  },
];

export function getWorldBySlug(slug: string) {
  return worlds.find((world) => world.slug === slug);
}