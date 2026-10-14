import Image from 'next/image'
import { formatCurrency } from '@/lib/utils/equipment'

const CURRENCY_UNITS = [
  { value: 10_000, name: 'Mundo', image: '/assets/moedas/mundo.png' },
  { value: 1_000, name: 'Ponte', image: '/assets/moedas/ponte.png' },
  { value: 100, name: 'Elo', image: '/assets/moedas/elo.png' },
  { value: 10, name: 'Fragmento', image: '/assets/moedas/fragmento.png' },
  { value: 1, name: 'Estilhaço', image: '/assets/moedas/estilhaco.png' },
] as const

type CurrencyDisplayProps = {
  amount: number
  iconSize?: number
  className?: string
}

export default function CurrencyDisplay({ amount, iconSize = 20, className = '' }: CurrencyDisplayProps) {
  let remaining = Math.max(0, Math.floor(Number.isFinite(amount) ? amount : 0))
  const parts = CURRENCY_UNITS.flatMap(unit => {
    const count = Math.floor(remaining / unit.value)
    remaining %= unit.value
    return count > 0 ? [{ ...unit, count }] : []
  })
  const visibleParts = parts.length ? parts : [{ ...CURRENCY_UNITS.at(-1)!, count: 0 }]

  return (
    <span role="img" className={`inline-flex flex-wrap items-center gap-x-2 gap-y-1 ${className}`} aria-label={formatCurrency(amount)}>
      {visibleParts.map(unit => (
        <span key={unit.name} title={`${unit.name}${unit.count === 1 ? '' : 's'}`} className="inline-flex items-center gap-1 whitespace-nowrap">
          <Image src={unit.image} alt="" width={iconSize} height={iconSize} className="shrink-0 object-contain" />
          <span>{unit.count} <span className="text-[0.85em] opacity-75">{unit.name}{unit.count === 1 ? '' : 's'}</span></span>
        </span>
      ))}
    </span>
  )
}
