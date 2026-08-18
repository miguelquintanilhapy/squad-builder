import { RoleType, SquadMember } from '@/types'
import { ROLE_LABELS } from './labels'

// Palavras-chave por papel pra casar contra o texto livre da narração — não é NLP de verdade,
// é a heurística mínima que a revisão externa pede (3.10): detectar "sem X"/"falta X" quando X
// já está na composição, sem depender do modelo se autocorrigir.
const ROLE_KEYWORDS: Record<RoleType, string[]> = {
  'dev-frontend': ['front-end', 'frontend', 'front end'],
  'dev-backend': ['back-end', 'backend', 'back end'],
  'dev-fullstack': ['fullstack', 'full-stack', 'full stack'],
  'dev-mobile': ['mobile'],
  'designer-uxui': ['designer', 'design dedicado', 'ux/ui', 'ux dedicado'],
  qa: ['qa', 'teste dedicado', 'testes dedicado', 'quality assurance'],
  devops: ['devops'],
  'tech-lead': ['tech lead', 'lideranca tecnica'],
  'product-manager': ['product manager', 'gestao de produto'],
  'data-engineer': ['data engineer', 'engenharia de dados'],
  'security-specialist': ['seguranca dedicada', 'especialista em seguranca', 'security'],
}

const ABSENCE_PATTERN = /\b(?:sem|falta|faltando|nao ha|nao tem|ausencia de)\s+([a-z0-9çãõáéíóúâêôü/ -]{2,40})/g

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

/**
 * Verifica se `text` afirma a ausência de um papel que está presente em `squad` — ex: a
 * narração diz "sem QA dedicado" enquanto a composição já inclui 1x QA. O pipeline está correto
 * (a narração recebe o scenario fechado), então isso é o modelo contradizendo o próprio contexto,
 * não erro de dados — a única defesa hoje é essa checagem pós-geração (revisão externa 3.10).
 */
export function findNarrativeContradiction(text: string, squad: SquadMember[]): RoleType | null {
  const normalizedText = normalize(text)
  const absenceMatches = [...normalizedText.matchAll(ABSENCE_PATTERN)]
  if (!absenceMatches.length) return null

  const presentRoles = new Set(squad.filter((m) => m.quantity > 0).map((m) => m.role))

  for (const role of presentRoles) {
    const keywords = ROLE_KEYWORDS[role].map(normalize)
    if (absenceMatches.some((match) => keywords.some((kw) => match[1].includes(kw)))) {
      return role
    }
  }
  return null
}

/** Remove só as frases que contradizem a composição, preservando o resto do parágrafo. */
export function removeContradictingSentences(summary: string, squad: SquadMember[]): string {
  const sentences = summary.split(/(?<=[.!?])\s+/).filter(Boolean)
  const kept = sentences.filter((sentence) => !findNarrativeContradiction(sentence, squad))
  if (!kept.length) return summary
  return kept.join(' ').trim()
}

export function describeContradiction(role: RoleType): string {
  return ROLE_LABELS[role]
}
