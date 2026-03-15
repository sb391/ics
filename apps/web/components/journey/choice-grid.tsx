import { cn } from "@/lib/utils";

interface ChoiceOption {
  value: string;
  label: string;
  hint?: string;
}

interface ChoiceGridProps {
  options: ChoiceOption[];
  value?: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  columns?: 2 | 3;
}

export function ChoiceGrid({ options, value, onChange, onFocus, columns = 2 }: ChoiceGridProps) {
  return (
    <div className={cn("grid gap-3", columns === 3 ? "md:grid-cols-3" : "md:grid-cols-2")}>
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onFocus={onFocus}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-[24px] border px-4 py-4 text-left transition",
              selected
                ? "border-clay bg-clay/6 shadow-sm"
                : "border-black/10 bg-white hover:border-clay/30 hover:bg-clay/5"
            )}
          >
            <div className="text-sm font-semibold text-ink">{option.label}</div>
            {option.hint ? <div className="mt-1 text-sm leading-5 text-slate">{option.hint}</div> : null}
          </button>
        );
      })}
    </div>
  );
}
