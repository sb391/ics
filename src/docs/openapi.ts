import {
  AUTO_MODEL_CONFIG,
  AUTO_PREDICTION_NOTE,
  AUTO_RULESET_VERSION,
  AUTO_SAMPLE_PAYLOAD,
  AUTO_SCORE_VERSION,
  AUTO_WEIGHT_VERSION
} from "../modules/scoring/industries/auto/auto.constants";

const scoreBreakdownExample = {
  behaviouralScore: 8,
  interactionScore: 13,
  demandScore: 22,
  consistencyScore: 21,
  readinessScore: 20
};

const ruleContributionExample = {
  ruleCode: "TEST_DRIVE_MOMENTUM",
  layer: "demand",
  signalCategories: ["urgency", "commitment", "purchase_readiness"],
  points: 5,
  direction: "positive",
  reason: "A near-term test drive is one of the strongest demand-to-action bridges in dealer funnels."
};

const predictionContextExample = {
  posture: "prediction_under_validation",
  note: AUTO_PREDICTION_NOTE
};

const consumerDemandRequestExample = {
  ...AUTO_SAMPLE_PAYLOAD,
  routing: {
    pincode: "560001",
    city: "Bengaluru",
    locality: "Ashok Nagar",
    addressLine: "MG Road"
  },
  consent: {
    dealerContactConsent: true,
    consentedAt: "2026-03-15T10:25:00.000Z",
    privacyNoticeVersion: "consumer-web-1.0",
    consentSource: "consumer_web"
  }
};

const consumerDemandResponseExample = {
  demandId: "sub_12345",
  submissionId: "sub_12345",
  status: "recorded",
  message: "Your demand has been recorded. We are identifying relevant options and dealers in your area.",
  routingStatus: "ready_for_assignment",
  dealerMatchStatus: "matched",
  assignedDealerId: "dealer_bengaluru_01",
  city: "Bengaluru",
  pincode: "560001",
  createdAt: "2026-03-15T10:30:00.000Z"
};

const scoreResponseExample = {
  submissionId: "score_12345",
  totalScore: 84,
  category: "Serious Buyer",
  breakdown: scoreBreakdownExample,
  positives: [
    "DEMAND_PROFILE_HIGH_CLARITY",
    "FUNDED_BUY_PATH",
    "URGENT_AND_COHERENT_BUY_PATH",
    "TEST_DRIVE_MOMENTUM"
  ],
  negatives: [],
  recommendedAction: "Priority callback within 2 hours",
  normalizedAnswers: {
    demandClarity: "high",
    demandStage: "transaction_ready",
    fundingReadiness: "strong",
    salaryBudgetAlignment: "strong",
    budgetBrandAlignment: "strong",
    comparisonBreadth: "focused"
  },
  ruleContributions: [ruleContributionExample],
  scoreVersion: AUTO_SCORE_VERSION,
  weightVersion: AUTO_WEIGHT_VERSION,
  ruleSetVersion: AUTO_RULESET_VERSION,
  predictionContext: predictionContextExample,
  createdAt: "2026-03-15T10:30:00.000Z"
};

const outcomeEventExample = {
  id: "out_12345",
  status: "converted",
  source: "crm_sync",
  note: "Retail conversion confirmed by dealer CRM.",
  happenedAt: "2026-03-20T16:00:00.000Z",
  createdAt: "2026-03-20T16:05:00.000Z"
};

const submissionSummaryExample = {
  id: "sub_12345",
  industry: "auto",
  purchaseReason: "upgrade",
  bodyStyle: "suv",
  totalScore: 84,
  category: "Serious Buyer",
  recommendedAction: "Priority callback within 2 hours",
  financePreference: "yes",
  purchaseTimeline: "30_days",
  testDriveReadiness: "scheduled_soon",
  currentOutcomeStatus: "converted",
  routingStatus: "ready_for_assignment",
  dealerMatchStatus: "matched",
  assignedDealerId: "dealer_bengaluru_01",
  city: "Bengaluru",
  pincode: "560001",
  scoreVersion: AUTO_SCORE_VERSION,
  ruleSetVersion: AUTO_RULESET_VERSION,
  createdAt: "2026-03-15T10:30:00.000Z"
};

const submissionDetailExample = {
  submissionId: "sub_12345",
  industry: "auto",
  answers: AUTO_SAMPLE_PAYLOAD.answers,
  behaviouralMetrics: AUTO_SAMPLE_PAYLOAD.behaviouralMetrics,
  metadata: AUTO_SAMPLE_PAYLOAD.metadata,
  routing: consumerDemandRequestExample.routing,
  consent: consumerDemandRequestExample.consent,
  totalScore: 84,
  category: "Serious Buyer",
  breakdown: scoreBreakdownExample,
  positives: scoreResponseExample.positives,
  negatives: [],
  recommendedAction: "Priority callback within 2 hours",
  normalizedAnswers: scoreResponseExample.normalizedAnswers,
  ruleContributions: [ruleContributionExample],
  scoreVersion: AUTO_SCORE_VERSION,
  weightVersion: AUTO_WEIGHT_VERSION,
  ruleSetVersion: AUTO_RULESET_VERSION,
  predictionContext: predictionContextExample,
  outcomes: [outcomeEventExample],
  outcomeSummary: {
    latestStatus: "converted",
    journey: ["contacted", "qualified", "visit_booked", "finance_applied", "converted"],
    convertedAt: "2026-03-20T16:00:00.000Z",
    terminalDisposition: "converted"
  },
  rawPayload: AUTO_SAMPLE_PAYLOAD,
  webhookEvent: {
    eventId: "evt_12345",
    eventType: "ics.submission.scored",
    version: "2026-03-15",
    occurredAt: "2026-03-15T10:30:00.000Z",
    submission: {
      id: "sub_12345",
      industry: "auto",
      totalScore: 84,
      category: {
        slug: "serious_buyer",
        label: "Serious Buyer"
      },
      recommendedAction: "Priority callback within 2 hours",
      breakdown: scoreBreakdownExample,
      positives: scoreResponseExample.positives,
      negatives: [],
      scoreVersion: AUTO_SCORE_VERSION,
      weightVersion: AUTO_WEIGHT_VERSION,
      ruleSetVersion: AUTO_RULESET_VERSION,
      financePreference: "yes",
      purchaseTimeline: "30_days",
      purchaseReason: "upgrade",
      testDriveReadiness: "scheduled_soon",
      metadata: AUTO_SAMPLE_PAYLOAD.metadata,
      predictionContext: predictionContextExample
    }
  },
  createdAt: "2026-03-15T10:30:00.000Z",
  updatedAt: "2026-03-20T16:05:00.000Z"
};

const validationAnalyticsExample = {
  generatedAt: "2026-03-21T09:00:00.000Z",
  posture: predictionContextExample,
  dataset: {
    totalSubmissions: 42,
    labeledSubmissions: 30,
    convertedSubmissions: 8,
    rejectedOrJunkSubmissions: 7
  },
  conversionRateByBand: [
    {
      bandSlug: "casual_browser",
      bandLabel: "Casual Browser",
      totalSubmissions: 10,
      labeledSubmissions: 7,
      convertedSubmissions: 0,
      conversionRate: 0,
      labeledConversionRate: 0
    },
    {
      bandSlug: "serious_buyer",
      bandLabel: "Serious Buyer",
      totalSubmissions: 12,
      labeledSubmissions: 10,
      convertedSubmissions: 5,
      conversionRate: 0.417,
      labeledConversionRate: 0.5
    }
  ],
  averageScoreComparison: {
    converted: 84.5,
    nonConverted: 52.4
  },
  falsePositives: {
    definition: "High-intent predictions that later reached rejected or junk outcomes.",
    count: 2,
    submissions: []
  },
  falseNegatives: {
    definition: "Low-intent predictions that later reached visit booked, finance applied, or converted outcomes.",
    count: 1,
    submissions: []
  },
  topPerformingRules: [
    {
      ruleCode: "TEST_DRIVE_MOMENTUM",
      layer: "demand",
      firedCount: 8,
      labeledCount: 8,
      convertedCount: 5,
      conversionRate: 0.625,
      conversionLift: 0.358,
      negativeOutcomeRate: 0.125,
      averageContribution: 5
    }
  ],
  weakestRules: [
    {
      ruleCode: "OVERLY_BROAD_SHORTLIST",
      layer: "interaction",
      firedCount: 6,
      labeledCount: 6,
      convertedCount: 0,
      conversionRate: 0,
      conversionLift: -0.267,
      negativeOutcomeRate: 0.5,
      averageContribution: -1
    }
  ],
  funnelByScoreBand: [
    {
      bandSlug: "serious_buyer",
      bandLabel: "Serious Buyer",
      totalSubmissions: 12,
      contacted: 10,
      qualified: 8,
      visitBooked: 6,
      financeApplied: 4,
      converted: 5,
      rejected: 1,
      junk: 0
    }
  ],
  versionCoverage: {
    scoreVersions: [{ version: AUTO_SCORE_VERSION, count: 42 }],
    weightVersions: [{ version: AUTO_WEIGHT_VERSION, count: 42 }],
    ruleSetVersions: [{ version: AUTO_RULESET_VERSION, count: 42 }]
  }
};

const analyticsSnapshotExample = {
  id: "snap_12345",
  snapshotDate: "2026-03-21",
  generatedAt: "2026-03-21T09:00:00.000Z",
  totalSubmissions: 42,
  labeledSubmissions: 30,
  convertedSubmissions: 8,
  payload: validationAnalyticsExample,
  createdAt: "2026-03-21T09:05:00.000Z",
  updatedAt: "2026-03-21T09:05:00.000Z"
};

export function buildOpenApiDocument() {
  return {
    openapi: "3.0.3",
    info: {
      title: "Intent Confidence Score API",
      version: "1.2.0",
      description:
        "Explainable auto-intent prediction API with score versioning, rule traces, outcome tracking, review workflows, and validation analytics."
    },
    servers: [{ url: "http://localhost:4000" }],
    tags: [
      { name: "Health" },
      { name: "Config" },
      { name: "Consumer" },
      { name: "Scoring" },
      { name: "Submissions" },
      { name: "Analytics" }
    ],
    components: {
      schemas: {
        ScoreRequest: {
          type: "object",
          example: AUTO_SAMPLE_PAYLOAD
        },
        ConsumerDemandRequest: {
          type: "object",
          example: consumerDemandRequestExample
        },
        ConsumerDemandResponse: {
          type: "object",
          example: consumerDemandResponseExample
        },
        ScoreBreakdown: {
          type: "object",
          properties: {
            behaviouralScore: { type: "integer", example: 8 },
            interactionScore: { type: "integer", example: 13 },
            demandScore: { type: "integer", example: 22 },
            consistencyScore: { type: "integer", example: 21 },
            readinessScore: { type: "integer", example: 20 }
          }
        },
        RuleContribution: {
          type: "object",
          example: ruleContributionExample
        },
        OutcomeEvent: {
          type: "object",
          example: outcomeEventExample
        },
        ScoreResponse: {
          type: "object",
          example: scoreResponseExample
        },
        SubmissionSummary: {
          type: "object",
          example: submissionSummaryExample
        },
        SubmissionDetail: {
          type: "object",
          example: submissionDetailExample
        },
        OutcomeUpdateRequest: {
          type: "object",
          example: {
            status: "qualified",
            source: "manual_review",
            note: "Lead confirmed serious and finance-ready."
          }
        },
        ValidationAnalytics: {
          type: "object",
          example: validationAnalyticsExample
        },
        AnalyticsSnapshotCreateRequest: {
          type: "object",
          example: {
            snapshotDate: "2026-03-21"
          }
        },
        AnalyticsSnapshot: {
          type: "object",
          example: analyticsSnapshotExample
        },
        ErrorResponse: {
          type: "object",
          properties: {
            error: {
              type: "object",
              properties: {
                code: { type: "string" },
                message: { type: "string" },
                details: { nullable: true }
              }
            }
          }
        }
      }
    },
    paths: {
      "/api/v1/health": {
        get: {
          tags: ["Health"],
          summary: "Basic health check",
          responses: {
            "200": {
              description: "Service status"
            }
          }
        }
      },
      "/api/v1/config/auto": {
        get: {
          tags: ["Config"],
          summary: "Get auto model metadata, question architecture, and score versions",
          responses: {
            "200": {
              description: "Auto scoring configuration",
              content: {
                "application/json": {
                  example: AUTO_MODEL_CONFIG
                }
              }
            }
          }
        }
      },
      "/api/v1/consumer/demands": {
        post: {
          tags: ["Consumer"],
          summary: "Store a public consumer demand journey, score it, and prepare it for dealer routing",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ConsumerDemandRequest" }
              }
            }
          },
          responses: {
            "201": {
              description: "Consumer demand recorded",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ConsumerDemandResponse" }
                }
              }
            }
          }
        }
      },
      "/api/v1/consumer/demands/{id}": {
        get: {
          tags: ["Consumer"],
          summary: "Get the public-safe demand status by id",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" }
            }
          ],
          responses: {
            "200": {
              description: "Consumer demand status",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ConsumerDemandResponse" }
                }
              }
            }
          }
        }
      },
      "/api/v1/score": {
        post: {
          tags: ["Scoring"],
          summary: "Score an anonymous buyer-intent scenario without storing it",
          responses: {
            "200": {
              description: "Scored successfully",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ScoreResponse" }
                }
              }
            }
          },
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ScoreRequest" }
              }
            }
          }
        }
      },
      "/api/v1/submissions": {
        post: {
          tags: ["Submissions"],
          summary: "Store and score an anonymous submission",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ScoreRequest" }
              }
            }
          },
          responses: {
            "201": {
              description: "Submission created",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SubmissionDetail" }
                }
              }
            }
          }
        },
        get: {
          tags: ["Submissions"],
          summary: "List scored submissions with filters, sorting, review-state slicing, pagination, and latest outcome labels",
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", default: 1 } },
            { name: "pageSize", in: "query", schema: { type: "integer", default: 20 } },
            { name: "minScore", in: "query", schema: { type: "integer" } },
            { name: "maxScore", in: "query", schema: { type: "integer" } },
            {
              name: "category",
              in: "query",
              schema: {
                type: "string",
                enum: AUTO_MODEL_CONFIG.scoreBands.map((band) => band.slug)
              }
            },
            {
              name: "timeline",
              in: "query",
              schema: {
                type: "string",
                enum: AUTO_MODEL_CONFIG.supportedQuestions.answers.purchaseTimeline
              }
            },
            {
              name: "financePreference",
              in: "query",
              schema: {
                type: "string",
                enum: AUTO_MODEL_CONFIG.supportedQuestions.answers.financePreference
              }
            },
            {
              name: "outcomeStatus",
              in: "query",
              schema: {
                type: "string",
                enum: ["contacted", "qualified", "visit_booked", "finance_applied", "converted", "rejected", "junk"]
              }
            },
            {
              name: "reviewState",
              in: "query",
              schema: {
                type: "string",
                enum: ["open", "closed", "all"]
              }
            },
            {
              name: "sortBy",
              in: "query",
              schema: {
                type: "string",
                enum: ["createdAt", "score"]
              }
            },
            {
              name: "sortOrder",
              in: "query",
              schema: {
                type: "string",
                enum: ["asc", "desc"]
              }
            }
          ],
          responses: {
            "200": {
              description: "Submission list",
              content: {
                "application/json": {
                  example: {
                    data: [submissionSummaryExample],
                    pagination: {
                      page: 1,
                      pageSize: 20,
                      totalItems: 1,
                      totalPages: 1
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/api/v1/submissions/{id}": {
        get: {
          tags: ["Submissions"],
          summary: "Get full submission details, versions, rule traces, and outcome history",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" }
            }
          ],
          responses: {
            "200": {
              description: "Submission detail",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SubmissionDetail" }
                }
              }
            }
          }
        }
      },
      "/api/v1/submissions/{id}/outcomes": {
        post: {
          tags: ["Submissions"],
          summary: "Append an observed downstream outcome to a submission",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" }
            }
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/OutcomeUpdateRequest" }
              }
            }
          },
          responses: {
            "200": {
              description: "Outcome appended",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SubmissionDetail" }
                }
              }
            }
          }
        }
      },
      "/api/v1/analytics/validation": {
        get: {
          tags: ["Analytics"],
          summary: "Internal validation analytics for bands, outcomes, false positives, false negatives, and rule quality",
          responses: {
            "200": {
              description: "Validation analytics snapshot",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ValidationAnalytics" }
                }
              }
            }
          }
        }
      },
      "/api/v1/analytics/validation/snapshots": {
        post: {
          tags: ["Analytics"],
          summary: "Save or refresh a named daily validation snapshot",
          requestBody: {
            required: false,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AnalyticsSnapshotCreateRequest" }
              }
            }
          },
          responses: {
            "201": {
              description: "Saved analytics snapshot",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AnalyticsSnapshot" }
                }
              }
            }
          }
        },
        get: {
          tags: ["Analytics"],
          summary: "List saved daily validation snapshots",
          responses: {
            "200": {
              description: "Saved analytics snapshots",
              content: {
                "application/json": {
                  example: {
                    data: [analyticsSnapshotExample]
                  }
                }
              }
            }
          }
        }
      },
      "/api/v1/analytics/validation/snapshots/{id}": {
        get: {
          tags: ["Analytics"],
          summary: "Get a saved validation snapshot by id",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" }
            }
          ],
          responses: {
            "200": {
              description: "Saved analytics snapshot",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AnalyticsSnapshot" }
                }
              }
            }
          }
        }
      }
    }
  };
}
