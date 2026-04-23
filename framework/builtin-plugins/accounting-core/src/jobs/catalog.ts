import { defineJob } from "@platform/jobs";
import { z } from "zod";

export const jobDefinitionKeys = [
  "accounting.projections.refresh",
  "accounting.reconciliation.run"
] as const;

export const jobDefinitions = {
  "accounting.projections.refresh": defineJob({
    id: "accounting.projections.refresh",
    queue: "accounting-projections",
    payload: z.object({
      tenantId: z.string().min(2),
      recordId: z.string().min(2)
    }),
    concurrency: 2,
    retryPolicy: {
      attempts: 3,
      backoff: "exponential",
      delayMs: 1_000
    },
    timeoutMs: 30_000,
    handler: () => undefined
  }),
  "accounting.reconciliation.run": defineJob({
    id: "accounting.reconciliation.run",
    queue: "accounting-reconciliation",
    payload: z.object({
      tenantId: z.string().min(2),
      recordId: z.string().min(2)
    }),
    concurrency: 1,
    retryPolicy: {
      attempts: 4,
      backoff: "linear",
      delayMs: 1_500
    },
    timeoutMs: 45_000,
    handler: () => undefined
  })
} as const;
