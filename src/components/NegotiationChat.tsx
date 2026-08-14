import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Send } from 'lucide-react'
import { NegotiationTurn, ScenarioVersion } from '@/types'
import { Panel, PrimaryButton, SectionLabel } from '@/components/ui/primitives'
import { VersionList } from '@/components/VersionList'

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

  return (
    <Panel title="Negociação">
      <div className="mx-auto flex max-w-[640px] flex-col gap-4 p-4">
        {versions.length > 1 && (
          <div className="flex flex-col gap-2">
            <SectionLabel>Versões</SectionLabel>
            <VersionList versions={versions} activeVersionId={activeVersionId} onSelect={onSelectVersion} />
          </div>
        )}

        {history.length > 0 && (
          <div className="flex max-h-80 flex-col gap-3.5 overflow-y-auto">
            <AnimatePresence initial={false}>
              {history.map((turn) => (
                <motion.div
                  key={turn.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                  className={turn.role === 'user' ? 'ml-10' : 'mr-2'}
                >
                  <p className="mb-1 text-[12.5px] font-medium text-ink-3">
                    {turn.role === 'user' ? 'Você' : 'SquadBuilder'}
                  </p>
                  <p
                    className={`text-sm leading-relaxed ${
                      turn.role === 'user' ? 'rounded-[7px] bg-paper-2 px-3 py-2 text-ink' : 'text-ink-2'
                    }`}
                  >
                    {turn.message}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          <SectionLabel>Enviar ajuste</SectionLabel>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder='Ex: "Achei caro. Quero tirar o QA e colocar só 1 Dev Fullstack em 3 meses." (Ctrl/Cmd+Enter envia)'
            rows={3}
            disabled={loading}
            className="w-full resize-y rounded-[7px] border border-rule-2 bg-paper-3 px-3 py-2 text-sm text-ink outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-ink-3 hover:border-ink-3 focus:border-petrol focus:shadow-[var(--shadow-focus)] disabled:opacity-50"
          />
          <div className="flex justify-end gap-3.5">
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
              {loading ? 'Recalculando...' : 'Enviar'}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </Panel>
  )
}
