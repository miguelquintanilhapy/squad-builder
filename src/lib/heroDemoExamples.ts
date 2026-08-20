import { ProjectInput, Scenario, ScopeAnalysis } from '@/types'
import { COMPLEXITY_LABELS, PRODUCT_TYPE_LABELS, STAGE_LABELS } from './labels'
import { suggestInitialSquad } from './squadPlanner'
import { computeScenario } from './calculator'

export interface HeroDemoExample {
  id: string
  /** Rótulo curto pro botão de alternância entre exemplos. */
  label: string
  /** Frase curta pro efeito de "digitação" no hero — não o texto completo do seed (esse levaria
   * ~6s pra digitar), mas continua sendo a frase real usada pra calcular o squad abaixo, então a
   * prova concreta que aparece depois ("calculado a partir de N palavras") não é inventada. */
  typedText: string
  chips: string[]
  scenario: Scenario
}

function buildExample(label: string, typedText: string, scope: ScopeAnalysis, input: ProjectInput): HeroDemoExample {
  const squad = suggestInitialSquad(scope, input)
  const scenario = computeScenario(squad, scope, input)
  const chips = [...scope.productTypes.map((t) => PRODUCT_TYPE_LABELS[t]), STAGE_LABELS[scope.stage], COMPLEXITY_LABELS[scope.complexity]]
  return { id: label, label, typedText, chips, scenario }
}

const DELIVERY_SCOPE: ScopeAnalysis = {
  productTypes: ['mobile-app', 'web-app'],
  platforms: ['ios', 'android', 'web'],
  stage: 'idea',
  complexity: 'medium',
  estimatedEffortPersonMonths: 14,
  requiredCapabilities: ['realtime-tracking', 'payments', 'admin-panel', 'geolocation'],
  keyRisksNoted: [],
  summary:
    'App de entregas locais com motos: pedido e pagamento in-app, rastreamento em tempo real do motoboy, painel web pro lojista e repasse automático pros entregadores.',
}

const DELIVERY_INPUT: ProjectInput = {
  productTypes: DELIVERY_SCOPE.productTypes,
  platforms: DELIVERY_SCOPE.platforms,
  stage: DELIVERY_SCOPE.stage,
  complexity: DELIVERY_SCOPE.complexity,
  targetTimelineMonths: 6,
  monthlyBudget: 45000,
  description:
    'Um app de entregas locais com motos. O cliente pede pelo celular, paga no app com pix ou cartão e acompanha o motoboy no mapa em tempo real. Precisa de um painel web pro lojista acompanhar pedidos e de repasse automático pros entregadores.',
}

const MARKETPLACE_SCOPE: ScopeAnalysis = {
  productTypes: ['saas-b2b', 'marketplace'],
  platforms: ['web'],
  stage: 'idea',
  complexity: 'medium',
  estimatedEffortPersonMonths: 10,
  requiredCapabilities: ['admin-panel', 'third-party-integrations'],
  keyRisksNoted: [],
  summary:
    'Marketplace B2B: indústrias cadastram catálogo, distribuidores compram por atacado, com permissões por empresa e integração com ERP.',
}

const MARKETPLACE_INPUT: ProjectInput = {
  productTypes: MARKETPLACE_SCOPE.productTypes,
  platforms: MARKETPLACE_SCOPE.platforms,
  stage: MARKETPLACE_SCOPE.stage,
  complexity: MARKETPLACE_SCOPE.complexity,
  targetTimelineMonths: 5,
  monthlyBudget: 35000,
  description:
    'Um marketplace B2B onde indústrias cadastram catálogo e distribuidores compram por atacado. Cada empresa tem vários usuários com permissões diferentes, tabela de preço negociada e integração com o ERP do cliente pra emitir nota fiscal.',
}

/**
 * Duas variações reais (não texto/número inventado) pro hero alternar — mesmo motor
 * determinístico do resto do app (squadPlanner + calculator), sem chamar a API do Gemini.
 */
export const HERO_DEMO_EXAMPLES: HeroDemoExample[] = [
  buildExample(
    'Entregas com motos',
    'App de entregas locais com motos, pagamento no app e rastreamento em tempo real do motoboy.',
    DELIVERY_SCOPE,
    DELIVERY_INPUT
  ),
  buildExample(
    'Marketplace B2B',
    'Marketplace B2B: indústrias vendem por atacado pra distribuidores, com permissões por empresa.',
    MARKETPLACE_SCOPE,
    MARKETPLACE_INPUT
  ),
]
