import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { checkRateLimit, getClientKey } from './rateLimiter'

// Cada teste usa uma chave própria (buckets são um Map em memória compartilhado entre testes,
// então reusar chave misturaria a contagem de um teste com a de outro).
let keyCounter = 0
function freshKey(): string {
  keyCounter += 1
  return `test-key-${keyCounter}`
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('checkRateLimit', () => {
  it('permite requisições dentro do limite', () => {
    const key = freshKey()
    for (let i = 0; i < 20; i++) {
      expect(checkRateLimit(key).allowed).toBe(true)
    }
  })

  it('bloqueia a requisição que excede o limite dentro da mesma janela', () => {
    const key = freshKey()
    for (let i = 0; i < 20; i++) checkRateLimit(key)
    const result = checkRateLimit(key)
    expect(result.allowed).toBe(false)
    expect(result.retryAfterSeconds).toBeGreaterThan(0)
  })

  it('libera de novo depois que a janela expira', () => {
    const key = freshKey()
    for (let i = 0; i < 20; i++) checkRateLimit(key)
    expect(checkRateLimit(key).allowed).toBe(false)

    vi.advanceTimersByTime(5 * 60_000 + 1)

    expect(checkRateLimit(key).allowed).toBe(true)
  })

  it('mantém contagens independentes por chave', () => {
    const keyA = freshKey()
    const keyB = freshKey()
    for (let i = 0; i < 20; i++) checkRateLimit(keyA)
    expect(checkRateLimit(keyA).allowed).toBe(false)
    expect(checkRateLimit(keyB).allowed).toBe(true)
  })
})

describe('getClientKey', () => {
  it('usa o primeiro IP de x-forwarded-for', () => {
    const request = new Request('http://localhost', { headers: { 'x-forwarded-for': '203.0.113.5, 10.0.0.1' } })
    expect(getClientKey(request)).toBe('203.0.113.5')
  })

  it('cai pra x-real-ip quando x-forwarded-for está ausente', () => {
    const request = new Request('http://localhost', { headers: { 'x-real-ip': '203.0.113.9' } })
    expect(getClientKey(request)).toBe('203.0.113.9')
  })

  it('cai pra "unknown" sem nenhum header de proxy', () => {
    const request = new Request('http://localhost')
    expect(getClientKey(request)).toBe('unknown')
  })
})
