import { useEffect, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { Scenario } from '@/types'
import {
  ROLE_LABELS,
  SENIORITY_LABELS,
  formatCurrencyBRL,
  formatCurrencyRangeBRL,
  formatMonthsLabel,
} from '@/lib/labels'
import { ALLOCATION_CAPACITY_MULTIPLIER } from '@/lib/rates'

const numCellClasses = 'min-[760px]:w-32 px-[15px] py-3 text-right tnum'
const numHeadClasses = 'min-[760px]:w-32 px-[15px] py-[9px] text-right text-[12.5px] font-medium text-ink-3'

/** Nome do papel — a linha/card inteiro é que é clicável (ver RoleCard e a <tr> na tabela), isso
 * só renderiza o texto. */
function RoleName({ member }: { member: Scenario['squad'][number] }) {
  return (
    <span className="font-semibold text-ink">
      {member.quantity}x {ROLE_LABELS[member.role]}
      {' — '}
      <span className="font-normal text-[12.5px] text-ink-3">{SENIORITY_LABELS[member.seniority]}</span>
    </span>
  )
}

/** onKeyDown compartilhado por linha/card clicável: Enter e Espaço ativam, igual um botão. */
function handleActivateKey(onActivate: () => void) {
  return (e: ReactKeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onActivate()
    }
  }
}

function RoleCard({
  member,
  timelineMonths,
  onSelect,
}: {
  member: Scenario['squad'][number]
  timelineMonths: number
  onSelect: () => void
}) {
  const allocationPct = Math.round(ALLOCATION_CAPACITY_MULTIPLIER[member.allocation] * 100)
  const perPerson = member.monthlyCostPerPerson ?? 0
  const monthlyCost = perPerson * member.quantity

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={handleActivateKey(onSelect)}
      className="cursor-pointer rounded-[7px] border border-rule-2 bg-paper-3 p-3.5 transition-colors hover:border-ink-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-petrol focus-visible:outline-offset-2"
    >
      <RoleName member={member} />
      <dl className="mt-2.5 grid grid-cols-3 gap-2 text-[13px]">
        <div>
          <dt className="text-[11.5px] text-ink-3">Dedicação</dt>
          <dd className="tnum mt-0.5 text-ink">{allocationPct}%</dd>
        </div>
        <div>
          <dt className="text-[11.5px] text-ink-3">Custo mensal</dt>
          <dd className="tnum mt-0.5 text-ink">{formatCurrencyBRL(monthlyCost)}</dd>
        </div>
        <div>
          <dt className="text-[11.5px] text-ink-3">Custo Estimado</dt>
          <dd className="tnum mt-0.5 text-ink">{formatCurrencyRangeBRL(monthlyCost, timelineMonths)}</dd>
        </div>
      </dl>
    </div>
  )
}

/**
 * Modal suave, não painel expandido no mesmo lugar (feedback do usuário) — backdrop + card
 * entram com fade/scale via Motion. Fecha por clique fora, Esc ou botão de fechar.
 */
function RoleDetailModal({ member, onClose }: { member: Scenario['squad'][number] | null; onClose: () => void }) {
  useEffect(() => {
    if (!member) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [member, onClose])

  return (
    <AnimatePresence>
      {member && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`${ROLE_LABELS[member.role]} — ${SENIORITY_LABELS[member.seniority]}`}
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[420px] rounded-[7px] bg-paper-3 p-5 shadow-[var(--shadow-raised)]"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold text-ink">
                {member.quantity}x {ROLE_LABELS[member.role]} — {SENIORITY_LABELS[member.seniority]}
              </p>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className="shrink-0 rounded-full p-1 text-ink-3 hover:bg-paper hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-petrol focus-visible:outline-offset-2"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-ink-2">
              {member.justification ?? 'Sem justificativa detalhada disponível para este papel.'}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function CompositionTable({ scenario }: { scenario: Scenario }) {
  const totalHeadcount = scenario.squad.reduce((sum, m) => sum + m.quantity, 0)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const selectedMember = selectedIndex !== null ? scenario.squad[selectedIndex] ?? null : null

  return (
    <>
      {/* Abaixo de 640px a tabela não cabe sem rolagem horizontal, que é fácil de não notar
          num card já cheio de números — reflow pra card por papel em vez disso. */}
      <div className="flex flex-col gap-2.5 sm:hidden">
        {scenario.squad.map((member, index) => (
          <RoleCard
            key={`${member.role}-${index}`}
            member={member}
            timelineMonths={scenario.estimatedTimelineMonths}
            onSelect={() => setSelectedIndex(index)}
          />
        ))}
        <div className="rounded-[7px] border border-rule-2 bg-paper p-3.5 text-[13.5px] font-semibold text-ink">
          {totalHeadcount} pessoas no squad
          <dl className="mt-2.5 grid grid-cols-3 gap-2 text-[13px] font-normal">
            <div>
              <dt className="text-[11.5px] text-ink-3">Prazo</dt>
              <dd className="tnum mt-0.5 text-ink">{formatMonthsLabel(scenario.estimatedTimelineMonths)}</dd>
            </div>
            <div>
              <dt className="text-[11.5px] text-ink-3">Custo mensal</dt>
              <dd className="tnum mt-0.5 text-ink">{formatCurrencyBRL(scenario.totalMonthlyCost)}</dd>
            </div>
            <div>
              <dt className="text-[11.5px] text-ink-3">Custo Estimado</dt>
              <dd className="tnum mt-0.5 text-ink">
                {formatCurrencyRangeBRL(scenario.totalMonthlyCost, scenario.estimatedTimelineMonths)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[560px] border-collapse text-[14.5px]">
          <thead>
            <tr className="border-b border-rule-2">
              <th scope="col" className="px-[15px] py-[9px] text-left text-[12.5px] font-medium text-ink-3">
                Profissional
              </th>
              <th scope="col" className={numHeadClasses}>
                Dedicação
              </th>
              <th scope="col" className={numHeadClasses}>
                Custo mensal
              </th>
              <th scope="col" className={numHeadClasses}>
                Custo Estimado
              </th>
            </tr>
          </thead>
          <tbody>
            {scenario.squad.map((member, index) => {
              const allocationPct = Math.round(ALLOCATION_CAPACITY_MULTIPLIER[member.allocation] * 100)
              const perPerson = member.monthlyCostPerPerson ?? 0
              const monthlyCost = perPerson * member.quantity
              return (
                // Sem linha por papel — a separação vem do padding generoso e do hover, não de
                // borda (briefing §4/§18: reduzir bordas pesadas e linhas excessivas em tabela).
                // A linha inteira abre o modal da justificativa, não só o nome do papel.
                <tr
                  key={`${member.role}-${index}`}
                  tabIndex={0}
                  onClick={() => setSelectedIndex(index)}
                  onKeyDown={handleActivateKey(() => setSelectedIndex(index))}
                  className="cursor-pointer hover:bg-paper focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-petrol"
                >
                  <td className="px-[15px] py-3 text-ink">
                    <RoleName member={member} />
                  </td>
                  <td className={numCellClasses}>{allocationPct}%</td>
                  <td className={numCellClasses}>
                    {member.quantity > 1 ? (
                      <>
                        {formatCurrencyBRL(perPerson)}/pessoa
                        <span className="text-ink-3"> · {formatCurrencyBRL(monthlyCost)}/mês</span>
                      </>
                    ) : (
                      formatCurrencyBRL(monthlyCost)
                    )}
                  </td>
                  <td className={numCellClasses}>{formatCurrencyRangeBRL(monthlyCost, scenario.estimatedTimelineMonths)}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-rule-2 bg-paper font-semibold">
              <td className="px-[15px] py-3">{totalHeadcount} pessoas no squad</td>
              <td className={numCellClasses}>{formatMonthsLabel(scenario.estimatedTimelineMonths)}</td>
              <td className={numCellClasses}>{formatCurrencyBRL(scenario.totalMonthlyCost)}</td>
              <td className={numCellClasses}>
                {formatCurrencyRangeBRL(scenario.totalMonthlyCost, scenario.estimatedTimelineMonths)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Observação discreta (AJUSTES-UI §14) — contextualiza os números sem repetir o rodapé. */}
      <p className="mt-2.5 px-[15px] text-[12px] text-ink-3 sm:px-0">Estimativa baseada nas premissas atuais.</p>

      <RoleDetailModal member={selectedMember} onClose={() => setSelectedIndex(null)} />
    </>
  )
}
