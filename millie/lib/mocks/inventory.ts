import type { InventoryItem } from "@/lib/types/inventory";

export const mockInventoryItems: InventoryItem[] = [
  {
    id: "item-pergaminho",
    slug: "pergaminho",
    name: "Pergaminho",
    category: "equipamento",
    rarity: "comum",
    quantity: 1,
    image: "/assets/images/inventory/pergaminho.png",
    description: "Um pergaminho simples, resistente e marcada por tempos antigos.",
    worldSlug: "escola-millie-munds",
    forgedBy: "Ferreiros da Ala Norte",
    effect: "Aumenta levemente o dano físico em combate corpo a corpo.",
    isLocked: false,
  },
  {
    id: "item-pocao-rubra",
    slug: "pocao-rubra",
    name: "Poção Rubra",
    category: "consumivel",
    rarity: "incomum",
    quantity: 12,
    image: "/assets/images/inventory/pocao-rubra.png",
    description: "Um líquido vermelho e quente, usado em emergências.",
    worldSlug: "escola-millie-munds",
    origin: "Enfermaria Arcana",
    effect: "Recupera parte da vitalidade de quem a bebe.",
    isLocked: false,
  },
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
    isLocked: false,
  },
  {
    id: "item-anel-da-vigilia",
    slug: "anel-da-vigilia",
    name: "Anel da Vigília",
    category: "reliquia",
    rarity: "lendario",
    quantity: 1,
    image: "/assets/images/inventory/anel-vigilia.png",
    description: "Uma relíquia antiga que parece observar o mundo ao redor.",
    worldSlug: "escola-millie-munds",
    origin: "Arquivo Proibido",
    effect: "Permite sentir presenças ocultas por um curto período.",
    isLocked: true,
  },
  {
 id:"grimorio",
 slug:"grimorio-das-portas",

 name:"Grimório das Portas",

 category:"livro",
 rarity:"mitico",

 quantity:1,

 coverType:"image",

 coverImage:
 "/assets/images/inventory/grimorio.jpg",


 description:
 "Um livro instável sobre portas entre mundos.",


 worldSlug:"escola-millie-munds",


 author:"M. Vesper",


 chapters:[
 {
  id:"1",
  title:"A Primeira Fechadura",
  content:"Toda porta possui um segredo."
 }
 ],
 isLocked:false
},
  {
  id:"diario-astral",
  slug:"diario-astral",

  name:"Diário Astral",

  category:"livro",
  rarity:"raro",

  quantity:1,


  coverType:"color",

  coverColor:"#35213f",


  description:
  "Páginas que registram sonhos de outros mundos.",


  worldSlug:"mundo-etereo",


  author:"Lyra",


  chapters:[
  {
  id:"1",
  title:"O Primeiro Sonho",
  content:"As estrelas guardam memórias.",
  }, 
   {
  id:"2",
  title:"O Segundo Sonho",
  content:"As estrelas guardam memórias.",
  },
  ],
  isLocked:false
  },
  {
    id: "item-pocao-nigro",
    slug: "pocao-nigro",
    name: "Poção Nigro",
    category: "consumivel",
    rarity: "epico",
    quantity: 1,
    image: "/assets/images/inventory/pocao-nigro.png",
    description: "Uma chave ornamentada que não parece pertencer a nenhuma fechadura conhecida.",
    worldSlug: "escola-millie-munds",
    origin: "Encontrada no corredor oeste",
    effect: "Sua utilidade ainda é desconhecida.",
    isLocked: false,
  },
];