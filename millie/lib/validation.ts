export function validatedText(
  value: unknown,
  label: string,
  options: { min?: number; max: number; trim?: boolean }
): string {
  if (typeof value !== 'string') throw new Error(`${label} inválido`)
  const text = options.trim === false ? value : value.trim()
  const min = options.min ?? 0
  if (text.length < min || text.length > options.max) {
    throw new Error(`${label} deve ter entre ${min} e ${options.max} caracteres`)
  }
  return text
}

export function validatedInteger(value: unknown, label: string, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${label} deve ser um número inteiro entre ${min} e ${max}`)
  }
  return value
}

export function normalizeEmail(value: unknown): string {
  const email = validatedText(value, 'E-mail', { min: 3, max: 254 }).toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('E-mail inválido')
  return email
}

export function validatePassword(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Senha inválida')
  const bytes = Buffer.byteLength(value, 'utf8')
  if (value.length < 12 || bytes > 72) {
    throw new Error('A senha deve ter pelo menos 12 caracteres e no máximo 72 bytes')
  }
  return value
}

export function validateImageUrl(value: unknown, label = 'Imagem'): string | undefined {
  if (value === undefined || value === null || value === '') return undefined
  const imageUrl = validatedText(value, label, { min: 1, max: 2_048 })
  let parsed: URL
  try {
    parsed = new URL(imageUrl)
  } catch {
    throw new Error(`${label} inválida`)
  }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) {
    throw new Error(`${label} deve usar uma URL HTTPS válida`)
  }
  return imageUrl
}

export function oneOf<const T extends readonly string[]>(value: unknown, label: string, choices: T): T[number] {
  if (typeof value !== 'string' || !choices.includes(value)) throw new Error(`${label} inválido`)
  return value as T[number]
}
