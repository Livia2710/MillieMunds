'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Users } from 'lucide-react'
import { SectionTitle, Empty } from './MestreUI'
import IniciarLeituraModal from '@/componentes/modais/IniciarLeituraModal'
import type { RacePath } from '@/lib/generated/prisma'

type Character = {
  id: string
  name: string
  level: number
  rank: string
  racePath: RacePath | null
  playerId: string | null
}

type Player = {
  userId: string
  username: string | null
  avatar: string | null
  email: string
  character: Character | null
}

export default function MestreJogadores({ players }: { players: Player[] }) {
  const [leituraChar, setLeituraChar] = useState<{ id: string; name: string } | null>(null)

  return (
    <section className="space-y-3">
      <SectionTitle icon={<Users size={14} />} label="Jogadores" />

      {players.length === 0 ? (
        <Empty label="Nenhum jogador na campanha ainda." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {players.map((player) => (
            <div
              key={player.userId}
              className="flex items-center gap-4 p-4 bg-roxo-escuro/40 border border-bege-escuro/30"
            >
              <div className="relative w-10 h-10 rounded-full overflow-hidden border border-bege-escuro/30 bg-roxo-escuro shrink-0">
                {player.avatar ? (
                  <Image src={player.avatar} alt={player.username ?? ''} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-bege-escuro/40 font-title text-sm">?</div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-title text-bege-claro truncate">
                  {player.username ?? player.email}
                </p>
                {player.character ? (
                  <Link
                    href={`/perfil/${player.character.id}`}
                    className="text-[11px] text-bege-escuro/60 hover:text-bege-medio transition truncate block mt-0.5"
                  >
                    {player.character.name} · Nível {player.character.level} · {player.character.rank}
                  </Link>
                ) : (
                  <p className="text-[11px] text-bege-escuro/40 italic mt-0.5">Sem personagem</p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {player.character && (
                  <>
                    <div className="relative w-6 h-6 opacity-60">
                      <Image
                        src={`/assets/svgs/${player.character.rank}.svg`}
                        alt={player.character.rank}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <button
                      onClick={() => setLeituraChar({ id: player.character!.id, name: player.character!.name })}
                      className="text-[10px] font-title uppercase tracking-widest border border-bege-escuro/30 px-2 py-1 text-bege-escuro/60 hover:border-bege-medio hover:text-bege-medio transition"
                    >
                      Tarô
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {leituraChar && (
        <IniciarLeituraModal
          isOpen={true}
          onClose={() => setLeituraChar(null)}
          characterId={leituraChar.id}
          characterName={leituraChar.name}
        />
      )}
    </section>
  )
}