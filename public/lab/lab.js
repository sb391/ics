const state = {
  config: null,
  latestResponse: null,
  latestSubmissionId: null,
  selectedSubmission: null,
  presets: [],
  selectedBreakdownKey: null
};

const metadataChannels = ["web", "mobile_web", "dealer_widget", "marketplace_widget"];
const LAB_SESSION_STORAGE_KEY = "ics_lab_session_id";
const LAB_FORM_ID = "ics_lab_form";
const LAB_SDK_VERSION = "lab-ui-0.4";
const fallbackLayerGuidance = {
  behaviouralScore: {
    title: "Behavioural Quality",
    diagnosticPurpose:
      "How the declaration was filled: pace, focus, friction, and whether the completion looks deliberate."
  },
  interactionScore: {
    title: "Interaction Depth",
    diagnosticPurpose:
      "How much interpretable context the buyer supplied across core questions, shortlist depth, and supporting detail."
  },
  demandScore: {
    title: "Demand Clarity",
    diagnosticPurpose:
      "How specific and near-term the buyer's demand looks based on shortlist maturity, product specificity, and next-step willingness."
  },
  consistencyScore: {
    title: "Consistency",
    diagnosticPurpose:
      "Whether the answers fit together logically, such as budget versus brands and usage versus body style."
  },
  readinessScore: {
    title: "Purchase Readiness",
    diagnosticPurpose:
      "Whether the buyer has a feasible and actionable path to transact, including funding readiness and field action intent."
  }
};
const breakdownLayerMap = {
  behaviouralScore: "behavioural",
  interactionScore: "interaction",
  demandScore: "demand",
  consistencyScore: "consistency",
  readinessScore: "readiness"
};

let scoreLimits = {
  behaviouralScore: 10,
  interactionScore: 15,
  demandScore: 25,
  consistencyScore: 25,
  readinessScore: 25
};

let stepKeys = [];

const formRefs = {
  budgetRange: document.getElementById("budget-range"),
  primaryPreference: document.getElementById("primary-preference"),
  purchaseTimeline: document.getElementById("purchase-timeline"),
  financePreference: document.getElementById("finance-preference"),
  downPaymentBand: document.getElementById("down-payment-band"),
  salaryBand: document.getElementById("salary-band"),
  tradeInAvailable: document.getElementById("trade-in-available"),
  bodyStyle: document.getElementById("body-style"),
  fuelType: document.getElementById("fuel-type"),
  usagePattern: document.getElementById("usage-pattern"),
  monthlyKmBand: document.getElementById("monthly-km-band"),
  purchaseReason: document.getElementById("purchase-reason"),
  currentVehicleAgeBand: document.getElementById("current-vehicle-age-band"),
  decisionMaker: document.getElementById("decision-maker"),
  variantClarity: document.getElementById("variant-clarity"),
  testDriveReadiness: document.getElementById("test-drive-readiness"),
  monthlyEmiComfortBand: document.getElementById("monthly-emi-comfort-band"),
  totalCompletionSeconds: document.getElementById("metric-total-completion"),
  backtracks: document.getElementById("metric-backtracks"),
  answerEdits: document.getElementById("metric-answer-edits"),
  idlePauses: document.getElementById("metric-idle-pauses"),
  tabSwitches: document.getElementById("metric-tab-switches"),
  scrollDepthPercent: document.getElementById("metric-scroll-depth"),
  completionRatePercent: document.getElementById("metric-completion-rate"),
  source: document.getElementById("meta-source"),
  campaign: document.getElementById("meta-campaign"),
  formId: document.getElementById("meta-form-id"),
  sessionId: document.getElementById("meta-session-id"),
  channel: document.getElementById("meta-channel"),
  sdkVersion: document.getElementById("meta-sdk-version")
};

const form = document.getElementById("score-form");
const presetActions = document.getElementById("preset-actions");
const brandsContainer = document.getElementById("brands-comparing");
const brandSelectionMeta = document.getElementById("brand-selection-meta");
const timePerStepGrid = document.getElementById("time-per-step-grid");
const scoreTotal = document.getElementById("score-total");
const scoreCategory = document.getElementById("score-category");
const scoreAction = document.getElementById("score-action");
const scoreCreatedAt = document.getElementById("score-created-at");
const weightStrip = document.getElementById("weight-strip");
const breakdownBars = document.getElementById("breakdown-bars");
const breakdownExplainer = document.getElementById("breakdown-explainer");
const positiveList = document.getElementById("positive-list");
const negativeList = document.getElementById("negative-list");
const normalizedGrid = document.getElementById("normalized-grid");
const responsePreview = document.getElementById("response-preview");
const healthPill = document.getElementById("health-pill");
const submissionsMeta = document.getElementById("submissions-meta");
const submissionsTableBody = document.getElementById("submissions-table-body");
const selectedSubmissionSummary = document.getElementById("selected-submission-summary");
const selectedSubmissionJson = document.getElementById("selected-submission-json");
const scoreButton = document.getElementById("score-button");
const storeButton = document.getElementById("store-button");
const resetButton = document.getElementById("reset-button");
const refreshSubmissionsButton = document.getElementById("refresh-submissions");
const copyPayloadButton = document.getElementById("copy-payload");
const autofillTimesButton = document.getElementById("autofill-times");
const filterMinScore = document.getElementById("filter-min-score");
const filterMaxScore = document.getElementById("filter-max-score");
const filterCategory = document.getElementById("filter-category");
const filterTimeline = document.getElementById("filter-timeline");
const filterFinance = document.getElementById("filter-finance");
const filterSort = document.getElementById("filter-sort");

document.addEventListener("DOMContentLoaded", async () => {
  bindEvents();

  try {
    await Promise.all([loadConfig(), checkHealth()]);
    clearResultPanels();
    await refreshSubmissions();
  } catch (error) {
    showToast(error.message || "Failed to load scoring lab.");
  }
});

function bindEvents() {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await scoreCurrentScenario();
  });

  storeButton.addEventListener("click", async () => {
    await storeCurrentScenario();
  });

  resetButton.addEventListener("click", (event) => {
    event.preventDefault();

    applyPayloadToForm(buildEmptyPayload());
    state.latestResponse = null;
    state.latestSubmissionId = null;
    state.selectedSubmission = null;
    clearResultPanels();
    showToast("Form cleared.");
  });

  refreshSubmissionsButton.addEventListener("click", async () => {
    await refreshSubmissions();
  });

  copyPayloadButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(buildPayloadFromForm(), null, 2));
      showToast("Payload copied to clipboard.");
    } catch {
      showToast("Clipboard access is unavailable.");
    }
  });

  autofillTimesButton.addEventListener("click", () => {
    autofillStepTimes();
  });

  [filterMinScore, filterMaxScore, filterCategory, filterTimeline, filterFinance, filterSort].forEach(
    (element) => {
      element.addEventListener("change", async () => {
        await refreshSubmissions();
      });
    }
  );
}

async function loadConfig() {
  const response = await fetch("/api/v1/config/auto");
  if (!response.ok) {
    throw new Error("Could not load auto model config.");
  }

  state.config = await response.json();
  scoreLimits = state.config.metadata?.scoreWeights ?? scoreLimits;
  stepKeys = Object.keys(state.config.supportedQuestions.answers);

  buildSelectOptions();
  buildBrandCheckboxes();
  createStepInputs();
  buildPresets();
  renderWeightStrip();
  applyPayloadToForm(buildEmptyPayload());
}

async function checkHealth() {
  const response = await fetch("/api/v1/health");
  if (!response.ok) {
    healthPill.textContent = "API unavailable";
    healthPill.className = "pill pill-bad";
    return;
  }

  const payload = await response.json();
  const databaseLabel = payload.database === "connected" ? "API ready" : "API ready (degraded)";
  healthPill.textContent = databaseLabel;
  healthPill.className = payload.database === "connected" ? "pill pill-ok" : "pill pill-muted";
}

function buildSelectOptions() {
  const answers = state.config.supportedQuestions.answers;

  populateSelect(formRefs.budgetRange, answers.budgetRange, "Not provided");
  populateSelect(formRefs.primaryPreference, answers.primaryPreference, "Not provided");
  populateSelect(formRefs.purchaseTimeline, answers.purchaseTimeline, "Not provided");
  populateSelect(formRefs.financePreference, answers.financePreference, "Not provided");
  populateSelect(formRefs.downPaymentBand, answers.downPaymentBand, "Not provided");
  populateSelect(formRefs.salaryBand, answers.salaryBand, "Not provided");
  populateSelect(formRefs.tradeInAvailable, answers.tradeInAvailable, "Not provided");
  populateSelect(formRefs.bodyStyle, answers.bodyStyle, "Not provided");
  populateSelect(formRefs.fuelType, answers.fuelType, "Not provided");
  populateSelect(formRefs.usagePattern, answers.usagePattern, "Not provided");
  populateSelect(formRefs.monthlyKmBand, answers.monthlyKmBand, "Not provided");
  populateSelect(formRefs.purchaseReason, answers.purchaseReason, "Not provided");
  populateSelect(formRefs.currentVehicleAgeBand, answers.currentVehicleAgeBand, "Not provided");
  populateSelect(formRefs.decisionMaker, answers.decisionMaker, "Not provided");
  populateSelect(formRefs.variantClarity, answers.variantClarity, "Not provided");
  populateSelect(formRefs.testDriveReadiness, answers.testDriveReadiness, "Not provided");
  populateSelect(formRefs.monthlyEmiComfortBand, answers.monthlyEmiComfortBand, "Not provided");
  populateSelect(formRefs.channel, metadataChannels, "Not provided");

  populateSelect(filterCategory, state.config.scoreBands.map((band) => band.slug), "All categories");
  populateSelect(filterTimeline, answers.purchaseTimeline, "All timelines");
  populateSelect(filterFinance, answers.financePreference, "All finance preferences");
}

function populateSelect(element, values, placeholder) {
  element.innerHTML = "";

  const blank = document.createElement("option");
  blank.value = "";
  blank.textContent = placeholder;
  element.appendChild(blank);

  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = formatEnum(value);
    element.appendChild(option);
  });
}

function buildBrandCheckboxes() {
  brandsContainer.innerHTML = "";

  state.config.supportedQuestions.answers.brandsComparing.forEach((brand) => {
    const label = document.createElement("label");
    label.className = "chip";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = brand;
    input.name = "brandsComparing";
    input.addEventListener("change", () => {
      const selectedBrands = getSelectedBrands();

      if (selectedBrands.length > 5) {
        input.checked = false;
        updateBrandSelectionMeta();
        showToast("You can compare up to 5 brands.");
        return;
      }

      updateBrandSelectionMeta();
    });

    label.appendChild(input);
    label.appendChild(document.createTextNode(formatEnum(brand)));
    brandsContainer.appendChild(label);
  });

  updateBrandSelectionMeta();
}

function createStepInputs() {
  timePerStepGrid.innerHTML = "";

  stepKeys.forEach((stepKey) => {
    const label = document.createElement("label");
    const title = document.createElement("span");
    const input = document.createElement("input");

    title.textContent = formatEnum(stepKey);
    input.type = "number";
    input.min = "0";
    input.step = "1";
    input.id = `step-${stepKey}`;

    label.appendChild(title);
    label.appendChild(input);
    timePerStepGrid.appendChild(label);
  });
}

function renderWeightStrip() {
  weightStrip.innerHTML = "";

  Object.entries(scoreLimits).forEach(([key, value]) => {
    const chip = document.createElement("div");
    chip.className = "weight-chip";
    chip.innerHTML = `<span>${formatEnum(key.replace("Score", ""))}</span><strong>${value}%</strong>`;
    weightStrip.appendChild(chip);
  });
}

function buildPresets() {
  state.presets = [
    {
      label: "Balanced Serious",
      payload: state.config.metadata.samplePayload
    },
    {
      label: "Luxury Upgrade",
      payload: {
        industry: "auto",
        answers: {
          budgetRange: "20_plus_lakh",
          primaryPreference: "brand_prestige",
          purchaseTimeline: "immediate",
          financePreference: "no",
          brandsComparing: ["bmw", "mercedes_benz"],
          downPaymentBand: "30_plus_percent",
          tradeInAvailable: true,
          salaryBand: "35_plus_lakh",
          bodyStyle: "luxury_suv",
          fuelType: "hybrid",
          usagePattern: "business_use",
          monthlyKmBand: "1000_2000",
          purchaseReason: "upgrade",
          currentVehicleAgeBand: "4_7_years",
          decisionMaker: "self",
          variantClarity: "exact_variant",
          testDriveReadiness: "scheduled_soon",
          monthlyEmiComfortBand: "35k_plus"
        },
        behaviouralMetrics: {
          totalCompletionSeconds: 214,
          timePerStepSeconds: {
            budgetRange: 16,
            primaryPreference: 12,
            purchaseTimeline: 14,
            financePreference: 9,
            brandsComparing: 24,
            downPaymentBand: 12,
            tradeInAvailable: 5,
            salaryBand: 10,
            bodyStyle: 9,
            fuelType: 11,
            usagePattern: 10,
            monthlyKmBand: 7,
            purchaseReason: 9,
            currentVehicleAgeBand: 6,
            decisionMaker: 7,
            variantClarity: 12,
            testDriveReadiness: 11,
            monthlyEmiComfortBand: 8
          },
          backtracks: 2,
          answerEdits: 2,
          idlePauses: 0,
          tabSwitches: 0,
          scrollDepthPercent: 96,
          completionRatePercent: 100
        },
        metadata: {
          source: "dealer_website",
          campaign: "luxury_march",
          formId: "lead_form_3",
          sessionId: "sess_luxury",
          channel: "web",
          sdkVersion: "lab-0.3"
        }
      }
    },
    {
      label: "Replacement Urgent",
      payload: {
        industry: "auto",
        answers: {
          budgetRange: "12_20_lakh",
          primaryPreference: "safety",
          purchaseTimeline: "30_days",
          financePreference: "yes",
          brandsComparing: ["tata", "mahindra"],
          downPaymentBand: "20_30_percent",
          tradeInAvailable: true,
          salaryBand: "10_20_lakh",
          bodyStyle: "suv",
          fuelType: "diesel",
          usagePattern: "highway_travel",
          monthlyKmBand: "2000_plus",
          purchaseReason: "replacement",
          currentVehicleAgeBand: "8_plus_years",
          decisionMaker: "self_and_spouse",
          variantClarity: "trim_shortlist",
          testDriveReadiness: "scheduled_soon",
          monthlyEmiComfortBand: "20k_35k"
        },
        behaviouralMetrics: {
          totalCompletionSeconds: 246,
          timePerStepSeconds: {
            budgetRange: 12,
            primaryPreference: 10,
            purchaseTimeline: 12,
            financePreference: 10,
            brandsComparing: 18,
            downPaymentBand: 10,
            tradeInAvailable: 4,
            salaryBand: 9,
            bodyStyle: 8,
            fuelType: 9,
            usagePattern: 12,
            monthlyKmBand: 8,
            purchaseReason: 11,
            currentVehicleAgeBand: 8,
            decisionMaker: 9,
            variantClarity: 10,
            testDriveReadiness: 10,
            monthlyEmiComfortBand: 8
          },
          backtracks: 2,
          answerEdits: 4,
          idlePauses: 1,
          tabSwitches: 1,
          scrollDepthPercent: 93,
          completionRatePercent: 100
        },
        metadata: {
          source: "dealer_website",
          campaign: "replacement_push",
          formId: "lead_form_4",
          sessionId: "sess_replace",
          channel: "dealer_widget",
          sdkVersion: "lab-0.3"
        }
      }
    },
    {
      label: "Broad Researcher",
      payload: {
        industry: "auto",
        answers: {
          budgetRange: "8_12_lakh",
          primaryPreference: "features",
          purchaseTimeline: "exploring",
          financePreference: "undecided",
          brandsComparing: ["hyundai", "kia", "tata", "mahindra", "toyota"],
          salaryBand: "10_20_lakh",
          bodyStyle: "suv",
          fuelType: "open",
          usagePattern: "family_use",
          monthlyKmBand: "500_1000",
          purchaseReason: "first_car",
          currentVehicleAgeBand: "none",
          decisionMaker: "family",
          variantClarity: "open",
          testDriveReadiness: "not_interested",
          monthlyEmiComfortBand: "not_sure"
        },
        behaviouralMetrics: {
          totalCompletionSeconds: 118,
          timePerStepSeconds: {
            budgetRange: 7,
            primaryPreference: 7,
            purchaseTimeline: 8,
            financePreference: 6,
            brandsComparing: 9,
            salaryBand: 6,
            bodyStyle: 7,
            fuelType: 5,
            usagePattern: 6,
            monthlyKmBand: 4,
            purchaseReason: 5,
            currentVehicleAgeBand: 3,
            decisionMaker: 5,
            variantClarity: 3,
            testDriveReadiness: 2,
            monthlyEmiComfortBand: 3
          },
          backtracks: 1,
          answerEdits: 1,
          idlePauses: 2,
          tabSwitches: 2,
          scrollDepthPercent: 68,
          completionRatePercent: 92
        },
        metadata: {
          source: "marketplace_widget",
          campaign: "awareness",
          formId: "lead_form_5",
          sessionId: "sess_broad",
          channel: "mobile_web",
          sdkVersion: "lab-0.3"
        }
      }
    },
    {
      label: "Premium Stretch",
      payload: {
        industry: "auto",
        answers: {
          budgetRange: "under_8_lakh",
          primaryPreference: "brand_prestige",
          purchaseTimeline: "30_days",
          financePreference: "no",
          brandsComparing: ["bmw"],
          downPaymentBand: "below_10_percent",
          tradeInAvailable: false,
          salaryBand: "under_5_lakh",
          bodyStyle: "sedan",
          fuelType: "petrol",
          usagePattern: "city_commute",
          monthlyKmBand: "under_500",
          purchaseReason: "upgrade",
          currentVehicleAgeBand: "4_7_years",
          decisionMaker: "family",
          variantClarity: "open",
          testDriveReadiness: "open",
          monthlyEmiComfortBand: "under_10k"
        },
        behaviouralMetrics: {
          totalCompletionSeconds: 78,
          timePerStepSeconds: {
            budgetRange: 5,
            primaryPreference: 5,
            purchaseTimeline: 5,
            financePreference: 5,
            brandsComparing: 7,
            salaryBand: 6,
            bodyStyle: 4,
            purchaseReason: 5,
            currentVehicleAgeBand: 4,
            variantClarity: 4,
            testDriveReadiness: 4
          },
          backtracks: 5,
          answerEdits: 7,
          idlePauses: 3,
          tabSwitches: 4,
          scrollDepthPercent: 48,
          completionRatePercent: 86
        },
        metadata: {
          source: "dealer_website",
          campaign: "premium_stretch",
          formId: "lead_form_6",
          sessionId: "sess_stretch",
          channel: "web",
          sdkVersion: "lab-0.3"
        }
      }
    }
  ];

  presetActions.innerHTML = "";
  state.presets.forEach((preset) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "preset-button";
    button.textContent = preset.label;
    button.addEventListener("click", () => {
      applyPayloadToForm(preset.payload);
      clearResultPanels();
    });
    presetActions.appendChild(button);
  });
}

function applyPayloadToForm(payload) {
  const answers = payload.answers ?? {};
  const behaviouralMetrics = payload.behaviouralMetrics ?? {};
  const metadata = {
    ...getAutoMetadata(),
    ...(payload.metadata ?? {})
  };

  formRefs.budgetRange.value = answers.budgetRange ?? "";
  formRefs.primaryPreference.value = answers.primaryPreference ?? "";
  formRefs.purchaseTimeline.value = answers.purchaseTimeline ?? "";
  formRefs.financePreference.value = answers.financePreference ?? "";
  formRefs.downPaymentBand.value = answers.downPaymentBand ?? "";
  formRefs.salaryBand.value = answers.salaryBand ?? "";
  formRefs.tradeInAvailable.value =
    answers.tradeInAvailable === undefined ? "" : String(answers.tradeInAvailable);
  formRefs.bodyStyle.value = answers.bodyStyle ?? "";
  formRefs.fuelType.value = answers.fuelType ?? "";
  formRefs.usagePattern.value = answers.usagePattern ?? "";
  formRefs.monthlyKmBand.value = answers.monthlyKmBand ?? "";
  formRefs.purchaseReason.value = answers.purchaseReason ?? "";
  formRefs.currentVehicleAgeBand.value = answers.currentVehicleAgeBand ?? "";
  formRefs.decisionMaker.value = answers.decisionMaker ?? "";
  formRefs.variantClarity.value = answers.variantClarity ?? "";
  formRefs.testDriveReadiness.value = answers.testDriveReadiness ?? "";
  formRefs.monthlyEmiComfortBand.value = answers.monthlyEmiComfortBand ?? "";

  formRefs.totalCompletionSeconds.value = behaviouralMetrics.totalCompletionSeconds ?? "";
  formRefs.backtracks.value = behaviouralMetrics.backtracks ?? "";
  formRefs.answerEdits.value = behaviouralMetrics.answerEdits ?? "";
  formRefs.idlePauses.value = behaviouralMetrics.idlePauses ?? "";
  formRefs.tabSwitches.value = behaviouralMetrics.tabSwitches ?? "";
  formRefs.scrollDepthPercent.value = behaviouralMetrics.scrollDepthPercent ?? "";
  formRefs.completionRatePercent.value = behaviouralMetrics.completionRatePercent ?? "";

  formRefs.source.value = metadata.source ?? "";
  formRefs.campaign.value = metadata.campaign ?? "";
  formRefs.formId.value = metadata.formId ?? "";
  formRefs.sessionId.value = metadata.sessionId ?? "";
  formRefs.channel.value = metadata.channel ?? "";
  formRefs.sdkVersion.value = metadata.sdkVersion ?? "";

  const selectedBrands = new Set(answers.brandsComparing ?? []);
  brandsContainer.querySelectorAll("input[type='checkbox']").forEach((checkbox) => {
    checkbox.checked = selectedBrands.has(checkbox.value);
  });
  updateBrandSelectionMeta();

  stepKeys.forEach((stepKey) => {
    const input = document.getElementById(`step-${stepKey}`);
    input.value = behaviouralMetrics.timePerStepSeconds?.[stepKey] ?? "";
  });
}

function buildPayloadFromForm() {
  const answers = buildAnswersFromForm();
  const behaviouralMetrics = buildBehaviouralMetricsFromForm();
  const metadata = buildMetadataFromForm();

  return {
    industry: "auto",
    answers,
    behaviouralMetrics,
    metadata
  };
}

function buildAnswersFromForm() {
  const answers = {};

  assignIfFilled(answers, "budgetRange", formRefs.budgetRange.value);
  assignIfFilled(answers, "primaryPreference", formRefs.primaryPreference.value);
  assignIfFilled(answers, "purchaseTimeline", formRefs.purchaseTimeline.value);
  assignIfFilled(answers, "financePreference", formRefs.financePreference.value);
  assignIfFilled(answers, "downPaymentBand", formRefs.downPaymentBand.value);
  assignIfFilled(answers, "salaryBand", formRefs.salaryBand.value);
  assignIfFilled(answers, "bodyStyle", formRefs.bodyStyle.value);
  assignIfFilled(answers, "fuelType", formRefs.fuelType.value);
  assignIfFilled(answers, "usagePattern", formRefs.usagePattern.value);
  assignIfFilled(answers, "monthlyKmBand", formRefs.monthlyKmBand.value);
  assignIfFilled(answers, "purchaseReason", formRefs.purchaseReason.value);
  assignIfFilled(answers, "currentVehicleAgeBand", formRefs.currentVehicleAgeBand.value);
  assignIfFilled(answers, "decisionMaker", formRefs.decisionMaker.value);
  assignIfFilled(answers, "variantClarity", formRefs.variantClarity.value);
  assignIfFilled(answers, "testDriveReadiness", formRefs.testDriveReadiness.value);
  assignIfFilled(answers, "monthlyEmiComfortBand", formRefs.monthlyEmiComfortBand.value);

  if (formRefs.tradeInAvailable.value) {
    answers.tradeInAvailable = formRefs.tradeInAvailable.value === "true";
  }

  const brandsComparing = getSelectedBrands();
  if (brandsComparing.length > 0) {
    answers.brandsComparing = brandsComparing;
  }

  return answers;
}

function buildBehaviouralMetricsFromForm() {
  const behaviouralMetrics = {};

  assignIfNumber(behaviouralMetrics, "totalCompletionSeconds", formRefs.totalCompletionSeconds.value);
  assignIfNumber(behaviouralMetrics, "backtracks", formRefs.backtracks.value);
  assignIfNumber(behaviouralMetrics, "answerEdits", formRefs.answerEdits.value);
  assignIfNumber(behaviouralMetrics, "idlePauses", formRefs.idlePauses.value);
  assignIfNumber(behaviouralMetrics, "tabSwitches", formRefs.tabSwitches.value);
  assignIfNumber(behaviouralMetrics, "scrollDepthPercent", formRefs.scrollDepthPercent.value);
  assignIfNumber(behaviouralMetrics, "completionRatePercent", formRefs.completionRatePercent.value);

  const timePerStepSeconds = {};
  stepKeys.forEach((stepKey) => {
    const value = document.getElementById(`step-${stepKey}`).value;
    if (value !== "") {
      timePerStepSeconds[stepKey] = Number(value);
    }
  });

  behaviouralMetrics.timePerStepSeconds = timePerStepSeconds;
  return behaviouralMetrics;
}

function buildMetadataFromForm() {
  const metadata = getAutoMetadata();

  assignIfFilled(metadata, "source", formRefs.source.value);
  assignIfFilled(metadata, "campaign", formRefs.campaign.value);
  assignIfFilled(metadata, "formId", formRefs.formId.value);
  assignIfFilled(metadata, "sessionId", formRefs.sessionId.value);
  assignIfFilled(metadata, "channel", formRefs.channel.value);
  assignIfFilled(metadata, "sdkVersion", formRefs.sdkVersion.value);

  return omitEmptyEntries(metadata);
}

async function scoreCurrentScenario() {
  setLoading(scoreButton, true, "Scoring...");

  try {
    const response = await fetch("/api/v1/score", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(buildPayloadFromForm())
    });

    const body = await response.json();
    if (!response.ok) {
      throw new Error(extractErrorMessage(body, "Score request failed."));
    }

    state.latestResponse = body;
    state.latestSubmissionId = null;
    renderScoreResult(body);
    showToast("Scenario scored successfully.");
  } catch (error) {
    showToast(error.message || "Failed to score scenario.");
  } finally {
    setLoading(scoreButton, false, "Score Scenario");
  }
}

async function storeCurrentScenario() {
  setLoading(storeButton, true, "Storing...");

  try {
    const response = await fetch("/api/v1/submissions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(buildPayloadFromForm())
    });

    const body = await response.json();
    if (!response.ok) {
      throw new Error(extractErrorMessage(body, "Store submission failed."));
    }

    state.latestResponse = body;
    state.latestSubmissionId = body.submissionId;
    renderScoreResult(body);
    await refreshSubmissions();
    showToast("Submission stored and scored.");
  } catch (error) {
    showToast(error.message || "Failed to store submission.");
  } finally {
    setLoading(storeButton, false, "Store Submission");
  }
}

function renderScoreResult(response) {
  state.latestResponse = response;
  scoreTotal.textContent = String(response.totalScore ?? 0);
  scoreCategory.textContent = response.category ?? "Unknown";
  scoreAction.textContent = response.recommendedAction ?? "No recommended action";
  scoreCreatedAt.textContent = response.createdAt ? `Created ${formatDate(response.createdAt)}` : "";
  responsePreview.textContent = JSON.stringify(response, null, 2);

  renderBreakdown(
    response.breakdown ?? {},
    response.ruleContributions ?? [],
    response.normalizedAnswers ?? {}
  );
  renderSignalList(positiveList, response.positives, "signal-positive");
  renderSignalList(negativeList, response.negatives, "signal-negative");
  renderNormalizedGrid(response.normalizedAnswers ?? {});
}

function renderBreakdown(breakdown, ruleContributions, normalizedAnswers) {
  breakdownBars.innerHTML = "";
  const nextSelectedKey = getInitialBreakdownKey(breakdown);
  state.selectedBreakdownKey = nextSelectedKey;

  Object.entries(scoreLimits).forEach(([key, limit]) => {
    const value = Number(breakdown[key] ?? 0);
    const row = document.createElement("button");
    row.type = "button";
    row.className = `breakdown-row breakdown-button fade-up${
      nextSelectedKey === key ? " active" : ""
    }`;
    row.dataset.breakdownKey = key;
    row.addEventListener("click", () => {
      state.selectedBreakdownKey = key;
      updateBreakdownSelection();
      renderBreakdownExplanation(key, breakdown, ruleContributions, normalizedAnswers);
    });

    const meta = document.createElement("div");
    meta.className = "breakdown-meta";
    meta.innerHTML = `<span>${formatEnum(key)}</span><strong>${value}/${limit}</strong>`;

    const track = document.createElement("div");
    track.className = "breakdown-track";
    const fill = document.createElement("div");
    fill.className = "breakdown-fill";
    fill.style.width = `${Math.min(100, (value / limit) * 100)}%`;

    track.appendChild(fill);
    row.appendChild(meta);
    row.appendChild(track);
    breakdownBars.appendChild(row);
  });

  renderBreakdownExplanation(nextSelectedKey, breakdown, ruleContributions, normalizedAnswers);
}

function renderBreakdownExplanation(selectedKey, breakdown, ruleContributions, normalizedAnswers) {
  if (!selectedKey || !breakdownExplainer) {
    return;
  }

  const guidance = getBreakdownGuidance(selectedKey);
  const layer = breakdownLayerMap[selectedKey];
  const limit = Number(scoreLimits[selectedKey] ?? 0);
  const value = Number(breakdown[selectedKey] ?? 0);
  const ratio = limit === 0 ? 0 : value / limit;
  const tone =
    ratio >= 0.75 ? "strong" : ratio >= 0.45 ? "mixed" : value === 0 ? "neutral" : "weak";
  const toneLabel =
    tone === "strong"
      ? "This section is strengthening the score."
      : tone === "mixed"
        ? "This section is contributing, but with mixed evidence."
        : tone === "weak"
          ? "This section is holding the score back."
          : "This section stayed mostly neutral.";
  const contributions = (ruleContributions ?? []).filter((contribution) => contribution.layer === layer);
  const positives = contributions
    .filter((contribution) => contribution.points > 0)
    .sort((left, right) => right.points - left.points)
    .slice(0, 3);
  const negatives = contributions
    .filter((contribution) => contribution.points < 0)
    .sort((left, right) => left.points - right.points)
    .slice(0, 3);
  const completionNote =
    selectedKey === "behaviouralScore" && normalizedAnswers.completionRateSource === "derived_from_declaration"
      ? `<p class="breakdown-note">Completion was inferred from declaration coverage because no explicit frontend completion metric was provided.</p>`
      : "";

  breakdownExplainer.innerHTML = `
    <div class="breakdown-explainer-head">
      <div>
        <span class="breakdown-kicker">${escapeHtml(guidance.title)}</span>
        <strong>${value}/${limit}</strong>
      </div>
      <span class="breakdown-pill breakdown-pill-${tone}">${escapeHtml(toneLabel)}</span>
    </div>
    <p class="breakdown-copy">${escapeHtml(guidance.diagnosticPurpose)}</p>
    ${completionNote}
    <div class="breakdown-columns">
      <div>
        <h4>What helped</h4>
        ${renderContributionSummary(positives, "No strong positive rules fired in this section.")}
      </div>
      <div>
        <h4>What reduced confidence</h4>
        ${renderContributionSummary(negatives, "No notable deductions fired in this section.")}
      </div>
    </div>
  `;
}

function renderContributionSummary(contributions, emptyMessage) {
  if (!contributions.length) {
    return `<div class="empty-state compact">${escapeHtml(emptyMessage)}</div>`;
  }

  return `
    <ul class="breakdown-rule-list">
      ${contributions
        .map(
          (contribution) => `
            <li>
              <div class="breakdown-rule-head">
                <strong>${escapeHtml(formatReason(contribution.ruleCode))}</strong>
                <span class="${contribution.points >= 0 ? "rule-points-positive" : "rule-points-negative"}">
                  ${contribution.points >= 0 ? "+" : ""}${contribution.points}
                </span>
              </div>
              <p>${escapeHtml(contribution.reason)}</p>
            </li>
          `
        )
        .join("")}
    </ul>
  `;
}

function getInitialBreakdownKey(breakdown) {
  if (state.selectedBreakdownKey && scoreLimits[state.selectedBreakdownKey] !== undefined) {
    return state.selectedBreakdownKey;
  }

  return Object.keys(scoreLimits).sort(
    (left, right) => Number(breakdown[right] ?? 0) - Number(breakdown[left] ?? 0)
  )[0];
}

function updateBreakdownSelection() {
  breakdownBars.querySelectorAll("[data-breakdown-key]").forEach((element) => {
    element.classList.toggle("active", element.dataset.breakdownKey === state.selectedBreakdownKey);
  });
}

function getBreakdownGuidance(key) {
  return state.config?.metadata?.scoreLayerGuidance?.[key] ?? fallbackLayerGuidance[key];
}

function renderSignalList(element, items, className) {
  element.className = `signal-list ${className}`;
  element.innerHTML = "";

  const source = Array.isArray(items) && items.length > 0 ? items : ["No notable signals"];
  source.forEach((item) => {
    const listItem = document.createElement("li");
    listItem.textContent = formatReason(item);
    element.appendChild(listItem);
  });
}

function renderNormalizedGrid(normalizedAnswers) {
  normalizedGrid.innerHTML = "";

  const entries = Object.entries(normalizedAnswers).filter(([, value]) => isDisplayableValue(value));
  if (entries.length === 0) {
    normalizedGrid.innerHTML = '<div class="empty-state">Run a score to inspect normalized values.</div>';
    return;
  }

  entries.forEach(([key, value]) => {
    const card = document.createElement("div");
    card.className = "insight-card fade-up";
    card.innerHTML = `<span>${formatEnum(key)}</span><strong>${formatValue(value)}</strong>`;
    normalizedGrid.appendChild(card);
  });
}

async function refreshSubmissions() {
  const [sortBy, sortOrder] = filterSort.value.split(":");
  const query = new URLSearchParams();

  assignQuery(query, "minScore", filterMinScore.value);
  assignQuery(query, "maxScore", filterMaxScore.value);
  assignQuery(query, "category", filterCategory.value);
  assignQuery(query, "timeline", filterTimeline.value);
  assignQuery(query, "financePreference", filterFinance.value);
  query.set("sortBy", sortBy);
  query.set("sortOrder", sortOrder);

  const response = await fetch(`/api/v1/submissions?${query.toString()}`);
  const body = await response.json();

  if (!response.ok) {
    throw new Error(extractErrorMessage(body, "Could not load submissions."));
  }

  renderSubmissionTable(body.data ?? [], body.pagination ?? null);

  if (state.latestSubmissionId) {
    await loadSubmissionDetail(state.latestSubmissionId);
  }
}

function renderSubmissionTable(items, pagination) {
  submissionsTableBody.innerHTML = "";
  submissionsMeta.textContent = pagination
    ? `${pagination.totalItems} item(s), page ${pagination.page} of ${Math.max(pagination.totalPages, 1)}`
    : "No stored submissions yet.";

  if (!items.length) {
    const row = document.createElement("tr");
    row.innerHTML = '<td colspan="7" class="empty-state">No submissions match the current filters.</td>';
    submissionsTableBody.appendChild(row);
    return;
  }

  items.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><button class="row-button" data-submission-id="${item.id}">${escapeHtml(item.id.slice(0, 12))}...</button></td>
      <td>${escapeHtml(composeDemandSummary(item))}</td>
      <td><span class="score-badge">${item.totalScore}</span></td>
      <td>${escapeHtml(item.category)}</td>
      <td>${escapeHtml(item.purchaseTimeline || "-")}</td>
      <td>${escapeHtml(item.financePreference || "-")}</td>
      <td>${escapeHtml(formatDate(item.createdAt))}</td>
    `;
    submissionsTableBody.appendChild(row);
  });

  submissionsTableBody.querySelectorAll("[data-submission-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      await loadSubmissionDetail(button.dataset.submissionId);
    });
  });
}

async function loadSubmissionDetail(id) {
  const response = await fetch(`/api/v1/submissions/${id}`);
  const body = await response.json();

  if (!response.ok) {
    throw new Error(extractErrorMessage(body, "Could not load submission."));
  }

  state.selectedSubmission = body;
  state.latestSubmissionId = body.submissionId;
  selectedSubmissionSummary.innerHTML = `
    <strong>${escapeHtml(body.category)}</strong> at <strong>${body.totalScore}</strong>.
    Demand: <strong>${escapeHtml(composeDemandSummary(body.answers ?? {}))}</strong>.
    Recommended action: <strong>${escapeHtml(body.recommendedAction)}</strong>.
  `;
  selectedSubmissionJson.textContent = JSON.stringify(body, null, 2);
  renderScoreResult(body);
}

function clearResultPanels() {
  scoreTotal.textContent = "--";
  scoreCategory.textContent = "No result yet";
  scoreAction.textContent = "Submit a scenario to see recommended action.";
  scoreCreatedAt.textContent = "";
  breakdownBars.innerHTML = "";
  state.selectedBreakdownKey = null;
  if (breakdownExplainer) {
    breakdownExplainer.textContent = "Click a section to inspect why it scored the way it did.";
  }
  renderSignalList(positiveList, [], "signal-positive");
  renderSignalList(negativeList, [], "signal-negative");
  normalizedGrid.innerHTML = '<div class="empty-state">Run a score to inspect normalized values.</div>';
  responsePreview.textContent = "No API response yet.";
}

function buildEmptyPayload() {
  return {
    industry: "auto",
    answers: {},
    behaviouralMetrics: {
      timePerStepSeconds: {}
    },
    metadata: {}
  };
}

function extractErrorMessage(body, fallback) {
  const fieldErrors = Object.values(body?.error?.details?.fieldErrors ?? {}).flat().filter(Boolean);
  const formErrors = body?.error?.details?.formErrors ?? [];

  return fieldErrors[0] || formErrors[0] || body?.error?.message || fallback;
}

function autofillStepTimes() {
  const defaults = {
    budgetRange: 12,
    primaryPreference: 9,
    purchaseTimeline: 11,
    financePreference: 8,
    brandsComparing: 18,
    downPaymentBand: 10,
    tradeInAvailable: 5,
    salaryBand: 9,
    bodyStyle: 8,
    fuelType: 9,
    usagePattern: 11,
    monthlyKmBand: 7,
    purchaseReason: 10,
    currentVehicleAgeBand: 6,
    decisionMaker: 8,
    variantClarity: 10,
    testDriveReadiness: 9,
    monthlyEmiComfortBand: 8
  };

  const answers = buildAnswersFromForm();

  stepKeys.forEach((stepKey) => {
    if (!isStepAnswered(stepKey, answers)) {
      return;
    }

    const input = document.getElementById(`step-${stepKey}`);
    if (input.value === "") {
      input.value = defaults[stepKey];
    }
  });
}

function getSelectedBrands() {
  return [...brandsContainer.querySelectorAll("input[type='checkbox']:checked")].map(
    (checkbox) => checkbox.value
  );
}

function updateBrandSelectionMeta() {
  if (!brandSelectionMeta) {
    return;
  }

  brandSelectionMeta.textContent = `${getSelectedBrands().length}/5 selected`;
}

function composeDemandSummary(source) {
  const pieces = [source.purchaseReason, source.bodyStyle, source.testDriveReadiness]
    .filter(Boolean)
    .map((value) => formatEnum(value));

  return pieces.length > 0 ? pieces.join(" / ") : "Unspecified scenario";
}

function isStepAnswered(stepKey, answers) {
  if (stepKey === "brandsComparing") {
    return Array.isArray(answers.brandsComparing) && answers.brandsComparing.length > 0;
  }

  if (stepKey === "tradeInAvailable") {
    return answers.tradeInAvailable !== undefined;
  }

  return answers[stepKey] !== undefined;
}

function isDisplayableValue(value) {
  if (value === null || value === undefined || value === "") {
    return false;
  }

  if (typeof value === "string" && value === "unknown") {
    return false;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return true;
}

function formatValue(value) {
  if (Array.isArray(value)) {
    return value.map((item) => formatEnum(item)).join(", ");
  }

  if (typeof value === "boolean") {
    return value ? "True" : "False";
  }

  if (typeof value === "number") {
    return String(value);
  }

  return formatEnum(value);
}

function assignIfFilled(target, key, value) {
  if (value !== "") {
    target[key] = value;
  }
}

function assignIfNumber(target, key, value) {
  if (value !== "") {
    target[key] = Number(value);
  }
}

function assignQuery(searchParams, key, value) {
  if (value !== "") {
    searchParams.set(key, value);
  }
}

function formatEnum(value) {
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatReason(reasonCode) {
  return formatEnum(reasonCode).replace(/([0-9]) ([A-Za-z])/g, "$1$2");
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function setLoading(button, isLoading, label) {
  button.disabled = isLoading;
  button.textContent = label;
}

function showToast(message) {
  const existing = document.querySelector(".toast");
  if (existing) {
    existing.remove();
  }

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);

  window.setTimeout(() => {
    toast.remove();
  }, 2600);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getAutoMetadata() {
  const query = new URLSearchParams(window.location.search);

  return omitEmptyEntries({
    source: query.get("source") || inferSource(),
    campaign: query.get("campaign") || undefined,
    formId: query.get("formId") || LAB_FORM_ID,
    sessionId: getLabSessionId(),
    channel: inferChannel(),
    sdkVersion: LAB_SDK_VERSION
  });
}

function getLabSessionId() {
  const existing = window.sessionStorage.getItem(LAB_SESSION_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const generated =
    typeof window.crypto?.randomUUID === "function"
      ? `lab_${window.crypto.randomUUID()}`
      : `lab_${Date.now()}`;
  window.sessionStorage.setItem(LAB_SESSION_STORAGE_KEY, generated);
  return generated;
}

function inferSource() {
  const host = window.location.hostname || "local";
  return host === "localhost" || host === "127.0.0.1" ? "ics_scoring_lab" : host.replaceAll(".", "_");
}

function inferChannel() {
  return window.matchMedia("(max-width: 720px)").matches ? "mobile_web" : "web";
}

function omitEmptyEntries(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== null && entry !== "")
  );
}
