import { Loader2 } from 'lucide-react'

/**
 * iOS Safari abre zoom automático ao focar um input com font-size &lt; 16px — text-base (16px)
 * evita isso; o tamanho visual real de desktop entra a partir de sm. Todo input/textarea novo
 * deve seguir esse par de classes: `text-base sm:<tamanho-desktop>`.
 *
 * NÃO extraia isso pra uma função que monta a classe em runtime (`` `sm:${x}` ``) — o Tailwind
 * gera CSS varrendo o código-fonte por strings literais e completas; uma classe montada por
 * interpolação nunca aparece assim no source, então o scanner nunca a vê e a regra `sm:` correspondente
 * simplesmente não é gerada. As 5 classes precisam ficar escritas por extenso em cada call site
 * (CommandMenu.tsx, ConstraintFields.tsx x2, NegotiationChat.tsx, RiskPanel.tsx).
 */

/** Expande a área de toque real de um controle pequeno pra mais perto do guideline de ~44px sem
 * mudar o tamanho visual — mesma técnica já usada nos toggles PJ/CLT do RiskPanel. Pra controles
 * largos (chips, pills) que podem quebrar linha (flex-wrap): 6px por lado, não mais — com 10px
 * (o valor original), a área invisível de duas linhas vizinhas passava a se sobrepor sempre que o
 * espaço visual entre elas (gap) fosse menor que a soma dos dois lados (20px); os call sites que
 * usam isso mantêm gap-3 (12px) ou mais por causa disso. O elemento precisa ser `relative` (já
 * incluso). */
export const TOUCH_TARGET_EXPAND_Y = "relative after:absolute after:-inset-y-1.5 after:inset-x-0 after:content-['']"

/** Mesma técnica, mas expande nas duas direções — pra botões pequenos só-ícone (fechar, cancelar),
 * onde tanto largura quanto altura ficam abaixo do guideline. */
export const TOUCH_TARGET_EXPAND = "relative after:absolute after:-inset-2.5 after:content-['']"

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[12.5px] font-medium text-ink-3">{children}</h2>
}

/**
 * Superfície compartilhada por composição, risco e alocação — sem cabeçalho embutido, o título
 * fica fora (ver PanelTitle), no mesmo padrão do h2 de "Leitura do escopo". Sem borda: a
 * elevação (sombra) bem leve define o limite, com parcimônia, em vez de uma linha. Sem padding:
 * tabela, SVG e o grid do RiskPanel já levam o próprio espaçamento interno; quem precisar de
 * respiro (ex: NegotiationChat) adiciona.
 */
export function Panel({ children }: { children: React.ReactNode }) {
  return <div className="overflow-hidden rounded-[7px] bg-paper-3 shadow-[var(--shadow-raised)]">{children}</div>
}

/**
 * Título de card, fora da caixa — mesma ideia visual do h2 de "Leitura do escopo": título solto
 * acima do conteúdo em vez de dentro de uma faixa/cabeçalho embutido no painel.
 * `emphasis` diferencia as seções principais (Squad recomendado, Índice de risco) das de apoio —
 * um pouco maior/mais escuro é suficiente, não precisa de caixa própria nem cor nova.
 */
export function PanelTitle({ title, note, emphasis = false }: { title: string; note?: string; emphasis?: boolean }) {
  return (
    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3.5 gap-y-1">
      <h3
        className={`font-display font-bold leading-none tracking-[-0.025em] text-ink ${
          emphasis ? 'text-[30px]' : 'text-[26px]'
        }`}
      >
        {title}
      </h3>
      {note && <span className="tnum text-[12.5px] text-ink-3">{note}</span>}
    </div>
  )
}

/** Cabeçalho de seção: só o rótulo, sem numeração decorativa nem traço de preenchimento. */
export function Eyebrow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`mb-5 font-display text-[19px] font-bold tracking-[-0.015em] text-petrol ${className}`}>
      {children}
    </div>
  )
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  loading = false,
  type = 'button',
  className = '',
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit'
  className?: string
}) {
  // Desabilitado é outline neutro, nunca a cor primária com opacidade baixa — quem explica o
  // que falta é o texto ao lado do botão, não o próprio botão.
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`group inline-flex items-center justify-center gap-2.5 rounded-[7px] border px-[22px] py-[11px] text-[15px] font-semibold transition-[transform,background-color,box-shadow] duration-300 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-petrol focus-visible:outline-offset-2 ${className} ${
        disabled
          ? 'cursor-not-allowed border-rule bg-transparent text-ink-3'
          : 'border-ink bg-ink text-paper-2 shadow-[0_6px_16px_-4px_rgba(20,88,74,0)] hover:-translate-y-px hover:shadow-[0_6px_16px_-4px_rgba(20,88,74,0.35)] active:translate-y-0 active:scale-[0.98] active:shadow-none'
      }`}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  )
}
