# Accounting Core Developer Guide

General ledger, receivable, payable, billing, payment allocation, and close-oriented accounting truth with append-only posting discipline.

**Maturity Tier:** `Hardened`

## Purpose And Architecture Role

Owns ledger-oriented financial truth, billing posture, and reconciliation state so every upstream plugin must request finance outcomes explicitly.

### This plugin is the right fit when

- You need **ledger truth**, **billing posture**, **financial reconciliation** as a governed domain boundary.
- You want to integrate through declared actions, resources, jobs, workflows, and UI surfaces instead of implicit side effects.
- You need the host application to keep plugin boundaries honest through manifest capabilities, permissions, and verification lanes.

### This plugin is intentionally not

- Not a full vertical application suite; this plugin only owns the domain slice exported in this repo.
- Not a replacement for explicit orchestration in jobs/workflows when multi-step automation is required.

## Repo Map

| Path | Purpose |
| --- | --- |
| `package.json` | Root extracted-repo manifest, workspace wiring, and repo-level script entrypoints. |
| `framework/builtin-plugins/accounting-core` | Nested publishable plugin package. |
| `framework/builtin-plugins/accounting-core/src` | Runtime source, actions, resources, services, and UI exports. |
| `framework/builtin-plugins/accounting-core/tests` | Unit, contract, integration, and migration coverage where present. |
| `framework/builtin-plugins/accounting-core/docs` | Internal domain-doc source set kept in sync with this guide. |
| `framework/builtin-plugins/accounting-core/db/schema.ts` | Database schema contract when durable state is owned. |
| `framework/builtin-plugins/accounting-core/src/postgres.ts` | SQL migration and rollback helpers when exported. |

## Manifest Contract

| Field | Value |
| --- | --- |
| Package Name | `@plugins/accounting-core` |
| Manifest ID | `accounting-core` |
| Display Name | Accounting Core |
| Domain Group | Operational Data |
| Default Category | Business / Accounting & Finance |
| Version | `0.1.0` |
| Kind | `plugin` |
| Trust Tier | `first-party` |
| Review Tier | `R1` |
| Isolation Profile | `same-process-trusted` |
| Framework Compatibility | ^0.1.0 |
| Runtime Compatibility | bun>=1.3.12 |
| Database Compatibility | postgres, sqlite |

## Dependency Graph And Capability Requests

| Field | Value |
| --- | --- |
| Depends On | `auth-core`, `org-tenant-core`, `role-policy-core`, `audit-core`, `workflow-core`, `party-relationships-core`, `pricing-tax-core`, `traceability-core` |
| Recommended Plugins | `treasury-core` |
| Capability Enhancing | `sales-core`, `procurement-core`, `assets-core`, `hr-payroll-core` |
| Integration Only | `e-invoicing-core`, `analytics-bi-core` |
| Suggested Packs | `localization-global-base`, `localization-india`, `localization-united-states`, `sector-ecommerce`, `sector-education`, `sector-epc-professional-delivery`, `sector-financial-services-compliance`, `sector-healthcare`, `sector-manufacturing`, `sector-nonprofit`, `sector-professional-services`, `sector-retail`, `sector-trading-distribution` |
| Standalone Supported | Yes |
| Requested Capabilities | `ui.register.admin`, `api.rest.mount`, `data.write.accounting`, `events.publish.accounting` |
| Provides Capabilities | `accounting.journals`, `accounting.billing`, `accounting.reconciliation` |
| Owns Data | `accounting.journals`, `accounting.billing`, `accounting.allocations`, `accounting.reconciliation` |

### Dependency interpretation

- Direct plugin dependencies describe package-level coupling that must already be present in the host graph.
- Requested capabilities tell the host what platform services or sibling plugins this package expects to find.
- Provided capabilities and owned data tell integrators what this package is authoritative for.

## Public Integration Surfaces

| Type | ID / Symbol | Access / Mode | Notes |
| --- | --- | --- | --- |
| Action | `accounting.billing.post` | Permission: `accounting.billing.write` | Post Billing Document<br>Idempotent<br>Audited |
| Action | `accounting.payments.allocate` | Permission: `accounting.payments.write` | Allocate Payment<br>Non-idempotent<br>Audited |
| Action | `accounting.periods.close` | Permission: `accounting.periods.close` | Close Accounting Period<br>Non-idempotent<br>Audited |
| Action | `accounting.billing.hold` | Permission: `accounting.billing.write` | Place Record On Hold<br>Non-idempotent<br>Audited |
| Action | `accounting.billing.release` | Permission: `accounting.billing.write` | Release Record Hold<br>Non-idempotent<br>Audited |
| Action | `accounting.billing.amend` | Permission: `accounting.billing.write` | Amend Record<br>Non-idempotent<br>Audited |
| Action | `accounting.billing.reverse` | Permission: `accounting.billing.write` | Reverse Record<br>Non-idempotent<br>Audited |
| Resource | `accounting.journals` | Portal disabled | Journal batches, posting states, and append-only accounting headers.<br>Purpose: Keep financial truth inside the accounting boundary instead of allowing raw cross-plugin ledger writes.<br>Admin auto-CRUD enabled<br>Fields: `title`, `recordState`, `approvalState`, `postingState`, `fulfillmentState`, `updatedAt` |
| Resource | `accounting.billing` | Portal disabled | Billing documents, allocations, and receivable or payable lifecycle state.<br>Purpose: Translate validated upstream intents into receivable and payable truth.<br>Admin auto-CRUD enabled<br>Fields: `label`, `status`, `requestedAction`, `updatedAt` |
| Resource | `accounting.reconciliation` | Portal disabled | Subledger, bank, and period-close reconciliation queues.<br>Purpose: Surface financial drift, posting delays, and operator repair work explicitly.<br>Admin auto-CRUD enabled<br>Fields: `severity`, `status`, `reasonCode`, `updatedAt` |

### Job Catalog

| Job | Queue | Retry | Timeout |
| --- | --- | --- | --- |
| `accounting.projections.refresh` | `accounting-projections` | Retry policy not declared | No timeout declared |
| `accounting.reconciliation.run` | `accounting-reconciliation` | Retry policy not declared | No timeout declared |


### Workflow Catalog

| Workflow | Actors | States | Purpose |
| --- | --- | --- | --- |
| `accounting-posting-lifecycle` | `accountant`, `approver`, `controller` | `draft`, `pending_approval`, `active`, `reconciled`, `closed`, `canceled` | Keep posting, reversal, and close logic explicit for ledgers, bills, and invoices. |


### UI Surface Summary

| Surface | Present | Notes |
| --- | --- | --- |
| UI Surface | Yes | A bounded UI surface export is present. |
| Admin Contributions | Yes | Additional admin workspace contributions are exported. |
| Zone/Canvas Extension | No | No dedicated zone extension export. |

## Hooks, Events, And Orchestration

This plugin should be integrated through **explicit commands/actions, resources, jobs, workflows, and the surrounding Gutu event runtime**. It must **not** be documented as a generic WordPress-style hook system unless such a hook API is explicitly exported.

- No standalone plugin-owned lifecycle event feed is exported today.
- Job surface: `accounting.projections.refresh`, `accounting.reconciliation.run`.
- Workflow surface: `accounting-posting-lifecycle`.
- Recommended composition pattern: invoke actions, read resources, then let the surrounding Gutu command/event/job runtime handle downstream automation.

## Storage, Schema, And Migration Notes

- Database compatibility: `postgres`, `sqlite`
- Schema file: `framework/builtin-plugins/accounting-core/db/schema.ts`
- SQL helper file: `framework/builtin-plugins/accounting-core/src/postgres.ts`
- Migration lane present: Yes

The plugin ships explicit SQL helper exports. Use those helpers as the truth source for database migration or rollback expectations.

## Failure Modes And Recovery

- Action inputs can fail schema validation or permission evaluation before any durable mutation happens.
- If downstream automation is needed, the host must add it explicitly instead of assuming this plugin emits jobs.
- There is no separate lifecycle-event feed to rely on today; do not build one implicitly from internal details.
- Schema regressions are expected to show up in the migration lane and should block shipment.

## Mermaid Flows

### Primary Lifecycle

```mermaid
flowchart LR
  caller["Host or operator"] --> action["accounting.billing.post"]
  action --> validation["Schema + permission guard"]
  validation --> service["Accounting Core service layer"]
  service --> state["accounting.journals"]
  service --> jobs["Follow-up jobs / queue definitions"]
  service --> workflows["Workflow state transitions"]
  state --> ui["Admin contributions"]
```

### Workflow State Machine

```mermaid
stateDiagram-v2
  [*] --> draft
  draft --> pending_approval
  draft --> active
  draft --> reconciled
  draft --> closed
  draft --> canceled
```


## Integration Recipes

### 1. Host wiring

```ts
import { manifest, postBillingDocumentAction, BusinessPrimaryResource, jobDefinitions, workflowDefinitions, adminContributions, uiSurface } from "@plugins/accounting-core";

export const pluginSurface = {
  manifest,
  postBillingDocumentAction,
  BusinessPrimaryResource,
  jobDefinitions,
  workflowDefinitions,
  adminContributions,
  uiSurface
};
```

Use this pattern when your host needs to register the plugin’s declared exports without reaching into internal file paths.

### 2. Action-first orchestration

```ts
import { manifest, postBillingDocumentAction } from "@plugins/accounting-core";

console.log("plugin", manifest.id);
console.log("action", postBillingDocumentAction.id);
```

- Prefer action IDs as the stable integration boundary.
- Respect the declared permission, idempotency, and audit metadata instead of bypassing the service layer.
- Treat resource IDs as the read-model boundary for downstream consumers.

### 3. Cross-plugin composition

- Register the workflow definitions with the host runtime instead of re-encoding state transitions outside the plugin.
- Drive follow-up automation from explicit workflow transitions and resource reads.
- Pair workflow decisions with notifications or jobs in the outer orchestration layer when humans must be kept in the loop.

## Test Matrix

| Lane | Present | Evidence |
| --- | --- | --- |
| Build | Yes | `bun run build` |
| Typecheck | Yes | `bun run typecheck` |
| Lint | Yes | `bun run lint` |
| Test | Yes | `bun run test` |
| Unit | Yes | 1 file(s) |
| Contracts | Yes | 1 file(s) |
| Integration | Yes | 1 file(s) |
| Migrations | Yes | 2 file(s) |

### Verification commands

- `bun run build`
- `bun run typecheck`
- `bun run lint`
- `bun run test`
- `bun run test:contracts`
- `bun run test:unit`
- `bun run test:integration`
- `bun run test:migrations`
- `bun run docs:check`

## Current Truth And Recommended Next

### Current truth

- Exports 7 governed actions: `accounting.billing.post`, `accounting.payments.allocate`, `accounting.periods.close`, `accounting.billing.hold`, `accounting.billing.release`, `accounting.billing.amend`, `accounting.billing.reverse`.
- Owns 3 resource contracts: `accounting.journals`, `accounting.billing`, `accounting.reconciliation`.
- Publishes 2 job definitions with explicit queue and retry policy metadata.
- Publishes 1 workflow definition with state-machine descriptions and mandatory steps.
- Adds richer admin workspace contributions on top of the base UI surface.
- Ships explicit SQL migration or rollback helpers alongside the domain model.
- Documents 9 owned entity surface(s): `Chart of Accounts`, `Journal`, `Billing Document`, `Payment Allocation`, `GL Entry`, `Bank Reconciliation`, and more.
- Carries 8 report surface(s) and 5 exception queue(s) for operator parity and reconciliation visibility.
- Tracks ERPNext reference parity against module(s): `Accounts`.
- Operational scenario matrix includes `invoice-to-payment`, `purchase-bill-to-payment`, `credit-note-reversal`, `bank-import-to-reconciliation`, `period-close`.
- Governs 6 settings or policy surface(s) for operator control and rollout safety.

### Current gaps

- No extra gaps were discovered beyond the plugin’s declared boundaries.

### Recommended next

- Deepen posting templates, close controls, and reversal handling before upstream domains rely on accounting intents in production.
- Add stronger downstream bank, tax, and subledger reconciliation coverage as the finance surface hardens.
- Broaden lifecycle coverage with deeper orchestration, reconciliation, and operator tooling where the business flow requires it.
- Add more explicit domain events or follow-up job surfaces when downstream systems need tighter coupling.
- Convert more ERP parity references into first-class runtime handlers where needed, starting from `Account`, `Accounting Period`, `Journal Entry`.

### Later / optional

- Outbound connectors, richer analytics, or portal-facing experiences once the core domain contracts harden.
