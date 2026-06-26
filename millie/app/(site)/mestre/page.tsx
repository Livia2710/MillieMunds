'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCampaign } from '@/lib/contexts/CampaignContext'
import { getMasterPageData } from '@/app/actions/character'
import { Copy, Check, Scroll, Users, Star, Swords } from 'lucide-react'
import type { RacePath } from '@/lib/generated/prisma'

type Evolution = {
  id: string
  toRaceName: string
  path: RacePath
  levelRequired: number
}

// dois tipos separados: um para draws dentro do personagem, outro para a lista geral
type RawTarotDraw = {
  id: string
  readingType: string
  question: string
  cards: string[]
  sacrifice: string
  sacrificeIsPermanent: boolean
  hadJoker: boolean
  drawnAt: Date
  characterId: string
}

type TarotDraw = RawTarotDraw & { characterName: string }

type Character = {
  id: string
  name: string
  category: string
  image: string | null
  level: number
  rank: string
  racePath: RacePath | null
  evolvedRaceId: string | null
  playerId: string | null
  race: {
    id: string
    name: string
    canAscend: boolean
    canCorrupt: boolean
    evolutions: Evolution[]
  }
  tarotDraws: RawTarotDraw[]  // <-- sem characterName aqui
}

type Player = {
  userId: string
  username: string | null
  avatar: string | null
  email: string
  character: Character | null
}

type MasterData = {
  inviteCode: string
  campaignName: string
  players: Player[]
  characters: Character[]
  eligibleForEvolution: Character[]
  allTarotDraws: TarotDraw[]
}

const PATH_LABELS: Record<RacePath, string> = {
  ASCENSAO: 'Ascensão',
  CORRUPCAO: 'Corrupção',
  PERMANENCIA: 'Permanência',
}

const PATH_COLORS: Record<RacePath, string> = {
  ASCENSAO: 'text-yellow-400 border-yellow-400/40 bg-yellow-400/10',
  CORRUPCAO: 'text-red-400 border-red-400/40 bg-red-400/10',
  PERMANENCIA: 'text-blue-400 border-blue-400/40 bg-blue-400/10',
}

const CARD_LABELS: Record<string, string> = {
  as: 'Ás', '2': '2', '3': '3', '4': '4', '5': '5',
  '6': '6', '7': '7', '8': '8', '9': '9', '10': '10',
  valete: 'Valete', cavaleiro: 'Cavaleiro', rainha: 'Rainha',
  rei: 'Rei', coringa: 'Coringa',
}

export default function MestrePage() {
  const { isMaster, hasCampaign, loading: ctxLoading } = useCampaign()
  const [data, setData] = useState<MasterData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  // modal de evolução
  const [evolutionChar, setEvolutionChar] = useState<Character | null>(null)

  useEffect(() => {
    getMasterPageData()
      .then((d) => setData(d as MasterData))
      .finally(() => setLoading(false))
  }, [])

  function copyInvite() {
    if (!data) return
    navigator.clipboard.writeText(data.inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (ctxLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="font-title text-sm tracking-widest uppercase text-bege-escuro/50 animate-pulse">
          Carregando painel do mestre...
        </p>
      </div>
    )
  }

  if (!hasCampaign || !isMaster || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="font-title text-sm text-bege-escuro/40 tracking-wide">
          Acesso restrito ao Mestre da campanha ativa.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-10 pb-20">

      {/* ── Cabeçalho ── */}
      <div className="border-b border-roxo pb-4">
        <h1 className="font-title text-2xl text-bege-medio tracking-[0.2em] uppercase">
          Painel do Mestre
        </h1>
        <p className="text-xs text-bege-escuro/60 italic tracking-wide mt-1">
          {data.campaignName}
        </p>
      </div>

      {/* ── Invite Code ── */}
      <section className="space-y-3">
        <SectionTitle icon={<Star size={14} />} label="Código de Convite" />
        <div className="flex items-center gap-3 p-4 bg-roxo-escuro/40 border border-bege-escuro/30">
          <span className="font-mono text-sm text-bege-claro tracking-widest flex-1 select-all">
            {data.inviteCode}
          </span>
          <button
            onClick={copyInvite}
            className="flex items-center gap-2 px-3 py-1.5 border border-bege-escuro/40 text-bege-escuro hover:border-bege-medio hover:text-bege-medio transition text-xs font-title uppercase tracking-widest"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      </section>

      {/* ── Jogadores e Personagens ── */}
      <section className="space-y-3">
        <SectionTitle icon={<Users size={14} />} label="Jogadores" />
        {data.players.length === 0 ? (
          <Empty label="Nenhum jogador na campanha ainda." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.players.map((player) => (
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
                {player.character && (
                  <div className="relative w-6 h-6 shrink-0 opacity-60">
                    <Image
                      src={`/assets/svgs/${player.character.rank}.svg`}
                      alt={player.character.rank}
                      fill
                      className="object-contain"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Ascensão / Corrupção ── */}
      <section className="space-y-3">
        <SectionTitle icon={<Swords size={14} />} label="Ascensão & Corrupção" />
        {data.eligibleForEvolution.length === 0 ? (
          <Empty label="Nenhum personagem elegível para evolução no momento." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.eligibleForEvolution.map((char) => {
              const availableEvolutions = char.race.evolutions.filter(
                (e) => char.level >= e.levelRequired
              )
              return (
                <div
                  key={char.id}
                  className="p-4 bg-roxo-escuro/40 border border-yellow-400/30 space-y-3"
                >
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
                      <p className="text-[11px] text-bege-escuro/50">
                        {char.race.name} · Nível {char.level}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableEvolutions.map((evo) => (
                      <span
                        key={evo.id}
                        className={`text-[10px] px-2 py-1 border font-title uppercase tracking-widest ${PATH_COLORS[evo.path]}`}
                      >
                        {PATH_LABELS[evo.path]} → {evo.toRaceName}
                      </span>
                    ))}
                    {char.race.canAscend === false && char.race.canCorrupt === false && (
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

      {/* ── Leituras de Tarô ── */}
      <section className="space-y-3">
        <SectionTitle icon={<Scroll size={14} />} label="Leituras de Tarô" />
        {data.allTarotDraws.length === 0 ? (
          <Empty label="Nenhuma leitura registrada nesta campanha." />
        ) : (
          <div className="space-y-3">
            {data.allTarotDraws.map((draw) => (
              <div
                key={draw.id}
                className="p-4 bg-roxo-escuro/40 border border-bege-escuro/20 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-title uppercase tracking-widest text-bege-escuro/60">
                    {draw.characterName} ·{' '}
                    {draw.readingType === 'COMUM' ? 'Leitura Comum' : 'Leitura Profunda'}
                  </span>
                  <span className="text-[10px] text-bege-escuro/40">
                    {new Date(draw.drawnAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <p className="text-sm text-bege-claro italic">"{draw.question}"</p>
                <div className="flex flex-wrap gap-1.5">
                  {draw.cards.map((card, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 border border-bege-escuro/30 bg-roxo-escuro/60 text-bege-escuro font-mono uppercase"
                    >
                      {CARD_LABELS[card] ?? card}
                    </span>
                  ))}
                  {draw.hadJoker && (
                    <span className="text-[10px] px-2 py-0.5 border border-purple-400/40 bg-purple-400/10 text-purple-400 font-mono uppercase">
                      Coringa
                    </span>
                  )}
                </div>
                <p className="text-xs text-bege-escuro/60">
                  <span className="font-title uppercase tracking-widest text-[9px]">Sacrifício: </span>
                  {draw.sacrifice}
                  {draw.sacrificeIsPermanent && (
                    <span className="ml-2 text-red-400 text-[9px] uppercase tracking-widest font-title">(permanente)</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  )
}

// ── helpers de UI ──

function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-bege-escuro/70">
      {icon}
      <h2 className="font-title text-xs uppercase tracking-[0.2em]">{label}</h2>
      <div className="flex-1 h-px bg-bege-escuro/15" />
    </div>
  )
}

function Empty({ label }: { label: string }) {
  return (
    <p className="text-center text-bege-escuro/40 font-title text-xs tracking-wide py-8">
      {label}
    </p>
  )
}