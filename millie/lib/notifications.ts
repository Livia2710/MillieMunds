import { prisma } from '@/lib/prisma'
import type { NotificationPreferences } from '@/lib/types/settings'

type NotificationPreferenceKey = keyof NotificationPreferences

export async function createUserNotification(input: {
  userId: string
  preference: NotificationPreferenceKey
  type: string
  title: string
  message: string
  href: string
}) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { notifications: true },
    })
    if (!user) return

    const saved = user.notifications && typeof user.notifications === 'object' && !Array.isArray(user.notifications)
      ? user.notifications as Partial<NotificationPreferences>
      : {}
    if (saved[input.preference] === false) return

    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        href: input.href,
      },
    })
  } catch (error) {
    // Notification persistence must not turn a successful game action into an apparent failure.
    console.error('Falha ao registrar notificação:', error)
  }
}
