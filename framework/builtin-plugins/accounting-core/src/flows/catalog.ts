import {
  advancePrimaryRecord,
  amendPrimaryRecord,
  createPrimaryRecord,
  placePrimaryRecordOnHold,
  reconcilePrimaryRecord,
  releasePrimaryRecordHold,
  reversePrimaryRecord,
  type AdvancePrimaryRecordInput,
  type AmendPrimaryRecordInput,
  type CreatePrimaryRecordInput,
  type PlacePrimaryRecordOnHoldInput,
  type ReconcilePrimaryRecordInput,
  type ReleasePrimaryRecordHoldInput,
  type ReversePrimaryRecordInput
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
  },
  {
    "id": "accounting.billing.hold",
    "label": "Place Record On Hold",
    "phase": "hold",
    "methodName": "placeRecordOnHold"
  },
  {
    "id": "accounting.billing.release",
    "label": "Release Record Hold",
    "phase": "release",
    "methodName": "releaseRecordHold"
  },
  {
    "id": "accounting.billing.amend",
    "label": "Amend Record",
    "phase": "amend",
    "methodName": "amendRecord"
  },
  {
    "id": "accounting.billing.reverse",
    "label": "Reverse Record",
    "phase": "reverse",
    "methodName": "reverseRecord"
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

export async function placeRecordOnHold(input: PlacePrimaryRecordOnHoldInput) {
  return placePrimaryRecordOnHold(input);
}

export async function releaseRecordHold(input: ReleasePrimaryRecordHoldInput) {
  return releasePrimaryRecordHold(input);
}

export async function amendRecord(input: AmendPrimaryRecordInput) {
  return amendPrimaryRecord(input);
}

export async function reverseRecord(input: ReversePrimaryRecordInput) {
  return reversePrimaryRecord(input);
}
