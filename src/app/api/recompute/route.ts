import { NextResponse } from 'next/server'
import { ProjectInput, ScopeAnalysis, SquadMember } from '@/types'
import { narrateScenario } from '@/lib/gemini'
import { suggestInitialSquad } from '@/lib/squadPlanner'
import { computeScenario } from '@/lib/calculator'

interface RecomputeRequestBody {
  scopeAnalysis: ScopeAnalysis
  input: ProjectInput
  /** Squad atual (negociado ou não). Ausente só no primeiro diagnóstico, que ainda não tem
   * squad — nesse caso gera um novo. Presente, reusa-o: sem isso, qualquer recálculo de premissa
   * (chip da ReadingGrid, PJ/CLT, custo editável) chamaria suggestInitialSquad de novo e
   * descartaria em silêncio um squad já negociado por chat. */
  currentSquad?: SquadMember[]
}

/**
 * Recalcula custo/prazo/risco a partir de uma leitura de escopo já editada pelo usuário (chips
 * da ReadingGrid) ou de uma premissa corrigida (PJ/CLT, custo por papel) — a IA só é usada aqui
 * pra renarrar o resumo do novo cenário. Endpoint aditivo: não substitui /api/analyze nem
 * /api/negotiate.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as RecomputeRequestBody
  const { scopeAnalysis, input, currentSquad } = body

  if (!scopeAnalysis) {
    return NextResponse.json({ error: 'Leitura de escopo é obrigatória.' }, { status: 400 })
  }

  try {
    const squad = currentSquad?.length ? currentSquad : suggestInitialSquad(scopeAnalysis, input)
    const scenario = computeScenario(squad, scopeAnalysis, input)
    const { summary, midGroundSuggestion } = await narrateScenario({ scope: scopeAnalysis, input, scenario })

    return NextResponse.json({
      scenario: { ...scenario, summary, midGroundSuggestion },
    })
  } catch (error) {
    console.error('Erro em /api/recompute', error)
    const message = error instanceof Error ? error.message : 'Erro desconhecido ao recalcular o squad.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
