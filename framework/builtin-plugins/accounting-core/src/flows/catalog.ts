import {
  advancePrimaryRecord,
  createPrimaryRecord,
  reconcilePrimaryRecord,
  type AdvancePrimaryRecordInput,
  type CreatePrimaryRecordInput,
  type ReconcilePrimaryRecordInput
} from "../services/main.service";

export const businessFlowDefinitions = [
  {
    "id": "accounting.billing.post",
    "label": "Post Billing Document",
    "phase": "create",
    "methodName": "postBillingDocument"
  },
  {
    "id": "accounting.payments.allocate",
    "label": "Allocate Payment",
    "phase": "advance",
    "methodName": "allocatePayment"
  },
  {
    "id": "accounting.periods.close",
    "label": "Close Accounting Period",
    "phase": "reconcile",
    "methodName": "closeAccountingPeriod"
  }
] as const;

export async function postBillingDocument(input: CreatePrimaryRecordInput) {
  return createPrimaryRecord(input);
}

export async function allocatePayment(input: AdvancePrimaryRecordInput) {
  return advancePrimaryRecord(input);
}

export async function closeAccountingPeriod(input: ReconcilePrimaryRecordInput) {
  return reconcilePrimaryRecord(input);
}
