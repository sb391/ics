import { AUTO_MODEL_CONFIG } from "./industries/auto/auto.constants";
import { scoreAutoLead } from "./industries/auto/auto.scorer";
import type { IndustryModelConfig, IndustryScoringModel, IndustrySlug } from "./scoring.types";

const autoModel: IndustryScoringModel = {
  industry: "auto",
  config: AUTO_MODEL_CONFIG as IndustryModelConfig,
  score: scoreAutoLead
};

const registry: Record<IndustrySlug, IndustryScoringModel> = {
  auto: autoModel
};

export function getIndustryModel(industry: IndustrySlug) {
  return registry[industry];
}
