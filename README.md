# Admission Drop-Off Detective

**An AI agent that finds stalled admission leads, investigates why they stopped, drafts an evidence-backed follow-up, and sends it only after a counsellor approves it, then tracks whether the student came back.**

Built for the NIAT growth assignment, **Track B: Bottom-of-Funnel**.

> It is a human-controlled recovery workflow with an AI investigator inside it. It is not a CRM, and the AI never sends anything on its own.

---

## 1. The problem

Say 1,000 students enquire about NIAT and only 100 take admission. For most of the other 900, nobody knows _why_ they stopped: the fees may have worried them, a parent may have disagreed, a callback may never have happened, or they simply forgot.

Counsellors today scan hundreds of inactive leads by hand and send the same generic nudge to everyone.

### One lead, end to end

| Step | What happens                                                                                                                                                                            |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Rahul fills the enquiry form and asks about fees.                                                                                                                                       |
| 2    | A counsellor calls. Rahul says _"The course sounds good, but I need to discuss the fees with my parents."_                                                                              |
| 3    | He WhatsApps _"Can you send the fee breakup and EMI options?"_ Nobody replies. Eight days pass.                                                                                         |
| 4    | **Detect:** the system flags Rahul as stalled (8 days, stage "counselled").                                                                                                             |
| 5    | **Investigate:** the Gemini agent reads the case file and reports a _confirmed_ reason (parent approval, with quotes) and an _unmet request_ (fee breakup, never delivered).            |
| 6    | **Recommend:** offer a parent session together with verified fee and EMI details, and draft the email.                                                                                  |
| 7    | **Approve:** the counsellor edits the draft and approves it.                                                                                                                            |
| 8    | **Execute:** the system sends exactly the approved text, if Rahul has consented and is eligible.                                                                                        |
| 9    | **Learn:** Rahul replies and books a parent session. The dashboard records a _recovered lead_ (not yet an admission) and the next investigation can see what worked.                    |

### Without vs. with this system

| Without                              | With                                                    |
| ------------------------------------ | ------------------------------------------------------- |
| Counsellor hunts for inactive students | System detects and ranks them                         |
| Reason for drop-off unknown          | Agent proposes reasons _with quoted evidence_           |
| Same message to everyone             | Personalised draft per lead                             |
| Follow-up is manual                  | Approved follow-ups execute                             |
| Nobody knows what worked             | Dashboard shows recovery rate per action and per reason |

---

## 2. The five building blocks

| #   | Block                                                                                             | Where it lives                                                                                          |
| --- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 1   | **Lead Intelligence Engine**: stall detection, recovery-potential score, contactability           | `backend/src/domain/`, `modules/leads/`                                                                 |
| 2   | **AI Detective Agent**: Gemini function-calling agent that investigates and recommends            | `backend/src/modules/agent/`, `modules/investigations/`                                                 |
| 3   | **Human Approval System**: counsellor edits, approves or rejects every draft                      | `modules/interventions/`, `frontend/src/features/approvals/`                                            |
| 4   | **Automated Recovery Engine**: sends only the approved text and records the outcome               | `modules/interventions/`, `modules/outcomes/`, `integrations/email/`                                    |
| 5   | **Conversion Intelligence Dashboard**: recovered leads, admissions, effectiveness by action/reason | `modules/metrics/`, `frontend/src/features/dashboard/`                                                  |

### The differentiator: recovery reasoning with evidence

The agent has to separate **confirmed** reasons from **possible** ones, and the server checks its work:

- A reason is _confirmed_ only if it cites a message id **and** a verbatim quote.
- The server verifies each quote against the real transcript. If the quote is not there, the claim is **downgraded to "possible"** and flagged in the UI.
- Every figure in the draft (₹ amounts, percentages, EMI months) must appear in a verified knowledge-base resource or in the lead's own messages. Anything else is flagged for the counsellor.
- The model never writes URLs. The system appends links from the verified knowledge base.
- The agent also sees honest outcome statistics (_"parent sessions recovered 2 of 3"_) so recommendations improve as results come in, and it is told to call small samples small.

---

## 3. Architecture

### System

```mermaid
flowchart LR
  subgraph FE["Frontend: Next.js 16, shadcn/ui, Tailwind v4, Framer Motion"]
    PAGES["app/ routes (thin)"] --> FEAT["features/ (landing, dashboard, leads, approvals, recovery-log)"]
    FEAT --> HOOKS["hooks/use-api (TanStack Query)"] --> CLIENT["lib/api (typed client + SSE)"]
  end

  subgraph BE["Backend: Node 22, Hono, TypeScript"]
    MW["Middleware: request id, logging, CORS, secure headers, body limit, rate limit, error handler"]
    ROUTES["routes/ + modules/*/*.routes"] --> CTRL["Controllers: HTTP only (parse, validate, respond)"]
    CTRL --> SVC["Services: business logic and orchestration"]
    SVC --> REPO["Repositories: Prisma queries only"]
    SVC --> DOMAIN["domain/: pure rules (contactability, stall score, evidence, fact checks)"]
    SVC --> AGENT["modules/agent: Gemini function-calling loop + read-only toolbox"]
    SVC --> EMAIL["integrations/email: SMTP, Resend or simulated"]
    REPO --> PRISMA["Database (Prisma 7, transactions)"]
  end

  PG[("PostgreSQL")]
  GEM[["Gemini API"]]
  MAIL[["SMTP server or Resend"]]

  CLIENT -->|"REST + SSE /api/v1"| MW --> ROUTES
  PRISMA --> PG
  AGENT <-->|tool calls| GEM
  EMAIL --> MAIL
```

### Backend layers and the rules between them

| Layer             | Folder                          | Responsibility                                                              | May depend on                  |
| ----------------- | ------------------------------- | --------------------------------------------------------------------------- | ------------------------------ |
| Routes            | `modules/*/*.routes.ts`, `routes/` | Map URLs to controller methods, attach route-level guards                   | controllers                    |
| Controllers       | `modules/*/*.controller.ts`     | Parse and validate the request (Zod), call one service method, shape the response. **No business logic, no database** | services, `common/http`        |
| Services          | `modules/*/*.service.ts`        | Business rules, orchestration, transactions                                 | repositories, domain, agent, integrations |
| Repositories      | `modules/*/*.repository.ts`     | Prisma queries and row-to-domain mapping. **No business logic**             | `database`                     |
| Domain            | `domain/`                       | Pure functions (no I/O, no config, no clock unless passed in)               | types only                     |
| Integrations      | `integrations/`                 | Adapters to the outside world behind an interface (`EmailSender`)           | config                         |
| Composition root  | `container.ts`                  | The only place that builds and wires everything (constructor injection)     | everything                     |

Dependencies point one way (routes → controllers → services → repositories). Because services receive their collaborators through constructors, any layer can be replaced with a fake in tests.

### Request lifecycle of one recovery

```mermaid
sequenceDiagram
  autonumber
  actor C as Counsellor
  participant UI as Next.js UI
  participant API as Hono (middleware, controller)
  participant S as Services
  participant AG as Detective agent
  participant GM as Gemini
  participant DB as PostgreSQL
  participant M as Mail provider

  C->>UI: Click "Investigate"
  UI->>API: POST /api/v1/leads/:id/investigate
  API->>S: assertInvestigable (consent, eligibility, cooldown, one pending draft)
  S-->>API: ok (or 409 with reasons: the model is never called)
  API-->>UI: SSE stream opens
  loop up to 10 turns
    AG->>GM: generateContent(history, tools)
    GM-->>AG: functionCall
    AG-->>UI: SSE "step" event
    AG->>AG: run a read-only tool bound to THIS lead
  end
  GM-->>AG: submit_investigation(findings, draft)
  S->>S: verify quotes, figures, links, resource ids
  S->>DB: investigation + pending draft + audit (one transaction)
  API-->>UI: SSE "result"
  C->>UI: edit draft, Approve & send
  UI->>API: POST /api/v1/interventions/:id/approve
  S->>S: re-check contactability at send time
  S->>DB: atomically claim the draft (pending -> approved)
  S->>M: send the persisted approved text
  S->>DB: mark sent + message + audit (one transaction)
  C->>UI: record the outcome (or a webhook does)
  UI->>API: POST /api/v1/interventions/:id/outcomes
```

### Intervention state machine

```mermaid
stateDiagram-v2
  [*] --> pending_approval: agent drafts
  pending_approval --> approved: counsellor approves (atomic claim, two clicks cannot both send)
  approved --> sent: send succeeds
  approved --> failed: send fails
  pending_approval --> rejected: counsellor rejects
  pending_approval --> failed: lead became uncontactable before sending
  failed --> approved: retry (if still contactable)
  sent --> sent: outcomes recorded
```

### Data model

The Prisma schema (`backend/prisma/schema.prisma`) is the single source of truth: its enums generate the TypeScript types, the Zod schemas and the database constraints.

```mermaid
erDiagram
  LEADS ||--o{ MESSAGES : has
  LEADS ||--o{ INVESTIGATIONS : has
  LEADS ||--o{ INTERVENTIONS : has
  INVESTIGATIONS ||--o| INTERVENTIONS : produces
  INTERVENTIONS ||--o{ OUTCOMES : results_in
  LEADS ||--o{ AUDIT_LOG : logged_in

  LEADS { text id PK; enum stage; enum consent; enum eligibility; timestamptz last_activity_at }
  MESSAGES { text id PK; enum channel; enum direction; text body }
  RESOURCES { text id PK; text category; text content; text url }
  INVESTIGATIONS { text id PK; jsonb result; jsonb trace; text model }
  INTERVENTIONS { text id PK; enum status; enum action; text draft_body; text final_body; bool edited }
  OUTCOMES { text id PK; enum type; text note }
  AUDIT_LOG { int id PK; text actor; text action }
```

A partial unique index (`uq_interventions_one_pending_per_lead`) guarantees at most one pending draft per lead, even under concurrent requests.

### Guardrails (defence in depth)

| Rule                                                                                                                          | Enforced at                                                                       |
| ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Never contact **opted-out**, **no-consent**, **ineligible**, admitted/lost leads or leads inside the **cooldown**             | Detection, before the model runs, at approval and again at send (`domain/contactability.ts`) |
| **Human in the loop**: nothing is sent without an explicit approve action                                                     | `InterventionsService.approveAndSend` is the only code path that calls the email sender |
| **Exactly what was approved is sent**: the final text is persisted and the persisted value is what is sent                    | `modules/interventions/interventions.service.ts`                                  |
| Two simultaneous approvals send **once**                                                                                      | Atomic conditional update (`claimForSending`)                                     |
| Agent reads **one lead only**: tools take no lead id                                                                          | `modules/agent/toolbox.ts`                                                        |
| Agent must **read the conversation** before submitting, and invalid output is bounced back to it                              | `modules/agent/detective-agent.ts`                                                |
| **Prompt injection**: tool output is declared data, and the agent has no tool that can send or change anything                | `modules/agent/prompt.ts`, read-only toolbox                                      |
| **Fabricated evidence** is caught and downgraded; **unverified figures and links** are flagged                                | `domain/evidence.ts`, `domain/draft-checks.ts`                                    |
| Full **audit trail** of every automated and human action                                                                      | `audit_log`                                                                       |

### The agent

`DetectiveAgent` is a function-calling loop over the **`@google/genai`** SDK with five tools: `get_lead_profile`, `get_conversation_history`, `search_verified_resources`, `get_past_intervention_results` and `submit_investigation`. `toolConfig.functionCallingConfig.mode = ANY` forces it to act through tools. Each step streams to the UI over Server-Sent Events so counsellors watch the investigation trail live.

**Recovery potential score:** `0.6 × stageWeight + 0.4 × recency`. Stage weights are enquiry 20, counselled 40, shortlisted 60, applied 80. Recency peaks (100) 5-14 days after the lead goes quiet and then decays toward 20. It is a transparent heuristic for ordering the queue, not a prediction.

---

## 4. Production practices

| Area                | What is in place                                                                                                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Structure           | Feature modules (`controller / service / repository / schema / types / routes`), thin route files, composition root with constructor injection                                         |
| Configuration       | One validated config object (`config/env.ts`, Zod, fails fast with a readable message); nothing else reads `process.env`; sensible defaults per environment                           |
| Errors              | Typed `AppError` hierarchy; one error handler; every error is `{ error: { code, message, details }, requestId }`                                                                      |
| Validation          | Zod at the HTTP edge (params, query, JSON body) and on the model's output                                                                                                             |
| Logging             | Structured `pino` logs, one line per request with a request id, PII fields redacted                                                                                                   |
| Security            | Secure headers, explicit CORS origins, request body limit, per-IP rate limits (stricter on the LLM endpoint), no PII in logs, parameterised queries via Prisma                         |
| API                 | Versioned (`/api/v1`), liveness `/healthz` and readiness `/readyz` (checks the database), consistent status codes (404, 409, 413, 422, 429, 502, 503)                                 |
| Database            | Prisma migrations, enums and constraints in the schema, indexes, partial unique index, transactions for multi-step writes, atomic state transitions                                  |
| Reliability         | Graceful shutdown with a timeout, fatal handlers for unhandled rejections, model calls retried on 429/5xx with backoff                                                                |
| Demo safety         | Demo seeding and the reset endpoint are on by default only outside production (`ENABLE_DEMO_ENDPOINTS`, `SEED_ON_EMPTY`)                                                              |
| Code quality        | Prettier (4 spaces), ESLint with type-aware rules (`no-floating-promises`, `no-console`, `no-duplicate-imports`), strict TypeScript, `knip` for dead code, no duplicate-code findings |
| Tests               | 55 backend tests: unit tests for the pure domain and middleware, plus HTTP-level integration tests against the real app on an in-memory Postgres                                      |
| Delivery            | Dockerfiles for both apps, `docker-compose` for the whole stack, GitHub Actions CI (format, lint, typecheck, test, build)                                                              |
| Frontend            | Feature folders, thin routes, typed API layer, loading / empty / error states everywhere, accessible shadcn components, semantic colour tokens, reduced-motion support                |

---

## 5. Tech stack

| Layer         | Choice                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------- |
| AI            | **Gemini** via `@google/genai` (function calling)                                                       |
| Backend       | Node 22+, **Hono**, TypeScript, **Zod 4**, **pino**                                                     |
| Database      | **PostgreSQL** through **Prisma 7** (`@prisma/adapter-pg`)                                              |
| Email         | **SMTP** via nodemailer (any mailbox, no domain needed), **Resend**, or a simulation                    |
| Frontend      | **Next.js 16** (App Router), React 19, **Tailwind CSS v4**                                              |
| UI kit        | **shadcn/ui** (Base UI flavour, blue theme tokens plus `success` / `warning` / `info`), **lucide-react** |
| Motion        | **Framer Motion**                                                                                       |
| Data fetching | TanStack Query                                                                                          |
| Tooling       | Prettier, ESLint, knip, GitHub Actions                                                                  |

---

## 6. Run it

Requirements: **Node 22.13+** and a PostgreSQL database. Pick one:

| Option                  | Command                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| Everything in Docker    | `docker compose --profile app up --build` (database, API and web at http://localhost:3000)                    |
| Docker database only    | `docker compose up -d db`, then `npm run db:migrate` in `backend`                                             |
| No Docker               | `npm run db:local` in `backend`: a zero-install Postgres (PGlite) on port 5432 that applies the migrations     |
| Supabase                | The shipped `.env.example` is set up for it: fill the password in `DATABASE_URL` (the session pooler, port 5432), then `npm run db:migrate` |
| Any other Postgres      | Put its connection string in `DATABASE_URL` (and `DATABASE_SSL=true` if it needs TLS), then `npm run db:migrate` |

```bash
# 1. Backend
cd backend
cp .env.example .env        # then add GEMINI_API_KEY (https://aistudio.google.com/apikey)
npm install                 # also runs `prisma generate`
npm run dev                 # http://localhost:8787 (seeds demo data on first run)

# 2. Frontend (new terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev                 # http://localhost:3000
```

Or from the repo root: `npm run install:all`, start your database, then `npm run dev` to start both apps.

### Commands

| From the repo root                     | What it does                                       |
| -------------------------------------- | -------------------------------------------------- |
| `npm run dev`                          | Start API and web together                         |
| `npm run lint` / `typecheck` / `build` | Run in both apps                                   |
| `npm run format` / `format:check`      | Prettier in both apps                              |
| `npm test`                             | Backend tests                                      |

| In `backend`                | What it does                                                           |
| --------------------------- | ---------------------------------------------------------------------- |
| `npm run db:migrate`        | `prisma migrate deploy` against a real Postgres                        |
| `npm run db:migrate:dev`    | Create a new migration after editing `prisma/schema.prisma`            |
| `npm run db:seed`           | Reset and reload the demo data                                         |
| `npm run db:studio`         | Browse the data in Prisma Studio                                       |
| `npm run db:local`          | Zero-install local Postgres (PGlite)                                   |
| `npm run build` / `start`   | Compile to `dist/` and run the compiled server                         |
| `npm run knip`              | Find unused files, exports and dependencies                            |

### Environment (`backend/.env`)

| Variable                            | Default                                                   | Meaning                                                                    |
| ----------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------- |
| `NODE_ENV`                          | `development`                                             | `production` turns off demo seeding and the reset endpoint by default      |
| `LOG_LEVEL`                         | `info`                                                    | pino level                                                                 |
| `GEMINI_API_KEY`                    | none                                                      | Required to run the agent                                                  |
| `GEMINI_MODEL`                      | `gemini-3.1-flash-lite`                                   | Any Gemini model with function calling                                     |
| `EMAIL_PROVIDER`                    | auto                                                      | `smtp`, `resend` or `simulated`. Auto: SMTP if `SMTP_HOST` is set, else Resend if a key is set, else simulated |
| `SMTP_HOST` / `SMTP_PORT`           | none / `587`                                              | Any SMTP server. Port 465 uses implicit TLS, 587 uses STARTTLS             |
| `SMTP_USER` / `SMTP_PASS`           | none                                                      | Mailbox login (for Gmail use an **App Password**)                          |
| `SMTP_SECURE`                       | from the port                                             | Override the TLS mode                                                      |
| `RESEND_API_KEY`                    | none                                                      | Resend only delivers to other people once you verify a domain              |
| `EMAIL_FROM`                        | `NIAT Admissions <SMTP_USER>`                             | Sender shown to students (providers often rewrite it to the mailbox)       |
| `DATABASE_URL`                      | `postgresql://postgres:postgres@localhost:5432/detective` | Used by the app and by migrations. On Supabase use the session pooler (port 5432) |
| `DATABASE_SSL`                      | `false`                                                   | `true` for hosted Postgres such as Supabase                                |
| `DATABASE_POOL_MAX`                 | `10`                                                      | Connection pool size                                                       |
| `FRONTEND_ORIGIN`                   | `http://localhost:3000`                                   | Allowed CORS origin(s), comma separated                                    |
| `STALL_THRESHOLD_DAYS`              | `5`                                                       | Days of silence before a lead counts as stalled                            |
| `CONTACT_COOLDOWN_DAYS`             | `3`                                                       | Minimum gap between two outreach emails                                    |
| `RATE_LIMIT_PER_MINUTE`             | `300`                                                     | Per-IP limit on the API                                                    |
| `INVESTIGATE_RATE_LIMIT_PER_MINUTE` | `10`                                                      | Per-IP limit on the LLM endpoint                                           |
| `TRUST_PROXY`                       | `false`                                                   | Use `X-Forwarded-For` for rate limiting behind a proxy                     |
| `ENABLE_DEMO_ENDPOINTS`             | on outside production                                     | Exposes `POST /api/v1/admin/reset`                                         |
| `SEED_ON_EMPTY`                     | on outside production                                     | Loads demo data when the database is empty                                 |

### 5-minute demo script

0. **Landing page** (`/`): the animated path shows the seven backend steps. Click **Open the dashboard**.
1. **Dashboard** (`/dashboard`): stalled leads, the funnel, what has worked historically, and the _Safety and control_ card.
2. **Lead Radar**: ranked stalled leads. Open the _Protected_ tab: Priya opted out, Arjun is ineligible, Rohan has no consent.
3. Open **Rahul Verma** and click **Investigate**. Watch the trail stream in, then click a quote to jump to the source message.
4. Open **Draft & approval**, edit the message and click **Approve & send** (it is delivered over SMTP or Resend when one is configured; otherwise it is only recorded).
5. In **History**, click **Lead replied** and **Session booked**. Rahul becomes a _recovered lead_ and the dashboard updates.
6. **Reset demo data** (sidebar) to replay.

---

## 7. API (`/api/v1`)

| Method | Path                                | Purpose                                                                               |
| ------ | ----------------------------------- | ------------------------------------------------------------------------------------- |
| GET    | `/healthz`, `/readyz`               | Liveness and readiness probes (outside the version prefix)                            |
| GET    | `/health`                           | Gemini, email and demo-mode status                                                    |
| GET    | `/leads`                            | All leads with stall status, score and protection reasons                             |
| GET    | `/leads/:id`                        | Case file: messages, investigations, interventions, audit                             |
| POST   | `/leads/:id/investigate`            | Run the agent. **SSE** events `step`, `result`, `error`; rate limited                 |
| GET    | `/interventions?status=`            | Drafts and history                                                                    |
| POST   | `/interventions/:id/approve`        | `{reviewer, subject, body}`: approve and send                                         |
| POST   | `/interventions/:id/reject`         | `{reviewer, reason}`                                                                  |
| POST   | `/interventions/:id/outcomes`       | `{type, note}`: webhook-ready                                                         |
| GET    | `/metrics`                          | Conversion intelligence                                                               |
| GET    | `/resources`                        | Verified knowledge base                                                               |
| POST   | `/admin/reset`                      | Reload demo data (only when demo endpoints are enabled, otherwise 404)                |

Every error response has the same shape: `{ "error": { "code": "CONFLICT", "message": "...", "details": { "reasons": [] } }, "requestId": "..." }`. Every response carries an `x-request-id` header.

---

## 8. Project structure

```
backend/
  prisma/
    schema.prisma              models + enums (single source of truth)
    migrations/                SQL migrations
  scripts/                     dev-db.ts (local Postgres), seed.ts, migrations.ts
  src/
    server.ts                  bootstrap, graceful shutdown
    app.ts                     middleware stack + route mounting
    container.ts               composition root (dependency injection)
    config/env.ts              validated configuration
    common/
      constants.ts  errors/  http/  logger/  middleware/  utils/
    database/
      database.ts              Prisma client + transaction scope
      seed/                    demo data
    domain/                    pure business rules
    integrations/email/        EmailSender (SMTP, Resend, simulated)
    modules/
      leads/  messages/  resources/  investigations/  agent/
      interventions/  outcomes/  audit/  metrics/  system/
        <name>.routes.ts  <name>.controller.ts  <name>.service.ts
        <name>.repository.ts  <name>.schema.ts  <name>.types.ts
    routes/v1.ts               assembles the versioned router
    generated/prisma/          generated client (git-ignored)
  tests/
    unit/                      domain, analytics, middleware
    integration/               HTTP tests on the real app + in-memory Postgres
    helpers/                   test stack, scripted model, factories
frontend/
  src/
    app/                       routes only (thin)
      page.tsx                 public landing page at /
      (app)/                   the product, inside the sidebar shell:
                               dashboard, leads, leads/[id], approvals, log
    features/
      landing/  dashboard/  leads/  approvals/  recovery-log/
        <feature>-page.tsx  components/  hooks/  lib/
    components/
      ui/                      shadcn primitives
      layout/                  sidebar shell, breadcrumb
      common/                  badges, page header, motion, theme toggle
    hooks/                     TanStack Query hooks
    lib/api/                   typed client, endpoints, SSE stream
    config/                    env, navigation
.github/workflows/ci.yml       CI
docker-compose.yml             db (+ api and web with `--profile app`)
```

---

## 9. Honest notes and limits

- **All business facts are demo data.** Fee amounts, scholarship terms and links in the knowledge base (`backend/src/database/seed/seed-data.ts`) are placeholders. The admissions team must replace them with verified content before real use. The 11 past recoveries behind the dashboard are seeded too, so rates like "80% recovered" are illustrative, not NIAT results.
- **Gemini model ids move quickly.** The default is configurable. If your key does not have it, set `GEMINI_MODEL` to one you do. The agent loop is covered by tests with a scripted model; verify it against your live key.
- **Email without a domain:** use SMTP. For Gmail turn on 2-Step Verification, create an App Password, then set `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_USER=<you>@gmail.com` and `SMTP_PASS=<app password>`. The server checks the connection at startup and logs a warning if the login fails. Gmail limits a free account to about 500 recipients a day, which is plenty here but not for production; use a transactional provider with a verified domain for real volume. With nothing configured, sends are only recorded and nothing is delivered. The SMTP path is tested against an in-process mail server, not against Gmail itself.
- **Outcome capture is manual in the demo.** Production needs an email or WhatsApp reply webhook or a CRM sync calling the outcomes endpoint (it already exists).
- **No authentication yet.** The reviewer is the lead's counsellor. Before production add real auth (OIDC), per-counsellor assignment and an API gateway; the rate limiter is in-memory and per instance, so use a shared store (Redis) when running more than one instance.
- **Prisma Migrate vs. PGlite.** The Prisma schema engine cannot talk to PGlite, so `db:local` and the tests apply the same migration SQL files directly. Against real Postgres (Docker, Supabase, RDS) use `npm run db:migrate`.
- **Prisma 7 is pinned.** `prisma@latest` currently points at an 8.0 release candidate with a different API, so the project uses the stable 7.10 line. The backend also pins TypeScript 6 because `typescript-eslint` does not support 7 yet.
- **Docker files are untested here.** The Dockerfiles and compose file follow the standard pattern, but the Docker daemon was not available where this was built; the same code paths were verified with the local PGlite database and `npm run build`.
- **Differentiation check:** before submitting, confirm NIAT is not already running AI-assisted recovery. The angle here is evidence-backed reasoning, human approval, and outcome learning.

## 10. What I would build next

1. Reply and delivery webhooks, so outcomes record themselves.
2. WhatsApp as a second channel, with template approval.
3. An A/B comparison of AI-drafted vs. generic follow-ups, to prove lift.
4. Authentication, per-counsellor queues and a shared rate-limit store.
5. A weekly digest to counsellors of "who to call today".
