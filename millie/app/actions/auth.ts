// app/actions/auth.ts
'use server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'  
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'

export async function registerUser(
  email: string,
  name: string,
  password: string
) {
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw new Error('E-mail já cadastrado')

  const passwordHash = await bcrypt.hash(password, 12)

  await prisma.user.create({
    data: { email, username: name, passwordHash }
  })
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
      ...(data.bio      !== undefined && { bio:      data.bio      }),
      ...(data.avatar   !== undefined && { avatar:   data.avatar   }),
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
    data:  { passwordHash: newHash },
  })
}