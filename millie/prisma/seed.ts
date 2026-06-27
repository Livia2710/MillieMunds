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

  // ─── HELPERS ─────────────────────────────────────────────────────────────

  type RaceInput = {
    name: string
    element: string
    baseRank: string
    canAscend: boolean
    canCorrupt: boolean
  }

  async function criarMundo(nome: string, racas: RaceInput[]) {
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

  async function getRace(nome: string, mundoNome: string) {
    const mundo = await prisma.universeWorld.findFirst({
      where: { name: mundoNome, universeId: escola.id },
    })
    if (!mundo) throw new Error(`Mundo não encontrado: ${mundoNome}`)
    const race = await prisma.race.findFirst({
      where: { name: nome, universeWorldId: mundo.id },
    })
    if (!race) throw new Error(`Raça não encontrada: "${nome}" em "${mundoNome}"`)
    return race
  }

  // Schema: RaceEvolution tem fromRaceId, toRaceName (String), path (RacePath), levelRequired
  // Não há @@unique — usamos createMany com skipDuplicates ou simplesmente deleteMany + create.
  // Para seed idempotente: deletamos as evoluções de cada raça origem antes de recriar.
  async function criarEvolucao(
    origemNome: string,
    origemMundo: string,
    destinoNome: string,         // apenas o nome — toRaceName é String no schema
    path: 'ASCENSAO' | 'CORRUPCAO' | 'PERMANENCIA',
    levelRequired: number = 100
  ) {
    const origem = await getRace(origemNome, origemMundo)
    // Garante idempotência: remove evolução com mesmo fromRaceId + toRaceName + path se existir
    await prisma.raceEvolution.deleteMany({
      where: { fromRaceId: origem.id, toRaceName: destinoNome, path },
    })
    await prisma.raceEvolution.create({
      data: {
        fromRaceId: origem.id,
        toRaceName: destinoNome,
        path,
        levelRequired,
      },
    })
    console.log(`    🔀 ${origemNome} -[${path}]→ ${destinoNome}`)
  }

  // =========================================================================
  // MUNDOS E RAÇAS
  // =========================================================================

  // ─── PRIMORDIAL ───────────────────────────────────────────────────────────
  await criarMundo('Primordial — Sem mundo fixo', [
    // ── DALALILAZ (Terra | S) — linhagens ──
    { name: 'Dalalilaz — Zlaz (Linhagem Dourada)',          element: 'terra',  baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Dalalilaz — Ialaaila (Prata Viva)',            element: 'terra',  baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Dalalilaz — Lassllo',                          element: 'terra',  baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Dalalilaz — Arcaaazar',                        element: 'terra',  baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Dalalilaz — Fcadc',                            element: 'terra',  baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Dalalilaz — Azxla',                            element: 'terra',  baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Dalalilaz — Finzlocaila',                      element: 'terra',  baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Dalalilaz — Fcaarcmz',                         element: 'terra',  baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Dalalilaz — Bialatacaz',                       element: 'terra',  baseRank: 'S', canAscend: false, canCorrupt: false },

    // ── XCACINLAX (Água | S) — linhagens ──
    { name: 'Xcacinlax — Linhagem Real',                    element: 'agua',   baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Xcacinlax — Tinta (Baleia-Fin)',               element: 'agua',   baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Xcacinlax — Uilbilaaic (Baleia Jubarte)',      element: 'agua',   baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Xcacinlax — Calaylalacic (Cachalote)',         element: 'agua',   baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Xcacinlax — Aiinliac (Tubarão-Tigre)',         element: 'agua',   baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Xcacinlax — Arlaraz (Tubarão-Mako)',           element: 'agua',   baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Xcacinlax — Albillaalaz (Tubarão-Limão)',      element: 'agua',   baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Xcacinlax — Zacala (Orca)',                    element: 'agua',   baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Xcacinlax — Bilaaltalata (Burrunan)',          element: 'agua',   baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Xcacinlax — Talaaflalo (Narval)',              element: 'agua',   baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Xcacinlax — Lintaailadla (Arraia Pintada)',    element: 'agua',   baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Xcacinlax — Clocaiaincala (Arraia Elétrica)',  element: 'agua',   baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Xcacinlax — Uilaarlataaila (Jamanta)',         element: 'agua',   baseRank: 'S', canAscend: false, canCorrupt: false },

    // ── LATAUIZ (Luz | S) — sete ordens ──
    { name: 'Latauiz — Ilacainctacainla (Portadores da Lei)',  element: 'luz', baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Latauiz — Calaxaiindladc (Olhos da Verdade)',     element: 'luz', baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Latauiz — Tolarinlodlac (Guardiões da Memória)', element: 'luz', baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Latauiz — Dinloinlactacainla (Generais da Luz)', element: 'luz', baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Latauiz — Biztadlade (Incorruptíveis)',           element: 'luz', baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Latauiz — Aicaricalatasla (Bastiões Sagrados)',   element: 'luz', baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Latauiz — Calaaindladc (Juízes Silenciosos)',     element: 'luz', baseRank: 'S', canAscend: false, canCorrupt: false },

    // ── DCARZTAINZ (Trevas | S) — sete Iccaladzx ──
    { name: 'Dcarztainz — Inala (Ira)',                     element: 'trevas', baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Dcarztainz — Lolnilainla (Desejo)',            element: 'trevas', baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Dcarztainz — Zalilkz (Orgulho)',               element: 'trevas', baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Dcarztainz — Iaclilinsla (Vazio)',             element: 'trevas', baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Dcarztainz — Lilatalatacainla (Ganância)',     element: 'trevas', baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Dcarztainz — Lillola (Fome)',                  element: 'trevas', baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Dcarztainz — Intafcuila (Inveja)',             element: 'trevas', baseRank: 'S', canAscend: false, canCorrupt: false },

    // ── TCTAINNI (Fogo | S) — cinco famílias ──
    { name: 'Tctainni — Lialatadcx (Chama Vermelha)',       element: 'fogo',   baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Tctainni — Iconlctala (Chama Laranja)',        element: 'fogo',   baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Tctainni — Onlctaaic (Chama Amarela)',         element: 'fogo',   baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Tctainni — Tainla (Chama Azul)',               element: 'fogo',   baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Tctainni — Xlalialadlax (Chama Branca)',       element: 'fogo',   baseRank: 'S', canAscend: false, canCorrupt: false },

    // ── CXIINAINAIZX (Vento | S) — quatro vertentes ──
    { name: 'Cxiinainaizx — Vento Livre',                   element: 'vento',  baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Cxiinainaizx — Vento do Vazio',                element: 'vento',  baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Cxiinainaizx — Vento do Destino',              element: 'vento',  baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Cxiinainaizx — Vento da Voz',                  element: 'vento',  baseRank: 'S', canAscend: false, canCorrupt: false },

    // ── Clã Arlatala ──
    { name: 'Gnomos', element: 'terra', baseRank: 'D', canAscend: false, canCorrupt: false },

    // ── Crysalis — castas ──
    { name: 'Crysalis — Rainha (Abelha / Vespa Dourada)', element: 'terra', baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Crysalis — Belta (Mariposa)',                 element: 'terra', baseRank: 'C', canAscend: false, canCorrupt: false },
    { name: 'Crysalis — Synaptor (Formiga-Carpinteira)',   element: 'terra', baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Crysalis — Biogra (Vespa-Tecelã)',            element: 'terra', baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Crysalis — Mantis (Louva-a-Deus)',            element: 'terra', baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Crysalis — Titeus (Besouro-Hércules)',        element: 'terra', baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Crysalis — Aniso (Libélula)',                 element: 'terra', baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Crysalis — Coccine (Joaninha)',               element: 'terra', baseRank: 'D', canAscend: true,  canCorrupt: false },

    // ── Trevas — raças sem mundo fixo ──
    { name: 'Matriarca Voraz',   element: 'trevas', baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Ecoantes',          element: 'trevas', baseRank: 'D', canAscend: true,  canCorrupt: false },
    { name: 'Gárgula Paranoica', element: 'trevas', baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Fúrias',            element: 'trevas', baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Necroth',           element: 'trevas', baseRank: 'D', canAscend: false, canCorrupt: false },
    { name: 'Diabretes',         element: 'trevas', baseRank: 'D', canAscend: false, canCorrupt: false },
  ])

  // ─── GAIA ─────────────────────────────────────────────────────────────────
  await criarMundo('Gaia', [
    { name: 'Ciclopes',          element: 'terra',  baseRank: 'C', canAscend: false, canCorrupt: false },
    { name: 'Borum',             element: 'terra',  baseRank: 'D', canAscend: true,  canCorrupt: false },
    { name: 'Minotauros',        element: 'terra',  baseRank: 'C', canAscend: true,  canCorrupt: false },
    { name: 'Dríade',            element: 'terra',  baseRank: 'C', canAscend: true,  canCorrupt: false },
    { name: 'Centauros',         element: 'terra',  baseRank: 'C', canAscend: true,  canCorrupt: false },
    { name: 'Rabmares',          element: 'terra',  baseRank: 'C', canAscend: false, canCorrupt: false },
    { name: 'Goblins',           element: 'terra',  baseRank: 'E', canAscend: true,  canCorrupt: true  },
    { name: 'Hobgoblins',        element: 'terra',  baseRank: 'D', canAscend: false, canCorrupt: false },
    { name: 'Nekos',             element: 'trevas', baseRank: 'C', canAscend: true,  canCorrupt: true  },
    { name: 'Nekomata',          element: 'trevas', baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Bakeneko',          element: 'trevas', baseRank: 'B', canAscend: true,  canCorrupt: false },
    { name: 'Kasha',             element: 'trevas', baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Selvagens',         element: 'fogo',   baseRank: 'C', canAscend: true,  canCorrupt: false },
    { name: 'Selvagem Treinado', element: 'fogo',   baseRank: 'B', canAscend: false, canCorrupt: false },
  ])

  // ─── BESTIARIUS ───────────────────────────────────────────────────────────
  await criarMundo('Bestiarius', [
    { name: 'Ninfa Menor',          element: 'terra',  baseRank: 'E', canAscend: true,  canCorrupt: false },
    { name: 'Ninfa Maior',          element: 'terra',  baseRank: 'D', canAscend: false, canCorrupt: false },
    { name: 'Kilin',                element: 'terra',  baseRank: 'B', canAscend: true,  canCorrupt: false },
    { name: 'Tiamat',               element: 'terra',  baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Reptilianos',          element: 'terra',  baseRank: 'C', canAscend: true,  canCorrupt: false },
    { name: 'Draconatos',           element: 'terra',  baseRank: 'B', canAscend: true,  canCorrupt: false },
    { name: 'Dracônicos',           element: 'terra',  baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Celestiais',           element: 'luz',    baseRank: 'A', canAscend: false, canCorrupt: true  },
    { name: 'Caídos',               element: 'trevas', baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Terrores',             element: 'trevas', baseRank: 'D', canAscend: false, canCorrupt: false },
    { name: 'Ecoantes',             element: 'trevas', baseRank: 'D', canAscend: true,  canCorrupt: false },
    { name: 'Gárgulas Incompletas', element: 'trevas', baseRank: 'B', canAscend: true,  canCorrupt: true  },
    { name: 'Gárgula Vigilante',    element: 'trevas', baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Gárgula Paranoica',    element: 'trevas', baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Dhampirs',             element: 'trevas', baseRank: 'B', canAscend: true,  canCorrupt: true  },
    { name: 'Vampiros',             element: 'trevas', baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Fúrias',               element: 'trevas', baseRank: 'A', canAscend: false, canCorrupt: false },
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
    { name: 'Druidas',                              element: 'terra', baseRank: 'C', canAscend: true,  canCorrupt: false },
    { name: 'Humanos de Noah — Linhagem Esmeralda', element: 'terra', baseRank: 'C', canAscend: true,  canCorrupt: false },
    { name: 'Nagas',                                element: 'terra', baseRank: 'B', canAscend: true,  canCorrupt: false },
    { name: 'Humanos de Gelida — Linhagem Safira',  element: 'agua',  baseRank: 'C', canAscend: true,  canCorrupt: false },
    { name: 'Panteras',                             element: 'fogo',  baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Tigres',                               element: 'fogo',  baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Kitsune',                              element: 'fogo',  baseRank: 'B', canAscend: true,  canCorrupt: false },
    { name: 'Kohaku',                               element: 'fogo',  baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Leões Imperiais',                      element: 'fogo',  baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Vaniers',                              element: 'fogo',  baseRank: 'C', canAscend: false, canCorrupt: false },
    { name: 'Bruxas',                               element: 'vento', baseRank: 'B', canAscend: false, canCorrupt: false },
  ])

  // ─── ARCAN — RIOS CÓSMICOS ────────────────────────────────────────────────
  await criarMundo('Arcan — Rios Cósmicos', [
    { name: 'Imugi', element: 'terra', baseRank: 'A', canAscend: false, canCorrupt: false },
  ])

  // ─── ARCAN — CELESTIA ─────────────────────────────────────────────────────
  await criarMundo('Arcan — Celestia', [
    { name: 'Ishins',              element: 'luz', baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Mensageiros Divinos', element: 'luz', baseRank: 'D', canAscend: true,  canCorrupt: false },
    { name: 'Hashmalins',          element: 'luz', baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Duendes',             element: 'luz', baseRank: 'D', canAscend: true,  canCorrupt: false },
    { name: 'Ofanins',             element: 'luz', baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Shenzais',            element: 'luz', baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Elohins',             element: 'luz', baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Malakins',            element: 'luz', baseRank: 'A', canAscend: false, canCorrupt: false },
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
    { name: 'Sylarinos',    element: 'vento', baseRank: 'C', canAscend: false, canCorrupt: false },
  ])

  // ─── VEYRON — PRÓXIMA CENTAURI ────────────────────────────────────────────
  await criarMundo('Veyron — Próxima Centauri', [
    { name: 'Tallans',  element: 'terra', baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Voltaris', element: 'agua',  baseRank: 'B', canAscend: false, canCorrupt: false },
  ])

  // ─── VEYRON — GALÁXIA DE ANDRÔMEDA ───────────────────────────────────────
  await criarMundo('Veyron — Galáxia de Andrômeda', [
    { name: 'Cotuns',         element: 'terra',  baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Jotun',          element: 'terra',  baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Rotus',          element: 'terra',  baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Lykos',          element: 'luz',    baseRank: 'B', canAscend: true,  canCorrupt: false },
    { name: 'Lykostella',     element: 'luz',    baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Aracnes',        element: 'trevas', baseRank: 'B', canAscend: true,  canCorrupt: true  },
    { name: 'Rainha da Seda', element: 'trevas', baseRank: 'A', canAscend: false, canCorrupt: false },
  ])

  // ─── VEYRON — GALÁXIA VIRGO ───────────────────────────────────────────────
  await criarMundo('Veyron — Galáxia Virgo', [
    { name: 'Durnak',   element: 'trevas', baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Nihil',    element: 'trevas', baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Kranors',  element: 'vento',  baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Sylarinos', element: 'vento', baseRank: 'C', canAscend: false, canCorrupt: false },
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

  // =========================================================================
  // EVOLUÇÕES (RaceEvolution)
  // Campos do schema: fromRaceId, toRaceName (String), path (RacePath), levelRequired
  // toRaceName = nome exato da raça destino como cadastrado acima
  // =========================================================================
  console.log('\n🔀 Cadastrando evoluções...')

  // ── GOBLIN ──
  await criarEvolucao('Goblins', 'Gaia', 'Hobgoblins', 'ASCENSAO')
  await criarEvolucao('Goblins', 'Gaia', 'Diabretes',  'CORRUPCAO')

  // ── BORUM → MINOTAURO → JOTUN ou ROTUS ──
  await criarEvolucao('Borum',      'Gaia', 'Minotauros', 'ASCENSAO')
  await criarEvolucao('Minotauros', 'Gaia', 'Jotun',      'ASCENSAO')
  await criarEvolucao('Minotauros', 'Gaia', 'Rotus',      'ASCENSAO')

  // ── DRÍADE / DRUIDA / ESMERALDA / ELFO DA PRIMAVERA → SYLVAN ──
  await criarEvolucao('Dríade',                              'Gaia',                         'Sylvan', 'ASCENSAO')
  await criarEvolucao('Druidas',                             'Arcan — Camada Noah',          'Sylvan', 'ASCENSAO')
  await criarEvolucao('Humanos de Noah — Linhagem Esmeralda','Arcan — Camada Noah',          'Sylvan', 'ASCENSAO')
  await criarEvolucao('Elfos da Primavera',                  'Dimensão das Quatro Estações', 'Sylvan', 'ASCENSAO')

  // ── FLORAN ──
  await criarEvolucao('Floran Menor', 'Veyron — Sistema Arboris', 'Floran Maior', 'ASCENSAO')

  // ── NINFA ──
  await criarEvolucao('Ninfa Menor', 'Bestiarius', 'Ninfa Maior', 'ASCENSAO')

  // ── CENTAURO → KILIN → TIAMAT ──
  await criarEvolucao('Centauros', 'Gaia',       'Kilin',  'ASCENSAO')
  await criarEvolucao('Kilin',     'Bestiarius', 'Tiamat', 'ASCENSAO')

  // ── REPTILIANO → DRACONATO → DRACÔNICO ──
  await criarEvolucao('Reptilianos', 'Bestiarius', 'Draconatos', 'ASCENSAO')
  await criarEvolucao('Draconatos',  'Bestiarius', 'Dracônicos', 'ASCENSAO')

  // ── NAGA → IMUGI ──
  await criarEvolucao('Nagas', 'Arcan — Camada Noah', 'Imugi', 'ASCENSAO')

  // ── HUMANOS DE GELIDA → ELFOS DO INVERNO ──
  await criarEvolucao('Humanos de Gelida — Linhagem Safira', 'Arcan — Camada Noah', 'Elfos do Inverno', 'ASCENSAO')

  // ── LYKOS → LYKOSTELLA ──
  await criarEvolucao('Lykos', 'Veyron — Galáxia de Andrômeda', 'Lykostella', 'ASCENSAO')

  // ── ARACNE ──
  await criarEvolucao('Aracnes', 'Veyron — Galáxia de Andrômeda', 'Rainha da Seda',  'ASCENSAO')
  await criarEvolucao('Aracnes', 'Veyron — Galáxia de Andrômeda', 'Matriarca Voraz', 'CORRUPCAO')

  // ── ECOANTE → GÁRGULA INCOMPLETA → VIGILANTE ou PARANOICA ──
  await criarEvolucao('Ecoantes',            'Bestiarius', 'Gárgulas Incompletas', 'ASCENSAO')
  await criarEvolucao('Gárgulas Incompletas','Bestiarius', 'Gárgula Vigilante',    'ASCENSAO')
  await criarEvolucao('Gárgulas Incompletas','Bestiarius', 'Gárgula Paranoica',    'CORRUPCAO')

  // ── DHAMPIR ──
  await criarEvolucao('Dhampirs', 'Bestiarius', 'Vampiros', 'ASCENSAO')
  await criarEvolucao('Dhampirs', 'Bestiarius', 'Fúrias',   'CORRUPCAO')

  // ── NEKO → BAKENEKO → KASHA (ou CORRUPCAO → NEKOMATA) ──
  await criarEvolucao('Nekos',    'Gaia', 'Bakeneko', 'ASCENSAO')
  await criarEvolucao('Nekos',    'Gaia', 'Nekomata', 'CORRUPCAO')
  await criarEvolucao('Bakeneko', 'Gaia', 'Kasha',    'ASCENSAO')

  // ── SELVAGENS ──
  await criarEvolucao('Selvagens', 'Gaia', 'Selvagem Treinado', 'ASCENSAO')

  // ── KITSUNE → KOHAKU ──
  await criarEvolucao('Kitsune', 'Arcan — Camada Noah', 'Kohaku', 'ASCENSAO')

  // ── MENSAGEIRO DIVINO / DUENDE → OFANIN ──
  await criarEvolucao('Mensageiros Divinos', 'Arcan — Celestia', 'Ofanins', 'ASCENSAO')
  await criarEvolucao('Duendes',             'Arcan — Celestia', 'Ofanins', 'ASCENSAO')

  // ── ANDROIDE → TECH ──
  await criarEvolucao('Androides', 'Veyron — Nebulosa Cimeriana', 'Techs', 'ASCENSAO')

  // ── CRYSALIS COCCINE → RAINHA (ascensão rara) ──
  await criarEvolucao(
    'Crysalis — Coccine (Joaninha)',
    'Primordial — Sem mundo fixo',
    'Crysalis — Rainha (Abelha / Vespa Dourada)',
    'ASCENSAO'
  )

  console.log('\n🎉 Seed concluído!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())