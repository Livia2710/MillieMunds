"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { leaveCampaign, deleteArchivedCampaign, archiveCampaign, getArchivedCampaigns, restoreArchivedCampaign } from "@/app/actions/campaign";
import { useToast } from "@/componentes/ui/ToastProvider";
import { ConfigSection, DangerRow } from "./shared";
import { useCampaign } from "@/lib/contexts/CampaignContext";

export default function TabCampanha() {
    const router = useRouter()
    const toast = useToast()
    const { refreshCampaigns } = useCampaign()
    const [isPending, startTransition] = useTransition()
    // confirmação de dois cliques para ações destrutivas
    const [confirming, setConfirming] = useState<'arquivar' | string | null>(null)
    const [archivedCampaigns, setArchivedCampaigns] = useState<{ id: string; name: string }[]>([])

    useEffect(() => {
      getArchivedCampaigns().then(setArchivedCampaigns).catch(() => setArchivedCampaigns([]))
    }, [])
  
    function handleLeave() {
      startTransition(async () => {
        try {
          await leaveCampaign()
          toast.success('Você saiu da campanha.')
          router.push('/')
        } catch (e: any) {
          toast.error(e instanceof Error ? e.message : 'Não foi possível sair da campanha.')
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
          toast.success('Campanha arquivada. Você poderá restaurá-la depois.')
          setTimeout(() => router.push('/'), 1500)
        } catch (e: any) {
          setConfirming(null)
          toast.error(e instanceof Error ? e.message : 'Não foi possível arquivar a campanha.')
        }
      })
    }
  
    function handleDelete(campaignId: string) {
      if (confirming !== campaignId) {
        setConfirming(campaignId)
        return
      }
      startTransition(async () => {
        try {
          await deleteArchivedCampaign(campaignId)
          setArchivedCampaigns((campaigns) => campaigns.filter((campaign) => campaign.id !== campaignId))
          setConfirming(null)
          toast.success('Campanha excluída permanentemente.')
        } catch (e: any) {
          setConfirming(null)
          toast.error(e instanceof Error ? e.message : 'Não foi possível excluir a campanha.')
        }
      })
    }

    function handleRestore(campaignId: string) {
      startTransition(async () => {
        try {
          await restoreArchivedCampaign(campaignId)
          await refreshCampaigns()
          setArchivedCampaigns((campaigns) => campaigns.filter((campaign) => campaign.id !== campaignId))
          setConfirming(null)
          toast.success('Campanha restaurada. O Mestre voltou a ser membro ativo.')
          router.refresh()
        } catch (e: unknown) {
          toast.error(e instanceof Error ? e.message : 'Não foi possível restaurar a campanha.')
        }
      })
    }
  
    return (
      <ConfigSection title="Gerenciar Campanha">
  
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
              description="A campanha fica arquivada e os dados são preservados. Você pode restaurá-la ou excluí-la permanentemente depois."
              buttonLabel={
                isPending && confirming === 'arquivar' ? 'Arquivando...'
                : confirming === 'arquivar' ? 'Confirmar arquivamento?'
                : 'Arquivar'
              }
              variant="danger"
              onClick={handleArchive}
              disabled={isPending}
            />
          </div>
        </div>

        {archivedCampaigns.length > 0 && (
          <div className="mt-8 border border-red-500/20 p-5">
            <p className="mb-4 font-title text-xs uppercase tracking-[0.18em] text-red-500/60">
              Campanhas arquivadas
            </p>
            <p className="mb-4 text-xs text-roxo/60">
              A exclusão apaga permanentemente personagens, mundos e inventários. Esta ação não pode ser desfeita.
            </p>
            <div className="flex flex-col gap-3">
              {archivedCampaigns.map((campaign) => (
                <div key={campaign.id} className="border-b border-bege-escuro/10 pb-4 last:border-b-0">
                  <DangerRow
                    label={campaign.name}
                    description="Restaurar a campanha para o Mestre. Jogadores poderão selecioná-la em Minhas Crônicas."
                    buttonLabel={isPending ? 'Restaurando...' : 'Restaurar'}
                    variant="soft"
                    onClick={() => handleRestore(campaign.id)}
                    disabled={isPending}
                  />
                  <DangerRow
                    label="Excluir permanentemente"
                    description="Apaga personagens, mundos e inventários. Esta ação não pode ser desfeita."
                    buttonLabel={
                      isPending && confirming === campaign.id ? 'Excluindo...'
                      : confirming === campaign.id ? 'Confirmar exclusão?'
                      : 'Excluir'
                    }
                    variant="critical"
                    onClick={() => handleDelete(campaign.id)}
                    disabled={isPending}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </ConfigSection>
    )
}
