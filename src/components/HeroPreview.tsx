'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { HERO_DEMO_EXAMPLES } from '@/lib/heroDemoExamples'
import { formatCurrencyBRL } from '@/lib/labels'
import { KpiStrip } from '@/components/KpiStrip'

type Phase = 'typing' | 'chips' | 'kpis' | 'idle'

const CHAR_DELAY_MS = 28
const CHIP_STAGGER_MS = 150
const CYCLE_INTERVAL_MS = 2000

/**
 * Preview do hero que mostra o mecanismo do produto (texto → estrutura → números), não só um
 * resultado congelado — "product is the demo" é o padrão que evita a cara de SaaS genérico
 * (pesquisa de referência). Dados reais do motor determinístico (heroDemoExamples.ts), sem
 * chamar a API.
 */
export function HeroPreview() {
  const reduceMotion = useReducedMotion()
  const [exampleIndex, setExampleIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('typing')
  const [typedChars, setTypedChars] = useState(0)
  const [cycleIndex, setCycleIndex] = useState(0)
  const example = HERO_DEMO_EXAMPLES[exampleIndex]

  // Sequência de entrada: digita a frase, revela os chips inferidos, depois os KPIs — mostra a
  // transformação real (texto → estrutura → números), não um card estático desde o primeiro
  // frame. prefers-reduced-motion pula direto pro estado final, sem digitação nem ciclo.
  useEffect(() => {
    // Todo setState mora dentro de um callback de timer, nunca direto no corpo do effect (mesmo
    // o "reset inicial" com delay 0) — evita o cascading-render que o lint de
    // set-state-in-effect aponta pra setState síncrono na primeira linha do effect.
    const timers: Array<ReturnType<typeof setTimeout>> = []

    if (reduceMotion) {
      timers.push(
        setTimeout(() => {
          setTypedChars(example.typedText.length)
          setPhase('idle')
        }, 0)
      )
    } else {
      timers.push(
        setTimeout(() => {
          setTypedChars(0)
          setPhase('typing')
        }, 0)
      )

      const charInterval = setInterval(() => {
        setTypedChars((prev) => (prev >= example.typedText.length ? prev : prev + 1))
      }, CHAR_DELAY_MS)
      timers.push(charInterval)

      const typingDuration = example.typedText.length * CHAR_DELAY_MS
      timers.push(setTimeout(() => setPhase('chips'), typingDuration + 250))
      timers.push(
        setTimeout(() => setPhase('kpis'), typingDuration + 250 + example.chips.length * CHIP_STAGGER_MS + 300)
      )
      timers.push(
        setTimeout(
          () => setPhase('idle'),
          typingDuration + 250 + example.chips.length * CHIP_STAGGER_MS + 300 + 700
        )
      )
    }

    return () => {
      timers.forEach((timer) => {
        clearTimeout(timer)
        clearInterval(timer)
      })
    }
  }, [exampleIndex, reduceMotion, example.typedText, example.chips.length])

  // Ciclo sutil entre os 4 KPIs, só depois que a sequência de entrada termina — dá sensação de
  // "isso está sendo calculado" sem competir com a animação de entrada.
  useEffect(() => {
    if (phase !== 'idle' || reduceMotion) return
    const cycle = setInterval(() => setCycleIndex((prev) => (prev + 1) % 4), CYCLE_INTERVAL_MS)
    return () => clearInterval(cycle)
  }, [phase, reduceMotion])

  const headcount = example.scenario.squad.reduce((sum, m) => sum + m.quantity, 0)
  const wordCount = example.typedText.trim().split(/\s+/).length
  const showChips = phase === 'chips' || phase === 'kpis' || phase === 'idle'
  const showKpis = phase === 'kpis' || phase === 'idle'

  return (
    <div className="w-full max-w-[540px]">
      <div className="rounded-[7px] bg-paper-3 p-5 text-left shadow-[var(--shadow-raised)]">
        <p className="mb-3 text-[12px] font-medium text-ink-3">Exemplo de resultado</p>

        {/* Frase "digitada" — mostra o mecanismo (texto livre entrando), não só o resultado. */}
        <p className="min-h-[40px] font-display text-[15px] leading-snug text-ink">
          {example.typedText.slice(0, typedChars)}
          {phase === 'typing' && (
            <span aria-hidden="true" className="ml-0.5 inline-block h-[14px] w-[2px] animate-pulse bg-petrol" />
          )}
        </p>

        {/* Chips inferidos — mesma linguagem visual do ReadingGrid real (petrol, seleção). */}
        <div className="mt-2.5 flex min-h-[26px] flex-wrap gap-1.5">
          <AnimatePresence>
            {showChips &&
              example.chips.map((chip, index) => (
                <motion.span
                  key={`${example.id}-${chip}`}
                  initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: reduceMotion ? 0 : (index * CHIP_STAGGER_MS) / 1000 }}
                  className="rounded-full border border-petrol bg-petrol px-2.5 py-[3px] text-[11.5px] font-medium text-paper-2"
                >
                  {chip}
                </motion.span>
              ))}
          </AnimatePresence>
        </div>

        {/* KPIs — só depois que a leitura "termina", mesma ordem do fluxo real do produto. */}
        <div className="mt-3 min-h-[86px]">
          <AnimatePresence>
            {showKpis && (
              <motion.div
                key={example.id}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
              >
                <KpiStrip scenario={example.scenario} compact activeIndex={phase === 'idle' ? cycleIndex : undefined} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Prova concreta (pesquisa de referência: outcome específico, não promessa vaga) — o
          número vem do mesmo exemplo mostrado acima, não é estatística solta. */}
      <p className="mt-2.5 text-[12.5px] text-ink-3">
        Squad de {headcount} pessoas, {formatCurrencyBRL(example.scenario.totalMonthlyCost)}/mês — calculado a partir
        de {wordCount} palavras de descrição.
      </p>

      {/* Troca de exemplo — o hero passa de demonstração passiva pra algo que reage ao clique. */}
      <div className="mt-2 flex gap-1.5">
        {HERO_DEMO_EXAMPLES.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setExampleIndex(index)}
            aria-pressed={index === exampleIndex}
            className={`rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-colors ${
              index === exampleIndex
                ? 'border-petrol bg-petrol/10 text-petrol'
                : 'border-rule text-ink-3 hover:border-ink-3 hover:text-ink-2'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
