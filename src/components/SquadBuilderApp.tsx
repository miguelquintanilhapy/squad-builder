'use client'

import { useState } from 'react'
import { AlertCircle, ArrowRight } from 'lucide-react'
import { NegotiationTurn, ProjectInput, Scenario, ScopeAnalysis } from '@/types'
import { BrandMark } from '@/components/BrandMark'
import { ScopeField, MIN_SCOPE_CHARS } from '@/components/ScopeField'
import { ConstraintFields } from '@/components/ConstraintFields'
import { ReadingGrid } from '@/components/ReadingGrid'
import { DashboardPanel } from '@/components/DashboardPanel'
import { NegotiationChat } from '@/components/NegotiationChat'
import { Eyebrow, PrimaryButton } from '@/components/ui/primitives'

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
  const [recomputeLoading, setRecomputeLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // A ação que falhou por último — "tentar de novo" reexecuta exatamente ela, em vez de sempre
  // reanalisar do zero (o erro pode ter vindo do chat de negociação ou de um recálculo de chip).
  const [lastFailedAction, setLastFailedAction] = useState<(() => void) | null>(null)

  async function handleAnalyze(descriptionOverride?: string) {
    const nextInput = descriptionOverride !== undefined ? { ...input, description: descriptionOverride } : input
    if (descriptionOverride !== undefined) setInput(nextInput)

    setAnalyzeLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextInput),
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
      setLastFailedAction(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao analisar o projeto.')
      setLastFailedAction(() => () => handleAnalyze())
    } finally {
      setAnalyzeLoading(false)
    }
  }

  async function handleRecompute(nextScope: ScopeAnalysis) {
    setScopeAnalysis(nextScope)
    setRecomputeLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/recompute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scopeAnalysis: nextScope, input }),
      })
      const data = await parseJsonOrThrow(response)
      setScenario(data.scenario)
      setLastFailedAction(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao recalcular o squad.')
      setLastFailedAction(() => () => handleRecompute(nextScope))
    } finally {
      setRecomputeLoading(false)
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
      setLastFailedAction(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao renegociar o squad.')
      setLastFailedAction(() => () => handleNegotiate(message))
    } finally {
      setNegotiateLoading(false)
    }
  }

  function handleRetry() {
    lastFailedAction?.()
  }

  const charCount = input.description.trim().length
  const missingChars = MIN_SCOPE_CHARS - charCount

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink-2">
      <header className="app-header border-b border-rule">
        <div className="wrap flex items-center justify-between gap-3.5 py-5">
          <div className="flex items-baseline gap-[11px]">
            <BrandMark />
            <span className="font-display text-[19px] font-extrabold tracking-[-0.03em] text-ink">
              SquadBuilder
            </span>
            <span className="text-[13px] text-ink-3">escopo → squad</span>
          </div>
          <span className="text-[12.5px] text-ink-3">Copiloto de dimensionamento de squads</span>
        </div>
      </header>

      <main className="flex-1">
        <section className="wrap py-8 sm:py-10">
          <div className="max-w-[760px]">
            <Eyebrow index="01">Escopo</Eyebrow>
            <h1 className="max-w-[20ch] font-display text-[clamp(30px,4.6vw,46px)] font-bold leading-[1.02] tracking-[-0.035em] text-ink">
              Descreva o produto. O resto a gente <span className="text-petrol">deduz</span>.
            </h1>
            <p className="mt-2.5 max-w-[56ch] text-base text-ink-2">
              Escreva como você explicaria pra um tech lead novo no time — em texto corrido, sem
              formulário. A partir daí montamos o squad, o custo mensal, o prazo e os riscos.
            </p>

            {error && (
              <div className="mt-5 flex items-center justify-between gap-3.5 rounded-[3px] border border-rust/30 bg-rust/5 px-4 py-3 text-sm text-rust">
                <span className="flex items-center gap-2.5">
                  <AlertCircle className="size-4 shrink-0" strokeWidth={2} />
                  {error}
                </span>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="shrink-0 font-medium underline underline-offset-[3px] hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-petrol focus-visible:outline-offset-2"
                >
                  Tentar de novo
                </button>
              </div>
            )}

            <div className="mt-5">
              <ScopeField
                value={input.description}
                onChange={(description) => setInput((prev) => ({ ...prev, description }))}
                onUseSeed={(text) => void handleAnalyze(text)}
                disabled={analyzeLoading}
              />
            </div>

            <div className="mt-5">
              <ConstraintFields
                targetTimelineMonths={input.targetTimelineMonths}
                monthlyBudget={input.monthlyBudget}
                onChange={(patch) => setInput((prev) => ({ ...prev, ...patch }))}
                disabled={analyzeLoading}
              />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3.5">
              <PrimaryButton
                onClick={() => void handleAnalyze()}
                disabled={analyzeLoading || charCount < MIN_SCOPE_CHARS}
                loading={analyzeLoading}
              >
                {analyzeLoading ? (
                  'Lendo escopo…'
                ) : (
                  <>
                    {scenario ? 'Reler escopo' : 'Ler escopo e montar squad'}
                    <ArrowRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                  </>
                )}
              </PrimaryButton>
              <span className={`text-[13px] ${charCount < MIN_SCOPE_CHARS ? 'text-ochre' : 'text-ink-3'}`}>
                {charCount < MIN_SCOPE_CHARS
                  ? `Faltam ${missingChars} caracteres pra liberar`
                  : 'Leitura em texto livre, sem formulário'}
              </span>
            </div>
          </div>
        </section>

        {scopeAnalysis && (
          <section className="wrap border-t border-rule py-8 sm:py-10">
            <Eyebrow index="02">O que entendemos</Eyebrow>
            <h2 className="font-display text-[26px] font-bold leading-none tracking-[-0.025em] text-ink">
              Leitura do escopo
            </h2>
            <p className="mt-1.5 mb-4.5 max-w-[60ch] text-[14.5px] text-ink-2">
              Inferido do seu texto. Clique pra corrigir — o squad recalcula na hora.
            </p>
            <ReadingGrid scope={scopeAnalysis} onChange={handleRecompute} disabled={recomputeLoading} />
          </section>
        )}

        {(analyzeLoading || scenario) && (
          <section className="wrap border-t border-rule py-8 sm:py-10">
            <Eyebrow index="03">Squad recomendado</Eyebrow>
            {scenario && (
              <p className="mb-4.5 max-w-[60ch] text-[14.5px] text-ink-2">{scenario.summary}</p>
            )}
            <DashboardPanel scenario={scenario} loading={analyzeLoading} />
            {scenario && (
              <div className="mt-6">
                <NegotiationChat history={history} onSend={handleNegotiate} loading={negotiateLoading} />
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}
