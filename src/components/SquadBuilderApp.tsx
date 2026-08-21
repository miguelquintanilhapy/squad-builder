'use client'

import { useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { AlertCircle, ArrowRight, FileText, Handshake, HelpCircle, Home, LayoutDashboard } from 'lucide-react'
import { ContractType, NegotiationTurn, ProjectInput, RoleType, Scenario, ScenarioVersion, ScopeAnalysis } from '@/types'
import { BrandMark } from '@/components/BrandMark'
import { CommandMenu, type CommandMenuItem } from '@/components/CommandMenu'
import { ScopeField, ScopeSeeds, MAX_SCOPE_CHARS, MIN_SCOPE_CHARS } from '@/components/ScopeField'
import { ConstraintFields } from '@/components/ConstraintFields'
import { ReadingGrid } from '@/components/ReadingGrid'
import { DashboardPanel } from '@/components/DashboardPanel'
import { NegotiationChat } from '@/components/NegotiationChat'
import { HeroPreview } from '@/components/HeroPreview'
import { HeroShader } from '@/components/HeroShader'
import { useToasts, ToastStack } from '@/components/Toast'
import { Eyebrow, PrimaryButton } from '@/components/ui/primitives'
import { buildPreviewScenario } from '@/lib/previewFixtures'
import { MOCK_FIXTURES } from '@/lib/mockFixtures'
import { formatCurrencyBRL, formatMonthsLabel } from '@/lib/labels'
import { describeNegotiationImpactCompact } from '@/lib/negotiationImpact'
import { suggestMinimalSquad } from '@/lib/squadPlanner'
import { computeScenario } from '@/lib/calculator'

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
  /** Assim que o squad calculado chega, rola até aqui — sem isso, o resultado aparecia fora da
   * tela sem nenhum aviso de que a análise tinha terminado. */
  const resultsRef = useRef<HTMLDivElement>(null)
  /** Referência da seção de negociação — permite pular direto pra ela sem rolar a página inteira. */
  const negotiationRef = useRef<HTMLDivElement>(null)
  // A entrada do hero anima no mount, não no scroll — é a primeira coisa visível na página, antes
  // de qualquer rolagem. É o único bloco que usa animate="show" em vez de whileInView; as demais
  // seções revelam ao entrar na tela (scroll-reveal).
  const reduceMotion = useReducedMotion()
  const { toasts, showToast } = useToasts()
  const heroContainerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: reduceMotion ? 0 : 0.18, delayChildren: 0.1 } },
  }
  // Anima da esquerda pra direita, não de baixo pra cima — combina com o texto alinhado à
  // esquerda, numa coluna ao lado do preview.
  const heroItemVariants = {
    hidden: { opacity: 0, x: reduceMotion ? 0 : -20 },
    show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] as const } },
  }
  // O preview converge do lado oposto (direita) — as duas colunas se encontram no centro.
  const heroPreviewVariants = {
    hidden: { opacity: 0, x: reduceMotion ? 0 : 20 },
    show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] as const } },
  }
  // Scroll-reveal (mesmo padrão do DashboardPanel): revela quando a seção entra na tela, não no
  // mount.
  const groupVariants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] as const } },
  }
  const [input, setInput] = useState<ProjectInput>(INITIAL_INPUT)
  // Lazy initializer (não efeito): roda só na primeira renderização, então não dispara o lint de
  // "setState em effect" nem faz o dashboard piscar do vazio pro fixture depois do mount.
  const [initialMock] = useState(getMockFixtureFromUrl)
  // aiScope é sempre a última leitura da IA, intacta. manualOverrides guarda só os campos
  // corrigidos manualmente na ReadingGrid — sobrevivem a um "Recalcular" que traga uma leitura
  // nova, em vez de serem sobrescritos por ela. scopeAnalysis é sempre a junção dos dois, nunca
  // guardado direto.
  const [aiScope, setAiScope] = useState<ScopeAnalysis | null>(initialMock?.scopeAnalysis ?? null)
  const [manualOverrides, setManualOverrides] = useState<ScopeOverrides>({})
  const scopeAnalysis = aiScope ? { ...aiScope, ...manualOverrides } : null
  const [scenario, setScenario] = useState<Scenario | null>(initialMock?.scenario ?? null)
  // Cenário contrafactual: "e se eu não puder pagar o squad recomendado?" — 1 pessoa por cargo de
  // engenharia exigido, sem nenhum papel de apoio. Puramente client-side (mesmo motor
  // determinístico, sem chamar a API) — sempre disponível, sem custo de rede nem de LLM.
  const [dashboardView, setDashboardView] = useState<'recommended' | 'minimal'>('recommended')
  const minimalScenario = scopeAnalysis ? computeScenario(suggestMinimalSquad(scopeAnalysis), scopeAnalysis, input) : null
  const [versions, setVersions] = useState<ScenarioVersion[]>(() =>
    initialMock ? [{ id: crypto.randomUUID(), label: 'Diagnóstico inicial', ...initialMock, input: INITIAL_INPUT }] : []
  )
  const [activeVersionId, setActiveVersionId] = useState<string | null>(() => versions[0]?.id ?? null)
  const [history, setHistory] = useState<NegotiationTurn[]>([])
  const [analyzeLoading, setAnalyzeLoading] = useState(false)
  const [negotiateLoading, setNegotiateLoading] = useState(false)
  const [recomputeLoading, setRecomputeLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Escopo vago ou fora de domínio: perguntas em vez de um squad fabricado sobre nada. Não
  // substitui scopeAnalysis/scenario anteriores — só existe se nunca houve uma análise concluída.
  const [clarification, setClarification] = useState<{
    reason: 'insufficient' | 'out-of-domain'
    questions: string[]
  } | null>(null)
  // A ação que falhou por último — "tentar de novo" reexecuta exatamente ela, em vez de sempre
  // reanalisar do zero (o erro pode ter vindo do chat de negociação ou de um recálculo de chip).
  const [lastFailedAction, setLastFailedAction] = useState<(() => void) | null>(null)
  // Um controller por tipo de ação — cancelar uma não deve abortar as outras se mais de uma
  // estiver em voo.
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
    // Duas chamadas em sequência, não uma: a leitura de escopo aparece na tela (chips
    // preenchidos) enquanto o squad ainda está sendo calculado — progresso real, não um spinner
    // opaco por 10-30s.
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
      // O histórico de negociação começa vazio e só recebe turnos de ajustes reais — o resumo do
      // escopo já aparece na seção de entendimento do projeto, não precisa ser repetido no chat.
      setHistory([])

      // manualOverrides continua valendo por cima da leitura nova — uma correção manual de campo
      // (ex.: Complexidade para Enterprise) não deve ser revertida silenciosamente por um novo
      // recálculo.
      const mergedScope = { ...freshScope, ...manualOverrides }
      const scenarioResponse = await fetch('/api/recompute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scopeAnalysis: mergedScope, input: nextInput }),
        signal: controller.signal,
      })
      const scenarioData = await parseJsonOrThrow(scenarioResponse)
      setScenario(scenarioData.scenario)
      // Sem isso, o squad calculado aparecia fora da tela sem nenhum aviso de que a análise
      // tinha terminado. rAF espera o React trocar o skeleton pelo conteúdo real antes de medir
      // a posição de scroll.
      requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
      // Novo diagnóstico do zero: a lista de versões reinicia — comparar contra negociações de
      // um escopo que não existe mais não faz sentido.
      const v1: ScenarioVersion = {
        id: crypto.randomUUID(),
        label: 'Squad recomendado inicialmente',
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
  async function runRecompute(
    nextScope: ScopeAnalysis,
    nextInputForRecompute: ProjectInput = input,
    successMessage = 'Squad recalculado'
  ) {
    const controller = new AbortController()
    recomputeAbortRef.current = controller
    setRecomputeLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/recompute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // currentSquad preserva o squad já negociado — sem isso, o endpoint regeneraria um squad
        // do zero a cada correção de chip/premissa, descartando a negociação em andamento.
        body: JSON.stringify({ scopeAnalysis: nextScope, input: nextInputForRecompute, currentSquad: scenario?.squad }),
        signal: controller.signal,
      })
      const data = await parseJsonOrThrow(response)
      setScenario(data.scenario)
      // Correção de leitura, restauração ou premissa editável atualizam a versão ativa no
      // lugar — não é uma negociação nova, não gera uma versão separada.
      setVersions((prev) =>
        prev.map((v) =>
          v.id === activeVersionId
            ? { ...v, scopeAnalysis: nextScope, scenario: data.scenario, input: nextInputForRecompute }
            : v
        )
      )
      setLastFailedAction(null)
      showToast(successMessage)
    } catch (err) {
      if (!isAbortError(err)) {
        setError(err instanceof Error ? err.message : 'Erro ao recalcular o squad.')
        setLastFailedAction(() => () => runRecompute(nextScope, nextInputForRecompute, successMessage))
      }
    } finally {
      setRecomputeLoading(false)
    }
  }

  /** Clique num chip da ReadingGrid: o campo tocado passa a ser "editado à mão" — sobrevive a
   * qualquer leitura futura da IA até ser restaurado explicitamente (ver handleRestoreField). */
  function handleRecompute(nextScope: ScopeAnalysis, changedField: EditableScopeField) {
    setManualOverrides((prev) => ({ ...prev, [changedField]: nextScope[changedField] }))
    void runRecompute(nextScope, input, 'Escopo atualizado')
  }

  /** Trocar o tipo de contrato (PJ/CLT) recalcula o cenário de verdade, não só atualiza o texto. */
  function handleContractTypeChange(contractType: ContractType) {
    if (!scopeAnalysis) return
    const nextInput = { ...input, contractType }
    setInput(nextInput)
    void runRecompute(scopeAnalysis, nextInput, 'Modelo de contratação atualizado')
  }

  /** Corrigir o custo de referência de um papel recalcula o cenário de verdade — é o que separa
   * calculadora de adivinhação. */
  function handleRateOverrideChange(role: RoleType, monthlyRate: number) {
    if (!scopeAnalysis) return
    const nextInput = { ...input, rateOverrides: { ...input.rateOverrides, [role]: monthlyRate } }
    setInput(nextInput)
    void runRecompute(scopeAnalysis, nextInput, 'Premissa salva')
  }

  function handleRestoreField(field: EditableScopeField) {
    if (!aiScope) return
    const remainingOverrides = { ...manualOverrides }
    delete remainingOverrides[field]
    setManualOverrides(remainingOverrides)
    void runRecompute({ ...aiScope, ...remainingOverrides }, input, 'Campo restaurado')
  }

  async function handleNegotiate(message: string) {
    if (!scopeAnalysis || !scenario) return

    const previousScenario = scenario
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
          // Consequência curta no histórico do chat, não a narração completa — essa já aparece no
          // painel de Impacto, então repetir a frase inteira aqui seria redundante.
          message: describeNegotiationImpactCompact(data.scenario, previousScenario),
          scenarioSnapshot: data.scenario,
          timestamp: Date.now(),
        },
      ])
      // A mensagem em linguagem natural vira o rótulo da versão — permite comparar cenários
      // negociados lado a lado, não só ler a resposta mais recente e perder o histórico.
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
      showToast('Ajuste aplicado')
    } catch (err) {
      if (isAbortError(err)) {
        // Cancelamento: remove a mensagem cujo envio foi desistido, em vez de deixá-la pendurada
        // no histórico sem resposta.
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
  const scopeOutOfRange = charCount < MIN_SCOPE_CHARS || charCount > MAX_SCOPE_CHARS

  function scrollToScopeForm() {
    scopeFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function scrollToHero() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function scrollToResults() {
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function scrollToNegotiation() {
    negotiationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Reusa os mesmos handlers do nav do header — o command menu é um segundo caminho pros mesmos
  // destinos, não uma lista de ações paralela.
  const commandItems: CommandMenuItem[] = [
    { id: 'hero', label: 'Início', icon: <Home className="size-3.5 text-ink-3" />, onSelect: scrollToHero },
    { id: 'form', label: 'Formulário', icon: <FileText className="size-3.5 text-ink-3" />, onSelect: scrollToScopeForm },
    ...(analyzeLoading || scenario
      ? [
          {
            id: 'results',
            label: 'Resultado',
            icon: <LayoutDashboard className="size-3.5 text-ink-3" />,
            onSelect: scrollToResults,
          },
        ]
      : []),
    ...(scenario
      ? [
          {
            id: 'negotiation',
            label: 'Negociação',
            icon: <Handshake className="size-3.5 text-ink-3" />,
            onSelect: scrollToNegotiation,
          },
        ]
      : []),
  ]

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink-2">
      {/* Shader WebGL monocromático de fundo, fixed atrás de toda a interface (não só do hero) —
          acompanha o scroll sem repintar e nunca captura clique (pointer-events-none). Fica em
          z-0; todo o conteúdo abaixo usa "relative z-10" por cima dele, mais confiável entre
          navegadores do que dar z-index negativo ao próprio canvas. */}
      <HeroShader />
      <div className="relative z-10 flex min-h-screen flex-1 flex-col">
        {/* Contexto ("SquadBuilder <projeto>") só aparece quando já existe uma análise — mostra a
            descrição já digitada, truncada, como orientação de em qual projeto/etapa a pessoa
            está. Sem borda embaixo. */}
        <header className="app-header">
        <div className="wrap flex items-center justify-between gap-3.5 py-5">
          <div className="flex items-baseline gap-[11px]">
            {/* Clicar no wordmark volta pro hero — mesmo padrão de qualquer site: logo é sempre
                "voltar ao início". */}
            <button
              type="button"
              onClick={scrollToHero}
              className="flex items-baseline gap-[11px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-petrol focus-visible:outline-offset-2"
            >
              {/* translate-y: o SVG usa items-baseline (alinha pela borda inferior da própria
                  caixa), mas o desenho do medidor termina bem antes dessa borda — sem o nudge, o
                  ícone parece "flutuar" acima da base do S. */}
              <BrandMark className="translate-y-2" />
              <span className="font-display text-[19px] font-extrabold tracking-[-0.03em] text-ink">
                SquadBuilder
              </span>
            </button>
            {scenario && (
              <span className="max-w-[320px] truncate text-[14px] text-ink-2">{input.description}</span>
            )}
          </div>
          {/* Nav de etapas: navegação real entre seções, não um stepper passivo — encurta a
              distância de rolagem entre a negociação e o resultado. */}
          <nav className="hidden items-center gap-5 text-[13px] font-medium text-ink-3 md:flex">
            <button type="button" onClick={scrollToScopeForm} className="hover:text-ink">
              Formulário
            </button>
            {(analyzeLoading || scenario) && (
              <button type="button" onClick={scrollToResults} className="hover:text-ink">
                Resultado
              </button>
            )}
            {scenario && (
              <button type="button" onClick={scrollToNegotiation} className="hover:text-ink">
                Negociação
              </button>
            )}
          </nav>
          {/* Resumo sticky: os números-chave continuam visíveis rolando a página, mesmo depois
              que o KpiStrip já saiu da tela. */}
          {scenario ? (
            <span className="tnum text-[12.5px] font-medium text-ink">
              Squad de {scenario.squad.reduce((sum, m) => sum + m.quantity, 0)} pessoas ·{' '}
              {formatCurrencyBRL(scenario.totalMonthlyCost)}/mês · {formatMonthsLabel(scenario.estimatedTimelineMonths)}
            </span>
          ) : (
            <span className="text-[12.5px] text-ink-3">Copiloto para dimensionamento de squads</span>
          )}
        </div>
      </header>

      <main className="flex-1">
        {/* Primeira coisa que a pessoa vê: frase de impacto centralizada, não o formulário direto
            — abrir já em campo de texto/inputs lia como pouco profissional. min-h-screen (mais a
            altura do header) garante que nada da seção de escopo apareça sem rolar ou clicar. */}
        <motion.section
          variants={heroContainerVariants}
          initial="hidden"
          animate="show"
          className="flex min-h-[calc(100vh-72px)] items-center pt-10 pb-24"
        >
          {/* Duas colunas: texto à esquerda, preview à direita — evita empurrar o hero pra baixo
              com um card abaixo do texto. Empilha em telas estreitas. */}
          <div className="wrap grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_540px] lg:gap-14">
            <div className="text-left">
              <motion.h1
                variants={heroItemVariants}
                className="max-w-[20ch] font-display text-[clamp(48px,8.5vw,88px)] font-bold leading-[1.02] tracking-[-0.035em] text-ink"
              >
                Descreva seu projeto.
                <br />Monte o <span className="text-petrol">squad</span> ideal.
              </motion.h1>
              <motion.p variants={heroItemVariants} className="mt-4 max-w-[56ch] text-lg text-ink-2">
                Conte o que você quer construir. O SquadBuilder estima equipe, custo e prazo.
              </motion.p>
              <motion.div variants={heroItemVariants} className="mt-6">
                <PrimaryButton onClick={scrollToScopeForm} type="button">
                  Descrever meu projeto
                  <ArrowRight className="size-4" />
                </PrimaryButton>
              </motion.div>
            </div>
            {/* Preview que mostra o mecanismo do produto (texto → chips → números), não um
                resultado congelado — segue o padrão "o produto é a demo" em vez de um card
                estático genérico. Entra da direita, convergindo com o texto. */}
            <motion.div variants={heroPreviewVariants} className="w-full">
              <HeroPreview />
            </motion.div>
          </div>
        </motion.section>

        {/* scroll-mt: compensa o header sticky — sem isso, scrollIntoView encosta o topo da seção
            embaixo dele. pb reduzido: espaço grande demais entre o formulário e "Entendimento do
            projeto" lia como se faltasse uma seção entre as duas. */}
        <section ref={scopeFormRef} className="wrap scroll-mt-20 pt-12 pb-8 sm:pt-16 sm:pb-10">
          {/* Duas colunas: texto livre + botão à esquerda, "Ou parta de" e os campos numéricos à
              direita do textarea, cada grupo numa linha só. Sem teto de largura própria: usa o
              wrap inteiro, como as seções abaixo, já que a coluna direita (largura automática)
              precisa de espaço real ao lado do texto. */}
          <motion.div variants={groupVariants} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
            <Eyebrow>Descreva seu projeto</Eyebrow>

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
                  Tentar novamente
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
                      'Calculando squad...'
                    ) : (
                      <>
                        {scenario ? 'Atualizar estimativa' : 'Montar squad'}
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
                        ? 'Descreva o produto, funcionalidades principais, tecnologias utilizadas e prazo desejado.'
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
                    // Sublinhado tracejado, não sólido — sinaliza que isso é ferramenta de
                    // dev/debug, categoria diferente de "Editar premissas" etc.
                    className="mt-3.5 text-[12.5px] text-ink-3 underline decoration-dashed underline-offset-[3px] hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-petrol focus-visible:outline-offset-2"
                  >
                    Carregar exemplo
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
          </motion.div>
        </section>

        {scopeAnalysis && (
          <section className="wrap pt-8 pb-12 sm:pt-10 sm:pb-16">
            <h2 className="font-display text-[26px] font-bold leading-none tracking-[-0.025em] text-ink">
              Entendimento do projeto
            </h2>
            <p className="mt-1.5 mb-4.5 max-w-[60ch] text-[14.5px] text-ink-2">
              Com base na sua descrição, identificamos os seguintes requisitos. Revise qualquer item antes de gerar
              novamente.
            </p>
            <ReadingGrid
              scope={scopeAnalysis}
              onChange={handleRecompute}
              editedFields={Object.keys(manualOverrides) as EditableScopeField[]}
              onRestoreField={handleRestoreField}
              disabled={recomputeLoading || analyzeLoading}
            />
          </section>
        )}

        {(analyzeLoading || scenario) && (
          <section ref={resultsRef} className="wrap scroll-mt-20 py-12 sm:py-16">
            {/* O squad é o "produto" que a pessoa veio buscar — título no mesmo peso visual do h1,
                maior que o Eyebrow das outras seções. Anima assim que o resultado chega,
                reforçando o scroll automático até aqui. */}
            <motion.h2
              key={scenario ? 'ready' : 'loading'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
              className="text-center font-display text-[clamp(34px,4.5vw,52px)] font-bold leading-[1.05] tracking-[-0.03em] text-ink"
            >
              <span className="text-petrol">Squad</span> recomendado
            </motion.h2>
            {/* Sempre renderizado (mesmo vazio durante o skeleton) — a margem não pode depender
                do conteúdo, senão o espaço antes do dashboard pisca de tamanho ao carregar. */}
            <p className="mx-auto mb-8 mt-3 max-w-[60ch] text-center text-[14.5px] text-ink-2">
              {scenario &&
                'Com base no escopo identificado, esta é a composição de equipe estimada para entregar o projeto dentro do prazo informado.'}
            </p>
            {scenario && minimalScenario && (
              <div role="radiogroup" aria-label="Visão do squad" className="mb-6 flex justify-center gap-1.5">
                <button
                  type="button"
                  role="radio"
                  aria-checked={dashboardView === 'recommended'}
                  onClick={() => setDashboardView('recommended')}
                  className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                    dashboardView === 'recommended'
                      ? 'border-petrol bg-petrol text-paper-2'
                      : 'border-ink-3 text-ink-2 hover:border-ink'
                  }`}
                >
                  Recomendado
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={dashboardView === 'minimal'}
                  onClick={() => setDashboardView('minimal')}
                  className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                    dashboardView === 'minimal'
                      ? 'border-petrol bg-petrol text-paper-2'
                      : 'border-ink-3 text-ink-2 hover:border-ink'
                  }`}
                >
                  Mínimo viável ·{' '}
                  {minimalScenario.squad.reduce((sum, m) => sum + m.quantity, 0)} pessoas
                </button>
              </div>
            )}
            <DashboardPanel
              scenario={dashboardView === 'recommended' ? scenario : minimalScenario}
              loading={analyzeLoading}
              recomputing={dashboardView === 'recommended' && recomputeLoading}
              onCancelRecompute={dashboardView === 'recommended' ? () => recomputeAbortRef.current?.abort() : undefined}
              onContractTypeChange={dashboardView === 'recommended' ? handleContractTypeChange : undefined}
              rateOverrides={input.rateOverrides}
              onRateOverrideChange={dashboardView === 'recommended' ? handleRateOverrideChange : undefined}
            />
            {scenario && (
              <div ref={negotiationRef} className="scroll-mt-20 mt-12">
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
      <CommandMenu items={commandItems} />
      <ToastStack toasts={toasts} />
    </div>
  )
}
