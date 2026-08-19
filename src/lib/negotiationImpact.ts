import { Scenario } from '@/types'
import { formatCurrencyBRL, formatMonthsLabel } from './labels'

/**
 * Frase curta de trade-off entre duas versões do cenário (AJUSTES-UI §21/26/27) — o histórico de
 * negociação priorizava a narração completa da IA; isso prioriza a consequência (o que o usuário
 * realmente veio buscar ao negociar), auditável em uma linha.
 */
export function describeNegotiationImpact(current: Scenario, previous: Scenario): string {
  const costDelta = current.totalMonthlyCost - previous.totalMonthlyCost
  const riskDelta = current.riskScore - previous.riskScore
  const timelineDelta = current.estimatedTimelineMonths - previous.estimatedTimelineMonths

  const costPart =
    costDelta === 0
      ? 'Custo sem alteração'
      : costDelta < 0
        ? `Economia de ${formatCurrencyBRL(Math.abs(costDelta))}/mês`
        : `Aumento de ${formatCurrencyBRL(costDelta)}/mês`

  const riskPart =
    riskDelta === 0
      ? 'risco sem alteração'
      : riskDelta > 0
        ? `aumento de ${riskDelta} pontos no risco`
        : `redução de ${Math.abs(riskDelta)} pontos no risco`

  const timelinePart =
    timelineDelta === 0
      ? 'O prazo permanece inalterado.'
      : `O prazo passa a ${formatMonthsLabel(current.estimatedTimelineMonths)}.`

  return `${costPart}, com ${riskPart}. ${timelinePart}`
}

/**
 * Versão compacta pro histórico de negociação (formato de auditoria, CRITICA-UI §4.3): a frase
 * completa já aparece no painel de Impacto — repeti-la no histórico era redundância na mesma
 * tela. Aqui é só o delta em uma linha.
 */
export function describeNegotiationImpactCompact(current: Scenario, previous: Scenario): string {
  const costDelta = current.totalMonthlyCost - previous.totalMonthlyCost
  const riskDelta = current.riskScore - previous.riskScore
  const timelineDelta = current.estimatedTimelineMonths - previous.estimatedTimelineMonths

  const costPart =
    costDelta === 0 ? 'custo sem alteração' : `${costDelta > 0 ? '+' : '−'} ${formatCurrencyBRL(Math.abs(costDelta))}/mês`
  const riskPart = riskDelta === 0 ? 'risco sem alteração' : `${riskDelta > 0 ? '+' : '−'}${Math.abs(riskDelta)} risco`
  const timelinePart =
    timelineDelta === 0 ? 'prazo sem alteração' : `prazo ${formatMonthsLabel(current.estimatedTimelineMonths)}`

  return `${costPart} · ${riskPart} · ${timelinePart}`
}
