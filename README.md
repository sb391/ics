# Intent Confidence Score (ICS) API

ICS is an API-first intelligence layer for auto industry lead forms. Brands send lead answers, behavioural metrics, and metadata to this service. ICS returns a transparent 0-100 intent score, a category, reason codes, a score breakdown, and a recommended follow-up action.

## What was built

- Express + TypeScript backend with modular architecture
- Rules-based auto scoring engine with 4 scoring layers
- Prisma schema for PostgreSQL persistence
- REST endpoints for score preview, submission storage, list, detail, health, and model config
- Swagger UI docs at `/docs`
- Webhook-ready event payload for future CRM integrations
- Demo seed data for the auto model
- Unit tests for scoring and integration tests for the API

## Folder structure

```text
.
├── prisma
│   ├── schema.prisma
│   └── seed.ts
├── src
│   ├── app.ts
│   ├── server.ts
│   ├── config
│   ├── docs
│   ├── lib
│   └── modules
│       ├── config
│       ├── health
│       ├── scoring
│       ├── submissions
│       └── webhooks
├── tests
│   ├── integration
│   └── unit
└── docker-compose.yml
```

## API endpoints

- `POST /api/v1/score` scores a lead payload without storing it
- `POST /api/v1/submissions` stores a submission and computed score
- `GET /api/v1/submissions` lists stored submissions with filtering, sorting, and pagination
- `GET /api/v1/submissions/:id` returns full details including raw payload and webhook event
- `GET /api/v1/health` returns service health
- `GET /api/v1/config/auto` returns the auto model config and supported enums
- `GET /docs` serves Swagger UI
- `GET /docs/openapi.json` serves the raw OpenAPI document

## Scoring methodology

ICS uses four explainable layers:

- Behavioural Signals, max 30: completion timing, edits, backtracks, tab switches, idle pauses, scroll depth
- Interaction Depth, max 40: answer coverage, brand comparison depth, financial detail completion, contact completeness
- Consistency Checks, max 20: brand-budget fit, purchase timeline specificity, salary-budget alignment, finance coherence
- Economic Signals, max 10: down payment readiness, trade-in availability, financing intent, economic alignment

Score bands:

- `0-30`: Casual Browser
- `31-55`: Early Interest
- `56-75`: Consideration Stage
- `76-90`: Serious Buyer
- `91-100`: High Intent Buyer

## Database schema summary

Prisma models:

- `Submission`: raw payload, normalized answers, total score, category, reason codes, webhook event, timestamps
- `ScoreBreakdown`: behavioural, interaction, consistency, economic layer scores
- `BehaviouralMetrics`: time and interaction metrics captured by the form or future SDK
- `LeadMetadata`: source, campaign, form ID, session ID
- `IndustryModel`: seeded model metadata, score bands, supported questions, config payload

## Local setup

1. Copy `.env.example` to `.env`.
2. Start PostgreSQL with Docker:

```bash
docker compose up -d
```

3. Install dependencies:

```bash
PATH="$HOME/.local/node20/bin:$PATH" npm install
```

4. Generate Prisma client and apply schema:

```bash
PATH="$HOME/.local/node20/bin:$PATH" npx prisma generate
PATH="$HOME/.local/node20/bin:$PATH" npx prisma migrate dev --name init
```

5. Seed demo data:

```bash
PATH="$HOME/.local/node20/bin:$PATH" npm run prisma:seed
```

6. Start the API:

```bash
PATH="$HOME/.local/node20/bin:$PATH" npm run dev
```

Swagger UI will be available at [http://localhost:4000/docs](http://localhost:4000/docs).

## Sample requests

Score without storing:

```bash
curl -X POST http://localhost:4000/api/v1/score \
  -H "Content-Type: application/json" \
  -d '{
    "industry": "auto",
    "lead": {
      "name": "Aarav Sharma",
      "email": "aarav@example.com",
      "phone": "+919900001234",
      "city": "Bengaluru"
    },
    "answers": {
      "budgetRange": "12_20_lakh",
      "primaryPreference": "mileage",
      "purchaseTimeline": "30_days",
      "financePreference": "yes",
      "brandsComparing": ["hyundai", "kia"],
      "downPaymentBand": "20_30_percent",
      "tradeInAvailable": true,
      "salaryBand": "10_20_lakh"
    },
    "behaviouralMetrics": {
      "totalCompletionSeconds": 185,
      "timePerStepSeconds": {
        "budgetRange": 12,
        "primaryPreference": 8,
        "purchaseTimeline": 16,
        "financePreference": 9,
        "brandsComparing": 24,
        "downPaymentBand": 11,
        "tradeInAvailable": 6,
        "salaryBand": 10
      },
      "backtracks": 2,
      "answerEdits": 3,
      "idlePauses": 1,
      "tabSwitches": 1,
      "scrollDepthPercent": 92,
      "completionRatePercent": 100
    },
    "metadata": {
      "source": "dealer_website",
      "campaign": "march_auto_campaign",
      "formId": "lead_form_1",
      "sessionId": "sess_123"
    }
  }'
```

Store a submission:

```bash
curl -X POST http://localhost:4000/api/v1/submissions \
  -H "Content-Type: application/json" \
  -d @sample.json
```

List submissions:

```bash
curl "http://localhost:4000/api/v1/submissions?minScore=70&category=serious_buyer&sortBy=score&sortOrder=desc"
```

## Suggested next steps

- Add signed outbound webhooks and delivery retry tracking
- Add per-brand score calibration tools and analyst overrides
- Add auth, API keys, rate limiting, and tenant separation
- Introduce async event streaming for CRM and CDP pushes
- Add more industries behind the same `IndustryScoringModel` abstraction
