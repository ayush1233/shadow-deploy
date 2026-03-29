# Shadow API SaaS Readiness Roadmap

## Positioning

This project is most compelling as a **release safety platform for backend teams**:

- Mirror live production traffic to a candidate API.
- Compare production vs shadow behavior automatically.
- Use AI to explain whether diffs are dangerous or acceptable.
- Give engineering leaders a deploy / do-not-deploy signal.

That is a real SaaS category. The strongest wedge is not "API testing" in general. It is:

**"Catch production-breaking API changes before rollout, using real traffic."**

## What Already Looks SaaS-Ready

- Clear painkiller product with obvious ROI for engineering teams.
- Multi-service architecture already separated into ingest, compare, AI, API, and dashboard layers.
- Dashboard UX for reviewing diffs, risk, endpoints, and notifications.
- Tenant identifiers already exist in the event and persistence model.
- CI/CD, SDK, CLI, and gateway/plugin stories already support expansion beyond a demo.
- AI explanations make the product feel differentiated instead of commodity observability.

## Current Blockers

These are the biggest gaps between "strong demo" and "sellable SaaS":

1. Authentication is still demo-only.
   `api-service/src/main/java/com/shadow/platform/api/controller/AuthController.java` uses hardcoded users and passwords.

2. Signup, organizations, invites, and seat management do not exist yet.
   A real buyer needs workspaces, roles, and team onboarding.

3. Billing is not implemented.
   There is no Stripe checkout, subscription state, trial logic, usage enforcement, or billing portal.

4. Supabase security is demo-open.
   `dashboard/supabase-schema.sql` enables RLS but the policies allow all access.

5. Some product actions are still stubbed.
   `DeploymentController` returns placeholder report data instead of real deployment state.

6. Customer configuration is partly local/demo state.
   The dashboard stores endpoint tags in `localStorage`, which is not suitable for team accounts.

7. There is no customer-facing onboarding flow.
   A buyer needs a clean path from signup to first mirrored endpoint to first useful report.

8. There is no usage metering or plan enforcement.
   You need to count requests, mirrored traffic volume, retained comparisons, and seats.

## Foundation Completed In This Pass

The API now enforces tenant-scoped reads for:

- comparison detail
- comparison list
- metrics summary

That closes an important SaaS/security gap: tenant identity is no longer just present in tokens, it is now used to scope the highest-risk read paths.

## Recommended Build Order

## Phase 1: Private Beta

Goal: something a few design partners can pay for with manual onboarding.

Build next:

1. Replace demo auth with real auth.
   Use Supabase Auth or another managed auth provider for email, SSO, password reset, and sessions.

2. Add organizations and memberships.
   Minimum tables: `organizations`, `memberships`, `projects`, `api_keys` or `ingest_tokens`.

3. Persist customer-owned settings.
   Move endpoint tags, notification settings, thresholds, and environment metadata into tenant-scoped tables.

4. Finish deployment and onboarding flows.
   A user should be able to create a project, register prod/shadow targets, get an ingest token, and see first traffic without reading internal docs.

5. Add audit-safe security defaults.
   Remove default credentials from the login UX, lock down RLS, rotate secrets, and document data retention.

6. Start with manual billing.
   You can charge early customers manually before building full self-serve billing.

## Phase 2: Self-Serve SaaS

Goal: customers can discover, buy, onboard, and use the product without you in the loop.

Build:

1. Stripe subscriptions.
   Checkout, trial, billing portal, webhook handling, plan status in app.

2. Usage metering.
   Track mirrored requests, stored comparisons, AI explanation volume, seats, and retention window.

3. Plan enforcement.
   Limits by project count, retention days, mirrored request volume, and advanced AI features.

4. Invitation and role flows.
   Owner, admin, engineer, read-only.

5. In-product onboarding.
   Guided setup for NGINX/plugin/SDK install, first validation run, and alert setup.

## Phase 3: Enterprise

Goal: larger teams can buy this with security review and broader rollout.

Build:

1. SAML SSO and SCIM.
2. Audit logs.
3. Regional data controls and retention controls.
4. API key management with rotation and scoped permissions.
5. Stronger alerting, approvals, and change-management workflows.
6. Multi-project org dashboards and executive reporting.

## Suggested Packaging

Start simple:

- Free trial: one project, short retention, capped traffic.
- Team: more traffic, longer retention, notifications, AI explanations.
- Business: SSO, approvals, higher retention, premium support.
- Enterprise: custom retention, dedicated environment, procurement/security features.

## Best Initial ICP

Sell first to teams that:

- deploy backend APIs frequently
- already have multiple versions of an API in flight
- feel real pain from risky rollouts
- care about incident prevention more than generic test coverage

Best early targets:

- fintech
- healthtech
- marketplaces
- B2B SaaS platforms with public or mobile-consumed APIs

## Practical Next Tickets

If you want to turn this into a paying product quickly, the next implementation tickets should be:

1. Replace hardcoded auth with real workspace auth.
2. Create organization, membership, and project tables.
3. Lock Supabase RLS to the authenticated tenant.
4. Move dashboard tenant settings out of `localStorage`.
5. Add project onboarding and ingest-token generation.
6. Add Stripe subscription state and trial gating.
7. Replace placeholder deployment reporting with stored deployment runs.

## Bottom Line

You absolutely can sell this as a SaaS.

The product idea is strong enough already. The main work left is not proving the concept. It is converting the current demo foundations into secure multi-tenant account management, onboarding, billing, and operational polish.
