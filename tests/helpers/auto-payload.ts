import type { ScorePayload } from "../../src/modules/scoring/scoring.types";
import { AUTO_SAMPLE_PAYLOAD } from "../../src/modules/scoring/industries/auto/auto.constants";

type PartialScorePayload = Partial<Omit<ScorePayload, "answers" | "behaviouralMetrics" | "metadata">> & {
  answers?: Partial<ScorePayload["answers"]>;
  behaviouralMetrics?: Partial<Omit<ScorePayload["behaviouralMetrics"], "timePerStepSeconds">> & {
    timePerStepSeconds?: Partial<ScorePayload["behaviouralMetrics"]["timePerStepSeconds"]>;
  };
  metadata?: Partial<ScorePayload["metadata"]>;
};

function stripUndefinedEntries<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;
}

function isAnswerPresent(
  answers: ScorePayload["answers"],
  key: keyof ScorePayload["answers"] | string
) {
  if (key === "brandsComparing") {
    return Array.isArray(answers.brandsComparing) && answers.brandsComparing.length > 0;
  }

  if (key === "tradeInAvailable") {
    return answers.tradeInAvailable !== undefined;
  }

  return answers[key as keyof ScorePayload["answers"]] !== undefined;
}

export function buildAutoPayload(overrides: PartialScorePayload = {}): ScorePayload {
  const base = structuredClone(AUTO_SAMPLE_PAYLOAD) as ScorePayload;
  const answers = stripUndefinedEntries({
    ...base.answers,
    ...overrides.answers
  });
  const timePerStepSeconds = Object.fromEntries(
    Object.entries(
      stripUndefinedEntries({
        ...base.behaviouralMetrics.timePerStepSeconds,
        ...overrides.behaviouralMetrics?.timePerStepSeconds
      })
    ).filter(([key]) => isAnswerPresent(answers, key))
  ) as ScorePayload["behaviouralMetrics"]["timePerStepSeconds"];

  return {
    ...base,
    ...overrides,
    answers,
    behaviouralMetrics: stripUndefinedEntries({
      ...base.behaviouralMetrics,
      ...overrides.behaviouralMetrics,
      timePerStepSeconds
    }),
    metadata: stripUndefinedEntries({
      ...base.metadata,
      ...overrides.metadata
    })
  };
}
