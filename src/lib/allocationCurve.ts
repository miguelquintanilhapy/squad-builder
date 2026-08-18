import { AllocationType, RoleType } from '@/types'
import { ALLOCATION_CAPACITY_MULTIPLIER } from './rates'

/**
 * Curva de alocação por papel ao longo do prazo (revisão externa 3.7): sem isso, a barra do
 * gráfico é 100% do mês 1 ao fim, retângulo sólido que não comunica nada. É determinística por
 * arquétipo de papel — a IA nunca calcula isso, só o motor determinístico (mesma regra do
 * resto do cálculo, ver nota no topo de gemini.ts) — não uma média inventada:
 * - Designer concentra na primeira metade: UX se define antes do build avançar.
 * - QA concentra na segunda metade: não há o que testar antes de existir build.
 * - O resto (dev, tech-lead, devops, PM, data/security) é constante — sustenta o projeto inteiro.
 */
export function monthlyAllocationPct(role: RoleType, allocation: AllocationType, monthCount: number): number[] {
  const ceiling = Math.round(ALLOCATION_CAPACITY_MULTIPLIER[allocation] * 100)
  const months = Math.max(1, monthCount)

  if (role === 'designer-uxui') {
    return Array.from({ length: months }, (_, m) => (m / months < 0.6 ? ceiling : Math.round(ceiling * 0.35)))
  }

  if (role === 'qa') {
    return Array.from({ length: months }, (_, m) => (m / months < 0.4 ? Math.round(ceiling * 0.2) : ceiling))
  }

  return Array.from({ length: months }, () => ceiling)
}
