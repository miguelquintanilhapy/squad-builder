import { NextResponse } from 'next/server'
import { ProjectInput } from '@/types'
import { analyzeScope, narrateScenario } from '@/lib/gemini'
import { suggestInitialSquad } from '@/lib/squadPlanner'
import { computeScenario } from '@/lib/calculator'

export async function POST(request: Request) {
  const input = (await request.json()) as ProjectInput

  if (!input.description?.trim()) {
    return NextResponse.json({ error: 'Descrição do projeto é obrigatória.' }, { status: 400 })
  }

  try {
    const scopeAnalysis = await analyzeScope(input)
    const squad = suggestInitialSquad(scopeAnalysis, input)
    const scenario = computeScenario(squad, scopeAnalysis, input)
    const { summary, midGroundSuggestion } = await narrateScenario({ scope: scopeAnalysis, input, scenario })

    return NextResponse.json({
      scopeAnalysis,
      scenario: { ...scenario, summary, midGroundSuggestion },
    })
  } catch (error) {
    console.error('Erro em /api/analyze', error)
    const message = error instanceof Error ? error.message : 'Erro desconhecido ao analisar o projeto.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
