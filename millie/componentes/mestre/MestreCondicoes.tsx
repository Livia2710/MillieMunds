'use client'

import { useState, useTransition } from 'react'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import { addCampaignCondition, deleteCampaignConditionDefinition, saveCampaignConditionDefinition } from '@/app/actions/condition'
import { SectionTitle, Empty } from './MestreUI'
import { useToast } from '@/componentes/ui/ToastProvider'

export type ConditionDefinition = { id: string; name: string; cause: string; color: string; removalInstructions: string }
type TargetCharacter = { id: string; name: string }

export default function MestreCondicoes({ initial, characters, onChange }: { initial: ConditionDefinition[]; characters: TargetCharacter[]; onChange: () => void }) {
  const toast = useToast()
  const definitions = initial
  const [form, setForm] = useState({ id: '', name: '', cause: '', color: '#D8B35E', removalInstructions: '' })
  const [target, setTarget] = useState('')
  const [isPending, startTransition] = useTransition()
  const editing = !!form.id

  function resetForm() { setForm({ id: '', name: '', cause: '', color: '#D8B35E', removalInstructions: '' }) }

  function save() {
    startTransition(async () => {
      try {
        await saveCampaignConditionDefinition(form)
        resetForm()
        onChange()
        toast.success(editing ? 'Condição atualizada.' : 'Condição criada para esta campanha.')
      } catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível salvar a condição.') }
    })
  }

  function remove(id: string) {
    startTransition(async () => {
      try {
        await deleteCampaignConditionDefinition(id)
        if (form.id === id) resetForm()
        onChange()
        toast.success('Condição removida desta campanha.')
      } catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível remover a condição.') }
    })
  }

  function apply(id: string) {
    if (!target) { toast.error('Escolha um personagem primeiro.'); return }
    startTransition(async () => {
      try {
        await addCampaignCondition(target, id)
        onChange()
        toast.success('Condição aplicada.')
      } catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível aplicar a condição.') }
    })
  }

  return (
    <section className="space-y-4">
      <SectionTitle icon={<span className="text-xs">✦</span>} label="Condições da campanha" />
      <p className="text-xs text-bege-escuro/70">Crie estados próprios desta campanha, descreva suas causas e como removê-los, escolha uma cor e aplique-os aos personagens. As instruções são informativas; a remoção continua sendo feita pelo Mestre.</p>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,.8fr)]">
        <div className="space-y-3 border border-bege-escuro/25 p-4">
          <h3 className="font-title text-[10px] uppercase tracking-widest text-bege-medio">{editing ? 'Editar condição' : 'Nova condição'}</h3>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} maxLength={60} placeholder="Nome" className="w-full border border-bege-escuro/30 bg-transparent p-2 text-sm text-bege-claro" />
          <textarea value={form.cause} onChange={e => setForm({ ...form, cause: e.target.value })} maxLength={1000} placeholder="O que causa esta condição?" rows={3} className="w-full border border-bege-escuro/30 bg-transparent p-2 text-sm text-bege-claro" />
          <textarea value={form.removalInstructions} onChange={e => setForm({ ...form, removalInstructions: e.target.value })} maxLength={1000} placeholder="Como o Mestre pode removê-la?" rows={3} className="w-full border border-bege-escuro/30 bg-transparent p-2 text-sm text-bege-claro" />
          <label className="flex items-center gap-3 text-xs text-bege-escuro/80">Cor da condição <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="h-9 w-14 cursor-pointer border border-bege-escuro/30 bg-transparent" /></label>
          <div className="flex gap-2">
            <button type="button" onClick={save} disabled={isPending} className="inline-flex items-center gap-2 border border-bege-medio/50 px-3 py-2 text-[10px] uppercase tracking-widest text-bege-medio disabled:opacity-40"><Check size={13} />{editing ? 'Salvar' : 'Criar condição'}</button>
            {editing && <button type="button" onClick={resetForm} className="inline-flex items-center gap-2 border border-bege-escuro/30 px-3 py-2 text-[10px] uppercase tracking-widest text-bege-escuro"><X size={13} />Cancelar</button>}
          </div>
        </div>

        <div className="space-y-3">
          {characters.length > 0 && <label className="block text-[10px] uppercase tracking-widest text-bege-medio">Aplicar em
            <select value={target} onChange={e => setTarget(e.target.value)} className="mt-2 w-full border border-bege-escuro/30 bg-[#1d1020] p-2 text-sm normal-case text-bege-claro">
              <option value="">Selecione um personagem</option>
              {characters.map(character => <option key={character.id} value={character.id}>{character.name}</option>)}
            </select>
          </label>}
          {!definitions.length ? <Empty label="Nenhuma condição personalizada criada nesta campanha." /> : definitions.map(definition => (
            <article key={definition.id} className="border border-bege-escuro/25 bg-roxo-escuro/30 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="font-title text-xs uppercase tracking-widest" style={{ color: definition.color }}>{definition.name}</h4>
                  <p className="mt-2 text-xs text-bege-claro/80"><strong className="text-bege-medio">Causa:</strong> {definition.cause}</p>
                  <p className="mt-1 text-xs text-bege-claro/80"><strong className="text-bege-medio">Remoção:</strong> {definition.removalInstructions}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button type="button" aria-label={`Editar ${definition.name}`} onClick={() => setForm(definition)} className="border border-bege-escuro/30 p-1.5 text-bege-escuro hover:text-bege-medio"><Pencil size={13} /></button>
                  <button type="button" aria-label={`Excluir ${definition.name}`} onClick={() => remove(definition.id)} disabled={isPending} className="border border-red-400/30 p-1.5 text-red-300"><Trash2 size={13} /></button>
                </div>
              </div>
              <button type="button" onClick={() => apply(definition.id)} disabled={isPending || !characters.length} className="mt-3 border border-bege-escuro/30 px-3 py-1.5 text-[9px] uppercase tracking-widest text-bege-medio hover:border-bege-medio disabled:opacity-40"><Plus size={11} className="mr-1 inline" />Aplicar ao personagem</button>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
