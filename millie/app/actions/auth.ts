// app/actions/auth.ts
'use server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'   // ← aqui pode usar @/ normalmente

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