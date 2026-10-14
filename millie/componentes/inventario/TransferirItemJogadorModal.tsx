'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { transferPlayerInventoryItem } from '@/app/actions/inventory'
import { useToast } from '@/componentes/ui/ToastProvider'
import MillieModal from '@/componentes/ui/MillieModal'
import MillieSelect from '@/componentes/ui/MillieSelect'
import { PrimaryButton } from '@/componentes/PrimaryButton'
import type { InventoryItem } from '@/lib/types/inventory'

type Target = { id: string; name: string; playerName: string }

export default function TransferirItemJogadorModal({ isOpen, item, items, targets, onClose }: { isOpen: boolean; item: InventoryItem | null; items: InventoryItem[]; targets: Target[]; onClose: () => void }) {
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [targetId, setTargetId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [error, setError] = useState('')
  const [selectedItemId, setSelectedItemId] = useState(item?.id ?? '')
  const selectedItem = items.find(candidate => candidate.id === selectedItemId) ?? item

  function submit() {
    if (!selectedItem || !targetId) {
      setError(!selectedItem ? 'Escolha o item que deseja transferir.' : 'Escolha o personagem que receberá o item.')
      return
    }
    startTransition(async () => {
      try {
        const result = await transferPlayerInventoryItem(selectedItem.id, targetId, selectedItem.category === 'livro' ? selectedItem.quantity : Number(quantity))
        router.refresh()
        toast.success(`${result.itemName} transferido para ${result.targetName}.`)
        onClose()
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : 'Não foi possível transferir o item.'
        setError(message)
        toast.error(message)
      }
    })
  }

  return (
    <MillieModal isOpen={isOpen} onClose={onClose} title="Transferir item">
      <div className="space-y-5">
        <MillieSelect
          label="Item do seu inventário"
          placeholder="Selecione um item"
          options={items.map(candidate => ({ value: candidate.id, label: `${candidate.name} · x${candidate.quantity}` }))}
          value={selectedItem?.id ?? ''}
          onChange={event => { setSelectedItemId(event.target.value); setQuantity('1'); setError('') }}
          disabled={isPending || !items.length}
        />
        {selectedItem && <p className="text-sm text-bege-medio">Transferir <strong className="text-bege-claro">{selectedItem.name}</strong> (x{selectedItem.quantity}) para outro jogador.</p>}
        <MillieSelect
          label="Personagem que receberá"
          placeholder="Selecione um personagem"
          options={targets.map(target => ({ value: target.id, label: `${target.name} · ${target.playerName}` }))}
          value={targetId}
          onChange={event => { setTargetId(event.target.value); setError('') }}
          disabled={isPending || !targets.length}
        />
        {selectedItem && selectedItem.category !== 'livro' && selectedItem.quantity > 1 && <label className="flex flex-col gap-1.5">
          <span className="font-title text-[10px] uppercase tracking-[0.2em] text-bege-escuro">Quantidade</span>
          <input type="number" min={1} max={selectedItem.quantity} value={quantity} onChange={event => setQuantity(event.target.value)} disabled={isPending} className="w-full border border-bege-escuro/40 bg-roxo-escuro/80 px-3 py-2.5 text-sm text-bege-claro" />
        </label>}
        {selectedItem?.category === 'livro' && <p className="text-xs text-bege-escuro/80">Livros são transferidos por inteiro.</p>}
        <p className="text-xs text-bege-escuro/80">A transferência é imediata. Com o mapa ativo, os personagens compartilham a sala atual. Se o inventário de quem recebe estiver cheio, a transferência será bloqueada. O outro jogador receberá uma notificação.</p>
        {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
        {!targets.length && <p className="text-xs text-bege-escuro/80">Não há personagens de outros jogadores ativos nesta campanha.</p>}
        <div className="flex justify-end gap-3 border-t border-bege-escuro/20 pt-4">
          <button type="button" onClick={onClose} disabled={isPending} className="font-title text-xs uppercase tracking-widest text-bege-medio/60 hover:text-bege-claro">Cancelar</button>
          <PrimaryButton onClick={submit} disabled={isPending || !targets.length || !selectedItem}>{isPending ? 'Transferindo…' : 'Transferir'}</PrimaryButton>
        </div>
      </div>
    </MillieModal>
  )
}
