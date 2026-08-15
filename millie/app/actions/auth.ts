// app/actions/auth.ts
'use server'

import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'

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

  const current = await getUserSettings();

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(data.preferences && { preferences: { ...current.preferences, ...data.preferences } }),
      ...(data.notifications && { notifications: { ...current.notifications, ...data.notifications } }),
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
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw new Error('E-mail já cadastrado')

  const passwordHash = await bcrypt.hash(password, 12)
  await prisma.user.create({ data: { email, username: name, passwordHash } })
}

// ─── updateProfile ────────────────────────────────────────
export async function updateProfile(data: {
  username?: string
  bio?: string
  avatar?: string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(data.username !== undefined && { username: data.username }),
      ...(data.bio !== undefined && { bio: data.bio }),
      ...(data.avatar !== undefined && { avatar: data.avatar }),
    },
  })

  revalidatePath('/configuracoes')
  revalidatePath('/perfil')
}

// ─── updatePassword ───────────────────────────────────────
export async function updatePassword(currentPassword: string, newPassword: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  })

  if (!user?.passwordHash) throw new Error('Conta sem senha definida')

  const valid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!valid) throw new Error('Senha atual incorreta')

  const newHash = await bcrypt.hash(newPassword, 12)
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
