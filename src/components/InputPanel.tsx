import { ComplexityLevel, Platform, ProductType, ProjectInput, ProjectStage } from '@/types'
import {
  COMPLEXITY_LABELS,
  PLATFORM_LABELS,
  PRODUCT_TYPE_LABELS,
  STAGE_LABELS,
} from '@/lib/labels'
import { Chip, PrimaryButton, SectionLabel } from '@/components/ui/primitives'

const PRODUCT_TYPES = Object.keys(PRODUCT_TYPE_LABELS) as ProductType[]
const PLATFORMS = Object.keys(PLATFORM_LABELS) as Platform[]
const STAGES = Object.keys(STAGE_LABELS) as ProjectStage[]
const COMPLEXITIES = Object.keys(COMPLEXITY_LABELS) as ComplexityLevel[]

const fieldClasses =
  'w-full rounded-md border border-border-subtle bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted transition-colors duration-150 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20'

export function InputPanel({
  value,
  onChange,
  onSubmit,
  loading,
}: {
  value: ProjectInput
  onChange: (next: ProjectInput) => void
  onSubmit: () => void
  loading: boolean
}) {
  function toggleMulti<T>(list: T[], item: T): T[] {
    return list.includes(item) ? list.filter((i) => i !== item) : [...list, item]
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Descreva seu projeto</h1>
        <p className="mt-1.5 text-sm text-muted">
          Combine os seletores rápidos com uma descrição livre do escopo para o diagnóstico inicial.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col gap-2.5">
          <SectionLabel>Tipo de Produto</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {PRODUCT_TYPES.map((type) => (
              <Chip
                key={type}
                label={PRODUCT_TYPE_LABELS[type]}
                active={value.productTypes.includes(type)}
                onClick={() => onChange({ ...value, productTypes: toggleMulti(value.productTypes, type) })}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <SectionLabel>Plataforma Alvo</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {PLATFORMS.map((platform) => (
              <Chip
                key={platform}
                label={PLATFORM_LABELS[platform]}
                active={value.platforms.includes(platform)}
                onClick={() => onChange({ ...value, platforms: toggleMulti(value.platforms, platform) })}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <SectionLabel>Estágio do Projeto</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {STAGES.map((stage) => (
              <Chip
                key={stage}
                label={STAGE_LABELS[stage]}
                active={value.stage === stage}
                onClick={() => onChange({ ...value, stage })}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <SectionLabel>Complexidade Esperada</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {COMPLEXITIES.map((complexity) => (
              <Chip
                key={complexity}
                label={COMPLEXITY_LABELS[complexity]}
                active={value.complexity === complexity}
                onClick={() => onChange({ ...value, complexity })}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <SectionLabel>Descrição do Projeto / Escopo</SectionLabel>
        <textarea
          value={value.description}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
          placeholder="Ex: Quero criar um aplicativo estilo Uber de entregas locais com motos, com pagamento in-app e rastreamento em tempo real."
          rows={6}
          className={`${fieldClasses} resize-y leading-relaxed`}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col gap-2.5">
          <SectionLabel>Prazo Alvo (meses)</SectionLabel>
          <input
            type="number"
            min={1}
            value={value.targetTimelineMonths ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                targetTimelineMonths: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            placeholder="Opcional"
            className={fieldClasses}
          />
        </div>
        <div className="flex flex-col gap-2.5">
          <SectionLabel>Orçamento Mensal (R$)</SectionLabel>
          <input
            type="number"
            min={0}
            value={value.monthlyBudget ?? ''}
            onChange={(e) =>
              onChange({ ...value, monthlyBudget: e.target.value ? Number(e.target.value) : undefined })
            }
            placeholder="Opcional"
            className={fieldClasses}
          />
        </div>
      </div>

      <div>
        <PrimaryButton onClick={onSubmit} disabled={loading || !value.description.trim()} loading={loading}>
          {loading ? 'Analisando com IA...' : 'Analisar Projeto com IA'}
        </PrimaryButton>
      </div>
    </div>
  )
}
