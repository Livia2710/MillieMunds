import { createHmac } from 'node:crypto'
import { prisma } from '@/lib/prisma'

type RateLimitOptions = {
  maxAttempts: number
  windowMs: number
  blockMs: number
}

function rateLimitSecret() {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET é necessário para proteger tentativas')
  return secret
}

export function rateLimitKey(scope: string, identity: string) {
  const digest = createHmac('sha256', rateLimitSecret()).update(identity.trim().toLowerCase()).digest('hex')
  return `${scope}:${digest}`
}

export function requestIp(headers: Headers) {
  return (headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip') || 'unknown').slice(0, 80)
}

export async function consumeRateLimit(key: string, options: RateLimitOptions) {
  const [result] = await prisma.$queryRaw<Array<{ allowed: boolean }>>`
    INSERT INTO "SecurityRateLimit" ("key", "count", "windowStartedAt", "blockedUntil")
    VALUES (${key}, 1, NOW(), NULL)
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "SecurityRateLimit"."blockedUntil" > NOW() THEN "SecurityRateLimit"."count"
        WHEN "SecurityRateLimit"."windowStartedAt" <= NOW() - (${options.windowMs} * INTERVAL '1 millisecond') THEN 1
        ELSE "SecurityRateLimit"."count" + 1
      END,
      "windowStartedAt" = CASE
        WHEN "SecurityRateLimit"."blockedUntil" > NOW() THEN "SecurityRateLimit"."windowStartedAt"
        WHEN "SecurityRateLimit"."windowStartedAt" <= NOW() - (${options.windowMs} * INTERVAL '1 millisecond') THEN NOW()
        ELSE "SecurityRateLimit"."windowStartedAt"
      END,
      "blockedUntil" = CASE
        WHEN "SecurityRateLimit"."blockedUntil" > NOW() THEN "SecurityRateLimit"."blockedUntil"
        WHEN "SecurityRateLimit"."windowStartedAt" <= NOW() - (${options.windowMs} * INTERVAL '1 millisecond') THEN NULL
        WHEN "SecurityRateLimit"."count" + 1 > ${options.maxAttempts} THEN NOW() + (${options.blockMs} * INTERVAL '1 millisecond')
        ELSE NULL
      END
    RETURNING ("count" <= ${options.maxAttempts} AND ("blockedUntil" IS NULL OR "blockedUntil" <= NOW())) AS allowed
  `

  if (Math.random() < 0.01) {
    await prisma.$executeRaw`DELETE FROM "SecurityRateLimit" WHERE "windowStartedAt" < NOW() - INTERVAL '2 days'`
  }
  return result?.allowed === true
}

export async function clearRateLimit(key: string) {
  await prisma.$executeRaw`DELETE FROM "SecurityRateLimit" WHERE "key" = ${key}`
}
