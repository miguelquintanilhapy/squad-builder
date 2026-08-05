/** Wordmark: três barras verticais crescentes (rampa de headcount). Sem gradiente, sem ícone abstrato. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="22" viewBox="0 0 20 22" aria-hidden="true">
      <rect x="0" y="13" width="4" height="9" fill="var(--ink-3)" />
      <rect x="6" y="7" width="4" height="15" fill="var(--petrol)" />
      <rect x="12" y="1" width="4" height="21" fill="var(--ink)" />
    </svg>
  )
}
