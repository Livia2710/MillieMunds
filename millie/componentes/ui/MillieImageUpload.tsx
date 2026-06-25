"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { Upload, X } from "lucide-react"

type Props = {
  label?: string
  value?: string
  onChange: (url: string) => void
  onClear?: () => void
  aspectRatio?: "square" | "portrait" | "card"
}

export default function MillieImageUpload({
  label = "Imagem",
  value,
  onChange,
  onClear,
  aspectRatio = "square",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  const aspectClass = {
    square: "aspect-square",
    portrait: "aspect-[3/4]",
    card: "aspect-[11/15]",
  }[aspectRatio]

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Apenas imagens são aceitas.")
      return
    }
    if (file.size > 4 * 1024 * 1024) {
      setError("Tamanho máximo: 4MB.")
      return
    }

    setError("")
    setUploading(true)

    try {
      const form = new FormData()
      form.append("file", file)

      const res = await fetch("/api/upload", { method: "POST", body: form })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error ?? "Erro no upload")
      onChange(data.url)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro no upload.")
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="font-title text-[10px] uppercase tracking-[0.2em] text-bege-escuro">
          {label}
        </label>
      )}

      {value ? (
        <div className={`relative w-full ${aspectClass} border border-bege-escuro/40 overflow-hidden`}>
          <Image src={value} alt="Preview" fill className="object-cover" />
          <button
            type="button"
            onClick={() => { onChange(""); onClear?.() }}
            className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center bg-roxo-escuro/80 border border-bege-escuro/40 text-bege-medio hover:text-bege-claro transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className={`relative w-full ${aspectClass} flex flex-col items-center justify-center gap-2 border border-dashed border-bege-escuro/40 bg-roxo-escuro/20 cursor-pointer hover:border-bege-medio/60 hover:bg-roxo-escuro/30 transition-all`}
        >
          {uploading ? (
            <p className="font-title text-[10px] uppercase tracking-widest text-bege-escuro/50 animate-pulse">
              Enviando...
            </p>
          ) : (
            <>
              <Upload size={20} strokeWidth={1.5} className="text-bege-escuro/40" />
              <p className="font-title text-[10px] uppercase tracking-widest text-bege-escuro/40 text-center px-4">
                Clique ou arraste uma imagem
              </p>
              <p className="font-mono text-[9px] text-bege-escuro/30">PNG, JPG, WEBP — máx 4MB</p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}