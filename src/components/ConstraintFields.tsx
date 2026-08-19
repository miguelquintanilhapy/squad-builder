'use client'

const inputShellClasses =
  'flex h-[39px] items-center overflow-hidden rounded-[7px] border border-rule-2 bg-paper-3 transition-[border-color,box-shadow] duration-150 hover:border-ink-3 focus-within:border-petrol focus-within:shadow-[var(--shadow-focus)]'

const affixClasses = 'flex h-full items-center bg-paper px-2.5 text-[13.5px] text-ink-3'

export function ConstraintFields({
  targetTimelineMonths,
  monthlyBudget,
  onChange,
  disabled,
}: {
  targetTimelineMonths?: number
  monthlyBudget?: number
  onChange: (patch: { targetTimelineMonths?: number; monthlyBudget?: number }) => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-nowrap items-end gap-2.5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="prazo" className="text-[13.5px] text-ink-2">
          Prazo alvo <span className="text-ink-3">(opcional)</span>
        </label>
        <div className={inputShellClasses}>
          <input
            id="prazo"
            type="number"
            min={1}
            max={36}
            value={targetTimelineMonths ?? ''}
            onChange={(e) =>
              onChange({ targetTimelineMonths: e.target.value ? Number(e.target.value) : undefined })
            }
            disabled={disabled}
            placeholder="Ex.: 4"
            className="w-24 border-0 bg-transparent px-[11px] text-[15px] text-ink outline-none tnum placeholder:text-ink-3/60"
          />
          <span className={`${affixClasses} border-l border-rule-2`}>meses</span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="budget" className="text-[13.5px] text-ink-2">
          Teto mensal <span className="text-ink-3">(opcional)</span>
        </label>
        <div className={inputShellClasses}>
          <span className={`${affixClasses} border-r border-rule-2`}>R$</span>
          <input
            id="budget"
            type="number"
            min={0}
            step={5000}
            value={monthlyBudget ?? ''}
            onChange={(e) => onChange({ monthlyBudget: e.target.value ? Number(e.target.value) : undefined })}
            disabled={disabled}
            placeholder="Ex.: 35000"
            className="w-24 border-0 bg-transparent px-[11px] text-[15px] text-ink outline-none tnum placeholder:text-ink-3/60"
          />
        </div>
      </div>
    </div>
  )
}
