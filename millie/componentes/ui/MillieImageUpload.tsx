"use client"

/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react"
import Image from "next/image"
import { Upload, X, ZoomIn } from "lucide-react"

type PortraitCrop = {
  value?: string
  onChange: (url: string) => void
  shape?: "circle" | "rectangle"
}

type Props = {
  label?: string
  value?: string
  onChange: (url: string) => void
  onClear?: () => void
  onUploadingChange?: (uploading: boolean) => void
  disabled?: boolean
  aspectRatio?: "square" | "portrait" | "card"
  portraitCrop?: PortraitCrop
}

const CROP_SIZE = 320

export default function MillieImageUpload({
  label = "Imagem",
  value,
  onChange,
  onClear,
  onUploadingChange,
  disabled = false,
  aspectRatio = "square",
  portraitCrop,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const dragRef = useRef<{ pointerX: number; pointerY: number; x: number; y: number } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [cropFile, setCropFile] = useState<File | null>(null)
  const [cropUrl, setCropUrl] = useState("")
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 })
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  const aspectClass = {
    square: "aspect-square",
    portrait: "aspect-[3/4]",
    card: "aspect-[11/15]",
  }[aspectRatio]

  const fitScale = naturalSize.width && naturalSize.height
    ? Math.max(CROP_SIZE / naturalSize.width, CROP_SIZE / naturalSize.height)
    : 1
  const drawnWidth = naturalSize.width * fitScale * zoom
  const drawnHeight = naturalSize.height * fitScale * zoom

  function clampOffset(x: number, y: number, scale = zoom) {
    const width = naturalSize.width * fitScale * scale
    const height = naturalSize.height * fitScale * scale
    return {
      x: Math.max(CROP_SIZE - width, Math.min(0, x)),
      y: Math.max(CROP_SIZE - height, Math.min(0, y)),
    }
  }

  function closeCrop() {
    if (cropUrl) URL.revokeObjectURL(cropUrl)
    setCropUrl("")
    setCropFile(null)
    setNaturalSize({ width: 0, height: 0 })
  }

  async function uploadFile(file: File) {
    const form = new FormData()
    form.append("file", file)
    const response = await fetch("/api/upload", { method: "POST", body: form })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error ?? "Erro no upload")
    return data.url as string
  }

  async function handleFile(file: File) {
    if (disabled || uploading) return
    if (!file.type.startsWith("image/")) {
      setError("Apenas imagens são aceitas.")
      return
    }
    if (file.size > 4 * 1024 * 1024) {
      setError("Tamanho máximo: 4MB.")
      return
    }

    setError("")
    if (portraitCrop) {
      if (cropUrl) URL.revokeObjectURL(cropUrl)
      const localUrl = URL.createObjectURL(file)
      setCropFile(file)
      setCropUrl(localUrl)
      setZoom(1)
      setNaturalSize({ width: 0, height: 0 })
      return
    }

    setUploading(true)
    onUploadingChange?.(true)
    try {
      onChange(await uploadFile(file))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro no upload.")
    } finally {
      setUploading(false)
      onUploadingChange?.(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) void handleFile(file)
  }

  function handleImageLoad(image: HTMLImageElement) {
    const width = image.naturalWidth
    const height = image.naturalHeight
    const baseScale = Math.max(CROP_SIZE / width, CROP_SIZE / height)
    setNaturalSize({ width, height })
    setOffset({
      x: (CROP_SIZE - width * baseScale) / 2,
      y: (CROP_SIZE - height * baseScale) / 2,
    })
  }

  function handleZoom(nextZoom: number) {
    const factor = nextZoom / zoom
    const next = clampOffset(
      CROP_SIZE / 2 - (CROP_SIZE / 2 - offset.x) * factor,
      CROP_SIZE / 2 - (CROP_SIZE / 2 - offset.y) * factor,
      nextZoom,
    )
    setZoom(nextZoom)
    setOffset(next)
  }

  async function handleConfirmCrop() {
    if (!cropFile || !cropUrl || !naturalSize.width || !naturalSize.height) return
    setError("")
    setUploading(true)
    onUploadingChange?.(true)
    try {
      const image = new window.Image()
      image.src = cropUrl
      await image.decode()
      const scale = fitScale * zoom
      const sourceX = Math.max(0, Math.min(naturalSize.width - CROP_SIZE / scale, -offset.x / scale))
      const sourceY = Math.max(0, Math.min(naturalSize.height - CROP_SIZE / scale, -offset.y / scale))
      const sourceSize = Math.min(naturalSize.width - sourceX, naturalSize.height - sourceY, CROP_SIZE / scale)
      const canvas = document.createElement("canvas")
      canvas.width = 768
      canvas.height = 768
      const context = canvas.getContext("2d")
      if (!context) throw new Error("Não foi possível preparar o recorte.")
      context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => result ? resolve(result) : reject(new Error("Falha ao gerar o recorte.")), "image/webp", 0.9)
      })
      const croppedFile = new File([blob], `${cropFile.name.replace(/\.[^.]+$/, "")}-retrato.webp`, { type: "image/webp" })
      const [originalUrl, portraitUrl] = await Promise.all([uploadFile(cropFile), uploadFile(croppedFile)])
      onChange(originalUrl)
      portraitCrop?.onChange(portraitUrl)
      closeCrop()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao enviar as imagens.")
    } finally {
      setUploading(false)
      onUploadingChange?.(false)
    }
  }

  function clearImages() {
    onChange("")
    portraitCrop?.onChange("")
    onClear?.()
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="font-title text-[10px] uppercase tracking-[0.2em] text-bege-escuro">{label}</label>}

      {value ? (
        <div className={`relative w-full ${aspectClass} overflow-hidden border border-bege-escuro/40`}>
          <Image src={value} alt="Imagem enviada" fill className={portraitCrop ? "object-contain" : "object-cover"} />
          {portraitCrop?.value && (
            <div className="absolute bottom-2 left-2 h-12 w-12 overflow-hidden rounded-full border border-bege-medio bg-roxo-escuro">
              <Image src={portraitCrop.value} alt="Prévia do retrato recortado" fill className="object-cover" />
            </div>
          )}
          <button type="button" disabled={disabled || uploading} onClick={clearImages} className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center border border-bege-escuro/40 bg-roxo-escuro/80 text-bege-medio transition-colors hover:text-bege-claro disabled:opacity-40" aria-label="Remover imagem">
            <X size={14} />
          </button>
          {portraitCrop && (
            <button type="button" disabled={disabled || uploading} onClick={() => inputRef.current?.click()} className="absolute bottom-2 right-2 flex items-center gap-1 border border-bege-escuro/40 bg-roxo-escuro/90 px-2 py-1 text-[9px] uppercase text-bege-medio disabled:opacity-40">
              <Upload size={12} /> Trocar imagem
            </button>
          )}
        </div>
      ) : (
        <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} onClick={() => !disabled && !uploading && inputRef.current?.click()} aria-disabled={disabled || uploading} className={`relative flex w-full ${aspectClass} cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-bege-escuro/40 bg-roxo-escuro/20 transition-all hover:border-bege-medio/60 hover:bg-roxo-escuro/30 ${disabled || uploading ? "cursor-not-allowed opacity-50" : ""}`}>
          {uploading ? <p className="animate-pulse font-title text-[10px] uppercase tracking-widest text-bege-escuro/50">Enviando...</p> : <>
            <Upload size={20} strokeWidth={1.5} className="text-bege-escuro/40" />
            <p className="px-4 text-center font-title text-[10px] uppercase tracking-widest text-bege-escuro/40">Clique ou arraste uma imagem</p>
            <p className="font-mono text-[9px] text-bege-escuro/30">PNG, JPG, WEBP — máx 4MB</p>
          </>}
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={disabled || uploading} onChange={(e) => { const file = e.target.files?.[0]; if (file) void handleFile(file); e.currentTarget.value = "" }} />
      {portraitCrop && <p className="text-[9px] text-bege-escuro/50">A imagem original será mantida; o recorte será usado em retratos e cards.</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}

      {cropUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Ajustar recorte do retrato">
          <button type="button" aria-label="Fechar recorte" onClick={closeCrop} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-md border border-bege-escuro/50 bg-roxo-escuro p-5 shadow-header">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-title text-sm uppercase tracking-widest text-bege-medio">Ajustar retrato</h2>
              <button type="button" onClick={closeCrop} className="text-bege-medio" aria-label="Fechar"><X size={18} /></button>
            </div>
            <p className="mb-3 text-xs text-bege-escuro/70">Arraste a imagem para enquadrar o rosto ou busto e ajuste o zoom.</p>
            <div className={`relative mx-auto h-80 w-80 max-w-full touch-none overflow-hidden border border-bege-medio/70 bg-black ${portraitCrop?.shape === "circle" ? "rounded-full" : "rounded-sm"}`} onPointerDown={(e) => { dragRef.current = { pointerX: e.clientX, pointerY: e.clientY, x: offset.x, y: offset.y }; e.currentTarget.setPointerCapture(e.pointerId) }} onPointerMove={(e) => { if (!dragRef.current) return; const drag = dragRef.current; setOffset(clampOffset(drag.x + e.clientX - drag.pointerX, drag.y + e.clientY - drag.pointerY)) }} onPointerUp={() => { dragRef.current = null }} onPointerCancel={() => { dragRef.current = null }}>
              <img src={cropUrl} alt="Prévia para recorte" draggable={false} onLoad={(e) => handleImageLoad(e.currentTarget)} className="pointer-events-none absolute max-w-none select-none" style={{ left: offset.x, top: offset.y, width: drawnWidth, height: drawnHeight }} />
            </div>
            <label className="mt-4 flex items-center gap-3 text-xs text-bege-escuro/70"><ZoomIn size={15} /><span className="flex-1">Zoom</span><input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(e) => handleZoom(Number(e.target.value))} className="w-40" /></label>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={closeCrop} disabled={uploading} className="border border-bege-escuro/35 px-3 py-2 font-title text-[10px] uppercase text-bege-medio">Cancelar</button>
              <button type="button" onClick={() => void handleConfirmCrop()} disabled={uploading || !naturalSize.width} className="border border-bege-medio/60 px-3 py-2 font-title text-[10px] uppercase text-bege-claro disabled:opacity-40">{uploading ? "Enviando..." : "Usar este recorte"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
