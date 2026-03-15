import { AUTO_MODEL_CONFIG, AUTO_SAMPLE_PAYLOAD } from "../modules/scoring/industries/auto/auto.constants";

export function buildOpenApiDocument() {
  return {
    openapi: "3.0.3",
    info: {
      title: "Intent Confidence Score API",
      version: "1.0.0",
      description:
        "API-first backend MVP for scoring auto-industry lead submissions using transparent rules."
    },
    servers: [{ url: "http://localhost:4000" }],
    tags: [
      { name: "Health" },
      { name: "Config" },
      { name: "Scoring" },
      { name: "Submissions" }
    ],
    components: {
      schemas: {
        ScoreRequest: {
          type: "object",
          example: AUTO_SAMPLE_PAYLOAD
        },
        ScoreBreakdown: {
          type: "object",
          properties: {
            behaviouralScore: { type: "integer" },
            interactionScore: { type: "integer" },
            consistencyScore: { type: "integer" },
            economicScore: { type: "integer" }
          }
        },
        ScoreResponse: {
          type: "object",
          properties: {
            submissionId: { type: "string" },
            totalScore: { type: "integer" },
            category: { type: "string" },
            breakdown: { $ref: "#/components/schemas/ScoreBreakdown" },
            positives: { type: "array", items: { type: "string" } },
            negatives: { type: "array", items: { type: "string" } },
            recommendedAction: { type: "string" },
            createdAt: { type: "string", format: "date-time" }
          }
        },
        SubmissionSummary: {
          type: "object",
          properties: {
            id: { type: "string" },
            industry: { type: "string", example: "auto" },
            lead: { type: "object" },
            totalScore: { type: "integer" },
            category: { type: "string" },
            recommendedAction: { type: "string" },
            financePreference: { type: "string", nullable: true },
            purchaseTimeline: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" }
          }
        },
        SubmissionDetail: {
          type: "object",
          properties: {
            submissionId: { type: "string" },
            industry: { type: "string" },
            lead: { type: "object" },
            answers: { type: "object" },
            behaviouralMetrics: { type: "object" },
            metadata: { type: "object" },
            totalScore: { type: "integer" },
            category: { type: "string" },
            breakdown: { $ref: "#/components/schemas/ScoreBreakdown" },
            positives: { type: "array", items: { type: "string" } },
            negatives: { type: "array", items: { type: "string" } },
            recommendedAction: { type: "string" },
            normalizedAnswers: { type: "object" },
            rawPayload: { type: "object" },
            webhookEvent: { type: "object" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" }
          }
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
          summary: "Get auto model metadata",
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
      "/api/v1/score": {
        post: {
          tags: ["Scoring"],
          summary: "Score a lead without storing it",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ScoreRequest" }
              }
            }
          },
          responses: {
            "200": {
              description: "Scored successfully",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ScoreResponse" }
                }
              }
            },
            "400": {
              description: "Validation error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" }
                }
              }
            }
          }
        }
      },
      "/api/v1/submissions": {
        post: {
          tags: ["Submissions"],
          summary: "Store and score a submission",
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
          summary: "List submissions with filters",
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
                    data: [],
                    pagination: {
                      page: 1,
                      pageSize: 20,
                      totalItems: 0,
                      totalPages: 0
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
          summary: "Get full submission details",
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
            },
            "404": {
              description: "Submission not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" }
                }
              }
            }
          }
        }
      }
    }
  };
}
