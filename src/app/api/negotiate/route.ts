import { NextResponse } from 'next/server'
import { ProjectInput, ScopeAnalysis, SquadMember } from '@/types'
import { extractProposedSquad, narrateScenario } from '@/lib/gemini'
import { computeScenario } from '@/lib/calculator'

interface NegotiateRequestBody {
  scopeAnalysis: ScopeAnalysis
  input: ProjectInput
  currentSquad: SquadMember[]
  userMessage: string
}

export async function POST(request: Request) {
  const body = (await request.json()) as NegotiateRequestBody
  const { scopeAnalysis, input, currentSquad, userMessage } = body

  if (!userMessage?.trim()) {
    return NextResponse.json({ error: 'Mensagem vazia.' }, { status: 400 })
  }

  try {
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
    console.error('Erro em /api/negotiate', error)
    const message = error instanceof Error ? error.message : 'Erro desconhecido ao renegociar o squad.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
