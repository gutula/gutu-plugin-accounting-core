export const reportDefinitions = [
  {
    "id": "accounting-core.report.01",
    "label": "Trial Balance",
    "owningPlugin": "accounting-core",
    "source": "erpnext-parity",
    "exceptionQueues": [
      "period-close-blockers",
      "bank-reconciliation-breaks",
      "subledger-gl-mismatches",
      "over-billing-review",
      "stale-exchange-rates"
    ]
  },
  {
    "id": "accounting-core.report.02",
    "label": "General Ledger",
    "owningPlugin": "accounting-core",
    "source": "erpnext-parity",
    "exceptionQueues": [
      "period-close-blockers",
      "bank-reconciliation-breaks",
      "subledger-gl-mismatches",
      "over-billing-review",
      "stale-exchange-rates"
    ]
  },
  {
    "id": "accounting-core.report.03",
    "label": "Balance Sheet",
    "owningPlugin": "accounting-core",
    "source": "erpnext-parity",
    "exceptionQueues": [
      "period-close-blockers",
      "bank-reconciliation-breaks",
      "subledger-gl-mismatches",
      "over-billing-review",
      "stale-exchange-rates"
    ]
  },
  {
    "id": "accounting-core.report.04",
    "label": "Profit and Loss Statement",
    "owningPlugin": "accounting-core",
    "source": "erpnext-parity",
    "exceptionQueues": [
      "period-close-blockers",
      "bank-reconciliation-breaks",
      "subledger-gl-mismatches",
      "over-billing-review",
      "stale-exchange-rates"
    ]
  },
  {
    "id": "accounting-core.report.05",
    "label": "Accounts Receivable",
    "owningPlugin": "accounting-core",
    "source": "erpnext-parity",
    "exceptionQueues": [
      "period-close-blockers",
      "bank-reconciliation-breaks",
      "subledger-gl-mismatches",
      "over-billing-review",
      "stale-exchange-rates"
    ]
  },
  {
    "id": "accounting-core.report.06",
    "label": "Accounts Payable",
    "owningPlugin": "accounting-core",
    "source": "erpnext-parity",
    "exceptionQueues": [
      "period-close-blockers",
      "bank-reconciliation-breaks",
      "subledger-gl-mismatches",
      "over-billing-review",
      "stale-exchange-rates"
    ]
  },
  {
    "id": "accounting-core.report.07",
    "label": "Cash Flow",
    "owningPlugin": "accounting-core",
    "source": "erpnext-parity",
    "exceptionQueues": [
      "period-close-blockers",
      "bank-reconciliation-breaks",
      "subledger-gl-mismatches",
      "over-billing-review",
      "stale-exchange-rates"
    ]
  },
  {
    "id": "accounting-core.report.08",
    "label": "Bank Clearance Summary",
    "owningPlugin": "accounting-core",
    "source": "erpnext-parity",
    "exceptionQueues": [
      "period-close-blockers",
      "bank-reconciliation-breaks",
      "subledger-gl-mismatches",
      "over-billing-review",
      "stale-exchange-rates"
    ]
  }
] as const;
