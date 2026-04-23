import { definePackage } from "@platform/kernel";

export default definePackage({
  "id": "accounting-core",
  "kind": "plugin",
  "version": "0.1.0",
  "contractVersion": "1.0.0",
  "sourceRepo": "gutu-plugin-accounting-core",
  "displayName": "Accounting Core",
  "domainGroup": "Operational Data",
  "defaultCategory": {
    "id": "business",
    "label": "Business",
    "subcategoryId": "accounting_finance",
    "subcategoryLabel": "Accounting & Finance"
  },
  "description": "General ledger, receivable, payable, billing, payment allocation, and close-oriented accounting truth with append-only posting discipline.",
  "extends": [],
  "dependsOn": [
    "auth-core",
    "org-tenant-core",
    "role-policy-core",
    "audit-core",
    "workflow-core",
    "party-relationships-core",
    "pricing-tax-core",
    "traceability-core"
  ],
  "dependencyContracts": [
    {
      "packageId": "auth-core",
      "class": "required",
      "rationale": "Required for Accounting Core to keep its boundary governed and explicit."
    },
    {
      "packageId": "org-tenant-core",
      "class": "required",
      "rationale": "Required for Accounting Core to keep its boundary governed and explicit."
    },
    {
      "packageId": "role-policy-core",
      "class": "required",
      "rationale": "Required for Accounting Core to keep its boundary governed and explicit."
    },
    {
      "packageId": "audit-core",
      "class": "required",
      "rationale": "Required for Accounting Core to keep its boundary governed and explicit."
    },
    {
      "packageId": "workflow-core",
      "class": "required",
      "rationale": "Required for Accounting Core to keep its boundary governed and explicit."
    },
    {
      "packageId": "party-relationships-core",
      "class": "required",
      "rationale": "Required for Accounting Core to keep its boundary governed and explicit."
    },
    {
      "packageId": "pricing-tax-core",
      "class": "required",
      "rationale": "Required for Accounting Core to keep its boundary governed and explicit."
    },
    {
      "packageId": "traceability-core",
      "class": "required",
      "rationale": "Required for Accounting Core to keep its boundary governed and explicit."
    }
  ],
  "optionalWith": [],
  "conflictsWith": [],
  "providesCapabilities": [
    "accounting.journals",
    "accounting.billing",
    "accounting.reconciliation"
  ],
  "requestedCapabilities": [
    "ui.register.admin",
    "api.rest.mount",
    "data.write.accounting",
    "events.publish.accounting"
  ],
  "ownsData": [
    "accounting.journals",
    "accounting.billing",
    "accounting.allocations",
    "accounting.reconciliation"
  ],
  "extendsData": [],
  "publicCommands": [
    "accounting.billing.post",
    "accounting.payments.allocate",
    "accounting.periods.close"
  ],
  "publicQueries": [
    "accounting.trial-balance",
    "accounting.subledger-reconciliation"
  ],
  "publicEvents": [
    "accounting.billing-posted.v1",
    "accounting.payment-allocated.v1",
    "accounting.period-closed.v1"
  ],
  "domainCatalog": {
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
  },
  "slotClaims": [],
  "trustTier": "first-party",
  "reviewTier": "R1",
  "isolationProfile": "same-process-trusted",
  "compatibility": {
    "framework": "^0.1.0",
    "runtime": "bun>=1.3.12",
    "db": [
      "postgres",
      "sqlite"
    ]
  }
});
