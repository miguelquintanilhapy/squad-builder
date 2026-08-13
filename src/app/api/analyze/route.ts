import { NextResponse } from 'next/server'
import { ProjectInput } from '@/types'
import { analyzeScope } from '@/lib/gemini'

/**
 * Só a leitura de escopo (1ª das 3 chamadas do fluxo). O squad/custo/prazo/risco + narração
 * ficam pro /api/recompute — o cliente chama os dois em sequência e já renderiza os chips
 * assim que este resolve, em vez de esperar tudo pra mostrar o primeiro pedaço (ver revisão
 * externa 2.7: "progresso real, não teatro").
 */
export async function POST(request: Request) {
  const input = (await request.json()) as ProjectInput

  if (!input.description?.trim()) {
    return NextResponse.json({ error: 'Descrição do projeto é obrigatória.' }, { status: 400 })
  }

  try {
    const result = await analyzeScope(input)
    if (!result.ok) {
      // Escopo vago ou fora de domínio: devolve perguntas em vez de números fabricados sobre
      // nada (revisão externa 2.2/2.3) — status 200 porque não é erro, é um resultado válido.
      return NextResponse.json({ needsClarification: true, reason: result.reason, questions: result.questions })
    }
    return NextResponse.json({ scopeAnalysis: result.scopeAnalysis })
  } catch (error) {
    console.error('Erro em /api/analyze', error)
    const message = error instanceof Error ? error.message : 'Erro desconhecido ao analisar o projeto.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
