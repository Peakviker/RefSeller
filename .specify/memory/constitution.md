<!--
SYNC IMPACT REPORT
===================
Version Change: NONE → 1.0.0 (Initial constitution)
Change Type: MINOR (new governance document created)

Modified Principles:
- N/A (initial version)

Added Sections:
- Core Principles (5 principles: Modular Architecture, Telegram-First Design, Documentation-First, Feature Independence, Production Readiness)
- Technology Standards
- Quality Gates & Improvement Path
- Governance

Removed Sections:
- N/A (initial version)

Templates Status:
✅ .specify/templates/plan-template.md - Reviewed, aligned with modular architecture principle
✅ .specify/templates/spec-template.md - Reviewed, aligned with user story prioritization
✅ .specify/templates/tasks-template.md - Reviewed, aligned with independent feature implementation
⚠️  No command files exist yet in .specify/templates/commands/

Follow-up TODOs:
- RATIFICATION_DATE to be confirmed by project owner
- Consider adding TypeScript migration timeline once constitution is ratified
- Set up testing framework timeline (referenced in Quality Gates)
-->

# Telegram Mini App Constitution

## Core Principles

### I. Modular Architecture

Every feature MUST follow layered architecture with clear separation of concerns:

- **Application Layer**: Orchestrates service initialization only (`app/Application.js`)
- **HTTP Layer**: REST endpoints with no business logic (`http/*.js`)
- **Telegram Layer**: Bot commands and WebApp integration (`telegram/Bot.js`)
- **Business Logic Layer**: Self-contained feature modules (`payment/`, `shop/`, `referral/`)
- **Data Layer**: Database access isolated in storage classes (`*/Storage.js`)

**Rationale**: Clean boundaries enable independent testing, parallel development, and simplified debugging. Each layer can be modified without cascading changes to others.

**Non-Negotiable**: No business logic in API routes. No database queries in bot handlers. No HTTP calls in storage classes.

### II. Telegram-First Design

All features MUST integrate natively with Telegram platform capabilities:

- **WebApp SDK**: Use `window.Telegram.WebApp` for all UI interactions (BackButton, MainButton, Popups, Theme)
- **Deep Linking**: Support `t.me/bot?start=payload` for feature entry points (e.g., referral links)
- **Bot Commands**: Every major user flow accessible via bot command or inline keyboard
- **Theme Integration**: UI MUST respect Telegram theme variables (`--tg-theme-*` CSS vars)

**Rationale**: Users expect seamless Telegram integration. Third-party UI patterns break user experience and require additional maintenance.

**Non-Negotiable**: No custom navigation overlays. No custom alert/confirm dialogs. No hardcoded colors or themes.

### III. Documentation-First

All code MUST be documented before or during implementation:

- **JSDoc Comments**: Required for all public functions/classes with `@param`, `@returns`, `@throws`
- **README Files**: Every new feature module needs usage instructions and examples
- **Setup Guides**: External integrations (payment, databases) require step-by-step setup docs (e.g., `YOOKASSA_SETUP.md`)
- **Inline Comments**: Complex business logic (e.g., two-level referral calculations) requires explanatory comments

**Rationale**: Telegram Mini Apps combine multiple platforms (Bot API, WebApp, payments, databases). Without documentation, onboarding and maintenance costs explode.

**Non-Negotiable**: PRs without documentation for new features will be rejected. No "we'll document later" exceptions.

### IV. Feature Independence

New features MUST be self-contained and independently deployable:

- **Module Structure**: Each feature in its own directory with all related code (`referral/`, `payment/`, `shop/`)
- **Database Isolation**: Feature-specific tables and migrations (no shared "god tables")
- **API Namespace**: Feature routes under dedicated prefix (e.g., `/referral/*`, `/api/payment/*`)
- **Shared Code**: Extract to `lib/` or `utils/` only when used by 3+ features

**Rationale**: Monolithic coupling prevents parallel development and makes rollbacks dangerous. Independent features can be developed, tested, and released without coordinating across entire codebase.

**Non-Negotiable**: New features cannot modify existing feature modules (except through documented public APIs). No cross-feature database foreign keys without architectural review.

### V. Production Readiness

All features MUST include production-grade error handling and observability:

- **Graceful Shutdown**: Handle SIGINT/SIGTERM, close connections cleanly
- **Error Boundaries**: Try-catch blocks with user-friendly messages + internal logging
- **Async/Await**: All I/O operations use async/await (no raw callbacks or promises without await)
- **Idempotency**: Critical operations (payments, user registration) use idempotency keys or `ON CONFLICT` clauses
- **Environment Config**: All secrets and URLs via environment variables, never hardcoded

**Rationale**: Telegram bots run 24/7. Crashes lose users. Poor error messages generate support burden. Production incidents must be debuggable.

**Non-Negotiable**: No `process.exit()` without cleanup. No unhandled promise rejections. No database operations without connection pooling.

## Technology Standards

### Approved Stack

**Current (as of v1.0.0)**:

- **Languages**: JavaScript ES6+ (ESM modules), No TypeScript (yet - see Quality Gates)
- **Backend**: Node.js 20+, Express 4.18+, Telegraf 4.14+
- **Frontend**: React 18.2+, react-router-dom 6.16+, Create React App 5.0+
- **Databases**: PostgreSQL 8.16+ (persistent data), Redis 5.10+ (cache/sessions)
- **Payments**: YooKassa SDK 1.1.4+ (Russian 54-ФЗ compliance built-in)
- **Process Management**: PM2 with ecosystem.config.cjs

**New Dependencies**: Require architectural review if introducing:
- Alternative payment providers (Stripe, etc.)
- State management libraries (Redux, MobX, Zustand)
- ORM/Query builders (Prisma, Knex, TypeORM)
- Testing frameworks beyond jest (current but unused)

### Monorepo Structure

```
telegram-mini-app/
├── template/              # Active development codebase
│   ├── backend/          # Node.js server + Telegram Bot
│   │   ├── src/
│   │   │   ├── app/      # Application initialization
│   │   │   ├── http/     # REST API endpoints
│   │   │   ├── telegram/ # Bot logic
│   │   │   └── {feature}/ # Business logic modules
│   │   └── web/          # Built frontend (static serving)
│   └── web/              # React Mini App source
│       └── src/
│           ├── components/ # UI components (kit/ + app/)
│           ├── screens/    # Route screens
│           ├── hooks/      # React hooks (useTelegram)
│           └── logic/      # Business logic + API client
└── sample/               # Demo examples (read-only reference)
```

**Deployment Model**: Backend serves static frontend build (eliminates CORS issues). Frontend and backend deploy together but can be separated if CORS configured.

## Quality Gates & Improvement Path

### Current State (v1.0.0)

**Strengths**:
- ✅ Clean architecture implemented
- ✅ Comprehensive documentation
- ✅ Production-ready error handling
- ✅ PM2 process management

**Known Gaps** (Technical Debt, Not Blockers):
- ⚠️ No unit/integration tests (libraries installed but unused)
- ⚠️ JavaScript instead of TypeScript (no type safety)
- ⚠️ No API documentation (Swagger/OpenAPI)
- ⚠️ No CI/CD pipeline (manual deploys)

### Mandatory Gates for New Features

**Before Implementation**:
1. Feature spec approved (see `.specify/templates/spec-template.md`)
2. Architecture review if violating Feature Independence principle
3. Database schema review if adding new tables/columns

**Before Merge**:
1. JSDoc comments complete for all public functions
2. README updated if new user-facing feature
3. Error handling validated (try-catch + user-friendly messages)
4. Environment variables documented in `.env.example`

**No Longer Blocking** (aspirational, not enforced):
- Unit tests (until testing framework formally adopted)
- TypeScript types (until migration plan approved)
- API documentation (until Swagger tooling selected)

### Improvement Roadmap (Non-Binding)

Identified in project analysis (`project.md`) but not mandated by this constitution:

**High Priority**:
- TypeScript migration (adds type safety, prevents runtime errors)
- Testing framework adoption (70%+ coverage goal for business logic)
- API documentation tooling (Swagger/OpenAPI for `/api/*` endpoints)

**Medium Priority**:
- React Query for client-side caching
- Joi/Yup for backend input validation
- GitHub Actions for automated linting

**Low Priority**:
- Docker containerization (localhost development + production)
- Internationalization (i18next for multi-language support)

*Note: Roadmap items do not override Core Principles. If conflict arises, principles take precedence.*

## Governance

### Amendment Procedure

1. **Proposal**: Open GitHub issue with `[CONSTITUTION]` prefix describing change rationale
2. **Review**: Architecture team (or project owner if solo) reviews within 5 business days
3. **Approval**: Requires explicit approval from project owner or 2/3 majority if team
4. **Migration Plan**: Breaking changes require migration guide for existing code
5. **Version Bump**: Follow semantic versioning (see below)
6. **Propagation**: Update dependent templates (`.specify/templates/*`) before ratification

### Versioning Policy

Constitution follows **Semantic Versioning**:

- **MAJOR (X.0.0)**: Backward-incompatible principle removal or redefinition (e.g., dropping Modular Architecture)
- **MINOR (1.X.0)**: New principle added or existing principle materially expanded (e.g., adding Security Principle)
- **PATCH (1.0.X)**: Clarifications, wording improvements, typo fixes (no semantic change)

### Compliance Review

- **PR Reviews**: All PRs MUST verify Core Principles compliance (checklist in PR template)
- **Quarterly Audits**: Review constitution relevance and update roadmap priorities
- **Violation Handling**: PRs violating principles require either:
  - Refactoring to comply, OR
  - Architectural review + explicit exception approval + documentation in Complexity Tracking section of plan.md

### Runtime Guidance

This constitution defines **non-negotiable rules**. For day-to-day development patterns, idioms, and best practices (e.g., preferred naming conventions, folder organization conventions), see:

- `README.md` - Project setup and quick start
- `project.md` - Comprehensive architecture analysis
- `.specify/templates/plan-template.md` - Implementation planning guidance

**Version**: 1.0.0 | **Ratified**: 2025-12-10 | **Last Amended**: 2025-12-10
