/**
 * Agulha de índice de risco (0–100) — a métrica central do produto (RiskPanel.tsx), sem
 * redesenhar o painel em si. Substitui o monograma "S" anterior.
 *
 * strokeWidth calibrado pra não cair abaixo de 1.5px renderizado no menor tamanho de uso
 * (favicon, 16px): viewBox de 24 unidades → escala 16/24 ≈ 0,667 nesse tamanho.
 * Arco: 2.4 × 0,667 ≈ 1,6px. Ponteiro: 2.8 × 0,667 ≈ 1,87px. Em 20px (header) e 32px (ampliado)
 * a mesma proporção só fica mais grossa, nunca mais fina.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--ink)"
      strokeWidth={2.4}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 17 A8 8 0 0 1 20 17" stroke="var(--rule)" />
      <line x1="12" y1="17" x2="8.4" y2="10.5" stroke="var(--moss)" strokeWidth={2.8} />
      <circle cx="12" cy="17" r="1.8" fill="var(--ink)" stroke="none" />
    </svg>
  )
}
