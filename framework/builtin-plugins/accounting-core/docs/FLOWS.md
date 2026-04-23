# Accounting Core Flows

## Happy paths

- `accounting.billing.post`: Post Billing Document
- `accounting.payments.allocate`: Allocate Payment
- `accounting.periods.close`: Close Accounting Period
- `accounting.billing.hold`: Place Record On Hold
- `accounting.billing.release`: Release Record Hold
- `accounting.billing.amend`: Amend Record
- `accounting.billing.reverse`: Reverse Record

## Operational scenario matrix

- `invoice-to-payment`
- `purchase-bill-to-payment`
- `credit-note-reversal`
- `bank-import-to-reconciliation`
- `period-close`

## Action-level flows

### `accounting.billing.post`

Post Billing Document

Permission: `accounting.billing.write`

Business purpose: Expose the plugin’s write boundary through a validated, auditable action contract.

Preconditions:

- Caller input must satisfy the action schema exported by the plugin.
- The caller must satisfy the declared permission and any host-level installation constraints.
- Integration should honor the action’s idempotent semantics.

Side effects:

- Mutates or validates state owned by `accounting.journals`, `accounting.billing`, `accounting.reconciliation`.
- May schedule or describe follow-up background work.

Forbidden shortcuts:

- Do not bypass the action contract with undocumented service mutations in application code.
- Do not document extra hooks, retries, or lifecycle semantics unless they are explicitly exported here.


### `accounting.payments.allocate`

Allocate Payment

Permission: `accounting.payments.write`

Business purpose: Expose the plugin’s write boundary through a validated, auditable action contract.

Preconditions:

- Caller input must satisfy the action schema exported by the plugin.
- The caller must satisfy the declared permission and any host-level installation constraints.
- Integration should honor the action’s non-idempotent semantics.

Side effects:

- Mutates or validates state owned by `accounting.journals`, `accounting.billing`, `accounting.reconciliation`.
- May schedule or describe follow-up background work.

Forbidden shortcuts:

- Do not bypass the action contract with undocumented service mutations in application code.
- Do not document extra hooks, retries, or lifecycle semantics unless they are explicitly exported here.


### `accounting.periods.close`

Close Accounting Period

Permission: `accounting.periods.close`

Business purpose: Expose the plugin’s write boundary through a validated, auditable action contract.

Preconditions:

- Caller input must satisfy the action schema exported by the plugin.
- The caller must satisfy the declared permission and any host-level installation constraints.
- Integration should honor the action’s non-idempotent semantics.

Side effects:

- Mutates or validates state owned by `accounting.journals`, `accounting.billing`, `accounting.reconciliation`.
- May schedule or describe follow-up background work.

Forbidden shortcuts:

- Do not bypass the action contract with undocumented service mutations in application code.
- Do not document extra hooks, retries, or lifecycle semantics unless they are explicitly exported here.


### `accounting.billing.hold`

Place Record On Hold

Permission: `accounting.billing.write`

Business purpose: Expose the plugin’s write boundary through a validated, auditable action contract.

Preconditions:

- Caller input must satisfy the action schema exported by the plugin.
- The caller must satisfy the declared permission and any host-level installation constraints.
- Integration should honor the action’s non-idempotent semantics.

Side effects:

- Mutates or validates state owned by `accounting.journals`, `accounting.billing`, `accounting.reconciliation`.
- May schedule or describe follow-up background work.

Forbidden shortcuts:

- Do not bypass the action contract with undocumented service mutations in application code.
- Do not document extra hooks, retries, or lifecycle semantics unless they are explicitly exported here.


### `accounting.billing.release`

Release Record Hold

Permission: `accounting.billing.write`

Business purpose: Expose the plugin’s write boundary through a validated, auditable action contract.

Preconditions:

- Caller input must satisfy the action schema exported by the plugin.
- The caller must satisfy the declared permission and any host-level installation constraints.
- Integration should honor the action’s non-idempotent semantics.

Side effects:

- Mutates or validates state owned by `accounting.journals`, `accounting.billing`, `accounting.reconciliation`.
- May schedule or describe follow-up background work.

Forbidden shortcuts:

- Do not bypass the action contract with undocumented service mutations in application code.
- Do not document extra hooks, retries, or lifecycle semantics unless they are explicitly exported here.


### `accounting.billing.amend`

Amend Record

Permission: `accounting.billing.write`

Business purpose: Expose the plugin’s write boundary through a validated, auditable action contract.

Preconditions:

- Caller input must satisfy the action schema exported by the plugin.
- The caller must satisfy the declared permission and any host-level installation constraints.
- Integration should honor the action’s non-idempotent semantics.

Side effects:

- Mutates or validates state owned by `accounting.journals`, `accounting.billing`, `accounting.reconciliation`.
- May schedule or describe follow-up background work.

Forbidden shortcuts:

- Do not bypass the action contract with undocumented service mutations in application code.
- Do not document extra hooks, retries, or lifecycle semantics unless they are explicitly exported here.


### `accounting.billing.reverse`

Reverse Record

Permission: `accounting.billing.write`

Business purpose: Expose the plugin’s write boundary through a validated, auditable action contract.

Preconditions:

- Caller input must satisfy the action schema exported by the plugin.
- The caller must satisfy the declared permission and any host-level installation constraints.
- Integration should honor the action’s non-idempotent semantics.

Side effects:

- Mutates or validates state owned by `accounting.journals`, `accounting.billing`, `accounting.reconciliation`.
- May schedule or describe follow-up background work.

Forbidden shortcuts:

- Do not bypass the action contract with undocumented service mutations in application code.
- Do not document extra hooks, retries, or lifecycle semantics unless they are explicitly exported here.


## Cross-package interactions

- Direct dependencies: `auth-core`, `org-tenant-core`, `role-policy-core`, `audit-core`, `workflow-core`, `party-relationships-core`, `pricing-tax-core`, `traceability-core`
- Requested capabilities: `ui.register.admin`, `api.rest.mount`, `data.write.accounting`, `events.publish.accounting`
- Integration model: Actions+Resources+Jobs+Workflows+UI
- ERPNext doctypes used as parity references: `Account`, `Accounting Period`, `Journal Entry`, `Payment Entry`, `Sales Invoice`, `Purchase Invoice`, `GL Entry`, `Bank Reconciliation Tool`, `Exchange Rate Revaluation`, `Dunning`, `Budget`, `Period Closing Voucher`, `POS Invoice`
- Recovery ownership should stay with the host orchestration layer when the plugin does not explicitly export jobs, workflows, or lifecycle events.
