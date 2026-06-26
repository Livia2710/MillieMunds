'use client'

import { useState } from 'react'
import { Copy, Check, Star } from 'lucide-react'
import { SectionTitle } from './MestreUI'

export default function MestreInvite({ inviteCode }: { inviteCode: string }) {
  const [copied, setCopied] = useState(false)

  function copyInvite() {
    navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="space-y-3">
      <SectionTitle icon={<Star size={14} />} label="Código de Convite" />
      <div className="flex items-center gap-3 p-4 bg-roxo-escuro/40 border border-bege-escuro/30">
        <span className="font-mono text-sm text-bege-claro tracking-widest flex-1 select-all">
          {inviteCode}
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
  )
}