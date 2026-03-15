import { cn } from "@/lib/utils";

interface ChoiceOption<TValue extends string = string> {
  value: TValue;
  label: string;
  hint?: string;
}

interface MultiSelectGridProps<TValue extends string> {
  options: ChoiceOption<TValue>[];
  value: TValue[];
  limit: number;
  onToggle: (value: TValue) => void;
  onFocus?: () => void;
}

export function MultiSelectGrid<TValue extends string>({
  options,
  value,
  limit,
  onToggle,
  onFocus
}: MultiSelectGridProps<TValue>) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {options.map((option) => {
        const selected = value.includes(option.value);
        const disabled = !selected && value.length >= limit;

        return (
          <button
            key={option.value}
            type="button"
            onFocus={onFocus}
            onClick={() => onToggle(option.value)}
            disabled={disabled}
            className={cn(
              "rounded-[24px] border px-4 py-4 text-left transition disabled:cursor-not-allowed disabled:opacity-40",
              selected
                ? "border-clay bg-clay/6 shadow-sm"
                : "border-black/10 bg-white hover:border-clay/30 hover:bg-clay/5"
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-ink">{option.label}</div>
              <div
                className={cn(
                  "inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs font-bold",
                  selected ? "border-clay bg-clay text-white" : "border-black/10 text-slate"
                )}
              >
                {selected ? "✓" : "+"}
              </div>
            </div>
            {option.hint ? <div className="mt-1 text-sm leading-5 text-slate">{option.hint}</div> : null}
          </button>
        );
      })}
    </div>
  );
}
