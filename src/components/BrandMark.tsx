/**
 * Monograma tipográfico (CRITICA-UI §1.1) — o ícone anterior era 3 barras ascendentes, o mesmo
 * bar-chart genérico usado em qualquer dashboard de IA. Um "S" num badge sólido petrol é
 * específico do wordmark, não um clichê de categoria.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      <rect x="0" y="0" width="22" height="22" rx="6" fill="var(--petrol)" />
      <text
        x="11"
        y="15.5"
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontSize="12.5"
        fontWeight="800"
        fill="var(--paper-3)"
      >
        S
      </text>
    </svg>
  )
}
