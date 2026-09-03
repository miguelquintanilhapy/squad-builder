import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SquadBuilderApp } from './SquadBuilderApp'
import { baseScenario, baseScope } from '@/lib/testFixtures'

/**
 * Teste de fluxo ponta a ponta (dentro do que o stack atual permite: sem Playwright/navegador
 * real instalado neste projeto, ver CLAUDE.md — Vitest + Testing Library + jsdom é o padrão já
 * estabelecido, estendido aqui pra cobrir o fluxo inteiro em vez de só o motor determinístico).
 * Simula exatamente o roteiro do CLAUDE.md: descrever o projeto -> ver o squad -> negociar um
 * ajuste -> ver a consequência recalculada, com a rede mockada.
 */
describe('SquadBuilderApp — fluxo completo (descrever -> squad -> negociar)', () => {
  const scopeAnalysis = baseScope({ summary: 'App de entregas locais com motos.' })
  const initialScenario = baseScenario({
    riskScore: 25,
    riskLevel: 'low',
    totalMonthlyCost: 32000,
    estimatedTimelineMonths: 4,
    squad: [
      { role: 'dev-mobile', seniority: 'pleno', quantity: 1, allocation: 'full-time', monthlyCostPerPerson: 10000 },
      { role: 'dev-backend', seniority: 'pleno', quantity: 1, allocation: 'full-time', monthlyCostPerPerson: 10000 },
      { role: 'qa', seniority: 'pleno', quantity: 1, allocation: 'full-time', monthlyCostPerPerson: 6000 },
      { role: 'designer-uxui', seniority: 'pleno', quantity: 1, allocation: 'full-time', monthlyCostPerPerson: 6000 },
    ],
  })
  const negotiatedScenario = baseScenario({
    riskScore: 85,
    riskLevel: 'critical',
    totalMonthlyCost: 12000,
    estimatedTimelineMonths: 7,
    squad: [{ role: 'dev-fullstack', seniority: 'senior', quantity: 1, allocation: 'full-time', monthlyCostPerPerson: 12000 }],
  })

  beforeEach(() => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn() as unknown as typeof window.HTMLElement.prototype.scrollIntoView
    global.fetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const path = String(url)
      if (path.includes('/api/analyze')) {
        return new Response(JSON.stringify({ scopeAnalysis }), { status: 200 })
      }
      if (path.includes('/api/recompute')) {
        return new Response(JSON.stringify({ scenario: initialScenario }), { status: 200 })
      }
      if (path.includes('/api/negotiate')) {
        const body = JSON.parse(String(init?.body))
        return new Response(
          JSON.stringify({ input: { ...body.input, description: body.input.description }, scenario: negotiatedScenario }),
          { status: 200 }
        )
      }
      throw new Error(`Rota não mockada: ${path}`)
    }) as unknown as typeof fetch
  })

  it('descreve o projeto, recebe o squad, negocia um ajuste e vê a consequência recalculada', async () => {
    const user = userEvent.setup()
    render(<SquadBuilderApp />)

    const textarea = screen.getByPlaceholderText(/Quero criar um app de entregas locais/i)
    await user.type(
      textarea,
      'Quero criar um aplicativo estilo Uber de entregas locais com motos, pagamentos e rastreamento.'
    )
    await user.click(screen.getByRole('button', { name: /Montar squad/i }))

    // Squad recomendado aparece com os números do cenário inicial. getAllByText, não getByText:
    // o dual-render mobile/desktop (CompositionTable, AllocationChart) deixa esse rótulo
    // duplicado no DOM mesmo que só uma das duas árvores fique visível por vez via CSS.
    expect(await screen.findByText('recomendado')).toBeInTheDocument()
    expect(screen.getAllByText('Custo mensal').length).toBeGreaterThan(0)
    expect(screen.getByText('Risco baixo')).toBeInTheDocument()

    // Negocia um ajuste — mesmo exemplo do CLAUDE.md.
    const negotiationInput = screen.getByPlaceholderText(/Tire o QA e reduza o custo/i)
    await user.type(negotiationInput, 'Tire o QA e o Designer, e coloque só 1 Fullstack.')
    await user.click(screen.getByRole('button', { name: 'Enviar' }))

    // O painel de impacto mostra o risco recalculado — com o número E o rótulo textual (nunca
    // só a cor), e o scroll automático foi disparado (fix do P0 de negociação em mobile/tablet).
    expect(await screen.findByText('Impacto do ajuste')).toBeInTheDocument()
    expect(screen.getByText('85/100')).toBeInTheDocument()
    expect(screen.getByText('Crítico')).toBeInTheDocument()
    await waitFor(() => expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalled())
  })

  it('quando a negociação falha, rola até o erro — bug real reportado: o banner ficava fora da tela, perto do formulário, e a mensagem enviada parecia sem resposta', async () => {
    global.fetch = vi.fn(async (url: string | URL | Request) => {
      const path = String(url)
      if (path.includes('/api/analyze')) return new Response(JSON.stringify({ scopeAnalysis }), { status: 200 })
      if (path.includes('/api/recompute')) return new Response(JSON.stringify({ scenario: initialScenario }), { status: 200 })
      if (path.includes('/api/negotiate')) {
        return new Response(JSON.stringify({ error: 'A IA demorou mais de 30s pra responder. Tenta de novo.' }), {
          status: 500,
        })
      }
      throw new Error(`Rota não mockada: ${path}`)
    }) as unknown as typeof fetch

    const user = userEvent.setup()
    render(<SquadBuilderApp />)
    await user.type(
      screen.getByPlaceholderText(/Quero criar um app de entregas locais/i),
      'Quero criar um aplicativo estilo Uber de entregas locais com motos, pagamentos e rastreamento.'
    )
    await user.click(screen.getByRole('button', { name: /Montar squad/i }))
    expect(await screen.findByText('recomendado')).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText(/Tire o QA e reduza o custo/i), 'Tire o QA.')
    await user.click(screen.getByRole('button', { name: 'Enviar' }))

    expect(await screen.findByText(/demorou mais de 30s/i)).toBeInTheDocument()
    // A mensagem do usuário continua no histórico (não é um cancelamento) — igual ao bug
    // reportado: sem o scroll, ela ficava pendurada ali parecendo "sem resposta".
    expect(screen.getByText('Tire o QA.')).toBeInTheDocument()
    await waitFor(() =>
      expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' })
    )
  })

  it('quando a análise pede esclarecimento, mostra as perguntas em vez de fabricar um squad', async () => {
    global.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({ needsClarification: true, reason: 'insufficient', questions: ['Qual plataforma?'] }),
        { status: 200 }
      )
    ) as unknown as typeof fetch

    const user = userEvent.setup()
    render(<SquadBuilderApp />)
    const textarea = screen.getByPlaceholderText(/Quero criar um app de entregas locais/i)
    await user.type(textarea, 'Quero fazer um sistema, ainda não sei bem o quê.')
    await user.click(screen.getByRole('button', { name: /Montar squad/i }))

    expect(await screen.findByText(/Preciso de mais detalhe/i)).toBeInTheDocument()
    expect(screen.getByText('Qual plataforma?')).toBeInTheDocument()
  })
})
