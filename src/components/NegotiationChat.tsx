import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Send } from 'lucide-react'
import { NegotiationTurn, ScenarioVersion } from '@/types'
import { Panel, PanelTitle, PrimaryButton, SectionLabel } from '@/components/ui/primitives'
import { VersionList } from '@/components/VersionList'
import { ImpactSummary } from '@/components/ImpactSummary'

export function NegotiationChat({
  history,
  onSend,
  loading,
  onCancel,
  versions,
  activeVersionId,
  onSelectVersion,
}: {
  history: NegotiationTurn[]
  onSend: (message: string) => void
  loading: boolean
  onCancel?: () => void
  versions: ScenarioVersion[]
  activeVersionId: string | null
  onSelectVersion: (id: string) => void
}) {
  const [message, setMessage] = useState('')

  function handleSend() {
    if (!message.trim() || loading) return
    onSend(message.trim())
    setMessage('')
  }

  const activeIndex = versions.findIndex((v) => v.id === activeVersionId)
  const activeVersion = activeIndex >= 0 ? versions[activeIndex] : null
  const previousVersion = activeIndex > 0 ? versions[activeIndex - 1] : undefined
  // Só existe o que comparar (trilha + impacto) depois da primeira negociação — antes disso, o
  // chat ocupa a coluna sozinho, centralizado como já era (sem grid vazio pela metade).
  const hasVersions = versions.length > 1

  return (
    <>
      <PanelTitle title="Negociação" />
      <Panel>
        <div className="p-6">
          <div
            className={
              hasVersions ? 'grid grid-cols-1 gap-6 lg:mx-auto lg:grid-cols-[420px_700px] lg:items-start' : ''
            }
          >
            <div className={`flex w-full flex-col gap-5 ${hasVersions ? '' : 'mx-auto max-w-[640px]'}`}>
              {history.length > 0 && (
                <div className="flex max-h-64 flex-col gap-3.5 overflow-y-auto">
                  <SectionLabel>Histórico · contexto</SectionLabel>
                  <AnimatePresence initial={false}>
                    {history.map((turn) => (
                      <motion.div
                        key={turn.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                        className="border-l-2 border-rule-2 pl-3.5"
                      >
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-3">
                          {turn.role === 'user' ? 'Ajuste solicitado' : 'Impacto da alteração'}
                        </p>
                        <p className="text-[13px] leading-relaxed text-ink-3">{turn.message}</p>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              <div className="flex flex-col gap-2.5">
                <SectionLabel>Registrar novo ajuste</SectionLabel>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  placeholder='Ex.: "Tire o QA e reduza o custo mantendo o prazo."'
                  rows={3}
                  disabled={loading}
                  className="w-full resize-y rounded-[7px] border border-rule-2 bg-paper-3 px-3 py-2 text-sm text-ink outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-ink-3 hover:border-ink-3 focus:border-petrol focus:shadow-[var(--shadow-focus)] disabled:opacity-50"
                />
                <div className="flex items-center justify-between gap-3.5">
                  {/* Atalho como linha separada, não embutido no placeholder (AJUSTES-UI §23). */}
                  <span className="text-[12px] text-ink-3">Ctrl/Cmd + Enter para enviar</span>
                  <div className="flex items-center gap-3.5">
                    {loading && onCancel && (
                      <button
                        type="button"
                        onClick={onCancel}
                        className="text-[13px] font-medium text-ink-3 underline underline-offset-[3px] hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-petrol focus-visible:outline-offset-2"
                      >
                        Cancelar
                      </button>
                    )}
                    <PrimaryButton onClick={handleSend} disabled={loading || !message.trim()} loading={loading}>
                      {!loading && <Send className="size-3.5" />}
                      {/* Não "Recalculando..." aqui — é um ajuste/negociação, não um recálculo de
                          premissa (AJUSTES-UI §24). */}
                      {loading ? 'Ajustando...' : 'Enviar'}
                    </PrimaryButton>
                  </div>
                </div>
              </div>
            </div>

            {hasVersions && (
              <div className="flex flex-col gap-4 lg:border-l lg:border-rule-2 lg:pl-5">
                <div className="flex flex-col gap-2">
                  <SectionLabel>Trilha de decisões</SectionLabel>
                  <VersionList versions={versions} activeVersionId={activeVersionId} onSelect={onSelectVersion} />
                </div>

                {activeVersion && <ImpactSummary active={activeVersion} previous={previousVersion} />}
              </div>
            )}
          </div>
        </div>
      </Panel>
    </>
  )
}
