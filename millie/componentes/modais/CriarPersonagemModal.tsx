"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import MillieModal from "@/componentes/ui/MillieModal";
import MillieInput from "@/componentes/ui/MillieInput";
import MillieSelect from "@/componentes/ui/MillieSelect";
import { PrimaryButton } from "@/componentes/PrimaryButton";
import type { CharacterCategory, CharacterElement } from "@/lib/types/character";
import { createCharacter, getUniverses } from "@/app/actions/character";

type Race = { id: string; name: string; element: string }
type UniverseWorld = { id: string; name: string; races: Race[] }
type Universe = { id: string; name: string; worlds: UniverseWorld[] }

const CATEGORY_OPTIONS: { value: CharacterCategory; label: string }[] = [
  { value: "aluno", label: "Aluno" }, { value: "professor", label: "Professor" },
  { value: "npc", label: "NPC" }, { value: "monstro", label: "Monstro" },
]
const DANGER_LEVELS = [
  { value: "Iniciante", label: "Iniciante" }, { value: "Intermediário", label: "Intermediário" },
  { value: "Avançado", label: "Avançado" }, { value: "Calamidade", label: "Calamidade" },
]

type Props = { isOpen: boolean; onClose: () => void }

export default function CriarPersonagemModal({ isOpen, onClose }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [universes, setUniverses] = useState<Universe[]>([])
  const [name, setName] = useState("")
  const [category, setCategory] = useState<CharacterCategory>("aluno")
  const [universeId, setUniverseId] = useState("")
  const [worldId, setWorldId] = useState("")
  const [raceId, setRaceId] = useState("")
  const [element, setElement] = useState("")
  const [year, setYear] = useState("1")
  const [subject, setSubject] = useState("")
  const [occupation, setOccupation] = useState("")
  const [dangerLevel, setDangerLevel] = useState("Iniciante")
  const [error, setError] = useState("")

  useEffect(() => {
    if (isOpen) {
      getUniverses().then((data) => {
        setUniverses(data)
        if (data[0]) {
          setUniverseId(data[0].id)
          if (data[0].worlds[0]) {
            setWorldId(data[0].worlds[0].id)
            if (data[0].worlds[0].races[0]) {
              setRaceId(data[0].worlds[0].races[0].id)
              setElement(data[0].worlds[0].races[0].element)
            }
          }
        }
      })
    }
  }, [isOpen])

  const selectedUniverse = universes.find((u) => u.id === universeId)
  const worlds = selectedUniverse?.worlds ?? []
  const selectedWorld = worlds.find((w) => w.id === worldId)
  const races = selectedWorld?.races ?? []

  useEffect(() => {
    if (worlds[0]) { setWorldId(worlds[0].id) }
  }, [universeId])

  useEffect(() => {
    if (races[0]) { setRaceId(races[0].id); setElement(races[0].element) }
  }, [worldId])

  useEffect(() => {
    const race = races.find((r) => r.id === raceId)
    if (race) setElement(race.element)
  }, [raceId])

  function handleClose() {
    setName(""); setCategory("aluno"); setYear("1")
    setSubject(""); setOccupation(""); setDangerLevel("Iniciante")
    setError(""); onClose()
  }

  function handleSubmit() {
    if (!name.trim()) { setError("Nome é obrigatório."); return }
    if (!raceId) { setError("Selecione uma raça."); return }
    setError("")
    startTransition(async () => {
      try {
        await createCharacter({
          name: name.trim(),
          category,
          raceId,
          element,
          worldSlug: selectedWorld?.name.toLowerCase() ?? "",
          year: category === "aluno" ? Number(year) : undefined,
          subject: category === "professor" ? subject : undefined,
          occupation: category === "npc" ? occupation : undefined,
          dangerLevel: category === "monstro" ? dangerLevel : undefined,
        })
        router.refresh()
        handleClose()
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Erro ao criar personagem.")
      }
    })
  }

  return (
    <MillieModal isOpen={isOpen} onClose={handleClose} title="Criar Personagem" maxWidth="max-w-xl">
      <div className="space-y-4">
        <MillieInput label="Nome" placeholder="Nome do personagem" value={name} onChange={(e) => setName(e.target.value)} />
        <MillieSelect label="Categoria" options={CATEGORY_OPTIONS} value={category} onChange={(e) => setCategory(e.target.value as CharacterCategory)} />

        {universes.length === 0 ? (
          <p className="font-title text-xs text-bege-medio/50 uppercase tracking-widest">
            Nenhum universo cadastrado. Rode o seed primeiro.
          </p>
        ) : (
          <>
            <MillieSelect label="Universo" options={universes.map((u) => ({ value: u.id, label: u.name }))} value={universeId} onChange={(e) => setUniverseId(e.target.value)} />
            <MillieSelect label="Mundo Natal" options={worlds.map((w) => ({ value: w.id, label: w.name }))} value={worldId} onChange={(e) => setWorldId(e.target.value)} />
            <MillieSelect label="Raça" options={races.map((r) => ({ value: r.id, label: r.name }))} value={raceId} onChange={(e) => setRaceId(e.target.value)} />
          </>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="font-title text-[10px] uppercase tracking-[0.2em] text-bege-escuro">Elemento (automático)</label>
          <div className="border border-bege-escuro/20 bg-roxo-escuro/40 px-3 py-2.5">
            <span className="font-body text-sm capitalize text-bege-medio/60">{element || "—"}</span>
          </div>
        </div>

        {category === "aluno" && <MillieSelect label="Ano Letivo" options={[1,2,3,4,5].map((n) => ({ value: String(n), label: `${n}º ano` }))} value={year} onChange={(e) => setYear(e.target.value)} />}
        {category === "professor" && <MillieInput label="Disciplina" placeholder="Ex: Alquimia Avançada" value={subject} onChange={(e) => setSubject(e.target.value)} />}
        {category === "npc" && <MillieInput label="Ocupação" placeholder="Ex: Comerciante, Guardião" value={occupation} onChange={(e) => setOccupation(e.target.value)} />}
        {category === "monstro" && <MillieSelect label="Nível de Perigo" options={DANGER_LEVELS} value={dangerLevel} onChange={(e) => setDangerLevel(e.target.value)} />}

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={handleClose} className="font-title text-xs uppercase tracking-widest text-bege-medio/50 hover:text-bege-claro">Cancelar</button>
          <PrimaryButton onClick={handleSubmit} disabled={isPending}>{isPending ? "Criando..." : "Criar Personagem"}</PrimaryButton>
        </div>
      </div>
    </MillieModal>
  )
}