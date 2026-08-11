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
