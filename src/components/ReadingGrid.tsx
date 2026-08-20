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
  // Chip/badge é o único lugar com raio total — cards/inputs/botões ficam em 7px, isso os
  // diferencia visualmente como uma categoria própria. Mesmo hover-lift + press dos chips "Ou
  // parta de" (ScopeField) — mesma família de controle, mesma animação.
  'inline-flex items-center gap-1 rounded-full border px-3 py-[5px] text-[13px] font-medium transition-[color,background-color,border-color,transform] duration-150 hover:-translate-y-px active:translate-y-0 active:scale-[0.96] focus-visible:outline focus-visible:outline-2 focus-visible:outline-petrol focus-visible:outline-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60'
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
  edited,
  onRestore,
  children,
}: {
  label: string
  /** Grupos exclusivos (estágio/complexidade) marcam o wrapper como radiogroup — sem div extra. */
  radioGroup?: boolean
  /** Campo corrigido à mão — sobrevive a qualquer releitura futura da IA. */
  edited?: boolean
  onRestore?: () => void
  children: React.ReactNode
}) {
  return (
    <div className="rounded-[7px] bg-paper-3 pt-[13px] pr-[15px] pb-[14px] pl-[15px]">
      <div className="mb-[9px] flex items-center justify-between gap-2 text-[12.5px] font-medium text-ink-3">
        <span className="flex items-center gap-1.5">
          {label}
          {edited && (
            <span
              aria-hidden="true"
              title="Editado à mão"
              className="inline-block size-[5px] rounded-full bg-petrol"
            />
          )}
        </span>
        {edited && onRestore && (
          <button
            type="button"
            onClick={onRestore}
            className="font-medium text-petrol underline underline-offset-2 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-petrol focus-visible:outline-offset-2"
          >
            Restaurar leitura da IA
          </button>
        )}
      </div>
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

type EditableScopeField = 'productTypes' | 'platforms' | 'stage' | 'complexity'

export function ReadingGrid({
  scope,
  onChange,
  editedFields = [],
  onRestoreField,
  disabled,
}: {
  scope: ScopeAnalysis
  onChange: (next: ScopeAnalysis, changedField: EditableScopeField) => void
  /** Quais campos foram corrigidos à mão — mostra o indicador + "restaurar" nesse bloco. */
  editedFields?: EditableScopeField[]
  onRestoreField?: (field: EditableScopeField) => void
  disabled?: boolean
}) {
  const isEdited = (field: EditableScopeField) => editedFields.includes(field)

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(215px,1fr))] gap-3">
        <DimensionBlock
          label="Tipo de produto"
          edited={isEdited('productTypes')}
          onRestore={onRestoreField && (() => onRestoreField('productTypes'))}
        >
          {PRODUCT_TYPES.map((type) => (
            <Chip
              key={type}
              label={PRODUCT_TYPE_LABELS[type]}
              active={scope.productTypes.includes(type)}
              disabled={disabled}
              onClick={() => onChange({ ...scope, productTypes: toggleItem(scope.productTypes, type) }, 'productTypes')}
            />
          ))}
        </DimensionBlock>

        <DimensionBlock
          label="Plataforma"
          edited={isEdited('platforms')}
          onRestore={onRestoreField && (() => onRestoreField('platforms'))}
        >
          {PLATFORMS.map((platform) => (
            <Chip
              key={platform}
              label={PLATFORM_LABELS[platform]}
              active={scope.platforms.includes(platform)}
              disabled={disabled}
              onClick={() => onChange({ ...scope, platforms: togglePlatform(scope.platforms, platform) }, 'platforms')}
            />
          ))}
        </DimensionBlock>

        <DimensionBlock
          label="Estágio"
          radioGroup
          edited={isEdited('stage')}
          onRestore={onRestoreField && (() => onRestoreField('stage'))}
        >
          {STAGES.map((stage) => (
            <Chip
              key={stage}
              role="radio"
              label={STAGE_LABELS[stage]}
              active={scope.stage === stage}
              disabled={disabled}
              onClick={() => onChange({ ...scope, stage }, 'stage')}
            />
          ))}
        </DimensionBlock>

        <DimensionBlock
          label="Complexidade"
          radioGroup
          edited={isEdited('complexity')}
          onRestore={onRestoreField && (() => onRestoreField('complexity'))}
        >
          {COMPLEXITIES.map((complexity) => (
            <Chip
              key={complexity}
              role="radio"
              label={COMPLEXITY_LABELS[complexity]}
              active={scope.complexity === complexity}
              disabled={disabled}
              onClick={() => onChange({ ...scope, complexity }, 'complexity')}
            />
          ))}
        </DimensionBlock>
      </div>
    </div>
  )
}
