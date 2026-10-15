'use client'

import { useEffect, useState, useTransition } from 'react'
import { Power } from 'lucide-react'
import { getCampaignActivationState, setCampaignActive } from '@/app/actions/campaign'
import { useCampaign } from '@/lib/contexts/CampaignContext'
import { useToast } from '@/componentes/ui/ToastProvider'
import { SectionTitle } from './MestreUI'

export default function MestreCampaignControl({ isActive, playerCount, onChange }: { isActive: boolean; playerCount: number; onChange: () => void }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [state, setState] = useState({ isActive, playerCount })
  const { refreshCampaigns } = useCampaign()
  const toast = useToast()

  useEffect(() => {
    let cancelled = false
    setState({ isActive, playerCount })
    const refresh = () => getCampaignActivationState().then(next => { if (!cancelled && next) setState(next) }).catch(() => {})
    void refresh()
    const timer = setInterval(() => void refresh(), 15_000)
    return () => { cancelled = true; clearInterval(timer) }
  }, [isActive, playerCount])

  function toggle() {
    setError('')
    startTransition(async () => {
      try {
        const next = await setCampaignActive(!state.isActive)
        setState(next)
        await refreshCampaigns()
        onChange()
        toast.success(next.isActive ? 'Campanha ativada. A OrbCampaign ficará visível para os membros.' : 'Campanha desativada. A OrbCampaign desaparecerá para os membros.')
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : 'Não foi possível atualizar a campanha.'
        setError(message)
        toast.error(message)
      }
    })
  }

  return (
    <section className="space-y-3">
      <SectionTitle icon={<Power size={14} />} label="Estado da campanha" />
      <div className="flex flex-wrap items-center gap-4 border border-bege-escuro/30 bg-roxo-escuro/40 p-4">
        <span className={`h-3 w-3 rounded-full ${state.isActive ? 'bg-emerald-400 shadow-[0_0_12px_#34d399]' : 'bg-bege-escuro/50'}`} />
        <div className="min-w-48 flex-1">
          <p className="font-title text-xs uppercase tracking-widest">{state.isActive ? 'Campanha aberta' : 'Campanha fechada'}</p>
          <p className="mt-1 text-xs text-bege-escuro/70">{state.playerCount} jogador(es) associado(s). {state.isActive ? 'A OrbCampaign está disponível para todos.' : 'A OrbCampaign fica oculta até o Mestre ativar.'}</p>
          {state.playerCount === 0 && !state.isActive && <p className="mt-1 text-xs text-amber-200/80">Convide ao menos um jogador para poder ativar.</p>}
        </div>
        <button type="button" disabled={pending || (!state.isActive && state.playerCount === 0)} onClick={toggle} className={`border px-4 py-2 text-xs font-title uppercase tracking-widest transition disabled:cursor-not-allowed disabled:opacity-40 ${state.isActive ? 'border-red-300/40 text-red-200 hover:bg-red-950/30' : 'border-emerald-300/40 text-emerald-200 hover:bg-emerald-950/30'}`}>
          {pending ? 'Salvando…' : state.isActive ? 'Desativar campanha' : 'Ativar campanha'}
        </button>
      </div>
      {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
    </section>
  )
}
