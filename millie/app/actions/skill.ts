'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createSkill(data: {
  name: string
  description: string
  branch: string
  element: string
  maxLevel: number
  requiredCharacterLevel: number
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  const membership = await prisma.campaignMember.findFirst({
    where: { userId: session.user.id, active: true, role: 'MASTER' },
  })
  if (!membership) throw new Error('Sem campanha ativa como Mestre')

  await prisma.skill.create({
    data: {
      name: data.name,
      description: data.description,
      branch: data.branch,
      element: data.element,
      maxLevel: data.maxLevel,
      requiredCharacterLevel: data.requiredCharacterLevel,
      characterId: '', // skill global — sem personagem ainda
    },
  })

  revalidatePath('/habilidades')
}