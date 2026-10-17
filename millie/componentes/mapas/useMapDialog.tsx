'use client'

import { useCallback, useRef, useState } from 'react'
import MillieModal from '@/componentes/ui/MillieModal'
import { PrimaryButton } from '@/componentes/PrimaryButton'

type Choice = { value: string; label: string }
type DialogState = {
  mode: 'confirm' | 'prompt' | 'choice'
  title: string
  message: string
  confirmLabel?: string
  placeholder?: string
  choices?: Choice[]
}
type DialogResult = boolean | string | null

/** Use for map flows instead of browser-native alert, confirm, or prompt dialogs. */
export function useMapDialog() {
  const [state, setState] = useState<DialogState | null>(null)
  const [input, setInput] = useState('')
  const resolveRef = useRef<((result: DialogResult) => void) | null>(null)

  const open = useCallback((dialog: DialogState) => new Promise<DialogResult>(resolve => {
    resolveRef.current = resolve
    setInput('')
    setState(dialog)
  }), [])

  const finish = useCallback((result: DialogResult) => {
    const resolve = resolveRef.current
    resolveRef.current = null
    setState(null)
    resolve?.(result)
  }, [])

  const confirm = useCallback(async (title: string, message: string, confirmLabel = 'Confirmar') =>
    (await open({ mode: 'confirm', title, message, confirmLabel })) === true, [open])
  const prompt = useCallback(async (title: string, message: string, placeholder = '') => {
    const result = await open({ mode: 'prompt', title, message, placeholder })
    return typeof result === 'string' ? result : null
  }, [open])
  const choose = useCallback(async (title: string, message: string, choices: Choice[]) => {
    const result = await open({ mode: 'choice', title, message, choices })
    return typeof result === 'string' ? result : null
  }, [open])

  const dialog = <MillieModal isOpen={state !== null} onClose={() => finish(null)} title={state?.title ?? 'Confirmação'} maxWidth="max-w-md">
    {state && <div className="space-y-5">
      <p className="text-sm leading-relaxed text-bege-claro/75">{state.message}</p>
      {state.mode === 'prompt' && <input autoFocus value={input} onChange={event => setInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') finish(input) }} placeholder={state.placeholder} className="w-full border border-bege-escuro/40 bg-[#1d1020] px-3 py-2 text-sm text-bege-claro outline-none focus:border-bege-medio" />}
      <div className="flex flex-wrap justify-end gap-3">
        <button type="button" onClick={() => finish(null)} className="px-3 py-2 font-title text-xs uppercase tracking-widest text-bege-medio/70 hover:text-bege-claro">Cancelar</button>
        {state.mode === 'choice' ? state.choices?.map(choice => <PrimaryButton key={choice.value} className="h-11 max-w-none px-4 text-xs tracking-widest" onClick={() => finish(choice.value)}>{choice.label}</PrimaryButton>) : <PrimaryButton className="h-11 max-w-none px-4 text-xs tracking-widest" onClick={() => finish(state.mode === 'confirm' ? true : input)}>{state.mode === 'confirm' ? state.confirmLabel : 'Continuar'}</PrimaryButton>}
      </div>
    </div>}
  </MillieModal>

  return { confirm, prompt, choose, dialog }
}
