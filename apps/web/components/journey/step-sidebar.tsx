import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { demandJourneySteps } from "@/lib/demand-config";
import { cn } from "@/lib/utils";

export function StepSidebar({
  currentStep,
  answeredCount,
  totalQuestions
}: {
  currentStep: number;
  answeredCount: number;
  totalQuestions: number;
}) {
  const completion = Math.round((answeredCount / totalQuestions) * 100);

  return (
    <div className="space-y-4 lg:sticky lg:top-8">
      <Card className="mesh-panel overflow-hidden border-clay/10">
        <CardContent className="space-y-5 p-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">
              Structured demand capture
            </p>
            <h2 className="font-display text-3xl leading-tight text-ink">
              A more thoughtful route to the right car and dealer.
            </h2>
            <p className="text-sm leading-6 text-slate">
              We use your answers only to understand demand, route nearby matches, and improve outcome validation.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-slate">
              <span>Journey completion</span>
              <span>{completion}%</span>
            </div>
            <Progress value={completion} />
          </div>
          <div className="space-y-3">
            {demandJourneySteps.map((step, index) => (
              <div key={step.id} className="flex items-start gap-3">
                <div
                  className={cn(
                    "mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold",
                    index === currentStep
                      ? "bg-clay text-white"
                      : index < currentStep
                        ? "bg-moss text-white"
                        : "bg-sand text-slate"
                  )}
                >
                  {index + 1}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-ink">{step.title}</p>
                  <p className="text-sm leading-5 text-slate">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-black/5 bg-white/80">
        <CardContent className="space-y-4 p-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">Privacy</p>
            <p className="text-sm leading-6 text-slate">
              No name or phone is required here. We only collect structured demand, routing location, and consent.
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">Signals covered</p>
            <div className="flex flex-wrap gap-2">
              {["urgency", "product clarity", "commitment", "affordability", "consistency", "readiness"].map(
                (item) => (
                  <span key={item} className="signal-pill">
                    {item}
                  </span>
                )
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
