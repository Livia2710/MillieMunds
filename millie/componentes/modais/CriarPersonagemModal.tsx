"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import MillieModal from "@/componentes/ui/MillieModal";
import MillieInput from "@/componentes/ui/MillieInput";
import MillieSelect from "@/componentes/ui/MillieSelect";
import { PrimaryButton } from "@/componentes/PrimaryButton";
import type { CharacterCategory } from "@/lib/types/character";
import type { BaseRank } from "@/lib/generated/prisma";
import { createCharacter, getUniverses } from "@/app/actions/character";
import MillieImageUpload from "../ui/MillieImageUpload";
import { getRankMin, getRankMax, getTotalPoints, calcPV, calcPM } from "@/lib/utils/rank";

// ─── tipos locais ──────────────────────────────────────────
type Race = { id: string; name: string; element: string; baseRank: string }
type UniverseWorld = { id: string; name: string; races: Race[] }
type Universe = { id: string; name: string; worlds: UniverseWorld[] }

const CATEGORY_OPTIONS: { value: CharacterCategory; label: string }[] = [
  { value: "aluno",     label: "Aluno"     },
  { value: "professor", label: "Professor" },
  { value: "npc",       label: "NPC"       },
  { value: "monstro",   label: "Monstro"   },
]

const DANGER_LEVELS = [
  { value: "Iniciante",     label: "Iniciante"     },
  { value: "Intermediário", label: "Intermediário" },
  { value: "Avançado",      label: "Avançado"      },
  { value: "Calamidade",    label: "Calamidade"    },
]

const ATTR_LABELS: Record<string, string> = {
  agilidade:    "Agilidade",
  inteligencia: "Inteligência",
  forca:        "Força",
  vigor:        "Vigor",
  sorte:        "Sorte",
}
const ATTR_KEYS = ["agilidade", "inteligencia", "forca", "vigor", "sorte"] as const
type AttrKey = typeof ATTR_KEYS[number]
type Attributes = Record<AttrKey, number>

type Props = { isOpen: boolean; onClose: () => void }

export default function CriarPersonagemModal({ isOpen, onClose }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [universes, setUniverses] = useState<Universe[]>([])

  // seleções
  const [name, setName] = useState("")
  const [category, setCategory] = useState<CharacterCategory>("aluno")
  const [universeId, setUniverseId] = useState("")
  const [worldId, setWorldId] = useState("")
  const [raceId, setRaceId] = useState("")
  const [element, setElement] = useState("")
  const [baseRank, setBaseRank] = useState("D")
  const [year, setYear] = useState("1")
  const [subject, setSubject] = useState("")
  const [occupation, setOccupation] = useState("")
  const [image, setImage] = useState("")
  const [dangerLevel, setDangerLevel] = useState("Iniciante")
  const [error, setError] = useState("")

  // atributos
  const [attrs, setAttrs] = useState<Attributes>({
    agilidade: 1, inteligencia: 1, forca: 1, vigor: 1, sorte: 1,
  })

  // ─── carrega universos ao abrir ──────────────────────────
  useEffect(() => {
    if (!isOpen) return
    getUniverses().then((data) => {
      setUniverses(data)
      const u = data[0]
      if (!u) return
      setUniverseId(u.id)
      const w = u.worlds[0]
      if (!w) return
      setWorldId(w.id)
      const r = w.races[0]
      if (!r) return
      setRaceId(r.id)
      setElement(r.element)
      setBaseRank(r.baseRank)
    })
  }, [isOpen])

  const selectedUniverse = universes.find((u) => u.id === universeId)
  const worlds = selectedUniverse?.worlds ?? []
  const selectedWorld = worlds.find((w) => w.id === worldId)
  const races = selectedWorld?.races ?? []

  useEffect(() => { if (worlds[0]) setWorldId(worlds[0].id) }, [universeId])

  useEffect(() => {
    if (races[0]) {
      setRaceId(races[0].id)
      setElement(races[0].element)
      setBaseRank(races[0].baseRank)
    }
  }, [worldId])

  useEffect(() => {
    const race = races.find((r) => r.id === raceId)
    if (race) {
      setElement(race.element)
      setBaseRank(race.baseRank)
    }
  }, [raceId])

  // quando muda o rank, reseta atributos para o mínimo
  useEffect(() => {
    const min = getRankMin(baseRank)
    setAttrs({ agilidade: min, inteligencia: min, forca: min, vigor: min, sorte: min })
  }, [baseRank])

  // ─── lógica de pontos ────────────────────────────────────
  const rankMin = getRankMin(baseRank)
  const rankMax = getRankMax(baseRank)
  const totalPoints = getTotalPoints(baseRank)
  const usedPoints = ATTR_KEYS.reduce((acc, k) => acc + attrs[k], 0)
  const remainingPoints = totalPoints - usedPoints

  function handleAttrChange(key: AttrKey, raw: string) {
    const val = parseInt(raw) || rankMin
    const clamped = Math.max(rankMin, Math.min(rankMax, val))
    const otherSum = ATTR_KEYS.filter((k) => k !== key).reduce((s, k) => s + attrs[k], 0)
    const maxAllowed = Math.min(clamped, totalPoints - otherSum)
    setAttrs((prev) => ({ ...prev, [key]: Math.max(rankMin, maxAllowed) }))
  }

  // ─── PV e PM calculados ──────────────────────────────────
  const pv = calcPV(attrs.vigor)
  const pm = calcPM(attrs.inteligencia)

  // ─── reset ao fechar ─────────────────────────────────────
  function handleClose() {
    setName(""); setCategory("aluno"); setYear("1")
    setSubject(""); setOccupation(""); setDangerLevel("Iniciante")
    setImage(""); setError("")
    onClose()
  }

  // ─── submit ──────────────────────────────────────────────
  function handleSubmit() {
    if (!name.trim()) { setError("Nome é obrigatório."); return }
    if (!raceId) { setError("Selecione uma raça."); return }
    if (remainingPoints !== 0) { setError("Distribua todos os pontos antes de continuar."); return }
    setError("")

    startTransition(async () => {
      try {
        await createCharacter({
          name: name.trim(),
          category,
          raceId,
          element,
          worldSlug: selectedWorld?.name.toLowerCase() ?? "",
          year:        category === "aluno"     ? Number(year) : undefined,
          subject:     category === "professor" ? subject      : undefined,
          occupation:  category === "npc"       ? occupation   : undefined,
          dangerLevel: category === "monstro"   ? dangerLevel  : undefined,
          image:       image || undefined,
          birthRank:   baseRank as BaseRank,
          ...attrs,
        })
        router.refresh()
        handleClose()
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Erro ao criar personagem.")
      }
    })
  }

  // ─── render ──────────────────────────────────────────────
  return (
    <MillieModal isOpen={isOpen} onClose={handleClose} title="Criar Personagem" maxWidth="max-w-xl">
      <div className="space-y-4">

        {/* Nome */}
        <MillieInput
          label="Nome"
          placeholder="Nome do personagem"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {/* Categoria */}
        <MillieSelect
          label="Categoria"
          options={CATEGORY_OPTIONS}
          value={category}
          onChange={(e) => setCategory(e.target.value as CharacterCategory)}
        />

        {/* Universo / Mundo / Raça */}
        {universes.length === 0 ? (
          <p className="font-title text-xs text-bege-medio/50 uppercase tracking-widest">
            Nenhum universo cadastrado. Rode o seed primeiro.
          </p>
        ) : (
          <>
            <MillieSelect
              label="Universo"
              options={universes.map((u) => ({ value: u.id, label: u.name }))}
              value={universeId}
              onChange={(e) => setUniverseId(e.target.value)}
            />
            <MillieSelect
              label="Mundo Natal"
              options={worlds.map((w) => ({ value: w.id, label: w.name }))}
              value={worldId}
              onChange={(e) => setWorldId(e.target.value)}
            />
            <MillieSelect
              label="Raça"
              options={races.map((r) => ({ value: r.id, label: r.name }))}
              value={raceId}
              onChange={(e) => setRaceId(e.target.value)}
            />
          </>
        )}

        {/* Elemento + Rank (readonly) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="font-title text-[10px] uppercase tracking-[0.2em] text-bege-escuro">
              Elemento
            </label>
            <div className="border border-bege-escuro/20 bg-roxo-escuro/40 px-3 py-2.5">
              <span className="font-title text-xs capitalize text-bege-medio/60">{element || "—"}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-title text-[10px] uppercase tracking-[0.2em] text-bege-escuro">
              Rank de Nascença
            </label>
            <div className="border border-bege-escuro/20 bg-roxo-escuro/40 px-3 py-2.5 flex items-center justify-between">
              <span className="font-title text-xs text-bege-medio">{baseRank}</span>
              <span className="font-title text-[10px] text-bege-escuro/50">
                {getRankMin(baseRank)} – {getRankMax(baseRank)}
              </span>
            </div>
          </div>
        </div>

        {/* Campo específico por categoria */}
        {category === "aluno" && (
          <MillieSelect
            label="Ano Letivo"
            options={[1,2,3,4,5].map((n) => ({ value: String(n), label: `${n}º ano` }))}
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
        )}
        {category === "professor" && (
          <MillieInput
            label="Disciplina"
            placeholder="Ex: Alquimia Avançada"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        )}
        {category === "npc" && (
          <MillieInput
            label="Ocupação"
            placeholder="Ex: Comerciante, Guardião"
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
          />
        )}
        {category === "monstro" && (
          <MillieSelect
            label="Nível de Perigo"
            options={DANGER_LEVELS}
            value={dangerLevel}
            onChange={(e) => setDangerLevel(e.target.value)}
          />
        )}

        {/* ── ATRIBUTOS ── */}
        <div className="pt-2 border-t border-bege-escuro/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-title text-[10px] uppercase tracking-widest text-bege-escuro/70">
              Distribuição de Atributos
            </span>
            <span className={`font-title text-[10px] uppercase tracking-widest ${remainingPoints < 0 ? "text-red-400" : "text-bege-medio"}`}>
              {remainingPoints} / {totalPoints} pts
            </span>
          </div>

          {ATTR_KEYS.map((key) => (
            <div key={key} className="flex items-center gap-3">
              <span className="font-title text-[10px] uppercase tracking-widest text-bege-escuro/70 w-24 shrink-0">
                {ATTR_LABELS[key]}
              </span>
              <input
                type="number"
                min={rankMin}
                max={rankMax}
                value={attrs[key]}
                onChange={(e) => handleAttrChange(key, e.target.value)}
                className="w-20 bg-roxo-escuro/40 border border-bege-escuro/30 p-1.5 text-xs text-bege-claro font-title outline-none focus:border-bege-medio text-center"
              />
              <div className="flex-1 h-0.5 bg-bege-escuro/10 relative">
                <div
                  className="absolute inset-y-0 left-0 bg-bege-escuro/40 transition-all"
                  style={{ width: `${((attrs[key] - rankMin) / (rankMax - rankMin || 1)) * 100}%` }}
                />
              </div>
              <span className="font-title text-[10px] text-bege-escuro/40 w-8 text-right">{rankMax}</span>
            </div>
          ))}

          {/* PV e PM */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-bege-escuro/20">
            <div className="bg-roxo-escuro/30 border border-bege-escuro/20 p-3 text-center">
              <div className="font-title text-[10px] text-bege-escuro/60 uppercase tracking-widest mb-1">Pontos de Vida</div>
              <div className="font-title text-xl text-bege-medio">{pv}</div>
              <div className="font-title text-[10px] text-bege-escuro/40">10 + (Vigor {attrs.vigor} × 2)</div>
            </div>
            <div className="bg-roxo-escuro/30 border border-bege-escuro/20 p-3 text-center">
              <div className="font-title text-[10px] text-bege-escuro/60 uppercase tracking-widest mb-1">Pontos de Mana</div>
              <div className="font-title text-xl text-bege-medio">{pm}</div>
              <div className="font-title text-[10px] text-bege-escuro/40">10 + (Int {attrs.inteligencia} × 2)</div>
            </div>
          </div>
        </div>

        {/* Imagem */}
        <MillieImageUpload
          label="Imagem (opcional)"
          value={image}
          onChange={setImage}
          aspectRatio="portrait"
        />

        {error && <p className="text-xs text-red-500">{error}</p>}

        {/* Ações */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={handleClose}
            className="font-title text-xs uppercase tracking-widest text-bege-medio/50 hover:text-bege-claro"
          >
            Cancelar
          </button>
          <PrimaryButton
            onClick={handleSubmit}
            disabled={isPending || remainingPoints !== 0}
          >
            {isPending ? "Criando..." : "Criar Personagem"}
          </PrimaryButton>
        </div>

      </div>
    </MillieModal>
  )
}
