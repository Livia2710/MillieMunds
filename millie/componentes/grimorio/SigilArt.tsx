import type { GrimoireRitual } from '@/lib/types/grimoire'

const normalize = (value: string | null | undefined) => (value ?? '').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '')

function shapeFor(element: string, variant: string, scale = 1) {
  const e = normalize(element)
  const v = normalize(variant)
  const rotation = e === 'trevas' && (v.includes('ocultar') || v.includes('esquerda')) ? 180
    : v.includes('baixo') || v.includes('descendente') ? 180
    : v.includes('direita') || v.includes('horaria') || v.includes('horario') ? 90
      : v.includes('esquerda') || v.includes('anti-horaria') || v.includes('anti-horario') ? -90 : 0
  const transform = `translate(100 100) scale(${scale}) rotate(${rotation})`
  if (e === 'luz') return <g transform={transform}><path d="M0 -54 L48 35 L-48 35 Z"/></g>
  if (e === 'fogo') {
    const line = v.includes('horizontal') ? 'M-57 0 H57' : v.includes('diag') ? 'M-42 42 L42 -42' : 'M0 -58 V58'
    const other = v.includes('descendente') ? 'rotate(180)' : ''
    return <g transform={transform}><path d={line} transform={other}/></g>
  }
  if (e === 'terra') {
    const shape = v.includes('pedra') ? 'M-52 -34 H52 V34 H-52 Z'
      : v.includes('forca') || v.includes('força') || v.includes('selvagem') ? 'M-34 -52 H34 V52 H-34 Z'
        : 'M-42 -42 H42 V42 H-42 Z'
    return <g transform={transform}><path d={shape}/></g>
  }
  if (e === 'vento') {
    const mirror = v.includes('anti-horario') || v.includes('anti-horaria')
    return <g transform={`translate(100 100) scale(${mirror ? -scale : scale} ${scale})`}><path d="M0 0 C0 -11 18 -11 18 0 C18 23 -20 25 -29 4 C-43 -31 -6 -54 29 -43 C70 -30 66 23 36 46"/></g>
  }
  if (e === 'trevas') return <g transform={transform}><path d="M20 -48 A52 52 0 1 0 20 48 A39 39 0 0 1 20 -48 Z"/></g>
  if (e === 'agua' || e === 'água') return <g transform={transform}><ellipse rx={v.includes('fluxo') || v.includes('oval') ? 54 : 45} ry={v.includes('fluxo') || v.includes('oval') ? 35 : 45}/></g>
  return null
}

type SigilSource = Pick<GrimoireRitual, 'degree' | 'elementText' | 'elements' | 'categoryOrVariant' | 'anchor' | 'anchorVariant' | 'secondary' | 'secondaryVariant' | 'sigilForm'>

function gradeTwoShape(ritual: Pick<SigilSource, 'secondaryVariant' | 'elements' | 'elementText'>) {
  const descriptor = ritual.secondaryVariant ?? ''
  const d = normalize(descriptor)
  const element = ritual.elements[0] ?? ritual.elementText
  if (d.includes('duplicado')) {
    const variant = descriptor.replace(/\s*\(duplicado\)/i, '')
    return <g>{shapeFor(element, variant, 0.78)}{shapeFor(element, variant, 1.12)}</g>
  }
  const letter = d.match(/\(([xlthfezk])\)/)?.[1]
  if (letter) {
    const paths: Record<string, string> = {
      x: 'M-48 -48 L48 48 M48 -48 L-48 48',
      l: 'M-42 -52 V42 H48',
      t: 'M-52 -40 H52 M0 -40 V52',
      k: 'M-38 -52 V52 M-38 0 L42 -48 M-38 0 L42 48',
      h: 'M-42 -52 V52 M42 -52 V52 M-42 0 H42',
      f: 'M-42 -52 V52 M-42 -52 H42 M-42 0 H28',
      e: 'M-42 -52 V52 M-42 -52 H42 M-42 0 H35 M-42 52 H42',
      z: 'M-42 -48 H42 L-42 48 H42',
    }
    return <g transform="translate(100 100)"><path d={paths[letter]}/></g>
  }
  return null
}

function gradeFourShape(form: string | null) {
  const f = normalize(form)
  if (!f) return null
  if (f.includes('circulo cortado por linha vertical')) return <g transform="translate(100 100)"><circle r="48"/><path d="M0 -54 V54"/></g>
  if (f.includes('gota') || f.includes('lagrima')) return <g transform="translate(100 100)"><path d="M0 -58 C-14 -34 -43 1 -43 27 A43 43 0 0 0 43 27 C43 1 14 -34 0 -58 Z"/></g>
  if (f.includes('capsula')) return <g transform="translate(100 100)"><rect x="-45" y="-28" width="90" height="56" rx="28"/></g>
  if (f.includes('circulo com uma crescente')) return <g transform="translate(100 100)"><circle r="46"/><path d="M17 -38 A42 42 0 1 0 17 38 A31 31 0 0 1 17 -38 Z"/></g>
  if (f.trim() === '>') return <g transform="translate(100 100)"><path d="M-40 -50 L40 0 L-40 50"/></g>
  if (f === 'cruz') return <g transform="translate(100 100)"><path d="M0 -52 V52 M-52 0 H52"/></g>
  if (f.includes('square spiral')) return <g transform="translate(100 100)"><path d="M-48 -48 H48 V48 H-48 V-29 H29 V29 H-29 V-10 H10 V10"/></g>
  return null
}

function gradeTwoLabel(ritual: Pick<SigilSource, 'secondaryVariant' | 'categoryOrVariant'>) {
  return ritual.secondaryVariant || ritual.categoryOrVariant || 'Composição não definida'
}

export function SigilArt({ ritual, large = false, ornamental = false }: { ritual: SigilSource; large?: boolean; ornamental?: boolean }) {
  let art: React.ReactNode = null
  let spec = ''

  if (ritual.degree === 1) {
    spec = `${ritual.elementText} · ${ritual.categoryOrVariant ?? ''}`.trim()
    art = shapeFor(ritual.elements[0] ?? ritual.elementText, ritual.categoryOrVariant ?? '')
  } else if (ritual.degree === 2) {
    spec = gradeTwoLabel(ritual)
    art = gradeTwoShape(ritual)
  } else if (ritual.degree === 3) {
    spec = `${ritual.anchor ?? 'Âncora não definida'} · ${ritual.anchorVariant ?? 'variante não definida'} / ${ritual.secondary ?? 'Secundário não definido'} · ${ritual.secondaryVariant ?? 'variante não definida'}`
    const outer = shapeFor(ritual.secondary ?? '', ritual.secondaryVariant ?? '', 1.22)
    const inner = shapeFor(ritual.anchor ?? '', ritual.anchorVariant ?? '', 0.68)
    art = outer && inner ? <>{outer}{inner}</> : null
  } else {
    spec = ritual.sigilForm ?? 'Forma do sigilo não definida na planilha.'
    art = gradeFourShape(ritual.sigilForm)
  }

  return (
    <div className={`relative flex items-center justify-center ${ornamental ? 'aspect-square w-full overflow-visible border-0 bg-transparent' : 'overflow-hidden border border-bege-medio/25 bg-[radial-gradient(circle,rgba(209,186,142,.11),rgba(26,15,34,.92)_72%)]'} ${large ? 'aspect-square w-full' : 'aspect-[4/3] w-full'}`}>
      {art ? (
        <svg viewBox="0 0 200 200" className={`${ornamental ? 'relative z-10 h-[92%] w-[92%]' : large ? 'h-[88%] w-[88%]' : 'h-[84%] w-[84%]'} overflow-visible text-bege-medio`} fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-label={`Sigilo: ${spec}`}>
          {art}
        </svg>
      ) : (
        <div className="max-w-[90%] px-2 text-center">
          <span className="block font-title text-[9px] uppercase tracking-[.18em] text-bege-medio/55">Sigilo conforme planilha</span>
          <span className="mt-2 block font-body text-[10px] leading-relaxed text-bege-claro/65">{spec}</span>
        </div>
      )}
      {!ornamental && <div aria-hidden="true" className="pointer-events-none absolute inset-[6px] border border-bege-medio/10" />}
    </div>
  )
}
