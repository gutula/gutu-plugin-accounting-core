export const scenarioDefinitions = [
  {
    "id": "invoice-to-payment",
    "owningPlugin": "accounting-core",
    "workflowId": "accounting-posting-lifecycle",
    "actionIds": [
      "accounting.billing.post",
      "accounting.payments.allocate",
      "accounting.periods.close",
      "accounting.billing.hold",
      "accounting.billing.release",
      "accounting.billing.amend",
      "accounting.billing.reverse"
    ],
    "downstreamTargets": {
      "create": [],
      "advance": [
        "traceability.links.record"
      ],
      "reconcile": [
        "traceability.reconciliation.queue"
      ]
    }
  },
  {
    "id": "purchase-bill-to-payment",
    "owningPlugin": "accounting-core",
    "workflowId": "accounting-posting-lifecycle",
    "actionIds": [
      "accounting.billing.post",
      "accounting.payments.allocate",
      "accounting.periods.close",
      "accounting.billing.hold",
      "accounting.billing.release",
      "accounting.billing.amend",
      "accounting.billing.reverse"
    ],
    "downstreamTargets": {
      "create": [],
      "advance": [
        "traceability.links.record"
      ],
      "reconcile": [
        "traceability.reconciliation.queue"
      ]
    }
  },
  {
    "id": "credit-note-reversal",
    "owningPlugin": "accounting-core",
    "workflowId": "accounting-posting-lifecycle",
    "actionIds": [
      "accounting.billing.post",
      "accounting.payments.allocate",
      "accounting.periods.close",
      "accounting.billing.hold",
      "accounting.billing.release",
      "accounting.billing.amend",
      "accounting.billing.reverse"
    ],
    "downstreamTargets": {
      "create": [],
      "advance": [
        "traceability.links.record"
      ],
      "reconcile": [
        "traceability.reconciliation.queue"
      ]
    }
  },
  {
    "id": "bank-import-to-reconciliation",
    "owningPlugin": "accounting-core",
    "workflowId": "accounting-posting-lifecycle",
    "actionIds": [
      "accounting.billing.post",
      "accounting.payments.allocate",
      "accounting.periods.close",
      "accounting.billing.hold",
      "accounting.billing.release",
      "accounting.billing.amend",
      "accounting.billing.reverse"
    ],
    "downstreamTargets": {
      "create": [],
      "advance": [
        "traceability.links.record"
      ],
      "reconcile": [
        "traceability.reconciliation.queue"
      ]
    }
  },
  {
    "id": "period-close",
    "owningPlugin": "accounting-core",
    "workflowId": "accounting-posting-lifecycle",
    "actionIds": [
      "accounting.billing.post",
      "accounting.payments.allocate",
      "accounting.periods.close",
      "accounting.billing.hold",
      "accounting.billing.release",
      "accounting.billing.amend",
      "accounting.billing.reverse"
    ],
    "downstreamTargets": {
      "create": [],
      "advance": [
        "traceability.links.record"
      ],
      "reconcile": [
        "traceability.reconciliation.queue"
      ]
    }
  }
] as const;
