import { Scroll } from 'lucide-react'
import { SectionTitle, Empty } from './MestreUI'

type TarotDraw = {
  id: string
  readingType: string
  question: string
  cards: string[]
  sacrifice: string
  sacrificeIsPermanent: boolean
  hadJoker: boolean
  drawnAt: Date
  characterName: string
}

const CARD_LABELS: Record<string, string> = {
  as: 'Ás', '2': '2', '3': '3', '4': '4', '5': '5',
  '6': '6', '7': '7', '8': '8', '9': '9', '10': '10',
  valete: 'Valete', cavaleiro: 'Cavaleiro', rainha: 'Rainha',
  rei: 'Rei', coringa: 'Coringa',
}

export default function MestreTaro({ draws }: { draws: TarotDraw[] }) {
  return (
    <section className="space-y-3">
      <SectionTitle icon={<Scroll size={14} />} label="Leituras de Tarô" />

      {draws.length === 0 ? (
        <Empty label="Nenhuma leitura registrada nesta campanha." />
      ) : (
        <div className="space-y-3">
          {draws.map((draw) => (
            <div key={draw.id} className="p-4 bg-roxo-escuro/40 border border-bege-escuro/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-title uppercase tracking-widest text-bege-escuro/60">
                  {draw.characterName} · {draw.readingType === 'COMUM' ? 'Leitura Comum' : 'Leitura Profunda'}
                </span>
                <span className="text-[10px] text-bege-escuro/40">
                  {new Date(draw.drawnAt).toLocaleDateString('pt-BR')}
                </span>
              </div>

              <p className="text-sm text-bege-claro italic">"{draw.question}"</p>

              <div className="flex flex-wrap gap-1.5">
                {draw.cards.map((card, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 border border-bege-escuro/30 bg-roxo-escuro/60 text-bege-escuro font-mono uppercase">
                    {CARD_LABELS[card] ?? card}
                  </span>
                ))}
                {draw.hadJoker && (
                  <span className="text-[10px] px-2 py-0.5 border border-purple-400/40 bg-purple-400/10 text-purple-400 font-mono uppercase">
                    Coringa
                  </span>
                )}
              </div>

              {draw.sacrifice && (
                <p className="text-xs text-bege-escuro/60">
                  <span className="font-title uppercase tracking-widest text-[9px]">Sacrifício: </span>
                  {draw.sacrifice}
                  {draw.sacrificeIsPermanent && (
                    <span className="ml-2 text-red-400 text-[9px] uppercase tracking-widest font-title">(permanente)</span>
                  )}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}