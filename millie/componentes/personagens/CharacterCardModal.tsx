"use client"

import { useEffect } from "react"
import Image from "next/image"
import { X } from "lucide-react"
import type { Character } from "@/lib/types/character"

const rankLabel: Record<string, string> = { S: "Rank S", A: "Rank A", B: "Rank B", C: "Rank C", D: "Rank D", E: "Rank E", V: "Rank V" }
const elementMeta: Record<string, { label: string; icon: string }> = {
  fogo: { label: "Fogo", icon: "/assets/svgs/elemento/fogo.svg" },
  agua: { label: "Água", icon: "/assets/svgs/elemento/agua.svg" },
  terra: { label: "Terra", icon: "/assets/svgs/elemento/terra.svg" },
  vento: { label: "Vento", icon: "/assets/svgs/elemento/vento.svg" },
  luz: { label: "Luz", icon: "/assets/svgs/elemento/luz.svg" },
  trevas: { label: "Trevas", icon: "/assets/svgs/elemento/trevas.svg" },
}
const categoryLabel: Record<Character["category"], string> = {
  aluno: "Aluno",
  professor: "Professor",
  npc: "NPC",
  monstro: "Monstro",
}

export default function CharacterCardModal({ character, onClose }: { character: Character | null; onClose: () => void }) {
  useEffect(() => {
    if (!character) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose() }
    window.addEventListener("keydown", closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", closeOnEscape)
    }
  }, [character, onClose])

  if (!character) return null
  const element = elementMeta[character.element]

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={`Card de ${character.name}`}>
      <button type="button" className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} aria-label="Fechar card" />
      <article className="relative z-10 grid max-h-[92vh] w-full max-w-3xl animate-[character-card-zoom_320ms_cubic-bezier(0.16,1,0.3,1)] overflow-hidden border border-bege-medio/70 bg-[#1b1020] shadow-[0_0_50px_rgba(216,183,122,.2)] md:grid-cols-[minmax(0,1fr)_300px]">
        <button type="button" onClick={onClose} className="absolute right-3 top-3 z-20 grid h-9 w-9 place-items-center border border-bege-medio/50 bg-roxo-escuro/90 text-bege-claro hover:bg-roxo" aria-label="Fechar card"><X size={18} /></button>
        <div className="relative flex min-h-[44vh] items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_center,#493051,#110b15_72%)] md:min-h-[70vh]">
          {character.image ? <Image src={character.image} alt={character.name} fill sizes="(max-width: 768px) 100vw, 60vw" className="object-contain p-4" priority /> : <span className="font-title text-sm uppercase tracking-widest text-bege-escuro/50">Sem imagem</span>}
          <div className="pointer-events-none absolute inset-3 border border-bege-medio/25" />
        </div>
        <div className="flex min-h-0 flex-col justify-center overflow-y-auto border-t border-bege-escuro/30 p-5 md:border-l md:border-t-0 md:p-7">
          <p className="font-title text-[9px] uppercase tracking-[.25em] text-bege-escuro/60">Registro de personagem</p>
          <h2 className="mt-2 font-title text-2xl uppercase leading-tight tracking-wider text-bege-claro">{character.name}</h2>
          <div className="my-4 h-px bg-gradient-to-r from-bege-medio/70 via-bege-medio/20 to-transparent" />
          <div className="space-y-3">
            <div className="flex items-center gap-3 border-b border-bege-escuro/20 pb-3">
              {element?.icon && <Image src={element.icon} alt="" width={30} height={30} />}
              <div><p className="text-[9px] uppercase tracking-widest text-bege-escuro/55">Elemento</p><p className="font-title text-sm uppercase text-bege-claro">{element?.label ?? character.element}</p></div>
            </div>
            <div className="flex items-center gap-3 border-b border-bege-escuro/20 pb-3">
              <Image src={`/assets/svgs/rank/${character.rank}.svg`} alt="" width={34} height={34} />
              <div><p className="text-[9px] uppercase tracking-widest text-bege-escuro/55">Rank</p><p className="font-title text-sm uppercase text-bege-claro">{rankLabel[character.rank] ?? character.rank}</p></div>
            </div>
            <Info label="Tipo" value={categoryLabel[character.category]} />
            <Info label="Espécie" value={character.race} />
            <Info label="Origem" value={character.worldSlug} />
          </div>
        </div>
      </article>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="border-b border-bege-escuro/20 pb-3"><p className="text-[9px] uppercase tracking-widest text-bege-escuro/55">{label}</p><p className="mt-1 font-title text-sm text-bege-claro">{value}</p></div>
}
