import type { NextAuthConfig } from 'next-auth'

// Configuração segura para o Proxy (Edge): não importar Prisma, bcrypt ou módulos Node.
const authConfig = {
  providers: [],
  session: { strategy: 'jwt' },
} satisfies NextAuthConfig

export default authConfig
