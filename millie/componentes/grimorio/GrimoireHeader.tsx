import { Crown, Sparkles } from 'lucide-react'
import type { GrimoireData } from '@/lib/types/grimoire'

type CharacterOption = GrimoireData['characters'][number]

export function GrimoireHeader({ character, characters, characterId, isMaster, onCharacterChange, onToggleAdmin }: {
  character: GrimoireData['character']
  characters: CharacterOption[]
  characterId: string
  isMaster: boolean
  onCharacterChange: (id: string) => void
  onToggleAdmin: () => void
}) {
  return <section className="relative mb-6 overflow-hidden rounded-xl border border-bege-medio/30 bg-[radial-gradient(ellipse_at_75%_30%,rgba(111,65,126,.34),transparent_55%),linear-gradient(110deg,#1a0f22,#2b1c34)] px-6 py-7 md:px-10">
    <div className="absolute -right-5 -top-12 opacity-[.08]"><Sparkles size={210} strokeWidth={0.6}/></div>
    <p className="font-title text-xs uppercase tracking-[.3em] text-bege-medio">Escola dos Mil Mundos · Acervo ritualístico</p>
    <h1 className="mt-2 font-title text-4xl text-bege-claro md:text-5xl">Grimório</h1>
    <p className="mt-1 font-title text-lg italic text-bege-medio">O conhecimento preservado através dos selos.</p>
    <div className="mt-5 flex flex-wrap items-center gap-3">
      {isMaster && <label className="flex flex-wrap items-center gap-2 text-xs text-bege-medio"><span>Personagem</span><select aria-label="Personagem" value={characterId} onChange={event => onCharacterChange(event.target.value)} className="rounded border border-bege-medio/30 bg-roxo-escuro px-3 py-2 text-sm text-bege-claro">{characters.map(item => <option key={item.id} value={item.id}>{item.name} · {item.race} · Rank {item.rank}</option>)}</select></label>}
      {character && !isMaster && <span className="text-sm text-bege-medio">{character.name} · {character.race} · Rank {character.rank}</span>}
      {isMaster && character && <button type="button" onClick={onToggleAdmin} className="ml-auto flex items-center gap-2 rounded border border-bege-medio/40 px-3 py-2 text-xs hover:bg-bege-medio/10"><Crown size={15}/> Administração</button>}
    </div>
  </section>
}
