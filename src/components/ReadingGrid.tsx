'use client'

import { ComplexityLevel, Platform, ProductType, ProjectStage, ScopeAnalysis } from '@/types'
import { COMPLEXITY_LABELS, PLATFORM_LABELS, PRODUCT_TYPE_LABELS, STAGE_LABELS } from '@/lib/labels'

const PRODUCT_TYPES = Object.keys(PRODUCT_TYPE_LABELS) as ProductType[]
const PLATFORMS = Object.keys(PLATFORM_LABELS) as Platform[]
const STAGES = Object.keys(STAGE_LABELS) as ProjectStage[]
const COMPLEXITIES = Object.keys(COMPLEXITY_LABELS) as ComplexityLevel[]

function toggleItem<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((i) => i !== item) : [...list, item]
}

const chipBase =
  'rounded-[2px] border px-2.5 py-[3px] text-[13px] font-medium transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-petrol focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60'
const chipActive = 'border-ink bg-ink text-paper-2'
const chipInactive = 'border-rule-2 text-ink-2 hover:border-ink-3'

function Chip({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string
  active: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={active}
      onClick={onClick}
      className={`${chipBase} ${active ? chipActive : chipInactive}`}
    >
      {label}
    </button>
  )
}

function DimensionBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-paper-3 pt-[13px] pr-[15px] pb-[14px] pl-[15px]">
      <div className="mb-[9px] text-[12.5px] font-medium text-ink-3">{label}</div>
      <div className="flex flex-wrap gap-[5px]">{children}</div>
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
              onClick={() => onChange({ ...scope, platforms: toggleItem(scope.platforms, platform) })}
            />
          ))}
        </DimensionBlock>

        <DimensionBlock label="Estágio">
          {STAGES.map((stage) => (
            <Chip
              key={stage}
              label={STAGE_LABELS[stage]}
              active={scope.stage === stage}
              disabled={disabled}
              onClick={() => onChange({ ...scope, stage })}
            />
          ))}
        </DimensionBlock>

        <DimensionBlock label="Complexidade">
          {COMPLEXITIES.map((complexity) => (
            <Chip
              key={complexity}
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
