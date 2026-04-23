# Accounting Core

<p align="center">
  <img src="./docs/assets/gutu-mascot.png" alt="Gutu mascot" width="220" />
</p>

General ledger, receivable, payable, billing, payment allocation, and close-oriented accounting truth with append-only posting discipline.

![Maturity: Hardened](https://img.shields.io/badge/Maturity-Hardened-2563eb) ![Verification: Build+Typecheck+Lint+Test+Contracts+Migrations+Integration](https://img.shields.io/badge/Verification-Build%2BTypecheck%2BLint%2BTest%2BContracts%2BMigrations%2BIntegration-2563eb) ![DB: postgres+sqlite](https://img.shields.io/badge/DB-postgres%2Bsqlite-2563eb) ![Integration Model: Actions+Resources+Jobs+Workflows+UI](https://img.shields.io/badge/Integration%20Model-Actions%2BResources%2BJobs%2BWorkflows%2BUI-2563eb)

## Part Of The Gutu Stack

| Aspect | Value |
| --- | --- |
| Repo kind | First-party plugin |
| Domain group | Operational Data |
| Default category | Business / Accounting & Finance |
| Primary focus | ledger truth, billing posture, financial reconciliation |
| Best when | You need a governed domain boundary with explicit contracts and independent release cadence. |
| Composes through | Actions+Resources+Jobs+Workflows+UI |

- Gutu keeps plugins as independent repos with manifest-governed boundaries, compatibility channels, and verification lanes instead of hiding everything behind one giant mutable codebase.
- This plugin is meant to compose through explicit actions, resources, jobs, workflows, and runtime envelopes, not through undocumented hook chains.

## What It Does Now

Owns ledger-oriented financial truth, billing posture, and reconciliation state so every upstream plugin must request finance outcomes explicitly.

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

## Maturity

**Maturity Tier:** `Hardened`

This tier is justified because unit coverage exists, contract coverage exists, integration coverage exists, migration coverage exists, job definitions are exported, and workflow definitions are exported.

## Verified Capability Summary

- Domain group: **Operational Data**
- Default category: **Business / Accounting & Finance**
- Verification surface: **Build+Typecheck+Lint+Test+Contracts+Migrations+Integration**
- Tests discovered: **5** total files across unit, contract, integration, migration lanes
- Integration model: **Actions+Resources+Jobs+Workflows+UI**
- Database support: **postgres + sqlite**

## Dependency And Compatibility Summary

| Field | Value |
| --- | --- |
| Package | `@plugins/accounting-core` |
| Manifest ID | `accounting-core` |
| Repo | [gutu-plugin-accounting-core](https://github.com/gutula/gutu-plugin-accounting-core) |
| Depends On | `auth-core`, `org-tenant-core`, `role-policy-core`, `audit-core`, `workflow-core`, `party-relationships-core`, `pricing-tax-core`, `traceability-core` |
| Recommended Plugins | None |
| Capability Enhancing | None |
| Integration Only | None |
| Suggested Packs | None |
| Standalone Supported | Yes |
| Requested Capabilities | `ui.register.admin`, `api.rest.mount`, `data.write.accounting`, `events.publish.accounting` |
| Provided Capabilities | `accounting.journals`, `accounting.billing`, `accounting.reconciliation` |
| Runtime | bun>=1.3.12 |
| Database | postgres, sqlite |
| Integration Model | Actions+Resources+Jobs+Workflows+UI |

## Installation Guidance

- Required plugins: `auth-core`, `org-tenant-core`, `role-policy-core`, `audit-core`, `workflow-core`, `party-relationships-core`, `pricing-tax-core`, `traceability-core`
- Recommended plugins: none
- Capability-enhancing plugins: none
- Integration-only plugins: none
- Suggested packs: none
- Standalone supported: yes


## Capability Matrix

| Surface | Count | Details |
| --- | --- | --- |
| Actions | 7 | `accounting.billing.post`, `accounting.payments.allocate`, `accounting.periods.close`, `accounting.billing.hold`, `accounting.billing.release`, `accounting.billing.amend`, `accounting.billing.reverse` |
| Resources | 3 | `accounting.journals`, `accounting.billing`, `accounting.reconciliation` |
| Jobs | 2 | `accounting.projections.refresh`, `accounting.reconciliation.run` |
| Workflows | 1 | `accounting-posting-lifecycle` |
| UI | Present | base UI surface, admin contributions |
| Owned Entities | 9 | `Chart of Accounts`, `Journal`, `Billing Document`, `Payment Allocation`, `GL Entry`, `Bank Reconciliation`, `Accounting Period`, `Budget`, `Dunning Case` |
| Reports | 8 | `Trial Balance`, `General Ledger`, `Balance Sheet`, `Profit and Loss Statement`, `Accounts Receivable`, `Accounts Payable`, `Cash Flow`, `Bank Clearance Summary` |
| Exception Queues | 5 | `period-close-blockers`, `bank-reconciliation-breaks`, `subledger-gl-mismatches`, `over-billing-review`, `stale-exchange-rates` |
| Operational Scenarios | 5 | `invoice-to-payment`, `purchase-bill-to-payment`, `credit-note-reversal`, `bank-import-to-reconciliation`, `period-close` |
| Settings Surfaces | 6 | `Accounts Settings`, `Fiscal Year`, `Payment Terms Template`, `Mode of Payment`, `Finance Book`, `Accounting Period` |
| ERPNext Refs | 1 | `Accounts` |

## Quick Start For Integrators

Use this repo inside a **compatible Gutu workspace** or the **ecosystem certification workspace** so its `workspace:*` dependencies resolve honestly.

```bash
# from a compatible workspace that already includes this plugin's dependency graph
bun install
bun run build
bun run test
bun run docs:check
```

```ts
import { manifest, postBillingDocumentAction, BusinessPrimaryResource, jobDefinitions, workflowDefinitions, adminContributions, uiSurface } from "@plugins/accounting-core";

console.log(manifest.id);
console.log(postBillingDocumentAction.id);
console.log(BusinessPrimaryResource.id);
```

Use the root repo scripts for day-to-day work **after the workspace is bootstrapped**, or run the nested package directly from `framework/builtin-plugins/accounting-core` if you need lower-level control.

## Current Test Coverage

- Root verification scripts: `bun run build`, `bun run typecheck`, `bun run lint`, `bun run test`, `bun run test:contracts`, `bun run test:unit`, `bun run test:integration`, `bun run test:migrations`, `bun run docs:check`
- Unit files: 1
- Contracts files: 1
- Integration files: 1
- Migrations files: 2

## Known Boundaries And Non-Goals

- Not a full vertical application suite; this plugin only owns the domain slice exported in this repo.
- Not a replacement for explicit orchestration in jobs/workflows when multi-step automation is required.
- Cross-plugin composition should use Gutu command, event, job, and workflow primitives. This repo should not be documented as exposing a generic WordPress-style hook system unless one is explicitly exported.

## Recommended Next Milestones

- Deepen posting templates, close controls, and reversal handling before upstream domains rely on accounting intents in production.
- Add stronger downstream bank, tax, and subledger reconciliation coverage as the finance surface hardens.
- Broaden lifecycle coverage with deeper orchestration, reconciliation, and operator tooling where the business flow requires it.
- Add more explicit domain events or follow-up job surfaces when downstream systems need tighter coupling.
- Convert more ERP parity references into first-class runtime handlers where needed, starting from `Account`, `Accounting Period`, `Journal Entry`.

## More Docs

See [DEVELOPER.md](./DEVELOPER.md), [TODO.md](./TODO.md), [SECURITY.md](./SECURITY.md), [CONTRIBUTING.md](./CONTRIBUTING.md). The internal domain sources used to build those docs live under:

- `plugins/gutu-plugin-accounting-core/framework/builtin-plugins/accounting-core/docs/AGENT_CONTEXT.md`
- `plugins/gutu-plugin-accounting-core/framework/builtin-plugins/accounting-core/docs/BUSINESS_RULES.md`
- `plugins/gutu-plugin-accounting-core/framework/builtin-plugins/accounting-core/docs/EDGE_CASES.md`
- `plugins/gutu-plugin-accounting-core/framework/builtin-plugins/accounting-core/docs/FLOWS.md`
- `plugins/gutu-plugin-accounting-core/framework/builtin-plugins/accounting-core/docs/GLOSSARY.md`
- `plugins/gutu-plugin-accounting-core/framework/builtin-plugins/accounting-core/docs/MANDATORY_STEPS.md`
