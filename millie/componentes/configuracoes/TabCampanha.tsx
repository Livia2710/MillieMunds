"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { leaveCampaign, deleteCampaign, archiveCampaign } from "@/app/actions/campaign";
import { ConfigSection, DangerRow } from "./shared";

export default function TabCampanha() {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [feedback, setFeedback] = useState<{ type: 'ok' | 'erro'; msg: string } | null>(null)
    // confirmação de dois cliques para ações destrutivas
    const [confirming, setConfirming] = useState<'arquivar' | 'excluir' | null>(null)
  
    function showFeedback(type: 'ok' | 'erro', msg: string) {
      setFeedback({ type, msg })
      setTimeout(() => setFeedback(null), 4000)
    }
  
    function handleLeave() {
      startTransition(async () => {
        try {
          await leaveCampaign()
          router.push('/')
        } catch (e: any) {
          showFeedback('erro', e.message)
        }
      })
    }
  
    function handleArchive() {
      if (confirming !== 'arquivar') {
        setConfirming('arquivar')
        return
      }
      startTransition(async () => {
        try {
          await archiveCampaign()
          setConfirming(null)
          showFeedback('ok', 'Campanha arquivada.')
          setTimeout(() => router.push('/'), 1500)
        } catch (e: any) {
          setConfirming(null)
          showFeedback('erro', e.message)
        }
      })
    }
  
    function handleDelete() {
      if (confirming !== 'excluir') {
        setConfirming('excluir')
        return
      }
      startTransition(async () => {
        try {
          await deleteCampaign()
          setConfirming(null)
          router.push('/')
        } catch (e: any) {
          setConfirming(null)
          showFeedback('erro', e.message)
        }
      })
    }
  
    return (
      <ConfigSection title="Gerenciar Campanha">
  
        {feedback && (
          <p className={`font-title text-xs uppercase tracking-wider ${
            feedback.type === 'ok' ? 'text-terra' : 'text-red-400'
          }`}>
            {feedback.msg}
          </p>
        )}
  
        {/* Ações não destrutivas */}
        <div className="flex flex-col gap-3 mb-8">
          <DangerRow
            label="Sair da campanha"
            description="Você sai como jogador, mas o personagem e o progresso permanecem salvos pelo Mestre."
            buttonLabel={isPending ? 'Saindo...' : 'Sair'}
            variant="soft"
            onClick={handleLeave}
            disabled={isPending}
          />
          <DangerRow
            label="Transferir liderança"
            description="Passa o papel de Mestre para outro jogador da campanha. Disponível no painel do Mestre."
            buttonLabel="Ir ao painel"
            variant="soft"
            onClick={() => router.push('/mestre')}
            disabled={isPending}
          />
        </div>
  
        {/* Zona de perigo */}
        <div className="border border-red-500/20 p-5">
          <p className="mb-4 font-title text-xs uppercase tracking-[0.18em] text-red-500/60">
            Zona de perigo
          </p>
  
          {confirming && (
            <p className="mb-3 font-title text-[10px] uppercase tracking-widest text-red-400/70">
              Clique novamente para confirmar · clique em outro para cancelar
            </p>
          )}
  
          <div className="flex flex-col gap-3">
            <DangerRow
              label="Arquivar campanha"
              description="A campanha fica oculta mas pode ser restaurada. Todos os dados são preservados."
              buttonLabel={
                isPending && confirming === 'arquivar' ? 'Arquivando...'
                : confirming === 'arquivar' ? 'Confirmar arquivamento?'
                : 'Arquivar'
              }
              variant="danger"
              onClick={handleArchive}
              disabled={isPending}
            />
            <DangerRow
              label="Excluir campanha permanentemente"
              description="Todos os personagens, mundos e inventários serão apagados. Ação irreversível."
              buttonLabel={
                isPending && confirming === 'excluir' ? 'Excluindo...'
                : confirming === 'excluir' ? 'Confirmar exclusão?'
                : 'Excluir'
              }
              variant="critical"
              onClick={handleDelete}
              disabled={isPending}
            />
          </div>
        </div>
      </ConfigSection>
    )
}