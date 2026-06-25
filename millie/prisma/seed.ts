import { PrismaClient } from '../lib/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  const escola = await prisma.universe.upsert({
    where: { name: 'Escola dos Mil Mundos' },
    update: {},
    create: { name: 'Escola dos Mil Mundos' },
  })

  console.log('✅ Universo criado:', escola.name)

  async function criarMundo(
    nome: string,
    racas: {
      name: string
      element: string
      baseRank: string
      canAscend: boolean
      canCorrupt: boolean
    }[]
  ) {
    const mundo = await prisma.universeWorld.upsert({
      where: { name_universeId: { name: nome, universeId: escola.id } },
      update: {},
      create: { name: nome, universeId: escola.id },
    })

    for (const raca of racas) {
      await prisma.race.upsert({
        where: { name_universeWorldId: { name: raca.name, universeWorldId: mundo.id } },
        update: {
          baseRank: raca.baseRank as any,
          canAscend: raca.canAscend,
          canCorrupt: raca.canCorrupt,
        },
        create: {
          name: raca.name,
          element: raca.element,
          baseRank: raca.baseRank as any,
          canAscend: raca.canAscend,
          canCorrupt: raca.canCorrupt,
          universeWorldId: mundo.id,
        },
      })
    }

    console.log(`  ✅ ${nome} — ${racas.length} raças`)
    return mundo
  }

  // ─── PRIMORDIAL ───────────────────────────────────────────────────────────
  await criarMundo('Primordial — Sem mundo fixo', [
    // Rank S — Raças Primordiais
    { name: 'Dalalilaz',        element: 'terra',  baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Xcacinlax',        element: 'agua',   baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Latauiz',          element: 'luz',    baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Dcarztainz',       element: 'trevas', baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Tctainni',         element: 'fogo',   baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Cxiinainaizx',     element: 'vento',  baseRank: 'S', canAscend: false, canCorrupt: false },
    // Rank — sem mundo fixo / Clã Arlatala
    { name: 'Gnomos',           element: 'terra',  baseRank: 'D', canAscend: false, canCorrupt: false },
    // Crysalis — raça criada pelos Dalalilaz (linhagem Zlaz)
    { name: 'Crysalis',         element: 'terra',  baseRank: 'D', canAscend: true,  canCorrupt: false },
    // Trevas — raças primordiais / sem mundo
    { name: 'Matriarca Voraz',  element: 'trevas', baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Ecoantes',         element: 'trevas', baseRank: 'D', canAscend: false, canCorrupt: false },
    { name: 'Gárgula Paranoica',element: 'trevas', baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Fúrias',           element: 'trevas', baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Necroth',          element: 'trevas', baseRank: 'D', canAscend: false, canCorrupt: false },
    { name: 'Diabretes',        element: 'trevas', baseRank: 'D', canAscend: false, canCorrupt: false },
  ])

  // ─── GAIA ─────────────────────────────────────────────────────────────────
  await criarMundo('Gaia', [
    // Terra
    { name: 'Ciclopes',         element: 'terra',  baseRank: 'C', canAscend: false, canCorrupt: false },
    { name: 'Borum',            element: 'terra',  baseRank: 'D', canAscend: true,  canCorrupt: false },
    { name: 'Minotauros',       element: 'terra',  baseRank: 'C', canAscend: true,  canCorrupt: false },
    { name: 'Dríade',           element: 'terra',  baseRank: 'C', canAscend: true,  canCorrupt: false },
    { name: 'Centauros',        element: 'terra',  baseRank: 'C', canAscend: false, canCorrupt: false },
    { name: 'Rabmares',         element: 'terra',  baseRank: 'C', canAscend: false, canCorrupt: false },
    { name: 'Goblins',          element: 'terra',  baseRank: 'E', canAscend: true,  canCorrupt: true  },
    { name: 'Hobgoblins',       element: 'terra',  baseRank: 'D', canAscend: false, canCorrupt: false },
    // Trevas
    { name: 'Nekos',            element: 'trevas', baseRank: 'C', canAscend: true,  canCorrupt: true  },
    { name: 'Nekomata',         element: 'trevas', baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Bakeneko',         element: 'trevas', baseRank: 'B', canAscend: true,  canCorrupt: false },
    { name: 'Kasha',            element: 'trevas', baseRank: 'A', canAscend: false, canCorrupt: false },
    // Fogo
    { name: 'Selvagens',        element: 'fogo',   baseRank: 'C', canAscend: true,  canCorrupt: false },
    { name: 'Selvagem Treinado',element: 'fogo',   baseRank: 'B', canAscend: false, canCorrupt: false },
  ])

  // ─── BESTIARIUS ───────────────────────────────────────────────────────────
  await criarMundo('Bestiarius', [
    // Terra
    { name: 'Ninfa Menor',          element: 'terra',  baseRank: 'E', canAscend: true,  canCorrupt: false },
    { name: 'Ninfa Maior',          element: 'terra',  baseRank: 'D', canAscend: false, canCorrupt: false },
    { name: 'Kilin',                element: 'terra',  baseRank: 'B', canAscend: true,  canCorrupt: false },
    { name: 'Tiamat',               element: 'terra',  baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Reptilianos',          element: 'terra',  baseRank: 'C', canAscend: true,  canCorrupt: false },
    { name: 'Draconatos',           element: 'terra',  baseRank: 'B', canAscend: true,  canCorrupt: false },
    { name: 'Dracônicos',           element: 'terra',  baseRank: 'A', canAscend: false, canCorrupt: false },
    // Luz
    { name: 'Celestiais',           element: 'luz',    baseRank: 'A', canAscend: false, canCorrupt: true  },
    // Trevas
    { name: 'Caídos',              element: 'trevas', baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Terrores',             element: 'trevas', baseRank: 'D', canAscend: false, canCorrupt: false },
    { name: 'Gárgulas Incompletas', element: 'trevas', baseRank: 'B', canAscend: true,  canCorrupt: true  },
    { name: 'Gárgula Vigilante',    element: 'trevas', baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Dhampirs',             element: 'trevas', baseRank: 'B', canAscend: true,  canCorrupt: true  },
    { name: 'Vampiros',             element: 'trevas', baseRank: 'A', canAscend: false, canCorrupt: false },
  ])

  // ─── DIMENSÃO DAS QUATRO ESTAÇÕES ─────────────────────────────────────────
  await criarMundo('Dimensão das Quatro Estações', [
    { name: 'Elfos da Primavera', element: 'terra', baseRank: 'B', canAscend: true,  canCorrupt: false },
    { name: 'Elfos do Inverno',   element: 'agua',  baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Elfos do Verão',     element: 'luz',   baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Fadas',              element: 'luz',   baseRank: 'D', canAscend: false, canCorrupt: false },
    { name: 'Elfos do Outono',    element: 'fogo',  baseRank: 'B', canAscend: false, canCorrupt: false },
  ])

  // ─── ARCAN — CAMADA NOAH ──────────────────────────────────────────────────
  await criarMundo('Arcan — Camada Noah', [
    // Terra
    { name: 'Druidas',         element: 'terra', baseRank: 'C', canAscend: true,  canCorrupt: false },
    { name: 'Esmeralda',       element: 'terra', baseRank: 'C', canAscend: true,  canCorrupt: false },
    { name: 'Nagas',           element: 'terra', baseRank: 'B', canAscend: true,  canCorrupt: false },
    // Água
    { name: 'Safira',          element: 'agua',  baseRank: 'C', canAscend: true,  canCorrupt: false },
    // Fogo
    { name: 'Panteras',        element: 'fogo',  baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Tigres',          element: 'fogo',  baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Kitsune',         element: 'fogo',  baseRank: 'B', canAscend: true,  canCorrupt: false },
    { name: 'Kohaku',          element: 'fogo',  baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Leões Imperiais', element: 'fogo',  baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Vaniers',         element: 'fogo',  baseRank: 'C', canAscend: false, canCorrupt: false },
    // Vento
    { name: 'Bruxas',          element: 'vento', baseRank: 'B', canAscend: false, canCorrupt: false },
  ])

  // ─── ARCAN — RIOS CÓSMICOS ────────────────────────────────────────────────
  await criarMundo('Arcan — Rios Cósmicos', [
    { name: 'Imugi', element: 'terra', baseRank: 'A', canAscend: false, canCorrupt: false },
  ])

  // ─── ARCAN — CELESTIA ─────────────────────────────────────────────────────
  await criarMundo('Arcan — Celestia', [
    { name: 'Ishins',             element: 'luz', baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Mensageiros Divinos',element: 'luz', baseRank: 'D', canAscend: true,  canCorrupt: false },
    { name: 'Hashmalins',         element: 'luz', baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Duendes',            element: 'luz', baseRank: 'D', canAscend: true,  canCorrupt: false },
    { name: 'Ofanins',            element: 'luz', baseRank: 'B', canAscend: true,  canCorrupt: false },
    { name: 'Shenzais',           element: 'luz', baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Elohins',            element: 'luz', baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Malakins',           element: 'luz', baseRank: 'A', canAscend: false, canCorrupt: false },
  ])

  // ─── VEYRON — SISTEMA SOLAR ───────────────────────────────────────────────
  await criarMundo('Veyron — Sistema Solar', [
    { name: 'Thaluris', element: 'agua',  baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Venaris',  element: 'agua',  baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Abissais', element: 'vento', baseRank: 'A', canAscend: false, canCorrupt: false },
  ])

  // ─── VEYRON — SISTEMA ARBORIS ─────────────────────────────────────────────
  await criarMundo('Veyron — Sistema Arboris', [
    { name: 'Floran Menor', element: 'terra', baseRank: 'E', canAscend: true,  canCorrupt: false },
    { name: 'Floran Maior', element: 'terra', baseRank: 'D', canAscend: false, canCorrupt: false },
    { name: 'Sylvan',       element: 'terra', baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Thalassins',   element: 'agua',  baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Kranors',      element: 'vento', baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Sylarinos',    element: 'vento', baseRank: 'B', canAscend: false, canCorrupt: false },
  ])

  // ─── VEYRON — PRÓXIMA CENTAURI ────────────────────────────────────────────
  await criarMundo('Veyron — Próxima Centauri', [
    { name: 'Tallans',  element: 'terra', baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Voltaris', element: 'agua',  baseRank: 'B', canAscend: false, canCorrupt: false },
  ])

  // ─── VEYRON — GALÁXIA DE ANDRÔMEDA ───────────────────────────────────────
  await criarMundo('Veyron — Galáxia de Andrômeda', [
    { name: 'Cotuns',        element: 'terra',  baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Lykos',         element: 'luz',    baseRank: 'B', canAscend: true,  canCorrupt: false },
    { name: 'Lykostella',    element: 'luz',    baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Aracnes',       element: 'trevas', baseRank: 'B', canAscend: true,  canCorrupt: true  },
    { name: 'Rainha da Seda',element: 'trevas', baseRank: 'A', canAscend: false, canCorrupt: false },
  ])

  // ─── VEYRON — GALÁXIA VIRGO ───────────────────────────────────────────────
  await criarMundo('Veyron — Galáxia Virgo', [
    { name: 'Durnak', element: 'trevas', baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Nihil',  element: 'trevas', baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Kranors', element: 'vento', baseRank: 'B', canAscend: false, canCorrupt: false },
  ])

  // ─── VEYRON — GALÁXIA CATA-VENTOS ────────────────────────────────────────
  await criarMundo('Veyron — Galáxia Cata-Ventos', [
    { name: 'Astrelions', element: 'luz',    baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Umbras',     element: 'trevas', baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Exelion',    element: 'fogo',   baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Harmonis',   element: 'vento',  baseRank: 'A', canAscend: false, canCorrupt: false },
  ])

  // ─── VEYRON — VIA LÁCTEA ──────────────────────────────────────────────────
  await criarMundo('Veyron — Via Láctea', [
    { name: 'Amados do Cosmo', element: 'luz',    baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Renari',          element: 'trevas', baseRank: 'A', canAscend: false, canCorrupt: false },
  ])

  // ─── VEYRON — NUVEM DE MAGALHÃES ──────────────────────────────────────────
  await criarMundo('Veyron — Nuvem de Magalhães', [
    { name: 'Sytari',    element: 'trevas', baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Necrorbis', element: 'trevas', baseRank: 'D', canAscend: false, canCorrupt: false },
    { name: 'Drahvoks',  element: 'fogo',   baseRank: 'A', canAscend: false, canCorrupt: false },
  ])

  // ─── VEYRON — NEBULOSA CIMERIANA ──────────────────────────────────────────
  await criarMundo('Veyron — Nebulosa Cimeriana', [
    { name: 'Androides', element: 'vento', baseRank: 'D', canAscend: true,  canCorrupt: false },
    { name: 'Techs',     element: 'vento', baseRank: 'B', canAscend: false, canCorrupt: false },
  ])

  console.log('\n🎉 Seed concluído!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())