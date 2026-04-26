/** General Ledger REST API.
 *
 *  Routes:
 *    Accounts:
 *      GET    /accounts                    list (?company=&includeDisabled=1)
 *      GET    /accounts/:id                fetch one
 *      POST   /accounts                    create
 *      PATCH  /accounts/:id                update
 *
 *    Periods:
 *      GET    /periods                     list
 *      POST   /periods                     create
 *      POST   /periods/:id/close
 *      POST   /periods/:id/reopen
 *
 *    Journals:
 *      GET    /journals                    list (?from=&to=&source=&sourceId=&limit=)
 *      GET    /journals/:id                fetch one
 *      POST   /journals                    post a new (atomic, balanced) journal
 *      POST   /journals/:id/reverse        post a reversing journal
 *
 *    Reports:
 *      GET    /reports/trial-balance       trial balance + sum check
 *      GET    /reports/balance-sheet
 *      GET    /reports/profit-and-loss
 *      GET    /reports/ledger/:accountId   ledger detail
 */

import { Hono } from "@gutu-host";
import { requireAuth, currentUser } from "@gutu-host";
import { getTenantContext } from "@gutu-host";
import {
  GlError,
  accountBalances,
  balanceSheet,
  closePeriod,
  createAccount,
  createPeriod,
  getAccount,
  getJournal,
  ledgerForAccount,
  listAccounts,
  listJournals,
  listPeriods,
  postJournal,
  profitAndLoss,
  reopenPeriod,
  reverseJournal,
  trialBalance,
  updateAccount,
} from "@gutu-plugin/accounting-core";
import { recordAudit } from "@gutu-host";

export const glLedgerRoutes = new Hono();
glLedgerRoutes.use("*", requireAuth);

function tenantId(): string {
  return getTenantContext()?.tenantId ?? "default";
}

function handleErr(err: unknown) {
  if (err instanceof GlError) {
    return { body: { error: err.message, code: err.code }, status: 400 as const };
  }
  return null;
}

/* --- Accounts ---------------------------------------------------------- */

glLedgerRoutes.get("/accounts", (c) =>
  c.json({
    rows: listAccounts(tenantId(), {
      companyId: c.req.query("company") ?? null,
      includeDisabled: c.req.query("includeDisabled") === "1",
    }),
  }),
);

glLedgerRoutes.get("/accounts/:id", (c) => {
  const a = getAccount(tenantId(), c.req.param("id"));
  if (!a) return c.json({ error: "not found" }, 404);
  return c.json(a);
});

glLedgerRoutes.post("/accounts", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const user = currentUser(c);
  try {
    const acc = createAccount({
      tenantId: tenantId(),
      companyId: (body.companyId as string | null | undefined) ?? null,
      number: String(body.number ?? ""),
      name: String(body.name ?? ""),
      accountType: body.accountType as never,
      parentId: (body.parentId as string | null | undefined) ?? null,
      isGroup: body.isGroup === true,
      currency: typeof body.currency === "string" ? body.currency : undefined,
      description: typeof body.description === "string" ? body.description : null,
      createdBy: user.email,
    });
    recordAudit({
      actor: user.email,
      action: "gl-account.created",
      resource: "gl-account",
      recordId: acc.id,
      payload: { number: acc.number, name: acc.name, accountType: acc.accountType },
    });
    return c.json(acc, 201);
  } catch (err) {
    const handled = handleErr(err);
    if (handled) return c.json(handled.body, handled.status);
    throw err;
  }
});

glLedgerRoutes.patch("/accounts/:id", async (c) => {
  const id = c.req.param("id");
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const updated = updateAccount(tenantId(), id, body as never);
  if (!updated) return c.json({ error: "not found" }, 404);
  const user = currentUser(c);
  recordAudit({
    actor: user.email,
    action: "gl-account.updated",
    resource: "gl-account",
    recordId: id,
  });
  return c.json(updated);
});

/* --- Periods ----------------------------------------------------------- */

glLedgerRoutes.get("/periods", (c) =>
  c.json({ rows: listPeriods(tenantId(), c.req.query("company") ?? null) }),
);

glLedgerRoutes.post("/periods", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  try {
    const p = createPeriod({
      tenantId: tenantId(),
      companyId: (body.companyId as string | null | undefined) ?? null,
      label: String(body.label ?? ""),
      startDate: String(body.startDate ?? ""),
      endDate: String(body.endDate ?? ""),
    });
    return c.json(p, 201);
  } catch (err) {
    const handled = handleErr(err);
    if (handled) return c.json(handled.body, handled.status);
    throw err;
  }
});

glLedgerRoutes.post("/periods/:id/close", (c) => {
  const id = c.req.param("id");
  const user = currentUser(c);
  try {
    const p = closePeriod({ tenantId: tenantId(), id, closedBy: user.email });
    recordAudit({
      actor: user.email,
      action: "gl-period.closed",
      resource: "gl-period",
      recordId: id,
    });
    return c.json(p);
  } catch (err) {
    const handled = handleErr(err);
    if (handled) return c.json(handled.body, handled.status);
    throw err;
  }
});

glLedgerRoutes.post("/periods/:id/reopen", (c) => {
  const id = c.req.param("id");
  const user = currentUser(c);
  try {
    const p = reopenPeriod({ tenantId: tenantId(), id });
    recordAudit({
      actor: user.email,
      action: "gl-period.reopened",
      resource: "gl-period",
      recordId: id,
    });
    return c.json(p);
  } catch (err) {
    const handled = handleErr(err);
    if (handled) return c.json(handled.body, handled.status);
    throw err;
  }
});

/* --- Journals ---------------------------------------------------------- */

glLedgerRoutes.get("/journals", (c) =>
  c.json({
    rows: listJournals({
      tenantId: tenantId(),
      companyId: c.req.query("company") ?? null,
      fromDate: c.req.query("from") ?? undefined,
      toDate: c.req.query("to") ?? undefined,
      sourceResource: c.req.query("source") ?? undefined,
      sourceRecordId: c.req.query("sourceId") ?? undefined,
      limit: c.req.query("limit") ? Math.min(Number(c.req.query("limit")), 1000) : undefined,
    }),
  }),
);

glLedgerRoutes.get("/journals/:id", (c) => {
  const j = getJournal(tenantId(), c.req.param("id"));
  if (!j) return c.json({ error: "not found" }, 404);
  return c.json(j);
});

glLedgerRoutes.post("/journals", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const user = currentUser(c);
  try {
    const j = postJournal({
      tenantId: tenantId(),
      companyId: (body.companyId as string | null | undefined) ?? null,
      number: String(body.number ?? ""),
      postingDate: String(body.postingDate ?? ""),
      memo: typeof body.memo === "string" ? body.memo : null,
      sourceResource: typeof body.sourceResource === "string" ? body.sourceResource : null,
      sourceRecordId: typeof body.sourceRecordId === "string" ? body.sourceRecordId : null,
      idempotencyKey: typeof body.idempotencyKey === "string" ? body.idempotencyKey : null,
      currency: typeof body.currency === "string" ? body.currency : undefined,
      lines: Array.isArray(body.lines) ? (body.lines as never) : [],
      allowClosedPeriod: body.allowClosedPeriod === true,
      createdBy: user.email,
    });
    recordAudit({
      actor: user.email,
      action: "gl-journal.posted",
      resource: "gl-journal",
      recordId: j.id,
      payload: {
        number: j.number,
        totalDebitMinor: j.totalDebitMinor,
        totalCreditMinor: j.totalCreditMinor,
      },
    });
    return c.json(j, 201);
  } catch (err) {
    const handled = handleErr(err);
    if (handled) return c.json(handled.body, handled.status);
    throw err;
  }
});

glLedgerRoutes.post("/journals/:id/reverse", async (c) => {
  const id = c.req.param("id");
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const user = currentUser(c);
  try {
    const j = reverseJournal({
      tenantId: tenantId(),
      journalId: id,
      reversalNumber: String(body.reversalNumber ?? `REV-${id.slice(0, 8)}`),
      reversalDate: typeof body.reversalDate === "string" ? body.reversalDate : undefined,
      memo: typeof body.memo === "string" ? body.memo : undefined,
      allowClosedPeriod: body.allowClosedPeriod === true,
      createdBy: user.email,
    });
    recordAudit({
      actor: user.email,
      action: "gl-journal.reversed",
      resource: "gl-journal",
      recordId: id,
      payload: { reversalId: j.id, reversalNumber: j.number },
    });
    return c.json(j, 201);
  } catch (err) {
    const handled = handleErr(err);
    if (handled) return c.json(handled.body, handled.status);
    throw err;
  }
});

/* --- Reports ----------------------------------------------------------- */

glLedgerRoutes.get("/reports/trial-balance", (c) => {
  return c.json(
    trialBalance({
      tenantId: tenantId(),
      companyId: c.req.query("company") ?? null,
      fromDate: c.req.query("from") ?? undefined,
      toDate: c.req.query("to") ?? undefined,
    }),
  );
});

glLedgerRoutes.get("/reports/balance-sheet", (c) => {
  const asOf = c.req.query("asOf") ?? new Date().toISOString().slice(0, 10);
  return c.json(
    balanceSheet({
      tenantId: tenantId(),
      companyId: c.req.query("company") ?? null,
      asOf,
    }),
  );
});

glLedgerRoutes.get("/reports/profit-and-loss", (c) => {
  return c.json(
    profitAndLoss({
      tenantId: tenantId(),
      companyId: c.req.query("company") ?? null,
      fromDate: c.req.query("from") ?? undefined,
      toDate: c.req.query("to") ?? undefined,
    }),
  );
});

glLedgerRoutes.get("/reports/ledger/:accountId", (c) => {
  try {
    return c.json({
      rows: ledgerForAccount({
        tenantId: tenantId(),
        accountId: c.req.param("accountId"),
        fromDate: c.req.query("from") ?? undefined,
        toDate: c.req.query("to") ?? undefined,
        limit: c.req.query("limit") ? Math.min(Number(c.req.query("limit")), 5000) : undefined,
      }),
    });
  } catch (err) {
    const handled = handleErr(err);
    if (handled) return c.json(handled.body, handled.status);
    throw err;
  }
});

/* --- Account balances summary (account-list with debit/credit/balance) -- */

glLedgerRoutes.get("/balances", (c) => {
  return c.json({
    rows: accountBalances({
      tenantId: tenantId(),
      companyId: c.req.query("company") ?? null,
      fromDate: c.req.query("from") ?? undefined,
      toDate: c.req.query("to") ?? undefined,
    }),
  });
});
