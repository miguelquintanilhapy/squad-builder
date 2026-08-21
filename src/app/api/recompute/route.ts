import { NextResponse } from 'next/server'
import { narrateScenario } from '@/lib/gemini'
import { suggestInitialSquad } from '@/lib/squadPlanner'
import { computeScenario } from '@/lib/calculator'
import { InvalidRequestError, parseJsonBody, RecomputeRequestSchema, validateBody } from '@/lib/apiValidation'
import { enforceRateLimit, RateLimitError } from '@/lib/rateLimiter'

/**
 * Recalcula custo/prazo/risco a partir de uma leitura de escopo já editada pelo usuário (chips
 * da ReadingGrid) ou de uma premissa corrigida (PJ/CLT, custo por papel) — a IA só é usada aqui
 * pra renarrar o resumo do novo cenário. Endpoint aditivo: não substitui /api/analyze nem
 * /api/negotiate.
 */
export async function POST(request: Request) {
  try {
    enforceRateLimit(request)
    const body = await parseJsonBody(request)
    // currentSquad presente reusa o squad já negociado — sem isso, qualquer recálculo de
    // premissa (chip da ReadingGrid, PJ/CLT, custo editável) geraria um squad novo do zero e
    // descartaria em silêncio o que já foi negociado por chat.
    const { scopeAnalysis, input, currentSquad } = validateBody(RecomputeRequestSchema, body, 'recompute')

    const squad = currentSquad?.length ? currentSquad : suggestInitialSquad(scopeAnalysis, input)
    const scenario = computeScenario(squad, scopeAnalysis, input)
    const { summary, midGroundSuggestion } = await narrateScenario({ scope: scopeAnalysis, input, scenario })

    return NextResponse.json({
      scenario: { ...scenario, summary, midGroundSuggestion },
    })
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ error: error.message }, { status: 429, headers: { 'Retry-After': String(error.retryAfterSeconds) } })
    }
    if (error instanceof InvalidRequestError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('Erro em /api/recompute', error)
    const message = error instanceof Error ? error.message : 'Erro desconhecido ao recalcular o squad.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
