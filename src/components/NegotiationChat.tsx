import { useState } from 'react'
import { MessageCircle, Send } from 'lucide-react'
import { NegotiationTurn } from '@/types'
import { Card, PrimaryButton, SectionLabel } from '@/components/ui/primitives'

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
    <Card className="flex flex-col gap-5 p-6">
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-md bg-accent/10 text-accent">
          <MessageCircle className="size-4" strokeWidth={2} />
        </span>
        <div>
          <h2 className="font-display text-base font-bold text-foreground">Negociação</h2>
          <p className="text-sm text-muted">Questione a sugestão e veja o impacto em tempo real.</p>
        </div>
      </div>

      <div className="flex max-h-80 flex-col gap-4 overflow-y-auto">
        {history.map((turn) => (
          <div
            key={turn.id}
            className={`animate-fade-slide-in ${turn.role === 'user' ? 'ml-10' : 'mr-2'}`}
          >
            <p className="mb-1 text-xs font-medium text-muted">{turn.role === 'user' ? 'Você' : 'SquadBuilder'}</p>
            <p
              className={`text-sm leading-relaxed ${
                turn.role === 'user' ? 'rounded-lg bg-accent/10 px-3 py-2 text-foreground' : 'text-muted'
              }`}
            >
              {turn.message}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2.5 border-t border-border-subtle pt-5">
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
          className="w-full resize-y rounded-md border border-border-subtle bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted transition-colors duration-150 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
        />
        <PrimaryButton onClick={handleSend} disabled={loading || !message.trim()} loading={loading} fullWidth>
          {!loading && <Send className="size-3.5" />}
          {loading ? 'Recalculando...' : 'Enviar'}
        </PrimaryButton>
      </div>
    </Card>
  )
}
