export const exceptionQueueDefinitions = [
  {
    "id": "period-close-blockers",
    "label": "Period Close Blockers",
    "severity": "medium",
    "owner": "accountant",
    "reconciliationJobId": "accounting.reconciliation.run"
  },
  {
    "id": "bank-reconciliation-breaks",
    "label": "Bank Reconciliation Breaks",
    "severity": "medium",
    "owner": "accountant",
    "reconciliationJobId": "accounting.reconciliation.run"
  },
  {
    "id": "subledger-gl-mismatches",
    "label": "Subledger Gl Mismatches",
    "severity": "medium",
    "owner": "accountant",
    "reconciliationJobId": "accounting.reconciliation.run"
  },
  {
    "id": "over-billing-review",
    "label": "Over Billing Review",
    "severity": "medium",
    "owner": "accountant",
    "reconciliationJobId": "accounting.reconciliation.run"
  },
  {
    "id": "stale-exchange-rates",
    "label": "Stale Exchange Rates",
    "severity": "medium",
    "owner": "accountant",
    "reconciliationJobId": "accounting.reconciliation.run"
  }
] as const;
