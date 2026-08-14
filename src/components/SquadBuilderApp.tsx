'use client'

import { useRef, useState } from 'react'
import { AlertCircle, ArrowDown, ArrowRight, HelpCircle } from 'lucide-react'
import { ContractType, NegotiationTurn, ProjectInput, Scenario, ScenarioVersion, ScopeAnalysis } from '@/types'
import { BrandMark } from '@/components/BrandMark'
import { ScopeField, ScopeSeeds, MAX_SCOPE_CHARS, MIN_SCOPE_CHARS } from '@/components/ScopeField'
import { ConstraintFields } from '@/components/ConstraintFields'
import { ReadingGrid } from '@/components/ReadingGrid'
import { DashboardPanel } from '@/components/DashboardPanel'
import { NegotiationChat } from '@/components/NegotiationChat'
import { Eyebrow, PrimaryButton } from '@/components/ui/primitives'
import { buildPreviewScenario } from '@/lib/previewFixtures'
import { MOCK_FIXTURES } from '@/lib/mockFixtures'

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

// Dev-only: ?mock=nome carrega um fixture de borda (squad grande, risco alto, estouro de
// orçamento...) sem gastar cota da API. Ver src/lib/mockFixtures.ts pelos nomes disponíveis.
function getMockFixtureFromUrl(): { scopeAnalysis: ScopeAnalysis; scenario: Scenario } | null {
  if (typeof window === 'undefined' || !SHOW_PREVIEW_BUTTON) return null
  const mockName = new URLSearchParams(window.location.search).get('mock')
  const fixture = mockName ? MOCK_FIXTURES[mockName] : undefined
  return fixture ? fixture() : null
}

/** Campos que a ReadingGrid deixa corrigir manualmente — os únicos que podem ser "editados". */
type EditableScopeField = 'productTypes' | 'platforms' | 'stage' | 'complexity'
type ScopeOverrides = Partial<Pick<ScopeAnalysis, EditableScopeField>>

export function SquadBuilderApp() {
  const scopeFormRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState<ProjectInput>(INITIAL_INPUT)
  // Lazy initializer (não efeito): roda só na primeira renderização, então não dispara o lint de
  // "setState em effect" nem faz o dashboard piscar do vazio pro fixture depois do mount.
  const [initialMock] = useState(getMockFixtureFromUrl)
  // aiScope é sempre a última leitura da IA, intacta. manualOverrides guarda só os campos que o
  // usuário corrigiu na ReadingGrid — sobrevivem a um "Recalcular" que traga uma leitura nova,
  // em vez de serem sobrescritos por ela (revisão externa 2.6: "recálculo nunca reverte escolha
  // manual"). scopeAnalysis é sempre a junção dos dois, nunca guardado direto.
  const [aiScope, setAiScope] = useState<ScopeAnalysis | null>(initialMock?.scopeAnalysis ?? null)
  const [manualOverrides, setManualOverrides] = useState<ScopeOverrides>({})
  const scopeAnalysis = aiScope ? { ...aiScope, ...manualOverrides } : null
  const [scenario, setScenario] = useState<Scenario | null>(initialMock?.scenario ?? null)
  const [versions, setVersions] = useState<ScenarioVersion[]>(() =>
    initialMock ? [{ id: crypto.randomUUID(), label: 'Diagnóstico inicial', ...initialMock, input: INITIAL_INPUT }] : []
  )
  const [activeVersionId, setActiveVersionId] = useState<string | null>(() => versions[0]?.id ?? null)
  const [history, setHistory] = useState<NegotiationTurn[]>([])
  const [analyzeLoading, setAnalyzeLoading] = useState(false)
  const [negotiateLoading, setNegotiateLoading] = useState(false)
  const [recomputeLoading, setRecomputeLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Escopo vago ou fora de domínio: perguntas em vez de squad fabricado sobre nada (revisão
  // externa 2.2/2.3). Não some com scopeAnalysis/scenario anteriores — só some se nunca existiu.
  const [clarification, setClarification] = useState<{
    reason: 'insufficient' | 'out-of-domain'
    questions: string[]
  } | null>(null)
  // A ação que falhou por último — "tentar de novo" reexecuta exatamente ela, em vez de sempre
  // reanalisar do zero (o erro pode ter vindo do chat de negociação ou de um recálculo de chip).
  const [lastFailedAction, setLastFailedAction] = useState<(() => void) | null>(null)
  // Um controller por tipo de ação — cancelar uma não deve abortar as outras se, por algum
  // motivo, mais de uma estiver em voo (revisão externa 2.1: cancelar durante o loading).
  const analyzeAbortRef = useRef<AbortController | null>(null)
  const recomputeAbortRef = useRef<AbortController | null>(null)
  const negotiateAbortRef = useRef<AbortController | null>(null)

  function isAbortError(err: unknown): boolean {
    return err instanceof DOMException && err.name === 'AbortError'
  }

  async function handleAnalyze(descriptionOverride?: string) {
    const nextInput = descriptionOverride !== undefined ? { ...input, description: descriptionOverride } : input
    if (descriptionOverride !== undefined) setInput(nextInput)

    const controller = new AbortController()
    analyzeAbortRef.current = controller
    setAnalyzeLoading(true)
    setError(null)
    setClarification(null)
    // Duas chamadas em sequência, não uma: a leitura de escopo já aparece na tela (chips
    // preenchidos) enquanto o squad ainda está sendo calculado — progresso real, não spinner
    // opaco de 10-30s (ver revisão externa 2.7).
    try {
      const scopeResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextInput),
        signal: controller.signal,
      })
      const scopeData = await parseJsonOrThrow(scopeResponse)
      if (scopeData.needsClarification) {
        setClarification({ reason: scopeData.reason, questions: scopeData.questions })
        return
      }
      const freshScope: ScopeAnalysis = scopeData.scopeAnalysis
      setAiScope(freshScope)
      // Não semeia o chat com o resumo — ele já aparece na seção 03. O histórico de negociação
      // começa vazio e só recebe turnos de ajustes reais (ver revisão externa 1.13).
      setHistory([])

      // manualOverrides continua valendo por cima da leitura nova — se o usuário corrigiu
      // "Complexidade" pra Enterprise, reescrever a descrição e recalcular não deve voltar isso
      // pra Médio nas costas dele.
      const mergedScope = { ...freshScope, ...manualOverrides }
      const scenarioResponse = await fetch('/api/recompute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scopeAnalysis: mergedScope, input: nextInput }),
        signal: controller.signal,
      })
      const scenarioData = await parseJsonOrThrow(scenarioResponse)
      setScenario(scenarioData.scenario)
      // Novo diagnóstico do zero: a lista de versões reinicia — comparar contra negociações de
      // um escopo que não existe mais não faz sentido (revisão externa 3.1).
      const v1: ScenarioVersion = {
        id: crypto.randomUUID(),
        label: 'Diagnóstico inicial',
        scopeAnalysis: mergedScope,
        scenario: scenarioData.scenario,
        input: nextInput,
      }
      setVersions([v1])
      setActiveVersionId(v1.id)
      setLastFailedAction(null)
    } catch (err) {
      if (!isAbortError(err)) {
        setError(err instanceof Error ? err.message : 'Erro ao analisar o projeto.')
        setLastFailedAction(() => () => handleAnalyze())
      }
    } finally {
      setAnalyzeLoading(false)
    }
  }

  /** Só a parte de rede do recálculo — usada por edição de chip, "restaurar" e premissa editável.
   * Aceita um input explícito porque setInput não reflete no `input` fechado nesta função antes
   * do próximo render — passar direto evita recalcular com o valor antigo. */
  async function runRecompute(nextScope: ScopeAnalysis, nextInputForRecompute: ProjectInput = input) {
    const controller = new AbortController()
    recomputeAbortRef.current = controller
    setRecomputeLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/recompute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scopeAnalysis: nextScope, input: nextInputForRecompute }),
        signal: controller.signal,
      })
      const data = await parseJsonOrThrow(response)
      setScenario(data.scenario)
      // Correção de leitura, restauração ou premissa editável atualizam a versão ativa no
      // lugar — não é um pedido de negociação novo, não merece virar uma versão à parte.
      setVersions((prev) =>
        prev.map((v) =>
          v.id === activeVersionId
            ? { ...v, scopeAnalysis: nextScope, scenario: data.scenario, input: nextInputForRecompute }
            : v
        )
      )
      setLastFailedAction(null)
    } catch (err) {
      if (!isAbortError(err)) {
        setError(err instanceof Error ? err.message : 'Erro ao recalcular o squad.')
        setLastFailedAction(() => () => runRecompute(nextScope, nextInputForRecompute))
      }
    } finally {
      setRecomputeLoading(false)
    }
  }

  /** Clique num chip da ReadingGrid: o campo tocado passa a ser "editado à mão" — sobrevive a
   * qualquer leitura futura da IA até o usuário mesmo restaurar (ver handleRestoreField). */
  function handleRecompute(nextScope: ScopeAnalysis, changedField: EditableScopeField) {
    setManualOverrides((prev) => ({ ...prev, [changedField]: nextScope[changedField] }))
    void runRecompute(nextScope)
  }

  /** Premissa editável (revisão externa 3.2): trocar PJ/CLT recalcula de verdade, não só o texto. */
  function handleContractTypeChange(contractType: ContractType) {
    if (!scopeAnalysis) return
    const nextInput = { ...input, contractType }
    setInput(nextInput)
    void runRecompute(scopeAnalysis, nextInput)
  }

  function handleRestoreField(field: EditableScopeField) {
    if (!aiScope) return
    const remainingOverrides = { ...manualOverrides }
    delete remainingOverrides[field]
    setManualOverrides(remainingOverrides)
    void runRecompute({ ...aiScope, ...remainingOverrides })
  }

  async function handleNegotiate(message: string) {
    if (!scopeAnalysis || !scenario) return

    const userTurnId = crypto.randomUUID()
    setHistory((prev) => [...prev, { id: userTurnId, role: 'user', message, timestamp: Date.now() }])
    const controller = new AbortController()
    negotiateAbortRef.current = controller
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
        signal: controller.signal,
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
      // Pedido em linguagem natural vira o rótulo da versão — o que a pessoa está tentando
      // fazer é comparar cenários, não só ler uma resposta e perder o anterior (revisão 3.1).
      const newVersion: ScenarioVersion = {
        id: crypto.randomUUID(),
        label: message,
        scopeAnalysis,
        scenario: data.scenario,
        input: data.input,
      }
      setVersions((prev) => [...prev, newVersion])
      setActiveVersionId(newVersion.id)
      setLastFailedAction(null)
    } catch (err) {
      if (isAbortError(err)) {
        // Cancelado pelo usuário: some com o pedido que ele mesmo desistiu de mandar, em vez de
        // deixar uma mensagem sem resposta pendurada no histórico.
        setHistory((prev) => prev.filter((turn) => turn.id !== userTurnId))
      } else {
        setError(err instanceof Error ? err.message : 'Erro ao renegociar o squad.')
        setLastFailedAction(() => () => handleNegotiate(message))
      }
    } finally {
      setNegotiateLoading(false)
    }
  }

  /** Volta pra uma versão anterior comparável — as demais continuam na lista, nada é descartado. */
  function handleSelectVersion(id: string) {
    const version = versions.find((v) => v.id === id)
    if (!version) return
    setActiveVersionId(id)
    setAiScope(version.scopeAnalysis)
    setManualOverrides({})
    setScenario(version.scenario)
    setInput(version.input)
  }

  function handleRetry() {
    lastFailedAction?.()
  }

  function handlePreview() {
    const { scopeAnalysis: previewScope, scenario: previewScenario } = buildPreviewScenario()
    setAiScope(previewScope)
    setManualOverrides({})
    setScenario(previewScenario)
    setHistory([])
    const v1: ScenarioVersion = {
      id: crypto.randomUUID(),
      label: 'Diagnóstico inicial',
      scopeAnalysis: previewScope,
      scenario: previewScenario,
      input,
    }
    setVersions([v1])
    setActiveVersionId(v1.id)
  }

  const charCount = input.description.trim().length
  const missingChars = MIN_SCOPE_CHARS - charCount
  const scopeOutOfRange = charCount < MIN_SCOPE_CHARS || charCount > MAX_SCOPE_CHARS

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
              Montar meu squad
              <ArrowDown className="size-4" />
            </PrimaryButton>
          </div>
        </section>

        <section ref={scopeFormRef} className="wrap py-12 sm:py-16">
          {/* Duas colunas: texto livre + botão à esquerda (posição original), "Ou parta de" e os
              campos numéricos à direita do textarea, cada grupo numa linha só (sem quebrar 2x2)
              — preenche o vazio que sobrava com conteúdo de verdade, não com centralização. Sem
              teto de largura própria: usa o wrap inteiro, como as seções de baixo, porque agora a
              coluna direita (auto, do tamanho do conteúdo) precisa de espaço real ao lado do texto. */}
          <div>
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

            {clarification && (
              <div className="mt-5 rounded-[7px] border border-ochre/30 bg-ochre/5 px-4 py-3.5 text-sm text-ink">
                <p className="flex items-center gap-2.5 font-medium">
                  <HelpCircle className="size-4 shrink-0 text-ochre" strokeWidth={2} />
                  {clarification.reason === 'out-of-domain'
                    ? 'Isso não parece ser um projeto de software'
                    : 'Preciso de mais detalhe pra estimar com confiança'}
                </p>
                <p className="mt-1.5 text-ink-2">
                  {clarification.reason === 'out-of-domain'
                    ? 'O SquadBuilder dimensiona squads de engenharia de software. Se o seu projeto tem um componente digital (app, site, sistema), descreva essa parte abaixo.'
                    : 'Ainda não dá pra montar um squad com confiança sobre isso — sem detalhe, o número seria só um chute. Responde no texto acima e tenta de novo:'}
                </p>
                <ul className="mt-2 list-disc pl-5 text-ink-2">
                  {clarification.questions.map((question, index) => (
                    <li key={index}>{question}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-5 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_auto]">
              <div>
                <ScopeField
                  value={input.description}
                  onChange={(description) => setInput((prev) => ({ ...prev, description }))}
                  onSubmit={() => {
                    if (!analyzeLoading && !scopeOutOfRange) void handleAnalyze()
                  }}
                  disabled={analyzeLoading}
                />

                <div className="mt-5 flex flex-wrap items-center gap-3.5">
                  <PrimaryButton
                    onClick={() => void handleAnalyze()}
                    disabled={analyzeLoading || scopeOutOfRange}
                    loading={analyzeLoading}
                  >
                    {analyzeLoading ? (
                      scenario ? 'Recalculando…' : 'Montando…'
                    ) : (
                      <>
                        {scenario ? 'Recalcular' : 'Montar squad'}
                        <ArrowRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                      </>
                    )}
                  </PrimaryButton>
                  {analyzeLoading && (
                    <button
                      type="button"
                      onClick={() => analyzeAbortRef.current?.abort()}
                      className="text-[13px] font-medium text-ink-3 underline underline-offset-[3px] hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-petrol focus-visible:outline-offset-2"
                    >
                      Cancelar
                    </button>
                  )}
                  {!analyzeLoading && (
                    <span className={`text-[13px] ${scopeOutOfRange ? 'text-ochre' : 'text-ink-3'}`}>
                      {charCount < MIN_SCOPE_CHARS
                        ? `Faltam ${missingChars} caracteres pra liberar`
                        : charCount > MAX_SCOPE_CHARS
                          ? `${charCount - MAX_SCOPE_CHARS} caracteres acima do limite — reduza pra liberar`
                          : 'Leitura em texto livre, sem formulário'}
                    </span>
                  )}
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

              <div className="flex flex-col gap-6">
                <ScopeSeeds onUseSeed={(text) => void handleAnalyze(text)} disabled={analyzeLoading} />
                <ConstraintFields
                  targetTimelineMonths={input.targetTimelineMonths}
                  monthlyBudget={input.monthlyBudget}
                  onChange={(patch) => setInput((prev) => ({ ...prev, ...patch }))}
                  disabled={analyzeLoading}
                />
              </div>
            </div>
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
            <ReadingGrid
              scope={scopeAnalysis}
              onChange={handleRecompute}
              editedFields={Object.keys(manualOverrides) as EditableScopeField[]}
              onRestoreField={handleRestoreField}
              disabled={recomputeLoading}
            />
          </section>
        )}

        {(analyzeLoading || scenario) && (
          <section className="wrap py-12 sm:py-16">
            <Eyebrow>Squad recomendado</Eyebrow>
            {scenario && (
              <p className="mb-4.5 max-w-[60ch] text-[14.5px] text-ink-2">{scenario.summary}</p>
            )}
            <DashboardPanel
              scenario={scenario}
              loading={analyzeLoading}
              recomputing={recomputeLoading}
              onCancelRecompute={() => recomputeAbortRef.current?.abort()}
              onContractTypeChange={handleContractTypeChange}
            />
            {scenario && (
              <div className="mt-6">
                <NegotiationChat
                  history={history}
                  onSend={handleNegotiate}
                  loading={negotiateLoading}
                  onCancel={() => negotiateAbortRef.current?.abort()}
                  versions={versions}
                  activeVersionId={activeVersionId}
                  onSelectVersion={handleSelectVersion}
                />
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}
