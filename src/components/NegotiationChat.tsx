import { useState } from 'react'
import { Send } from 'lucide-react'
import { NegotiationTurn } from '@/types'
import { Panel, PrimaryButton, SectionLabel } from '@/components/ui/primitives'

export function NegotiationChat({
  history,
  onSend,
  loading,
}: {
  history: NegotiationTurn[]
  onSend: (message: string) => void
  loading: boolean
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
        {history.length > 0 && (
          <div className="flex max-h-80 flex-col gap-3.5 overflow-y-auto">
            {history.map((turn) => (
              <div key={turn.id} className={turn.role === 'user' ? 'ml-10' : 'mr-2'}>
                <p className="mb-1 text-[12.5px] font-medium text-ink-3">
                  {turn.role === 'user' ? 'Você' : 'SquadBuilder'}
                </p>
                <p
                  className={`text-sm leading-relaxed ${
                    turn.role === 'user' ? 'rounded-[3px] bg-paper-2 px-3 py-2 text-ink' : 'text-ink-2'
                  }`}
                >
                  {turn.message}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2.5 border-t border-rule-2 pt-4">
          <SectionLabel>Enviar ajuste</SectionLabel>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder='Ex: "Achei caro. Quero tirar o QA e colocar só 1 Dev Fullstack em 3 meses."'
            rows={3}
            disabled={loading}
            className="w-full resize-y rounded-[3px] border border-rule-2 bg-paper-3 px-3 py-2 text-sm text-ink outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-ink-3 focus:border-petrol focus:shadow-[0_0_0_3px_rgba(20,85,78,0.13)] disabled:opacity-50"
          />
          <div className="flex justify-end">
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
