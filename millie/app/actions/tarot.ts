'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Mestre inicia a leitura — salva pendente sem cartas ainda
export async function initiateTarotReading(data: {
  characterId: string
  readingType: 'COMUM' | 'PROFUNDA'
  question: string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  // cancela qualquer leitura pendente anterior do mesmo personagem
  await prisma.tarotDraw.updateMany({
    where: { characterId: data.characterId, status: 'pendente' },
    data: { status: 'cancelada' },
  })

  const draw = await prisma.tarotDraw.create({
    data: {
      characterId:        data.characterId,
      readingType:        data.readingType,
      question:           data.question,
      cards:              [],
      sacrifice:          '',
      status:             'pendente',
      initiatedByMasterId: session.user.id,
    },
  })

  revalidatePath('/mestre')
  return draw
}

// Jogador submete as cartas que tirou
export async function submitTarotCards(data: {
  drawId: string
  cards: string[]
  hadJoker: boolean
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  await prisma.tarotDraw.update({
    where: { id: data.drawId },
    data: {
      cards:    data.cards,
      hadJoker: data.hadJoker,
      status:   'cartas_reveladas',
    },
  })

  revalidatePath('/mestre')
  revalidatePath('/perfil')
}

// Mestre conclui a leitura definindo o sacrifício
export async function completeTarotReading(data: {
  drawId: string
  sacrifice: string
  sacrificeIsPermanent: boolean
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  await prisma.tarotDraw.update({
    where: { id: data.drawId },
    data: {
      sacrifice:            data.sacrifice,
      sacrificeIsPermanent: data.sacrificeIsPermanent,
      status:               'concluida',
    },
  })

  revalidatePath('/mestre')
  revalidatePath('/perfil')
}

// Polling do jogador — busca leitura pendente ou com cartas reveladas
export async function getPendingTarotReading(characterId: string) {
  const session = await auth()
  if (!session?.user?.id) return null

  return prisma.tarotDraw.findFirst({
    where: {
      characterId,
      status: { in: ['pendente', 'cartas_reveladas'] },
    },
    orderBy: { drawnAt: 'desc' },
  })
}

// Polling do Mestre — busca leitura com cartas já reveladas pelo jogador
export async function getMasterPendingReading(characterId: string) {
  const session = await auth()
  if (!session?.user?.id) return null

  return prisma.tarotDraw.findFirst({
    where: { characterId, status: 'cartas_reveladas' },
    orderBy: { drawnAt: 'desc' },
  })
}