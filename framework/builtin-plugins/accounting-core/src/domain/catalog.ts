export const domainCatalog = {
  "erpnextModules": [
    "Accounts"
  ],
  "erpnextDoctypes": [
    "Account",
    "Accounting Period",
    "Journal Entry",
    "Payment Entry",
    "Sales Invoice",
    "Purchase Invoice",
    "GL Entry",
    "Bank Reconciliation Tool",
    "Exchange Rate Revaluation",
    "Dunning",
    "Budget",
    "Period Closing Voucher",
    "POS Invoice"
  ],
  "ownedEntities": [
    "Chart of Accounts",
    "Journal",
    "Billing Document",
    "Payment Allocation",
    "GL Entry",
    "Bank Reconciliation",
    "Accounting Period",
    "Budget",
    "Dunning Case"
  ],
  "reports": [
    "Trial Balance",
    "General Ledger",
    "Balance Sheet",
    "Profit and Loss Statement",
    "Accounts Receivable",
    "Accounts Payable",
    "Cash Flow",
    "Bank Clearance Summary"
  ],
  "exceptionQueues": [
    "period-close-blockers",
    "bank-reconciliation-breaks",
    "subledger-gl-mismatches",
    "over-billing-review",
    "stale-exchange-rates"
  ],
  "operationalScenarios": [
    "invoice-to-payment",
    "purchase-bill-to-payment",
    "credit-note-reversal",
    "bank-import-to-reconciliation",
    "period-close"
  ],
  "settingsSurfaces": [
    "Accounts Settings",
    "Fiscal Year",
    "Payment Terms Template",
    "Mode of Payment",
    "Finance Book",
    "Accounting Period"
  ],
  "edgeCases": [
    "partial allocation",
    "multi-currency revaluation",
    "advance payment adjustment",
    "cancellation with linked payments",
    "closed-period reopening"
  ]
} as const;
