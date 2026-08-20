/**
 * Ícone da marca: um medidor de risco (arco + ponteiro + eixo), ecoando a métrica central do
 * produto (RiskPanel.tsx). strokeWidth calibrado pra não cair abaixo de 1.5px renderizado no
 * menor tamanho de uso (favicon, 16px): viewBox de 24 unidades → escala 16/24 ≈ 0,667 nesse
 * tamanho. Arco: 2.4 × 0,667 ≈ 1,6px. Ponteiro: 2.8 × 0,667 ≈ 1,87px.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="32"
      height="34"
      viewBox="0 0 21.5 24"
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
