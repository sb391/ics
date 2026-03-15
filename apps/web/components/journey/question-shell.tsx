import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface QuestionShellProps {
  label: string;
  helper: string;
  signals: string[];
  error?: string;
  className?: string;
  children: React.ReactNode;
}

export function QuestionShell({
  label,
  helper,
  signals,
  error,
  className,
  children
}: QuestionShellProps) {
  return (
    <div className={cn("space-y-3 rounded-[28px] border border-black/5 bg-white/80 p-5", className)}>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold text-ink">{label}</h3>
          {signals.map((signal) => (
            <Badge key={signal} className="bg-sand text-slate">
              {signal.replaceAll("_", " ")}
            </Badge>
          ))}
        </div>
        <p className="text-sm leading-6 text-slate">{helper}</p>
        {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
      </div>
      {children}
    </div>
  );
}
