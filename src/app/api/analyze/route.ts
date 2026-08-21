import { NextResponse } from 'next/server'
import { analyzeScope } from '@/lib/gemini'
import { AnalyzeRequestSchema, InvalidRequestError, parseJsonBody, validateBody } from '@/lib/apiValidation'

/**
 * Só a leitura de escopo (1ª das 3 chamadas do fluxo). O squad/custo/prazo/risco + narração
 * ficam pro /api/recompute — o cliente chama os dois em sequência e já renderiza os chips
 * assim que este resolve, progresso real em vez de esperar tudo pra mostrar o primeiro pedaço.
 */
export async function POST(request: Request) {
  try {
    const body = await parseJsonBody(request)
    const input = validateBody(AnalyzeRequestSchema, body, 'analyze')

    if (!input.description.trim()) {
      return NextResponse.json({ error: 'Descrição do projeto é obrigatória.' }, { status: 400 })
    }

    const result = await analyzeScope(input)
    if (!result.ok) {
      // Escopo vago ou fora de domínio: devolve perguntas em vez de números fabricados sobre
      // nada — status 200 porque não é erro, é um resultado válido.
      return NextResponse.json({ needsClarification: true, reason: result.reason, questions: result.questions })
    }
    return NextResponse.json({ scopeAnalysis: result.scopeAnalysis })
  } catch (error) {
    if (error instanceof InvalidRequestError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('Erro em /api/analyze', error)
    const message = error instanceof Error ? error.message : 'Erro desconhecido ao analisar o projeto.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
