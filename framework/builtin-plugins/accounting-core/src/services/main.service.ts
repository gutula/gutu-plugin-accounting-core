import {
  createBusinessDomainStateStore,
  createBusinessOrchestrationState,
  createBusinessPluginService,
  type BusinessAdvancePrimaryRecordInput,
  type BusinessAmendPrimaryRecordInput,
  type BusinessCreatePrimaryRecordInput,
  type BusinessFailPendingDownstreamItemInput,
  type BusinessPlacePrimaryRecordOnHoldInput,
  type BusinessReconcilePrimaryRecordInput,
  type BusinessReleasePrimaryRecordHoldInput,
  type BusinessReplayDeadLetterInput,
  type BusinessReversePrimaryRecordInput,
  type BusinessResolvePendingDownstreamItemInput
} from "@platform/business-runtime";

import { type ExceptionRecord, type PrimaryRecord, type SecondaryRecord } from "../model";

export type CreatePrimaryRecordInput = BusinessCreatePrimaryRecordInput;
export type AdvancePrimaryRecordInput = BusinessAdvancePrimaryRecordInput;
export type PlacePrimaryRecordOnHoldInput = BusinessPlacePrimaryRecordOnHoldInput;
export type ReleasePrimaryRecordHoldInput = BusinessReleasePrimaryRecordHoldInput;
export type AmendPrimaryRecordInput = BusinessAmendPrimaryRecordInput;
export type ReconcilePrimaryRecordInput = BusinessReconcilePrimaryRecordInput;
export type ReversePrimaryRecordInput = BusinessReversePrimaryRecordInput;
export type ResolvePendingDownstreamItemInput = BusinessResolvePendingDownstreamItemInput;
export type FailPendingDownstreamItemInput = BusinessFailPendingDownstreamItemInput;
export type ReplayDeadLetterInput = BusinessReplayDeadLetterInput;

function seedState() {
  return {
    primaryRecords: [
      {
        id: "accounting-core:seed",
        tenantId: "tenant-platform",
        title: "Accounting Core Seed Record",
        counterpartyId: "party:seed",
        companyId: "company:primary",
        branchId: "branch:head-office",
        recordState: "active",
        approvalState: "approved",
        postingState: "unposted",
        fulfillmentState: "none",
        amountMinor: 125000,
        currencyCode: "USD",
        revisionNo: 1,
        reasonCode: null,
        effectiveAt: "2026-04-23T00:00:00.000Z",
        correlationId: "accounting-core:seed",
        processId: "accounting-posting-lifecycle:seed",
        upstreamRefs: [],
        downstreamRefs: [],
        updatedAt: "2026-04-23T00:00:00.000Z"
      }
    ] satisfies PrimaryRecord[],
    secondaryRecords: [] satisfies SecondaryRecord[],
    exceptionRecords: [] satisfies ExceptionRecord[],
    orchestration: createBusinessOrchestrationState()
  };
}

const store = createBusinessDomainStateStore({
  pluginId: "accounting-core",
  sqlite: {
    primaryTable: "accounting_core_primary_records",
    secondaryTable: "accounting_core_secondary_records",
    exceptionTable: "accounting_core_exception_records",
    dbFileName: "business-runtime.sqlite"
  },
  postgres: {
    schemaName: "accounting_core"
  },
  seedStateFactory: seedState
});

const service = createBusinessPluginService({
  pluginId: "accounting-core",
  displayName: "Accounting Core",
  primaryResourceId: "accounting.journals",
  secondaryResourceId: "accounting.billing",
  exceptionResourceId: "accounting.reconciliation",
  createEvent: "accounting.billing-posted.v1",
  advanceEvent: "accounting.payment-allocated.v1",
  reconcileEvent: "accounting.period-closed.v1",
  projectionJobId: "accounting.projections.refresh",
  reconciliationJobId: "accounting.reconciliation.run",
  advanceActionLabel: "Allocate Payment",
  orchestrationTargets: {
  "create": [],
  "advance": [
    "traceability.links.record"
  ],
  "reconcile": [
    "traceability.reconciliation.queue"
  ]
},
  store
});

export const {
  listPrimaryRecords,
  listSecondaryRecords,
  listExceptionRecords,
  listPublishedMessages,
  listPendingDownstreamItems,
  listDeadLetters,
  listProjectionRecords,
  getBusinessOverview,
  createPrimaryRecord,
  advancePrimaryRecord,
  placePrimaryRecordOnHold,
  releasePrimaryRecordHold,
  amendPrimaryRecord,
  reconcilePrimaryRecord,
  reversePrimaryRecord,
  resolvePendingDownstreamItem,
  failPendingDownstreamItem,
  replayDeadLetter
} = service;
