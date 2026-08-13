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
    const scopeAnalysis = await analyzeScope(input)
    return NextResponse.json({ scopeAnalysis })
  } catch (error) {
    console.error('Erro em /api/analyze', error)
    const message = error instanceof Error ? error.message : 'Erro desconhecido ao analisar o projeto.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
