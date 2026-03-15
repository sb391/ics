"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, type FieldErrors, type FieldPath, useForm } from "react-hook-form";
import { ArrowLeft, ArrowRight, LoaderCircle, ShieldCheck } from "lucide-react";

import { ChoiceGrid } from "@/components/journey/choice-grid";
import { MultiSelectGrid } from "@/components/journey/multi-select-grid";
import { QuestionShell } from "@/components/journey/question-shell";
import { StepSidebar } from "@/components/journey/step-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  bodyStyleOptions,
  brandOptions,
  budgetFlexibilityOptions,
  budgetRangeOptions,
  currentVehicleAgeBandOptions,
  decisionMakerOptions,
  demandJourneySteps,
  downPaymentBandOptions,
  financePreferenceOptions,
  fuelTypeOptions,
  monthlyEmiComfortBandOptions,
  monthlyKmBandOptions,
  primaryPreferenceOptions,
  purchaseReasonOptions,
  purchaseTimelineOptions,
  questionDescriptors,
  salaryBandOptions,
  showroomVisitStatusOptions,
  testDriveReadinessOptions,
  usagePatternOptions,
  variantClarityOptions
} from "@/lib/demand-config";
import { useBehaviourTracker } from "@/lib/behaviour-tracker";
import { type ConsumerDemandFormValues, consumerDemandFormSchema } from "@/lib/form-schema";

const completionPaths: FieldPath<ConsumerDemandFormValues>[] = [
  "answers.bodyStyle",
  "answers.budgetRange",
  "answers.primaryPreference",
  "answers.brandsComparing",
  "answers.fuelType",
  "answers.usagePattern",
  "answers.monthlyKmBand",
  "answers.purchaseTimeline",
  "answers.purchaseReason",
  "answers.currentVehicleAgeBand",
  "answers.showroomVisitStatus",
  "answers.variantClarity",
  "answers.testDriveReadiness",
  "answers.decisionMaker",
  "answers.timelineConfidencePercent",
  "answers.financePreference",
  "answers.downPaymentBand",
  "answers.salaryBand",
  "answers.monthlyEmiComfortBand",
  "answers.budgetFlexibility",
  "answers.openToBudgetIncrease",
  "answers.tradeInAvailable",
  "routing.pincode",
  "routing.city",
  "routing.locality",
  "consent.dealerContactConsent"
];

function getErrorMessage<TFieldValues extends Record<string, unknown>>(
  errors: FieldErrors<TFieldValues>,
  path: string
) {
  const result = path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") {
      return undefined;
    }

    return (current as Record<string, unknown>)[key];
  }, errors);

  return result && typeof result === "object" && "message" in result
    ? String((result as { message?: string }).message)
    : undefined;
}

function countAnswered(values: Partial<ConsumerDemandFormValues>) {
  return completionPaths.filter((path) => {
    const value = path.split(".").reduce<unknown>((current, key) => {
      if (!current || typeof current !== "object") {
        return undefined;
      }

      return (current as Record<string, unknown>)[key];
    }, values);

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return value !== undefined && value !== null && value !== "";
  }).length;
}

function getOrCreateSessionId() {
  if (typeof window === "undefined") {
    return "";
  }

  const existing = window.localStorage.getItem("ics-consumer-session");
  if (existing) {
    return existing;
  }

  const generated = `sess_${crypto.randomUUID()}`;
  window.localStorage.setItem("ics-consumer-session", generated);
  return generated;
}

function readCampaign() {
  if (typeof window === "undefined") {
    return "";
  }

  return new URLSearchParams(window.location.search).get("utm_campaign") ?? "";
}

export function DemandJourney() {
  const router = useRouter();
  const tracker = useBehaviourTracker();
  const [currentStep, setCurrentStep] = useState(0);
  const [sessionId, setSessionId] = useState("");
  const [campaign, setCampaign] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<ConsumerDemandFormValues>({
    resolver: zodResolver(consumerDemandFormSchema),
    mode: "onTouched",
    defaultValues: {
      answers: {
        brandsComparing: [],
        timelineConfidencePercent: 70
      },
      routing: {
        addressLine: ""
      },
      consent: {
        dealerContactConsent: false
      }
    }
  });

  const values = form.watch();
  const answeredCount = countAnswered(values);
  const currentStepConfig = demandJourneySteps[currentStep];
  const isLastStep = currentStep === demandJourneySteps.length - 1;

  useEffect(() => {
    setSessionId(getOrCreateSessionId());
    setCampaign(readCampaign());
  }, []);

  const fieldSignalSummary = useMemo(() => {
    return currentStepConfig.fields
      .map((path) => questionDescriptors[path])
      .filter(Boolean)
      .flatMap((item) => item.signals)
      .filter((value, index, list) => list.indexOf(value) === index);
  }, [currentStepConfig.fields]);

  const moveToNextStep = async () => {
    const valid = await form.trigger([...currentStepConfig.fields] as FieldPath<ConsumerDemandFormValues>[], {
      shouldFocus: true
    });

    if (!valid) {
      return;
    }

    setCurrentStep((step) => Math.min(step + 1, demandJourneySteps.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const moveToPreviousStep = () => {
    tracker.recordBacktrack();
    setCurrentStep((step) => Math.max(step - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const recordEditIfChanged = (before: unknown, after: unknown) => {
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      tracker.recordAnswerEdit();
    }
  };

  const onSubmit = form.handleSubmit(async (submittedValues) => {
    setSubmitError(null);

    const completionRatePercent = Math.round((countAnswered(submittedValues) / completionPaths.length) * 100);

    const payload = {
      ...submittedValues,
      routing: {
        ...submittedValues.routing,
        addressLine: submittedValues.routing.addressLine || undefined
      },
      behaviouralMetrics: tracker.buildMetrics(completionRatePercent)
    };

    try {
      const response = await fetch("/api/consumer-demand", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ics-session-id": sessionId,
          "x-ics-campaign": campaign
        },
        body: JSON.stringify(payload)
      });

      const responseBody = (await response.json().catch(() => null)) as
        | {
            demandId?: string;
            error?: {
              message?: string;
              details?: {
                fieldErrors?: Record<string, string[]>;
                formErrors?: string[];
              };
            };
          }
        | null;

      if (!response.ok || !responseBody?.demandId) {
        setSubmitError(
          responseBody?.error?.details?.formErrors?.[0] ??
            responseBody?.error?.message ??
            "We could not record the demand just yet. Please review the highlighted answers and try again."
        );
        return;
      }

      router.push(`/journey/success?demandId=${encodeURIComponent(responseBody.demandId)}`);
    } catch {
      setSubmitError(
        "We could not reach the scoring service right now. Please try again in a moment."
      );
    }
  });

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between pb-6">
          <Link href="/" className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">
            Intent Confidence Score
          </Link>
          <div className="hidden items-center gap-3 text-sm text-slate md:flex">
            <ShieldCheck className="h-4 w-4 text-moss" />
            No name or phone required at this stage
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <Card className="mesh-panel overflow-hidden border-clay/10 shadow-panel">
              <CardContent className="space-y-6 p-6 md:p-8">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">
                    {currentStepConfig.eyebrow}
                  </p>
                  <div className="space-y-2">
                    <h1 className="font-display text-4xl leading-tight text-ink md:text-5xl">
                      {currentStepConfig.title}
                    </h1>
                    <p className="max-w-2xl text-base leading-7 text-slate">{currentStepConfig.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {fieldSignalSummary.map((signal) => (
                      <span key={signal} className="signal-pill">
                        {signal.replaceAll("_", " ")}
                      </span>
                    ))}
                  </div>
                </div>

                <form className="space-y-5" onSubmit={onSubmit}>
                  {currentStep === 0 ? (
                    <>
                      <Controller
                        control={form.control}
                        name="answers.bodyStyle"
                        render={({ field }) => (
                          <QuestionShell
                            {...questionDescriptors["answers.bodyStyle"]}
                            error={getErrorMessage(form.formState.errors, "answers.bodyStyle")}
                          >
                            <ChoiceGrid
                              options={bodyStyleOptions}
                              value={field.value}
                              onFocus={() => tracker.beginField("bodyStyle")}
                              onChange={(value) => {
                                tracker.beginField("bodyStyle");
                                recordEditIfChanged(field.value, value);
                                field.onChange(value);
                                tracker.endField("bodyStyle");
                              }}
                            />
                          </QuestionShell>
                        )}
                      />

                      <Controller
                        control={form.control}
                        name="answers.budgetRange"
                        render={({ field }) => (
                          <QuestionShell
                            {...questionDescriptors["answers.budgetRange"]}
                            error={getErrorMessage(form.formState.errors, "answers.budgetRange")}
                          >
                            <ChoiceGrid
                              options={budgetRangeOptions}
                              value={field.value}
                              onFocus={() => tracker.beginField("budgetRange")}
                              onChange={(value) => {
                                tracker.beginField("budgetRange");
                                recordEditIfChanged(field.value, value);
                                field.onChange(value);
                                tracker.endField("budgetRange");
                              }}
                            />
                          </QuestionShell>
                        )}
                      />

                      <Controller
                        control={form.control}
                        name="answers.primaryPreference"
                        render={({ field }) => (
                          <QuestionShell
                            {...questionDescriptors["answers.primaryPreference"]}
                            error={getErrorMessage(form.formState.errors, "answers.primaryPreference")}
                          >
                            <ChoiceGrid
                              options={primaryPreferenceOptions}
                              value={field.value}
                              onFocus={() => tracker.beginField("primaryPreference")}
                              onChange={(value) => {
                                tracker.beginField("primaryPreference");
                                recordEditIfChanged(field.value, value);
                                field.onChange(value);
                                tracker.endField("primaryPreference");
                              }}
                              columns={3}
                            />
                          </QuestionShell>
                        )}
                      />

                      <Controller
                        control={form.control}
                        name="answers.brandsComparing"
                        render={({ field }) => (
                          <QuestionShell
                            {...questionDescriptors["answers.brandsComparing"]}
                            error={getErrorMessage(form.formState.errors, "answers.brandsComparing")}
                          >
                            <MultiSelectGrid
                              options={brandOptions}
                              value={field.value ?? []}
                              limit={5}
                              onFocus={() => tracker.beginField("brandsComparing")}
                              onToggle={(brand) => {
                                tracker.beginField("brandsComparing");
                                const nextValue = (field.value ?? []).includes(brand)
                                  ? (field.value ?? []).filter((item) => item !== brand)
                                  : [...(field.value ?? []), brand];
                                recordEditIfChanged(field.value ?? [], nextValue);
                                field.onChange(nextValue);
                                tracker.endField("brandsComparing");
                              }}
                            />
                          </QuestionShell>
                        )}
                      />

                      <div className="question-grid">
                        <Controller
                          control={form.control}
                          name="answers.fuelType"
                          render={({ field }) => (
                            <QuestionShell
                              {...questionDescriptors["answers.fuelType"]}
                              error={getErrorMessage(form.formState.errors, "answers.fuelType")}
                            >
                              <ChoiceGrid
                                options={fuelTypeOptions}
                                value={field.value}
                                onFocus={() => tracker.beginField("fuelType")}
                                onChange={(value) => {
                                  tracker.beginField("fuelType");
                                  recordEditIfChanged(field.value, value);
                                  field.onChange(value);
                                  tracker.endField("fuelType");
                                }}
                              />
                            </QuestionShell>
                          )}
                        />

                        <Controller
                          control={form.control}
                          name="answers.usagePattern"
                          render={({ field }) => (
                            <QuestionShell
                              {...questionDescriptors["answers.usagePattern"]}
                              error={getErrorMessage(form.formState.errors, "answers.usagePattern")}
                            >
                              <ChoiceGrid
                                options={usagePatternOptions}
                                value={field.value}
                                onFocus={() => tracker.beginField("usagePattern")}
                                onChange={(value) => {
                                  tracker.beginField("usagePattern");
                                  recordEditIfChanged(field.value, value);
                                  field.onChange(value);
                                  tracker.endField("usagePattern");
                                }}
                              />
                            </QuestionShell>
                          )}
                        />
                      </div>

                      <Controller
                        control={form.control}
                        name="answers.monthlyKmBand"
                        render={({ field }) => (
                          <QuestionShell
                            {...questionDescriptors["answers.monthlyKmBand"]}
                            error={getErrorMessage(form.formState.errors, "answers.monthlyKmBand")}
                          >
                            <ChoiceGrid
                              options={monthlyKmBandOptions}
                              value={field.value}
                              onFocus={() => tracker.beginField("monthlyKmBand")}
                              onChange={(value) => {
                                tracker.beginField("monthlyKmBand");
                                recordEditIfChanged(field.value, value);
                                field.onChange(value);
                                tracker.endField("monthlyKmBand");
                              }}
                            />
                          </QuestionShell>
                        )}
                      />
                    </>
                  ) : null}

                  {currentStep === 1 ? (
                    <>
                      <div className="question-grid">
                        <Controller
                          control={form.control}
                          name="answers.purchaseTimeline"
                          render={({ field }) => (
                            <QuestionShell
                              {...questionDescriptors["answers.purchaseTimeline"]}
                              error={getErrorMessage(form.formState.errors, "answers.purchaseTimeline")}
                            >
                              <ChoiceGrid
                                options={purchaseTimelineOptions}
                                value={field.value}
                                onFocus={() => tracker.beginField("purchaseTimeline")}
                                onChange={(value) => {
                                  tracker.beginField("purchaseTimeline");
                                  recordEditIfChanged(field.value, value);
                                  field.onChange(value);
                                  tracker.endField("purchaseTimeline");
                                }}
                              />
                            </QuestionShell>
                          )}
                        />

                        <Controller
                          control={form.control}
                          name="answers.purchaseReason"
                          render={({ field }) => (
                            <QuestionShell
                              {...questionDescriptors["answers.purchaseReason"]}
                              error={getErrorMessage(form.formState.errors, "answers.purchaseReason")}
                            >
                              <ChoiceGrid
                                options={purchaseReasonOptions}
                                value={field.value}
                                onFocus={() => tracker.beginField("purchaseReason")}
                                onChange={(value) => {
                                  tracker.beginField("purchaseReason");
                                  recordEditIfChanged(field.value, value);
                                  field.onChange(value);
                                  tracker.endField("purchaseReason");
                                }}
                              />
                            </QuestionShell>
                          )}
                        />
                      </div>

                      <Controller
                        control={form.control}
                        name="answers.currentVehicleAgeBand"
                        render={({ field }) => (
                          <QuestionShell
                            {...questionDescriptors["answers.currentVehicleAgeBand"]}
                            error={getErrorMessage(form.formState.errors, "answers.currentVehicleAgeBand")}
                          >
                            <ChoiceGrid
                              options={currentVehicleAgeBandOptions}
                              value={field.value}
                              onFocus={() => tracker.beginField("currentVehicleAgeBand")}
                              onChange={(value) => {
                                tracker.beginField("currentVehicleAgeBand");
                                recordEditIfChanged(field.value, value);
                                field.onChange(value);
                                tracker.endField("currentVehicleAgeBand");
                              }}
                            />
                          </QuestionShell>
                        )}
                      />

                      <div className="question-grid">
                        <Controller
                          control={form.control}
                          name="answers.showroomVisitStatus"
                          render={({ field }) => (
                            <QuestionShell
                              {...questionDescriptors["answers.showroomVisitStatus"]}
                              error={getErrorMessage(form.formState.errors, "answers.showroomVisitStatus")}
                            >
                              <ChoiceGrid
                                options={showroomVisitStatusOptions}
                                value={field.value}
                                onFocus={() => tracker.beginField("showroomVisitStatus")}
                                onChange={(value) => {
                                  tracker.beginField("showroomVisitStatus");
                                  recordEditIfChanged(field.value, value);
                                  field.onChange(value);
                                  tracker.endField("showroomVisitStatus");
                                }}
                              />
                            </QuestionShell>
                          )}
                        />

                        <Controller
                          control={form.control}
                          name="answers.variantClarity"
                          render={({ field }) => (
                            <QuestionShell
                              {...questionDescriptors["answers.variantClarity"]}
                              error={getErrorMessage(form.formState.errors, "answers.variantClarity")}
                            >
                              <ChoiceGrid
                                options={variantClarityOptions}
                                value={field.value}
                                onFocus={() => tracker.beginField("variantClarity")}
                                onChange={(value) => {
                                  tracker.beginField("variantClarity");
                                  recordEditIfChanged(field.value, value);
                                  field.onChange(value);
                                  tracker.endField("variantClarity");
                                }}
                              />
                            </QuestionShell>
                          )}
                        />
                      </div>

                      <div className="question-grid">
                        <Controller
                          control={form.control}
                          name="answers.testDriveReadiness"
                          render={({ field }) => (
                            <QuestionShell
                              {...questionDescriptors["answers.testDriveReadiness"]}
                              error={getErrorMessage(form.formState.errors, "answers.testDriveReadiness")}
                            >
                              <ChoiceGrid
                                options={testDriveReadinessOptions}
                                value={field.value}
                                onFocus={() => tracker.beginField("testDriveReadiness")}
                                onChange={(value) => {
                                  tracker.beginField("testDriveReadiness");
                                  recordEditIfChanged(field.value, value);
                                  field.onChange(value);
                                  tracker.endField("testDriveReadiness");
                                }}
                              />
                            </QuestionShell>
                          )}
                        />

                        <Controller
                          control={form.control}
                          name="answers.decisionMaker"
                          render={({ field }) => (
                            <QuestionShell
                              {...questionDescriptors["answers.decisionMaker"]}
                              error={getErrorMessage(form.formState.errors, "answers.decisionMaker")}
                            >
                              <ChoiceGrid
                                options={decisionMakerOptions}
                                value={field.value}
                                onFocus={() => tracker.beginField("decisionMaker")}
                                onChange={(value) => {
                                  tracker.beginField("decisionMaker");
                                  recordEditIfChanged(field.value, value);
                                  field.onChange(value);
                                  tracker.endField("decisionMaker");
                                }}
                              />
                            </QuestionShell>
                          )}
                        />
                      </div>

                      <Controller
                        control={form.control}
                        name="answers.timelineConfidencePercent"
                        render={({ field }) => (
                          <QuestionShell
                            {...questionDescriptors["answers.timelineConfidencePercent"]}
                            error={getErrorMessage(form.formState.errors, "answers.timelineConfidencePercent")}
                          >
                            <div className="space-y-4 rounded-[24px] border border-black/10 bg-white px-5 py-5">
                              <div className="flex items-center justify-between text-sm font-semibold text-ink">
                                <span>Buying confidence</span>
                                <span>{field.value ?? 0}%</span>
                              </div>
                              <input
                                type="range"
                                min={0}
                                max={100}
                                step={5}
                                value={field.value ?? 0}
                                onFocus={() => tracker.beginField("timelineConfidencePercent")}
                                onChange={(event) => {
                                  const nextValue = Number(event.target.value);
                                  recordEditIfChanged(field.value, nextValue);
                                  field.onChange(nextValue);
                                }}
                                onBlur={() => tracker.endField("timelineConfidencePercent")}
                                className="h-2 w-full accent-clay"
                              />
                              <div className="flex justify-between text-xs uppercase tracking-[0.16em] text-slate">
                                <span>Still soft</span>
                                <span>Very certain</span>
                              </div>
                            </div>
                          </QuestionShell>
                        )}
                      />
                    </>
                  ) : null}

                  {currentStep === 2 ? (
                    <>
                      <div className="question-grid">
                        <Controller
                          control={form.control}
                          name="answers.financePreference"
                          render={({ field }) => (
                            <QuestionShell
                              {...questionDescriptors["answers.financePreference"]}
                              error={getErrorMessage(form.formState.errors, "answers.financePreference")}
                            >
                              <ChoiceGrid
                                options={financePreferenceOptions}
                                value={field.value}
                                onFocus={() => tracker.beginField("financePreference")}
                                onChange={(value) => {
                                  tracker.beginField("financePreference");
                                  recordEditIfChanged(field.value, value);
                                  field.onChange(value);
                                  tracker.endField("financePreference");
                                }}
                              />
                            </QuestionShell>
                          )}
                        />

                        <Controller
                          control={form.control}
                          name="answers.downPaymentBand"
                          render={({ field }) => (
                            <QuestionShell
                              {...questionDescriptors["answers.downPaymentBand"]}
                              error={getErrorMessage(form.formState.errors, "answers.downPaymentBand")}
                            >
                              <ChoiceGrid
                                options={downPaymentBandOptions}
                                value={field.value}
                                onFocus={() => tracker.beginField("downPaymentBand")}
                                onChange={(value) => {
                                  tracker.beginField("downPaymentBand");
                                  recordEditIfChanged(field.value, value);
                                  field.onChange(value);
                                  tracker.endField("downPaymentBand");
                                }}
                              />
                            </QuestionShell>
                          )}
                        />
                      </div>

                      <div className="question-grid">
                        <Controller
                          control={form.control}
                          name="answers.salaryBand"
                          render={({ field }) => (
                            <QuestionShell
                              {...questionDescriptors["answers.salaryBand"]}
                              error={getErrorMessage(form.formState.errors, "answers.salaryBand")}
                            >
                              <ChoiceGrid
                                options={salaryBandOptions}
                                value={field.value}
                                onFocus={() => tracker.beginField("salaryBand")}
                                onChange={(value) => {
                                  tracker.beginField("salaryBand");
                                  recordEditIfChanged(field.value, value);
                                  field.onChange(value);
                                  tracker.endField("salaryBand");
                                }}
                              />
                            </QuestionShell>
                          )}
                        />

                        <Controller
                          control={form.control}
                          name="answers.monthlyEmiComfortBand"
                          render={({ field }) => (
                            <QuestionShell
                              {...questionDescriptors["answers.monthlyEmiComfortBand"]}
                              error={getErrorMessage(form.formState.errors, "answers.monthlyEmiComfortBand")}
                            >
                              <ChoiceGrid
                                options={monthlyEmiComfortBandOptions}
                                value={field.value}
                                onFocus={() => tracker.beginField("monthlyEmiComfortBand")}
                                onChange={(value) => {
                                  tracker.beginField("monthlyEmiComfortBand");
                                  recordEditIfChanged(field.value, value);
                                  field.onChange(value);
                                  tracker.endField("monthlyEmiComfortBand");
                                }}
                              />
                            </QuestionShell>
                          )}
                        />
                      </div>

                      <div className="question-grid">
                        <Controller
                          control={form.control}
                          name="answers.budgetFlexibility"
                          render={({ field }) => (
                            <QuestionShell
                              {...questionDescriptors["answers.budgetFlexibility"]}
                              error={getErrorMessage(form.formState.errors, "answers.budgetFlexibility")}
                            >
                              <ChoiceGrid
                                options={budgetFlexibilityOptions}
                                value={field.value}
                                onFocus={() => tracker.beginField("budgetFlexibility")}
                                onChange={(value) => {
                                  tracker.beginField("budgetFlexibility");
                                  recordEditIfChanged(field.value, value);
                                  field.onChange(value);
                                  tracker.endField("budgetFlexibility");
                                }}
                              />
                            </QuestionShell>
                          )}
                        />

                        <Controller
                          control={form.control}
                          name="answers.openToBudgetIncrease"
                          render={({ field }) => (
                            <QuestionShell
                              {...questionDescriptors["answers.openToBudgetIncrease"]}
                              error={getErrorMessage(form.formState.errors, "answers.openToBudgetIncrease")}
                            >
                              <ChoiceGrid
                                options={[
                                  { value: "yes", label: "Yes, if the fit is meaningfully better" },
                                  { value: "no", label: "No, keep it within the current range" }
                                ]}
                                value={
                                  field.value === undefined ? undefined : field.value ? "yes" : "no"
                                }
                                onFocus={() => tracker.beginField("openToBudgetIncrease")}
                                onChange={(value) => {
                                  const nextValue = value === "yes";
                                  tracker.beginField("openToBudgetIncrease");
                                  recordEditIfChanged(field.value, nextValue);
                                  field.onChange(nextValue);
                                  tracker.endField("openToBudgetIncrease");
                                }}
                              />
                            </QuestionShell>
                          )}
                        />
                      </div>

                      <Controller
                        control={form.control}
                        name="answers.tradeInAvailable"
                        render={({ field }) => (
                          <QuestionShell
                            {...questionDescriptors["answers.tradeInAvailable"]}
                            error={getErrorMessage(form.formState.errors, "answers.tradeInAvailable")}
                          >
                            <ChoiceGrid
                              options={[
                                { value: "yes", label: "Yes, I would consider an exchange" },
                                { value: "no", label: "No, no trade-in planned" }
                              ]}
                              value={field.value === undefined ? undefined : field.value ? "yes" : "no"}
                              onFocus={() => tracker.beginField("tradeInAvailable")}
                              onChange={(value) => {
                                const nextValue = value === "yes";
                                tracker.beginField("tradeInAvailable");
                                recordEditIfChanged(field.value, nextValue);
                                field.onChange(nextValue);
                                tracker.endField("tradeInAvailable");
                              }}
                            />
                          </QuestionShell>
                        )}
                      />
                    </>
                  ) : null}

                  {currentStep === 3 ? (
                    <>
                      <div className="question-grid">
                        <Controller
                          control={form.control}
                          name="routing.pincode"
                          render={({ field }) => (
                            <QuestionShell
                              {...questionDescriptors["routing.pincode"]}
                              error={getErrorMessage(form.formState.errors, "routing.pincode")}
                            >
                              <Input
                                {...field}
                                value={field.value ?? ""}
                                inputMode="numeric"
                                maxLength={6}
                                placeholder="560001"
                                onFocus={() => tracker.beginField("pincode")}
                                onBlur={() => {
                                  field.onBlur();
                                  tracker.endField("pincode");
                                }}
                                onChange={(event) => {
                                  recordEditIfChanged(field.value, event.target.value);
                                  field.onChange(event.target.value);
                                }}
                              />
                            </QuestionShell>
                          )}
                        />

                        <Controller
                          control={form.control}
                          name="routing.city"
                          render={({ field }) => (
                            <QuestionShell
                              {...questionDescriptors["routing.city"]}
                              error={getErrorMessage(form.formState.errors, "routing.city")}
                            >
                              <Input
                                {...field}
                                value={field.value ?? ""}
                                placeholder="Bengaluru"
                                onFocus={() => tracker.beginField("city")}
                                onBlur={() => {
                                  field.onBlur();
                                  tracker.endField("city");
                                }}
                                onChange={(event) => {
                                  recordEditIfChanged(field.value, event.target.value);
                                  field.onChange(event.target.value);
                                }}
                              />
                            </QuestionShell>
                          )}
                        />
                      </div>

                      <div className="question-grid">
                        <Controller
                          control={form.control}
                          name="routing.locality"
                          render={({ field }) => (
                            <QuestionShell
                              {...questionDescriptors["routing.locality"]}
                              error={getErrorMessage(form.formState.errors, "routing.locality")}
                            >
                              <Input
                                {...field}
                                value={field.value ?? ""}
                                placeholder="Indiranagar"
                                onFocus={() => tracker.beginField("locality")}
                                onBlur={() => {
                                  field.onBlur();
                                  tracker.endField("locality");
                                }}
                                onChange={(event) => {
                                  recordEditIfChanged(field.value, event.target.value);
                                  field.onChange(event.target.value);
                                }}
                              />
                            </QuestionShell>
                          )}
                        />

                        <Controller
                          control={form.control}
                          name="routing.addressLine"
                          render={({ field }) => (
                            <QuestionShell
                              label="Address or landmark (optional)"
                              helper="Useful when you want more precise routing later. This is stored as routing data, not identity data."
                              signals={["purchase_readiness"]}
                              error={getErrorMessage(form.formState.errors, "routing.addressLine")}
                            >
                              <Input
                                {...field}
                                value={field.value ?? ""}
                                placeholder="Near 12th Main Road"
                                onFocus={() => tracker.beginField("addressLine")}
                                onBlur={() => {
                                  field.onBlur();
                                  tracker.endField("addressLine");
                                }}
                                onChange={(event) => {
                                  recordEditIfChanged(field.value, event.target.value);
                                  field.onChange(event.target.value);
                                }}
                              />
                            </QuestionShell>
                          )}
                        />
                      </div>

                      <QuestionShell
                        label="Consent to connect"
                        helper="By submitting, you agree that relevant dealers or partners may contact you based on your demand and location."
                        signals={["purchase_readiness"]}
                        error={getErrorMessage(form.formState.errors, "consent.dealerContactConsent")}
                      >
                        <label className="flex items-start gap-4 rounded-[24px] border border-black/10 bg-white px-5 py-4 text-sm leading-6 text-slate">
                          <input
                            type="checkbox"
                            checked={Boolean(values.consent?.dealerContactConsent)}
                            onFocus={() => tracker.beginField("dealerContactConsent")}
                            onBlur={() => tracker.endField("dealerContactConsent")}
                            onChange={(event) => {
                              recordEditIfChanged(
                                values.consent?.dealerContactConsent,
                                event.target.checked
                              );
                              form.setValue("consent.dealerContactConsent", event.target.checked, {
                                shouldDirty: true,
                                shouldValidate: true
                              });
                            }}
                            className="mt-1 h-4 w-4 rounded border-black/20 accent-clay"
                          />
                          <span>
                            I agree that my demand and routing details may be used to identify relevant dealers or
                            partners in my area and that they may contact me regarding this demand.
                          </span>
                        </label>
                      </QuestionShell>
                    </>
                  ) : null}

                  {submitError ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                      {submitError}
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-3 border-t border-black/5 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-slate">
                      {isLastStep
                        ? "Your demand will be scored and stored in the ICS backend, but internal score logic stays hidden."
                        : "You can review and adjust your answers before moving forward."}
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      {currentStep > 0 ? (
                        <Button type="button" variant="ghost" className="justify-center" onClick={moveToPreviousStep}>
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Back
                        </Button>
                      ) : null}
                      {isLastStep ? (
                        <Button type="submit" disabled={form.formState.isSubmitting} className="justify-center">
                          {form.formState.isSubmitting ? (
                            <>
                              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                              Recording demand
                            </>
                          ) : (
                            "Record My Demand"
                          )}
                        </Button>
                      ) : (
                        <Button type="button" onClick={moveToNextStep} className="justify-center">
                          Continue
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <StepSidebar currentStep={currentStep} answeredCount={answeredCount} totalQuestions={completionPaths.length} />
        </div>
      </div>
    </div>
  );
}
