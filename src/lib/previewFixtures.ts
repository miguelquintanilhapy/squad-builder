import { ProjectInput, Scenario, ScopeAnalysis } from '@/types'
import { suggestInitialSquad } from './squadPlanner'
import { computeScenario } from './calculator'

/**
 * Só pra visualizar a interface sem gastar cota da API do Gemini: roda o motor determinístico
 * (squadPlanner + calculator, sem LLM) com um escopo fixo. summary/midGroundSuggestion normalmente
 * vêm de narrateScenario (LLM) — aqui são texto estático, só pra preencher a UI.
 */
const PREVIEW_INPUT: ProjectInput = {
  productTypes: ['mobile-app', 'web-app'],
  platforms: ['ios', 'android', 'web'],
  stage: 'idea',
  complexity: 'medium',
  description:
    'Um app de entregas locais com motos. O cliente pede pelo celular, paga no app com pix ou cartão e acompanha o motoboy no mapa em tempo real. Precisa de um painel web pro lojista acompanhar pedidos e de repasse automático pros entregadores.',
}

const PREVIEW_SCOPE: ScopeAnalysis = {
  productTypes: ['mobile-app', 'web-app'],
  platforms: ['ios', 'android', 'web'],
  stage: 'idea',
  complexity: 'medium',
  estimatedEffortPersonMonths: 14,
  requiredCapabilities: ['realtime-tracking', 'payments', 'admin-panel', 'geolocation'],
  keyRisksNoted: [
    'GPS em tempo real exige testes de campo, não só em desenvolvimento',
    'Repasse automático pros entregadores precisa de conciliação financeira confiável',
  ],
  summary:
    'App de entregas locais com motos: pedido e pagamento in-app, rastreamento em tempo real do motoboy, painel web pro lojista e repasse automático pros entregadores.',
}

export function buildPreviewScenario(): { scopeAnalysis: ScopeAnalysis; scenario: Scenario } {
  const squad = suggestInitialSquad(PREVIEW_SCOPE, PREVIEW_INPUT)
  const scenario = computeScenario(squad, PREVIEW_SCOPE, PREVIEW_INPUT)

  return {
    scopeAnalysis: PREVIEW_SCOPE,
    scenario: {
      ...scenario,
      summary:
        'Esse escopo pede rastreamento em tempo real e pagamento em trânsito — as duas coisas mais caras de sustentar em produção, não de construir. O squad abaixo cobre mobile, backend e o painel do lojista; o risco maior hoje é lançar sem QA dedicado nesse tipo de fluxo.',
      midGroundSuggestion:
        scenario.riskScore > 30
          ? 'Se o orçamento for o problema, mantenha o QA e corte o designer pra meio período — usabilidade dá pra iterar depois do lançamento, bug em pagamento não dá.'
          : undefined,
    },
  }
}
