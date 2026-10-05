// app/actions/auth.ts
'use server'

import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { normalizeEmail, validatedText, validatePassword, validateImageUrl } from '@/lib/validation'
import { consumeRateLimit, rateLimitKey, requestIp } from '@/lib/rateLimit'

// 1. Aqui entram as novas importações e re-exportações de tipos
import {
  DEFAULT_PREFERENCES,
  DEFAULT_NOTIFICATIONS,
  type UserPreferences,
  type NotificationPreferences,
} from "@/lib/types/settings";


// 2. Nova função getUserSettings atualizada (com ajuste para não quebrar caso deslogado)
export async function getUserSettings(): Promise<{
  preferences: UserPreferences;
  notifications: NotificationPreferences;
}> {
  const session = await auth();
  
  // Ajuste de segurança: se não houver sessão, retorna os padrões em vez de estourar um erro na tela
  if (!session?.user?.id) {
    return { preferences: DEFAULT_PREFERENCES, notifications: DEFAULT_NOTIFICATIONS };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { preferences: true, notifications: true },
  });

  return {
    preferences: { ...DEFAULT_PREFERENCES, ...(user?.preferences as Partial<UserPreferences> ?? {}) },
    notifications: { ...DEFAULT_NOTIFICATIONS, ...(user?.notifications as Partial<NotificationPreferences> ?? {}) },
  };
}

// 3. Nova função updateUserSettings que usa a estratégia de mesclagem inteligente
export async function updateUserSettings(data: {
  preferences?: Partial<UserPreferences>;
  notifications?: Partial<NotificationPreferences>;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado");

  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Configurações inválidas')
  const preferenceKeys = ['animacoesInterface', 'texturaPapel', 'sonsInterface'] as const
  const notificationKeys = ['novasSessoes', 'itensAdicionados', 'habilidadesDesbloqueadas', 'atualizacoesSistema'] as const
  const validatePatch = <T extends object>(value: unknown, keys: readonly (keyof T)[]) => {
    if (value === undefined) return undefined
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Configurações inválidas')
    const entries = Object.entries(value as Record<string, unknown>)
    if (entries.some(([key, item]) => !keys.includes(key as keyof T) || typeof item !== 'boolean')) {
      throw new Error('Configurações inválidas')
    }
    return Object.fromEntries(entries) as Partial<T>
  }
  const preferences = validatePatch<UserPreferences>(data.preferences, preferenceKeys)
  const notifications = validatePatch<NotificationPreferences>(data.notifications, notificationKeys)
  if (!preferences && !notifications) throw new Error('Nenhuma configuração informada')

  const current = await getUserSettings();

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(preferences && { preferences: { ...current.preferences, ...preferences } }),
      ...(notifications && { notifications: { ...current.notifications, ...notifications } }),
    },
  });

  revalidatePath('/configuracoes'); // Mantive a revalidação que estava no seu código original
}

// 4. Suas outras funções continuam aqui embaixo sem alterações
export async function registerUser(
  email: string,
  name: string,
  password: string
) {
  const ip = requestIp(await headers())
  const allowed = await consumeRateLimit(rateLimitKey('register-ip', ip), {
    maxAttempts: 5,
    windowMs: 60 * 60 * 1_000,
    blockMs: 60 * 60 * 1_000,
  })
  if (!allowed) throw new Error('Muitas tentativas de cadastro. Tente novamente mais tarde.')

  const normalizedEmail = normalizeEmail(email)
  const emailAllowed = await consumeRateLimit(rateLimitKey('register-email', normalizedEmail), {
    maxAttempts: 3,
    windowMs: 24 * 60 * 60 * 1_000,
    blockMs: 24 * 60 * 60 * 1_000,
  })
  if (!emailAllowed) throw new Error('Muitas tentativas de cadastro para este e-mail. Tente novamente amanhã.')
  const username = validatedText(name, 'Nome de usuário', { min: 2, max: 32 })
  const validPassword = validatePassword(password)
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  if (existing) throw new Error('E-mail já cadastrado')

  const passwordHash = await bcrypt.hash(validPassword, 12)
  await prisma.user.create({ data: { email: normalizedEmail, username, passwordHash } })
}

// ─── updateProfile ────────────────────────────────────────
export async function updateProfile(data: {
  username?: string
  bio?: string
  avatar?: string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  const username = data.username === undefined
    ? undefined
    : validatedText(data.username, 'Nome de usuário', { min: 2, max: 32 })
  const bio = data.bio === undefined
    ? undefined
    : validatedText(data.bio, 'Biografia', { max: 500 })
  const avatar = data.avatar === undefined ? undefined : validateImageUrl(data.avatar, 'Avatar') ?? null

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(username !== undefined && { username }),
      ...(bio !== undefined && { bio }),
      ...(data.avatar !== undefined && { avatar }),
    },
  })

  revalidatePath('/configuracoes')
  revalidatePath('/perfil')
}

// ─── updatePassword ───────────────────────────────────────
export async function updatePassword(currentPassword: string, newPassword: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')
  if (typeof currentPassword !== 'string' || Buffer.byteLength(currentPassword, 'utf8') > 72) {
    throw new Error('Senha atual inválida')
  }
  const validNewPassword = validatePassword(newPassword)

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  })

  if (!user?.passwordHash) throw new Error('Conta sem senha definida')

  const valid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!valid) throw new Error('Senha atual incorreta')

  const newHash = await bcrypt.hash(validNewPassword, 12)
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash: newHash },
  })
}

export async function getUserProfile() {
  const session = await auth()
  if (!session?.user?.id) return null

  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: { username: true, avatar: true, email: true },
  })
}
