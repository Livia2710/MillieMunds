'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { getCharactersByActiveCampaign } from '@/app/actions/character'

type DashboardChar = {
  id: string
  name: string
  category: string
  image: string | null
  rank: string
  level: number
  year: number | null
  subject: string | null
  occupation: string | null
  dangerLevel: string | null
}

export default function MasterDashboard() {
  const [characters, setCharacters] = useState<DashboardChar[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCharactersByActiveCampaign()
      .then((data) => setCharacters(data as DashboardChar[]))
      .finally(() => setLoading(false))
  }, [])

  const getSubtext = (char: DashboardChar) => {
    switch (char.category) {
      case 'aluno': return `${char.year}º Ano — Nível ${char.level}`
      case 'professor': return `Leciona: ${char.subject}`
      case 'npc': return `Ocupação: ${char.occupation}`
      case 'monstro': return `Ameaça: ${char.dangerLevel}`
      default: return ''
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-bege-escuro/50 font-title text-sm tracking-widest uppercase animate-pulse">
          Carregando fichas...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 relative">
      <div className="border-b border-roxo pb-4 text-center sm:text-left">
        <h1 className="text-2xl font-title text-bege-medio tracking-[0.2em] uppercase">
          Painel de Controle do Mestre
        </h1>
        <p className="text-xs text-bege-escuro/60 mt-1 italic tracking-wide">
          Selecione uma ficha para auditar ou gerenciar.
        </p>
      </div>

      {characters.length === 0 ? (
        <p className="text-center text-bege-escuro/40 font-title text-sm tracking-wide py-12">
          Nenhum personagem criado ainda nesta campanha.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {characters.map((char) => (
            <Link
              key={char.id}
              href={`/perfil/${char.id}`}
              className="flex items-center gap-4 p-4 bg-roxo-escuro/40 border border-bege-escuro/40 hover:border-bege-medio transition-all group relative overflow-hidden shadow-card"
            >
              <div className={`absolute top-0 left-0 w-1 h-full opacity-60 group-hover:opacity-100 transition-opacity ${
                char.category === 'aluno' ? 'bg-blue-500/40' :
                char.category === 'professor' ? 'bg-purple-500/40' :
                char.category === 'npc' ? 'bg-green-500/40' : 'bg-red-500/40'
              }`} />

              <div className="relative w-12 h-12 rounded-full overflow-hidden border border-bege-escuro/30 bg-roxo-escuro shrink-0">
                {char.image ? (
                  <Image src={char.image} alt={char.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-bege-escuro/40 text-base font-title">?</div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-title text-bege-claro group-hover:text-bege-medio transition-colors truncate">
                    {char.name}
                  </h3>
                  <span className="text-[9px] px-1.5 py-0.5 bg-roxo-escuro border border-bege-escuro/20 text-bege-escuro/80 uppercase tracking-widest font-mono">
                    {char.category}
                  </span>
                </div>
                <p className="text-[11px] text-bege-escuro/50 font-title tracking-wide truncate mt-0.5">
                  {getSubtext(char)}
                </p>
              </div>

              <div className="relative w-6 h-6 shrink-0 opacity-70 group-hover:opacity-100 transition-all">
                <Image src={`/assets/svgs/${char.rank}.svg`} alt={`Rank ${char.rank}`} fill className="object-contain" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}