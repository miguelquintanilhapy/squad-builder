import { NextResponse } from 'next/server'
import { ProjectInput } from '@/types'
import { extractProposedSquad, narrateScenario } from '@/lib/gemini'
import { computeScenario } from '@/lib/calculator'
import { InvalidRequestError, NegotiateRequestSchema, parseJsonBody, validateBody } from '@/lib/apiValidation'

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody(request)
    const { scopeAnalysis, input, currentSquad, userMessage } = validateBody(NegotiateRequestSchema, body, 'negotiate')

    const proposal = await extractProposedSquad({ scope: scopeAnalysis, input, currentSquad, userMessage })

    const updatedInput: ProjectInput = {
      ...input,
      targetTimelineMonths: proposal.targetTimelineMonths ?? input.targetTimelineMonths,
      monthlyBudget: proposal.targetMonthlyBudget ?? input.monthlyBudget,
    }

    const scenario = computeScenario(proposal.squad, scopeAnalysis, updatedInput)
    const { summary, midGroundSuggestion } = await narrateScenario({
      scope: scopeAnalysis,
      input: updatedInput,
      scenario,
      userMessage,
    })

    return NextResponse.json({
      input: updatedInput,
      scenario: { ...scenario, summary, midGroundSuggestion },
    })
  } catch (error) {
    if (error instanceof InvalidRequestError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('Erro em /api/negotiate', error)
    const message = error instanceof Error ? error.message : 'Erro desconhecido ao renegociar o squad.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
