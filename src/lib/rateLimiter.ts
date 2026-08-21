// Limitador de taxa em memória, compartilhado pelas 3 rotas que chamam a API do Gemini — sem
// isso, uma única origem (script, aba com loop) pode gerar custo ilimitado na cota da API.
// Funciona por processo Node de vida longa (ex: `next start` numa VM/container); num deploy
// serverless com múltiplas instâncias, cada instância teria sua própria contagem — nesse caso
// precisaria de um armazenamento compartilhado (ex: Redis) em vez de um Map local.

interface Bucket {
  count: number
  windowStart: number
}

const WINDOW_MS = 5 * 60_000
const MAX_REQUESTS_PER_WINDOW = 20
// Impede o Map de crescer sem limite com chaves antigas que nunca mais voltam a pedir nada.
const MAX_TRACKED_KEYS = 5000

const buckets = new Map<string, Bucket>()

function pruneExpired(now: number) {
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart >= WINDOW_MS) buckets.delete(key)
  }
}

export interface RateLimitResult {
  allowed: boolean
  retryAfterSeconds?: number
}

export function checkRateLimit(key: string): RateLimitResult {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || now - bucket.windowStart >= WINDOW_MS) {
    if (buckets.size >= MAX_TRACKED_KEYS) pruneExpired(now)
    buckets.set(key, { count: 1, windowStart: now })
    return { allowed: true }
  }

  if (bucket.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.windowStart + WINDOW_MS - now) / 1000) }
  }

  bucket.count += 1
  return { allowed: true }
}

/** IP de origem a partir dos headers de proxy — Request do Next.js não expõe o socket
 * diretamente. Sem nenhum header (dev local sem proxy), todas as requisições caem na mesma
 * chave — aceitável: o limite existe pra proteger contra abuso externo, não uso local. */
export function getClientKey(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) return forwardedFor.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}

export class RateLimitError extends Error {
  constructor(public retryAfterSeconds: number) {
    super('Muitas requisições em pouco tempo. Tente novamente em breve.')
  }
}

export function enforceRateLimit(request: Request) {
  const result = checkRateLimit(getClientKey(request))
  if (!result.allowed) {
    throw new RateLimitError(result.retryAfterSeconds ?? 60)
  }
}
