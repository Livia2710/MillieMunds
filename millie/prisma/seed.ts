import { PrismaClient } from '../lib/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // ─── HELPERS ─────────────────────────────────────────────────────────────

  type RaceInput = {
    name: string
    element: string
    baseRank: string
    canAscend: boolean
    canCorrupt: boolean
  }

  async function criarUniverso(nome: string) {
    const universo = await prisma.universe.upsert({
      where: { name: nome },
      update: {},
      create: { name: nome },
    })
    console.log('✅ Universo criado:', universo.name)
    return universo
  }

  async function criarMundo(universo: { id: string }, nome: string, racas: RaceInput[]) {
    const mundo = await prisma.universeWorld.upsert({
      where: { name_universeId: { name: nome, universeId: universo.id } },
      update: {},
      create: { name: nome, universeId: universo.id },
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

  // busca um mundo pelo nome (nomes de mundo são únicos no conjunto de dados atual,
  // então não precisamos mais restringir por universo)
  async function getRace(nome: string, mundoNome: string) {
    const mundo = await prisma.universeWorld.findFirst({
      where: { name: mundoNome },
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
  // UNIVERSOS
  // =========================================================================

  const primordial     = await criarUniverso('Primordial — Sem Fixo')
  const gaia            = await criarUniverso('Gaia') 
  const bestiarius       = await criarUniverso('Bestiarius')
  const quatroEstacoes  = await criarUniverso('Dimensão das Quatro Estações')
  const claArlatala      = await criarUniverso('Clã Arlatala')
  const arcan             = await criarUniverso('Arcan')
  const veyron             = await criarUniverso('Veyron')

  // =========================================================================
  // MUNDOS E RAÇAS
  // =========================================================================

  // ─── PRIMORDIAL ───────────────────────────────────────────────────────────
  await criarMundo(primordial, 'Primordial — Sem mundo fixo', [
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
    { name: 'Latauiz — Ilacainctacainla (Paciência)',       element: 'luz', baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Latauiz — Calaxaiindladc (Castidade)',         element: 'luz', baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Latauiz — Tolarinlodlac (Humildade)',          element: 'luz', baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Latauiz — Dinloinlactacainla (Diligência)',    element: 'luz', baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Latauiz — Biztadlade (Bondade)',               element: 'luz', baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Latauiz — Aicaricalatasla (Temperança)',       element: 'luz', baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Latauiz — Calaaindladc (Caridade)',            element: 'luz', baseRank: 'S', canAscend: false, canCorrupt: false },

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
  ])

  // ─── CLÃ ARLATALA ─────────────────────────────────────────────────────────
  await criarMundo(claArlatala, 'Clã Arlatala', [
    { name: 'Gnomos',    element: 'terra', baseRank: 'D', canAscend: false, canCorrupt: false },
    { name: 'Phixie',    element: 'agua', baseRank: 'D', canAscend: false, canCorrupt: false },
    { name: 'Duendes',   element: 'luz', baseRank: 'D', canAscend: true,  canCorrupt: false },
    { name: 'Fadas',     element: 'luz',   baseRank: 'D', canAscend: false, canCorrupt: false },
    { name: 'Diabretes', element: 'trevas',   baseRank: 'D', canAscend: false, canCorrupt: false },
  ])

  // ─── GAIA ─────────────────────────────────────────────────────────────────
  await criarMundo(gaia, 'Gaia', [
    { name: 'Ciclopes',          element: 'terra',  baseRank: 'C', canAscend: true, canCorrupt: false },
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
  await criarMundo(bestiarius, 'Bestiarius', [
    { name: 'Ninfa Menor',          element: 'terra',  baseRank: 'E', canAscend: true,  canCorrupt: false },
    { name: 'Ninfa Maior',          element: 'terra',  baseRank: 'D', canAscend: true, canCorrupt: false },
    { name: 'Kilin',                element: 'terra',  baseRank: 'B', canAscend: true,  canCorrupt: false },
    { name: 'Tiamat',               element: 'terra',  baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Reptilianos',          element: 'terra',  baseRank: 'C', canAscend: true,  canCorrupt: false },
    { name: 'Draconatos',           element: 'terra',  baseRank: 'B', canAscend: true,  canCorrupt: false },
    { name: 'Dracônicos',           element: 'terra',  baseRank: 'A', canAscend: true, canCorrupt: false }, //Os Dracônicos podem evoluir fcaarcmz(força), arcaaazar(vigor), finzlocaila(inteligencia) , axla(agilidade) e o raro Bialatacaz(sorte), depedendendo do seu maior atributo,
    { name: 'Celestiais',           element: 'luz',    baseRank: 'A', canAscend: false, canCorrupt: true  },
    { name: 'Caídos',               element: 'trevas', baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Terrores',             element: 'trevas', baseRank: 'D', canAscend: false, canCorrupt: false }, //Tecnicamente ele é um parasita então ele pode "ascender"?Creio que não, já que é o hospedeiro que se torna um ecoante.
    { name: 'Ecoantes',             element: 'trevas', baseRank: 'D', canAscend: true,  canCorrupt: false },
    { name: 'Gárgulas Incompletas', element: 'trevas', baseRank: 'B', canAscend: true,  canCorrupt: true  },
    { name: 'Gárgula',              element: 'trevas', baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Gárgula Paranoica',    element: 'trevas', baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Dhampirs',             element: 'trevas', baseRank: 'B', canAscend: true,  canCorrupt: true  },
    { name: 'Vampiros',             element: 'trevas', baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Fúrias',               element: 'trevas', baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Rainha da Seda',       element: 'trevas', baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Matriarca Voraz',      element: 'trevas', baseRank: 'A', canAscend: false, canCorrupt: false }, //Apesar de ser um raça, é considerado um monstro em Bestiarius.
  ])

  // ─── DIMENSÃO DAS QUATRO ESTAÇÕES ─────────────────────────────────────────
  await criarMundo(quatroEstacoes, 'Dimensão das Quatro Estações', [
    { name: 'Elfos da Primavera', element: 'terra', baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Elfos do Inverno',   element: 'agua',  baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Elfos do Verão',     element: 'luz',   baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Elfos do Outono',    element: 'fogo',  baseRank: 'B', canAscend: false, canCorrupt: false },
  ])

  // ─── ARCAN — CAMADA NOAH ──────────────────────────────────────────────────
  await criarMundo(arcan, 'Noah', [
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
  await criarMundo(arcan, 'Rios Cósmicos', [
    { name: 'Imugi', element: 'terra', baseRank: 'A', canAscend: false, canCorrupt: false },
  ])

  // ─── ARCAN — CELESTIA ─────────────────────────────────────────────────────
  await criarMundo(arcan, 'Arcan — Celestia', [
    { name: 'Ishins',              element: 'luz', baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Mensageiros Divinos', element: 'luz', baseRank: 'D', canAscend: false, canCorrupt: false },
    { name: 'Hashmalins',          element: 'luz', baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Ofanins',             element: 'luz', baseRank: 'B', canAscend: true, canCorrupt: false }, //Um ofanim pode evoluir para um shenzal
    { name: 'Shenzais',            element: 'luz', baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Elohins',             element: 'luz', baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Malakins',            element: 'luz', baseRank: 'A', canAscend: true, canCorrupt: false }, //evolui para um aicaricalatasla - temperança.
  ])

   // ─── ARCAN — ABISMO ─────────────────────────────────────────────────────
  await criarMundo(arcan, 'Arcan — Abismo', [
    { name: 'Poymon ',         element: 'trevas', baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Beal',            element: 'trevas', baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Barthas',         element: 'trevas', baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Aymoymon',        element: 'trevas', baseRank: 'S', canAscend: true, canCorrupt: false }, 
    { name: 'Asmoday',         element: 'trevas', baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Bulfas',          element: 'trevas', baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Bune',            element: 'trevas', baseRank: 'B', canAscend: true, canCorrupt: false }, 
    { name: 'Berith ',         element: 'trevas', baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Esqui',           element: 'trevas', baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Gusion',          element: 'trevas', baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Eligos',          element: 'trevas', baseRank: 'B', canAscend: true, canCorrupt: false }, 
    { name: 'Flauros',         element: 'trevas', baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Foras',           element: 'trevas', baseRank: 'C', canAscend: false, canCorrupt: false },
    { name: 'Veal',            element: 'trevas', baseRank: 'S', canAscend: true, canCorrupt: false }, 
    { name: 'Purson ',         element: 'trevas', baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Barbatos',        element: 'trevas', baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Amon',            element: 'trevas', baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Buer',            element: 'trevas', baseRank: 'C', canAscend: true, canCorrupt: false }, 
    { name: 'Oriens',          element: 'trevas', baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Marbas',          element: 'trevas', baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Agares',          element: 'trevas', baseRank: 'B', canAscend: true, canCorrupt: false }, 
    { name: 'Andras ',         element: 'trevas', baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Balam',           element: 'trevas', baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Sitri',           element: 'trevas', baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Zepar',           element: 'trevas', baseRank: 'B', canAscend: true, canCorrupt: false }, 
    { name: 'Valefor',         element: 'trevas', baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Leraje',          element: 'trevas', baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Paymon',          element: 'trevas', baseRank: 'S', canAscend: true, canCorrupt: false }, 
    { name: 'Orobas',          element: 'trevas', baseRank: 'A', canAscend: true, canCorrupt: false }, 
    { name: 'Alloces',         element: 'trevas', baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Vapula',          element: 'trevas', baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Naberius',        element: 'trevas', baseRank: 'B', canAscend: true, canCorrupt: false }, 
  
  ])

  // ─── VEYRON — SISTEMA SOLAR ───────────────────────────────────────────────
  await criarMundo(veyron, 'Sistema Solar', [
    { name: 'Thaluris', element: 'agua',  baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Venaris',  element: 'agua',  baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Abissais', element: 'vento', baseRank: 'A', canAscend: false, canCorrupt: false },
  ])

  // ─── VEYRON — SISTEMA ARBORIS ─────────────────────────────────────────────
  await criarMundo(veyron, 'Sistema Arboris', [
    { name: 'Floran Menor', element: 'terra', baseRank: 'E', canAscend: true,  canCorrupt: false },
    { name: 'Floran Maior', element: 'terra', baseRank: 'D', canAscend: false, canCorrupt: false },
    { name: 'Sylvan',       element: 'terra', baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Thalassins',   element: 'agua',  baseRank: 'B', canAscend: false, canCorrupt: false },
  ])

  // ─── VEYRON — SISTEMA AVIAN ─────────────────────────────────────────────
  await criarMundo(veyron, 'Sistema Avian', [
    { name: 'Kranor',      element: 'vento', baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Durnak',      element: 'trevas',baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Sylarino',    element: 'vento', baseRank: 'C', canAscend: false, canCorrupt: false },
  ])

  // ─── VEYRON — SISTEMA AURIEL ─────────────────────────────────────────────
   await criarMundo(veyron, 'Sistema Auriel', [
    { name: 'Solaria',      element: 'luz', baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Auran',        element: 'luz', baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Astra',        element: 'luz', baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Lumina',       element: 'luz', baseRank: 'B', canAscend: false, canCorrupt: false },
  ])

  // ─── VEYRON — PRÓXIMA CENTAURI ────────────────────────────────────────────
  await criarMundo(veyron, 'Próxima Centauri', [
    { name: 'Tallans',  element: 'terra', baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Voltaris', element: 'agua',  baseRank: 'B', canAscend: false, canCorrupt: false },
  ])

  // ─── VEYRON — GALÁXIA DE ANDRÔMEDA ───────────────────────────────────────
  await criarMundo(veyron, 'Galáxia de Andrômeda', [
    { name: 'Cotuns',         element: 'terra',  baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Jotun',          element: 'terra',  baseRank: 'B', canAscend: true, canCorrupt: false },
    { name: 'Rotus',          element: 'terra',  baseRank: 'B', canAscend: true, canCorrupt: false },
    { name: 'Lykos',          element: 'luz',    baseRank: 'B', canAscend: true,  canCorrupt: false },
    { name: 'Lykostella',     element: 'luz',    baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Aracnes',        element: 'trevas', baseRank: 'B', canAscend: true,  canCorrupt: true  },
    { name: 'Rainha da Seda', element: 'trevas', baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Matriarca Voraz',   element: 'trevas', baseRank: 'A', canAscend: false, canCorrupt: false },
  ])

  // ─── VEYRON — Sistema Crysalis ───────────────────────────────────────────────
  await criarMundo(veyron, 'Sistema Crysalis', [
    { name: 'Rainha (Abelha / Vespa Dourada)', element: 'terra', baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Belita (Mariposa)',               element: 'terra', baseRank: 'C', canAscend: false, canCorrupt: false },
    { name: 'Synaptor (Formiga-Carpinteira)',  element: 'terra', baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Biogra (Vespa-Tecelã)',            element: 'terra', baseRank: 'B', canAscend: true, canCorrupt: false },
    { name: 'Mantis (Louva-a-Deus)',            element: 'terra', baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Titeus (Besouro-Hércules)',        element: 'terra', baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Aniso (Libélula)',                 element: 'terra', baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Coccine (Joaninha)',               element: 'terra', baseRank: 'D', canAscend: false,  canCorrupt: false },
  ])

  // ─── VEYRON — GALÁXIA CATA-VENTOS ────────────────────────────────────────
  await criarMundo(veyron, 'Veyron — Galáxia Cata-Ventos', [
    { name: 'Astrelions', element: 'luz',    baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Umbras',     element: 'trevas', baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Exelion',    element: 'fogo',   baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Harmonis',   element: 'vento',  baseRank: 'A', canAscend: false, canCorrupt: false },
  ])

  // ─── VEYRON — SISTEMA KEPLER ──────────────────────────────────────────────────
  await criarMundo(veyron, 'Sistema Kepler', [
    { name: 'Amados do Cosmo', element: 'luz',    baseRank: 'A', canAscend: false, canCorrupt: false },
    { name: 'Renari',          element: 'trevas', baseRank: 'A', canAscend: false, canCorrupt: false },
  ])

   // ─── VEYRON — SISTEMA NIHIL ──────────────────────────────────────────────────
  await criarMundo(veyron, 'Sistema Nihil', [
    { name: 'Nihil', element: 'trevas', baseRank: 'S', canAscend: false, canCorrupt: false },
  ])

  // ─── VEYRON — SISTEMA RENARI ──────────────────────────────────────────────────
  await criarMundo(veyron, 'Sistema Renari', [
    { name: 'Renari - Pyrrthus',  element: 'trevas', baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Renari - Aurion',    element: 'trevas', baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Renari - Veyra',     element: 'trevas', baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Renari - Vulcana',   element: 'trevas', baseRank: 'B', canAscend: false, canCorrupt: false },
    { name: 'Renari - Luminis',   element: 'trevas', baseRank: 'B', canAscend: false, canCorrupt: false },

  ])

  // ─── VEYRON — NUVEM DE MAGALHÃES ──────────────────────────────────────────
  await criarMundo(veyron, 'Veyron — Nuvem de Magalhães', [
    { name: 'Sytari',    element: 'trevas', baseRank: 'S', canAscend: false, canCorrupt: false },
    { name: 'Necrorbis', element: 'trevas', baseRank: 'D', canAscend: false, canCorrupt: false },
    { name: 'Necroth',   element: 'trevas', baseRank: 'D', canAscend: false, canCorrupt: false }, //Um Necroth é o que acontece quando um Necrorbis encontra um cadáver adequado e o consome, tornando-se um Necroth.O Rank corresponde ao rank do cadaver original.
    { name: 'Drahvoks',  element: 'fogo',   baseRank: 'A', canAscend: false, canCorrupt: false },
  ])

  // ─── VEYRON — NEBULOSA CIMERIANA ──────────────────────────────────────────
  await criarMundo(veyron, 'Veyron — Nebulosa Cimeriana', [
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

  // ── BORUM → MINOTAURO ──
  await criarEvolucao('Borum', 'Gaia', 'Minotauros', 'ASCENSAO')

  // ── JOTUN/ROTUS → COTUN ──
  await criarEvolucao('Jotun', 'Galáxia de Andrômeda', 'Cotuns', 'ASCENSAO')
  await criarEvolucao('Rotus', 'Galáxia de Andrômeda', 'Cotuns', 'ASCENSAO')

  // ── CADEIA DO VERDE: Ninfa → Dríade → Sylvan / Elfo da Primavera (fim) ──
  await criarEvolucao('Ninfa Menor', 'Bestiarius', 'Ninfa Maior', 'ASCENSAO')
  await criarEvolucao('Ninfa Maior', 'Bestiarius', 'Dríade',      'ASCENSAO') // ADICIONADO
  await criarEvolucao('Dríade', 'Gaia', 'Sylvan',              'ASCENSAO')
  await criarEvolucao('Dríade', 'Gaia', 'Elfos da Primavera',  'ASCENSAO') // ADICIONADO
  await criarEvolucao('Druidas', 'Noah', 'Elfos da Primavera', 'ASCENSAO') // MODIFICADO (era Sylvan)
  await criarEvolucao('Humanos de Noah — Linhagem Esmeralda', 'Noah', 'Sylvan', 'ASCENSAO')
 
  // ── FLORAN ──
  await criarEvolucao('Floran Menor', 'Sistema Arboris', 'Floran Maior', 'ASCENSAO') // mundo corrigido

  // ── CENTAURO → KILIN → TIAMAT ──
  await criarEvolucao('Centauros', 'Gaia',       'Kilin',  'ASCENSAO')
  await criarEvolucao('Kilin',     'Bestiarius', 'Tiamat', 'ASCENSAO')

  // ── REPTILIANO → DRACONATO → DRACÔNICO ──
  await criarEvolucao('Reptilianos', 'Bestiarius', 'Draconatos', 'ASCENSAO')
  await criarEvolucao('Draconatos',  'Bestiarius', 'Dracônicos', 'ASCENSAO')

  // ── NAGA → IMUGI ──
  await criarEvolucao('Nagas', 'Noah', 'Imugi', 'ASCENSAO') // mundo corrigido

  // ── HUMANOS DE GELIDA → ELFOS DO INVERNO ──
  await criarEvolucao('Humanos de Gelida — Linhagem Safira', 'Noah', 'Elfos do Inverno', 'ASCENSAO') // mundo corrigido

  // ── LYKOS → LYKOSTELLA ──
  await criarEvolucao('Lykos', 'Galáxia de Andrômeda', 'Lykostella', 'ASCENSAO')

  // ── ARACNE ──
  await criarEvolucao('Aracnes', 'Galáxia de Andrômeda', 'Rainha da Seda',  'ASCENSAO')
  await criarEvolucao('Aracnes', 'Galáxia de Andrômeda', 'Matriarca Voraz', 'CORRUPCAO')

  // ── ECOANTE → GÁRGULA INCOMPLETA → NORMAL ou PARANOICA ──
  await criarEvolucao('Ecoantes',             'Bestiarius', 'Gárgulas Incompletas', 'ASCENSAO')
  await criarEvolucao('Gárgulas Incompletas', 'Bestiarius', 'Gárgula',    'ASCENSAO')
  await criarEvolucao('Gárgulas Incompletas', 'Bestiarius', 'Gárgula Paranoica',    'CORRUPCAO')

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
  await criarEvolucao('Kitsune', 'Noah', 'Kohaku', 'ASCENSAO') // mundo corrigido

  // ── DUENDE → OFANIN → SHENZAI ──
  await criarEvolucao('Duendes', 'Clã Arlatala', 'Ofanins', 'ASCENSAO') // mundo corrigido
  await criarEvolucao('Ofanins', 'Arcan — Celestia', 'Shenzais', 'ASCENSAO', 100) // ADICIONADO

  // ── MALAKIN → LATAUIZ (TEMPERANÇA) ──
  await criarEvolucao('Malakins', 'Arcan — Celestia', 'Latauiz — Aicaricalatasla (Temperança)', 'ASCENSAO', 100) // ADICIONADO

  // ── ANDROIDE → TECH ──
  await criarEvolucao('Androides', 'Veyron — Nebulosa Cimeriana', 'Techs', 'ASCENSAO')

  // ── CRYSALIS: só a Biogra pode virar Rainha, e é raríssimo ──
  await criarEvolucao('Biogra (Vespa-Tecelã)', 'Sistema Crysalis', 'Rainha (Abelha / Vespa Dourada)', 'ASCENSAO', 195) // ADICIONADO

  console.log('\n🎉 Seed concluído!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())