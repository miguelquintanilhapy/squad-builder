'use client'

import { useState } from 'react'
import { AlertCircle, Blocks } from 'lucide-react'
import { NegotiationTurn, ProjectInput, Scenario, ScopeAnalysis } from '@/types'
import { InputPanel } from '@/components/InputPanel'
import { DashboardPanel } from '@/components/DashboardPanel'
import { NegotiationChat } from '@/components/NegotiationChat'

const INITIAL_INPUT: ProjectInput = {
  productTypes: [],
  platforms: [],
  stage: 'idea',
  complexity: 'medium',
  description: '',
}

async function parseJsonOrThrow(response: Response) {
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error ?? 'Erro inesperado.')
  }
  return data
}

export function SquadBuilderApp() {
  const [input, setInput] = useState<ProjectInput>(INITIAL_INPUT)
  const [scopeAnalysis, setScopeAnalysis] = useState<ScopeAnalysis | null>(null)
  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [history, setHistory] = useState<NegotiationTurn[]>([])
  const [analyzeLoading, setAnalyzeLoading] = useState(false)
  const [negotiateLoading, setNegotiateLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAnalyze() {
    setAnalyzeLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const data = await parseJsonOrThrow(response)
      setScopeAnalysis(data.scopeAnalysis)
      setScenario(data.scenario)
      setHistory([
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          message: data.scenario.summary,
          scenarioSnapshot: data.scenario,
          timestamp: Date.now(),
        },
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao analisar o projeto.')
    } finally {
      setAnalyzeLoading(false)
    }
  }

  async function handleNegotiate(message: string) {
    if (!scopeAnalysis || !scenario) return

    setHistory((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: 'user', message, timestamp: Date.now() },
    ])
    setNegotiateLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/negotiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scopeAnalysis,
          input,
          currentSquad: scenario.squad,
          userMessage: message,
        }),
      })
      const data = await parseJsonOrThrow(response)
      setInput(data.input)
      setScenario(data.scenario)
      setHistory((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          message: data.scenario.summary,
          scenarioSnapshot: data.scenario,
          timestamp: Date.now(),
        },
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao renegociar o squad.')
    } finally {
      setNegotiateLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-border-subtle bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1800px] items-center justify-between px-8 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-md bg-accent text-white">
              <Blocks className="size-4" strokeWidth={2.25} />
            </span>
            <span className="font-display text-sm font-bold tracking-tight text-foreground">SquadBuilder</span>
          </div>
          <span className="text-xs text-muted">Copiloto de IA para dimensionar squads de engenharia</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1800px] flex-1 px-8 py-12">
        {error && (
          <div className="animate-fade-slide-in mb-8 flex items-center gap-2.5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="size-4 shrink-0" strokeWidth={2} />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
          <div className="flex flex-col gap-10 lg:border-r lg:border-border-subtle lg:pr-16">
            <InputPanel value={input} onChange={setInput} onSubmit={handleAnalyze} loading={analyzeLoading} />
            {scenario && (
              <NegotiationChat history={history} onSend={handleNegotiate} loading={negotiateLoading} />
            )}
          </div>

          <DashboardPanel scenario={scenario} loading={analyzeLoading} />
        </div>
      </main>
    </div>
  )
}
