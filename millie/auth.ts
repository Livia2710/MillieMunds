// auth.ts (raiz do projeto)
import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './lib/prisma'  
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { clearRateLimit, consumeRateLimit, rateLimitKey, requestIp } from './lib/rateLimit'
import authConfig from './auth.config'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials, request) {
        const email = typeof credentials?.email === 'string' ? credentials.email.trim().toLowerCase() : ''
        const password = typeof credentials?.password === 'string' ? credentials.password : ''
        const ipKey = rateLimitKey('login-ip', requestIp(request.headers))
        const ipAllowed = await consumeRateLimit(ipKey, {
          maxAttempts: 30,
          windowMs: 15 * 60 * 1_000,
          blockMs: 15 * 60 * 1_000,
        })
        if (!ipAllowed || !email || !password || Buffer.byteLength(password, 'utf8') > 72) return null

        const emailKey = rateLimitKey('login-email', email)
        const emailAllowed = await consumeRateLimit(emailKey, {
          maxAttempts: 8,
          windowMs: 15 * 60 * 1_000,
          blockMs: 15 * 60 * 1_000,
        })
        if (!emailAllowed) return null

        const user = await prisma.user.findUnique({
          where: { email }
        })

        if (!user || !user.passwordHash) return null

        const valid = await bcrypt.compare(
          password,
          user.passwordHash
        )
        if (!valid) return null

        await clearRateLimit(emailKey)

        return user
      }
    })
  ],
  session: { strategy: 'jwt' },   // ← IMPORTANTE com Credentials
  callbacks: {
  async jwt({ token, user, trigger }) {
    if (user) token.id = user.id

    // `useSession().update()` chega com trigger === 'update'. Busca os valores
    // atuais no banco e não confia em dados de perfil enviados pelo cliente.
    if (user || trigger === 'update') {
      const userId = user?.id ?? token.id
      if (typeof userId === 'string') {
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { username: true, email: true, avatar: true },
        })
        token.username = dbUser?.username ?? dbUser?.email ?? ''
        token.avatar = dbUser?.avatar ?? null
      }
    }
    return token
  },
  session({ session, token }) {
    if (token?.id) {
      session.user.id = token.id as string
      session.user.name = token.username as string
      session.user.image = token.avatar as string | null
    }
    return session
  }
}
})
