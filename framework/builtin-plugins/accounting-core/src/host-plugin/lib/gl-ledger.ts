/** General Ledger — double-entry accounting primitive.
 *
 *  The GL is the heart of any ERP: it answers "who owes what, to whom,
 *  in what account, as of when". Every monetary transaction —
 *  invoice, bill, payment, payroll, depreciation — lands here as
 *  *balanced* journal entries that sum to zero per journal (debits
 *  equal credits) and never delete (reversal creates a contra journal).
 *
 *  Design decisions:
 *
 *  1. Amounts are stored as **minor units** (`amount_minor` is an
 *     INTEGER), eliminating floating-point drift. Currency code travels
 *     alongside; the caller decides multi-currency policy.
 *
 *  2. Entries are **immutable**. Reversal creates a new journal whose
 *     entries are the contra of the original (debit↔credit, same
 *     amounts). The original journal stays in place; reversal status
 *     is implicit (look up gl_journals where reverses_journal_id = X).
 *
 *  3. Posting is **atomic**. Journal + entries are written inside a
 *     `db.transaction`. The balance check (Σ debits = Σ credits) is
 *     enforced before commit — any imbalance throws and rolls back.
 *
 *  4. Posting is **idempotent**. Callers may pass `idempotencyKey`
 *     (typically the source document id + revision); a duplicate
 *     attempt returns the same journal it created the first time.
 *
 *  5. Period locks. If the journal's `posting_date` falls in a
 *     `closed` period, the post is refused unless the caller passes
 *     `allowClosedPeriod: true` (privileged path: closing entries).
 *
 *  6. Group accounts cannot be posted to. Every leaf account is
 *     `is_group=0`; group nodes (parents) only roll up children.
 *
 *  7. Account `account_type` determines `normal_side`:
 *       asset / expense  → debit
 *       liability / equity / income → credit
 *       contra accounts flip their parent's side.
 *
 *  8. The reporting layer queries `gl_entries` joined to `gl_accounts`
 *     filtered by date, account/account-type, party, cost_center, and
 *     project. Trial balance, AR aging, P&L, and balance sheet all
 *     compose from the same primitive.
 */

import { db, nowIso } from "@gutu-host";
import { uuid } from "@gutu-host";

export type AccountType =
  | "asset"
  | "liability"
  | "equity"
  | "income"
  | "expense"
  | "contra";

export type Side = "debit" | "credit";

export interface GlAccount {
  id: string;
  tenantId: string;
  companyId: string | null;
  number: string;
  name: string;
  accountType: AccountType;
  normalSide: Side;
  currency: string;
  parentId: string | null;
  isGroup: boolean;
  disabled: boolean;
  description: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface GlPeriod {
  id: string;
  tenantId: string;
  companyId: string | null;
  label: string;
  startDate: string;
  endDate: string;
  status: "open" | "closed";
  closedAt: string | null;
  closedBy: string | null;
  createdAt: string;
}

export interface GlJournal {
  id: string;
  tenantId: string;
  companyId: string | null;
  number: string;
  postingDate: string;
  memo: string | null;
  sourceResource: string | null;
  sourceRecordId: string | null;
  reversesJournalId: string | null;
  idempotencyKey: string | null;
  status: "posted";
  totalDebitMinor: number;
  totalCreditMinor: number;
  currency: string;
  createdBy: string;
  createdAt: string;
  entries: GlEntry[];
}

export interface GlEntry {
  id: string;
  tenantId: string;
  companyId: string | null;
  journalId: string;
  accountId: string;
  side: Side;
  amountMinor: number;
  currency: string;
  partyResource: string | null;
  partyId: string | null;
  costCenter: string | null;
  project: string | null;
  memo: string | null;
  postingDate: string;
  createdAt: string;
}

export class GlError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = "GlError";
  }
}

interface AcctRow {
  id: string;
  tenant_id: string;
  company_id: string | null;
  number: string;
  name: string;
  account_type: AccountType;
  normal_side: Side;
  currency: string;
  parent_id: string | null;
  is_group: number;
  disabled: number;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface PeriodRow {
  id: string;
  tenant_id: string;
  company_id: string | null;
  label: string;
  start_date: string;
  end_date: string;
  status: "open" | "closed";
  closed_at: string | null;
  closed_by: string | null;
  created_at: string;
}

interface JournalRow {
  id: string;
  tenant_id: string;
  company_id: string | null;
  number: string;
  posting_date: string;
  memo: string | null;
  source_resource: string | null;
  source_record_id: string | null;
  reverses_journal_id: string | null;
  idempotency_key: string | null;
  status: "posted";
  total_debit_minor: number;
  total_credit_minor: number;
  currency: string;
  created_by: string;
  created_at: string;
}

interface EntryRow {
  id: string;
  tenant_id: string;
  company_id: string | null;
  journal_id: string;
  account_id: string;
  side: Side;
  amount_minor: number;
  currency: string;
  party_resource: string | null;
  party_id: string | null;
  cost_center: string | null;
  project: string | null;
  memo: string | null;
  posting_date: string;
  created_at: string;
}

function acctFromRow(r: AcctRow): GlAccount {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    companyId: r.company_id,
    number: r.number,
    name: r.name,
    accountType: r.account_type,
    normalSide: r.normal_side,
    currency: r.currency,
    parentId: r.parent_id,
    isGroup: r.is_group === 1,
    disabled: r.disabled === 1,
    description: r.description,
    createdBy: r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function periodFromRow(r: PeriodRow): GlPeriod {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    companyId: r.company_id,
    label: r.label,
    startDate: r.start_date,
    endDate: r.end_date,
    status: r.status,
    closedAt: r.closed_at,
    closedBy: r.closed_by,
    createdAt: r.created_at,
  };
}

function entryFromRow(r: EntryRow): GlEntry {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    companyId: r.company_id,
    journalId: r.journal_id,
    accountId: r.account_id,
    side: r.side,
    amountMinor: r.amount_minor,
    currency: r.currency,
    partyResource: r.party_resource,
    partyId: r.party_id,
    costCenter: r.cost_center,
    project: r.project,
    memo: r.memo,
    postingDate: r.posting_date,
    createdAt: r.created_at,
  };
}

function journalFromRows(j: JournalRow, entries: GlEntry[]): GlJournal {
  return {
    id: j.id,
    tenantId: j.tenant_id,
    companyId: j.company_id,
    number: j.number,
    postingDate: j.posting_date,
    memo: j.memo,
    sourceResource: j.source_resource,
    sourceRecordId: j.source_record_id,
    reversesJournalId: j.reverses_journal_id,
    idempotencyKey: j.idempotency_key,
    status: j.status,
    totalDebitMinor: j.total_debit_minor,
    totalCreditMinor: j.total_credit_minor,
    currency: j.currency,
    createdBy: j.created_by,
    createdAt: j.created_at,
    entries,
  };
}

/* ----------------------------- Accounts ---------------------------------- */

const NORMAL_SIDE: Record<AccountType, Side> = {
  asset: "debit",
  expense: "debit",
  liability: "credit",
  equity: "credit",
  income: "credit",
  contra: "debit",
};

export interface CreateAccountArgs {
  tenantId: string;
  companyId?: string | null;
  number: string;
  name: string;
  accountType: AccountType;
  parentId?: string | null;
  isGroup?: boolean;
  currency?: string;
  description?: string | null;
  createdBy: string;
}

export function createAccount(args: CreateAccountArgs): GlAccount {
  if (!args.number || !args.name)
    throw new GlError("invalid", "number and name are required");
  if (args.parentId) {
    const parent = getAccount(args.tenantId, args.parentId);
    if (!parent) throw new GlError("invalid-parent", "Parent account not found");
    if (parent.isGroup === false)
      throw new GlError("invalid-parent", "Parent must be a group account");
  }
  const id = uuid();
  const now = nowIso();
  try {
    db.prepare(
      `INSERT INTO gl_accounts
         (id, tenant_id, company_id, number, name, account_type, normal_side, currency,
          parent_id, is_group, disabled, description, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
    ).run(
      id,
      args.tenantId,
      args.companyId ?? null,
      args.number,
      args.name,
      args.accountType,
      NORMAL_SIDE[args.accountType],
      args.currency ?? "USD",
      args.parentId ?? null,
      args.isGroup ? 1 : 0,
      args.description ?? null,
      args.createdBy,
      now,
      now,
    );
  } catch (err) {
    if (err instanceof Error && /UNIQUE/.test(err.message)) {
      throw new GlError("duplicate", `Account number "${args.number}" already exists`);
    }
    throw err;
  }
  const r = db.prepare(`SELECT * FROM gl_accounts WHERE id = ?`).get(id) as AcctRow;
  return acctFromRow(r);
}

export function getAccount(tenantId: string, id: string): GlAccount | null {
  const r = db
    .prepare(`SELECT * FROM gl_accounts WHERE id = ? AND tenant_id = ?`)
    .get(id, tenantId) as AcctRow | undefined;
  return r ? acctFromRow(r) : null;
}

export function listAccounts(
  tenantId: string,
  options?: { companyId?: string | null; includeDisabled?: boolean },
): GlAccount[] {
  const cid = options?.companyId ?? null;
  const includeDisabled = options?.includeDisabled === true;
  const rows = db
    .prepare(
      `SELECT * FROM gl_accounts
        WHERE tenant_id = ?
          AND (company_id IS ? OR company_id = ?)
          AND (? = 1 OR disabled = 0)
        ORDER BY number ASC`,
    )
    .all(tenantId, cid, cid, includeDisabled ? 1 : 0) as AcctRow[];
  return rows.map(acctFromRow);
}

export function updateAccount(
  tenantId: string,
  id: string,
  patch: { name?: string; description?: string | null; disabled?: boolean; parentId?: string | null },
): GlAccount | null {
  const existing = getAccount(tenantId, id);
  if (!existing) return null;
  const fields: string[] = [];
  const args: unknown[] = [];
  if (patch.name !== undefined) {
    fields.push("name = ?");
    args.push(patch.name);
  }
  if (patch.description !== undefined) {
    fields.push("description = ?");
    args.push(patch.description);
  }
  if (patch.disabled !== undefined) {
    fields.push("disabled = ?");
    args.push(patch.disabled ? 1 : 0);
  }
  if (patch.parentId !== undefined) {
    if (patch.parentId === id) throw new GlError("invalid", "Account cannot be its own parent");
    fields.push("parent_id = ?");
    args.push(patch.parentId);
  }
  if (fields.length === 0) return existing;
  fields.push("updated_at = ?");
  args.push(nowIso());
  args.push(id);
  db.prepare(`UPDATE gl_accounts SET ${fields.join(", ")} WHERE id = ?`).run(...args);
  return getAccount(tenantId, id);
}

/* ----------------------------- Periods ----------------------------------- */

export function createPeriod(args: {
  tenantId: string;
  companyId?: string | null;
  label: string;
  startDate: string;
  endDate: string;
}): GlPeriod {
  const id = uuid();
  try {
    db.prepare(
      `INSERT INTO gl_periods (id, tenant_id, company_id, label, start_date, end_date, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'open', ?)`,
    ).run(
      id,
      args.tenantId,
      args.companyId ?? null,
      args.label,
      args.startDate,
      args.endDate,
      nowIso(),
    );
  } catch (err) {
    if (err instanceof Error && /UNIQUE/.test(err.message))
      throw new GlError("duplicate", `Period "${args.label}" already exists`);
    throw err;
  }
  const r = db.prepare(`SELECT * FROM gl_periods WHERE id = ?`).get(id) as PeriodRow;
  return periodFromRow(r);
}

export function listPeriods(tenantId: string, companyId?: string | null): GlPeriod[] {
  const cid = companyId ?? null;
  const rows = db
    .prepare(
      `SELECT * FROM gl_periods
        WHERE tenant_id = ? AND (company_id IS ? OR company_id = ?)
        ORDER BY start_date DESC`,
    )
    .all(tenantId, cid, cid) as PeriodRow[];
  return rows.map(periodFromRow);
}

export function closePeriod(args: { tenantId: string; id: string; closedBy: string }): GlPeriod {
  const r = db.prepare(
    `UPDATE gl_periods SET status = 'closed', closed_at = ?, closed_by = ?
       WHERE id = ? AND tenant_id = ? AND status = 'open'`,
  ).run(nowIso(), args.closedBy, args.id, args.tenantId);
  if (r.changes === 0) throw new GlError("not-found", "Period not found or already closed");
  const row = db.prepare(`SELECT * FROM gl_periods WHERE id = ?`).get(args.id) as PeriodRow;
  return periodFromRow(row);
}

export function reopenPeriod(args: { tenantId: string; id: string }): GlPeriod {
  const r = db.prepare(
    `UPDATE gl_periods SET status = 'open', closed_at = NULL, closed_by = NULL
       WHERE id = ? AND tenant_id = ? AND status = 'closed'`,
  ).run(args.id, args.tenantId);
  if (r.changes === 0) throw new GlError("not-found", "Period not found or already open");
  const row = db.prepare(`SELECT * FROM gl_periods WHERE id = ?`).get(args.id) as PeriodRow;
  return periodFromRow(row);
}

function periodForDate(
  tenantId: string,
  companyId: string | null,
  postingDate: string,
): GlPeriod | null {
  const r = db
    .prepare(
      `SELECT * FROM gl_periods
        WHERE tenant_id = ?
          AND (company_id IS ? OR company_id = ?)
          AND start_date <= ?
          AND end_date >= ?
        LIMIT 1`,
    )
    .get(tenantId, companyId, companyId, postingDate, postingDate) as PeriodRow | undefined;
  return r ? periodFromRow(r) : null;
}

/* ----------------------------- Journals ---------------------------------- */

export interface JournalLineInput {
  accountId: string;
  side: Side;
  amountMinor: number;
  partyResource?: string | null;
  partyId?: string | null;
  costCenter?: string | null;
  project?: string | null;
  memo?: string | null;
}

export interface PostJournalArgs {
  tenantId: string;
  companyId?: string | null;
  number: string;
  postingDate: string;          // ISO date
  memo?: string | null;
  sourceResource?: string | null;
  sourceRecordId?: string | null;
  idempotencyKey?: string | null;
  currency?: string;
  lines: JournalLineInput[];
  allowClosedPeriod?: boolean;
  createdBy: string;
}

export function postJournal(args: PostJournalArgs): GlJournal {
  if (!Array.isArray(args.lines) || args.lines.length < 2) {
    throw new GlError("imbalanced", "A journal needs at least 2 lines");
  }

  // Idempotency: short-circuit if we've already posted with this key.
  if (args.idempotencyKey) {
    const existing = db
      .prepare(
        `SELECT * FROM gl_journals WHERE tenant_id = ? AND idempotency_key = ?`,
      )
      .get(args.tenantId, args.idempotencyKey) as JournalRow | undefined;
    if (existing) {
      const entries = (
        db
          .prepare(`SELECT * FROM gl_entries WHERE journal_id = ? ORDER BY created_at ASC`)
          .all(existing.id) as EntryRow[]
      ).map(entryFromRow);
      return journalFromRows(existing, entries);
    }
  }

  const period = periodForDate(args.tenantId, args.companyId ?? null, args.postingDate);
  if (period && period.status === "closed" && !args.allowClosedPeriod) {
    throw new GlError("period-closed", `Posting date ${args.postingDate} falls in a closed period (${period.label})`);
  }

  // Resolve and validate accounts up front.
  const lines = args.lines.map((line, idx) => {
    const account = getAccount(args.tenantId, line.accountId);
    if (!account) throw new GlError("unknown-account", `Line ${idx + 1}: account not found`);
    if (account.isGroup) throw new GlError("group-account", `Line ${idx + 1}: cannot post to group account "${account.name}"`);
    if (account.disabled) throw new GlError("disabled-account", `Line ${idx + 1}: account "${account.name}" is disabled`);
    if (line.amountMinor <= 0)
      throw new GlError("invalid-amount", `Line ${idx + 1}: amount must be > 0`);
    if (line.side !== "debit" && line.side !== "credit")
      throw new GlError("invalid-side", `Line ${idx + 1}: side must be debit or credit`);
    return { input: line, account };
  });

  // Balance check.
  const totalDebit = lines.reduce(
    (n, x) => n + (x.input.side === "debit" ? x.input.amountMinor : 0),
    0,
  );
  const totalCredit = lines.reduce(
    (n, x) => n + (x.input.side === "credit" ? x.input.amountMinor : 0),
    0,
  );
  if (totalDebit !== totalCredit) {
    throw new GlError(
      "imbalanced",
      `Journal does not balance: debits=${totalDebit} credits=${totalCredit}`,
    );
  }

  const journalId = uuid();
  const now = nowIso();
  const currency = args.currency ?? "USD";

  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO gl_journals
         (id, tenant_id, company_id, number, posting_date, memo, source_resource, source_record_id,
          reverses_journal_id, idempotency_key, status, total_debit_minor, total_credit_minor,
          currency, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, 'posted', ?, ?, ?, ?, ?)`,
    ).run(
      journalId,
      args.tenantId,
      args.companyId ?? null,
      args.number,
      args.postingDate,
      args.memo ?? null,
      args.sourceResource ?? null,
      args.sourceRecordId ?? null,
      args.idempotencyKey ?? null,
      totalDebit,
      totalCredit,
      currency,
      args.createdBy,
      now,
    );
    const stmt = db.prepare(
      `INSERT INTO gl_entries
         (id, tenant_id, company_id, journal_id, account_id, side, amount_minor, currency,
          party_resource, party_id, cost_center, project, memo, posting_date, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const { input, account } of lines) {
      const id = uuid();
      stmt.run(
        id,
        args.tenantId,
        args.companyId ?? null,
        journalId,
        account.id,
        input.side,
        input.amountMinor,
        currency,
        input.partyResource ?? null,
        input.partyId ?? null,
        input.costCenter ?? null,
        input.project ?? null,
        input.memo ?? null,
        args.postingDate,
        now,
      );
    }
  });
  try {
    tx();
  } catch (err) {
    if (err instanceof Error && /UNIQUE/.test(err.message) && /idempotency_key/.test(err.message)) {
      // Race: a concurrent caller posted the same idempotency key. Re-fetch.
      if (args.idempotencyKey) {
        const r = db.prepare(
          `SELECT * FROM gl_journals WHERE tenant_id = ? AND idempotency_key = ?`,
        ).get(args.tenantId, args.idempotencyKey) as JournalRow | undefined;
        if (r) {
          const entries = (
            db.prepare(`SELECT * FROM gl_entries WHERE journal_id = ? ORDER BY created_at ASC`)
              .all(r.id) as EntryRow[]
          ).map(entryFromRow);
          return journalFromRows(r, entries);
        }
      }
    }
    if (err instanceof Error && /UNIQUE/.test(err.message))
      throw new GlError("duplicate", `Journal number "${args.number}" already exists`);
    throw err;
  }
  return getJournal(args.tenantId, journalId)!;
}

export function getJournal(tenantId: string, id: string): GlJournal | null {
  const j = db
    .prepare(`SELECT * FROM gl_journals WHERE id = ? AND tenant_id = ?`)
    .get(id, tenantId) as JournalRow | undefined;
  if (!j) return null;
  const entries = (
    db
      .prepare(`SELECT * FROM gl_entries WHERE journal_id = ? ORDER BY created_at ASC`)
      .all(id) as EntryRow[]
  ).map(entryFromRow);
  return journalFromRows(j, entries);
}

export interface ListJournalsArgs {
  tenantId: string;
  companyId?: string | null;
  fromDate?: string;
  toDate?: string;
  sourceResource?: string;
  sourceRecordId?: string;
  limit?: number;
}

export function listJournals(args: ListJournalsArgs): GlJournal[] {
  const cid = args.companyId ?? null;
  const conditions: string[] = ["tenant_id = ?", "(company_id IS ? OR company_id = ?)"];
  const params: unknown[] = [args.tenantId, cid, cid];
  if (args.fromDate) {
    conditions.push("posting_date >= ?");
    params.push(args.fromDate);
  }
  if (args.toDate) {
    conditions.push("posting_date <= ?");
    params.push(args.toDate);
  }
  if (args.sourceResource) {
    conditions.push("source_resource = ?");
    params.push(args.sourceResource);
  }
  if (args.sourceRecordId) {
    conditions.push("source_record_id = ?");
    params.push(args.sourceRecordId);
  }
  const limit = args.limit ?? 200;
  const rows = db
    .prepare(
      `SELECT * FROM gl_journals WHERE ${conditions.join(" AND ")}
         ORDER BY posting_date DESC, created_at DESC LIMIT ?`,
    )
    .all(...params, limit) as JournalRow[];
  return rows.map((j) => {
    const entries = (
      db
        .prepare(`SELECT * FROM gl_entries WHERE journal_id = ? ORDER BY created_at ASC`)
        .all(j.id) as EntryRow[]
    ).map(entryFromRow);
    return journalFromRows(j, entries);
  });
}

export interface ReverseJournalArgs {
  tenantId: string;
  journalId: string;
  reversalNumber: string;
  reversalDate?: string;
  memo?: string;
  allowClosedPeriod?: boolean;
  createdBy: string;
}

export function reverseJournal(args: ReverseJournalArgs): GlJournal {
  const original = getJournal(args.tenantId, args.journalId);
  if (!original) throw new GlError("not-found", "Journal not found");
  const existingReversal = db
    .prepare(
      `SELECT id FROM gl_journals WHERE tenant_id = ? AND reverses_journal_id = ?`,
    )
    .get(args.tenantId, args.journalId) as { id: string } | undefined;
  if (existingReversal) {
    return getJournal(args.tenantId, existingReversal.id)!;
  }
  const reversalDate = args.reversalDate ?? original.postingDate;
  const period = periodForDate(args.tenantId, original.companyId, reversalDate);
  if (period && period.status === "closed" && !args.allowClosedPeriod) {
    throw new GlError("period-closed", "Reversal date falls in a closed period");
  }

  const reversalId = uuid();
  const now = nowIso();
  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO gl_journals
         (id, tenant_id, company_id, number, posting_date, memo, source_resource, source_record_id,
          reverses_journal_id, idempotency_key, status, total_debit_minor, total_credit_minor,
          currency, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 'posted', ?, ?, ?, ?, ?)`,
    ).run(
      reversalId,
      args.tenantId,
      original.companyId,
      args.reversalNumber,
      reversalDate,
      args.memo ?? `Reversal of ${original.number}`,
      original.sourceResource,
      original.sourceRecordId,
      original.id,
      original.totalCreditMinor, // debits and credits swap; totals stay the same numbers
      original.totalDebitMinor,
      original.currency,
      args.createdBy,
      now,
    );
    const stmt = db.prepare(
      `INSERT INTO gl_entries
         (id, tenant_id, company_id, journal_id, account_id, side, amount_minor, currency,
          party_resource, party_id, cost_center, project, memo, posting_date, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const e of original.entries) {
      stmt.run(
        uuid(),
        args.tenantId,
        original.companyId,
        reversalId,
        e.accountId,
        e.side === "debit" ? "credit" : "debit",
        e.amountMinor,
        e.currency,
        e.partyResource,
        e.partyId,
        e.costCenter,
        e.project,
        `Reversal: ${e.memo ?? ""}`.trim(),
        reversalDate,
        now,
      );
    }
  });
  tx();
  return getJournal(args.tenantId, reversalId)!;
}

/* ----------------------------- Reporting --------------------------------- */

export interface AccountBalance {
  accountId: string;
  number: string;
  name: string;
  accountType: AccountType;
  normalSide: Side;
  debitMinor: number;
  creditMinor: number;
  /** balance = debit − credit on debit-normal accounts, opposite on credit-normal. */
  balanceMinor: number;
  currency: string;
}

export interface AccountBalanceFilter {
  tenantId: string;
  companyId?: string | null;
  fromDate?: string;
  toDate?: string;
  accountIds?: string[];
}

export function accountBalances(filter: AccountBalanceFilter): AccountBalance[] {
  const cid = filter.companyId ?? null;
  const conditions: string[] = ["e.tenant_id = ?", "(e.company_id IS ? OR e.company_id = ?)"];
  const params: unknown[] = [filter.tenantId, cid, cid];
  if (filter.fromDate) {
    conditions.push("e.posting_date >= ?");
    params.push(filter.fromDate);
  }
  if (filter.toDate) {
    conditions.push("e.posting_date <= ?");
    params.push(filter.toDate);
  }
  if (filter.accountIds && filter.accountIds.length > 0) {
    conditions.push(
      `e.account_id IN (${filter.accountIds.map(() => "?").join(",")})`,
    );
    params.push(...filter.accountIds);
  }
  const rows = db
    .prepare(
      `SELECT
          a.id          as accountId,
          a.number      as number,
          a.name        as name,
          a.account_type as accountType,
          a.normal_side as normalSide,
          a.currency    as currency,
          SUM(CASE WHEN e.side = 'debit'  THEN e.amount_minor ELSE 0 END) as debitMinor,
          SUM(CASE WHEN e.side = 'credit' THEN e.amount_minor ELSE 0 END) as creditMinor
       FROM gl_entries e
       JOIN gl_accounts a ON a.id = e.account_id
      WHERE ${conditions.join(" AND ")}
      GROUP BY a.id
      ORDER BY a.number ASC`,
    )
    .all(...params) as Array<{
      accountId: string;
      number: string;
      name: string;
      accountType: AccountType;
      normalSide: Side;
      currency: string;
      debitMinor: number | null;
      creditMinor: number | null;
    }>;
  return rows.map((r) => {
    const debit = r.debitMinor ?? 0;
    const credit = r.creditMinor ?? 0;
    const balance = r.normalSide === "debit" ? debit - credit : credit - debit;
    return {
      accountId: r.accountId,
      number: r.number,
      name: r.name,
      accountType: r.accountType,
      normalSide: r.normalSide,
      currency: r.currency,
      debitMinor: debit,
      creditMinor: credit,
      balanceMinor: balance,
    };
  });
}

/** Trial balance: every account with non-zero activity in the range,
 *  plus debit/credit totals. The sum of debit totals must equal the
 *  sum of credit totals — that's the GL invariant; if it ever doesn't,
 *  the engine has a bug or the DB has been tampered with. */
export interface TrialBalance {
  rows: AccountBalance[];
  totalDebitMinor: number;
  totalCreditMinor: number;
  inBalance: boolean;
}

export function trialBalance(filter: AccountBalanceFilter): TrialBalance {
  const balances = accountBalances(filter);
  let totalDebit = 0;
  let totalCredit = 0;
  for (const b of balances) {
    totalDebit += b.debitMinor;
    totalCredit += b.creditMinor;
  }
  return {
    rows: balances,
    totalDebitMinor: totalDebit,
    totalCreditMinor: totalCredit,
    inBalance: totalDebit === totalCredit,
  };
}

/** General ledger detail for one account. */
export interface LedgerLine extends GlEntry {
  accountNumber: string;
  accountName: string;
  /** Running balance after this line, in the account's normal-side direction. */
  runningBalanceMinor: number;
}

export function ledgerForAccount(args: {
  tenantId: string;
  accountId: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
}): LedgerLine[] {
  const account = getAccount(args.tenantId, args.accountId);
  if (!account) throw new GlError("not-found", "Account not found");
  const conditions: string[] = ["e.tenant_id = ?", "e.account_id = ?"];
  const params: unknown[] = [args.tenantId, args.accountId];
  if (args.fromDate) {
    conditions.push("e.posting_date >= ?");
    params.push(args.fromDate);
  }
  if (args.toDate) {
    conditions.push("e.posting_date <= ?");
    params.push(args.toDate);
  }
  const rows = db
    .prepare(
      `SELECT e.*, a.number as accountNumber, a.name as accountName
         FROM gl_entries e
         JOIN gl_accounts a ON a.id = e.account_id
        WHERE ${conditions.join(" AND ")}
        ORDER BY e.posting_date ASC, e.created_at ASC
        LIMIT ?`,
    )
    .all(...params, args.limit ?? 1000) as Array<EntryRow & { accountNumber: string; accountName: string }>;
  let running = 0;
  return rows.map((r) => {
    const entry = entryFromRow(r);
    const delta = entry.side === "debit" ? entry.amountMinor : -entry.amountMinor;
    running += account.normalSide === "debit" ? delta : -delta;
    return {
      ...entry,
      accountNumber: r.accountNumber,
      accountName: r.accountName,
      runningBalanceMinor: running,
    };
  });
}

/** Profit & loss: sum income − expense over a date range. */
export function profitAndLoss(args: AccountBalanceFilter): {
  income: AccountBalance[];
  expense: AccountBalance[];
  totalIncomeMinor: number;
  totalExpenseMinor: number;
  netIncomeMinor: number;
} {
  const all = accountBalances(args);
  const income = all.filter((b) => b.accountType === "income");
  const expense = all.filter((b) => b.accountType === "expense");
  const totalIncome = income.reduce((n, b) => n + b.balanceMinor, 0);
  const totalExpense = expense.reduce((n, b) => n + b.balanceMinor, 0);
  return {
    income,
    expense,
    totalIncomeMinor: totalIncome,
    totalExpenseMinor: totalExpense,
    netIncomeMinor: totalIncome - totalExpense,
  };
}

/** Balance sheet at a single 'as-of' date. */
export function balanceSheet(args: { tenantId: string; companyId?: string | null; asOf: string }): {
  asOf: string;
  assets: AccountBalance[];
  liabilities: AccountBalance[];
  equity: AccountBalance[];
  totalAssetsMinor: number;
  totalLiabilitiesMinor: number;
  totalEquityMinor: number;
  retainedEarningsMinor: number;
  inBalance: boolean;
} {
  const all = accountBalances({
    tenantId: args.tenantId,
    companyId: args.companyId,
    toDate: args.asOf,
  });
  const assets = all.filter((b) => b.accountType === "asset");
  const liabilities = all.filter((b) => b.accountType === "liability");
  const equity = all.filter((b) => b.accountType === "equity");
  const income = all.filter((b) => b.accountType === "income");
  const expense = all.filter((b) => b.accountType === "expense");
  const retainedEarnings =
    income.reduce((n, b) => n + b.balanceMinor, 0) -
    expense.reduce((n, b) => n + b.balanceMinor, 0);
  const totalAssets = assets.reduce((n, b) => n + b.balanceMinor, 0);
  const totalLiabilities = liabilities.reduce((n, b) => n + b.balanceMinor, 0);
  const totalEquity = equity.reduce((n, b) => n + b.balanceMinor, 0) + retainedEarnings;
  return {
    asOf: args.asOf,
    assets,
    liabilities,
    equity,
    totalAssetsMinor: totalAssets,
    totalLiabilitiesMinor: totalLiabilities,
    totalEquityMinor: totalEquity,
    retainedEarningsMinor: retainedEarnings,
    inBalance: totalAssets === totalLiabilities + totalEquity,
  };
}
