import { ComplexityLevel, Platform, ProductType, ProjectStage, RiskLevel, RoleType, SeniorityLevel } from '@/types'

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  'web-app': 'Web App',
  'mobile-app': 'Mobile App',
  desktop: 'Desktop',
  'api-backend': 'API/Backend',
  'saas-b2b': 'SaaS B2B',
  marketplace: 'Marketplace',
}

export const PLATFORM_LABELS: Record<Platform, string> = {
  ios: 'iOS',
  android: 'Android',
  web: 'Web Browser',
  'multi-platform': 'Multi-plataforma',
}

export const STAGE_LABELS: Record<ProjectStage, string> = {
  idea: 'Ideia no Papel',
  prototype: 'Protótipo/Figma',
  'mvp-running': 'MVP rodando',
  'legacy-product': 'Produto Legado',
}

export const COMPLEXITY_LABELS: Record<ComplexityLevel, string> = {
  low: 'Baixo',
  medium: 'Médio',
  enterprise: 'Enterprise',
}

export const ROLE_LABELS: Record<RoleType, string> = {
  'dev-frontend': 'Dev Front-end',
  'dev-backend': 'Dev Back-end',
  'dev-fullstack': 'Dev Fullstack',
  'dev-mobile': 'Dev Mobile',
  'designer-uxui': 'Designer UX/UI',
  qa: 'QA',
  devops: 'DevOps',
  'tech-lead': 'Tech Lead',
  'product-manager': 'Product Manager',
  'data-engineer': 'Data Engineer',
  'security-specialist': 'Especialista em Segurança',
}

export const SENIORITY_LABELS: Record<SeniorityLevel, string> = {
  junior: 'Júnior',
  pleno: 'Pleno',
  senior: 'Sênior',
}

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  low: 'Baixo',
  medium: 'Médio',
  high: 'Alto',
  critical: 'Crítico',
}

export function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

/** pt-BR usa vírgula como separador decimal (2,3, não 2.3) — nunca interpola número direto no JSX. */
export function formatNumberPtBR(value: number): string {
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
}

/**
 * Inverso de formatCurrencyBRL: aceita notação pt-BR (ponto = milhar, vírgula = decimal) em vez
 * de Number() cru. Number("8.000") vira 8 (oito) — achado de code review: um input editável de
 * custo corrigia silenciosamente pra um valor absurdo porque "8.000" é decimal válido em en-US.
 */
export function parseCurrencyPtBR(raw: string): number {
  const normalized = raw
    .trim()
    .replace(/[^\d,.-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
  const value = Number(normalized)
  return Number.isFinite(value) ? Math.round(value) : NaN
}

/**
 * O prazo estimado (pessoa-mês / capacidade) não tem precisão de dia — "2,3 meses" comunica uma
 * exatidão que o modelo não tem. Mostra faixa (piso–teto) em vez de decimal; se a faixa colapsa
 * num inteiro, mostra só o inteiro. Todo derivado do prazo (investimento total, custo por papel
 * no período) usa monthsRange pra herdar a mesma faixa, não o ponto médio.
 */
export function monthsRange(months: number): { lower: number; upper: number } {
  return { lower: Math.floor(months), upper: Math.ceil(months) }
}

export function formatMonthsLabel(months: number): string {
  const { lower, upper } = monthsRange(months)
  if (lower === upper) return `${lower} ${lower === 1 ? 'mês' : 'meses'}`
  return `${lower} a ${upper} meses`
}

/** Só os dígitos da faixa, sem "meses" — pra usar como valor grande de KPI com o sufixo separado. */
export function formatMonthsCompact(months: number): string {
  const { lower, upper } = monthsRange(months)
  return lower === upper ? `${lower}` : `${lower}–${upper}`
}

/** Mesmo valor multiplicado pelos dois extremos da faixa de prazo — nunca pelo ponto médio cru. */
export function formatCurrencyRangeBRL(monthlyValue: number, months: number): string {
  const { lower, upper } = monthsRange(months)
  if (lower === upper) return formatCurrencyBRL(monthlyValue * lower)
  return `${formatCurrencyBRL(monthlyValue * lower)} – ${formatCurrencyBRL(monthlyValue * upper)}`
}
