import { ProfileCharacter, ProfileSession } from '../types/profile';

export const mockProfileSession: ProfileSession = {
  id: 'usr_77',
  username: 'Guardiao_Mestre',
  role: 'jogador',
  hasCampaign: true,
  activeCharacterId: 'char_aluno_1'
};

export const mockProfileCharacters: Record<string, ProfileCharacter> = {
  'char_aluno_1': {
    id: 'char_aluno_1',
    category: 'aluno', // 1º Arquetipo
    name: 'Eldrin do Vale',
    year: 3, // Exclusivo de Aluno
    rank: 'B',
    element: 'terra',
    race: 'Dalalilaz',
    worldSlug: 'elysium',
    image: '/assets/images/castelo.png',
    level: 5,
    xp: 20,
    maxXp: 200,
    stats: { agilidade: 14, inteligencia: 18, forca: 10, vigor: 12, sorte: 15 },
    inventory: [
      {
        id: "item-cristal-ambar",
        slug: "cristal-ambar",
        name: "Cristal Âmbar",
        category: "material",
        rarity: "raro",
        quantity: 8,
        image: "/assets/images/inventory/cristal-ambar.png",
        description: "Um fragmento mineral que vibra quando exposto à magia.",
        worldSlug: "vales-de-aurora",
        origin: "Minas Solares",
        effect: "Pode ser usado para fortalecer encantamentos de luz.",
      },
      {
        id: 'inv_2',
        slug: 'grimorio-trevas',
        name: 'Tomos de Nigro',
        category: 'livro',
        rarity: 'epico',
        quantity: 1,
        coverType: 'image',
        coverImage: '/assets/images/inventory/grimorio.jpg',
        chapters: [],
        description: 'Livro de feitiços.',
        worldSlug: 'elysium'
      }
    ]
  }
};
