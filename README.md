# Intent Confidence Score (ICS)

ICS is an explainable prediction system for auto-industry demand capture. This repo now contains:

- a versioned Express + Prisma backend for scoring, storage, validation analytics, and review workflows
- an internal scoring lab and review queue
- a consumer-facing Next.js web app for real buyer demand capture

ICS is not truth. It is an explainable prediction under validation against downstream outcomes.

## Apps and surfaces

- Backend API: `http://localhost:4000`
- Swagger docs: `http://localhost:4000/docs`
- Internal scoring lab: `http://localhost:4000/lab`
- Internal review queue: `http://localhost:4000/review`
- Consumer web app: `http://localhost:3000`

## Repo structure

```text
.
├── apps
│   └── web                # Next.js 14 consumer-facing demand capture app
├── prisma
│   ├── schema.prisma      # PostgreSQL data model
│   └── seed.ts            # Demo data and seeded outcomes
├── public
│   ├── lab                # Internal scoring lab
│   └── review             # Internal review queue
├── src
│   ├── app.ts             # Express app wiring
│   ├── server.ts          # Backend bootstrap
│   ├── docs               # OpenAPI document
│   ├── lib                # Shared helpers
│   └── modules
│       ├── analytics
│       ├── consumer
│       ├── config
│       ├── health
│       ├── routing
│       ├── scoring
│       ├── submissions
│       └── webhooks
└── tests
```

## Backend API

Core endpoints:

- `POST /api/v1/score`
  - score a scenario without storing it
- `POST /api/v1/submissions`
  - store and score a submission
- `GET /api/v1/submissions`
  - filter, sort, and paginate stored submissions
- `GET /api/v1/submissions/:id`
  - full stored detail, raw payload, rule contributions, routing, consent, outcomes
- `POST /api/v1/submissions/:id/outcomes`
  - append observed downstream outcomes
- `POST /api/v1/consumer/demands`
  - public demand-capture endpoint for the consumer app
- `GET /api/v1/consumer/demands/:id`
  - public-safe demand status by id
- `GET /api/v1/analytics/validation`
  - live validation analytics
- `POST /api/v1/analytics/validation/snapshots`
  - save daily analytics snapshots
- `GET /api/v1/analytics/validation/snapshots`
  - list saved snapshots
- `GET /api/v1/analytics/validation/snapshots/:id`
  - snapshot detail
- `GET /api/v1/config/auto`
  - model config and question architecture
- `GET /api/v1/health`
  - health check

## Consumer web app

The Next.js app in `apps/web` provides:

- a premium landing page
- a multi-step structured auto demand journey
- frontend behavioural telemetry capture
- a server-side proxy to the backend consumer endpoint
- a success page with the public-safe demand reference id

Captured demand themes:

- urgency
- product clarity
- commitment
- affordability
- consistency
- purchase readiness

## Scoring model

Current auto model layers:

- Behavioural Quality: `10`
- Interaction Depth: `15`
- Demand Clarity: `25`
- Consistency: `25`
- Readiness: `25`

Current versions:

- `scoreVersion`: `ics-auto-score-2026.03.15`
- `weightVersion`: `ics-auto-weights-2026.03.15`
- `ruleSetVersion`: `ics-auto-rules-2026.03.15`

Each submission stores:

- raw payload
- normalized answers
- behavioural metrics
- score breakdown
- rule-level contributions
- score, category, and recommendation
- routing and consent data
- score/rule version fields
- downstream outcomes

## Validation and learning

Validation analytics compute:

- conversion rate by ICS band
- average score of converted vs non-converted
- false positives
- false negatives
- top-performing rules
- weakest or misleading rules
- funnel by score band
- version coverage

Saved `AnalyticsSnapshot` records let you freeze that view daily for historical review.

## Database model

Key Prisma models:

- `Submission`
- `ScoreBreakdown`
- `BehaviouralMetrics`
- `LeadMetadata`
- `DealerRoutingProfile`
- `SubmissionConsent`
- `RuleContribution`
- `SubmissionOutcome`
- `AnalyticsSnapshot`
- `IndustryModel`

Routing/dealer-prep fields include:

- `pincode`
- `city`
- `locality`
- `addressLine`
- `assignedDealerId`
- `dealerMatchStatus`
- `routingStatus`

## Local setup

### 1. Backend env

Copy the backend env:

```bash
cp .env.example .env
```

### 2. Start PostgreSQL

```bash
docker compose up -d
```

### 3. Install backend dependencies

```bash
PATH="$HOME/.local/node20/bin:$PATH" npm install
```

### 4. Generate Prisma client and push schema

```bash
PATH="$HOME/.local/node20/bin:$PATH" npx prisma generate
PATH="$HOME/.local/node20/bin:$PATH" npx prisma db push
```

### 5. Seed demo data

```bash
PATH="$HOME/.local/node20/bin:$PATH" npm run prisma:seed
```

### 6. Install consumer app dependencies

```bash
cp apps/web/.env.example apps/web/.env.local
PATH="$HOME/.local/node20/bin:$PATH" npm --prefix apps/web install
```

### 7. Run both apps

Backend with Postgres:

```bash
PATH="$HOME/.local/node20/bin:$PATH" npm run dev
```

Backend in memory mode:

```bash
PATH="$HOME/.local/node20/bin:$PATH" npm run dev:memory
```

Consumer web app:

```bash
PATH="$HOME/.local/node20/bin:$PATH" npm run web:dev
```

### Build verification

Backend:

```bash
PATH="$HOME/.local/node20/bin:$PATH" npm test
PATH="$HOME/.local/node20/bin:$PATH" npm run build
```

Consumer app:

```bash
PATH="$HOME/.local/node20/bin:$PATH" npm run web:build
```

## Sample API usage

### Score without storing

```bash
curl -X POST http://localhost:4000/api/v1/score \
  -H "Content-Type: application/json" \
  -d @sample.json
```

### Store a submission

```bash
curl -X POST http://localhost:4000/api/v1/submissions \
  -H "Content-Type: application/json" \
  -d @sample.json
```

### Record a consumer demand

```bash
curl -X POST http://localhost:4000/api/v1/consumer/demands \
  -H "Content-Type: application/json" \
  -d '{
    "industry": "auto",
    "answers": {
      "bodyStyle": "suv",
      "budgetRange": "12_20_lakh",
      "primaryPreference": "safety",
      "brandsComparing": ["hyundai", "kia"],
      "fuelType": "hybrid",
      "usagePattern": "family_use",
      "monthlyKmBand": "1000_2000",
      "purchaseTimeline": "30_days",
      "purchaseReason": "upgrade",
      "currentVehicleAgeBand": "4_7_years",
      "showroomVisitStatus": "visited_once",
      "variantClarity": "trim_shortlist",
      "testDriveReadiness": "scheduled_soon",
      "decisionMaker": "self_and_spouse",
      "timelineConfidencePercent": 80,
      "financePreference": "yes",
      "downPaymentBand": "20_30_percent",
      "salaryBand": "10_20_lakh",
      "monthlyEmiComfortBand": "20k_35k",
      "budgetFlexibility": "slightly_flexible",
      "openToBudgetIncrease": true,
      "tradeInAvailable": true
    },
    "behaviouralMetrics": {
      "totalCompletionSeconds": 228,
      "timePerStepSeconds": {
        "budgetRange": 14,
        "brandsComparing": 24,
        "purchaseTimeline": 12,
        "financePreference": 10
      },
      "backtracks": 2,
      "answerEdits": 3,
      "idlePauses": 1,
      "tabSwitches": 1,
      "scrollDepthPercent": 92,
      "completionRatePercent": 100
    },
    "routing": {
      "pincode": "560001",
      "city": "Bengaluru",
      "locality": "Ashok Nagar",
      "addressLine": "MG Road"
    },
    "consent": {
      "dealerContactConsent": true,
      "consentedAt": "2026-03-15T10:25:00.000Z",
      "privacyNoticeVersion": "consumer-web-1.0",
      "consentSource": "consumer_web"
    },
    "metadata": {
      "source": "consumer_web",
      "formId": "public_auto_demand_journey",
      "sessionId": "sess_example",
      "channel": "web",
      "sdkVersion": "consumer-web-1.0"
    }
  }'
```

### Append an outcome

```bash
curl -X POST http://localhost:4000/api/v1/submissions/sub_123/outcomes \
  -H "Content-Type: application/json" \
  -d '{
    "status": "qualified",
    "source": "manual_review",
    "note": "Lead confirmed serious and finance-ready."
  }'
```

### View validation analytics

```bash
curl http://localhost:4000/api/v1/analytics/validation
```

## What to build next

- real dealer inventory and assignment rules by pincode/city/SLA
- automatic CRM outcome ingestion
- reviewer notes and bulk outcome import
- dealer-level conversion dashboards by ICS band
- score calibration workflows that compare new rulesets against historical outcomes
