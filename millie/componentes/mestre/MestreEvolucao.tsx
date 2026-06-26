import Image from 'next/image'
import { Swords } from 'lucide-react'
import { SectionTitle, Empty } from './MestreUI'
import type { RacePath } from '@/lib/generated/prisma'

type Evolution = {
  id: string
  toRaceName: string
  path: RacePath
  levelRequired: number
}

type Character = {
  id: string
  name: string
  image: string | null
  level: number
  race: {
    name: string
    canAscend: boolean
    canCorrupt: boolean
    evolutions: Evolution[]
  }
}

const PATH_LABELS: Record<RacePath, string> = {
  ASCENSAO:    'Ascensão',
  CORRUPCAO:   'Corrupção',
  PERMANENCIA: 'Permanência',
}

const PATH_COLORS: Record<RacePath, string> = {
  ASCENSAO:    'text-yellow-400 border-yellow-400/40 bg-yellow-400/10',
  CORRUPCAO:   'text-red-400 border-red-400/40 bg-red-400/10',
  PERMANENCIA: 'text-blue-400 border-blue-400/40 bg-blue-400/10',
}

export default function MestreEvolucao({ eligible }: { eligible: Character[] }) {
  return (
    <section className="space-y-3">
      <SectionTitle icon={<Swords size={14} />} label="Ascensão & Corrupção" />

      {eligible.length === 0 ? (
        <Empty label="Nenhum personagem elegível para evolução no momento." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {eligible.map((char) => {
            const available = char.race.evolutions.filter((e) => char.level >= e.levelRequired)
            return (
              <div key={char.id} className="p-4 bg-roxo-escuro/40 border border-yellow-400/30 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="relative w-9 h-9 rounded-full overflow-hidden border border-bege-escuro/30 bg-roxo-escuro shrink-0">
                    {char.image ? (
                      <Image src={char.image} alt={char.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-bege-escuro/40 font-title text-xs">?</div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-title text-bege-claro">{char.name}</p>
                    <p className="text-[11px] text-bege-escuro/50">{char.race.name} · Nível {char.level}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {available.map((evo) => (
                    <span key={evo.id} className={`text-[10px] px-2 py-1 border font-title uppercase tracking-widest ${PATH_COLORS[evo.path]}`}>
                      {PATH_LABELS[evo.path]} → {evo.toRaceName}
                    </span>
                  ))}
                  {!char.race.canAscend && !char.race.canCorrupt && (
                    <span className={`text-[10px] px-2 py-1 border font-title uppercase tracking-widest ${PATH_COLORS['PERMANENCIA']}`}>
                      Permanência
                    </span>
                  )}
                </div>

                <p className="text-[10px] text-bege-escuro/40 italic">
                  A escolha pertence ao jogador — aguardando decisão.
                </p>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}