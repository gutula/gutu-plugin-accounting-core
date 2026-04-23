# Accounting Core TODO

**Maturity Tier:** `Hardened`

## Shipped Now

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

## Current Gaps

- No additional gaps were identified beyond the plugin’s stated non-goals.

## Recommended Next

- Deepen posting templates, close controls, and reversal handling before upstream domains rely on accounting intents in production.
- Add stronger downstream bank, tax, and subledger reconciliation coverage as the finance surface hardens.
- Broaden lifecycle coverage with deeper orchestration, reconciliation, and operator tooling where the business flow requires it.
- Add more explicit domain events or follow-up job surfaces when downstream systems need tighter coupling.
- Convert more ERP parity references into first-class runtime handlers where needed, starting from `Account`, `Accounting Period`, `Journal Entry`.

## Later / Optional

- Outbound connectors, richer analytics, or portal-facing experiences once the core domain contracts harden.
