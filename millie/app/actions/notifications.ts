'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getMyNotifications(limit = 50) {
  const session = await auth()
  if (!session?.user?.id) return { notifications: [], unreadCount: 0 }
  const take = Number.isInteger(limit) ? Math.min(Math.max(limit, 1), 100) : 50
  const userId = session.user.id

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take,
      select: { id: true, type: true, title: true, message: true, href: true, createdAt: true, readAt: true },
    }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ])
  return { notifications, unreadCount }
}

export async function markNotificationRead(notificationId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')
  if (typeof notificationId !== 'string' || notificationId.length > 100) throw new Error('Notificação inválida')

  await prisma.notification.updateMany({
    where: { id: notificationId, userId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  })
  revalidatePath('/notificacoes')
}

export async function markAllNotificationsRead() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')
  await prisma.notification.updateMany({
    where: { userId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  })
  revalidatePath('/notificacoes')
}
