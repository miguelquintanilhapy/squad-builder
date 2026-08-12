'use client'

import { useRef, useState } from 'react'
import { AlertCircle, ArrowDown, ArrowRight } from 'lucide-react'
import { NegotiationTurn, ProjectInput, Scenario, ScopeAnalysis } from '@/types'
import { BrandMark } from '@/components/BrandMark'
import { ScopeField, MIN_SCOPE_CHARS } from '@/components/ScopeField'
import { ConstraintFields } from '@/components/ConstraintFields'
import { ReadingGrid } from '@/components/ReadingGrid'
import { DashboardPanel } from '@/components/DashboardPanel'
import { NegotiationChat } from '@/components/NegotiationChat'
import { Eyebrow, PrimaryButton } from '@/components/ui/primitives'
import { buildPreviewScenario } from '@/lib/previewFixtures'

const SHOW_PREVIEW_BUTTON = process.env.NODE_ENV !== 'production'

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
  const scopeFormRef = useRef<HTMLDivElement>(null)
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
      // Não semeia o chat com o resumo — ele já aparece na seção 03. O histórico de negociação
      // começa vazio e só recebe turnos de ajustes reais (ver revisão externa 1.13).
      setHistory([])
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

  function handlePreview() {
    const { scopeAnalysis: previewScope, scenario: previewScenario } = buildPreviewScenario()
    setScopeAnalysis(previewScope)
    setScenario(previewScenario)
    setHistory([])
  }

  const charCount = input.description.trim().length
  const missingChars = MIN_SCOPE_CHARS - charCount

  function scrollToScopeForm() {
    scopeFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink-2">
      {/* Contexto tipo breadcrumb ("SquadBuilder / <projeto>") só quando já existe uma análise —
          orientação visual (onde estou, em qual projeto), não funcionalidade nova: é a mesma
          descrição que o usuário já escreveu, só truncada. Sem borda embaixo (briefing §4/§8). */}
      <header className="app-header">
        <div className="wrap flex items-center justify-between gap-3.5 py-5">
          <div className="flex items-baseline gap-[11px]">
            <BrandMark />
            <span className="font-display text-[19px] font-extrabold tracking-[-0.03em] text-ink">
              SquadBuilder
            </span>
            {scenario && (
              <>
                <span className="text-ink-3">/</span>
                <span className="max-w-[320px] truncate text-[14px] text-ink-2">{input.description}</span>
              </>
            )}
          </div>
          <span className="text-[12.5px] text-ink-3">Copiloto de dimensionamento de squads</span>
        </div>
      </header>

      <main className="flex-1">
        {/* Primeira coisa que a pessoa vê: frase de impacto centralizada, não o formulário direto
            — abrir já em campo de texto/inputs lia como pouco profissional. min-h-screen (mais a
            altura do header) garante que nada da seção de escopo apareça sem rolar ou clicar. */}
        <section className="wrap flex min-h-[calc(100vh-72px)] flex-col items-center justify-center pt-10 pb-24 text-center">
          <h1 className="max-w-[20ch] font-display text-[clamp(48px,8.5vw,88px)] font-bold leading-[1.02] tracking-[-0.035em] text-ink">
            Descreva o produto.
            <br />Receba o <span className="text-petrol">squad</span>.
          </h1>
          <p className="mt-4 max-w-[56ch] text-lg text-ink-2">
            Escreva como você explicaria pra um tech lead novo no time — em texto corrido, sem
            formulário. A partir daí montamos o squad, o custo mensal, o prazo e os riscos.
          </p>
          <div className="mt-8">
            <PrimaryButton onClick={scrollToScopeForm} type="button">
              Começar
              <ArrowDown className="size-4" />
            </PrimaryButton>
          </div>
        </section>

        <section ref={scopeFormRef} className="wrap py-12 sm:py-16">
          {/* Mais largo que os 760px originais (fechava demais frente ao container de 1680px das
              outras seções — ver revisão externa 1.14), mas sem ir pra largura total: textarea e
              inputs não têm a mesma justificativa de tabela/gráfico pra ocupar a tela inteira. */}
          <div className="max-w-[960px]">
            <Eyebrow>Escopo</Eyebrow>

            {error && (
              <div className="mt-5 flex items-center justify-between gap-3.5 rounded-[7px] border border-rust/30 bg-rust/5 px-4 py-3 text-sm text-rust">
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
                onSubmit={() => {
                  if (!analyzeLoading && charCount >= MIN_SCOPE_CHARS) void handleAnalyze()
                }}
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
                  scenario ? 'Recalculando…' : 'Dimensionando…'
                ) : (
                  <>
                    {scenario ? 'Recalcular' : 'Dimensionar squad'}
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

            {SHOW_PREVIEW_BUTTON && (
              <button
                type="button"
                onClick={handlePreview}
                className="mt-3.5 text-[12.5px] text-ink-3 underline underline-offset-[3px] hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-petrol focus-visible:outline-offset-2"
              >
                Dev: ver com dados de exemplo (sem chamar a API)
              </button>
            )}
          </div>
        </section>

        {scopeAnalysis && (
          <section className="wrap py-12 sm:py-16">
            <Eyebrow>O que entendemos</Eyebrow>
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
          <section className="wrap py-12 sm:py-16">
            <Eyebrow>Squad recomendado</Eyebrow>
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
