'use client'

import { Check } from 'lucide-react'
import { ComplexityLevel, Platform, ProductType, ProjectStage, ScopeAnalysis } from '@/types'
import { COMPLEXITY_LABELS, PLATFORM_LABELS, PRODUCT_TYPE_LABELS, STAGE_LABELS } from '@/lib/labels'

const PRODUCT_TYPES = Object.keys(PRODUCT_TYPE_LABELS) as ProductType[]
const PLATFORMS = Object.keys(PLATFORM_LABELS) as Platform[]
const STAGES = Object.keys(STAGE_LABELS) as ProjectStage[]
const COMPLEXITIES = Object.keys(COMPLEXITY_LABELS) as ComplexityLevel[]

function toggleItem<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((i) => i !== item) : [...list, item]
}

/**
 * "Multi-plataforma" e as plataformas individuais eram marcáveis ao mesmo tempo — leitura
 * contraditória (se as 3 estão ligadas, isso já É multi-plataforma). Torna mutuamente exclusivas
 * sem tocar em squadPlanner.needsWebFrontend, que depende de 'multi-platform' de verdade.
 */
function togglePlatform(current: Platform[], platform: Platform): Platform[] {
  if (platform === 'multi-platform') {
    return current.includes('multi-platform') ? [] : ['multi-platform']
  }
  return toggleItem(current.filter((p) => p !== 'multi-platform'), platform)
}

const chipBase =
  'inline-flex items-center gap-1 rounded-[2px] border px-2.5 py-[3px] text-[13px] font-medium transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-petrol focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60'
const chipActive = 'border-petrol bg-petrol text-paper-2'
// border-rule-2 batia só 1,25:1 contra o card branco — quase invisível como contorno de um
// controle clicável (WCAG 1.4.11 pede 3:1). border-ink-3 resolve (5,26:1) sem escurecer o
// hairline compartilhado que o resto do app usa só como divisor, não como borda de controle.
const chipInactive = 'border-ink-3 text-ink-2 hover:border-ink'

/**
 * Segundo canal de seleção além da cor (contraste/daltonismo): o check só aparece quando ativo,
 * então a diferença nunca depende só do fundo mudar de tom.
 */
function Chip({
  label,
  active,
  disabled,
  onClick,
  role,
}: {
  label: string
  active: boolean
  disabled?: boolean
  onClick: () => void
  /** Chips de grupo exclusivo (estágio/complexidade) usam role="radio", não aria-pressed. */
  role?: 'radio'
}) {
  return (
    <button
      type="button"
      role={role}
      disabled={disabled}
      aria-pressed={role ? undefined : active}
      aria-checked={role ? active : undefined}
      onClick={onClick}
      className={`${chipBase} ${active ? chipActive : chipInactive}`}
    >
      {active && <Check className="size-3" strokeWidth={2.5} />}
      {label}
    </button>
  )
}

function DimensionBlock({
  label,
  radioGroup,
  children,
}: {
  label: string
  /** Grupos exclusivos (estágio/complexidade) marcam o wrapper como radiogroup — sem div extra. */
  radioGroup?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="bg-paper-3 pt-[13px] pr-[15px] pb-[14px] pl-[15px]">
      <div className="mb-[9px] text-[12.5px] font-medium text-ink-3">{label}</div>
      <div
        role={radioGroup ? 'radiogroup' : undefined}
        aria-label={radioGroup ? label : undefined}
        className="flex flex-wrap gap-[5px]"
      >
        {children}
      </div>
    </div>
  )
}

export function ReadingGrid({
  scope,
  onChange,
  disabled,
}: {
  scope: ScopeAnalysis
  onChange: (next: ScopeAnalysis) => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(215px,1fr))] gap-px overflow-hidden rounded-[3px] border border-rule-2 bg-rule-2">
        <DimensionBlock label="Tipo de produto">
          {PRODUCT_TYPES.map((type) => (
            <Chip
              key={type}
              label={PRODUCT_TYPE_LABELS[type]}
              active={scope.productTypes.includes(type)}
              disabled={disabled}
              onClick={() => onChange({ ...scope, productTypes: toggleItem(scope.productTypes, type) })}
            />
          ))}
        </DimensionBlock>

        <DimensionBlock label="Plataforma">
          {PLATFORMS.map((platform) => (
            <Chip
              key={platform}
              label={PLATFORM_LABELS[platform]}
              active={scope.platforms.includes(platform)}
              disabled={disabled}
              onClick={() => onChange({ ...scope, platforms: togglePlatform(scope.platforms, platform) })}
            />
          ))}
        </DimensionBlock>

        <DimensionBlock label="Estágio" radioGroup>
          {STAGES.map((stage) => (
            <Chip
              key={stage}
              role="radio"
              label={STAGE_LABELS[stage]}
              active={scope.stage === stage}
              disabled={disabled}
              onClick={() => onChange({ ...scope, stage })}
            />
          ))}
        </DimensionBlock>

        <DimensionBlock label="Complexidade" radioGroup>
          {COMPLEXITIES.map((complexity) => (
            <Chip
              key={complexity}
              role="radio"
              label={COMPLEXITY_LABELS[complexity]}
              active={scope.complexity === complexity}
              disabled={disabled}
              onClick={() => onChange({ ...scope, complexity })}
            />
          ))}
        </DimensionBlock>
      </div>
    </div>
  )
}
